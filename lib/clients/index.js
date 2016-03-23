'use strict';

// external modules
var assert      = require('assert-plus');
var restify     = require('restify-clients');
var urijs       = require('urijs');

// internal files
var logHelpers  = require('../logHelpers');


/**
 * create a new restify json client. a new one is
 * created for each outbound API request (i.e., one per model).
 * TODO: this is potentially expensive, need to investigate
 *         creating a single client per incoming request (i.e., per user, per remote host)
 *         crux of the problem is allowing customization on a per request basis (headers),
 *         which currently requires creating a new client per model.
 * @public
 * @function create
 * @param    {Object} model   a restify model
 * @returns  {Object}         a restify JsonClient
 */
function create(model) {

    assert.string(model.host, 'model.host');
    assert.optionalNumber(model.port, 'model.port');
    assert.optionalObject(model.headers, 'model.headers');

    var remoteHost = new urijs(model.host)
                            .port(model.port || 80)
                            .protocol(model.secure ? 'https' : 'http')
                            .toString();


    return restify.createJsonClient({
        url: remoteHost,
        // TODO: this doesn't seem to log anything?!
        log: logHelpers.child({ component: 'jsonClient' })
    });
}

module.exports.create = create;
