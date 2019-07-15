/* ----------------------------------------------------------------------------
 * @copyright (C) 2019, Alert Logic, Inc
 * @doc
 * 
 * The purpose of this function is to check updates of collector configuration,
 * reconfigure them if needed and send status report into Monitoring service.
 * 
 * @end
 * ----------------------------------------------------------------------------
 */
 
const async = require('async');
const pkg = require('../package.json');
const { AlAzureMaster } = require('@alertlogic/al-azure-collector-js');
const { checkStreams } = require('./healthchecks.js');
const AlAzureUpdater = require('@alertlogic/al-azure-collector-js').AlAzureUpdater;

//get the old o365 collector parameters if they exist
const collectorKeys = {};
if(process.env.CUSTOMCONNSTR_APP_CI_ACCESS_KEY_ID) collectorKeys.aimsKeyId = process.env.CUSTOMCONNSTR_APP_CI_ACCESS_KEY_ID;
if(process.env.CUSTOMCONNSTR_APP_CI_SECRET_KEY) collectorKeys.aimsKeySecret = process.env.CUSTOMCONNSTR_APP_CI_SECRET_KEY;
if(process.env.O365_HOST_ID) collectorKeys.hostId = process.env.O365_HOST_ID;
if(process.env.O365_COLLECTOR_ID) collectorKeys.sourceId = process.env.O365_COLLECTOR_ID;

const APP_FUNCTIONS = ['Master', 'Updater', 'O365WebHook'];

module.exports = function (context, AlertlogicMasterTimer) {
    const healthFuns = [
        checkStreams
    ];
    const master = new AlAzureMaster(context, 'o365', pkg.version, healthFuns, null, collectorKeys, {}, APP_FUNCTIONS);
    async.waterfall([
        function(asyncCallback) {
            return master.register(_o365RegisterBody(), asyncCallback);
        },
        function(hostId, sourceId, asyncCallback) {
            return master.checkin(AlertlogicMasterTimer.last, (checkinErr, checkinRes) => {
                if (checkinErr) {
                    return asyncCallback(`Checkin failed ${checkinErr}`);
                }
                // If checkin is ok, but receives teh forced update signal update the collector 
                if(checkinRes && checkinRes.force_update === true){
                    context.log.info(`O365 source checkin OK, forced update started`, checkinRes);
                    const updater = new AlAzureUpdater();
                    updater.syncWebApp(function(syncError){
                        if(syncError){
                            return asyncCallback(`Forced update application sync failed: ${syncError}`);
                        } else {
                            context.log.info('Forced update application sync OK');
                            return asyncCallback(null, {});
                        }
                    });
                }
                // Otherwise just report that checkin was ok
                else{
                    context.log.info(`O365 source checkin OK`, checkinRes);
                    return asyncCallback(null, {});
                }
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

function _o365RegisterBody() {
    let o365AuditStreams = JSON.parse(process.env.O365_CONTENT_STREAMS);
    return {
        config : {
            type : 'o365',
            office_tenant_id : process.env.APP_TENANT_ID,
            content_streams: o365AuditStreams
        }
    };
}
