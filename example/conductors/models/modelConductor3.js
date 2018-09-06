'use strict';

var _ = require('lodash');
var rc = require('../../../lib');
var ip = require('../../models/ip');
var posts = require('../../models/posts');

// now let's build an conductor that fetches
// models from a remote data source.
// the ip model data

module.exports = rc.createConductor({
    name: 'modelConductor3',
    models: {
        // this time, we're fetching a 'remote' model, which
        // means it is async. all models specified in the
        // key here must complete before we render.
        // these models are built in parallel!
        basic: [ip, posts]
    },
    handlers: [
        [
            rc.handlers.buildModels('basic'),
            function render(req, res, next) {
                var allModels = rc.getModels(req);

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
