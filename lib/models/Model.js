'use strict';

// external modules
var assert      = require('assert-plus');
var _           = require('lodash');

// internal files
var logHelpers  = require('../logHelpers');

// local global

// fallback logger to use if the model wasn't configured with one
var LOG = logHelpers.child('models');




/**
 * Model class.
 * abstraction for restify-conductor models.
 * @public
 * @class
 * @param {Object} config model configuration object
 */
function Model(config) {
    assert.object(config, 'config');
    assert.string(config.name, 'config.name');
    assert.optionalFunc(config.before, 'config.before');
    assert.optionalFunc(config.after, 'config.after');
    assert.optionalFunc(config.isValid, 'config.isValid');

    // initialize instance level attributes
    this.props = {};
    this.data = {};
    this.errors = [];

    // merge down the config
    this._mergeConfig(config);

    // assign a logger if it wasn't passed in.
    if (!this.log) {
        this.log = LOG;
    }
}


/**
 * arbitrary model props
 * @type {Object}
 */
Model.prototype.props = null;

/**
 * the model data
 * @type {Object}
 */
Model.prototype.data = null;

/**
 * collected errors that may have occurred
 * through the lifecycle methods.
 * @type {Array}
 */
Model.prototype.errors = null;

/**
 * a bunyan instance for loggin
 * @type {Object}
 */
Model.prototype.log = null;

/**
 * a remote client that implements a get() method
 * for fetching remote data
 * @type {Object}
 */
Model.prototype.client = null;

/**
 * model type for debugging purposes
 * @type {String}
 */
Model.prototype.type = 'Model';

/**
 * model name
 * @type {String}
 */
Model.prototype.name = '';

/**
 * flag used to help debug.
 * true if the model is async.
 * @type {Boolean}
 */
Model.prototype.async = false;




//------------------------------------------------------------------------------
// private methods
//------------------------------------------------------------------------------

/**
 * merges configuration.
 * only merges whitelisted values (values found on the prototype).
 * this prevents arbitrary values from potentially breaking lifecycle methods.
 * @private
 * @function mergeConfig
 * @param    {Object}    config The configuration object.
 * @returns  {undefined}
 */
Model.prototype._mergeConfig = function(config) {

    var self = this;

    _.forEach(config, function(val, key) {
        // if prototype property exists,
        // override it instance
        // TODO: make this self.prototype
        if (key in self) {
            self[key] = val;
        }
    });
};





//------------------------------------------------------------------------------
// public instance lifecycle method
//------------------------------------------------------------------------------


// The lifecycle methods work as follows:

// before -> get -> isValid -> after

// In this Model, because there is no async get, we don't really have
// to worry about errors. However, in subclasses, like AsyncModel
// or RestModel, errors can occur during the get lifecycle method.
// Request timeouts, database timeouts etc.

// In the case an error occurs fallback is
// invoked in an attempt to get a fallback data payload:

// before -> get (error) -> fallback -> isValid -> after



/**
 * default noop for all models.
 * gives users a hook to modify the model
 * before requesting it.
 * @public
 * @function before
 * @param    {Object}    req the request object
 * @param    {Object}    res the response object
 * @returns  {undefined}
 */
Model.prototype.before = function(req, res) {
    // noop
};


/**
 * default noop for all models.
 * gives users a hook to modify the model
 * after getting a return value.
 * @public
 * @function after
 * @param    {Object}    req the request object
 * @param    {Object}    res the response object
 * @returns  {undefined}
 */
Model.prototype.after = function(req, res) {
    // noop
};


/**
 * lifecycle method for validating returned data.
 * @public
 * @function isValid
 * @param    {Object}  data the data to validate
 * @returns  {Boolean}
 */
Model.prototype.isValid = function(data) {
    // overridable instance method.
    // noop on prototype, but must take
    // argument so V8 can optimize
    return true;
};


/**
 * default noop for all models.
 * gives users a hook to handle validation errors.
 * @public
 * @function fallback
 * @returns  {Object}
 */
Model.prototype.fallback = null;


/**
 * public method to invoke the get of the model data.
 * @public
 * @function get
 * @param   {Function}  cb callback function
 * @returns {undefined}
 */
Model.prototype.get = function(cb) {
    cb(null, this.data);
};


//------------------------------------------------------------------------------
// private subclass overridable lifecycle methods
//------------------------------------------------------------------------------


/**
 * subclass wrapper for before lifecycle method.
 * @private
 * @function _before
 * @param    {Object}    req the request object
 * @param    {Object}    res the response object
 * @returns  {undefined}
 */
Model.prototype._before = function(req, res) {
    this.before(req, res);
};


/**
 * subclass wrapper for after lifecycle method.
 * @private
 * @function _after
 * @param    {Object}    req the request object
 * @param    {Object}    res the response object
 * @returns  {undefined}
 */
Model.prototype._after = function(req, res) {
    this.after(req, res);
};


/**
 * subclass wrapper for onError lifecycle method.
 * @private
 * @function _fallback
 * @param   {Error} err error object
 * @returns {undefined}
 */
Model.prototype._fallback = function(err) {
    // invoke error handler
    var fallbackData = this.fallback(err);

    // expect error handler to return a boolean
    // indicating the error was handled.
    // if so, swallow the error.
    if (!_.isUndefined(fallbackData)) {
        this.data = fallbackData;
    }

    // now save the error for debugging purposes
    this.errors.push(err);
};


/**
 * sublcass wrapper for validating model data
 * @private
 * @function  _isValid
 * @param    {Object}  data the data to validate
 * @returns  {Boolean}
 */
Model.prototype._isValid = function(data) {
    // checks for undefined, then calls instance level validator
    return (!_.isUndefined(data) && this.isValid(data));
};


//------------------------------------------------------------------------------
// public methods inherited by all Model classes
//------------------------------------------------------------------------------


/**
 * public method to invoke the before chain of lifecycle events.
 * @public
 * @function preConfigure
 * @param    {Object} req     the request object
 * @param    {Object} res     the response object
 * @param    {Object} options an options object
 * @returns  {undefined}
 */
Model.prototype.preConfigure = function(req, res, options) {
    // set configuration that's injected at the last second
    if (options) {
        if (options.client) {
            this.client = options.client;
        }

        if (options.log) {
            this.log = options.log;
        }
    }

    // call lifecycle methods
    this._before(req, res);
};


/**
 * public method to invoke the after chain of lifecycle events.
 * @public
 * @function postConfigure
 * @param    {Object} req the request object
 * @param    {Object} res the response object
 * @returns  {undefined}
 */
Model.prototype.postConfigure = function(req, res) {
    this._after(req, res);
};



module.exports = Model;

