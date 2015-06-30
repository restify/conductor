'use strict';

var rc             = require('../../../lib');
var propsConductor     = require('../props/propsConductor').propsConductor;


// while inheriting, we can also modify the inherited
// props if we want to change them.

module.exports = rc.createConductor({
    name: 'inheritanceConductor2',
    deps: [ propsConductor ],
    props: function(inheritedProps) {
        // in this case, we want to change the list of blacklisted
        // queries from our original props conductor.
        inheritedProps.blacklistedQueries = [ 'override' ];
        return inheritedProps;
    }
});

