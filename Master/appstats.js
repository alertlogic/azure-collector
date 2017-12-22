/* -----------------------------------------------------------------------------
 * @copyright (C) 2017, Alert Logic, Inc
 * @doc
 * 
 * The module for getting storage account settings.
 * 
 * @end
 * -----------------------------------------------------------------------------
 */

const async = require('async');
const util = require('util');
const moment = require('moment');

const m_alUtil = require('../lib/al_util');

const STATS_PERIOD_MINUTES = 15;
const APP_FUNCTIONS = ['Master', 'O365WebHook', 'Updater'];

var azureStorage = require('azure-storage');
var TableQuery = azureStorage.TableQuery;
var TableUtilities = azureStorage.TableUtilities;
var TableService = null;

// For "AccountName=teststorageaccount" returns 
// {
//      "AccountName": "teststorageaccount"
// }
var assignmentToObj = function(assignString) {
    const splitIndex = assignString.indexOf('=');
    const key = assignString.slice(0, splitIndex);
    const value = assignString.slice(splitIndex + 1);
    var obj = {};
    
    obj[key] = value;
    return obj;
};

// For "AccountName=teststorageaccount;AccountKey=key" returns 
// {
//      "AccountName": "teststorageaccount",
//      "AccountKey": "key"
// }
var assignStringToJson = function(assignString) {
    const params = assignString.split(';');
    return params.reduce(function(acc, current) {
            return Object.assign(acc, assignmentToObj(current));
        },{});
};

var getTableService = function() {
    if (!TableService) {
        const storageParams = assignStringToJson(process.env.AzureWebJobsStorage);
        TableService = azureStorage.createTableService(
            storageParams.AccountName, 
            storageParams.AccountKey, 
            storageParams.AccountName + '.table.core.windows.net');
    }
    return TableService;
};

var getLogTableName = function() {
    return 'AzureWebJobsHostLogs' + moment.utc().format('YYYYMM');
};

var getInvocationsQuery = function(functionName, timestamp) {
    var functionFilter = TableQuery.stringFilter(
        'FunctionName',
        TableUtilities.QueryComparisons.EQUAL,
        functionName);
    var dateFilter = TableQuery.dateFilter(
        'StartTime',
        TableUtilities.QueryComparisons.GREATER_THAN_OR_EQUAL,
        new Date(moment(timestamp).utc().subtract(STATS_PERIOD_MINUTES, 'minutes')));
    var whereFilter = TableQuery.combineFilters(
        dateFilter,
        TableUtilities.TableOperators.AND,
        functionFilter);
        
    return new TableQuery().where(whereFilter);
};

var _getInvocationStats = function(entities, accStats) {
    accStats.invocations += entities.length;
    
    return entities.reduce(function(acc, current) {
        if (current.ErrorDetails) {
            acc.errors += 1;
        }
        return acc;
    },
    accStats);
};

var _getFunctionStats = function(functionName, timestamp, callback) {
    var accStats = {
        invocations : 0,
        errors : 0
    };
    return _getFunctionStatsAcc(functionName, timestamp, null, accStats, callback);
};

var _getFunctionStatsAcc = function(functionName, timestamp, contToken, accStats, callback) {
    var tableService = getTableService();
    var obj = {};
    
    tableService.queryEntities(
        getLogTableName(), 
        getInvocationsQuery(functionName, timestamp),
        contToken,
        function(error, result) {
            if (error) {
                obj[functionName] = {
                    error : `Error getting stats ${error}`
                };
                return callback(null, obj);
            } else {
                if (result.continuationToken) {
                    return _getFunctionStatsAcc(
                        functionName,
                        timestamp,
                        result.continuationToken,
                        _getInvocationStats(result.entries, accStats),
                        callback);
                } else {
                    obj[functionName] = _getInvocationStats(result.entries, accStats);
                    return callback(null, obj);
                }
            }
        });
};

// Returns application stats for the last 15 mins starting from provided 'timestamp'.
// Stats include: function invocations total and invocation error count.
// Returns:  
//   [{"Master":
//      {"invocations":2,"errors":0}
//    },
//    {"O365WebHook":
//        {"invocations":10,"errors":1}
//    },
//    {"Updater":
//        {"invocations":0,"errors":0}
//    }]

var _getAppStats = function(timestamp, callback) {
    async.map(APP_FUNCTIONS,
        function(fname, mapCallback){
            _getFunctionStats(fname, timestamp, mapCallback); 
        },
        function (mapErr, mapsResult) {
            if (mapErr) {
                return callback(mapErr);
            } else {
                return callback(null, mapsResult);
            }
        });
};

module.exports = {
    getFunctionStats : _getFunctionStats,
    getAppStats : _getAppStats
};
