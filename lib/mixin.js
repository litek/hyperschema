'use strict';
var assert = require('assert');
var validator = require('./validator');
var Router = require('./router');

var mixin = module.exports = {};

/**
 * Attach handlers array and .use method
 */
mixin.handlers = function(obj) {
  return Object.defineProperties(obj, {
    handlers: {
      value: []
    },
    use: {
      value: function(arr) {
        arr = arr instanceof Array ? arr : [arr];
        arr.forEach(function(fn) {
          assert(fn && 'GeneratorFunction' == fn.constructor.name, 'expected a generator function');
        });

        [].push.apply(this.handlers, arr);
        return this;
      }
    }
  });
};

/**
 * Attach .link methods, setting $schema if undefined
 */
mixin.hyperschema = function(obj) {
  mixin.handlers(obj);
  obj.$schema = obj.$schema || 'http://json-schema.org/draft-04/hyper-schema#';

  Object.defineProperties(obj, {
    middleware: {
      value: function() {
        var router = new Router(obj);
        return router.middleware();
      }
    },
    links: {
      value: []
    },
    link: {
      value: function(link) {
        var handlers = [].slice.call(arguments, 1);
        mixin.link(link, this).use(handlers);
        this.links.push(link);
      }
    }
  });

  ['get', 'post', 'put', 'patch', 'delete'].forEach(function(method) {
    Object.defineProperty(obj, method, {
      value: function(path, link) {
        link.path = path;
        link.method = method.toUpperCase();
        return this.link.apply(this, [].slice.call(arguments, 1));
      }
    });
  });

  return obj;
};

/**
 * Expand schema shortcuts and attach validation functions
 */
mixin.link = function(obj, parent) {
  mixin.handlers(obj);

  // expand arrays
  ['schema', 'targetSchema'].forEach(function(schema) {
    if (!obj[schema]) return;
    var props = obj[schema].required || [];

    if (!obj[schema].properties || obj[schema].properties instanceof Array) {
      var add = obj[schema].properties || [];
      obj[schema].properties = {};
    }

    props.forEach(function(name) {
      assert(parent.definitions && parent.definitions[name], 'Property ' + name + ' is not defined');
      obj[schema].properties[name] = parent.definitions[name];
    });
  });

  // create validators
  Object.defineProperty(obj, 'validate', {
    value: {
      input: validator(obj.schema || {}),
      output: validator(obj.targetSchema || {type: undefined})
    }
  });

  return obj;
};
