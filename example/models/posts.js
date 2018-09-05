'use strict';

var rc = require('../../lib/');


// a RestModel is like a model, except it gets a data
// from a remote resource. like the regular model,
// life cycle methods are available to you.
// before() is called the outbound request is made
// isValid() is called right after,
// after() is called validation is successful


module.exports = rc.createModel({
    name: 'posts',
    host: 'jsonplaceholder.typicode.com',
    url: '/posts',
    before: function(req, res) {
        // if the user passed in something as a query param
        // to be hashed, used that instead!
        this.qs.userId = req.query.userId || 1;
    },
    isValid: function(data) {
        // validate the payload coming back.
        return (Array.isArray(data) && data.length > 0);
    }
});
