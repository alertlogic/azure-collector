/* -----------------------------------------------------------------------------
 * @copyright (C) 2017, Alert Logic, Inc
 * @doc
 * 
 * Unit tests for Master function
 * 
 * @end
 * -----------------------------------------------------------------------------
 */
 
var assert = require('assert');
var rewire = require('rewire');
var sinon = require('sinon');

var testMock = require('./mock');
var m_o365mgmnt = require('../lib/o365_mgmnt');

var o365collector = rewire('../Master/o365collector');

describe('Master Function Units', function() {
    var private_checkEnableAuditStreams;
    var msSubscriptionsStartStub;
    
    before(function() {
        private_checkEnableAuditStreams = o365collector.__get__('_checkEnableAuditStreams');
        msSubscriptionsStartStub = sinon.stub(m_o365mgmnt, 'subscriptionsStart').callsFake(
            function fakeFn(contentType, webhook, callback) {
                return callback(null);
        });
    });
    after(function() {
        msSubscriptionsStartStub.restore();
    });
    beforeEach(function() {
        msSubscriptionsStartStub.resetHistory();
    });
            
    describe('_checkEnableAuditStreams()', function() {
        it('enables configured streams', function(done) {
            process.env.O365_CONTENT_STREAMS = 
                '["Audit.AzureActiveDirectory", "Audit.Exchange", "Audit.General"]';
            private_checkEnableAuditStreams(testMock.context, [], function(err, streams){
                if (err)
                    return done(err);
                
                sinon.assert.callCount(msSubscriptionsStartStub, 3);
                sinon.assert.calledWith(msSubscriptionsStartStub, "Audit.AzureActiveDirectory");
                sinon.assert.calledWith(msSubscriptionsStartStub, "Audit.Exchange");
                sinon.assert.calledWith(msSubscriptionsStartStub, "Audit.General");
                done();
            });
        });
        
        it('checks already enabled streams with proper webhook configs', function(done) {
            process.env.O365_CONTENT_STREAMS = 
                '["Audit.AzureActiveDirectory", "Audit.Exchange", "Audit.SharePoint", "Audit.General"]';
            private_checkEnableAuditStreams(testMock.context, testMock.allEnabledStreams, function(err, streams){
                if (err)
                    return done(err);
                
                assert.equal(4, streams.length);
                sinon.assert.callCount(msSubscriptionsStartStub, 0);
                done();
            });
        });
        
        it('checks subscriptionStart is called for already enabled webhooks if web app is being reinstalled', function(done) {
            process.env.O365_CONTENT_STREAMS = 
                '["Audit.AzureActiveDirectory", "Audit.Exchange", "Audit.SharePoint", "Audit.General"]';
            var twoOldEnabledStreams = [
              {
                "contentType": "Audit.AzureActiveDirectory",
                "status": "enabled",
                "webhook": {
                  "authId": null,
                  "address": "https://old-app.azurewebsites.net/api/o365/webhook",
                  "expiration": "",
                  "status": "enabled"
                }
              },
              {
                "contentType": "Audit.Exchange",
                "status": "enabled",
                "webhook": {
                  "authId": null,
                  "address": "https://old-app-o365.azurewebsites.net/api/o365/webhook",
                  "expiration": "",
                  "status": "enabled"
                }
              },
              {
                "contentType": "Audit.General",
                "status": "enabled",
                "webhook": {
                  "authId": null,
                  "address": "https://kkuzmin-app-o365.azurewebsites.net/api/o365/webhook",
                  "expiration": "",
                  "status": "enabled"
                }
              },
              {
                "contentType": "Audit.SharePoint",
                "status": "enabled",
                "webhook": {
                  "authId": null,
                  "address": "https://kkuzmin-app-o365.azurewebsites.net/api/o365/webhook",
                  "expiration": "",
                  "status": "enabled"
                }
              }
            ];
            private_checkEnableAuditStreams(testMock.context, twoOldEnabledStreams, function(err, streams){
                if (err)
                    return done(err);
                
                sinon.assert.callCount(msSubscriptionsStartStub, 2);
                sinon.assert.calledWith(msSubscriptionsStartStub, "Audit.AzureActiveDirectory");
                sinon.assert.calledWith(msSubscriptionsStartStub, "Audit.Exchange"); 
                done();
            });
        });
        
        it('checks subscriptionStart is called for disabled streams', function(done) {
            process.env.O365_CONTENT_STREAMS = 
                '["Audit.AzureActiveDirectory", "Audit.General"]';
            var disabledStreams = [
                {
                    "contentType": "Audit.AzureActiveDirectory",
                    "status": "disabled",
                    "webhook": {
                        "authId": null,
                        "address": "https://kkuzmin-app-o365.azurewebsites.net/api/o365/webhook",
                        "expiration": "",
                        "status": "enabled"
                    }
                },
                {
                    "contentType": "Audit.General",
                    "status": "enabled",
                    "webhook": {
                        "authId": null,
                        "address": "https://kkuzmin-app-o365.azurewebsites.net/api/o365/webhook",
                        "expiration": "",
                        "status": "enabled"
                    }
                }
           ];
            private_checkEnableAuditStreams(testMock.context, disabledStreams, function(err, streams){
                if (err)
                    return done(err);
                
                sinon.assert.callCount(msSubscriptionsStartStub, 1);
                sinon.assert.calledWith(msSubscriptionsStartStub, "Audit.AzureActiveDirectory");
                done();
            });
        });
        
        it('checks subscriptionStart is called for disabled webhooks', function(done) {
            process.env.O365_CONTENT_STREAMS = 
                '["Audit.AzureActiveDirectory", "Audit.General"]';
            var disabledStreams = [
                {
                    "contentType": "Audit.AzureActiveDirectory",
                    "status": "enabled",
                    "webhook": {
                        "authId": null,
                        "address": "https://kkuzmin-app-o365.azurewebsites.net/api/o365/webhook",
                        "expiration": "",
                        "status": "enabled"
                    }
                },
                {
                    "contentType": "Audit.General",
                    "status": "enabled",
                    "webhook": {
                        "authId": null,
                        "address": "https://kkuzmin-app-o365.azurewebsites.net/api/o365/webhook",
                        "expiration": "",
                        "status": "disabled"
                    }
                }
           ];
            private_checkEnableAuditStreams(testMock.context, disabledStreams, function(err, streams){
                if (err)
                    return done(err);
                
                sinon.assert.callCount(msSubscriptionsStartStub, 1);
                sinon.assert.calledWith(msSubscriptionsStartStub, "Audit.General");
                done();
            });
        });

        it('checks successfull OK checkin', function(done) {
            process.env.O365_CONTENT_STREAMS = 
                '["Audit.AzureActiveDirectory", "Audit.General"]';
            var disabledStreams = [
                {
                    "contentType": "Audit.AzureActiveDirectory",
                    "status": "enabled",
                    "webhook": {
                        "authId": null,
                        "address": "https://kkuzmin-app-o365.azurewebsites.net/api/o365/webhook",
                        "expiration": "",
                        "status": "enabled"
                    }
                },
                {
                    "contentType": "Audit.General",
                    "status": "enabled",
                    "webhook": {
                        "authId": null,
                        "address": "https://kkuzmin-app-o365.azurewebsites.net/api/o365/webhook",
                        "expiration": "",
                        "status": "disabled"
                    }
                }
           ];
            private_checkEnableAuditStreams(testMock.context, disabledStreams, function(err, streams){
                if (err)
                    return done(err);
                
                sinon.assert.callCount(msSubscriptionsStartStub, 1);
                sinon.assert.calledWith(msSubscriptionsStartStub, "Audit.General");
                done();
            });
        });
                
    });
});
