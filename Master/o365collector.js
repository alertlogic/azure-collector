/* -----------------------------------------------------------------------------
 * @copyright (C) 2017, Alert Logic, Inc
 * @doc
 * 
 * The module for checking/enabling to O365 Management API subscriptions and
 * reprting status to Alertlogic backend.
 * 
 * @end
 * -----------------------------------------------------------------------------
 */
 
const async = require('async');

const m_alServiceC = require('../lib/al_servicec');
const m_appSettings = require('./appsettings');
const m_o365mgmnt = require('../lib/o365_mgmnt');


exports.checkRegister = function (context, AlertlogicMasterTimer, azcollectSvc, callback) {
    if (process.env.O365_COLLECTOR_ID) {
        context.log('DEBUG: Reuse collector id', process.env.O365_COLLECTOR_ID);
        return callback(null, process.env.O365_COLLECTOR_ID);
    } else {
        // Collector is not registered.
        azcollectSvc.register_o365().then(resp => {
            m_appSettings.updateAppsettings({O365_COLLECTOR_ID: resp.source.id}, 
                function(settingsError) {
                    if (settingsError) {
                        return callback(settingsError);
                    } else {
                        return callback(null, resp.source.id);
                    }
                });
        }).catch(function(exception) {
           return callback(`Registration failure ${exception}`); 
        });
    }
};

exports.checkin = function (context, AlertlogicMasterTimer, azcollectSvc, callback) {
    return m_o365mgmnt.subscriptionsList(
        function(listErr, subscrptions, httpRequest, response) {
            if (listErr) {
                azcollectSvc.checkin('o365',
                    process.env.O365_COLLECTOR_ID, 'error', `${listErr}`)
                    .then(resp => {
                        return callback(null, resp);
                    })
                    .catch(function(exception) {
                        return callback(`Unable to checkin ${exception}`);
                    });
                return callback(listErr);
            } else {
                return _checkEnableAuditStreams(context, subscrptions,
                    function(enableErr, checkResults) {
                        if (enableErr) {
                            azcollectSvc.checkin('o365',
                                process.env.O365_COLLECTOR_ID, 'error', `${enableErr}`)
                                .then(resp => {
                                    callback(null, resp);
                                })
                                .catch(function(exception) {
                                    return callback(`Unable to checkin ${exception}`);
                                });
                        } else {
                            azcollectSvc.checkin('o365',
                                process.env.O365_COLLECTOR_ID, 'ok', `${checkResults}`)
                                .then(resp => {
                                    callback(null, resp);
                                })
                                .catch(function(exception) {
                                    return callback(`Unable to checkin ${exception}`);
                                });
                        }
                });
            }
    });
};

var _checkEnableAuditStreams = function(context, listedStreams, callback) {
    try {
        let o365AuditStreams = JSON.parse(process.env.O365_CONTENT_STREAMS);
        async.map(o365AuditStreams,
            function(stream, asyncCallback) {
                let currentStream = listedStreams.find(
                        obj => obj.contentType === stream);
                if (currentStream && currentStream.status === 'enabled' &&
                    currentStream.webhook && 
                    currentStream.webhook.status === 'enabled') {
                    context.log('DEBUG: Stream already enabled', stream);
                    return asyncCallback(null, stream);
                } else {
                    // TODO: take webhook path from O365Webhook/function.json
                    let webhookURL = 'https://' + 
                        process.env.WEBSITE_HOSTNAME +
                        '/api/o365/webhook';
                    let webhook = { webhook : {
                        address : webhookURL,
                        expiration : ""
                    }};
                    return m_o365mgmnt.subscriptionsStart(stream, JSON.stringify(webhook),
                        function(err, result, httpRequest, response) {
                            if (err) {
                                return asyncCallback(err);
                            } else {
                                return asyncCallback(null, stream);
                            }
                   });
                }
            },
            callback);
    } catch (ex) {
        return callback(ex);
    }
};
