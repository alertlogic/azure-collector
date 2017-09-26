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

var m_azcollect = require('../Master/azcollect');
var m_o365collector = rewire('../Master/o365collector');

describe('Master Function Units', function() {
    var private_checkEnableAuditStreams;
    var msSubscriptionsStartStub;
    
    before(function() {
        private_checkEnableAuditStreams = m_o365collector.__get__('_checkEnableAuditStreams');
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

    describe('O365 collector checkin tests', function() {
        it('checks successfull OK checkin', function(done) {
            process.env.O365_CONTENT_STREAMS = 
                '["Audit.AzureActiveDirectory", "Audit.General"]';
            var enabledStreams = [
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
            var msSubscriptionsListStub = sinon.stub(m_o365mgmnt, 'subscriptionsList').callsFake(
                function fakeFn(callback) {
                    return callback(null, enabledStreams, null, null);
            });
            var azcollectSvc = new m_azcollect.Azcollect('api-endpoint', 'creds');
            sinon.stub(azcollectSvc, 'checkin').resolves([{}]);

            m_o365collector.checkin(testMock.context, testMock.timer, azcollectSvc, 
                function(err, resp){
                    if (err) {
                        msSubscriptionsListStub.restore();
                        return done(err);
                    } else {                 
                        sinon.assert.callCount(azcollectSvc.checkin, 1);
                        sinon.assert.calledWith(azcollectSvc.checkin,
                            'o365', process.env.O365_COLLECTOR_ID, 'ok');
                        msSubscriptionsListStub.restore();
                        return done();
                    }
            });
        });
                
        it('checks successfull Error checkin during Office subscriptionList error', function(done) {
            process.env.O365_CONTENT_STREAMS = 
                '["Audit.AzureActiveDirectory", "Audit.General"]';
            var enabledStreams = [
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
            var listError = 'Office subscriptionList error';
            var msSubscriptionsListStub = sinon.stub(m_o365mgmnt, 'subscriptionsList').callsFake(
                function fakeFn(callback) {
                    return callback(listError);
            });
            var azcollectSvc = new m_azcollect.Azcollect('api-endpoint', 'creds');
            sinon.stub(azcollectSvc, 'checkin').resolves([{}]);

            m_o365collector.checkin(testMock.context, testMock.timer, azcollectSvc, 
                function(err, resp){
                    if (err) {
                        msSubscriptionsListStub.restore();
                        return done(err);
                    } else {                 
                        sinon.assert.callCount(azcollectSvc.checkin, 1);
                        sinon.assert.calledWith(azcollectSvc.checkin,
                            'o365', process.env.O365_COLLECTOR_ID, 'error', listError);
                        msSubscriptionsListStub.restore();
                        return done(null);
                    }
            });
        });
        
        it('checks successfull Error checkin during Office subscriptionStart error', function(done) {
            process.env.O365_CONTENT_STREAMS = 
                '["Audit.AzureActiveDirectory", "Audit.General"]';
            var enabledStreams = [
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
            var startError = 'Office subscriptionStart error';
            var msSubscriptionsListStub = sinon.stub(m_o365mgmnt, 'subscriptionsList').callsFake(
                function fakeFn(callback) {
                    return callback(null, enabledStreams, null, null);
            });
            msSubscriptionsStartStub.restore();
            var msSubscriptionsStartErrorStub = sinon.stub(m_o365mgmnt, 'subscriptionsStart').callsFake(
            function fakeFn(contentType, webhook, callback) {
                return callback(startError);
            });
            var azcollectSvc = new m_azcollect.Azcollect('api-endpoint', 'creds');
            sinon.stub(azcollectSvc, 'checkin').resolves([{}]);

            m_o365collector.checkin(testMock.context, testMock.timer, azcollectSvc, 
                function(err, resp){
                    if (err) {
                        msSubscriptionsListStub.restore();
                        msSubscriptionsStartErrorStub.restore();
                        return done(err);
                    } else {                 
                        sinon.assert.callCount(azcollectSvc.checkin, 1);
                        sinon.assert.calledWith(azcollectSvc.checkin,
                            'o365', process.env.O365_COLLECTOR_ID, 'error', startError);
                        msSubscriptionsListStub.restore();
                        msSubscriptionsStartErrorStub.restore();
                        return done(null);
                    }
            });
        });

    });
});
