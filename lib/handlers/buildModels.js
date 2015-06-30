'use strict';

// external modules
var _           = require('lodash');
var vasync      = require('vasync');

// internal files
var reqHelpers  = require('../reqHelpers');
var logHelpers  = require('../logHelpers');
var errorTypes  = require('../errors');


/**
 * a handler to build any models defined on the conductor.
 * @public
 * @function buildModelsWrapper
 * @param    {Array}     modelBucket a key we can use to look up a bucket
 *                                   of models defined on the conductor
 * @returns  {undefined}
 */
function buildModelsWrapper(modelBucket) {

    return function buildModels(req, res, next) {

        var conductor = reqHelpers.getConductor(req);
        var models = conductor.createModels(req, res, modelBucket);
        var log;


        // get a req.log if available, or use the default.
        // create a child logger off of it.
        if (req.log) {
            log = req.log.child({ component: 'buildModels' });
            logHelpers.addSerializers(log);
        } else {
            // default logger already has serializers, no need to add.
            log = logHelpers.getDefault();
        }


        // TODO: there's a restify bug here in req.timers.
        // if we call start/endHandlerTimer with the same name a second time,
        // it won't register, since req.timers is a map.
        vasync.forEachParallel({
            func: function getModel(model, callback) {

                // set the model on the request always, regardless of
                // success or failure.
                reqHelpers.setModel(req, model);

                // preconfigure the model with other things we need.
                // only populate the client if it's a model that requires fetching something
                // from a remote host.
                model.preConfigure(req, res, {
                    client: reqHelpers.getClient(req, model),
                    log: log
                });

                // log a debug, then go fetch it!
                // also start req timers.
                req.startHandlerTimer(
                    req._restifyConductor.timerNamePrefix + '-' + model.name
                );
                log.debug({ model: model }, 'Building model...');

                model.get(function getModelComplete(reqErr, rawData) {

                    // log debug on completion
                    log.debug({ modelName: model.name }, 'Build complete!');
                    // stop the request timers
                    req.endHandlerTimer(
                        req._restifyConductor.timerNamePrefix + '-' + model.name
                    );

                    var finalErr;

                    // handle lower level errors first
                    if (reqErr) {

                        // handle 401s uniquely, check for status codes
                        if (rawData.statusCode === 401) {
                            finalErr = new errorTypes.UnauthorizedError(
                                reqErr
                            );
                            // create a new error, log it, add it to model error state, return.
                            // push error in the errors array, and return
                            model.errors.push(finalErr);
                            return callback(finalErr, model);
                        } else if (_.isFunction(model.fallback)) {
                            // if we have a fallback function, attempt to use it.
                            log.info({
                                name: model.name
                            }, 'attempting fallback mode!');

                            // run the function, expect consumers to set this.data
                            model.fallback();

                            // set the fallback mode flag to true
                            model.fallbackMode = true;

                            // in fallback mode, don't return on callback.
                            // attempt to go through regular flow
                        }
                    }

                    // if no lower level err, check validity.
                    if (model.isValid(rawData)) {

                        // if valid, save it!
                        model.data = rawData;

                        // do any munging if needed
                        model.postConfigure(req, res);

                        // success! return with no err.
                        return callback(null);
                    } else {
                        // if we failed validation, create a validation error, log it, return
                        finalErr = new errorTypes.ModelValidationError(
                            'model validation error for ' + model.name
                        );
                        model.errors.push(finalErr);
                        return callback(finalErr, model);
                    }
                });
            },
            inputs: models
        }, function vasyncComplete(err, results) {

            // vasync returns a multierror, but that multierror isn't output
            // correctly by bunyan. let's create our own logging context
            // by looping through all results.
            if (err) {
                var modelErrs = [];
                var failedModels = [];
                var failedModelNames = [];

                // loop through all results
                _.forEach(results.operations, function(op) {
                    // construct debug context.
                    // op.result is the failed model.
                    // create separate arrays just so when we output
                    // we don't have to loop again... yeah, yeah, if we did it
                    // functionally it would be prettier, but slower.

                    // if this operation had an err, append the info.
                    if (!_.isEmpty(op.err)) {
                        modelErrs.push(op.err);
                        failedModelNames.push(op.result.name);
                        failedModels.push(op.result);
                    }
                });

                // log out context of failed models
                log.error('all models built, but ' + failedModelNames.length +
                   ' model(s) failed: ' + failedModelNames.join(', '));

                // log out the stack trace for each individual failed model
                _.forEach(modelErrs, function(modelErr, idx) {
                    log.error({ conductorModel: failedModels[idx] },
                              (idx + 1) + ' of ' + modelErrs.length +
                            ' failed models: ' + failedModels[idx].name
                    );

                    // x of y to be used in error msgs
                    log.error(modelErr);
                });
            }

            // we actually don't want a failed model to force an error page.
            // users should handle it themselves. don't return with err.
            return next();
        });
    };
}


module.exports = buildModelsWrapper;
