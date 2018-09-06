'use strict';

var rc = require('../../../lib');
var propsConductor = require('../props/propsConductor').propsConductor;

// while inheriting, we can also append to the existing handler stack.

module.exports = rc.createConductor({
    name: 'inheritanceConductor3',
    deps: [propsConductor],
    handlers: [
        [
            function postRender(req, res, next) {
                req.log.info(
                    'Not much we can do here since we already rendered \
                    the response.'
                );
                return next();
            }
        ]
    ]
});
