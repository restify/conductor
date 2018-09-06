'use strict';

var rc = require('../../../lib');
var propsConductor = require('../props/propsConductor').propsConductor;

// this conductor inherits from propsConductor.
// that means we'll get all the props and handlers for free,
// and the output is exactly the same.

module.exports = rc.createConductor({
    name: 'inheritanceConductor',
    deps: [propsConductor]
});
