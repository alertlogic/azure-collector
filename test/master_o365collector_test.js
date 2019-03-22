/* -----------------------------------------------------------------------------
 * @copyright (C) 2019, Alert Logic, Inc
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

var healthchecks = rewire('../Master/healthchecks');

describe('O365 healthcheck tests', function() {
    var private_checkEnableAuditStreams;
    var msSubscriptionsStartStub;
    var stubErrorFmt;
    var updateSettingsStub = null;
    
    before(function() {
        private_checkEnableAuditStreams = healthchecks.__get__('_checkEnableAuditStreams');
        msSubscriptionsStartStub = sinon.stub(m_o365mgmnt, 'subscriptionsStart').callsFake(
            function fakeFn(contentType, webhook, callback) {
                if(contentType === "Audit.SomeGarbage"){
                    return callback('stream not found');
                } else{
                    return callback(null);
                }
            });
        stubErrorFmt = sinon.stub(testMock.context, 'errorStatusFmt');
    });
    after(function() {
        msSubscriptionsStartStub.restore();
        stubErrorFmt.restore();
    });
    beforeEach(function() {
        msSubscriptionsStartStub.resetHistory();
        stubErrorFmt.resetHistory();
    });
    afterEach(function() {
        if (updateSettingsStub) updateSettingsStub.restore();
    });
            
    describe('checkStreams', function(done){
        it('should throw the apprirpiate error when the subscriptionsList returns and error', function(){
            healthchecks.checkStreams(testMock.context, function(err, result){
                sinon.assert.calledWith(stubErrorFmt, 'O365000002');
                done();
            });
        });
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
                return done();
            });
        });

        it('throws the correct error when an invalid stream is passed in', function(done) {
            process.env.O365_CONTENT_STREAMS = 
                '["Audit.AzureActiveDirectory", "Audit.Exchange", "Audit.General", "Audit.SomeGarbage"]';
            private_checkEnableAuditStreams(testMock.context, [], function(err, streams){
                if (err)
                    return done(err);

                sinon.assert.callCount(msSubscriptionsStartStub, 4);
                sinon.assert.calledWith(msSubscriptionsStartStub, "Audit.AzureActiveDirectory");
                sinon.assert.calledWith(msSubscriptionsStartStub, "Audit.Exchange");
                sinon.assert.calledWith(msSubscriptionsStartStub, "Audit.General");
                sinon.assert.calledWith(stubErrorFmt,'O365000001');
                return done();
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
                return done();
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
                return done();
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
                return done();
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
                return done();
            });
        });
    });

});
