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
            const expectedCompressed = '789ced544d6fdc44182e944b372a2801a42a12c2321c5a69c7f178c65fcb856dd242942ea9b24b8ba850349e79bd3b59af67b1674b922a272e481cf8059c387103ee483df20bf81dfc0466bc4b93941e228ec83e8cd63bcff3be8fdf8fa7f3abd75957240a115745015cab0a49b1f1ed6b9d77e158d65a96e3cb37efbcfdddd19fbfdfbc2f9f7ff0c7fbdf3f5f7fe3facf4f7ebc75cd3de8449d370bc559713851b52ed90c363edc74a7d3c5e94c9688cde7c8a6f1d8e9a2826f20aba586da2b41776e756e58c6a13e99c3c6dae68d0671982fcacd9fd6d67ff9e1b72faf99e7bd3573b86b3684214f949a067f759eb9fdf9bc909c69a9ca5de1f65c4e6946fd842092653ea229c728a3b140694c21243c1339e16ed71db16a0c7a5b951a8e7543ccf24490401084392688d224462cf70394f822634140229a842f886eefc9337764e4ba3dbfebeeee187e9cc6394d688432e69bc4b988cd2f4a90601ce7491e111f13f7ec2b832e75c58627b586d952318e63e6138c841f99c47192a22426c21c2c4f691c05a9efbb0d0daa25ad6e782c05ce594e5142f3d8f03845696a5e73922669267092a6ccf0fab66fbbf3be1015d4b5e125b18731f1e2c80b937feeff43213eafa17a5101fbb20727868d7d9ff8e6e9e3f43ebe8bc9c7ac68dac90aa874a1c6927baa9c495ea95ae5dae36a66621d40bd28f45033bdb00a870bce010488e68aab4a2c13e1b0ebee576356cad3f3865f51eefe1caa86642856ed03351e83d82d6d656d181a8414872c43490429a20cccdca438471116314d44c0121c18ecb6f9121b65246746901bf838413e41011ee1b8e7fb3d62418fa0aa9b4cb8eb3e56d5b450cca6e8db3a9872cba7b023ab669f4e6cc84242a9771ffebb35fbd9914135f2ae345dcb3e34f8d5d65da9faafd275efa9d1b4aa7ad7bd77aca134fd78582953462da16e16e0112b16b60a03752a8b826d859eefdc1e302e4badeac9478e1dd9c2317f38fb43e70b07fb87e96178c7b12b0b8f21db937a2b24b14722e7f6dea7a3c183ae53c829389f009faa3bcef6a45233d8328ee17b8404a187a3c019b29c55724533da3f634d1fec77f7c746b27bd63dd7855f022cf4c440566e31003d51e2127edf22829e3d55254fe19c7e005f2fa05e16e422a39954b3551780e793bc039ac9e2127e542d2e44dd03980f6028c7653389d61c9a6d7c85bb64c0429e516e868d26c6d680a22c084294309e0751400406d6645ad2c215edea6370ce252beecb9b6cf49df5de3aaa55b9d504f3ac15df7d1d87ad4bb72eddba74ebd2ad4bb72eddba74ebd2ad4bb72eddba74ebd2ad4bb72eddba74ebd2ff3f97fe1b97c0097e';
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
                    sinon.assert.callCount(ingestSendStub, 1);
                    sinon.assert.calledWith(ingestSendStub, new Buffer(expectedCompressed, 'hex'));
                    msGetContentStub.restore();
                    return done();
            });
        });
        
        it('Ingest send error', function(done) {
            process.env.O365_COLLECTOR_ID = 'o365-collector-id';
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
                    return done();
            });
        });
        
        it('content fetch error', function(done) {
            process.env.O365_COLLECTOR_ID = 'o365-collector-id';
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
                    return done();
            });
        });
        
    });
});
