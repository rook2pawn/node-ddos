var http = require("http");
var express = require("express");
var bodyParser = require("body-parser");
var request = require("request");
var Ddos = require("../");
var ddos = new Ddos({ burst: 3, limit: 4, testmode: true });
var app = express();
app.use(ddos.express);
app.use(bodyParser.json());
var server = http.createServer(app);

var QL = require("queuelib");
var q = new QL();

server.listen(5050);

var a = function(req, res, next) {
  next();
};
var b = function(req, res, next) {
  // some more random middleware
  next();
};
var c = function(req, res, next) {
  var num = req.body.num * 2;
  res.end(JSON.stringify({ foo: num }));
};
app.post("/article", a, b, c);

var tape = require("tape");
tape("post test", function(t) {
  t.plan(11);
  q.series([
    function(lib) {
      request.post(
        { url: "http://localhost:5050/article", json: true, body: { num: 42 } },
        function(err, resp, body) {
          var key = Object.keys(ddos.table)[0];
          t.deepEqual(ddos.table[key], { count: 1, expiry: 1 });
          t.deepEqual(body, { foo: 84 });
          lib.done();
        }
      );
    },
    function(lib) {
      request.post(
        { url: "http://localhost:5050/article", json: true, body: { num: 42 } },
        function(err, resp, body) {
          var key = Object.keys(ddos.table)[0];
          t.deepEqual(ddos.table[key], { count: 2, expiry: 1 });
          t.deepEqual(body, { foo: 84 });
          lib.done();
        }
      );
    },
    function(lib) {
      request.post(
        { url: "http://localhost:5050/article", json: true, body: { num: 42 } },
        function(err, resp, body) {
          var key = Object.keys(ddos.table)[0];
          t.deepEqual(ddos.table[key], { count: 3, expiry: 1 });
          t.deepEqual(body, { foo: 84 });
          lib.done();
        }
      );
    },
    function(lib) {
      request.post(
        { url: "http://localhost:5050/article", json: true, body: { num: 42 } },
        function(err, resp, body) {
          var key = Object.keys(ddos.table)[0];
          t.deepEqual(ddos.table[key], { count: 4, expiry: 2 });
          t.deepEqual(body, { foo: 84 });
          lib.done();
        }
      );
    },
    function(lib) {
      request.post(
        { url: "http://localhost:5050/article", json: true, body: { num: 42 } },
        function(err, resp, body) {
          var key = Object.keys(ddos.table)[0];
          t.deepEqual(ddos.table[key], { count: 5, expiry: 4 });
          t.equal(resp.statusCode, 429, "should be 429");
          t.equal(body.count, 5, "should be 5");
          lib.done();
        }
      );
    },
    function(lib) {
      lib.done();
      t.end();
      server.close();
      ddos.stop();
    }
  ]);
});
