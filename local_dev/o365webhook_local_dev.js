const util = require('util');

require('./dev_config');
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
           {
        "contentType": "Audit.AzureActiveDirectory",
        "contentId": "20191120151429657218680$20191120152254760025243$audit_azureactivedirectory$Audit_AzureActiveDirectory$emea0039$emea0039",
        "contentUri": "https://manage.office.com/api/v1.0/bf8d32d3-1c13-4487-af02-80dba2236485/activity/feed/audit/20191120151429657218680$20191120152254760025243$audit_azureactivedirectory$Audit_AzureActiveDirectory$emea0039$emea0039",
        "notificationStatus": "Succeeded",
        "contentCreated": "2019-11-20T15:32:19.191Z",
        "notificationSent": "2019-11-20T15:32:19.191Z",
        "contentExpiration": "2019-11-27T15:14:29.657Z"
    },
    {
        "contentType": "Audit.AzureActiveDirectory",
        "contentId": "20191120153450196043744$20191120155026415161068$audit_azureactivedirectory$Audit_AzureActiveDirectory$emea0039$emea0039",
        "contentUri": "https://manage.office.com/api/v1.0/bf8d32d3-1c13-4487-af02-80dba2236485/activity/feed/audit/20191120153450196043744$20191120155026415161068$audit_azureactivedirectory$Audit_AzureActiveDirectory$emea0039$emea0039",
        "notificationStatus": "Failed",
        "contentCreated": "2019-11-20T15:50:46.026Z",
        "notificationSent": "2019-11-20T15:50:46.026Z",
        "contentExpiration": "2019-11-27T15:34:50.196Z"
    },
    {
        "contentType": "Audit.AzureActiveDirectory",
        "contentId": "20191120155104689171466$20191120160939971002087$audit_azureactivedirectory$Audit_AzureActiveDirectory$emea0039$emea0039",
        "contentUri": "https://manage.office.com/api/v1.0/bf8d32d3-1c13-4487-af02-80dba2236485/activity/feed/audit/20191120155104689171466$20191120160939971002087$audit_azureactivedirectory$Audit_AzureActiveDirectory$emea0039$emea0039",
        "notificationStatus": "Failed",
        "contentCreated": "2019-11-20T16:12:38.122Z",
        "notificationSent": "2019-11-20T16:12:38.122Z",
        "contentExpiration": "2019-11-27T15:51:04.689Z"
    } 
        ]
};


// Call the azureFunction locally with your testing params
azureFunction(debugContext, debugEvent);
