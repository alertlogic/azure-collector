/* ----------------------------------------------------------------------------
 * @copyright (C) 2019, Alert Logic, Inc
 * @doc
 *
 * Log formatting function for O365 logs
 *
 * @end
 * ----------------------------------------------------------------------------
 */

const Parse = require('@alertlogic/al-collector-js').Parse;

module.exports = function(item) {
    //Paths from https://docs.microsoft.com/en-us/office/office-365-management-api/office-365-management-activity-api-schema#common-schema
    const creationTimePaths = [
        {path: ['CreationTime']}
    ];
    const messageTypeIdPaths = [
        {path: ['RecordType']}
    ];

    let message;
    try {
        message = JSON.stringify(item);
    }
    catch(err) {
        throw new Error(`Unable to stringify content. ${err}`);
    }

    let creationTime = Parse.getMsgTs(item, creationTimePaths);
    let messageTypeId = Parse.getMsgTypeId(item, messageTypeIdPaths);
    let formattedMsg = {
        messageTs: creationTime.sec,
        priority: 11,
        progName: 'o365webhook',
        message: message,
        messageType: 'json/azure.o365'
    };
    
    if (messageTypeId !== undefined && messageTypeId !== null) {
        formattedMsg.messageTypeId = `${messageTypeId}`;
    }
    if (creationTime.usec) {
        formattedMsg.messageTsUs = creationTime.usec;
    }
    return formattedMsg;
};
