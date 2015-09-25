'use strict';

var rc     = require('../../../lib');
var assert  = require('assert-plus');
var restifyErrors = require('restify-errors');


// immutable properties are useful as a way to expose
// a set of data that differs from conductor to conductor.

// props are initialized via a function, which returns
// an object. the object returned will be 'frozen' and
// become immutable.

// props can then be accessed in your handlers via
// methods provided to you.


// in this way, we can share handlers between conductors,
// but work against a known set of props.



function validateQuery(req, res, next) {
    // in this example, we take a query param and validate it
    // against the conductor props.
    var query = req.query.search;

    // props can be retrieved via getters
    var allProps = rc.getProps(req);
    // => { foo: 'bar', baz: 'qux', blacklistedQueries: [ 'foo', 'bar' ] }

    // some assertion statements to show the getters
    // are working as expected.
    assert.equal(allProps.foo, rc.getProps(req, 'foo'));
    assert.equal(allProps.baz, rc.getProps(req, 'baz'));

    // if the passed in query was blacklisted, return a 500
    var blacklistedQueries = rc.getProps(req, 'blacklistedQueries');

    if (blacklistedQueries.indexOf(query) !== -1) {
        var err = new restifyErrors.BadRequestError('query not allowed!');
        return next(err);
    }
    return next();
}

function render(req, res, next) {
    var searchQuery = req.query.search || 'no query specified';

    // render
    res.send(200, 'searchQuery: ' + searchQuery);
    return next();
}

module.exports.propsConductor = rc.createConductor({
    name: 'propsConductor',
    props: function() {
        return {
            foo: 'bar',
            baz: 'qux',
            blacklistedQueries: [ 'foo', 'bar' ]
        };
    },
    handlers: [
        [
            validateQuery,
            render
        ]
    ]
});


module.exports.propsConductor2 = rc.createConductor({
    name: 'propsConductor2',
    props: function() {
        return {
            foo: 'bar',
            baz: 'qux',
            blacklistedQueries: [ 'baz', 'qux' ]
        };
    },
    handlers: [
        [
            validateQuery,
            render
        ]
    ]
});
