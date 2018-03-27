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
const zlib = require('zlib');

const m_o365mgmnt = require('../lib/o365_mgmnt');
const m_ingestProto = require('./ingest_proto');
const m_ingest = require('./ingest');

const g_ingestc = new m_ingest.Ingest(
        process.env.APP_INGEST_ENDPOINT,
        {
            access_key_id : process.env.CUSTOMCONNSTR_APP_CI_ACCESS_KEY_ID,
            secret_key: process.env.CUSTOMCONNSTR_APP_CI_SECRET_KEY
        }
);

// One O365 content message is about 1KB.
var MAX_BATCH_MESSAGES = 1500;

module.exports.processNotifications = function(context, notifications, callback) {
    async.map(notifications, function(notification, asyncCallback) {
        return m_o365mgmnt.getContent(notification.contentUri, asyncCallback);
    }, function(fetchErr, mapResult) {
        if (fetchErr) {
            return callback(fetchErr);
        } else {
            const flattenResult = [].concat.apply([], mapResult);
            context.log.verbose('Messages fetched:', flattenResult.length);
            return processContent(context, flattenResult, callback);
        }
    });
};

function processContent(context, content, callback) {
    const slices = getSliceIndexes(content.length);
    return async.map(slices, function(slice, asyncCallback){
        const contentSlice = content.slice(slice.start, slice.end);
        parseContent(context, contentSlice,
            function(err, parsedContent) {
                if (err) {
                    return asyncCallback(err);
                }
                else {
                    return sendToIngest(context, parsedContent, asyncCallback);
                }
        });
    }, callback);
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

// Parse each message into:
// {
//  hostname: <smth>
//  message_ts: <CreationTime from the message>
//  message: <string representation of msg>
// }
function parseContent(context, parsedContent, callback) {
    async.reduce(parsedContent, [], function(memo, item, callback) {
            var message;
            try {
                message = JSON.stringify(item);
            }
            catch(err) {
                return callback(`Unable to stringify content. ${err}`);
            }

            var creationTime;
            if (item.CreationTime == undefined) {
                context.log.warn('Unable to parse CreationTime from content.');
                creationTime = Math.floor(Date.now() / 1000);
            }
            else {
                creationTime = Math.floor(Date.parse(item.CreationTime) / 1000);
            }

            var newItem = {
                message_ts: creationTime,
                record_type: (item.RecordType) ?
                                item.RecordType.toString() :
                                item.RecordType,
                message: message
            };

            memo.push(newItem);
            return callback(null, memo);
        },
        function(err, result) {
            if (err) {
                return callback(`Content parsing failure. ${err}`);
            } else {
                return callback(null, result);
            }
        }
    );
}

function sendToIngest(context, content, callback) {
    async.waterfall([
        function(asyncCallback) {
            m_ingestProto.load(context, function(err, root) {
                asyncCallback(err, root);
            });
        },
        function(root, asyncCallback) {
            m_ingestProto.setMessage(context, root, content, function(err, msg) {
                asyncCallback(err, root, msg);
            });
        },
        function(root, msg, asyncCallback) {
            m_ingestProto.setHostMetadata(context, root, content, function(err, meta) {
                asyncCallback(err, root, meta, msg);
            });
        },
        function(root, meta, msg, asyncCallback) {
            m_ingestProto.setBatch(context, root, meta, msg, function(err, batch) {
                asyncCallback(err, root, batch);
            });
        },
        function(root, batchBuf, asyncCallback) {
            m_ingestProto.setBatchList(context, root, batchBuf,
                function(err, batchList) {
                    asyncCallback(err, root, batchList);
                });
        },
        function(root, batchList, asyncCallback) {
            m_ingestProto.encode(context, root, batchList, asyncCallback);
        }],
        function(err, result) {
            if (err) {
                return callback(err);
            }

            zlib.deflate(result, function(err, compressed) {
                if (err) {
                    return callback(`Unable to compress. ${err}`);
                } else {
                    if (compressed.byteLength > 700000)
                        context.log.warn(`Compressed log batch length`,
                            `(${compressed.byteLength}) exceeds maximum allowed value.`);
                    return g_ingestc.sendO365Data(compressed)
                        .then(resp => {
                            context.log.verbose('Bytes sent to Ingest: ', compressed.byteLength);
                            return callback(null, resp);
                        })
                        .catch(function(exception){
                            return callback(`Unable to send to Ingest. ${exception}`);
                        });
                }
            });
        });
}
