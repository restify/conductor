'use strict';

var demoServer = require('./demo');

// now take traffic!
demoServer.listen(3000, function() {
    console.info('listening at 3000'); // eslint-disable-line no-console
});
