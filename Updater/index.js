/* -----------------------------------------------------------------------------
 * @copyright (C) 2017, Alert Logic, Inc
 * @doc
 *
 * The purpose of this function is to sync web app every 12 hours with
 * external git repository in order to perform continious updates.
 * https://docs.microsoft.com/en-us/rest/api/appservice/webapps#WebApps_SyncRepository
 *
 * @end
 * -----------------------------------------------------------------------------
 */

const https = require('https');
const util = require('util');


module.exports = function (context, AlertlogicUpdaterTimer) {
    var creds = {
        client_id : process.env.CUSTOMCONNSTR_APP_CLIENT_ID,
        tenant_id : process.env.APP_TENANT_ID,
        client_secret : process.env.CUSTOMCONNSTR_APP_CLIENT_SECRET
    };

    requestNewToken(context, creds, function(tokenError, adToken) {
        if (tokenError) {
            context.log.error('Error getting AD token: ',
                tokenError.statusCode, tokenError.statusMessage);
            context.done(tokenError);
        } else {
            siteSync(context, adToken, function(syncError) {
                if (syncError) {
                    context.log.error('Site sync failed: ', syncError);
                    context.done(syncError);
                } else {
                    context.log.info('Site sync OK');
                    context.done();
                }
            });
        }
    });
};

/*
 * Internal functions
 */

function siteSync(context, adToken, callback) {
    var subscriptionId = process.env.APP_SUBSCRIPTION_ID;
    var resourceGroupName = process.env.APP_RESOURCE_GROUP;
    var webAppName = process.env.WEBSITE_SITE_NAME;
    var options = {
        hostname: 'management.azure.com',
        path:
            '/subscriptions/' + encodeURIComponent(subscriptionId) +
            '/resourceGroups/' + encodeURIComponent(resourceGroupName) +
            '/providers/Microsoft.Web/sites/' + encodeURIComponent(webAppName) +
            '/sync?api-version=2016-08-01',
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length' : 0,
            'Authorization' : 'Bearer ' + encodeURIComponent(adToken)
        }
    };
    var syncResp = '';
    var req = https.request(options, function(response) {
        response.on('data', function (chunk) {
            syncResp += chunk;
        });

        response.on('end', function () {
            if (response.statusCode == 200) {
                return callback(null, response);
            } else {
                return callback(response);
            }
        });
    });

    req.on('error', function(reqError) {
        return callback(reqError);
    });
    req.end();
}

/*
 * We don't want to have any unnecessary dependencies like token_cache in
 * Updater function in order to minimize potential failure.
 */
function requestNewToken(context, creds, callback) {
    var postData =
        'grant_type=client_credentials&' +
        'client_id=' + encodeURIComponent(creds.client_id) +'&'+
        'resource=' + encodeURIComponent('https://management.azure.com/') +'&'+
        'client_secret=' + encodeURIComponent(creds.client_secret);
    var options = {
        hostname: 'login.windows.net',
        path: '/' + encodeURI(creds.tenant_id) +
            '/oauth2/token',
        method: 'POST',
        headers: {
            'Accept': '*/*',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length' : Buffer.byteLength(postData)
        }
    };
    var loginResp = '';
    var req = https.request(options, function(response) {
        response.on('data', function (chunk) {
            loginResp += chunk;
        });

        response.on('end', function () {
            if (response.statusCode == 200) {
                var respJson;
                try {
                    respJson = JSON.parse(loginResp);
                    return callback(null, respJson.access_token);
                } catch (exception) {
                    return callback(exception);
                }
            } else {
                return callback(response);
            }
        });
    });

    req.on('error', function(reqError) {
        callback(reqError);
    });
    req.write(postData);
    req.end();
}
