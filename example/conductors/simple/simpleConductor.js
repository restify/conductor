'use strict';

var rc = require('../../../lib');


// a super simple conductor that has only one handler on it:
// render a string 'hello world' to the client.

module.exports = rc.createConductor({
    name: 'simpleConductor',
    handlers: [
        function render(req, res, next) {
            res.send(200, 'hello world!');
            return next();
        }
    ]
});
