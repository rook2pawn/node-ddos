const tape = require("tape");
const Ddos = require("../");
const request = require("supertest-light");
const express = require("express");

tape("options - whitelist ", function(t) {
  t.plan(4);
  const ddos = new Ddos({ limit: 1, whitelist: ["127.0.0.1"] });
  const app = express();
  let count = 0;
  app.use(ddos.express);
  app.get("/user", (req, res) => {
    count++;
    return res.status(200).json({ name: "john" });
  });

  const doCall = function(code) {
    return request(app)
      .get("/user")
      .then(res => {
        t.equal(res.statusCode, code);
      })
      .catch(e => {
        t.fail();
      });
  };

  doCall(200)
    .then(() => doCall(200))
    .then(() => doCall(200))
    .then(() => {
      t.equals(count, 3);
      ddos.end();
    });
});

tape("method - addwhitelist ", function(t) {
  t.plan(5);
  const ddos = new Ddos({ limit: 1 });
  const app = express();
  let count = 0;
  app.use(ddos.express);
  app.get("/user", (req, res) => {
    count++;
    return res.status(200).json({ name: "john" });
  });

  const doCall = function(code) {
    return request(app)
      .get("/user")
      .then(res => {
        t.equal(res.statusCode, code);
      })
      .catch(e => {
        t.fail();
      });
  };

  doCall(200)
    .then(() => doCall(429))
    .then(() => {
      t.equals(count, 1);
    })
    .then(() => {
      ddos.addWhitelist("127.0.0.1");
      return doCall(200);
    })
    .then(() => {
      t.equals(count, 2);
      ddos.end();
    });
});

tape("options - includeUserAgent ", function(t) {
  t.plan(4);
  const ddos = new Ddos({ includeUserAgent: false, burst: 3, limit: 4 });
  const app = express();
  app.use(ddos.express);
  app.get("/user", (req, res) => {
    res.status(200).json({ name: "john" });
  });

  request(app)
    .get("/user")
    .then(res => {
      t.equals(res.headers["content-type"], "application/json; charset=utf-8");
      t.equals(res.headers["content-length"], "15");
      t.equals(res.statusCode, 200);
    })
    .then(() => {
      ddos.end();
      t.pass();
    });
});

tape("options - trustProxy ", function(t) {
  t.plan(4);
  const ddos = new Ddos({ trustProxy: false, burst: 3, limit: 4 });
  const app = express();
  app.use(ddos.express);
  app.get("/user", (req, res) => {
    res.status(200).json({ name: "john" });
  });

  request(app)
    .get("/user")
    .then(res => {
      t.equals(res.headers["content-type"], "application/json; charset=utf-8");
      t.equals(res.headers["content-length"], "15");
      t.equals(res.statusCode, 200);
    })
    .then(() => {
      ddos.end();
      t.pass();
    });
});

tape("options - onDenial  ", function(t) {
  t.plan(1);
  let count = 0;
  const onDenial = function(req) {
    count++;
  };
  const ddos = new Ddos({ limit: 1, onDenial });
  const app = express();
  app.use(ddos.express);
  app.get("/user", (req, res) => {
    console.log("reply");
    res.status(200).json({ name: "john" });
  });

  const doCall = function() {
    return request(app).get("/user");
  };

  doCall()
    .then(() => doCall())
    .then(() => doCall())
    .then(res => {
      t.equals(count, 2);
      ddos.end();
    });
});
