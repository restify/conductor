'use strict';

var rc = require('../../lib/');

// models are actually functions that return a new model.
// this allows us to create new models easily for every
// new incoming request.

module.exports = rc.createModel({
    name: 'userAgent',
    before: function(req, res) {
        this.data = req.headers['user-agent'];
    }
});
