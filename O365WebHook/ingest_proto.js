/* -----------------------------------------------------------------------------
 * @copyright (C) 2017, Alert Logic, Inc
 * @doc
 *
 * Use protobuf to create an ingest payload.
 *
 * @end
 * -----------------------------------------------------------------------------
 */


const protobuf = require('protobufjs');
const async = require('async');
const Long = require('long');
const path = require('path');

// FIXME - protobuf load
// We have to load PROTO_DEF every invocation. Maybe the solution can to to use
// another library such as bpf which compiles proto to js.
module.exports.load = function(context, callback) {
    protobuf.load(getCommonProtoPath(), function(err, root) {
        if (err)
            context.log('Error: Unable to load proto files.', err);

        callback(err, root);
    });
};


module.exports.setMessage = function(context, root, content, callback) {
    async.reduce(content, [], function(memo, item, callback) {
            parseMessage(context, root, memo, item, callback);
        },
        function(err, result) {
            if (err)
                context.log('Error: Unable to build messages.');

            callback(err, result);
        }
    );
};


module.exports.setHostMetadata = function(context, root, content, callback) {
    var hostmetaType = root.lookupType('host_metadata.metadata');

    var metadataPayload = {
        // FIXME - we need to calculate checksum properly
        dataChecksum: new Buffer.from([234,104,231,10,12,60,139,208,204,230,
                          236,248,60,113,61,93,52,49,18,194]),
        timestamp: Math.floor(Date.now() / 1000),
        data: dummyMetadataDict(context, root)
    };

    build(hostmetaType, metadataPayload, function(err, buf) {
        if (err)
            context.log('Error: Unable to build host_metadata.');

        callback(err, buf);
    });
};


module.exports.setBatch = function(context, root, metadata, messages, callback) {
    var batchType = root.lookupType('common_proto.collected_batch');

    var batchPayload = {
        sourceId: process.env.O365_COLLECTOR_ID,
        metadata: metadata,
        message: messages
    };

    build(batchType, batchPayload, function(err, buf) {
        if (err)
            context.log('Error: Unable to build collected_batch.');

        callback(err, buf);
    });
};


module.exports.setBatchList = function(context, root, batches, callback) {
    var batchListType = root.lookupType('common_proto.collected_batch_list');

    var batchListPayload = {
        elem: [batches]
    };

    build(batchListType, batchListPayload, function(err, buf) {
        if (err)
            context.log('Error: Unable to build collected_batch_list.');

        callback(err, buf);
    });
};

module.exports.encode = function(context, root, batchList, callback) {
    var batchListType = root.lookupType('common_proto.collected_batch_list');
    var buf = batchListType.encode(batchList).finish();
    callback(null, buf);
};


// Private functions

function build(type, payload, callback) {
    var verify = type.verify(payload);
    if (verify)
        return callback(verify);

    var payloadCreated = type.create(payload);

    callback(null, payloadCreated);
}


function buildSync(type, payload) {
    var verify = type.verify(payload);
    if (verify)
        throw("Error: Protobuf build failed. " + verify);

    return type.create(payload);
}


function parseMessage(context, root, memo, content, callback) {
    var messageType = root.lookupType('common_proto.collected_message');

    var messagePayload = {
        messageTs: content.message_ts,
        priority: 11,
        progName: 'o365webhook',
        pid: undefined,
        message: content.message,
        messageType: 'json/azure.o365',
        messageTypeId: content.record_type,
        messageTsUs: undefined
    };

    build(messageType, messagePayload, function(err, buf) {
        if (err)
            context.log('Error: Unable to build collected_message.');

        memo.push(buf);
        callback(err, memo);
    });
}

// TODO - Fill Metadata dictionary with some dummy content.
// FIXME - we need to use some real data in metadata
function dummyMetadataDict(context, root) {
    var dictType = root.lookupType('alc_dict.dict');
    var elemType = root.lookupType('alc_dict.elem');
    var valueType = root.lookupType('alc_dict.value');

    var val1 = {str: 'standalone'};
    var valPayload1 = buildSync(valueType, val1);

    var val2 = {str: '454712-mnimn2.syd.intensive.int'};
    var valPayload2 = buildSync(valueType, val2);

    var elem1 = {
        key: 'host_type',
        value: val1
    };
    var elemPayload1 = buildSync(elemType, elem1);

    var elem2 = {
        key: 'local_hostname',
        value: val2
    };
    var elemPayload2 = buildSync(elemType, elem2);

    var dict = {
        elem: [elem1, elem2]
    };
    var dictPayload = buildSync(dictType, dict);

    return dictPayload;
}


function getCommonProtoPath() {
    return path.join(__dirname, '../', 'proto', 'common_proto.piqi.proto');
}
