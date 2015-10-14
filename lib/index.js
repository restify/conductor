'use strict';

// external modules
var assert = require('assert-plus');
var _      = require('lodash');

// internal files
var Conductor        = require('./Conductor');
var Model            = require('./models/Model');
var RestModel        = require('./models/RestModel');
var internalHandlers = require('./handlers');
var reqHelpers       = require('./reqHelpers');

// local globals
var METHODS = [
    'del',
    'get',
    'head',
    'opts',
    'post',
    'put',
    'patch'
];


//------------------------------------------------------------------------------
// private methods
//------------------------------------------------------------------------------


/**
 * install a Conductor against a given URL
 * @private
 * @function installConductor
 * @param   {String} method    get | post | head | put | del
 * @param   {String} urlPath   the path to install the conductor at
 * @param   {Object} server    a restify server object
 * @param   {Object} conductor a Conductor instance
 * @returns {undefined}
 */
function installConductor(method, urlPath, server, conductor) {

    // assert params
    assert.string(method, 'method');
    assert.string(urlPath, 'urlPath');
    assert.object(server, 'server');
    assert.equal(conductor instanceof Conductor, true);

    var handlers = [];
    var applyArgs;

    // add a 'universal' conductor to beginning of handler stack.
    // save the restify conductor on the request.
    handlers.push([
        internalHandlers.init(conductor),
        internalHandlers.run()
    ]);

    // add the method to the top of the args
    applyArgs = [urlPath].concat(handlers);

    // now install the route
    server[method].apply(server, applyArgs);
}


//------------------------------------------------------------------------------
// public methods
//------------------------------------------------------------------------------


/**
 * wrapper function for creating conductors
 * @public
 * @function createConductor
 * @param   {Object}    options an options object
 * @returns {Conductor}         a Conductor instance
 */
function createConductor(options) {
    return new Conductor(options);
}

/**
 * wrapper function for creating models.
 * we MUST return a closure, this is necessary to provide
 * req res to the lifecycle methods, and allow us to return a new model for
 * each new incoming request.
 * @public
 * @function createConductor
 * @param   {Object} options an options object
 * @returns {Function}
 */
function createModel(options) {

    if (options.host || options.qs) {
        return function(req, res) {
            return new RestModel(options);
        };
    } else {
        return function(req, res) {
            return new Model(options);
        };
    }
}


_.forEach(METHODS, function(method) {
    /**
     * programatically create wrapperis for Restify's server[method]
     * @param   {String}    urlPath   the url of REST resource
     * @param   {Conductor} conductor a conductor instance
     * @param   {Object}    server    a restify server
     * @returns {undefined}
     */
    var methodInstaller = function(urlPath, conductor, server) {
        installConductor(method, urlPath, server, conductor);
    };
    methodInstaller.displayName = method;

    module.exports[method] = methodInstaller;
});


// specific classes and wrappers
module.exports.createConductor = createConductor;
module.exports.createModel = createModel;

// exposed handlers, only expose a subset of all internal handlers.
module.exports.handlers = {
    buildModels: internalHandlers.buildModels
};

// request helper pass through APIs.
// this is only so the user doesn't have to
// require in a different file,
// i.e., require('restify-conductor/req');
module.exports.getConductor = reqHelpers.getConductor;
module.exports.getProps = reqHelpers.getProps;
module.exports.getModels = reqHelpers.getModels;
module.exports.shardConductor = reqHelpers.shardConductor;
