/* -----------------------------------------------------------------------------
 * @copyright (C) 2017, Alert Logic, Inc
 * @doc
 * 
 * Mocks for unit testing.
 * 
 * @end
 * -----------------------------------------------------------------------------
 */
 
const util = require('util');
const fs = require('fs');
const m_alUtil = require('../lib/al_util');

process.env.WEBSITE_HOSTNAME = 'kkuzmin-app-o365.azurewebsites.net';
process.env.WEBSITE_SITE_NAME = 'kkuzmin-app-o365.azurewebsites.net';
process.env.O365_CONTENT_STREAMS = '["Audit.AzureActiveDirectory", "Audit.Exchange", "Audit.SharePoint", "Audit.General"]';
process.env.TMP = '/tmp/';
process.env.APP_SUBSCRIPTION_ID = 'subscription-id';
process.env.CUSTOMCONNSTR_APP_CLIENT_ID = 'client-id';
process.env.CUSTOMCONNSTR_APP_CLIENT_SECRET = 'client-secret';
process.env.CUSTOMCONNSTR_APP_CI_ACCESS_KEY_ID = 'ci-access-key-id';
process.env.CUSTOMCONNSTR_APP_CI_SECRET_KEY = 'ci-secret-key';
process.env.APP_TENANT_ID = '111132d3-1c13-4487-af02-80dba2236485';
process.env.APP_RESOURCE_GROUP = 'resource-group';
process.env.O365_COLLECTOR_ID = 'o365-collector-id';
process.env.O365_HOST_ID = 'o365-host-id';
process.env.CUSTOMCONNSTR_APP_AL_RESIDENCY = 'default';
process.env.CUSTOMCONNSTR_APP_AL_API_ENDPOINT = 'al-api-endpoint';
process.env.AzureWebJobsStorage = 'DefaultEndpointsProtocol=https;AccountName=testappo365;AccountKey=S0meKey+';


var context = {
    invocationId: 'ID',
    bindings: {
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
        console.log('Test response:');
    },
    res: null
};

var allEnabledStreams = [
  {
    "contentType": "Audit.AzureActiveDirectory",
    "status": "enabled",
    "webhook": {
      "authId": null,
      "address": "https://kkuzmin-app-o365.azurewebsites.net/api/o365/webhook",
      "expiration": "",
      "status": "enabled"
    }
  },
  {
    "contentType": "Audit.Exchange",
    "status": "enabled",
    "webhook": {
      "authId": null,
      "address": "https://kkuzmin-app-o365.azurewebsites.net/api/o365/webhook",
      "expiration": "",
      "status": "enabled"
    }
  },
  {
    "contentType": "Audit.General",
    "status": "enabled",
    "webhook": {
      "authId": null,
      "address": "https://kkuzmin-app-o365.azurewebsites.net/api/o365/webhook",
      "expiration": "",
      "status": "enabled"
    }
  },
  {
    "contentType": "Audit.SharePoint",
    "status": "enabled",
    "webhook": {
      "authId": null,
      "address": "https://kkuzmin-app-o365.azurewebsites.net/api/o365/webhook",
      "expiration": "",
      "status": "enabled"
    }
  }
];

var twoOldEnabledStreams = [
  {
    "contentType": "Audit.AzureActiveDirectory",
    "status": "enabled",
    "webhook": {
      "authId": null,
      "address": "https://old-app.azurewebsites.net/api/o365/webhook",
      "expiration": "",
      "status": "enabled"
    }
  },
  {
    "contentType": "Audit.Exchange",
    "status": "enabled",
    "webhook": {
      "authId": null,
      "address": "https://old-app-o365.azurewebsites.net/api/o365/webhook",
      "expiration": "",
      "status": "enabled"
    }
  },
  {
    "contentType": "Audit.General",
    "status": "enabled",
    "webhook": {
      "authId": null,
      "address": "https://kkuzmin-app-o365.azurewebsites.net/api/o365/webhook",
      "expiration": "",
      "status": "enabled"
    }
  },
  {
    "contentType": "Audit.SharePoint",
    "status": "enabled",
    "webhook": {
      "authId": null,
      "address": "https://kkuzmin-app-o365.azurewebsites.net/api/o365/webhook",
      "expiration": "",
      "status": "enabled"
    }
  }
];

var timer = {
    isPastDue: false,
    last: '2017-08-03T13:30:00',
    next: '2017-08-03T13:45:00'
};

var o365webhookAuditLogs = {
    entries : [
      { PartitionKey: { '$': 'Edm.String', _: 'I' },
        RowKey: { '$': 'Edm.String', _: '1bcef7c9-e0c3-4728-a704-b2b4c6e0f375' },
        Timestamp: { '$': 'Edm.DateTime', _: '2017-12-22T10:05:30.666Z' },
        ArgumentsJson: { _: '{"req":"Method: POST, Uri: https://test.azurewebsites.net/api/o365/webhook","_log":null,"_binder":null,"_context":"1bcef7c9-e0c3-4728-a704-b2b4c6e0f375","_logger":null,"$return":"response"}' },
        EndTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:47.760Z' },
        FunctionInstanceHeartbeatExpiry: { '$': 'Edm.DateTime', _: '2017-12-22T10:07:45.676Z' },
        FunctionName: { _: 'O365WebHook' },
        LogOutput: { _: '' },
        StartTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:47.760Z' },
        TriggerReason: { _: 'This function was programmatically called via the host APIs.' },
        '.metadata': { etag: 'W/"datetime\'2017-12-22T10%3A05%3A30.6667953Z\'"' } },
      { PartitionKey: { '$': 'Edm.String', _: 'I' },
        RowKey: { '$': 'Edm.String', _: '1c43776f-cb79-4e80-8f62-7cc98a4798e5' },
        Timestamp: { '$': 'Edm.DateTime', _: '2017-12-22T10:05:30.709Z' },
        ArgumentsJson: { _: '{"req":"Method: POST, Uri: https://test.azurewebsites.net/api/o365/webhook","_log":null,"_binder":null,"_context":"1c43776f-cb79-4e80-8f62-7cc98a4798e5","_logger":null,"$return":"response"}' },
        EndTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:50.657Z' },
        FunctionInstanceHeartbeatExpiry: { '$': 'Edm.DateTime', _: '2017-12-22T10:07:45.676Z' },
        FunctionName: { _: 'O365WebHook' },
        LogOutput: { _: '' },
        StartTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:50.657Z' },
        TriggerReason: { _: 'This function was programmatically called via the host APIs.' },
        '.metadata': { etag: 'W/"datetime\'2017-12-22T10%3A05%3A30.7098371Z\'"' } },
      { PartitionKey: { '$': 'Edm.String', _: 'I' },
        RowKey: { '$': 'Edm.String', _: '5d941e00-5413-45ea-932a-684e78fbfc6a' },
        Timestamp: { '$': 'Edm.DateTime', _: '2017-12-21T10:39:43.713Z' },
        ArgumentsJson: { _: '{"req":"Method: POST, Uri: https://test.azurewebsites.net/api/o365/webhook","_log":null,"_binder":null,"_context":"5d941e00-5413-45ea-932a-684e78fbfc6a","_logger":null,"$return":"response"}' },
        EndTime: { '$': 'Edm.DateTime', _: '2017-12-21T10:39:00.011Z' },
        ErrorDetails: { _: 'Unable to fetch content: O365 fetch content Error: Too many requests. Method=GetBlob, PublisherId=00000000-0000-0000-0000-000000000000' },
        FunctionInstanceHeartbeatExpiry: { '$': 'Edm.DateTime', _: '2017-12-21T10:41:58.749Z' },
        FunctionName: { _: 'O365WebHook' },
        LogOutput: { _: 'Unable to fetch content: O365 fetch content Error: Too many requests. Method=GetBlob, PublisherId=00000000-0000-0000-0000-000000000000\r\nparsedData:  [ { message_ts: 1513739921,\n    record_type: \'15\',\n    message: \'{"CreationTime":"2017-12-20T03:18:41","Id":"d405d9d9-f3b7-4c4b-bc22-b39ea7e45d26","Operation":"UserLoggedIn","OrganizationId":"bf8d32d3-1c13-4487-af02-80dba2236485","RecordType":15,"ResultStatus":"Succeeded","UserKey":"1003BFFD991C0527@alazurealertlogic.onmicrosoft.com","UserType":0,"Version":1,"Workload":"AzureActiveDirectory","ClientIP":"204.110.219.5","ObjectId":"797f4846-ba00-4fd7-ba43-dac1f8f63013","UserId":"azure_se_logcollection@alazurealertlogic.onmicrosoft.com","AzureActiveDirectoryEventType":1,"ExtendedProperties":[{"Name":"UserAuthenticationMethod","Value":"1"},{"Name":"RequestType","Value":"OAuth2:Token"},{"Name":"ResultStatusDetail","Value":"Success"}],"Actor":[{"ID":"62c77c61-11d0-47cc-9e86-a2f33c69037a","Type":0},{"ID":"azure_se_logcollection@alazurealertlogic.onmicrosoft.com","Type":5},{"ID":"1003BFFD991C0527","Type":3}],"ActorContextId":"bf8d32d3-1c13-4487-af02-80dba2236485","ActorIpAddress":"204.110.219.5","InterSystemsId":"68381b98-e142-43ae-8cf4-8c8d636a3def","IntraSystemId":"e8546ad8-ed8c-4b59-89a6-197afc2f0100","Target":[{"ID":"797f4846-ba00-4fd7-ba43-dac1f8f63013","Type":0}],"TargetContextId":"bf8d32d3-1c13-4487-af02-80dba2236485","ApplicationId":"04b07795-8ddb-461a-bbee-02f9e1bf7b46"}\' } ]\r\nparsedData:  [ { message_ts: 1513666223,\n    record_type: \'15\',\n    message: \'{"CreationTime":"2017-12-19T06:50:23","Id":"72253d17-6292-4c2e-8eb7-85506e78d4f7","Operation":"UserLoginFailed","OrganizationId":"bf8d32d3-1c13-4487-af02-80dba2236485","RecordType":15,"ResultStatus":"Failed","UserKey":"Not Available","UserType":0,"Version":1,"Workload":"AzureActiveDirectory","ClientIP":"204.110.219.5","ObjectId":"797f4846-ba00-4fd7-ba43-dac1f8f63013","UserId":"testuser@alazurealertlogic.onmicrosoft.com","AzureActiveDirectoryEventType":1,"ExtendedProper…' },
        StartTime: { '$': 'Edm.DateTime', _: '2017-12-21T10:38:59.386Z' },
        TriggerReason: { _: 'This function was programmatically called via the host APIs.' },
        '.metadata': { etag: 'W/"datetime\'2017-12-21T10%3A39%3A43.7137248Z\'"' } }
    ]
};

var masterAuditLogs = {
    entries : [
      { PartitionKey: { '$': 'Edm.String', _: 'I' },
        RowKey: { '$': 'Edm.String', _: '1bcef7c9-e0c3-4728-a704-b2b4c6e0f375' },
        Timestamp: { '$': 'Edm.DateTime', _: '2017-12-22T10:05:30.666Z' },
        ArgumentsJson: { _: '{"req":"Method: POST, Uri: https://test.azurewebsites.net/api/o365/webhook","_log":null,"_binder":null,"_context":"1bcef7c9-e0c3-4728-a704-b2b4c6e0f375","_logger":null,"$return":"response"}' },
        EndTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:47.760Z' },
        FunctionInstanceHeartbeatExpiry: { '$': 'Edm.DateTime', _: '2017-12-22T10:07:45.676Z' },
        FunctionName: { _: 'Master' },
        LogOutput: { _: '' },
        StartTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:47.760Z' },
        TriggerReason: { _: 'This function was programmatically called via the host APIs.' },
        '.metadata': { etag: 'W/"datetime\'2017-12-22T10%3A05%3A30.6667953Z\'"' } },
      { PartitionKey: { '$': 'Edm.String', _: 'I' },
        RowKey: { '$': 'Edm.String', _: '1c43776f-cb79-4e80-8f62-7cc98a4798e5' },
        Timestamp: { '$': 'Edm.DateTime', _: '2017-12-22T10:05:30.709Z' },
        ArgumentsJson: { _: '{"req":"Method: POST, Uri: https://test.azurewebsites.net/api/o365/webhook","_log":null,"_binder":null,"_context":"1c43776f-cb79-4e80-8f62-7cc98a4798e5","_logger":null,"$return":"response"}' },
        EndTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:50.657Z' },
        ErrorDetails: { _: 'Unable to fetch content: O365 fetch content Error: Too many requests. Method=GetBlob, PublisherId=00000000-0000-0000-0000-000000000000' },
        FunctionInstanceHeartbeatExpiry: { '$': 'Edm.DateTime', _: '2017-12-22T10:07:45.676Z' },
        FunctionName: { _: 'Master' },
        LogOutput: { _: '' },
        StartTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:50.657Z' },
        TriggerReason: { _: 'This function was programmatically called via the host APIs.' },
        '.metadata': { etag: 'W/"datetime\'2017-12-22T10%3A05%3A30.7098371Z\'"' } },
      { PartitionKey: { '$': 'Edm.String', _: 'I' },
        RowKey: { '$': 'Edm.String', _: '5d941e00-5413-45ea-932a-684e78fbfc6a' },
        Timestamp: { '$': 'Edm.DateTime', _: '2017-12-21T10:39:43.713Z' },
        ArgumentsJson: { _: '{"req":"Method: POST, Uri: https://test.azurewebsites.net/api/o365/webhook","_log":null,"_binder":null,"_context":"5d941e00-5413-45ea-932a-684e78fbfc6a","_logger":null,"$return":"response"}' },
        EndTime: { '$': 'Edm.DateTime', _: '2017-12-21T10:39:00.011Z' },
        ErrorDetails: { _: 'Unable to fetch content: O365 fetch content Error: Too many requests. Method=GetBlob, PublisherId=00000000-0000-0000-0000-000000000000' },
        FunctionInstanceHeartbeatExpiry: { '$': 'Edm.DateTime', _: '2017-12-21T10:41:58.749Z' },
        FunctionName: { _: 'Master' },
        LogOutput: { _: 'Unable to fetch content: O365 fetch content Error: Too many requests. Method=GetBlob, PublisherId=00000000-0000-0000-0000-000000000000\r\nparsedData:  [ { message_ts: 1513739921,\n    record_type: \'15\',\n    message: \'{"CreationTime":"2017-12-20T03:18:41","Id":"d405d9d9-f3b7-4c4b-bc22-b39ea7e45d26","Operation":"UserLoggedIn","OrganizationId":"bf8d32d3-1c13-4487-af02-80dba2236485","RecordType":15,"ResultStatus":"Succeeded","UserKey":"1003BFFD991C0527@alazurealertlogic.onmicrosoft.com","UserType":0,"Version":1,"Workload":"AzureActiveDirectory","ClientIP":"204.110.219.5","ObjectId":"797f4846-ba00-4fd7-ba43-dac1f8f63013","UserId":"azure_se_logcollection@alazurealertlogic.onmicrosoft.com","AzureActiveDirectoryEventType":1,"ExtendedProperties":[{"Name":"UserAuthenticationMethod","Value":"1"},{"Name":"RequestType","Value":"OAuth2:Token"},{"Name":"ResultStatusDetail","Value":"Success"}],"Actor":[{"ID":"62c77c61-11d0-47cc-9e86-a2f33c69037a","Type":0},{"ID":"azure_se_logcollection@alazurealertlogic.onmicrosoft.com","Type":5},{"ID":"1003BFFD991C0527","Type":3}],"ActorContextId":"bf8d32d3-1c13-4487-af02-80dba2236485","ActorIpAddress":"204.110.219.5","InterSystemsId":"68381b98-e142-43ae-8cf4-8c8d636a3def","IntraSystemId":"e8546ad8-ed8c-4b59-89a6-197afc2f0100","Target":[{"ID":"797f4846-ba00-4fd7-ba43-dac1f8f63013","Type":0}],"TargetContextId":"bf8d32d3-1c13-4487-af02-80dba2236485","ApplicationId":"04b07795-8ddb-461a-bbee-02f9e1bf7b46"}\' } ]\r\nparsedData:  [ { message_ts: 1513666223,\n    record_type: \'15\',\n    message: \'{"CreationTime":"2017-12-19T06:50:23","Id":"72253d17-6292-4c2e-8eb7-85506e78d4f7","Operation":"UserLoginFailed","OrganizationId":"bf8d32d3-1c13-4487-af02-80dba2236485","RecordType":15,"ResultStatus":"Failed","UserKey":"Not Available","UserType":0,"Version":1,"Workload":"AzureActiveDirectory","ClientIP":"204.110.219.5","ObjectId":"797f4846-ba00-4fd7-ba43-dac1f8f63013","UserId":"testuser@alazurealertlogic.onmicrosoft.com","AzureActiveDirectoryEventType":1,"ExtendedProper…' },
        StartTime: { '$': 'Edm.DateTime', _: '2017-12-21T10:38:59.386Z' },
        TriggerReason: { _: 'This function was programmatically called via the host APIs.' },
        '.metadata': { etag: 'W/"datetime\'2017-12-21T10%3A39%3A43.7137248Z\'"' } }
    ]
};
  
var updaterAuditLogs = {
    entries : [      
      { PartitionKey: { '$': 'Edm.String', _: 'I' },
        RowKey: { '$': 'Edm.String', _: '1c43776f-cb79-4e80-8f62-7cc98a4798e5' },
        Timestamp: { '$': 'Edm.DateTime', _: '2017-12-22T10:05:30.709Z' },
        ArgumentsJson: { _: '{"req":"Method: POST, Uri: https://test.azurewebsites.net/api/o365/webhook","_log":null,"_binder":null,"_context":"1c43776f-cb79-4e80-8f62-7cc98a4798e5","_logger":null,"$return":"response"}' },
        EndTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:50.657Z' },
        FunctionInstanceHeartbeatExpiry: { '$': 'Edm.DateTime', _: '2017-12-22T10:07:45.676Z' },
        FunctionName: { _: 'Updater' },
        LogOutput: { _: '' },
        StartTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:50.657Z' },
        TriggerReason: { _: 'This function was programmatically called via the host APIs.' },
        '.metadata': { etag: 'W/"datetime\'2017-12-22T10%3A05%3A30.7098371Z\'"' } },
      { PartitionKey: { '$': 'Edm.String', _: 'I' },
        RowKey: { '$': 'Edm.String', _: '5d941e00-5413-45ea-932a-684e78fbfc6a' },
        Timestamp: { '$': 'Edm.DateTime', _: '2017-12-21T10:39:43.713Z' },
        ArgumentsJson: { _: '{"req":"Method: POST, Uri: https://test.azurewebsites.net/api/o365/webhook","_log":null,"_binder":null,"_context":"5d941e00-5413-45ea-932a-684e78fbfc6a","_logger":null,"$return":"response"}' },
        EndTime: { '$': 'Edm.DateTime', _: '2017-12-21T10:39:00.011Z' },
        ErrorDetails: { _: 'Unable to fetch content: O365 fetch content Error: Too many requests. Method=GetBlob, PublisherId=00000000-0000-0000-0000-000000000000' },
        FunctionInstanceHeartbeatExpiry: { '$': 'Edm.DateTime', _: '2017-12-21T10:41:58.749Z' },
        FunctionName: { _: 'Updater' },
        LogOutput: { _: 'Unable to fetch content: O365 fetch content Error: Too many requests. Method=GetBlob, PublisherId=00000000-0000-0000-0000-000000000000\r\nparsedData:  [ { message_ts: 1513739921,\n    record_type: \'15\',\n    message: \'{"CreationTime":"2017-12-20T03:18:41","Id":"d405d9d9-f3b7-4c4b-bc22-b39ea7e45d26","Operation":"UserLoggedIn","OrganizationId":"bf8d32d3-1c13-4487-af02-80dba2236485","RecordType":15,"ResultStatus":"Succeeded","UserKey":"1003BFFD991C0527@alazurealertlogic.onmicrosoft.com","UserType":0,"Version":1,"Workload":"AzureActiveDirectory","ClientIP":"204.110.219.5","ObjectId":"797f4846-ba00-4fd7-ba43-dac1f8f63013","UserId":"azure_se_logcollection@alazurealertlogic.onmicrosoft.com","AzureActiveDirectoryEventType":1,"ExtendedProperties":[{"Name":"UserAuthenticationMethod","Value":"1"},{"Name":"RequestType","Value":"OAuth2:Token"},{"Name":"ResultStatusDetail","Value":"Success"}],"Actor":[{"ID":"62c77c61-11d0-47cc-9e86-a2f33c69037a","Type":0},{"ID":"azure_se_logcollection@alazurealertlogic.onmicrosoft.com","Type":5},{"ID":"1003BFFD991C0527","Type":3}],"ActorContextId":"bf8d32d3-1c13-4487-af02-80dba2236485","ActorIpAddress":"204.110.219.5","InterSystemsId":"68381b98-e142-43ae-8cf4-8c8d636a3def","IntraSystemId":"e8546ad8-ed8c-4b59-89a6-197afc2f0100","Target":[{"ID":"797f4846-ba00-4fd7-ba43-dac1f8f63013","Type":0}],"TargetContextId":"bf8d32d3-1c13-4487-af02-80dba2236485","ApplicationId":"04b07795-8ddb-461a-bbee-02f9e1bf7b46"}\' } ]\r\nparsedData:  [ { message_ts: 1513666223,\n    record_type: \'15\',\n    message: \'{"CreationTime":"2017-12-19T06:50:23","Id":"72253d17-6292-4c2e-8eb7-85506e78d4f7","Operation":"UserLoginFailed","OrganizationId":"bf8d32d3-1c13-4487-af02-80dba2236485","RecordType":15,"ResultStatus":"Failed","UserKey":"Not Available","UserType":0,"Version":1,"Workload":"AzureActiveDirectory","ClientIP":"204.110.219.5","ObjectId":"797f4846-ba00-4fd7-ba43-dac1f8f63013","UserId":"testuser@alazurealertlogic.onmicrosoft.com","AzureActiveDirectoryEventType":1,"ExtendedProper…' },
        StartTime: { '$': 'Edm.DateTime', _: '2017-12-21T10:38:59.386Z' },
        TriggerReason: { _: 'This function was programmatically called via the host APIs.' },
        '.metadata': { etag: 'W/"datetime\'2017-12-21T10%3A39%3A43.7137248Z\'"' } }
    ]
};

module.exports = {
    allEnabledStreams : allEnabledStreams,
    context : context,
    timer : timer,
    masterAuditLogs : masterAuditLogs,
    updaterAuditLogs : updaterAuditLogs,
    o365webhookAuditLogs : o365webhookAuditLogs
};
