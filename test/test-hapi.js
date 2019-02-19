var tape = require("tape");

tape("count and expiry test", function(t) {
  const niv = require("npm-install-version");
  niv.install("hapi@16");
  var Hapi = require("hapi@16");
  var request = require("request");
  var QL = require("queuelib");

  var Ddos = require("../");
  
  t.plan(11);
  var q = new QL();
  var ddos = new Ddos({ burst: 3, limit: 4 });

  const server = new Hapi.Server();
  server.connection({ port: 3000, host: "localhost" });
  server.route({
    method: "GET",
    path: "/",
    handler: function(request, reply) {
      reply("Hello, world!");
    }
  });
  server.ext("onRequest", ddos.hapi.bind(ddos));
  server.start(err => {
    q.series(
      [
        lib => {
          request("http://localhost:3000/", (err, res, body) => {
            var key = Object.keys(ddos.table)[0];
            t.deepEqual(ddos.table[key], { count: 1, expiry: 1 });
            t.equal(res.statusCode, 200);
            lib.done();
          });
        },
        lib => {
          request("http://localhost:3000/", (err, res, body) => {
            var key = Object.keys(ddos.table)[0];
            t.deepEqual(ddos.table[key], { count: 2, expiry: 1 });
            t.equal(res.statusCode, 200);
            lib.done();
          });
        },
        lib => {
          request("http://localhost:3000/", (err, res, body) => {
            var key = Object.keys(ddos.table)[0];
            t.deepEqual(ddos.table[key], { count: 3, expiry: 1 });
            t.equal(res.statusCode, 200);
            lib.done();
          });
        },
        lib => {
          request("http://localhost:3000/", (err, res, body) => {
            var key = Object.keys(ddos.table)[0];
            t.deepEqual(ddos.table[key], { count: 4, expiry: 2 });
            t.equal(res.statusCode, 200);
            lib.done();
          });
        },
        lib => {
          request("http://localhost:3000/", (err, res, body) => {
            var key = Object.keys(ddos.table)[0];
            t.deepEqual(ddos.table[key], { count: 5, expiry: 4 });
            t.equal(res.statusCode, 429);
            lib.done();
          });
        }
      ],
      function() {
        t.pass("ok");
        ddos.end();
        server.stop();
      }
    );
  });
});
