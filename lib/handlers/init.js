'use strict';

/**
 * a handler to initialize the restify conductor namespaces on the request
 * and response objects.
 * @public
 * @method  initWrapper
 * @param   {Object} conductor an instance of restify conductor
 * @returns {void}
 */
function initWrapper(conductor) {
    return function restifyConductorInit(req, res, next) {
        // setup the context
        var context = {
            conductor: conductor,
            models: {},
            clients: {},
            reqTimerPrefix: ''
        };

        // attach it to req
        req._restifyConductor = context;

        return next();
    };
}

module.exports = initWrapper;
