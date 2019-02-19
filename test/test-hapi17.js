var tape = require("tape");


tape("count and expiry test", function(t) {
  var request = require("request");
  var QL = require("queuelib");

  var Ddos = require("../");
  const niv = require("npm-install-version");
  niv.install("hapi@17");
  var Hapi = require("hapi@17");


  t.plan(11);
  var q = new QL();
  var ddos = new Ddos({ burst: 3, limit: 4 });

  const server = Hapi.server({
    port: 3000,
    host: "localhost"
  });

  server.route({
    method: "GET",
    path: "/",
    handler: (request, h) => {
      return "Hello, world!";
    }
  });

  server.route({
    method: "GET",
    path: "/{name}",
    handler: (request, h) => {
      return "Hello, " + encodeURIComponent(request.params.name) + "!";
    }
  });
  server.ext("onRequest", ddos.hapi17.bind(ddos));

  server.start().then(() => {
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
