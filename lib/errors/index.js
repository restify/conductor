'use strict';

var errors = require('restify-errors');

module.exports = {
    ModelValidationError: errors.makeConstructor('ModelValidationError'),
    ModelRequestError: errors.makeConstructor('ModelRequestError'),
    EmptyHandlersError: errors.makeConstructor('EmptyHandlersError'),
    ShardError: errors.makeConstructor('ShardError')
};
