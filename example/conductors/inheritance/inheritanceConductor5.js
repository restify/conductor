'use strict';

var rc = require('../../../lib');

// leaving empty arrays in your handlers is a bit silly though,
// and really hard to plan ahead.
// why not use numerical keys?

var parentConductor = rc.createConductor({
    name: 'parentInheritanceConductor',
    handlers: {
        10: [
            function timestamp(req, res, next) {
                req.data = {
                    timestamp: new Date()
                };
                return next();
            }
        ],
        30: [
            function render(req, res, next) {
                // render
                res.send(200, req.data);
                return next();
            }
        ]
    }
});

// we can use keys to random insert/append/prepend handlers in our stack.
// numerical keys that are duplicated get appended to by child conductors.
// that means the concatted handlers look like this:
// [
//     10: [ timestamp, dataA ],
//     20: [ dataB ],
//     30: [ render ]
// ]
//
// and when it's flattened, the handler stack looks like:
// [ timestamp, dataA, dataB, render ]

module.exports = rc.createConductor({
    name: 'inheritanceConductor4',
    deps: [parentConductor],
    handlers: {
        10: [
            function dataA(req, res, next) {
                req.data.a = 1;
                return next();
            }
        ],
        20: [
            function dataB(req, res, next) {
                req.data.b = 2;
                return next();
            }
        ]
    }
});
