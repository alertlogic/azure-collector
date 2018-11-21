# Alert Logic Microsoft Office 365 Log Collector

[![Build Status](https://secure.travis-ci.org/alertlogic/azure-collector.png?branch=master)](http://travis-ci.org/alertlogic/azure-collector)

This repository contains the Microsoft Azure web application Node.js source code and an Azure Resource Manager (ARM) template to set up a data collector in Azure, which collects and forwards Microsoft Office 365 log data to Alert Logic Log Management.

# Installation

To perform the set up required to grant Alert Logic permission access to collect Office 365 logs, you must have access to the following:

* A Microsoft Office 365 subscription with administrative privileges
* A Microsoft Azure account with administrative privileges
* An Alert Logic account with administrative privileges
<!--The information above appears in the AL Docs. If this is still a prerequisite, we need to call it out here. So I did. -->

To set up collection of Office 365 logs requires you perform the procedures described in this section. 

<!-- Delete the list below. -->
Installation requires the following steps:

1. Register a new O365 web application in O365 portal for collecting O365 logs.
1. Set up the required Active Directory security permissions for the application to authorize it to read threat intelligence data and activity reports for your organization.
1. Create an Access Key that will allow the application to connect to the Alert Logic Cloud Defender and Cloud Insight backend.
1. Download and deploy a custom ARM template to Microsoft Azure to create functions for collecting and managing O365 log data
1. Verify the installation was successful using the Alert Logic UI under Configuration -> Deployments -> All Deployments -> Log Sources -> Filter by `Push (Office 365, CloudWatch)` collection method.

## Register a New Office 365 Web Application 
In the Office 365 portal, you must register a new Office 365 web application to collect Office 365 logs. 

**To register an Office 365 web application to collect logs:**

1. Log into the [Office 365 portal](https://portal.office.com) as an Active Directory tenant administrator.
1. Navigate to `Admin Centers` and `Azure AD`. 
<!-- I need to clarify step 2. Where are these options? -->
1. In the left navigation area, click `Azure Active Directory`, and then select `App Registrations`.
<!-- I need to verify step 3. I don't see a left nav area, but I am not an Admin. -->
1. Click `+ New application registration`, provide the following information:
    * `Name` - for example `alo365collector`.
    * Select `Web app/ API` as `Application type`.
    * In `Sign-on URL` enter a URL (for example `http://alo365collector.com`). 
    **Note:** This information is not used anywhere within your subscription.
1. Click `Create`.
1.From the `All applications` tab on the `App registration (Preview)` blade, select `All apps`, and then click the application name you created. 
1. Make a note of the `Application ID` (for example, `a261478c-84fb-42f9-84c2-de050a4babe3`).

## Set Up the Required Active Directory Security Permissions

1. On the `Settings` panel under the newly created application, select `Required permissions`, and then click `+ Add`.
1. Click `Select an API` > `Office 365 Management APIs`, and then click `Select`.
1. In `Application permissions`, click `Read service health information for your organization` > `Read activity data for your organization` > `Read threat intelligence data for your organization` > `Read activity reports for your organization`. 
1. Click `Select`, and then click `Done`.
1. Click `Grant Permissions`, and then click `Yes`. 
**Note:** Only the Active Directory tenant administrator can grant permissions to an Azure Active Directory application.
1. On the `Settings` panel for the application, select `Keys`.
1. Type a key `Description` and set `Duration` to `Never expires` then click `Save`.
**Note:** Save the key value, which you need during ARM template deployment.
1. From the `Registered App` blade, click the link under `Managed application in local directory`, and then click `Properties`.
1. Get the `Service Principal ID` associated with the application. The `Service Principal ID`is labeled as `Object ID` on the properties page.
**Caution:** This ID not the same `Object ID` found under the `Registered app` view or under `Settings`.

## Create an Alert Logic Access Key

**From the Bash command line in [Azure Cloud Shell](https://docs.microsoft.com/en-us/azure/cloud-shell/quickstart), run the following commands, where `<username>` is your Alert Logic user name and `<password>` is your Alert Logic password:**

```
export AL_USERNAME='<username>'
auth=$(curl -SX POST -u $AL_USERNAME https://api.global-services.global.alertlogic.com/aims/v1/authenticate); export AL_ACCOUNT_ID=$(echo $auth | jq -r '.authentication.account.id'); export AL_USER_ID=$(echo $auth | jq -r '.authentication.user.id'); export AL_TOKEN=$(echo $auth | jq -r '.authentication.token'); if [ -z $AL_TOKEN ]; then echo "Authentication failure"; else roles=$(curl -SX GET -H "x-aims-auth-token: $AL_TOKEN" https://api.global-services.global.alertlogic.com/aims/v1/$AL_ACCOUNT_ID/users/$AL_USER_ID/roles | jq -r '.roles[].name'); if [ "$roles" != "Administrator" ]; then echo "The $AL_USERNAME doesn’t have Administrator role. Assigned role is '$roles'"; else curl -SX POST -H "x-aims-auth-token: $AL_TOKEN" https://api.global-services.global.alertlogic.com/aims/v1/$AL_ACCOUNT_ID/users/$AL_USER_ID/access_keys | jq .; fi; fi; unset AL_USERNAME;
```

**For accounts with multi-factor authentication (MFA) enabled:**
```
export AL_USERNAME='<username>'
auth=$(curl -SX POST -d '{"mfa_code": "<mfa_code_here>" }' -u $AL_USERNAME https://api.global-services.global.alertlogic.com/aims/v1/authenticate); export AL_ACCOUNT_ID=$(echo $auth | jq -r '.authentication.account.id'); export AL_USER_ID=$(echo $auth | jq -r '.authentication.user.id'); export AL_TOKEN=$(echo $auth | jq -r '.authentication.token'); if [ -z $AL_TOKEN ]; then echo "Authentication failure"; else roles=$(curl -SX GET -H "x-aims-auth-token: $AL_TOKEN" https://api.global-services.global.alertlogic.com/aims/v1/$AL_ACCOUNT_ID/users/$AL_USER_ID/roles | jq -r '.roles[].name'); if [ "$roles" != "Administrator" ]; then echo "The $AL_USERNAME doesn’t have Administrator role. Assigned role is '$roles'"; else curl -SX POST -H "x-aims-auth-token: $AL_TOKEN" https://api.global-services.global.alertlogic.com/aims/v1/$AL_ACCOUNT_ID/users/$AL_USER_ID/access_keys | jq .; fi; fi; unset AL_USERNAME;
```

An example of a successful response is:

```
{
  "access_key_id": "712c0b413eef41f6",
  "secret_key": "1234567890b3eea8880d292fb31aa96902242a076d3d0e320cc036eb51bf25ad"
}
```

**Note:** If the output is blank, please verify the Alert Logic user account permissions. You must have administrator access. For more information about AIMS APIs, see [Access and Identity Management Service
](https://console.product.dev.alertlogic.com/api/aims/).

Note the `access_key_id` and the `secret_key` values for use in the deployment steps below.

**Note:** An account can create only five access keys. If you receive a "limit exceeded" response, you must delete some keys to create more.  

Use the following command to list access keys:

```
curl -s -X GET -H "x-aims-auth-token: $AL_TOKEN" https://api.global-services.global.alertlogic.com/aims/v1/$AL_ACCOUNT_ID/users/$AL_USER_ID/access_keys | jq
```

Then use the selected access_key_id in the following curl command to delete the key:
```

curl -X DELETE -H "x-aims-auth-token: $AL_TOKEN" https://api.global-services.global.alertlogic.com/aims/v1/$AL_ACCOUNT_ID/users/$AL_USER_ID/access_keys/<ACCESS_KEY_ID_HERE>
```

## Download and Deploy the ARM Template 
You can use either the Microsoft Azure portal or a command line to deploy the template. To perform either procedure, you must log into the [Azure portal](https://portal.azure.com). 

**Note:** The steps in this section require an active Azure subscription. To verify your Azure subscrption, visit [Azure subscriptions blade](https://portal.azure.com/#blade/Microsoft_Azure_Billing/SubscriptionsBlade).

If your organization uses multiple Active Directory tenants, log into the same tenant used to [Register a New Office 365 Web Application](#register-a-new-office-365-web-application). To find your Office 365 tenant ID, see [Find your Office 365 tenant ID](https://support.office.com/en-gb/article/find-your-office-365-tenant-id-6891b561-a52d-4ade-9f39-b492285e2c9b).

### Deploy with the Custom ARM Template in an Azure Subscription
Click the button below to start deployment. 

[![Deploy to Azure](https://azuredeploy.net/deploybutton.png)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Falertlogic%2Fazure-collector%2Fmaster%2Ftemplate.json)

Provide the following required template parameters, and then click  `Purchase`.
   - `Name` - This is the name of the log source that will show in the Alert Logic UI
   - `Storage Name` - Any Storage Account name (that does not currently exist)
   - `Alert Logic Access Key ID` - `access_key_id` returned from AIMs [above](#create_an_alert_logic_access_key)
   - `Alert Logic Secret Key` - `secret_key` returned from AIMs [above](#create_an_alert_logic_access_key)
   - `Alert Logic API endpoint` - leave it as `api.global-services.global.alertlogic.com`
   - `Alert Logic Data Residency` - leave it as `default`
   - `Office365 Content Streams` - The list of streams you would like to collect.  Valid values are:
        - ["Audit.AzureActiveDirectory","Audit.Exchange","Audit.SharePoint","Audit.General", "DLP.All"]
   - `Service Principal ID` - The `Object ID` of the application that created the subscription. You can obtain it from _Azure_ -> _AD_ -> _App registrations_ -> _Your app name_ -> Link under _Managed application in local directory_ -> _Properties_ -> _Object ID_
   - `App Client ID` - The GUID of your application that created the subscription. You can obtain it from _Azure_ -> _AD_ -> _App registrations_ -> _Your app name_
   - `App Client Secret` - The secret key of your application from _App Registrations_

### Deploy with Azure CLI

You can use either [Azure Cloud Shell](https://docs.microsoft.com/en-gb/azure/cloud-shell/quickstart#start-cloud-shell) or local installation of [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest).

1. Execute the following command to create a new resource group. The example below creates a new resource group in the "Central US" location.
    ```
    az group create --name <new-resource-group-name> --location "Central US"
    ```
1. Access the `Resource groups` blade, and then select the new resource group.
1. Select `Access Control (IAM)`, and add the `Website Contributor` role to the Active Directory application identity you created above.
1. Use the following command to deploy a template. Enter required parameters when prompted.
    ```
    az group deployment create \
        --resource-group <new-resource-group-name> \
        --template-uri "https://raw.githubusercontent.com/alertlogic/azure-collector/master/template.json"
    ```

## Verify the Installation in Microsoft Azure
To verify successful installation of the Office 365 collector, perform the following steps in Azure:

<!--Is step 1 done in Office 365 or Azure?-->
1. Go to `Function Apps` and choose the Alert Logic O365 collector function. The recent log entry under `Functions-> Master-> Monitor` should read an OK status (Example: `O365 source checkin OK`) and should not contain any error messages.
1. Log into the Alert Logic console and navigate to Configuration > Deployments > All Deployments -> Log Sources -> Filter by `Push (Office 365, CloudWatch)` collection method. 
1. Check for a new Office 365 log source with the name you provided during during the deployment step above, and that the source status is `ok`.

# How It Works

The following Azure functions use Application/O365 tenant id (`APP_TENANT_ID` web application setting) as a `PublisherIdentifier` during Office 365 management API requests. For more information about `PublisherIdentifier`, see [Requesting content blobs and throttling](https://msdn.microsoft.com/en-us/office-365/troubleshooting-the-office-365-management-activity-api#requesting-content-blobs-and-throttling).

## Master Function

The `Master` function is a timer trigger function responsible for:
- Registering the Azure web app in Alertlogic backend;
- Reporting health-checks to the backed;
- Performing log source configuration updates, which happen through the Alertlogic console.

**Note:** When releasing a new version of the collector, remember to increment the version number in
npm package.json file. To display the current version locally, issue the command, `npm run local-version`.

## Updater Function

The `Updater` function is a timer triggered function that runs a deployment sync operation every 12 hours to keep the web application up to date.

## O365WebHook Function

The `O365WebHook` function exposes an HTTP API endpoint `https://<app-name>/o365/webhook`, which is registered as an [Office 365 webhook](https://msdn.microsoft.com/en-us/office-365/office-365-management-activity-api-reference#start-a-subscription) and processes Office 365 activity notifications. 

**Example notification**

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

A notification contains a link to the actual data retrieved by the `O365WebHook`, wrapped into a protobuf [structure](proto/common_proto.piqi.proto), and sent to the Alert Logic Ingest service.

**Note:** Audit content may not be available for up to 24 hours. For more information, see [Search the audit log in the Office 365 Security & Compliance Center](https://support.office.com/en-us/article/Search-the-audit-log-in-the-Office-365-Security-Compliance-Center-0d4d0f35-390b-4518-800e-0c7ec95e946c?ui=en-US&rs=en-US&ad=US#PickTab=BYB).

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
- `process.evn.APP_RESOURCE_GROUP` - The name of the resource group where your application is deployed.
- `process.env.CUSTOMCONNSTR_APP_CLIENT_ID` - The GUID of your application that created the subscription. You can obtain the GUID from _Azure_ -> _AD_ -> _App registrations_ -> _Your app name_
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
