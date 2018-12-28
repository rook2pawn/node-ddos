const tape = require("tape");
const Ddos = require("../");
const request = require('supertest');
const express = require('express');

// https://github.com/rook2pawn/node-ddos/issues/31

tape("localhost ", function(t) {
  t.plan(4);

  const ddos = new Ddos({ silentStart: false, burst: 3, limit: 2 });
  t.equals("::ffff:127.0.0.1".match(ddos.ipv4re)[2], "127.0.0.1")
  t.equals("127.0.0.1".match(ddos.ipv4re)[2], "127.0.0.1")
  t.equals("32.45.32.65:12568".match(ddos.ipv4re)[2], "32.45.32.65:12568")

  const app = express();
  app.use(ddos.express);
  app.get("/user", (req,res) => {
    res.status(200).json({name:'john'});
  })


  const doCall = function() {
    return request(app)
    .get('/user')
    .set('x-forwarded-for', '::1')
  }

  doCall()
  .then(() => {
    t.equals(Object.keys(ddos.table)[0].match(/127\.0\.0\.1/)[0], "127.0.0.1")
  })
  .then(() => {

    ddos.end();

  })
});
