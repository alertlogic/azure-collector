/* -----------------------------------------------------------------------------
 * @copyright (C) 2019, Alert Logic, Inc
 * @doc
 *
 * The purpose of this function is to sync web app every 12 hours with
 * external git repository in order to perform continious updates.
 * https://docs.microsoft.com/en-us/rest/api/appservice/webapps#WebApps_SyncRepository
 *
 * @end
 * -----------------------------------------------------------------------------
 */

const AlAzureUpdater = require('al-azure-collector-js').AlAzureUpdater;

module.exports = function (context, AlertlogicUpdaterTimer) {
    const updater = new AlAzureUpdater();
    updater.syncWebApp(function(syncError){
        if(syncError){
            context.log.error('Application sync failed: ', syncError);
        } else {
            context.log.info('Application sync OK');
        }
        context.done(syncError);
    });
};

