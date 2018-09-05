'use strict';

var _ = require('lodash');
var assert = require('assert-plus');

var rc = require('../../../lib');
var userAgent = require('../../models/userAgent');
var serverEnv = require('../../models/serverEnv');

// models are also a first class concept. each conductor can specify a set of
// 'models', which are addressable buckets of data.

module.exports = rc.createConductor({
    name: 'modelConductor',
    models: [userAgent, serverEnv],
    handlers: [
        [
            // this is built in handler available to you.
            // it is a handler that builds all the models.
            rc.handlers.buildModels(),
            function render(req, res, next) {
                // once the models are built, let's get
                // their contents. we can get models by directly
                // using their names:

                var userAgentModel = rc.getModels(req, 'userAgent');
                var serverEnvModel = rc.getModels(req, 'serverEnv');

                // or we can pass no model names, and get back an array of all
                // models
                var allModels = rc.getModels(req);

                // these assertion statements are just to show the getters
                // working as expected.
                assert.equal(userAgentModel, allModels.userAgent);
                assert.equal(serverEnvModel, allModels.serverEnv);

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
    ]
});
