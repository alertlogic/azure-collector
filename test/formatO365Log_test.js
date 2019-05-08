const assert = require('assert');
const formatO365Log = require('../O365WebHook/formatO365Log');
const mock = require('./mock');

describe('formatO365 units', function(){
    it('Formats a O365 log correctly, no optional properties', function(done){
        let logRecord = Object.assign({}, mock.o365Content[0]);
        delete logRecord.RecordType;
        const formattedRecord = formatO365Log(logRecord);

        const expectedRecord = {
            messageTs: new Date(logRecord.CreationTime).getTime() / 1000,
            priority: 11,
            progName: 'o365webhook',
            message: JSON.stringify(logRecord),
            messageType: 'json/azure.o365'
        };

        assert.deepEqual(formattedRecord, expectedRecord);
        done();
    });
    
    it('Formats a O365 log correctly, with optional properties', function(done){
        let logRecord = Object.assign({}, mock.o365Content[0]);
        logRecord.CreationTime = "2018-03-21T17:00:32.125Z";
        const formattedRecord = formatO365Log(logRecord);

        const expectedRecord = {
            messageTs: 1521651632,
            priority: 11,
            progName: 'o365webhook',
            message: JSON.stringify(logRecord),
            messageType: 'json/azure.o365',
            messageTypeId: `${logRecord.RecordType}`,
            messageTsUs: 125000
        };

        assert.deepEqual(formattedRecord, expectedRecord);
        done();
    });
});
