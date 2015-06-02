'use strict';
var jsck = require('jsck');

module.exports = validator;

function validator(schema) {
  if (!schema.hasOwnProperty('type')) {
    schema.type = 'object';
  }

  if (schema.type === 'object' && schema.additionalProperties === undefined) {
    schema.additionalProperties = false;
  } else if (schema.type === 'array' && schema.additionalItems === undefined) {
    schema.additionalItems = false;
  }

  var instance = new jsck.draft4(schema);

  return instance.validate.bind(instance);
}
