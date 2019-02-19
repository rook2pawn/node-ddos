const lib = require("./lib");
const defaultParams = require("./lib/defaults");

const ddos = function(params) {
  if (!params) params = {};

  params = Object.assign({}, defaultParams(), params);
  params.maxcount = params.limit * 2;

  if (params.testmode) {
    console.log("ddos: starting params: ", params);
  }

  this.table = {};
  this.timer = setInterval(this.update.bind(this), params.checkinterval * 1000);
  this.express = this.handle.bind(this);
  this.middleware = this.handle.bind(this);
  this.params = params;
};


ddos.prototype.addWhitelist = lib.addWhitelist;
ddos.prototype.stop = lib.stop;
ddos.prototype.end = ddos.prototype.stop;
ddos.prototype.update = lib.update;
ddos.prototype.handle = lib.handle;
ddos.prototype.express = lib.handle;
ddos.prototype.koa = function() {
  return function(ctx, next) {
    var req = ctx.req;
    var res = ctx.res;

    return lib._handle(this.params,this.table, req)
    .then(() => {
      return next()
    })
  };
};

ddos.prototype.hapi17 = function (request, h) {
  const req = request.raw.req;
  const params = this.params;
  const table = this.table;


  return lib._handle(params, table, req)
  .then(() => {
    return h.continue
  })
  .catch((e) => {
    if (e.action === "respond") {
      const response = h.response(e.message);
      response.takeover();
      response.code(e.code);
      return response;
    }
  })


}
ddos.prototype.hapi = function(request, reply) {
  const req = request.raw.req;
  const res = reply;
  const table = this.table;
  const params = this.params;

  return lib._handle(params, table, req)
  .then(() => {
    return reply.continue();
  })
  .catch((e) => {
    if (e.action === "respond") {
      return res(e.message).code(e.code);
    }
  })

};
ddos.prototype.ipv4re = lib.ipv4re;

module.exports = exports = ddos;
