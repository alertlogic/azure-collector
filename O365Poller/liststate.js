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
const parse = require('parse-key-value');

const m_alUtil = require('../lib/al_util');

var azureStorage = require('azure-storage');
var base64Encoder = new azureStorage.QueueMessageEncoder.TextBase64QueueMessageEncoder();
var QueueService = null;

var _getStateQueueName = function() {
    return 'alertlogic-o365-list';
};

var _initQueueService = function() {
    const storageParams = parse(process.env.AzureWebJobsStorage);
    QueueService = azureStorage.createQueueService(
        storageParams.AccountName, 
        storageParams.AccountKey, 
        storageParams.AccountName + '.queue.core.windows.net');
    return QueueService;
};

var _getQueueService = function() {
    return (QueueService) ? QueueService : _initQueueService();
};

var _fetch = function(timer, callback) {
    var queueService = _getQueueService();
    
    queueService.getMessage(_getStateQueueName(),
        function(error, message) {
            if (error || !message) {
                // Another instance of a function is running.
                return callback(`Singleton protection $error`);
            } else {
                const decoded = base64Encoder.decode(message.messageText);
                var storedState = JSON.parse(decoded);
                var state = {
                    listStartTs : moment.utc(storedState.lastCollectedTs).add(1, 'milliseconds').toISOString(),
                    listEndTs :  timer.last
                };
                return callback(null, state, message);
            }
    });
};

var _commit = function(message, callback) {
    var queueService = _getQueueService();
    
    return queueService.deleteMessage(_getStateQueueName(),
            message.messageId, message.popReceipt, callback);
};

var _update = function(context, timer, contentList, stateMsg, callback) {
    var lastTs = null;
    
    if (contentList.length > 0) {
        const last = contentList.pop();
        lastTs =  last.contentCreated;
    } else {
        lastTs = timer.last;
    }
    
    const newState = JSON.stringify({
        lastCollectedTs : lastTs
    });
        
    _commit(stateMsg, function(commitErr) {
        if (commitErr)
        {
            return callback(commitErr);
        } else {
            context.bindings.O365ListState.push(newState);
            return callback(null, context);
        }
    });
};


module.exports = {
    getQueueService : _getQueueService,
    fetch : _fetch,
    update : _update
};
