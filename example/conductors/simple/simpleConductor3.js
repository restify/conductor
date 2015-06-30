'use strict';

var rc = require('../../../lib');


// you can also pass in an array of arrays.
// this becomes extremely useful when working
// with inherited conductors.
// the array index determines order of execution.

module.exports = rc.createConductor({
    name: 'simpleConductor3',
    handlers: [
        [
            function addName(req, res, next) {
                // put a random attribute on the request
                req.name = 'simpleConductor3';
                return next();
            },
            function addMessage(req, res, next) {
                // put a random attribute on the request
                req.message = 'success';
                return next();
            }
        ],
        [
            function render(req, res, next) {

                res.send(200, 'hello world: ' + req.name +
                           ' ' + req.message + '!');
                return next();
            }
        ]
    ]
});
