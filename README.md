# azure-collector

Alert Logic Office 365 Log Collector


# Overview

This repository contains Azure Web application Node.js source code and an ARM template for setting up a data collector in Azure which will collect and forward Office 365 log data to the Alert Logic Cloud Defender Log Manager (LM) feature.

# Installation

Installation requires the following steps:

1. Register a new O365 web application in O365 portal for collecting O365 logs.
1. Set up the required Active Directory security permissions for the application to authorize it to read threat intelligence data and activity reports for your organization.
1. Create an Access Key that will allow the application to connect to the Alert Logic Cloud Defender and Cloud Insight backend.
1. Download and deploy a custom ARM template to Microsoft Azure to create functions for collecting and managing O365 log data
1. Verify that installation was successful using Alertlogic CloudDefender UI.

## Register a New O365 Web Application in O365

In order to install O365 Log collector:

1. Log into [O365 portal](https://portal.office.com) as AD tenant administrator.
1. Go to `Setup` and `Domain` and make a note of O365 domain name to collect logs from, for example, `example.onmicrosoft.com`.
1. Navigate to `Admin Centers` and `Azure AD`.
1. On the left side panel click `Azure Active Directory` and `App Registrations`.
1. Click `+New application registration`, fill in configuration parameters and click `Create`:
    * `Name` - for example `alo365collector`.
    * Select `Web app/ API` as `Application type`.
    * In `Sign-on URL` enter some URL, for example `http://alo365collector.com`. **Note**, it is not used anywhere.

1. After application is created select it and make a note of `Application Id`, for example, `a261478c-84fb-42f9-84c2-de050a4babe3`

## Set Up the Required Active Directory Security Permissions

1. On the `Settings` panel and select `Required permissions` and click `+Add`
1. Hit `Select an API` and chose `Office 365 Management APIs`, click `Select`
1. In `Application permissions` select `Read service health information for your organization`, `Read activity data for your organization`, `Read threat intelligence data for your organization` and `Read activity reports for your organization`. Click `Select` and `Done` buttons.
1. On `Required permissions` panel click `Required permissions` button and confirm the selection. **Note**, only AD tenant admin can grant permissions to an Azure AD application.
1. On the `Settings` panel of the application and select `Keys`.
1. Enter key `Description` and `Duration` and click `Save`. **Note**, please save the key value, it is needed later during template deployment.
1. Save the `Application ID` and `Service Principal Id` for use below. To get the `Service Principal Id`, navigate to the `Registered App` blade, 
click on the link under `Managed application in local directory`.  Then click `Properties`.  The `Service Principal Id`
is labeled `Object ID` on the properties page.  **Caution** This is not the same `Object ID` listed in the `Properties` blade reached 
by clicking `Settings` or `All Settings` from the `Registered app`.  It is also not the `Object ID` shown on the `Registered app`
blade itself.   

## Create an Alert Logic Access Key

From the Bash command line in [Azure Cloud Shell](https://docs.microsoft.com/en-us/azure/cloud-shell/quickstart) run the following commands, where `<username>` is your Alert Logic user and `<password>` is your Alert Logic password:
```
export AL_USERNAME='<username>'
export AL_PASSWORD='<password>'
auth=$(curl -X POST -s -u $AL_USERNAME:$AL_PASSWORD https://api.global-services.global.alertlogic.com/aims/v1/authenticate); export AL_ACCOUNT_ID=$(echo $auth | jq -r '.authentication.account.id'); export AL_USER_ID=$(echo $auth | jq -r '.authentication.user.id'); export AL_TOKEN=$(echo $auth | jq -r '.authentication.token'); unset AL_USERNAME; unset AL_PASSWORD; if [ -z $AL_TOKEN ]; then echo "Authentication failure"; else roles=$(curl -s -X GET -H "x-aims-auth-token: $AL_TOKEN" https://api.global-services.global.alertlogic.com/aims/v1/$AL_ACCOUNT_ID/users/$AL_USER_ID/roles | jq -r '.roles[].name'); if [ "$roles" != "Administrator" ]; then echo "The $AL_USERNAME doesn’t have Administrator role. Assigned role is '$roles'"; else curl -s -X POST -H "x-aims-auth-token: $AL_TOKEN" https://api.global-services.global.alertlogic.com/aims/v1/$AL_ACCOUNT_ID/users/$AL_USER_ID/access_keys | jq; fi; fi
```
An example of a successful response is:

```
{
  "access_key_id": "712c0b413eef41f6",
  "secret_key": "1234567890b3eea8880d292fb31aa96902242a076d3d0e320cc036eb51bf25ad"
}
```

**Note:** if the output is blank please double-check the Alert Logic user permission, you should have administrator access. More details about AIMS APIs can be found [here](https://console.product.dev.alertlogic.com/api/aims/).

Make a note of the `access_key_id` and `secret_key` values for use in the deployment steps below.

**Note:** Only five access keys can be created per user.  If you get a "limit exceeded" response you will need to
delete some keys in order to create new ones.  Use the following command to list access keys:

```
curl -s -X GET -H "x-aims-auth-token: $AL_TOKEN" https://api.global-services.global.alertlogic.com/aims/v1/$AL_ACCOUNT_ID/users/$AL_USER_ID/access_keys | jq
```

Then use the selected access_key_id in the following curl command to delete it:
```

curl -X DELETE -H "x-aims-auth-token: $AL_TOKEN" https://api.global-services.global.alertlogic.com/aims/v1/$AL_ACCOUNT_ID/users/$AL_USER_ID/access_keys/<ACCESS_KEY_ID_HERE>
```

## Function deployment

Log into [Azure portal](https://portal.azure.com). **Note**, In order to perform steps below you should have an active Azure subscription, to find out visit [Azure subscriptions blade](https://portal.azure.com/#blade/Microsoft_Azure_Billing/SubscriptionsBlade)

### Deploy via the Custom ARM Template in an Azure Subscription

1. Download an ARM [template](https://github.com/alertlogic/azure-collector/raw/master/template.json)
1. Go to [Customer Deployment](https://portal.azure.com/#create/Microsoft.Template) page. Type in `deploy` in a search query located on top of Azure Web UI and select `Deploy a custom template`.
1. Click `Build your own template in the editor` and load the file previously downloaded on step 1 above.
1. Click `Save` button.
2. Fill in required template parameters and click the `Purchase` button to start a deployment. I.e.:
   - `Name` - Any name
   - `Storage Name` - Any Storage Account name (that does not currently exist)
   - `Alert Logic Access Key ID` - `access_key_id` returned from AIMs [above](#create_an_alert_logic_access_key)
   - `Alert Logic Secret Key` - `secret_key` returned from AIMs [above](#create_an_alert_logic_access_key)
   - `Alert Logic API endpoint` - usually `api.global-services.global.alertlogic.com` 
   - `Alert Logic Data Residency` - usually `default`
   - `Office365 Content Streams` - The list of streams you would like to collect.  Valid values are:
        - ["Audit.AzureActiveDirectory","Audit.Exchange","Audit.SharePoint","Audit.General", "DLP.All"]
   - `Office365 Tenant ID` - The GUID of the tenant e.g. `alazurealertlogic.onmicrosoft.com`
   - `Service Principal ID` - The `Object ID` of the application that created the subscription.
   You can obtain it from _Azure_ -> _AD_ -> _App registrations_ -> _Your app name_ -> Link under 
_Managed application in local directory_ -> _Properties_ -> _Object ID_
   - `App Client ID` - The GUID of your application that created the subscription.
                     You can obtain it from _Azure_ -> _AD_ -> _App registrations_ -> _Your app name_
   - `App Client Secret` - The secret key of your application from _App Registrations_
   - `Repository URL` - must be `https://github.com/alertlogic/azure-collector.git`
   - `Repository Branch` - should usually be `master`

### Deploy via Azure CLI

You can use either [Azure Cloud Shell](https://docs.microsoft.com/en-gb/azure/cloud-shell/quickstart#start-cloud-shell) or
local installation of [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest).

1. Create a new resource group in, for example, the "Central US" location by executing following command:
    ```
    az group create --name <new-resource-group-name> --location "Central US"
    ```
1. Once created go to `Resource groups` blade and select the resource group.
1. Select `Access Control (IAM)` and add `Website Contributor` role to AD application identity created above.
1. Deploy a template by using following command, during its execution enter required parameters when asked.
    ```
    az group deployment create \
        --resource-group <new-resource-group-name> \
        --template-uri "https://raw.githubusercontent.com/alertlogic/azure-collector/master/template.json"
    ```

Wait until it is deployed successfully.

## Verify the Installation

1. Go to `Azure Apps` and choose your function. The last log under `Functions-> Master-> Monitor` should have OK status and should not contain any error messages.
1. Log into Alertlogic CloudDefender and navigate into `Log Manager -> Sources` page. Check new O365 log source (with a name provided during `az group deployment create` above) has been created and source status is `ok`.

# How It Works

## Master Function

The `Master` function is a timer trigger function which is responsible for:
- registering the Azure web app In Alertlogic backend;
- reporting health-checks to the backed;
- performing log source configuration updates, which happen via Alertlogic UI.

**Note:** When releasing a new version of the collector please remember to increment the version number in
npm package.json file.  To display the current version locally, issue `npm run local-version`  

## Updater Function

The `Updater` is a timer triggered function runs deployment sync operation every 12 hours in order to keep entire Web application up to date.

## Collector Function

The `Collector` function exposes an HTTP API endpoint `https://<app-name>/o365/webhook` which is registered as an [Office 365 webhook](https://msdn.microsoft.com/en-us/office-365/office-365-management-activity-api-reference#start-a-subscription) and processes O365 activity notifications. Below is a notification example,

```
[
  {
    "contentType": "Audit.AzureActiveDirectory",
    "contentId": "20170721121608709004422$20170721121608709004422$audit_azureactivedirectory$Audit_AzureActiveDirectory$IsFromNotification",
    "contentUri": "https://manage.office.com/api/v1.0/bf8d32d3-1c13-4487-af02-80dba2236485/activity/feed/audit/20170721121608709004422$20170721121608709004422$audit_azureactivedirectory$Audit_AzureActiveDirectory$IsFromNotification",
    "notificationStatus": "Succeeded",
    "contentCreated": "2017-07-21T12:16:56.798Z",
    "notificationSent": "2017-07-21T12:16:56.798Z",
    "contentExpiration": "2017-07-28T12:16:08.709Z"
  },
  {
    "contentType": "Audit.AzureActiveDirectory",
    "contentId": "20170721121625590007449$20170721121625590007449$audit_azureactivedirectory$Audit_AzureActiveDirectory$IsFromNotification",
    "contentUri": "https://manage.office.com/api/v1.0/bf8d32d3-1c13-4487-af02-80dba2236485/activity/feed/audit/20170721121625590007449$20170721121625590007449$audit_azureactivedirectory$Audit_AzureActiveDirectory$IsFromNotification",
    "notificationStatus": "Succeeded",
    "contentCreated": "2017-07-21T12:16:56.798Z",
    "notificationSent": "2017-07-21T12:16:56.798Z",
    "contentExpiration": "2017-07-28T12:16:25.590Z"
  }
]
```

A notification contains a link to the actual data which is retrieved by the `Collector`, wrapped into a protobuf structure [TBD link]() and is sent into Alertlogic Ingest service.

# Local Development

1. Clone repo `git clone git@github.com:alertlogic/azure-collector.git`
1. `cd azure-collector`
1. Run `./local_dev/setup.sh`
1. Edit `./local_dev/dev_config.js`
1. Run Master function locally: `npm run local-master`
1. Run Updater function locally: `npm run local-updater`
1. Run O365WebHook function locally: `npm run local-o365webhook`
1. Run `npm test` in order to perform code analysis and unit tests.

Please use the following [code style](https://github.com/airbnb/javascript) as much as possible.

## Setting environment in dev_config.js

- `process.env.APP_TENANT_ID` - The GUID of the tenant i.e. 'alazurealertlogic.onmicrosoft.com'
- `process.env.CUSTOMCONNSTR_APP_CLIENT_ID` - The GUID of your application that created the subscription.
You can obtain it from _Azure_ -> _AD_ -> _App registrations_ -> _Your app name_
- `process.env.CUSTOMCONNSTR_APP_CLIENT_SECRET` - A secret key of your application from _App Registrations_.
- `process.env.CUSTOMCONNSTR_APP_CI_ACCESS_KEY_ID` - access key returned from AIMs [above](#create_an_alert_logic_access_key).
- `process.env.CUSTOMCONNSTR_APP_CI_SECRET_KEY`- secret key returned from AIMs [above](#create_an_alert_logic_access_key).


# Known Issues/ Open Questions

- Sometimes deployments fail after siteSync action. We need better updater to handle that in order not to wait for 12 hours for the next update attempt.

# Useful Links

- [Node.js static code analysis tool](http://jshint.com/install/)
- [How to monitor Azure functions?](https://docs.microsoft.com/en-us/azure/azure-functions/functions-monitoring)
- [Server application to Web API authentication.](https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-authentication-scenarios#daemon-or-server-application-to-web-api)
- [Office 365 Management API reference.](https://msdn.microsoft.com/en-us/office-365/office-365-management-activity-api-reference#working-with-the-office-365-management-activity-api)
- [Azure Web apps API reference](https://docs.microsoft.com/en-us/rest/api/appservice/webapps)
