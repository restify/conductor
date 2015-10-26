'use strict';

var demoServer = require('./demo');

// now take traffic!
demoServer.listen(3003, function() {
    console.info('listening at 3003'); // eslint-disable-line no-console
});
