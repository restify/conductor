'use strict';

var rc = require('../../../lib');

// sharding enables us to serve URLs that "shard"
// from one conductor into another dynamically.
//
// That means conductorA might be servicing a request at first,
// but that can shard into conductorB halfway through the
// request chain.

var shardTextConductor = rc.createConductor({
    name: 'shardTextConductor',
    handlers: {
        10: [
            function addName(req, res, next) {
                req.name = 'text';
                return next();
            }
        ],
        20: [
            function render(req, res, next) {
                res.send(200, 'name: ' + req.name);
                return next();
            }
        ]
    }
});

var shardJsonConductor = rc.createConductor({
    name: 'shardJsonConductor',
    handlers: {
        10: [
            function addName(req, res, next) {
                req.name = 'json';
                return next();
            }
        ],
        20: [
            function render(req, res, next) {
                res.send(200, {
                    name: req.name
                });
                return next();
            }
        ]
    }
});

var nextLevelShardJsonConductor = rc.createConductor({
    name: 'nextLevelShardJsonConductor',
    handlers: {
        15: [
            function addName(req, res, next) {
                req.name = 'json';
                return next();
            }
        ],
        20: [
            function render(req, res, next) {
                res.send(200, {
                    name: req.name
                });
                return next();
            }
        ]
    }
});

var shardMap = {
    'text': shardTextConductor,
    'json': shardJsonConductor,
    'nextLevelJson': nextLevelShardJsonConductor
};

module.exports.shardText = shardTextConductor;
module.exports.shardJson = shardJsonConductor;
module.exports.shard = rc.createConductor({
    name: 'shardConductor',
    handlers: {
        10: [
            function name(req, res, next) {
                req.name = 'preshard';
                return next();
            },
            function shard(req, res, next) {
                var type = req.query.type;

                var finalConductor = shardMap[type];

                // here, based on some conditional, we can
                // choose to "shard" into another conductor.
                // the handler chain will pick up where
                // it left off numerically. in this case, 10.
                rc.shardConductor(req, finalConductor);
                return next();
            }
        ],
        20: [
            function nothing(req, res, next) {
                // nothing going on here
                return next();
            }
        ]
    }
});
