/* -----------------------------------------------------------------------------
 * @copyright (C) 2018, Alert Logic, Inc
 * @doc
 * 
 * Unit tests for O365WebHook function
 * 
 * @end
 * -----------------------------------------------------------------------------
 */
 
var assert = require('assert');
var rewire = require('rewire');
var sinon = require('sinon');

var testMock = require('./mock');
var m_o365mgmnt = require('../lib/o365_mgmnt');
var m_o365content = rewire('../O365WebHook/o365content');
const AlAzureCollector = require('@alertlogic/al-azure-collector-js').AlAzureCollector;
describe('O365WebHook Function o365content.js units.', function() {
    var clock;

    before(function() {
        clock = sinon.useFakeTimers();
    });
    after(function() {
        clock.restore();
    });
            
    describe('processNotifications()', function() {
        it('batch content is successfully fetched', function(done) {
            process.env.O365_COLLECTOR_ID = 'o365-collector-id';
            var msGetContentStub = sinon.stub(m_o365mgmnt, 'getContent');
            msGetContentStub.callsFake(
                function fakeFn(contentUri, callback) {
                    return callback(null, testMock.o365Content);
            });

            const azureCollectorProcessLogs = sinon.stub(AlAzureCollector.prototype, 'processLog');
            azureCollectorProcessLogs.callsFake((slice, parseFun, config, callback) => {
                callback(null, {skipped:0, processed: slice.length});
            });
            
            m_o365content.processNotifications(testMock.context, testMock.webhookNotifications,
                function(err) {
                    if (err)
                        return done(err);
                    
                    sinon.assert.callCount(msGetContentStub, 2);
                    msGetContentStub.restore();
                    done();
            });
        });
        
        it('content fetch error', function(done) {
            process.env.O365_COLLECTOR_ID = 'o365-collector-id';
            const expectedError = 'Fetch error';
            var msGetContentStub = sinon.stub(m_o365mgmnt, 'getContent');
            msGetContentStub.callsFake(
                function fakeFn(contentUri, callback) {
                    return callback(expectedError);
            });
            m_o365content.processNotifications(testMock.context, testMock.webhookNotifications,
                function(err) {
                    sinon.assert.callCount(msGetContentStub, 1);
                    assert.equal(err, expectedError);
                    msGetContentStub.restore();
                    done();
            });
        });
        
        it('get content slices', function(done) {
            var private_getSliceIndexes = m_o365content.__get__('getSliceIndexes');
            var private_MAX_BATCH_MESSAGES = m_o365content.__get__('MAX_BATCH_MESSAGES');
            var actual = private_getSliceIndexes(1);
            assert.deepEqual(actual, [{start : 0, end : private_MAX_BATCH_MESSAGES}]);
            
            actual = private_getSliceIndexes(private_MAX_BATCH_MESSAGES);
            assert.deepEqual(actual, [{start : 0, end : private_MAX_BATCH_MESSAGES}]);
            
            actual = private_getSliceIndexes(private_MAX_BATCH_MESSAGES + 1);
            assert.deepEqual(actual, [{start : 0, end : private_MAX_BATCH_MESSAGES},
                                      {start : private_MAX_BATCH_MESSAGES, end : 2 * private_MAX_BATCH_MESSAGES}]);
            
            actual = private_getSliceIndexes(2 * private_MAX_BATCH_MESSAGES);
            assert.deepEqual(actual, [{start : 0, end : private_MAX_BATCH_MESSAGES},
                                      {start : private_MAX_BATCH_MESSAGES, end : 2 * private_MAX_BATCH_MESSAGES}]);
            
            actual = private_getSliceIndexes(2 * private_MAX_BATCH_MESSAGES + 1);
            assert.deepEqual(actual, [{start : 0, end : private_MAX_BATCH_MESSAGES},
                                      {start : private_MAX_BATCH_MESSAGES, end : 2 * private_MAX_BATCH_MESSAGES},
                                      {start : 2 * private_MAX_BATCH_MESSAGES, end : 3 * private_MAX_BATCH_MESSAGES}]);
                                      
            done();
        });
        
    });
});
