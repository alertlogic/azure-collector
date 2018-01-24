/* -----------------------------------------------------------------------------
 * @copyright (C) 2018, Alert Logic, Inc
 * @doc
 *
 * The purpose of this function it to list O365 content periodically using
 * 'subscriptions/content' operation and publish content events into
 * a storage queue.
 *
 * @end
 * -----------------------------------------------------------------------------
 */
 
const async = require('async');

const m_o365mgmnt = require('../lib/o365_mgmnt');
const m_state = require('./liststate');

module.exports = function (context, AlertlogicO365ListTimer) {
    m_state.fetch(AlertlogicO365ListTimer, function(stateErr, state, stateMsg) {
        if (stateErr) {
            context.log.info('Singleton protection.');
            context.done();
        } else {
            context.log.info('Listing content:', state);
            m_o365mgmnt.subscriptionsContent(
                'Audit.General', state.listStartTs, state.listEndTs,
                function(listError, listResult, httpRequest, response) {
                    if (listError) {
                        context.done(listError);
                    } else {
                        console.log(response.headers);
                        context.log.info('Content length:', listResult.length);
                        context.bindings.O365ContentMsg = [];
                        context.bindings.O365ListState = [];
                        for (var i = 0; i < listResult.length; i++) {
                            context.bindings.O365ContentMsg.push(JSON.stringify(listResult[i]));
                        }
                        m_state.update(context, AlertlogicO365ListTimer, listResult, stateMsg,
                            function(updateErr, resultContext) {
                                if (updateErr) {
                                    context.log.error(`Recollection is likely to happen $state.`);
                                    resultContext.done(updateErr);
                                } else {
                                    context.log.info('Publishing notifications done.');
                                    resultContext.done();
                                }
                        });
                    }
            });
        }
    });
};
