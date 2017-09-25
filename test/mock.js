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

process.env.WEBSITE_HOSTNAME = 'kkuzmin-app-o365.azurewebsites.net';
process.env.O365_CONTENT_STREAMS = '["Audit.AzureActiveDirectory", "Audit.Exchange", "Audit.SharePoint", "Audit.General"]';
process.env.TMP = '/tmp/';
process.env.APP_SUBSCRIPTION_ID = 'subscription-id';
process.env.CUSTOMCONNSTR_APP_CLIENT_ID = 'client-id';
process.env.CUSTOMCONNSTR_APP_CLIENT_SECRET = 'client-secret';
process.env.APP_TENANT_ID = 'test.onmicrosoft.com';
process.env.O365_TENANT_ID = 'test.onmicrosoft.com';

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

var oneOldEnabledStream = [
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

exports.allEnabledStreams = allEnabledStreams;
exports.oneOldEnabledStream = oneOldEnabledStream;
exports.context = context;
