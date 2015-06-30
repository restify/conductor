'use strict';

var rc = require('../../../lib');


// what if we want to prepend to the existing stack?
// we'll have to build our original conductor slightly differently.

var parentConductor = rc.createConductor({
    name: 'parentInheritanceConductor',
    handlers: [
        [],  // empty array, on purpose
        [
            function render(req, res, next) {

                // render
                res.send(200, 'Name: ' + req.name, next);
                return next();
            }
        ]
    ]
});


// so our conductor is now inheriting from parent conductor.
// it will line up the array of arrays in the handlers and concat the arrays.
// that means the concatted handlers look like this:
// [
//      [ timestamp ],
//      [ render ]
// ]
//
// and when it's flattened, the handler stack looks like:
// [ timestamp, render ]

module.exports = rc.createConductor({
    name: 'inheritanceConductor4',
    deps: [ parentConductor ],
    handlers: [
        [
            function addName(req, res, next) {
                req.name = 'inheritanceConductor4';
                return next();
            }
        ],
        []
    ]
});

