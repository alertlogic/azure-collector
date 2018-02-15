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
const m_appStats = require('./appstats');
const m_o365mgmnt = require('../lib/o365_mgmnt');


exports.checkRegister = function (context, AlertlogicMasterTimer, azcollectSvc, callback) {
    if (process.env.O365_COLLECTOR_ID && process.env.O365_HOST_ID) {
        context.log.verbose('Reuse collector id', process.env.O365_COLLECTOR_ID);
        return callback(null, process.env.O365_COLLECTOR_ID);
    } else {
        // Collector is not registered.
        azcollectSvc.register_o365().then(resp => {
            let newSettings = {
                O365_COLLECTOR_ID: resp.source.id,
                O365_HOST_ID: resp.source.host.id
            };
            m_appSettings.updateAppsettings(newSettings, 
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
    async.waterfall([
        function(asyncCallback) {
            m_o365mgmnt.subscriptionsList(asyncCallback);
        },
        function(subscriptions, httpRequest, response, asyncCallback) {
            _checkEnableAuditStreams(context, subscriptions, asyncCallback);
        }],
    function(error, checkResults) {
        m_appStats.getAppStats(AlertlogicMasterTimer, function(statsErr, appStats) {
            var stats = null;
            if (statsErr) {
                stats = [{
                    error : `Error getting application stats: ${statsErr}`
                }];
            } else {
                stats = appStats;
            }
            if (error) {
                azcollectSvc.checkin('o365',
                    process.env.O365_COLLECTOR_ID, 'error', `${error}`, stats)
                    .then(resp => {
                        return callback(null, resp);
                    })
                    .catch(function(exception) {
                        return callback(`Unable to checkin ${exception}`);
                    });
            } else {
                azcollectSvc.checkin('o365',
                    process.env.O365_COLLECTOR_ID, 'ok', `${checkResults}`, stats)
                    .then(resp => {
                        return callback(null, resp);
                    })
                    .catch(function(exception) {
                        return callback(`Unable to checkin ${exception}`);
                    });
            }
        });
    });
};

var _checkEnableAuditStreams = function(context, listedStreams, callback) {
    try {
        let o365AuditStreams = JSON.parse(process.env.O365_CONTENT_STREAMS);
        let webhookURL = 'https://' + process.env.WEBSITE_HOSTNAME +
            '/api/o365/webhook';
        async.map(o365AuditStreams,
            function(stream, asyncCallback) {
                let currentStream = listedStreams.find(
                        obj => obj.contentType === stream);
                
                // TODO: remove the **if** statement below once all
                // deprecated webhooks are removed.
                if (currentStream && currentStream.status === 'enabled' &&
                    currentStream.webhook && 
                    currentStream.webhook.address === webhookURL) {
                    // Disable deprecated AL webhook
                    return m_o365mgmnt.subscriptionsStart(stream, '',
                        function(err, result, httpRequest, response) {
                            if (err) {
                                return asyncCallback(err);
                            } else {
                                return asyncCallback(null, stream);
                            }
                    });
                } else if (currentStream && currentStream.status === 'enabled') {
                    context.log.verbose('Stream already enabled', stream);
                    return asyncCallback(null, stream);
                } else {
                    return m_o365mgmnt.subscriptionsStart(stream, '',
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
