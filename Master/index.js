/* ----------------------------------------------------------------------------
 * @copyright (C) 2017, Alert Logic, Inc
 * @doc
 * 
 * The purpose of this function is to check updates of collector configuration,
 * reconfigure them if needed and send status report into Monitoring service.
 * 
 * @end
 * ----------------------------------------------------------------------------
 */
 
const async = require('async');

const m_endpoints = require('./endpoints');
const m_azcollect = require('./azcollect');
const m_o365collector = require('./o365collector');

const g_aimsCreds = {
    access_key_id : process.env.CUSTOMCONNSTR_APP_CI_ACCESS_KEY_ID,
    secret_key : process.env.CUSTOMCONNSTR_APP_CI_SECRET_KEY
};

module.exports = function (context, AlertlogicMasterTimer) {
    async.waterfall([
        function(asyncCallback) {
            return m_endpoints.checkUpdate(context, AlertlogicMasterTimer,
                function(endpointsError) {
                    if (endpointsError) {
                        return asyncCallback(endpointsError);
                    }
                    context.log.info('Alertlogic endpoints updated.');
                    return asyncCallback(null);
            });
        },
        function(asyncCallback) {
            let azcollectSvc = new m_azcollect.Azcollect(
                process.env.APP_AZCOLLECT_ENDPOINT, g_aimsCreds);
            return m_o365collector.checkRegister(context,
                    AlertlogicMasterTimer, azcollectSvc,
                function(azcollectError, collectorId) {
                    if (azcollectError) {
                        return asyncCallback(azcollectError);
                    }
                    context.log.info('O365 source registered', collectorId);
                    return asyncCallback(null, azcollectSvc);
                });
        },
        function(azcollectSvc, asyncCallback) {
            return m_o365collector.checkin(context,
                    AlertlogicMasterTimer.last, azcollectSvc,
                function(azcollectError, checkinResp) {
                    if (azcollectError) {
                        return asyncCallback(`Checkin failed ${azcollectError}`);
                    }
                    context.log.info('O365 source checkin OK', checkinResp);
                    return asyncCallback(null);
                });
        }
    ],
    function(error, results) {
        if (error) {
            context.log.error('Master error ', error);
        }
        context.done(error);
    });
};
