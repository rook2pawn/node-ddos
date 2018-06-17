const lib = require("./lib");
const defaultParams = require("./lib/defaults");

var ddos = function(params) {
  if (!params) params = {};

  params = Object.assign({}, defaultParams, params);
  params.maxcount = params.limit * 2;

  if (!params.silentStart) {
    console.log("ddos: starting params: ", params);
  }

  this.table = {};
  this.timer = setInterval(this.update.bind(this), params.checkinterval * 1000);
  this.express = this.handle.bind(this);
  this.middleware = this.handle.bind(this);
  this.params = params;
};

ddos.prototype.stop = lib.stop;
ddos.prototype.end = ddos.prototype.stop;
ddos.prototype.update = lib.update;
ddos.prototype.handle = lib.handle;
ddos.prototype.express = lib.handle;
ddos.prototype.koa = function() {
  return require("./lib/koa")(this.params, this.table, lib._handle);
};

ddos.prototype.hapi = function(request, reply) {
  var req = request.raw.req;
  var res = reply;
  var next = reply.continue.bind(reply);
  var table = this.table;
  const params = this.params;

  lib._handle(params, table, req, res, next);
};

module.exports = exports = ddos;
