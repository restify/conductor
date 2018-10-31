'use strict';

// external modules
var _ = require('lodash');
var bunyan = require('bunyan');

// local globals
var LOG = bunyan.createLogger({
    name: 'restify-conductor',
    level: process.env.LOG_LEVEL || bunyan.info,
    src: process.env.LOG_LEVEL === 'TRACE' || process.env.LOG_LEVEL === 'DEBUG',
    serializers: bunyan.stdSerializers
});

// add the default serializers to the default logger
addSerializers(LOG);

//------------------------------------------------------------------------------
// private methods
//------------------------------------------------------------------------------

/**
 * strips off stuff from the model before logging
 * @private
 * @function stripModelForLogging
 * @param    {Object} model a restify model
 * @returns  {Object}
 */
function stripModelForLogging(model) {
    var out = {
        name: model.name,
        data: model.data
    };

    // if it's a RestModel, add more fields.
    if (model.type === 'RestModel') {
        _.assign(
            out,
            {
                host: model.host
            },
            model.rawResponseData
        );
    }

    return out;
}

//------------------------------------------------------------------------------
// public methods
//------------------------------------------------------------------------------

/**
 * retrieves default restify-conductor logger
 * @public
 * @function getDefault
 * @returns  {Object} bunyan logger
 */
function getDefault() {
    return LOG;
}

/**
 * creates a child logger from default restify-conductor logger
 * @public
 * @function child
 * @param    {String} name name of child logger
 * @returns  {Object}      bunyan logger
 */
function child(name) {
    return LOG.child({
        component: name
    });
}

/**
 * add the restify-conductor specific serializers
 * @public
 * @function addSerializers
 * @param    {Object} log bunyan instance
 * @returns  {void}
 */
function addSerializers(log) {
    if (!log.addSerializers) {
        return;
    }
    log.addSerializers({
        conductorModel: function(model) {
            if (!model) {
                return null;
            }

            if (_.isArray(model)) {
                return _.reduce(
                    model,
                    function(acc, m) {
                        acc.push(stripModelForLogging(m));
                        return acc;
                    },
                    []
                );
            } else {
                return stripModelForLogging(model);
            }
        }
    });
}

module.exports.getDefault = getDefault;
module.exports.child = child;
module.exports.addSerializers = addSerializers;
