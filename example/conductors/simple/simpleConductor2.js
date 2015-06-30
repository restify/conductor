'use strict';

var rc = require('../../../lib');


// like any other framework, you can pass in an array
// of functions.

module.exports = rc.createConductor({
    name: 'simpleConductor2',
    handlers: [
        function addName(req, res, next) {
            // put a random attribute on the request
            req.name = 'simpleConductor2';
            return next();
        },
        function render(req, res, next) {

            res.send(200, 'hello world: ' + req.name + '!');
            return next();
        }
    ]
});
