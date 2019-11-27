/* ----------------------------------------------------------------------------
 * @copyright (C) 2019, Alert Logic, Inc
 * @doc
 *
 * Various O365 collector health checks.
 * The last error code is O365000002
 *
 * @end
 * ----------------------------------------------------------------------------
 */

const async = require('async');
const m_o365mgmnt = require('../lib/o365_mgmnt');

const checkStreams = function(master, callback) {
    async.waterfall([
        function(asyncCallback){
            m_o365mgmnt.subscriptionsList(asyncCallback);
        },
        function(subscriptions, httpRequest, response, asyncCallback){
            _checkEnableAuditStreams(master, subscriptions, asyncCallback);
        }
    ],
    callback);
};

const _checkEnableAuditStreams = function(master, listedStreams, callback) {
    try {
        let o365AuditStreams = JSON.parse(process.env.O365_CONTENT_STREAMS);
        // TODO: take webhook path from O365Webhook/function.json
        let webhookURL = 'https://' + process.env.WEBSITE_HOSTNAME +
            '/api/o365/webhook';
        async.map(o365AuditStreams,
            function(stream, asyncCallback) {
                let currentStream = listedStreams.find(
                        obj => obj.contentType === stream);
                if (currentStream && currentStream.status === 'enabled' &&
                    currentStream.webhook &&
                    currentStream.webhook.status === 'enabled' &&
                    currentStream.webhook.address === webhookURL) {
                    return asyncCallback(null, stream);
                } else {
                    let webhook = { webhook : {
                        address : webhookURL,
                        expiration : ""
                    }};
                    return m_o365mgmnt.subscriptionsStart(stream, JSON.stringify(webhook),
                        function(err, result, httpRequest, response) {
                            if (err) {
                                return asyncCallback(master.errorStatusFmt('O365000001', `Unable to start subscription ${err}`));
                            } else {
                                return asyncCallback(null, stream);
                            }
                   });
                }
            },
            callback);
    } catch (ex) {
        return callback(master.errorStatusFmt('O365000002', `Exception thrown during health check ${ex}`));
    }
};

module.exports = {
    checkStreams
};
