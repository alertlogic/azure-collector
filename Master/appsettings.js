/* -----------------------------------------------------------------------------
 * @copyright (C) 2017, Alert Logic, Inc
 * @doc
 * 
 * The module for updating Azure application settings.
 * 
 * @end
 * -----------------------------------------------------------------------------
 */
 
const async = require('async');

const m_alUtil = require('../lib/al_util');

var azureRest = require('ms-rest-azure');
var azureArmClient = require('azure-arm-resource').ResourceManagementClient;
var azureArmWebsite = require('azure-arm-website');

var fileTokenCache = require('azure/lib/util/fileTokenCache');
var tokenCache = new fileTokenCache(m_alUtil.getADCacheFilename(
    { 
        creds : {
            client_id : process.env.CUSTOMCONNSTR_APP_CLIENT_ID,
            tenant_id : process.env.APP_TENANT_ID
        },
        resource : 'https://management.azure.com'
    }));

var g_appAdCreds = new azureRest.ApplicationTokenCredentials(
        process.env.CUSTOMCONNSTR_APP_CLIENT_ID,
        process.env.APP_TENANT_ID,
        process.env.CUSTOMCONNSTR_APP_CLIENT_SECRET,
        { 'tokenCache': tokenCache });
        
var g_websiteClient = new azureArmWebsite(g_appAdCreds, process.env.APP_SUBSCRIPTION_ID);


var _updateAppsettings = function(newSettings, callback) {
    async.waterfall([
        function(asyncCallback) {
            return _getAppsettings(asyncCallback);
        },
        function(appSettings, asyncCallback) {
            let updatedProps = Object.assign({}, appSettings.properties, newSettings);
            let updatedEnv = Object.assign({}, process.env, newSettings);
            process.env = updatedEnv;
            appSettings.properties = updatedProps;
            return _setAppsettings(appSettings, asyncCallback);
        }],
        callback
    );
};

var _getAppsettings = function(callback) {
    return g_websiteClient.webApps.listApplicationSettings(
        process.env.APP_RESOURCE_GROUP, process.env.WEBSITE_SITE_NAME, null,
        function(err, result, request, response) {
            if (err) {
                return callback(err);
            } else {
                return callback(null, result);
            }
        });
};

var _setAppsettings = function(settings, callback) {
    return g_websiteClient.webApps.updateApplicationSettings(
        process.env.APP_RESOURCE_GROUP, process.env.WEBSITE_SITE_NAME, settings, null,
        function(err, result, request, response) {
            if (err) {
                return callback(err);
            } else {
                return callback(null);
            }
        });
};

module.exports = {
    getAppsettings : _getAppsettings,
    setAppsettings : _setAppsettings,
    updateAppsettings : _updateAppsettings
};
