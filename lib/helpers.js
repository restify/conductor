'use strict';

var _ = require('lodash');


/**
 * sorts the numerical keys of an object
 * @private
 * @function  sortNumericalKeys
 * @param     {Object} obj an object whose keys are to be sorted
 * @returns   {Array}      an array of sorted numbers in ascending order
 */
function sortNumericalKeys(obj) {
    return _.chain(obj)
            .keys()
            .map(function(handlerKey) {
                return parseInt(handlerKey, 10);
            })
            .value()
            .sort(function(a, b) {
                return a > b;
            });
}


/**
 * this function handles merging of objects and arrays. handles two use cases:
 * 1) merges two dimension arrays
 * 2) merged objects containing arrays
 * when merging, use obj1 as the 'base' or accumulator, and obj2 as the new
 * object that's being merged in.
 * @private
 * @function mergeObjArrays
 * @param    {Object} obj1 the base or accmulator object
 * @param    {Object} obj2 the object to be merged in.
 * @returns  {Object}      the merged object of arrays
 */
function mergeObjArrays(obj1, obj2) {

    var acc = _.cloneDeep(obj1);

    return _.reduce(obj2, function(innerAcc, arr, key) {
        // if obj2 is a not a nested array, just concat and return.
        if (!_.isArray(arr)) {
            if (!innerAcc[0]) {
                innerAcc[0] = [];
            }
            innerAcc[0] = innerAcc[0].concat(arr);
            return innerAcc;
        }

        // if the innerAcc has this key, let's concat it.
        if (innerAcc.hasOwnProperty(key)) {
            innerAcc[key] = innerAcc[key].concat(arr);
        } else {
            // otherwise, create it.
            innerAcc[key] = [].concat(arr);
        }

        return innerAcc;
    }, acc);
}



module.exports.sortNumericalKeys = sortNumericalKeys;
module.exports.mergeObjArrays = mergeObjArrays;
