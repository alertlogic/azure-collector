const assert = require('assert');
const formatO365Log = require('../O365WebHook/formatO365Log');
const mock = require('./mock');

describe('formatO365 units', function(){
    it('Formats a O365 log correctly', function(done){
        const logRecord = mock.o365Content[0];
        const formattedRecord = formatO365Log(logRecord);

        const expectedRecord = {
            messageTs: new Date(logRecord.CreationTime).getTime() / 1000,
            priority: 11,
            progName: 'o365webhook',
            pid: undefined,
            message: JSON.stringify(logRecord),
            messageType: 'json/azure.o365',
            messageTypeId: `${logRecord.RecordType}`,
            messageTsUs: undefined
        };


        assert.deepEqual(formattedRecord, expectedRecord);
        done();
    });
});
