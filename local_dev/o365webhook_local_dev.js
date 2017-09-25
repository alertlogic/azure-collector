const util = require('util');

var devConfig = require('./dev_config');
var azureFunction = require('../O365WebHook/index');

// Local development query and body params
var debugQuery = {
    'code': 'This is the code'
};

var debugBody = {
    'name': 'Azure'
};

// Local development request object
var req = {
    originalUrl: 'http://original-azure-function-url',
    method: 'GET',
    query: debugQuery,
    headers: {
        connection: 'Keep-Alive',
        accept: 'application/json',
        host: 'original-azure-function-url',
        origin: 'https://functions.azure.com',
    },
    body: debugBody,
    rawBody: JSON.stringify(debugBody)
};

// Local development context
var debugContext = {
    invocationId: 'ID',
    bindings: {
        req
    },
    log: {
        error : function() {
            return console.log('ERROR:', util.format.apply(null, arguments));
        },
        warn : function() {
            return console.log('WARNING:', util.format.apply(null, arguments));
        },
        info : function() {
            return console.log('INFO:', util.format.apply(null, arguments));
        },
        verbose : function() {
            return console.log('VERBOSE:', util.format.apply(null, arguments));
        }
    },
    done: function () {
        console.log('Response:', this.res);
    },
    res: {
        headers: {},
        status: 200
    }
};

// Real notifications from Azure pointing to real content. You have to most likely
// replace it due to expiration or permission reason.
var debugEvent = {
    body:
        [
            // {
            //   "contentType": "Audit.AzureActiveDirectory",
            //   "contentId": "20170813164449279008721$20170813164449279008721$audit_azureactivedirectory$Audit_AzureActiveDirectory$IsFromNotification",
            //   "contentUri": "https://manage.office.com/api/v1.0/bf8d32d3-1c13-4487-af02-80dba2236485/activity/feed/audit/20170813164449279008721$20170813164449279008721$audit_azureactivedirectory$Audit_AzureActiveDirectory$IsFromNotification",
            //   "notificationStatus": "Failed",
            //   "contentCreated": "2017-08-13T23:03:56.050Z",
            //   "notificationSent": "2017-08-13T23:03:56.050Z",
            //   "contentExpiration": "2017-08-20T16:44:49.279Z"
            // }
        ]
};


// Call the azureFunction locally with your testing params
azureFunction(debugContext, debugEvent);
