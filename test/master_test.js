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
    var subscriptionsStartStub;
    
    before(function() {
        private_checkEnableAuditStreams = o365collector.__get__('_checkEnableAuditStreams');
        subscriptionsStartStub = sinon.stub(m_o365mgmnt, 'subscriptionsStart').callsFake(
            function fakeFn(contentType, webhook, callback) {
                return callback(null);
        });
    });
    after(function() {
        subscriptionsStartStub.restore();
    });
            
    describe('_checkEnableAuditStreams()', function() {
        it('checks already enabled streams with proper webhook configs', function(done) {
            process.env.O365_CONTENT_STREAMS = 
                '["Audit.AzureActiveDirectory", "Audit.Exchange", "Audit.SharePoint", "Audit.General"]';
            private_checkEnableAuditStreams(testMock.context, testMock.allEnabledStreams, function(err, streams){
                if (err)
                    return done(err);
                
                assert.equal(4, streams.length);
                assert.equal(0, subscriptionsStartStub.callCount);
                done();
            });
        });
        
        it('checks subscriptionStart is called for already enabled webhooks if web app is being reinstalled', function(done) {
            process.env.O365_CONTENT_STREAMS = 
                '["Audit.AzureActiveDirectory", "Audit.Exchange", "Audit.SharePoint", "Audit.General"]';
            private_checkEnableAuditStreams(testMock.context, testMock.oneOldEnabledStream, function(err, streams){
                if (err)
                    return done(err);
                
                assert.equal(1, subscriptionsStartStub.callCount);
                done();
            });
        });
    });
});
