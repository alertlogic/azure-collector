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
process.env.APP_TENANT_ID = 'test.onmicrosoft.com';
process.env.O365_TENANT_ID = 'test.onmicrosoft.com';
process.env.APP_RESOURCE_GROUP = 'resource-group';

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

module.exports = {
    allEnabledStreams : allEnabledStreams,
    context : context
};
