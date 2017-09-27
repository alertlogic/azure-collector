/* -----------------------------------------------------------------------------
 * @copyright (C) 2017, Alert Logic, Inc
 * @doc
 * 
 * The module for communicating with Alertlogic Endpoints service.
 * 
 * @end
 * -----------------------------------------------------------------------------
 */
 
const async = require('async');

const m_alServiceC = require('../lib/al_servicec');
const m_appSettings = require('./appsettings');


exports.checkUpdate = function (context, AlertlogicMasterTimer, callback) {
    if (process.env.APP_INGEST_ENDPOINT && process.env.APP_AZCOLLECT_ENDPOINT) {
        context.log.verbose('Reuse Ingest endpoint', process.env.APP_INGEST_ENDPOINT);
        context.log.verbose('Reuse Azcollect endpoint', process.env.APP_AZCOLLECT_ENDPOINT);
        return callback(null);
    } else {
        // Endpoint settings do not exist. Update them.
        let alApiEndpoint = process.env.CUSTOMCONNSTR_APP_AL_API_ENDPOINT;
        let alResidency = process.env.CUSTOMCONNSTR_APP_AL_RESIDENCY;
        let aimsCreds = {
            access_key_id : process.env.CUSTOMCONNSTR_APP_CI_ACCESS_KEY_ID,
            secret_key : process.env.CUSTOMCONNSTR_APP_CI_SECRET_KEY
        };
        let endpointsSvc = new Endpoints(alApiEndpoint, aimsCreds);
        async.map(['ingest', 'azcollect'], 
            function(service, mapCallback){
                endpointsSvc.getEndpoint(service, alResidency)
                    .then(resp => {
                        return mapCallback(null, resp);
                    })
                    .catch(function(exception) {
                        return mapCallback(`Endpoints update failure ${exception}`);
                    });
            },
            function (mapErr, mapsRsult) {
                if (mapErr) {
                    return callback(mapErr);
                } else {
                    let endpoints = {
                        APP_INGEST_ENDPOINT : mapsRsult[0].ingest,
                        APP_AZCOLLECT_ENDPOINT : mapsRsult[1].azcollect
                    };
                    m_appSettings.updateAppsettings(endpoints, function(settingsError) {
                        if (settingsError) {
                            return callback(settingsError);
                        } else {
                            return callback(null);
                        }
                    });
                }
        });
    }
};

/**
 * @class
 * HTTPS client for Alertlogic Endpoints service.
 *
 * @constructor
 * @param {string} apiEndpoint - Alertlogic API hostname.
 * @param {Object} aisCreds - Alertlogic API credentials.
 * @param {string} [aisCreds.access_key_id] - Aertlogic API access key id.
 * @param {string} [aisCreds.secret_key] - Alertlogic API secret key.
 *
 */
class Endpoints extends m_alServiceC.AlServiceC {
    constructor(apiEndpoint, aimsCreds) {
        super(apiEndpoint, 'endpoints', 'v1', aimsCreds, process.env.TMP);
    }
    getEndpoint(serivceName, residency) {
        return this.get(`/residency/${residency}/services/${serivceName}/endpoint`, {});
    }
}

exports.Endpoints = Endpoints;
