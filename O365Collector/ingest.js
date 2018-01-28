/* -----------------------------------------------------------------------------
 * @copyright (C) 2017, Alert Logic, Inc
 * @doc
 * 
 * The module for communicating with Alertlogic Ingest service.
 * 
 * @end
 * -----------------------------------------------------------------------------
 */
 
const m_ingestProto = require('./ingest_proto');
const m_alServiceC = require('../lib/al_servicec');

/**
 * @class
 * HTTPS client for Alertlogic Ingest service.
 *
 * @constructor
 * @param {string} apiEndpoint - Alertlogic API hostname.
 * @param {Object} aisCreds - Alertlogic API credentials.
 * @param {string} [aisCreds.access_key_id] - Aertlogic API access key id.
 * @param {string} [aisCreds.secret_key] - Alertlogic API secret key.
 *
 */
class Ingest extends m_alServiceC.AlServiceC {
    constructor(apiEndpoint, aimsCreds) {
        super(apiEndpoint, 'ingest', 'v1',
                aimsCreds, process.env.TMP);
    }
    
    sendO365Data(data) {
        let payload = {
            json : false,
            headers : {
                'Content-Type': 'alertlogic.com/pass-through',
                'x-invoked-by' : 'azure_function',
                'Content-Encoding' : 'deflate',
                'Content-Length' : Buffer.byteLength(data)
            },
            body : data
        };
        return this.post(`/data/aicspmsgs`, payload);
    }
}

exports.Ingest = Ingest;
