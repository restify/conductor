'use strict';

var errors = require('restify-errors');

errors.makeConstructor('ModelValidationError');
errors.makeConstructor('ModelRequestError');
errors.makeConstructor('EmptyHandlersError');
errors.makeConstructor('ShardError');

module.exports = errors;
