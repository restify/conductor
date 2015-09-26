// jscs:disable maximumLineLength

'use strict';

var chai       = require('chai');
var _          = require('lodash');
var restify    = require('restify-clients');
var demoServer = require('../example/demo');

var assert = chai.assert;
var client = restify.createJsonClient({
    url: 'http://localhost:3000'
});
var stringClient = restify.createStringClient({
    url: 'http://localhost:3000'
});



// star tests
describe('Integration tests using the demo app', function() {

    before(function(done) {
        demoServer.listen(3000, done);
    });

    describe('Simple handler chains', function() {
        it('should return hello world', function(done) {
            stringClient.get('/simple', function(err, req, res, data) {
                assert.ifError(err);
                assert.equal(data, 'hello world!');
                done();
            });
        });

        it('should return hello world and conductor name', function(done) {
            stringClient.get('/simple2', function(err, req, res, data) {
                assert.ifError(err);
                assert.equal(data, 'hello world: simpleConductor2!');
                done();
            });
        });

        it('should return hello world, conductor name, and message', function(done) {
            stringClient.get('/simple3', function(err, req, res, data) {
                assert.ifError(err);
                assert.equal(data, 'hello world: simpleConductor3 success!');
                done();
            });
        });

        it('should stop execution of handler chain when calling redirect', function(done) {
            stringClient.get('/simple4', function(err, req, res, data) {
                assert.ifError(err);
                assert.equal(res.statusCode, 302);
                assert.notEqual(res.body, 'hello world!');
                done();
            });
        });
    });

    describe('Props', function() {
        it('should return success due to ok query (props1)', function(done) {
            stringClient.get('/props?search=hello', function(err, req, res, data) {
                assert.ifError(err);
                assert.equal(data, 'searchQuery: hello');
                done();
            });
        });

        it('should return 400 due to invalid query (props1)', function(done) {
            client.get('/props?search=foo', function(err, req, res, data) {
                assert.ok(err);
                assert.equal(res.statusCode, 400);
                assert.equal(data.code, 'BadRequestError');
                assert.equal(data.message, 'query not allowed!');
                done();
            });
        });

        it('should return success due to ok query (props2)', function(done) {
            client.get('/props2?search=hello', function(err, req, res, data) {
                assert.ifError(err);
                assert.equal(data, 'searchQuery: hello');
                done();
            });
        });


        it('should return 400 due to invalid query (props2)', function(done) {
            client.get('/props2?search=baz', function(err, req, res, data) {
                assert.ok(err);
                assert.equal(res.statusCode, 400);
                assert.equal(data.code, 'BadRequestError');
                assert.equal(data.message, 'query not allowed!');
                done();
            });
        });
    });

    describe('models', function() {
        it('should return local models defined in array', function(done) {
            client.get('/model?search=baz', function(err, req, res, data) {
                assert.ifError(err);
                assert.isString(data.userAgent);
                assert.isObject(data.serverEnv);
                done();
            });
        });

        it('should return local models defined in object', function(done) {
            client.get('/model2?search=baz', function(err, req, res, data) {
                assert.ifError(err);
                assert.isString(data.userAgent);
                assert.isObject(data.serverEnv);
                done();
            });
        });

        it('should return remote models', function(done) {
            this.timeout(10000);

            client.get('/model3?userId=2', function(err, req, res, data) {
                assert.ifError(err);

                // assert ip model
                assert.isObject(data.ip);
                assert.isString(data.ip.ip);

                // assert posts model
                assert.isArray(data.posts);
                _.forEach(data.posts, function(post) {
                    assert.equal(post.userId, 2);
                    assert.isNumber(post.id);
                    assert.isString(post.title);
                    assert.isString(post.body);
                });
                done();
            });
        });

        it('should return custom models', function(done) {
            client.get('/model4', function(err, req, res, data) {
                assert.ifError(err);
                assert.equal(data.hello, 'world');
                assert.equal(data.async, true);
                done();
            });
        });

        it('should fetch two async models in series', function(done) {
            this.timeout(10000);

            client.get('/model5?text=helloworld', function(err, req, res, data) {
                assert.ifError(err);

                // assert ip model
                assert.isObject(data.ip);
                assert.isString(data.ip.ip);

                // assert posts model
                assert.isArray(data.posts);
                _.forEach(data.posts, function(post) {
                    assert.equal(post.userId, 2);
                    assert.isNumber(post.id);
                    assert.isString(post.title);
                    assert.isString(post.body);
                });

                done();
            });
        });
    });

    describe('inheritance', function() {

        it('should inherit from propsConductor, return success due to ok query (inherit1)', function(done) {
            client.get('/inherit?search=hello', function(err, req, res, data) {
                assert.ifError(err);
                assert.equal(data, 'searchQuery: hello');
                done();
            });
        });

        it('should inherit from propsConductor, return 400 due to invalid query (inherit1)', function(done) {
            client.get('/inherit?search=foo', function(err, req, res, data) {
                assert.ok(err);
                assert.equal(res.statusCode, 400);
                assert.equal(data.code, 'BadRequestError');
                assert.equal(data.message, 'query not allowed!');
                done();
            });
        });

        it('should return success due to ok query (inherit2)', function(done) {
            client.get('/inherit2?search=hello', function(err, req, res, data) {
                assert.ifError(err);
                assert.equal(data, 'searchQuery: hello');
                done();
            });
        });

        it('should return 400 due to invalid query (inherit2)', function(done) {
            client.get('/inherit2?search=override', function(err, req, res, data) {
                assert.ok(err);
                assert.equal(res.statusCode, 400);
                assert.equal(data.code, 'BadRequestError');
                assert.equal(data.message, 'query not allowed!');
                done();
            });
        });

        it('should work like inherit2 (inherit3)', function(done) {
            client.get('/inherit2?search=override', function(err, req, res, data) {
                assert.ok(err);
                assert.equal(res.statusCode, 400);
                assert.equal(data.code, 'BadRequestError');
                assert.equal(data.message, 'query not allowed!');
                done();
            });
        });

        it('should return conductor name (inherit4)', function(done) {
            client.get('/inherit4', function(err, req, res, data) {
                assert.ifError(err);
                assert.equal(data, 'Name: inheritanceConductor4');
                done();
            });
        });

        it('should return a proper data structure (inherit5)', function(done) {
            client.get('/inherit5', function(err, req, res, data) {
                assert.ifError(err);
                assert.equal(data.a, 1);
                assert.equal(data.b, 2);
                assert.isString(data.timestamp);
                done();
            });
        });
    });

    describe('sharding', function() {
        it('should return text response', function(done) {
            client.get('/shardText', function(err, req, res, data) {
                assert.ifError(err);
                assert.equal(data, 'name: text');
                done();
            });
        });

        it('should return json response', function(done) {
            client.get('/shardJson', function(err, req, res, data) {
                assert.ifError(err);
                assert.isObject(data);
                assert.equal(data.name, 'json');
                done();
            });
        });

        it('should shard into text response', function(done) {
            client.get('/shard?type=text', function(err, req, res, data) {
                assert.ifError(err);
                assert.equal(data, 'name: preshard');
                done();
            });
        });

        it('should shard into json response', function(done) {
            client.get('/shard?type=json', function(err, req, res, data) {
                assert.ifError(err);
                assert.isObject(data);
                assert.equal(data.name, 'preshard');
                done();
            });
        });
    });

});
