'use strict';

var _ = require('lodash');
var assert = require('assert-plus');
var rc = require('../../../lib');
var md5 = require('../../models/ip');
var posts = require('../../models/posts');
var userAgent = require('../../models/userAgent');

// it is possible to fetch multiple async models in series.
// while this not desirable from a perf persepctive, it is sometimes necessary.
// by using an object instead of array for the models configuration,
// you can specify different 'buckets' of models to fetch.

module.exports = rc.createConductor({
    name: 'modelConductor4',
    models: {
        bucketA: [md5, userAgent],
        bucketB: [posts]
    },
    handlers: [
        rc.handlers.buildModels('bucketA'),
        function check(req, res, next) {
            var ipModel = rc.getModels(req, 'ip');
            var uaModel = rc.getModels(req, 'userAgent');

            // the md5 and user agent models are done!
            assert.ok(ipModel);
            assert.ok(uaModel);

            return next();
        },
        rc.handlers.buildModels('bucketB'),
        function render(req, res, next) {
            var allModels = rc.getModels(req);

            // make sure we got three models
            assert.equal(_.size(allModels), 3);

            // put together a payload by looping through all the models,
            // and creating a key/val pair of model names to their
            // contents.
            var out = _.reduce(
                allModels,
                function(acc, model) {
                    acc[model.name] = model.data;
                    return acc;
                },
                {}
            );

            // render the model data
            res.send(200, out);
            return next();
        }
    ]
});
