'use strict';

var rc = require('../../lib/');


// models are actually functions that return a new model.
// this allows us to create new models easily for every
// new incoming request.

module.exports = rc.createModel({
    name: 'serverEnv',
    before: function(req, res) {
        // you can also use a function to set
        // the data fields of the model.
        this.data = {
            env: process.env.NODE_ENV || 'development',
            osUser: process.env.user,
            shellPath: process.env.PATH || '',
            pwd: process.env.PWD
        };
    }
});
