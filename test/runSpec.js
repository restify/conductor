'use strict';

var assert = require('assert-plus');
var _ = require('lodash');
var rc = require('../lib');
var runHandlers = require('../lib/handlers/run')();

function mockReq(conductor) {
    return {
        _restifyConductor: {
            conductor: conductor
        },
        startHandlerTimer: _.noop,
        endHandlerTimer: _.noop
    };
}

function createConductor(handlers) {
    return rc.createConductor({
        name: 'A',
        handlers: {
            0: handlers
        }
    });
}

describe('Restify Conductor run', function() {
    var conductorA;
    var calledOnce = false;
    var calledOnceHandler = function(req, res, next) {
        calledOnce = true;
        next();
    };
    var handlers = [calledOnceHandler];

    beforeEach(function() {
        conductorA = createConductor(handlers);
    });


    it('should run the first handler block', function(done) {
        runHandlers(
            mockReq(conductorA),
            {},
            function() {
                assert.ok(calledOnce);
                done();
            }
        );
    });
});
