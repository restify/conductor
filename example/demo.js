/*
 * restify-conductor
 * an abstraction framework for building composable endpoints in restify
 *
 * This is a demo! Please run this with bunyan:
 * `node demo.js | bunyan`
 *
 * Licensed under the MIT license.
 */

'use strict';


var rc = require('../lib');
var bunyan = require('bunyan');
var restify = require('restify');

// conductors
// jscs:disable maximumLineLength
var simpleConductor = require('./conductors/simple/simpleConductor');
var simpleConductor2 = require('./conductors/simple/simpleConductor2');
var simpleConductor3 = require('./conductors/simple/simpleConductor3');
var simpleConductor4 = require('./conductors/simple/simpleConductor4');
var propsConductor = require('./conductors/props/propsConductor');
var modelConductor = require('./conductors/models/modelConductor');
var modelConductor2 = require('./conductors/models/modelConductor2');
var modelConductor3 = require('./conductors/models/modelConductor3');
var modelConductor4 = require('./conductors/models/modelConductor4');
var modelConductor5 = require('./conductors/models/modelConductor5');
var inheritanceConductor = require('./conductors/inheritance/inheritanceConductor');
var inheritanceConductor2 = require('./conductors/inheritance/inheritanceConductor2');
var inheritanceConductor3 = require('./conductors/inheritance/inheritanceConductor3');
var inheritanceConductor4 = require('./conductors/inheritance/inheritanceConductor4');
var inheritanceConductor5 = require('./conductors/inheritance/inheritanceConductor5');
var shardConductor = require('./conductors/sharding/shardConductor');
// jscs:enable maximumLineLength


// create a server
var logger = bunyan.createLogger({
    name: 'demo-server',
    level: process.env.LOG_LEVEL
});

var demoServer = restify.createServer({
    name: 'test-server',
    log: logger
});

// set up auditing, error handling
demoServer.on('after', restify.auditLogger({
    log: logger.child({ component: 'restify-audit' })
}));

// handle uncaught exceptions
demoServer.on('uncaughtException', function(req, res, route, err) {
    err.domain = null;
    req.log.error({
        err: err,
        stack: err.stack
    }, 'Uncaught exception!');
});

// set up server
demoServer.pre(restify.sanitizePath());
demoServer.use(restify.queryParser());
demoServer.use(restify.requestLogger());

// simple examples
rc.get('/simple', simpleConductor, demoServer);
rc.get('/simple2', simpleConductor2, demoServer);
rc.get('/simple3', simpleConductor3, demoServer);
rc.get('/simple4', simpleConductor4, demoServer);

// props examples
rc.get('/props', propsConductor.propsConductor, demoServer);
rc.get('/props2', propsConductor.propsConductor2, demoServer);

// model examples
rc.get('/model', modelConductor, demoServer);
rc.get('/model2', modelConductor2, demoServer);
rc.get('/model3', modelConductor3, demoServer);
rc.get('/model4', modelConductor4, demoServer);
rc.get('/model5', modelConductor5, demoServer);

// inheritance examples
rc.get('/inherit', inheritanceConductor, demoServer);
rc.get('/inherit2', inheritanceConductor2, demoServer);
rc.get('/inherit3', inheritanceConductor3, demoServer);
rc.get('/inherit4', inheritanceConductor4, demoServer);
rc.get('/inherit5', inheritanceConductor5, demoServer);

// sharding examples
rc.get('/shard', shardConductor.shard, demoServer);
rc.get('/shardText', shardConductor.shardText, demoServer);
rc.get('/shardJson', shardConductor.shardJson, demoServer);


module.exports = demoServer;
