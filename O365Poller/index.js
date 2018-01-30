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
const moment = require('moment');

const m_o365mgmnt = require('../lib/o365_mgmnt');
const m_state = require('./liststate');

const PAGES_COUNT = 5;

// One content notification is about 500 bytes.
// Max Azure queue message size is 48K when using base64.
const NOTIFICATION_BATCH_LENGTH = 3; 

var processStream = function(stream, listState, callback) {
    m_o365mgmnt.subscriptionsContent(
        stream, listState.listStartTs, null,
        function(listError, listResult, httpRequest, response) {
            return processListResponse(listError, 
                listResult,
                httpRequest,
                response,
                PAGES_COUNT,
                callback 
            );
    });
};

var processListResponse = function(listError,
        listResult, httpRequest, response, pageCount, callback) {
    if (listError) {
        return callback(listError);
    } else {
        if (pageCount > 0 && response.headers.nextpageuri) {
            m_o365mgmnt.getContent(response.headers.nextpageuri, 
                function(getError, newResult, newHttpRequest, newResponse) {
                    return processListResponse(getError, 
                            listResult.concat(newResult),
                            newHttpRequest,
                            newResponse,
                            pageCount - 1,
                            callback);
            });
        } else {
            return callback(null, listResult);
        }
    }
};

var fillOutputQueues = function(context, contentResults) {
    // Put content notifications into output binding queue.
    context.bindings.O365ContentMsg = [];
    for (var i = 0; i < contentResults.length; i++) {
        var streamContent = contentResults[i];
        context.log.info('Content length:', 
            streamContent.streamName, streamContent.contentList.length);
        const batchesCount = 
            Math.ceil(streamContent.contentList.length / NOTIFICATION_BATCH_LENGTH);
        for (var j = 0; streamContent.contentList.length && j < batchesCount; ++j) {
            var notificationBatch = JSON.stringify(streamContent.contentList.slice(
                    j * NOTIFICATION_BATCH_LENGTH, 
                    (j + 1) * NOTIFICATION_BATCH_LENGTH));
            context.bindings.O365ContentMsg.push(notificationBatch);
        }
    }
    
    // Put content list state into output binding queue.
    var newCollectState = m_state.getCollectState(contentResults);
    context.bindings.O365ListState = [];
    context.bindings.O365ListState.push(JSON.stringify(newCollectState));
    
    return context;
};

module.exports = function (context, AlertlogicO365ListTimer) {
    m_state.fetch(function(stateErr, currentState, stateMsg) {
        if (stateErr) {
            context.log.info('Singleton protection.');
            context.done();
        } else {
            async.map(JSON.parse(process.env.O365_CONTENT_STREAMS), 
                function(stream, asyncCallback) {
                    var streamListState = m_state.getStreamListState(stream, currentState);
                    context.log.info('Listing content:', streamListState);
                    processStream(stream, streamListState, function(listErr, listResult) {
                        if (listErr) {
                            return asyncCallback(listErr);
                        } else {
                            var result = {
                                streamName : stream,
                                contentList : listResult,
                                listTs : moment.utc().format()
                            };
                            return asyncCallback(null, result);
                        }
                        
                    });
                },
                function(mapError, mapResult) {
                    if (mapError) {
                        context.done(mapError);
                    } else {
                        var resultContext = fillOutputQueues(context, mapResult);
                        m_state.commit(stateMsg, function(commitErr){
                            if (commitErr) {
                                resultContext.log.error(`Recollection is likely to happen $currentState.`);
                                resultContext.done(commitErr);
                            } else {
                                resultContext.log.info('Publishing notifications done.');
                                resultContext.done();
                            }
                        });
                    }
            });
        }
    });
};
