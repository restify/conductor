'use strict';

var rc = require('../../../lib');


// an conductor that redirect. handler chain stops executing.

module.exports = rc.createConductor({
    name: 'simpleConductor4',
    handlers: [
        function redirect(req, res, next) {
            // redirect the page!
            res.redirect('/simple1', next);
        },
        function render(req, res, next) {
            // this should never get executed!
            res.send(200, 'hello world!');
            return next();
        }
    ]
});
