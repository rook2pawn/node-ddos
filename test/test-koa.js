var semver = require('semver');

if (semver.gte(process.version, '7.6.0')) {
  
  var tape = require('tape');
  var koa = require('koa');
  var request = require('supertest');
  var DDOS = require('../')
  var ddos = new DDOS;

  var app = new koa;

  app.use(ddos.koa().bind(ddos))

  app.use(function(ctx) {
    ctx.body = 'Hello World';
  });
  tape('table test', function (t) {
    const server = app.listen();
    t.plan(1);
    request(server)
    .get('/')
    .expect(200)
    .expect('Content-Length', 11)
    .expect('Content-Type', 'text/plain; charset=utf-8')
    .end(function(err,res) {

      var key = Object.keys(ddos.table)[0]
      t.deepEqual(ddos.table[key], {count:1, expiry:1})
      server.close();
      ddos.stop();
    })
  })
}
