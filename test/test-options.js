const tape = require("tape");
const Ddos = require("../");
const request = require('supertest');
const express = require('express');

tape("options - silentStart false", function(t) {
  t.plan(1);
  const ddos = new Ddos({ silentStart:false, burst: 3, limit: 4 });
  t.pass();
  ddos.end();
});


tape("options - whitelist ", function(t) {
  t.plan(1);
  const ddos = new Ddos({ testmode:true, whitelist:['127.0.0.1'], burst: 3, limit: 4 });
  const app = express();
  app.use(ddos.express);
  app.get("/user", (req,res) => {
    res.status(200).json({name:'john'});
  })

  request(app)
    .get('/user')
    .expect('Content-Type', /json/)
    .expect('Content-Length', '15')
    .expect(200)
    .end(function(err, res) {
      ddos.end();
      t.pass();
    });
});

tape("options - includeUserAgent ", function(t) {
  t.plan(1);
  const ddos = new Ddos({ includeUserAgent:false, burst: 3, limit: 4 });
  const app = express();
  app.use(ddos.express);
  app.get("/user", (req,res) => {
    res.status(200).json({name:'john'});
  })

  request(app)
    .get('/user')
    .expect('Content-Type', /json/)
    .expect('Content-Length', '15')
    .expect(200)
    .end(function(err, res) {
      ddos.end();
      t.pass();
    });
});


tape("options - trustProxy ", function(t) {
  t.plan(1);
  const ddos = new Ddos({ trustProxy:false, burst: 3, limit: 4 });
  const app = express();
  app.use(ddos.express);
  app.get("/user", (req,res) => {
    res.status(200).json({name:'john'});
  })

  request(app)
    .get('/user')
    .expect('Content-Type', /json/)
    .expect('Content-Length', '15')
    .expect(200)
    .end(function(err, res) {
      ddos.end();
      t.pass();
    });
});
