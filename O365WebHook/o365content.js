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

module.exports.processNotifications = function(context, notifications, callback) {
    // Call the function per each notification in parallel.
    async.each(notifications,
        function(notification, callback) {
            processContent(context, notification, callback);
        },
        function(err) {
            if (err) {
                return callback(`${err}`);
            }
            else {
                return callback(null);
            }
        }
    );
};

function processContent(context, notification, callback) {
    m_o365mgmnt.getContent(notification.contentUri, 
        function(err, content) {
            if (err) {
                return callback(`Unable to fetch content: ${err}`);
            }
            else {
                parseContent(context, content,
                    function(err, parsedContent) {
                        if (err) {
                            return callback(err);
                        }
                        else {
                            return sendToIngest(context,
                                parsedContent, callback);
                        }
                    }
                );
            }
        }
    );
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
                context.log.verbose('parsedData: ', result.length);
                return callback(null, result);
            }
        }
    );
}

function sendToIngest(context, content, callback) {
    async.waterfall([
        function(callback) {
            m_ingestProto.load(context, function(err, root) {
                callback(err, root);
            });
        },
        function(root, callback) {
            m_ingestProto.setMessage(context, root, content, function(err, msg) {
                callback(err, root, msg);
            });
        },
        function(root, msg, callback) {
            m_ingestProto.setHostMetadata(context, root, content, function(err, meta) {
                callback(err, root, meta, msg);
            });
        },
        function(root, meta, msg, callback) {
            m_ingestProto.setBatch(context, root, meta, msg, function(err, batch) {
                callback(err, root, batch);
            });
        },
        function(root, batchBuf, callback) {
            m_ingestProto.setBatchList(context, root, batchBuf,
                function(err, batchList) {
                    callback(err, root, batchList);
                });
        },
        function(root, batchList, callback) {
            m_ingestProto.encode(context, root, batchList, callback);
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
                            return callback(null, resp);
                        })
                        .catch(function(exception){
                            return callback(`Unable to send to Ingest ${exception}`);
                        });
                }
            });
        });
}

