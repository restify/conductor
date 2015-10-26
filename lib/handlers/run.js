'use strict';

// external modules
var _           = require('lodash');
var vasync      = require('vasync');

// internal files
var reqHelpers  = require('../reqHelpers');
var logHelper   = require('../logHelpers');
var errors      = require('../errors');


/**
 * run through the handlers of an conductor, starting with the provided index.
 * starts at the lowest number if no startIndex is provided.
 * this is the internal implementation of the publicly exposed runHandlers.
 * potentially async recursive, as we run through each of the handler blocks.
 * @private
 * @function run
 * @param    {Object}    req     the request object
 * @param    {Object}    res     the response object
 * @param    {Function}  next    the next function in handler stack.
 * @param    {Object}    options an options object
 * @returns  {undefined}
 */
function run(req, res, next, options) {

    var startConductor = reqHelpers.getConductor(req);
    var sortedKeys = startConductor.getHandlerKeys();
    var blockKeys;
    var log = req.log || logHelper.getDefault();

    // in recursive scenarios, an options object may be passed in.
    // determine the handler keys/blocks we'll be executing, and whether or not
    // we start in the middle of a block. this happens when we do sharding.
    if (options) {
        if (options.lastKey) {
            blockKeys = _.takeRightWhile(sortedKeys, function(key) {
                return key > options.lastKey;
            });
        } else if (options.startKey) {
            blockKeys = _.takeRightWhile(sortedKeys, function(key) {
                return key === options.startKey;
            });

            if (_.isEmpty(blockKeys)) {
                log.info('No handlers at next level in New Shard \
                         continuing at the next available level', {
                             startKey: options.startKey
                         });
                return run(req, res, next, {lastKey: options.startKey});
            }
        }
    } else {
        blockKeys = sortedKeys;
    }

    if (_.isEmpty(blockKeys)) {
        return next(
            new errors.EmptyHandlersError(
                'No Handlers to run for ' + startConductor.name
            )
        );
    }

    // now that we've got the set of keys/blocks we want to run, use vasync
    // to coordinate running each block.
    vasync.forEachPipeline({
        func: function runHandlerBlock(blockKey, blockCb) {

            // use a logger if present, otherwise fall back on default logger.
            var currentConductor = reqHelpers.getConductor(req);
            var err;

            // if the conductor we started with is not equal to the current
            // conductor, we sharded! in this scenario, we want to bail out
            // of the current vasync process, and restart it again with the
            // new conductor, at the next numerical key.
            if (startConductor !== currentConductor) {

                // log something out to bunyan for informational purposes
                log.info('Conductor sharded!', {
                    oldConductor: startConductor.name,
                    newConductor: currentConductor.name
                });

                // this is dirty, but the only way to bail out of vasync
                // to next with an "error", then have the vasync completion
                // handler avoid calling next because the error isn't REALLY an
                // error.
                err = new errors.ShardError(
                    'Sharding occurred! Early exiting vasync operation.'
                );
                // append some meta data onto the err
                err.startKey = blockKey;
                return blockCb(err);
            }

            // if we didn't shard, just get the next handler block and continue
            // executing.
            var handlerBlock = currentConductor.getHandlers(blockKey);

            // pass it a timerNamePrefix for nested handler timing.
            // now, execute the handler block. it's async.
            vasync.forEachPipeline({
                func: function runHandlers(fn, handlerCb) {
                    var fnName = fn.name || '?';
                    // for req timers, use the current block name to prefix
                    // the function name.
                    var timerName = blockKey + '-' + fnName;

                    // save this prefix to the request before we start running
                    // the handlers. that way handler can use it to add
                    // arbitrary req timers for using current prefix.
                    reqHelpers.setReqTimerPrefix(req, timerName);
                    // start the timer!
                    req.startHandlerTimer(timerName);

                    // run through the current handler.
                    fn(req, res, function postRun(errOrStop) {

                        // end req timer if available
                        req.endHandlerTimer(timerName);

                        // the errOrStop flag is designed to mimic restify's
                        // next behavior. It can be one of two values:
                        // 1) false
                        // Tells us to bail out of the handler stack. this is
                        // necessary in the case of redirects, where we want to
                        // stop processing the handler stack.
                        // 2) an error
                        // An error should get propagated back to restify,
                        // which will handle the error accordingly.

                        // to be super clear, finalCb here is actually a
                        // handlerCb that manages the conductor handler stacks.
                        // so something there will need to check for the
                        // aborted flag we pass back here.

                        // check for explicit case #1 here, can't do truthy and
                        // falsy checks.
                        if (errOrStop === false) {
                            return next(false);
                        }

                        // If this is set to something other than undefined
                        // we should pass the real error object on and ignore
                        // the sharding
                        if (errOrStop) {
                            return handlerCb(errOrStop);
                        }

                        // if the conductor we started with is not equal to the current
                        // conductor, we sharded! in this scenario, we want to bail out
                        // of the current vasync process, and restart it again with the
                        // new conductor, at the next numerical key.
                        var _currentConductor = reqHelpers.getConductor(req);

                        if (startConductor !== _currentConductor) {

                            log.info('Conductor sharded!', {
                                oldConductor: startConductor.name,
                                newConductor: _currentConductor.name
                            });

                            // this is dirty, but the only way to bail out of vasync
                            // to next with an "error", then have the vasync completion
                            // handler avoid calling next because the error isn't REALLY an
                            // error.
                            errOrStop = new errors.ShardError(
                                'Sharding occurred! Early exiting vasync \
                                operation.'
                            );
                            // append some meta data onto the err
                            errOrStop.startKey = blockKey;
                        }

                        return handlerCb(errOrStop);
                    });
                },
                inputs: handlerBlock
            }, blockCb);
        },
        inputs: blockKeys
    }, function runHandlersComplete(err, results) {
        // to reach the vasync completion handlers,
        // there are three possible scenarios.

        // 1) we sharded, and a shard error was returned. we want to call run
        // all over again except on newly sharded conductor, starting at the
        // same index we left off of.  we don't want to call next here, as it
        // will be passed down to the next handler execution chain.
        if (err instanceof errors.ShardError) {
            return run(req, res, next, {
                startKey: err.startKey
            });
        }

        // 2) in second scenario, we check for sharding on completion.
        // sometimes the original conductor may have a shorter index than the
        // child conductor, in which case we need to continue execution in the
        // child conductor.
        // i.e., the original conductor only has handlers on
        // index 10, but the newly sharded conductor has handlers on 20.
        var currentConductor = reqHelpers.getConductor(req);

        if (startConductor !== currentConductor) {
            return run(req, res, next, {
                lastKey: _.last(startConductor.getHandlerKeys())
            });
        }

        // 3) we completed successfully, return next
        return next(err);
    });
}



/**
 * a handler to run the wrapped conductor handlers.
 * no options at the moment.
 * @public
 * @function runHandlersWrapper
 * @returns  {undefined}
 */
function runHandlersWrapper() {
    // conductors cannot execute the handlers themselves,
    // due to sharding. we must handle orchestration
    // within restify-conductor.
    return function runHandlers(req, res, next) {

        // start looping through the handler stacks, by getting
        // the sorted handler stack keys, then using them to
        // get each handler block and execute it.
        run(req, res, next);
    };
}


module.exports = runHandlersWrapper;
