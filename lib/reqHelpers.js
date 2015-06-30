'use strict';

// external modules
var assert = require('assert-plus');

// internal files
var clients = require('./clients');


// helpers for getting context off the request object that are specific to
// restify-conductor. the request construct looks like this:
//
// req._restifyConductor = {
//     conductor: conductor
// }


//------------------------------------------------------------------------------
// getters
//------------------------------------------------------------------------------


/**
 * returns the conductor for a given request.
 * @public
 * @function getConductor
 * @param    {Object} req the request object
 * @returns  {undefined}
 */
function getConductor(req) {

    var conductor = req &&
                    req._restifyConductor &&
                    req._restifyConductor.conductor;

    return conductor || null;
}


/**
 * retrieve an immutable prop off the conductor object
 * @public
 * @function getProps
 * @param    {Object} req      the request object
 * @param    {String} propName the name of the prop to retrieve
 * @returns  {Object}          a prop value
 */
function getProps(req, propName) {

    var conductor = getConductor(req);

    return (conductor) ?
                conductor.getProps(propName) :
                null;
}


/**
 * returns a restify JSON client if one exists for this host for this incoming request.
 * otherwise, creates one.
 * @public
 * @function getClient
 * @param    {Object} req      the request object
 * @param    {Object} model    a restify model
 * @returns  {Object}          a restify JSON client
 */
function getClient(req, model) {

    var host = model.host;

    // if no host, return null. we don't need a client.
    if (!host) {
        return null;
    }

    if (!req._restifyConductor.clients[host]) {
        req._restifyConductor.clients[host] = clients.create(model);
    }

    return req._restifyConductor.clients[host];
}


/**
 * gets all the saved models off the request
 * @public
 * @function getModels
 * @param    {Object} req         the request object
 * @param    {String} [modelName] name of the model to retrieve. returns all models if not specified.
 * @returns  {Object | Array}     returns an array of models, or just one model.
 */
function getModels(req, modelName) {
    return (modelName) ?
        req._restifyConductor.models[modelName] :
        req._restifyConductor.models;
}


/**
 * gets the current request timer prefix name.
 * useful for using it to prefix other request timers.
 * @public
 * @function getReqTimerPrefix
 * @param    {Object} req the request object
 * @returns  {String}
 */
function getReqTimerPrefix(req) {
    return req._restifyConductor.reqTimerPrefix || 'no-prefix-found';
}



//------------------------------------------------------------------------------
// setters
//------------------------------------------------------------------------------


/**
 * sets the current timer name prefix.
 * @public
 * @function setReqTimerPrefix
 * @param    {Object} req    the request object
 * @param    {String} prefix the timer name prefix
 * @returns  {undefined}
 */
function setReqTimerPrefix(req, prefix) {
    req._restifyConductor.reqTimerPrefix = prefix;
}


/**
 * saves a model onto the request
 * @public
 * @function setModel
 * @param    {Object} req   the request object
 * @param    {Object} model an instance of a Model or RestModel.
 * @returns  {undefined}
 */
function setModel(req, model) {
    req._restifyConductor.models[model.name] = model;
}


/**
 * replace an conductor midstream with a .createAction
 * @public
 * @function shardConductor
 * @param    {Object} req          the request object
 * @param    {Object} newConductor a Conductor
 * @returns  {undefined}
 */
function shardConductor(req, newConductor) {

    assert.ok(req, 'req');
    assert.object(newConductor, 'newConductor');

    req._restifyConductor.conductor = newConductor;
}



// getters
module.exports.getConductor = getConductor;
module.exports.getProps = getProps;
module.exports.getClient = getClient;
module.exports.getModels = getModels;
module.exports.getReqTimerPrefix = getReqTimerPrefix;

// setters
module.exports.setModel = setModel;
module.exports.setReqTimerPrefix = setReqTimerPrefix;
module.exports.shardConductor = shardConductor;

