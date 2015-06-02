'use strict';
var compile = require('path-to-regexp');
var compose = require('koa-compose');
var parse = require('co-body');

module.exports = Router;

function Router(schema) {
  this.routes = Router.build(schema);
}

Router.prototype.match = function(method, path) {
  var res = {status: 404};

  for (var i=0; i<this.routes.length; i++) {
    var route = this.routes[i];
    var params = route.match(path);

    if (!params || route.link.method !== method) {
      res.status = !params ? res.status : 405;
      continue;
    }

    res.status = 200;
    res.params = params;
    res.route = route;
    break;
  }

  return res;
};

Router.prototype.middleware = function() {
  var self = this;

  return function* router(next) {
    var res = self.match(this.method, this.path);

    if (res.status !== 200) {
      this.status = res.status;
      return yield* next;
    }

    this.params = res.params;
    this.link = res.route.link;
    
    var handler = res.route.handler.call(this, next);
    yield* handler;
  };
};

Router.build = function(schema, before) {
  var handlers = (before || []).concat(schema.handlers || []);
  var routes = [];

  (schema.links || []).forEach(function(link) {
    routes.push(Router.route(link, handlers));
  });

  Object.keys(schema.definitions || {}).forEach(function(key) {
    var nested = Router.build(schema.definitions[key], handlers);
    routes.push.apply(routes, nested);
  });

  return routes;
};

Router.route = function(link, before) {
  var handlers = [Router.validator(link)].concat(before).concat(link.handlers)
  var keys = [];
  var regexp = compile(link.path);

  return {
    link: link,
    handler: compose(handlers),
    match: function(path) {
      var match = regexp.exec(path);
      if (!match) return false;

      var res = {};
      for (var i=0; i<keys.length; i++) {
        res[keys[i].name] = match[i+1];
      }

      return res;
    }
  };
};

Router.validator = function(link) {
  return function* validator(next) {
    if (this.method !== 'GET' && !this.request.hasOwnProperty('body')) {
      this.request.body = yield parse.json(this.request);
    }

    var data = this.method === 'GET' ? this.request.query : this.request.body;
    var input = link.validate.input(data || {});

    if (!input.valid) {
      this.status = 422;
      this.body = input.errors;
      return;
    }

    yield* next;

    // if (this.status >= 200 && this.status < 300) {
    //   var output = link.validate.output(this.body);
    //   if (!output.valid) {
    //     this.throw('Output validation error: ' + JSON.stringify(this.body), 500);
    //   }
    // }
  };
};

module.exports = Router;
