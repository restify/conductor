'use strict';

var errors = require('restify-errors');

errors.makeConstructor('ModelValidationError');
errors.makeConstructor('ModelRequestError');
errors.makeConstructor('ShardError');

module.exports = errors;
