'use strict';


// external modules
var assert  = require('assert-plus');
var urijs   = require('urijs');
var util    = require('util');

// internal files
var Model   = require('./Model');
var errors  = require('../errors');


/**
 * RestModel class.
 * abstraction for restify-conductor models.
 * @public
 * @class
 * @param {Object} config model configuration object
 */
function RestModel(config) {
    assert.string(config.host, 'config.host');
    assert.optionalString(config.url, 'config.url');

    // give default instance values so when we do merging
    // we don't merge into the prototype value
    this.qs = {};
    this.postBody = {};
    this.headers = {};
    this.cookies = {};
    this.rawResponseData = {};

    // call super ctor
    RestModel.super_.call(this, config);
}
util.inherits(RestModel, Model);



/**
 * model type for debugging purposes
 * @type {String}
 */
RestModel.prototype.type = 'RestModel';

/**
 * flag used to help debug.
 * true if the model is async.
 * @type {Boolean}
 */
RestModel.prototype.async = true;

/**
 * the type of http request. defaults to GET.
 * @type {String}
 */
RestModel.prototype.method = 'get';

/**
 * whether or not the request should be made over https.
 * @type {Boolean}
 */
RestModel.prototype.secure = false;

/**
 * the hostname for the request
 * @type {String}
 */
RestModel.prototype.host = '';

/**
 * port number for remote host
 * @type {Number}
 */
RestModel.prototype.port = 80;

/**
 * the base url of the request:
 * http://{hostname}/{baseurl}
 * @type {String}
 */
RestModel.prototype.baseUrl = '';

/**
 * the specific url of the request:
 * http://{hostname}/{baseurl}/{url}
 * @type {String}
 */
RestModel.prototype.url = '';

/**
 * a query string object
 * @type {Object}
 */
RestModel.prototype.qs = null;

/**
 * a post body object
 * @type {Object}
 */
RestModel.prototype.postBody = null;

/**
 * if a post request, the post type.
 * defafult is json, can also be 'form'.
 * @type {String}
 */
RestModel.prototype.postType = 'json';

/**
 * specific headers set for this model
 * @type {Object}
 */
RestModel.prototype.headers = null;

/**
 * the format of the returned payload.
 * defaults to JSON, but can be XML or other.
 * @type {String}
 */
RestModel.prototype.resourceType = 'json';

/**
 * some cherry picked debug about the external
 * resource call.
 * @type {Object}
 */
RestModel.prototype.rawResponseData = null;

/**
 * whether or not model is operating in fallback mode.
 * @type {Boolean}
 */
RestModel.prototype.fallbackMode = false;


/**
 * retrieves the remote resource.
 * @public
 * @function get
 * @param    {Function} callback a callback function to invoke when complete
 * @returns  {Object}            the parsed JSON response
 */
RestModel.prototype.get = function(callback) {

    var self            = this;
    var resourcePath    = new urijs().pathname(self.url)
                                     .search(self.qs)
                                     .toString();

    // fetch a json client, then use to request the resource
    self.client[self.method](resourcePath,
    function getRestModelComplete(reqErr, req, res, rawData) {

        var err;

        // no need to log error or do anything here,
        // just wrap it and bubble it up for the consumer to handle.
        if (reqErr) {
            err = new errors.RequestError(reqErr, 'http request error');
        }

        // cherry pick some data from req and res so we have some debug data
        // if needed.
        // TODO: should we save req/res too? seems verbose, might be helpful
        // though.
        // self._req = req;
        // self._res = res;
        self.rawResponseData = {
            resourcePath: resourcePath,
            statusCode: (res && res.statusCode) || -1,
            headers: (res && res.headers) || null,
            body: (res && res.body) || null
        };

        return callback(err, rawData);
    });
};

module.exports = RestModel;
