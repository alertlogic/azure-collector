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

var m_appstats = rewire('../Master/appstats');
var azureStorage = require('azure-storage');

describe('Master Function appstats.js Units', function() {
    
    before(function() {
    });
    after(function() {
    });
    beforeEach(function() {
        m_appstats.__set__({g_tableService : null});
    });
    afterEach(function() {
    });
            
    describe('Azure web application statistics tests', function() {
        it('checks getAppStats() empty', function(done) {
            var msTableServiceStub = sinon.stub(azureStorage, 'createTableService').callsFake(
                function fakeFn(account, key, host) {
                    var mockObj = {
                        queryEntities : function(table, query, token, callback){
                            return callback(null, {entries : []});
                        }
                    };
                    return mockObj;
                }
            );
            var expectedStats = [ 
                { Master: { invocations: 0, errors: 0 } },
                { O365WebHook: { invocations: 0, errors: 0 } },
                { Updater: { invocations: 0, errors: 0 } }
            ];
            
            m_appstats.getAppStats('2017-12-22T14:31:39', function(err, stats) {
                msTableServiceStub.restore();
                assert.deepEqual(expectedStats, stats);
                done();
            });
        });
        
        it('checks getAppStats() success', function(done) {
            var msTableServiceStub = sinon.stub(azureStorage, 'createTableService').callsFake(
                function fakeFn(account, key, host) {
                    var mockObj = {
                        queryEntities : function(table, query, token, callback) {
                            if (query == 'Master')
                                return callback(null, testMock.masterAuditLogs);
                            if (query == 'O365WebHook')
                                return callback(null, testMock.o365webhookAuditLogs);
                            if (query == 'Updater')
                                return callback(null, testMock.updaterAuditLogs);
                            return callback(null, {entries : []});                                
                        }
                    };
                    return mockObj;
                }
            );
            rewireGetInvocationsQuery = m_appstats.__set__(
                {
                    getInvocationsQuery: function(functionName, ts) { 
                        return functionName;
                    }
                }
            );
            var expectedStats = [ 
                { Master: { invocations: 3, errors: 2 } },
                { O365WebHook: { invocations: 3, errors: 1 } },
                { Updater: { invocations: 2, errors: 1 } }
            ];
            
            m_appstats.getAppStats('2017-12-22T14:31:39', function(err, stats) {
                msTableServiceStub.restore();
                assert.deepEqual(expectedStats, stats);
                done();
            });
        });
        
        it('checks getAppStats() errors', function(done) {
            var msTableServiceStub = sinon.stub(azureStorage, 'createTableService').callsFake(
                function fakeFn(account, key, host) {
                    var mockObj = {
                        queryEntities : function(table, query, token, callback){
                            return callback('Error: getaddrinfo ENOTFOUND test.table.core.windows.net test.table.core.windows.net:443');
                        }
                    };
                    return mockObj;
                }
            );
            var expectedErrorStats = [
                {"Master":{"error":"Error getting stats Error: getaddrinfo ENOTFOUND test.table.core.windows.net test.table.core.windows.net:443"}},
                {"O365WebHook":{"error":"Error getting stats Error: getaddrinfo ENOTFOUND test.table.core.windows.net test.table.core.windows.net:443"}},
                {"Updater":{"error":"Error getting stats Error: getaddrinfo ENOTFOUND test.table.core.windows.net test.table.core.windows.net:443"}}
            ];
            
            m_appstats.getAppStats('2017-12-22T14:31:40', function(err, stats) {
                azureStorage.createTableService.restore();
                msTableServiceStub.restore();
                assert.deepEqual(expectedErrorStats, stats);
                
                done();
            });
        });
        
    });
});
