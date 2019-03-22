/* -----------------------------------------------------------------------------
 * @copyright (C) 2017, Alert Logic, Inc
 * @doc
 *
 * The purpose of this function it to be registered as an O365 webhook and
 * receive/process notifications.
 * https://msdn.microsoft.com/en-us/office-365/office-365-management-activity-api-reference#receiving-notifications
 *
 * @end
 * -----------------------------------------------------------------------------
 */

const async = require('async');
const pkg = require('../package.json');

const m_o365mgmnt = require('../lib/o365_mgmnt');
const AlAzureCollector = require('al-azure-collector-js').AlAzureCollector;
const formatO365Log = require('./formatO365Log');

// One O365 content message is about 1KB.
let MAX_BATCH_MESSAGES = 1500;

module.exports.processNotifications = function(context, notifications, callback) {
    //get the old o365 collector parameters if they exist
    const collectorKeys = {};
    if(process.env.O365_COLLECTOR_ID) collectorKeys.sourceId = process.env.O365_COLLECTOR_ID;
    if(process.env.O365_HOST_ID) collectorKeys.hostId = process.env.O365_HOST_ID;
    if(process.env.CUSTOMCONNSTR_APP_CI_ACCESS_KEY_ID) collectorKeys.aimsKeyId = process.env.CUSTOMCONNSTR_APP_CI_ACCESS_KEY_ID;
    if(process.env.CUSTOMCONNSTR_APP_CI_SECRET_KEY) collectorKeys.aimsKeySecret = process.env.CUSTOMCONNSTR_APP_CI_SECRET_KEY;

    const collector = new AlAzureCollector(context, 'o365', pkg.version, collectorKeys);
    async.map(notifications, function(notification, asyncCallback) {
        return m_o365mgmnt.getContent(notification.contentUri, asyncCallback);
    }, function(fetchErr, mapResult) {
        if (fetchErr) {
            return callback(fetchErr);
        } else {
            const flattenResult = [].concat.apply([], mapResult);
            context.log.verbose('Messages fetched:', flattenResult.length);
            return processContent(context, flattenResult, collector, callback);
        }
    });
};

function processContent(context, content, collector, callback) {
    const slices = getSliceIndexes(content.length);
    const acc = {processed: 0, skip:0};
    return async.mapLimit(slices, process.env.concurrentLogProcesses || 5,
        function(slice, asyncCallback){
            const contentSlice = content.slice(slice.start, slice.end);
            collector.processLog(contentSlice, formatO365Log, null,
                function(err, parsedContent) {
                    if (err) {
                        acc.skip += contentSlice.length;
                        context.log.error(`error from log processing ${JSON.stringify(err)}`);
                    }
                    else {
                        acc.processed += contentSlice.length;
                    }
                    return asyncCallback(null, acc);
            });
        },
        function(err){
            if(err){
                context.log.error('Records skipped:', content.length);
                return callback(err);
            } else {
                context.log.info('Processed:', acc.processed);
                if(acc.skip) {
                    context.log.info('Records skipped:', acc.skip);
                }
            }
            return callback(null, acc);
    });
}

function getSliceIndexes(contentLength) {
    var sliceArray = [];
    const batchesCount = Math.ceil(contentLength / MAX_BATCH_MESSAGES);
    for (var i=0; i<batchesCount; ++i) {
        const slice = {
            start : i * MAX_BATCH_MESSAGES,
            end : (i+1) * MAX_BATCH_MESSAGES
        };
        sliceArray.push(slice);
    }
    
    return sliceArray;
}


