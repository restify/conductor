'use strict';

var rc = require('../../lib/');

// a RestModel is like a model, except it gets a data
// from a remote resource. like the regular model,
// life cycle methods are available to you.
// before() is called the outbound request is made
// isValid() is called right after,
// after() is called validation is successful

module.exports = rc.createModel({
    name: 'ip',
    host: 'jsonip.com',
    secure: true,
    isValid: function(data) {
        // validate the payload coming back.
        return data.hasOwnProperty('ip') && data.hasOwnProperty('about');
    }
});
