'use strict';

var _      = require('lodash');
var errors = require('restify-errors');

module.exports = _.assign({}, errors, {
    ModelValidationError: errors.makeConstructor('ModelValidationError'),
    ModelRequestError: errors.makeConstructor('ModelRequestError'),
    ShardError: errors.makeConstructor('ShardError')
});

