var tape = require("tape");
var express = require("express");
var request = require("supertest-light");
var QL = require("queuelib");

var Ddos = require("../");

tape("count and expiry test", function(t) {
  t.plan(14);

  var ddos = new Ddos({ burst: 3, limit: 4 });
  var app = express();
  app.use(ddos.express);
  var a = function(req, res, next) {
    next();
  };
  var b = function(req, res, next) {
    // some more random middleware
    next();
  };
  var c = function(req, res, next) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ foo: "bar" }));
  };
  app.get("/article", a, b, c);

  var q = new QL();
  q.series(
    [
      lib => {
        request(app)
          .get("/article")
          .then(res => {
            t.equal(res.statusCode, 200);
            var key = Object.keys(ddos.table)[0];
            t.deepEqual(ddos.table[key], { count: 1, expiry: 1 });
            lib.done();
          });
      },
      lib => {
        request(app)
          .get("/article")
          .then(res => {
            t.equal(res.statusCode, 200);
            var key = Object.keys(ddos.table)[0];
            t.deepEqual(ddos.table[key], { count: 2, expiry: 1 });
            lib.done();
          });
      },
      lib => {
        request(app)
          .get("/article")
          .then(res => {
            t.equal(res.statusCode, 200);
            var key = Object.keys(ddos.table)[0];
            t.deepEqual(ddos.table[key], { count: 3, expiry: 1 });
            lib.done();
          });
      },
      lib => {
        request(app)
          .get("/article")
          .then(res => {
            t.equal(res.statusCode, 200);
            var key = Object.keys(ddos.table)[0];
            t.deepEqual(ddos.table[key], { count: 4, expiry: 2 });
            lib.done();
          });
      },
      lib => {
        request(app)
          .get("/article")
          .then(res => {
            t.equal(res.statusCode, 429);
            var key = Object.keys(ddos.table)[0];
            t.deepEqual(ddos.table[key], { count: 5, expiry: 4 });
            lib.done();
          });
      },
      lib => {
        setTimeout(() => {
          request(app)
            .get("/article")
            .then(res => {
              t.equal(res.statusCode, 429);
              var key = Object.keys(ddos.table)[0];
              // should start at {count:5, expiry:1} since 4 - 3 = 1
              // after a request, it should penalize for being over burst, which means
              // expiry goes to 2
              t.deepEqual(ddos.table[key], { count: 6, expiry: 2 });
              lib.done();
            });
        }, 3100);
      },
      lib => {
        setTimeout(() => {
          request(app)
            .get("/article")
            .then(res => {
              t.equal(res.statusCode, 200);
              var key = Object.keys(ddos.table)[0];
              t.deepEqual(ddos.table[key], { count: 1, expiry: 1 });
              lib.done();
            });
        }, 2100);
      }
    ],
    function() {
      ddos.end();
    }
  );
});
