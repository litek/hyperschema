'use strict';
var expect = require('chai').expect;
var request = require('co-supertest');
var koa = require('koa');
var hyperschema = require('../lib');

describe('hyperschema', function() {
  it('routes links', function*() {
    var app = koa();
    var schema = hyperschema();

    schema.get('/', {rel: 'instances'}, function*() {
      this.body = 'foo';
    });

    app.use(schema.middleware());

    var server = app.listen();
    var res = yield request(server).get('/').end();
    expect(res.status).equals(200);

    res = yield request(server).get('/foo').end();
    expect(res.status).equals(404);

    res = yield request(server).post('/').end();
    expect(res.status).equals(405);
  });
});
