const tape = require("tape");
const Ddos = require("../");
const request = require('supertest');
const express = require('express');

tape("maxcount ", function(t) {
  t.plan(1);
  const ddos = new Ddos({ silentStart: false, burst: 3, limit: 2 });
  const app = express();
  app.use(ddos.express);
  app.get("/user", (req,res) => {
    res.status(200).json({name:'john'});
  })


  const doCall = function() {
    return request(app)
    .get('/user')
  }

  doCall()
  .then(() => {
    return doCall()
  })
  .then(() => {
    return doCall()
  })
  .then(() => {
    return doCall()
  })
  .then(() => {
    return doCall()
  })
  .then((res) => {
      ddos.end();
      t.pass();
  })


});
