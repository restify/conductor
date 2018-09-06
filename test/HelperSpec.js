'use strict';

var assert = require('chai').assert;
var h = require('../lib/helpers');

describe('Helpers', function() {
    it('should merge two objects of arrays', function() {
        var objOne = {
            0: [1, 2, 3],
            1: [4, 5]
        };
        var objTwo = {
            1: [6],
            2: [7, 8, 9]
        };
        var merged = h.mergeObjArrays(objOne, objTwo);

        assert.deepEqual(merged, {
            0: [1, 2, 3],
            1: [4, 5, 6],
            2: [7, 8, 9]
        });
        // ensure no mutation has occurred
        assert.deepEqual(objOne, objOne);
        assert.deepEqual(objTwo, objTwo);
    });

    it('should merge an object with an array', function() {
        var objOne = {
            0: [1, 2, 3]
        };
        var arrOne = [4, 5, 6];
        var merged = h.mergeObjArrays(objOne, arrOne);

        assert.deepEqual(merged, {
            0: [1, 2, 3, 4, 5, 6]
        });
        // ensure no mutation has occurred
        assert.deepEqual(objOne, objOne);
        assert.deepEqual(arrOne, arrOne);
    });

    it('should merge array of arrays', function() {
        var arrOne = [[1], [2]];
        var arrTwo = [[3], [4]];
        var merged = h.mergeObjArrays(arrOne, arrTwo);

        assert.deepEqual(merged, [[1, 3], [2, 4]]);
        // ensure no mutation has occurred
        assert.deepEqual(arrOne, arrOne);
        assert.deepEqual(arrTwo, arrTwo);
    });

    it('should sort keys of object', function() {
        var obj = {
            5: {},
            20: {},
            15: {},
            1: {}
        };
        var sorted = h.sortNumericalKeys(obj);
        assert.deepEqual(sorted, [1, 5, 15, 20]);
    });

    it('should sort keys of arrays of object', function() {
        var obj = {
            10: [],
            20: [],
            30: [],
            40: [],
            50: [],
            51: [],
            53: [],
            60: [],
            65: [],
            70: [],
            100: []
        };
        var sorted = h.sortNumericalKeys(obj);
        assert.deepEqual(sorted, [10, 20, 30, 40, 50, 51, 53, 60, 65, 70, 100]);
    });
});
