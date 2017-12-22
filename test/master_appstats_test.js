/* -----------------------------------------------------------------------------
 * @copyright (C) 2017, Alert Logic, Inc
 * @doc
 * 
 * Unit tests for Master function
 * 
 * @end
 * -----------------------------------------------------------------------------
 */

var testMock = require('./mock');
 
var assert = require('assert');
var rewire = require('rewire');
var sinon = require('sinon');

var m_appstats = rewire('../Master/appstats');

describe('Master Function appstats.js Units', function() {
    var private_assignStringToJson;
    
    before(function() {
        private_assignStringToJson = m_appstats.__get__('assignStringToJson');
    });
    after(function() {
    });
    beforeEach(function() {
    });
            
    describe('Azure web application statistics tests', function() {
        it('checks assignStringToJson() - simple', function(done) {
            var expected = JSON.stringify(
                {
                    'a':'1',
                    'b':'2',
                    'c':'3',
                }
            );
            assert.equal(expected, JSON.stringify(private_assignStringToJson('a=1;b=2;c=3')));
            done();
        });
        it('checks assignStringToJson() - actual', function(done) {
            var expected = JSON.stringify(
                {
                    'DefaultEndpointsProtocol':'https',
                    'AccountName':'testaccount',
                    'AccountKey':'S0me+Rea1+Key+Here==',
                }
            );
            assert.equal(expected, JSON.stringify(private_assignStringToJson('DefaultEndpointsProtocol=https;AccountName=testaccount;AccountKey=S0me+Rea1+Key+Here==')));
            done();
        });
        /*it('checks getFunctionStats()', function(done) {
            this.timeout(50000);
            m_appstats.getAppStats('2017-12-22T14:31:39', function(err, stats) {
                console.log(JSON.stringify(stats));
                done();
            });
        });*/
        
    });
});
