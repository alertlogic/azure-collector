/* -----------------------------------------------------------------------------
 * @copyright (C) 2017, Alert Logic, Inc
 * @doc
 * 
 * Unit tests for Master function
 * 
 * @end
 * -----------------------------------------------------------------------------
 */

var testMock = require('./mock');
 
var assert = require('assert');
var rewire = require('rewire');
var sinon = require('sinon');

var m_appsettings = rewire('../Master/appsettings');

describe('Master Function appsettings.js Units', function() {
    var private_appAdCreds;
    var private_websiteClient;
    var msListApplicationSettingsStub;
    var msUpdateApplicationSettingsStub;
    
    before(function() {
        private_appAdCreds = m_appsettings.__get__('g_appAdCreds');
        private_websiteClient = m_appsettings.__get__('g_websiteClient');
        
        retrieveTokenFromCacheStub = sinon.stub(private_appAdCreds, '_retrieveTokenFromCache').callsFake(
            function fakeFn(callback) {
                var mockToken = {
                    'tokenType' : 'Bearer',
                    'expiresIn' : 3599,
                    'expiresOn': '2017-09-26T11:34:40.703Z',
                    'resource' : 'https://management.azure.com',
                    'accessToken' :  'some-token',
                    'isMRRT' : true,
                    '_clientId' : process.env.CUSTOMCONNSTR_APP_CLIENT_ID,
                    '_authority' :' https://login.microsoftonline.com/' + process.env.APP_TENANT_ID 
                };
                return callback(null, mockToken);
        });
        msListApplicationSettingsStub = sinon.stub(private_websiteClient.webApps, 'listApplicationSettings').callsFake(
            function fakeFn(rgName, name, options, callback) {
                var mockSettings = {
                    properties : {
                        MOCK_SETTING : 'mock-value'
                    }
                };
                return callback(null, mockSettings, null, null);
        });
        msUpdateApplicationSettingsStub = sinon.stub(private_websiteClient.webApps, 'updateApplicationSettings').callsFake(
            function fakeFn(rgName, name, settings, options, callback) {
                return callback(null, null, null, null);
        });
    });
    after(function() {
        msListApplicationSettingsStub.restore();
        msUpdateApplicationSettingsStub.restore();
        retrieveTokenFromCacheStub.restore();
    });
    beforeEach(function() {
        msListApplicationSettingsStub.resetHistory();
        msUpdateApplicationSettingsStub.resetHistory();
    });
            
    describe('Azure web application setting tests', function() {
        it('checks getAppsettings()', function(done) {
            m_appsettings.getAppsettings(function(err, settings){
                if (err)
                    return done(err);
                
                sinon.assert.callCount(msListApplicationSettingsStub, 1);
                done();
            });
        });
        
        it('checks setAppsettings()', function(done) {
            var testSettings = {
                test : 'test'
            };
            m_appsettings.setAppsettings(testSettings, function(err, settings) {
                if (err)
                    return done(err);
                
                sinon.assert.callCount(msUpdateApplicationSettingsStub, 1);
                done();
            });
        });
        
        it('checks updateAppsettings()', function(done) {
            var testSettings = {
                test : 'test'
            };
            m_appsettings.updateAppsettings(testSettings, function(err, settings) {
                if (err)
                    return done(err);
                
                var expectedSettings = {
                    properties : {
                        MOCK_SETTING : 'mock-value',
                        test : 'test'
                    }
                };
                sinon.assert.callCount(msListApplicationSettingsStub, 1);
                sinon.assert.callCount(msUpdateApplicationSettingsStub, 1);
                sinon.assert.calledWith(msUpdateApplicationSettingsStub, 
                    process.env.APP_RESOURCE_GROUP,
                    process.env.WEBSITE_SITE_NAME,
                    expectedSettings,
                    null);
                done();
            });
        });
    });
});
