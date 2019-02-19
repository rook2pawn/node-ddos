var semver = require("semver");

if (semver.gte(process.version, "7.6.0")) {
  var tape = require("tape");
  var koa = require("koa");
  var request = require("supertest-light");
  var DDOS = require("../");
  var ddos = new DDOS({ burst: 3, limit: 4, testmode: true });

  const Router = require("koa-router");
  const router = new Router();
  var app = new koa();

  router.get("/todos", ctx => {
    ctx.status = 200;
    ctx.body = [
      {
        id: 1,
        text: "Switch to Koa",
        completed: true
      },
      {
        id: 2,
        text: "???",
        completed: true
      },
      {
        id: 3,
        text: "Profit",
        completed: true
      }
    ];
  });
  app.use(ddos.koa().bind(ddos));
  app.use(router.routes());

  tape("table test", function(t) {
    t.plan(3);
    request(app.callback())
      .get("/todos")
      .then(res => {
        t.equal(res.statusCode, 200);
        t.equal(res.headers["content-length"], "131");
        var key = Object.keys(ddos.table)[0];
        t.deepEqual(ddos.table[key], { count: 1, expiry: 1 });
        ddos.stop();
      });
  });
}
