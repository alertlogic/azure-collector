/* -----------------------------------------------------------------------------
 * @copyright (C) 2017, Alert Logic, Inc
 * @doc
 * 
 * The module for communicating with O365 management APIs.
 * 
 * @end
 * -----------------------------------------------------------------------------
 */
 
const msRest = require('ms-rest');
const msRestAzure = require('ms-rest-azure');
const msWebResource = msRest.WebResource;

const GUID_REGEXP = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[34][0-9a-fA-F]{3}-[89ab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}';

/**
 * @class
 * Base class for all Alertlogic service clients which always uses
 * Alerlogic API request authentication headers and constructs AL services'
 * base paths.
 *
 * @constructor
 * @param {credentials} credentials - Credentials needed for the client to connect to Azure.
 * @param {string} officeTenantId - Office 365 tenant id.
 * @param {object} [options] - The parameter options
 * @param {Array} [options.filters] - Filters to be added to the request pipeline
 * @param {object} [options.requestOptions] - Options for the underlying request object
 * {@link https://github.com/request/request#requestoptions-callback Options doc}
 * @param {boolean} [options.noRetryPolicy] - If set to true, turn off default retry policy
 * @param {string} [options.acceptLanguage] - Gets or sets the preferred language for the response.
 * @param {number} [options.longRunningOperationRetryTimeout] - Gets or sets the retry timeout in seconds for Long Running Operations. Default value is 30.
 * @param {boolean} [options.generateClientRequestId] - When set to true a unique x-ms-client-request-id value is generated and included in each request. Default is true.
 *
 */
 
class O365Management extends msRestAzure.AzureServiceClient {
    constructor(credentials, officeTenantId, publisherId, options) {
        if (credentials === null || credentials === undefined) {
            throw new Error('\'credentials\' cannot be null.');
        }
        if (officeTenantId === null || officeTenantId === undefined) {
            throw new Error('\'officeTenantId\' cannot be null.');
        }
        if (!officeTenantId.match(GUID_REGEXP)) {
            throw new Error('\'officeTenantId\' should be a GUID.');
        }
        if (publisherId && !publisherId.match(GUID_REGEXP)) {
            throw new Error('\'publisherId\' should be a GUID.');
        }
        
        if (!options) options = {};
    
        super(credentials, options);
    
        this.acceptLanguage = 'en-US';
        this.longRunningOperationRetryTimeout = 30;
        this.generateClientRequestId = true;
        this.baseUri = 'https://manage.office.com';
        this.credentials = credentials;
        this.officeTenantId = officeTenantId;
        
        if (publisherId && publisherId !== '') {
            this.publisherId = publisherId;
        } else {
            this.publisherId = officeTenantId;
        }
    }
    
    subscriptionsList(options, callback) {
        let client = this;
        // Construct URL
        let baseUrl = this.baseUri;
        let tenantId = this.officeTenantId;
        let publisherId = this.publisherId;
        let requestUrl = baseUrl + (baseUrl.endsWith('/') ? '' : '/') +
            'api/v1.0/' + encodeURIComponent(tenantId) +
            '/activity/feed/subscriptions/list';
    
        let queryParameters = [];
        queryParameters.push('PublisherIdentifier=' + encodeURIComponent(publisherId));
        if (queryParameters.length > 0) {
            requestUrl += '?' + queryParameters.join('&');
        }

        // Create HTTP transport objects
        let httpRequest = new msWebResource();
        httpRequest.method = 'GET';
        httpRequest.headers = {};
        httpRequest.url = requestUrl;
        // Set Headers
        if (this.generateClientRequestId) {
            httpRequest.headers['x-ms-client-request-id'] = msRestAzure.generateUuid();
        }
        if (this.acceptLanguage !== undefined && this.acceptLanguage !== null) {
            httpRequest.headers['accept-language'] = this.acceptLanguage;
        }
        if (options) {
            for(let headerName in options.customHeaders) {
                if (options.customHeaders.hasOwnProperty(headerName)) {
                    httpRequest.headers.headerName = options.customHeaders.headerName;
                }
            }
        }
        httpRequest.headers['Content-Type'] = 'application/json; charset=utf-8';
        httpRequest.body = null;
        // Send Request
        return client.pipeline(httpRequest, (err, response, responseBody) => {
            if (err) {
                return callback(err);
            }
            let statusCode = response.statusCode;
            if (statusCode !== 200) {
                let error = new Error(responseBody);
                error.statusCode = response.statusCode;
                error.request = msRest.stripRequest(httpRequest);
                error.response = msRest.stripResponse(response);
                if (responseBody === '') responseBody = null;
                let parsedErrorResponse;
                try {
                    parsedErrorResponse = JSON.parse(responseBody);
                    if (parsedErrorResponse) {
                        if (parsedErrorResponse.error) parsedErrorResponse = parsedErrorResponse.error;
                        if (parsedErrorResponse.code) error.code = parsedErrorResponse.code;
                        if (parsedErrorResponse.message) error.message = parsedErrorResponse.message;
                    }
                } catch (defaultError) {
                    error.message = `Error "${defaultError.message}" occurred in deserializing the responseBody ` +
                                 `- "${responseBody}" for the default response.`;
                    return callback(error);
                }
                return callback(error);
            }
            // Create Result
            let result = null;
            if (responseBody === '') responseBody = null;
            // Deserialize Response
            if (statusCode === 200) {
                try {
                    result = JSON.parse(responseBody);
                } catch (error) {
                    let deserializationError = new Error(`Error ${error} occurred in deserializing the responseBody - ${responseBody}`);
                    deserializationError.request = msRest.stripRequest(httpRequest);
                    deserializationError.response = msRest.stripResponse(response);
                    return callback(deserializationError);
                }
            }
            return callback(null, result, httpRequest, response);
        });
    }

    subscriptionsStart(contentType, webhook, options, callback) {
        let client = this;
        // Construct URL
        let baseUrl = this.baseUri;
        let tenantId = this.officeTenantId;
        let publisherId = this.publisherId;
        let requestUrl = baseUrl + (baseUrl.endsWith('/') ? '' : '/') +
            'api/v1.0/' + encodeURIComponent(tenantId) +
            '/activity/feed/subscriptions/start';
        let queryParameters = [];
        queryParameters.push('contentType=' + encodeURIComponent(contentType));
        queryParameters.push('PublisherIdentifier=' + encodeURIComponent(publisherId));
        if (queryParameters.length > 0) {
            requestUrl += '?' + queryParameters.join('&');
        }
    
        // Create HTTP transport objects
        let httpRequest = new msWebResource();
        httpRequest.method = 'POST';
        httpRequest.headers = {};
        httpRequest.url = requestUrl;
        // Set Headers
        if (this.generateClientRequestId) {
            httpRequest.headers['x-ms-client-request-id'] = msRestAzure.generateUuid();
        }
        if (this.acceptLanguage !== undefined && this.acceptLanguage !== null) {
            httpRequest.headers['accept-language'] = this.acceptLanguage;
        }
        if(options) {
            for(let headerName in options.customHeaders) {
                if (options.customHeaders.hasOwnProperty(headerName)) {
                    httpRequest.headers.headerName = options.customHeaders.headerName;
                }
            }
        }
        httpRequest.headers['Content-Type'] = 'application/json; charset=utf-8';
        httpRequest.body = webhook;
        // Send Request
        return client.pipeline(httpRequest, (err, response, responseBody) => {
            if (err) {
                return callback(err);
            }
            let statusCode = response.statusCode;
            if (statusCode !== 200) {
                let error = new Error(responseBody);
                error.statusCode = response.statusCode;
                error.request = msRest.stripRequest(httpRequest);
                error.response = msRest.stripResponse(response);
                if (responseBody === '') responseBody = null;
                let parsedErrorResponse;
                try {
                    parsedErrorResponse = JSON.parse(responseBody);
                    if (parsedErrorResponse) {
                        if (parsedErrorResponse.error) parsedErrorResponse = parsedErrorResponse.error;
                        if (parsedErrorResponse.code) error.code = parsedErrorResponse.code;
                        if (parsedErrorResponse.message) error.message = parsedErrorResponse.message;
                    }
                } catch (defaultError) {
                    error.message = `Error "${defaultError.message}" occurred in deserializing the responseBody ` +
                                 `- "${responseBody}" for the default response.`;
                    return callback(error);
                }
                return callback(error);
            }
            // Create Result
            let result = null;
            if (responseBody === '') responseBody = null;
            // Deserialize Response
            if (statusCode === 200) {
                try {
                    result = JSON.parse(responseBody);
                } catch (error) {
                    let deserializationError = new Error(`Error ${error} occurred in deserializing the responseBody - ${responseBody}`);
                    deserializationError.request = msRest.stripRequest(httpRequest);
                    deserializationError.response = msRest.stripResponse(response);
                    return callback(deserializationError);
                }
            }
            return callback(null, result, httpRequest, response);
        });
    }

    subscriptionsStop(contentType, options, callback) {
        let client = this;
        // Construct URL
        let baseUrl = this.baseUri;
        let tenantId = this.officeTenantId;
        let publisherId = this.publisherId;
        let requestUrl = baseUrl + (baseUrl.endsWith('/') ? '' : '/') +
            'api/v1.0/' + encodeURIComponent(tenantId) +
            '/activity/feed/subscriptions/stop';
        let queryParameters = [];
        queryParameters.push('contentType=' + encodeURIComponent(contentType));
        queryParameters.push('PublisherIdentifier=' + encodeURIComponent(publisherId));
        if (queryParameters.length > 0) {
            requestUrl += '?' + queryParameters.join('&');
        }
    
        // Create HTTP transport objects
        let httpRequest = new msWebResource();
        httpRequest.method = 'POST';
        httpRequest.headers = {};
        httpRequest.url = requestUrl;
        // Set Headers
        if (this.generateClientRequestId) {
            httpRequest.headers['x-ms-client-request-id'] = msRestAzure.generateUuid();
        }
        if (this.acceptLanguage !== undefined && this.acceptLanguage !== null) {
            httpRequest.headers['accept-language'] = this.acceptLanguage;
        }
        if(options) {
            for(let headerName in options.customHeaders) {
                if (options.customHeaders.hasOwnProperty(headerName)) {
                    httpRequest.headers.headerName = options.customHeaders.headerName;
                }
            }
        }
        httpRequest.headers['Content-Type'] = 'application/json; charset=utf-8';
        httpRequest.body = null;
        // Send Request
        return client.pipeline(httpRequest, (err, response, responseBody) => {
            if (err) {
                return callback(err);
            }
            let statusCode = response.statusCode;
            if (statusCode !== 200) {
                let error = new Error(responseBody);
                error.statusCode = response.statusCode;
                error.request = msRest.stripRequest(httpRequest);
                error.response = msRest.stripResponse(response);
                if (responseBody === '') responseBody = null;
                let parsedErrorResponse;
                try {
                    parsedErrorResponse = JSON.parse(responseBody);
                    if (parsedErrorResponse) {
                        if (parsedErrorResponse.error) parsedErrorResponse = parsedErrorResponse.error;
                        if (parsedErrorResponse.code) error.code = parsedErrorResponse.code;
                        if (parsedErrorResponse.message) error.message = parsedErrorResponse.message;
                    }
                } catch (defaultError) {
                    error.message = `Error "${defaultError.message}" occurred in deserializing the responseBody ` +
                                 `- "${responseBody}" for the default response.`;
                    return callback(error);
                }
                return callback(error);
            }
            // Create Result
            let result = null;
            if (responseBody === '') responseBody = null;
            // Deserialize Response
            if (statusCode === 200) {
                try {
                    result = JSON.parse(responseBody);
                } catch (error) {
                    let deserializationError = new Error(`Error ${error} occurred in deserializing the responseBody - ${responseBody}`);
                    deserializationError.request = msRest.stripRequest(httpRequest);
                    deserializationError.response = msRest.stripResponse(response);
                    return callback(deserializationError);
                }
            }
            return callback(null, result, httpRequest, response);
        });
    }
    
    subscriptionsContent(contentType, startTs, endTs, options, callback) {
        let client = this;
        // Construct URL
        let baseUrl = this.baseUri;
        let tenantId = this.officeTenantId;
        let publisherId = this.publisherId;
        let requestUrl = baseUrl + (baseUrl.endsWith('/') ? '' : '/') +
            'api/v1.0/' + encodeURIComponent(tenantId) +
            '/activity/feed/subscriptions/content';
        let queryParameters = [];
        queryParameters.push('contentType=' + encodeURIComponent(contentType));
        if (startTs && startTs !== '') queryParameters.push('startTime=' + encodeURIComponent(startTs));
        if (endTs && endTs !== '') queryParameters.push('endTime=' + encodeURIComponent(endTs));
        queryParameters.push('PublisherIdentifier=' + encodeURIComponent(publisherId));
        if (queryParameters.length > 0) {
            requestUrl += '?' + queryParameters.join('&');
        }
    
        // Create HTTP transport objects
        let httpRequest = new msWebResource();
        httpRequest.method = 'GET';
        httpRequest.headers = {};
        httpRequest.url = requestUrl;
        // Set Headers
        if (this.generateClientRequestId) {
            httpRequest.headers['x-ms-client-request-id'] = msRestAzure.generateUuid();
        }
        if (this.acceptLanguage !== undefined && this.acceptLanguage !== null) {
            httpRequest.headers['accept-language'] = this.acceptLanguage;
        }
        if(options) {
            for(let headerName in options.customHeaders) {
                if (options.customHeaders.hasOwnProperty(headerName)) {
                    httpRequest.headers.headerName = options.customHeaders.headerName;
                }
            }
        }
        httpRequest.headers['Content-Type'] = 'application/json; charset=utf-8';
        httpRequest.body = null;
        // Send Request
        return client.pipeline(httpRequest, (err, response, responseBody) => {
            if (err) {
                return callback(err);
            }
            let statusCode = response.statusCode;
            if (statusCode !== 200) {
                let error = new Error(responseBody);
                error.statusCode = response.statusCode;
                error.request = msRest.stripRequest(httpRequest);
                error.response = msRest.stripResponse(response);
                if (responseBody === '') responseBody = null;
                let parsedErrorResponse;
                try {
                    parsedErrorResponse = JSON.parse(responseBody);
                    if (parsedErrorResponse) {
                        if (parsedErrorResponse.error) parsedErrorResponse = parsedErrorResponse.error;
                        if (parsedErrorResponse.code) error.code = parsedErrorResponse.code;
                        if (parsedErrorResponse.message) error.message = parsedErrorResponse.message;
                    }
                } catch (defaultError) {
                    error.message = `Error "${defaultError.message}" occurred in deserializing the responseBody ` +
                                 `- "${responseBody}" for the default response.`;
                    return callback(error);
                }
                return callback(error);
            }
            // Create Result
            let result = null;
            if (responseBody === '') responseBody = null;
            // Deserialize Response
            if (statusCode === 200) {
                try {
                    result = JSON.parse(responseBody);
                } catch (error) {
                    let deserializationError = new Error(`Error ${error} occurred in deserializing the responseBody - ${responseBody}`);
                    deserializationError.request = msRest.stripRequest(httpRequest);
                    deserializationError.response = msRest.stripResponse(response);
                    return callback(deserializationError);
                }
            }
            return callback(null, result, httpRequest, response);
        });
    }
    
    subscriptionsNotifications(contentType, startTs, endTs, options, callback) {
        let client = this;
        // Construct URL
        let baseUrl = this.baseUri;
        let tenantId = this.officeTenantId;
        let publisherId = this.publisherId;
        let requestUrl = baseUrl + (baseUrl.endsWith('/') ? '' : '/') +
            'api/v1.0/' + encodeURIComponent(tenantId) +
            '/activity/feed/subscriptions/notifications';
        let queryParameters = [];
        queryParameters.push('contentType=' + encodeURIComponent(contentType));
        if (startTs && startTs !== '') queryParameters.push('startTime=' + encodeURIComponent(startTs));
        if (endTs && endTs !== '') queryParameters.push('endTime=' + encodeURIComponent(endTs));
        queryParameters.push('PublisherIdentifier=' + encodeURIComponent(publisherId));
        if (queryParameters.length > 0) {
            requestUrl += '?' + queryParameters.join('&');
        }
    
        // Create HTTP transport objects
        let httpRequest = new msWebResource();
        httpRequest.method = 'GET';
        httpRequest.headers = {};
        httpRequest.url = requestUrl;
        // Set Headers
        if (this.generateClientRequestId) {
            httpRequest.headers['x-ms-client-request-id'] = msRestAzure.generateUuid();
        }
        if (this.acceptLanguage !== undefined && this.acceptLanguage !== null) {
            httpRequest.headers['accept-language'] = this.acceptLanguage;
        }
        if(options) {
            for(let headerName in options.customHeaders) {
                if (options.customHeaders.hasOwnProperty(headerName)) {
                    httpRequest.headers.headerName = options.customHeaders.headerName;
                }
            }
        }
        httpRequest.headers['Content-Type'] = 'application/json; charset=utf-8';
        httpRequest.body = null;
        // Send Request
        return client.pipeline(httpRequest, (err, response, responseBody) => {
            if (err) {
                return callback(err);
            }
            let statusCode = response.statusCode;
            if (statusCode !== 200) {
                let error = new Error(responseBody);
                error.statusCode = response.statusCode;
                error.request = msRest.stripRequest(httpRequest);
                error.response = msRest.stripResponse(response);
                if (responseBody === '') responseBody = null;
                let parsedErrorResponse;
                try {
                    parsedErrorResponse = JSON.parse(responseBody);
                    if (parsedErrorResponse) {
                        if (parsedErrorResponse.error) parsedErrorResponse = parsedErrorResponse.error;
                        if (parsedErrorResponse.code) error.code = parsedErrorResponse.code;
                        if (parsedErrorResponse.message) error.message = parsedErrorResponse.message;
                    }
                } catch (defaultError) {
                    error.message = `Error "${defaultError.message}" occurred in deserializing the responseBody ` +
                                 `- "${responseBody}" for the default response.`;
                    return callback(error);
                }
                return callback(error);
            }
            // Create Result
            let result = null;
            if (responseBody === '') responseBody = null;
            // Deserialize Response
            if (statusCode === 200) {
                try {
                    result = JSON.parse(responseBody);
                } catch (error) {
                    let deserializationError = new Error(`Error ${error} occurred in deserializing the responseBody - ${responseBody}`);
                    deserializationError.request = msRest.stripRequest(httpRequest);
                    deserializationError.response = msRest.stripResponse(response);
                    return callback(deserializationError);
                }
            }
            return callback(null, result, httpRequest, response);
        });
    }
    
    getContent(uri, options, callback) {
        let client = this;
        let publisherId = this.publisherId;
        let requestUrl = uri;
        
        let queryParameters = [];
        queryParameters.push('PublisherIdentifier=' + encodeURIComponent(publisherId));
        if (queryParameters.length > 0) {
            requestUrl += '?' + queryParameters.join('&');
        }

        // Create HTTP transport objects
        let httpRequest = new msWebResource();
        httpRequest.method = 'GET';
        httpRequest.headers = {};
        httpRequest.url = requestUrl;
        // Set Headers
        if (this.generateClientRequestId) {
            httpRequest.headers['x-ms-client-request-id'] = msRestAzure.generateUuid();
        }
        if (this.acceptLanguage !== undefined && this.acceptLanguage !== null) {
            httpRequest.headers['accept-language'] = this.acceptLanguage;
        }
        if(options) {
            for(let headerName in options.customHeaders) {
                if (options.customHeaders.hasOwnProperty(headerName)) {
                    httpRequest.headers.headerName = options.customHeaders.headerName;
                }
            }
        }
        httpRequest.headers['Content-Type'] = 'application/json; charset=utf-8';
        httpRequest.body = null;
        // Send Request
        return client.pipeline(httpRequest, (err, response, responseBody) => {
            if (err) {
                return callback(err);
            }
            let statusCode = response.statusCode;
            if (statusCode !== 200) {
                let error = new Error(responseBody);
                error.statusCode = response.statusCode;
                error.request = msRest.stripRequest(httpRequest);
                error.response = msRest.stripResponse(response);
                if (responseBody === '') responseBody = null;
                let parsedErrorResponse;
                try {
                    parsedErrorResponse = JSON.parse(responseBody);
                    if (parsedErrorResponse) {
                        if (parsedErrorResponse.error) parsedErrorResponse = parsedErrorResponse.error;
                        if (parsedErrorResponse.code) error.code = parsedErrorResponse.code;
                        if (parsedErrorResponse.message) error.message = parsedErrorResponse.message;
                    }
                } catch (defaultError) {
                    error.message = `Error "${defaultError.message}" occurred in deserializing the responseBody ` +
                                 `- "${responseBody}" for the default response.`;
                    return callback(error);
                }
                return callback(error);
            }
            // Create Result
            let result = null;
            if (responseBody === '') responseBody = null;
            // Deserialize Response
            if (statusCode === 200) {
                try {
                    result = JSON.parse(responseBody);
                } catch (error) {
                    let deserializationError = new Error(`Error ${error} occurred in deserializing the responseBody - ${responseBody}`);
                    deserializationError.request = msRest.stripRequest(httpRequest);
                    deserializationError.response = msRest.stripResponse(response);
                    return callback(deserializationError);
                }
            }
            return callback(null, result, httpRequest, response);
        });
    }
}

exports.O365Management = O365Management;
