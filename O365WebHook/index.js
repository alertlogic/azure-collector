/* -----------------------------------------------------------------------------
 * @copyright (C) 2017, Alert Logic, Inc
 * @doc
 *
 * DEPRECATED: due to absence of SLA on notification delivery.
 *
 * The purpose of this function it to be registered as an O365 webhook and
 * receive/process notifications.
 * https://msdn.microsoft.com/en-us/office-365/office-365-management-activity-api-reference#receiving-notifications
 *
 * @end
 * -----------------------------------------------------------------------------
 */

const m_o365content = require('./o365content');


module.exports = function (context, event) {
    var eventBody = event.body;
    
    if (eventBody.validationCode) {
        // Pass webhook validation
        context.res.headers = {};
        context.res.status = 200;
        context.done();
    } else {
        return m_o365content.processNotifications(context, eventBody,
            function(err) {
                if (err) {
                    context.log.error(`${err}`);
                    context.res.headers = {};
                    context.res.status = 500;
                    context.done(err);
                } else {
                    context.log.info('OK!');
                    context.done();
                }
            });
    }
};
