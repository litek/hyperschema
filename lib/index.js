'use strict';
var mixin = require('./mixin');
var router = require('./router');

module.exports = hyperschema;

function hyperschema(schema) {
  return mixin.hyperschema(schema || {});
}

hyperschema.definitions = function(definitions) {
  return mixin.hyperschema({definitions: definitions});
};
