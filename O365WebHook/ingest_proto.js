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
const crypto = require('crypto');

// FIXME - protobuf load
// We have to load PROTO_DEF every invocation. Maybe the solution can to to use
// another library such as bpf which compiles proto to js.
module.exports.load = function(context, callback) {
    protobuf.load(getCommonProtoPath(), function(err, root) {
        if (err)
            context.log.error('Unable to load proto files.', err);

        callback(err, root);
    });
};


module.exports.setMessage = function(context, root, content, callback) {
    async.reduce(content, [], function(memo, item, callback) {
            parseMessage(context, root, memo, item, callback);
        },
        function(err, result) {
            if (err)
                context.log.error('Unable to build messages.');

            callback(err, result);
        }
    );
};


module.exports.setHostMetadata = function(context, root, content, callback) {
    var hostmetaType = root.lookupType('host_metadata.metadata');
    var hostmetaData = getHostmeta(context, root);
    var meta = {
        hostUuid : process.env.O365_HOST_ID,
        data : hostmetaData,
        dataChecksum : new Buffer('')
    };
    var sha = crypto.createHash('sha1');
    var hashPayload = hostmetaType.encode(meta).finish();
    hashValue = sha.update(hashPayload).digest();
    
    var metadataPayload = {
        hostUuid : process.env.O365_HOST_ID,
        dataChecksum : hashValue,
        timestamp : Math.floor(Date.now() / 1000),
        data : hostmetaData
    };

    build(hostmetaType, metadataPayload, function(err, buf) {
        if (err)
            context.log.error('Unable to build host_metadata.');

        return callback(err, buf);
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
            context.log.error('Unable to build collected_batch.');

        return callback(err, buf);
    });
};


module.exports.setBatchList = function(context, root, batches, callback) {
    var batchListType = root.lookupType('common_proto.collected_batch_list');

    var batchListPayload = {
        elem: [batches]
    };

    build(batchListType, batchListPayload, function(err, buf) {
        if (err)
            context.log.error('Unable to build collected_batch_list.');

        return callback(err, buf);
    });
};

module.exports.encode = function(context, root, batchList, callback) {
    var batchListType = root.lookupType('common_proto.collected_batch_list');
    var buf = batchListType.encode(batchList).finish();
    return callback(null, buf);
};


// Private functions

function build(type, payload, callback) {
    var verify = type.verify(payload);
    if (verify)
        return callback(verify);

    var payloadCreated = type.create(payload);

    return callback(null, payloadCreated);
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
            context.log.error('Unable to build collected_message.');

        memo.push(buf);
        return callback(err, memo);
    });
}

function getHostmeta(context, root) {
    var dictType = root.lookupType('alc_dict.dict');
    var elemType = root.lookupType('alc_dict.elem');
    var valueType = root.lookupType('alc_dict.value');

    var hostTypeElem = {
        key: 'host_type',
        value: {str: 'azure_fun'}
    };
    var localHostnameElem = {
        key: 'local_hostname',
        value: {str: process.env.WEBSITE_HOSTNAME}
    };
    var dict = {
        elem: [localHostnameElem, hostTypeElem]
    };
    
    return buildSync(dictType, dict);
}


function getCommonProtoPath() {
    return path.join(__dirname, '../', 'proto', 'common_proto.piqi.proto');
}
