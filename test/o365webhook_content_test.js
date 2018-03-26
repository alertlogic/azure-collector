/* -----------------------------------------------------------------------------
 * @copyright (C) 2018, Alert Logic, Inc
 * @doc
 * 
 * Unit tests for O365WebHook function
 * 
 * @end
 * -----------------------------------------------------------------------------
 */
 
var assert = require('assert');
var rewire = require('rewire');
var sinon = require('sinon');

var testMock = require('./mock');
var m_o365mgmnt = require('../lib/o365_mgmnt');
var m_ingest = require('../O365WebHook/ingest');
var m_o365content = rewire('../O365WebHook/o365content');

describe('O365WebHook Function o365content.js units.', function() {
    var ingestSendStub;
    var clock;
    
    before(function() {
        clock = sinon.useFakeTimers();
        ingestSendStub = sinon.stub(m_ingest.Ingest.prototype, 'sendO365Data');
    });
    after(function() {
        ingestSendStub.restore();
        clock.restore();
    });
    beforeEach(function() {
        ingestSendStub.resetHistory();
    });
    afterEach(function() {
    });
            
    describe('processNotifications()', function() {
        it('batch content is successfully fetched and sent to Ingest', function(done) {
            process.env.O365_COLLECTOR_ID = 'o365-collector-id';
            var private_MAX_BATCH_MESSAGES = m_o365content.__set__('MAX_BATCH_MESSAGES', 2);
            const expectedCompressed = '789ced543d6f1c45180e1f4dce02640322b284582d148974b39ed999fd3a1a2e760296631cf98e0411216b76e6ddbbf1eded1cbb73c176e48a0689825f40454587e89152f20bf807f4fc0466f68ed80e29ac5414de62747bf33ceffbecfbf174fe7aafb3aa691c21a1cb1284d1355272edbb573aefc2916a8caa46176fde79fbfbc33f7f7fe3ae7afae11f1ffcf074f5f5d77e79f4d38d6bfe7e27eebc596ac1cb83b16e4cc5a7b0f6d1ba3f99cc4fa6aa427c36432e4dc04fe6357c0b79a30c344105a673a373dd310eccf10cd656d6afb78883625eadffbcb2faeb8fbf7d75cd3eefafd8c35f71212c79acf524fcbbf3c4efcf66a512dc285d6d4bbfe70bc67286538a689e63c4324150ce1289b2844144452e0b2afcae3fe4f508cca6ae0c1c99969817a9a4a1a488084211636982788143946299f330a4314ba36744bff7e8893fb472fd1eeefadb5b969f6449c15216a39c639bb89089fdc528925c90222d628a09f54fbfb6e8cad47c70dc18982e149324e1981224716c13276986d2844a7bf02263491c6618fb2d0dea05ad69793c032178c150ca8ac4f2044359665f0b9aa5592e499a65dcf2faae6fdbb3be9435348de5a54940080d923888d27fef5fa2105f34503fab807bd98163cb2618536c9f3ec9ee92db847ec2cbb69dbc84da947aa444a0aba912b56e746102a1a736d63e34f3d20c0c3773a77030170240826caf84aee5221189bafe5e3de2953a396bf825e5eecda06e4996e2d4ded3a311c8edca55d6856161c448c47394c69021c6c1ce4d460a141399b054863c25a1c56eda2f7151866a6a05f9212629c214856448921ec63dea400fa06eda4ca4eb3fd4f5a4d4dca5e8bb3ad872abc7b0a5ea769f8e5dc8524165b6efffb7357bf9a145b5f22e355d8b3eb4f8e5d65daafa2fd275e7b1d5b4ac7ad7bf7364a0b2fdb85f6b5b46a3a06917e0012fe7ae0abbfa449525df8802ecdddce542554637e38f3d37b2a567fff0f606de971ec107d94174cb732b0b0f21df516623a2494063efe6ce67c3dd7b5daf5413f03e0531d1b7bccd71ada7b0611d030794865140e2d01bf082d76a49b3da3fe76d1fdc77f74756b27fda3dd3459e03cccdd842966eb10b66ace505fc9e43843d77ea5a9dc0197d1fbe9943b328c879463ba976abce01cf26790b0c57e505fcb09e9f8bba0330db85811a55ed243a7368b7f105ee92038f44ce841d36965a5b0386f2308c50ca4511c6219504789b69418b96b4cb8fc119972eb9cf6fb2d577da7bebb0d1d5461b2c70567cfb55125db9f4954b5fb9f4954b5fb9f4ffd9a5ff0103b89f11';
            ingestSendStub.resolves('ok');
            var msGetContentStub = sinon.stub(m_o365mgmnt, 'getContent');
            msGetContentStub.callsFake(
                function fakeFn(contentUri, callback) {
                    return callback(null, testMock.o365Content);
            });
            
            m_o365content.processNotifications(testMock.context, testMock.webhookNotifications,
                function(err) {
                    if (err)
                        return done(err);
                    
                    sinon.assert.callCount(msGetContentStub, 2);
                    sinon.assert.callCount(ingestSendStub, 2);
                    //sinon.assert.calledWith(ingestSendStub, new Buffer(expectedCompressed, 'hex'));
                    msGetContentStub.restore();
                    done();
            });
        });
        
        it('Ingest send error', function(done) {
            process.env.O365_COLLECTOR_ID = 'o365-collector-id';
            var private_MAX_BATCH_MESSAGES = m_o365content.__set__('MAX_BATCH_MESSAGES', 2);
            ingestSendStub.rejects(new Error('StatusCodeError: 503'));
            var msGetContentStub = sinon.stub(m_o365mgmnt, 'getContent');
            msGetContentStub.callsFake(
                function fakeFn(contentUri, callback) {
                    return callback(null, testMock.o365Content);
            });
            m_o365content.processNotifications(testMock.context, testMock.webhookNotifications,
                function(err) {
                    sinon.assert.callCount(msGetContentStub, 2);
                    sinon.assert.callCount(ingestSendStub, 1);
                    assert.equal(err, 'Unable to send to Ingest. Error: StatusCodeError: 503');
                    msGetContentStub.restore();
                    done();
            });
        });
        
        it('content fetch error', function(done) {
            process.env.O365_COLLECTOR_ID = 'o365-collector-id';
            var private_MAX_BATCH_MESSAGES = m_o365content.__set__('MAX_BATCH_MESSAGES', 2);
            ingestSendStub.resolves('ok');
            const expectedError = 'Fetch error';
            var msGetContentStub = sinon.stub(m_o365mgmnt, 'getContent');
            msGetContentStub.callsFake(
                function fakeFn(contentUri, callback) {
                    return callback(expectedError);
            });
            m_o365content.processNotifications(testMock.context, testMock.webhookNotifications,
                function(err) {
                    sinon.assert.callCount(msGetContentStub, 1);
                    sinon.assert.callCount(ingestSendStub, 0);
                    assert.equal(err, expectedError);
                    msGetContentStub.restore();
                    done();
            });
        });
        
        it('get content slices', function(done) {
            var private_getSliceIndexes = m_o365content.__get__('getSliceIndexes');
            var private_MAX_BATCH_MESSAGES = m_o365content.__get__('MAX_BATCH_MESSAGES');
            var actual = private_getSliceIndexes(1);
            assert.deepEqual(actual, [{start : 0, end : private_MAX_BATCH_MESSAGES}]);
            
            actual = private_getSliceIndexes(private_MAX_BATCH_MESSAGES);
            assert.deepEqual(actual, [{start : 0, end : private_MAX_BATCH_MESSAGES}]);
            
            actual = private_getSliceIndexes(private_MAX_BATCH_MESSAGES + 1);
            assert.deepEqual(actual, [{start : 0, end : private_MAX_BATCH_MESSAGES},
                                      {start : private_MAX_BATCH_MESSAGES, end : 2 * private_MAX_BATCH_MESSAGES}]);
            
            actual = private_getSliceIndexes(2 * private_MAX_BATCH_MESSAGES);
            assert.deepEqual(actual, [{start : 0, end : private_MAX_BATCH_MESSAGES},
                                      {start : private_MAX_BATCH_MESSAGES, end : 2 * private_MAX_BATCH_MESSAGES}]);
            
            actual = private_getSliceIndexes(2 * private_MAX_BATCH_MESSAGES + 1);
            assert.deepEqual(actual, [{start : 0, end : private_MAX_BATCH_MESSAGES},
                                      {start : private_MAX_BATCH_MESSAGES, end : 2 * private_MAX_BATCH_MESSAGES},
                                      {start : 2 * private_MAX_BATCH_MESSAGES, end : 3 * private_MAX_BATCH_MESSAGES}]);
                                      
            done();
        });
        
    });
});
