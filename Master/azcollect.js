/* -----------------------------------------------------------------------------
 * @copyright (C) 2017, Alert Logic, Inc
 * @doc
 *
 * The module for communicating with Alertlogic Azcollect service.
 *
 * @end
 * -----------------------------------------------------------------------------
 */

const m_alServiceC = require('../lib/al_servicec');
const m_version = require('./version');

/**
 * @class
 * HTTPS client for Alertlogic Azcollect service.
 *
 * @constructor
 * @param {string} apiEndpoint - Alertlogic API hostname.
 * @param {Object} aisCreds - Alertlogic API credentials.
 * @param {string} [aisCreds.access_key_id] - Aertlogic API access key id.
 * @param {string} [aisCreds.secret_key] - Alertlogic API secret key.
 *
 */
class Azcollect extends m_alServiceC.AlServiceC {
    constructor(apiEndpoint, aimsCreds) {
        super(apiEndpoint, 'azcollect', 'v1',
                aimsCreds, process.env.TMP);
    }

    _o365RegisterBody() {
        let o365AuditStreams = JSON.parse(process.env.O365_CONTENT_STREAMS);
        let registerParams = {};
        let commonParams = {
            version : '1.0.0',
            web_app_name : process.env.WEBSITE_SITE_NAME,
            app_tenant_id : process.env.APP_TENANT_ID,
            app_resource_group : process.env.APP_RESOURCE_GROUP,
            subscription_id : process.env.APP_SUBSCRIPTION_ID,
            client_id : process.env.CUSTOMCONNSTR_APP_CLIENT_ID,
            client_secret : process.env.CUSTOMCONNSTR_APP_CLIENT_SECRET
        };
        let configParams = {
            config : {
                type : 'o365',
                office_tenant_id : process.env.APP_TENANT_ID,
                content_streams: o365AuditStreams
        }};
        return Object.assign({}, commonParams , configParams);
    }

    register_o365() {
        let regBody = this._o365RegisterBody();
        return this.post(`/register/o365`, {body: regBody});
    }

    checkin(collectorType, collectorId, statusVal, descriptionVal, stats) {
        let statusBody = {
            type : collectorType,
            version : m_version.getVersion(),
            status : statusVal,
            description : descriptionVal,
            statistics : stats
        };
        return this.post(`/checkin/${collectorType}/${collectorId}`, {body: statusBody});
    }
}

exports.Azcollect = Azcollect;
