var devConfig = require('./dev_config');
var azureFunction = require('../Master/index');


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

// Local development timer object
var timer = {
    isPastDue: false,
    last: '2017-08-03T13:30:00',
    next: '2017-08-03T13:45:00'
};

// Local development context
var debugContext = {
    invocationId: 'ID',
    bindings: {
        req
    },
    log: {
        error : function() {
            var util = require('util');
            var val = util.format.apply(null, arguments);
            return console.log('ERROR:', val);
        },
        warning : function() {
            var util = require('util');
            var val = util.format.apply(null, arguments);
            return console.log('WARNING:', val);
        },
        info : function() {
            var util = require('util');
            var val = util.format.apply(null, arguments);
            return console.log('INFO:', val);
        },
        verbose : function() {
            var util = require('util');
            var val = util.format.apply(null, arguments);
            return console.log('VERBOSE:', val);
        }
    },
    done: function () {
        console.log('Response:', this.res);
    },
    res: null
};

// Call the azureFunction locally with your testing params
azureFunction(debugContext, timer);

