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
var sinon = require('sinon');

var testMock = require('./mock');

var m_endpoints = require('../Master/endpoints');
var m_appsettings = require('../Master/appsettings');

describe('Master Function endpoints.js Units', function() {
    var updateSettingsStub = null;
    var endpointsStub = null;
    
    before(function() {
        var residency = process.env.CUSTOMCONNSTR_APP_AL_RESIDENCY;
    
        updateSettingsStub = sinon.stub(m_appsettings, 'updateAppsettings').callsFake(
            function fakeFn(settings, callback) {
                return callback(null, settings);
        });
        endpointsStub = sinon.stub(m_endpoints.Endpoints.prototype, 'getEndpoint');
        endpointsStub.withArgs('ingest', residency).resolves({
            ingest : 'new-ingest-endpoint'
        });
        endpointsStub.withArgs('azcollect', residency).resolves({
            azcollect : 'new-azcollect-endpoint'
        });
    });
    after(function() {
        if (updateSettingsStub) updateSettingsStub.restore();
        if (endpointsStub) endpointsStub.restore();
    });
    beforeEach(function() {
        if (updateSettingsStub) updateSettingsStub.resetHistory();
        if (endpointsStub) endpointsStub.resetHistory();
    });
            
    describe('AL endpoints retrieval tests', function() {
        it('checks endpoints values are reused if already fetched', function(done) {
            process.env.APP_INGEST_ENDPOINT  = 'existing-ingest-endpoint';
            process.env.APP_AZCOLLECT_ENDPOINT  = 'existing-azcollect-endpoint';
            m_endpoints.checkUpdate(testMock.context, testMock.timer, 
                function(err){
                    if (err) {
                        return done(err);
                    } else {
                        sinon.assert.callCount(endpointsStub, 0);
                        sinon.assert.callCount(updateSettingsStub, 0);
                        return done();
                    }
            });
        });
        
        it('checks endpoints values are saved as app settings', function(done) {
            process.env.APP_INGEST_ENDPOINT = null;
            process.env.APP_AZCOLLECT_ENDPOINT = null;
            var residency = process.env.CUSTOMCONNSTR_APP_AL_RESIDENCY;
            
            m_endpoints.checkUpdate(testMock.context, testMock.timer, 
                function(err){
                    if (err) {
                        return done(err);
                    } else {
                        var expectedSettings = {
                            APP_INGEST_ENDPOINT : 'new-ingest-endpoint',
                            APP_AZCOLLECT_ENDPOINT : 'new-azcollect-endpoint'
                        };
                        sinon.assert.callCount(endpointsStub, 2);
                        sinon.assert.calledWith(endpointsStub, 'ingest', residency);
                        sinon.assert.calledWith(endpointsStub, 'azcollect', residency);
                        sinon.assert.callCount(updateSettingsStub, 1);
                        sinon.assert.calledWith(updateSettingsStub, expectedSettings);
                        return done();
                    }
            });
        });
    });
});
