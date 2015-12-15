var koa = require('koa');
var request = require('supertest');
var DDOS = require('../')
var ddos = new DDOS
var assert = require('assert')

var app = module.exports = koa();

app.use(ddos.koa)
app.use(function* () {
  this.response.body = 'hello world';
});


describe('simple table test', function () {
  it('table test', function (done) {
    request(app.listen())
    .get('/')
    .expect(200)
    .expect('Content-Length', 11)
    .expect('Content-Type', 'text/plain; charset=utf-8')
    .expect(function(res) {
      var key = Object.keys(ddos.table)[0]
      assert.deepEqual(ddos.table[key], {count:1, expiry:1})
    })
    .end(done)
  })
})
