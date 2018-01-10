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
var m_appsettings = require('../Master/appsettings');
var m_appstats = require('../Master/appstats');

describe('Master Function o365collector.js Units', function() {
    var private_checkEnableAuditStreams;
    var msSubscriptionsStartStub;
    var updateSettingsStub = null;
    
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
    afterEach(function() {
        if (updateSettingsStub) updateSettingsStub.restore();
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
        it('checks successful OK checkin', function(done) {
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
            var expectedStats = [{"Master":{"invocations":20,"errors":1}}];
            var getAppStatsStub = sinon.stub(m_appstats, 'getAppStats').callsFake(
                function fakeFn(ts, callback) {
                    return callback(null, expectedStats);
            });
            var azcollectSvc = new m_azcollect.Azcollect('api-endpoint', 'creds');
            sinon.stub(azcollectSvc, 'checkin').resolves([{}]);

            m_o365collector.checkin(testMock.context, testMock.timer, azcollectSvc, 
                function(err, resp){
                    if (err) {
                        msSubscriptionsListStub.restore();
                        getAppStatsStub.restore();
                        return done(err);
                    } else {                 
                        sinon.assert.callCount(azcollectSvc.checkin, 1);
                        sinon.assert.calledWith(azcollectSvc.checkin,
                            'o365', process.env.O365_COLLECTOR_ID, 'ok', sinon.match.any, expectedStats);
                        msSubscriptionsListStub.restore();
                        getAppStatsStub.restore();
                        return done();
                    }
            });
        });
        
        it('checks successful OK checkin, stats Error', function(done) {
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
            var statsError = 'Sample stats error';
            var getAppStatsStub = sinon.stub(m_appstats, 'getAppStats').callsFake(
                function fakeFn(ts, callback) {
                    return callback(statsError);
            });
            var azcollectSvc = new m_azcollect.Azcollect('api-endpoint', 'creds');
            sinon.stub(azcollectSvc, 'checkin').resolves([{}]);
            
            var expectedStats = [{error : `Error getting application stats: ${statsError}`}];
            m_o365collector.checkin(testMock.context, testMock.timer, azcollectSvc, 
                function(err, resp){
                    if (err) {
                        msSubscriptionsListStub.restore();
                        getAppStatsStub.restore();
                        return done(err);
                    } else {                 
                        sinon.assert.callCount(azcollectSvc.checkin, 1);
                        sinon.assert.calledWith(azcollectSvc.checkin,
                            'o365', process.env.O365_COLLECTOR_ID, 'ok', sinon.match.any, expectedStats);
                        msSubscriptionsListStub.restore();
                        getAppStatsStub.restore();
                        return done();
                    }
            });
        });
        
                
        it('checks successful Error checkin during Office subscriptionList error', function(done) {
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
            const expectedStats = [{"Master":{"invocations":20,"errors":1}}];
            var getAppStatsStub = sinon.stub(m_appstats, 'getAppStats').callsFake(
                function fakeFn(ts, callback) {
                    return callback(null, expectedStats);
            });
            var azcollectSvc = new m_azcollect.Azcollect('api-endpoint', 'creds');
            sinon.stub(azcollectSvc, 'checkin').resolves([{}]);

            m_o365collector.checkin(testMock.context, testMock.timer, azcollectSvc, 
                function(err, resp){
                    if (err) {
                        msSubscriptionsListStub.restore();
                        getAppStatsStub.restore();
                        return done(err);
                    } else {                 
                        sinon.assert.callCount(azcollectSvc.checkin, 1);
                        sinon.assert.calledWith(azcollectSvc.checkin,
                            'o365', process.env.O365_COLLECTOR_ID, 'error', listError, expectedStats);
                        msSubscriptionsListStub.restore();
                        getAppStatsStub.restore();
                        return done(null);
                    }
            });
        });
        
        it('checks successful Error checkin during Office subscriptionStart error', function(done) {
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
            const expectedStats = [{"Master":{"invocations":20,"errors":1}}];
            var getAppStatsStub = sinon.stub(m_appstats, 'getAppStats').callsFake(
                function fakeFn(ts, callback) {
                    return callback(null, expectedStats);
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
                        getAppStatsStub.restore();
                        return done(err);
                    } else {                 
                        sinon.assert.callCount(azcollectSvc.checkin, 1);
                        sinon.assert.calledWith(azcollectSvc.checkin,
                            'o365', process.env.O365_COLLECTOR_ID, 'error', startError, expectedStats);
                        msSubscriptionsListStub.restore();
                        msSubscriptionsStartErrorStub.restore();
                        getAppStatsStub.restore();
                        return done(null);
                    }
            });
        });
    });
    
    describe('O365 collector register tests', function() {
        it('checks collector and host id are reused if already registered', function(done) {
            process.env.O365_COLLECTOR_ID  = 'existing-collector-id';
            process.env.O365_HOST_ID  = 'existing-collector-id';
            updateSettingsStub = sinon.stub(m_appsettings, 'updateAppsettings').callsFake(
                function fakeFn(settings, callback) {
                    return callback(null, settings);
            });
            var azcollectSvc = new m_azcollect.Azcollect('api-endpoint', 'creds');
            sinon.stub(azcollectSvc, 'register_o365').resolves({
                source : {
                    id : 'new-source-id',
                    host : {
                        id : 'new-host-id'
                    }
                }            
            });

            m_o365collector.checkRegister(testMock.context, testMock.timer, azcollectSvc, 
                function(err, resp){
                    if (err) {
                        return done(err);
                    } else {
                        sinon.assert.callCount(updateSettingsStub, 0);
                        sinon.assert.callCount(azcollectSvc.register_o365, 0);
                        return done();
                    }
            });
        });
        
        it('checks updateSettings is called during registration', function(done) {
            process.env.O365_COLLECTOR_ID = null;
            updateSettingsStub = sinon.stub(m_appsettings, 'updateAppsettings').callsFake(
                function fakeFn(settings, callback) {
                    return callback(null, settings);
            });
            var azcollectSvc = new m_azcollect.Azcollect('api-endpoint', 'creds');
            sinon.stub(azcollectSvc, 'register_o365').resolves({
                source : {
                    id : 'new-source-id',
                    host : {
                        id : 'new-host-id'
                    }
                }            
            });

            m_o365collector.checkRegister(testMock.context, testMock.timer, azcollectSvc, 
                function(err, resp){
                    if (err) {
                        return done(err);
                    } else {
                        var expectedSettings = {
                            O365_COLLECTOR_ID: 'new-source-id',
                            O365_HOST_ID: 'new-host-id'
                        };               
                        sinon.assert.callCount(updateSettingsStub, 1);
                        sinon.assert.calledWith(updateSettingsStub, expectedSettings);
                        return done();
                    }
            });
        });
    });
});
