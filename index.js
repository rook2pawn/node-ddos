var Hoek = require('hoek');
var response = require('response');
var defaultParams = require('./lib/defaults')

var ddos = function(params) {

  if (!params)
    params = {};

  params = Hoek.applyToDefaults(defaultParams, params);

  if ((params.burst !== undefined) && (params.limit === undefined)) {
    params.limit = params.burst * 4;
  }
  if (params.limit != undefined) {
    params.maxcount = params.limit * 2;
  }
  if (!params.silentStart)
    console.log("ddos: starting params: ", params)

  this.table = {}
  this.timer = setInterval(this.update.bind(this),params.checkinterval*1000)
  this.express = this.handle.bind(this);
  this.middleware = this.handle.bind(this);
  this.params = params;
};

ddos.prototype.stop = function() {

  if (this.timer) {
    clearInterval(this.timer)
  }
};

ddos.prototype.end = ddos.prototype.stop;

ddos.prototype.update = function() {

  var keys = Object.keys(this.table);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i]
    this.table[key].expiry -= this.params.checkinterval;
    if (this.table[key].expiry <= 0)
      delete this.table[key]
  }
};

const handle = function(params, table, req, res, next) {

  if (params.testmode) {
    console.log('ddos: handle: beginning:', table)
  }
  var address = params.trustProxy ? (req.headers['x-forwarded-for'] || req.connection.remoteAddress) : req.connection.remoteAddress;
  if (params.testmode) {
    console.log("Address:", address);
  }
  if (params.whitelist.indexOf(address) != -1) {
    next();
    return;
  }
  var host = address;

  if (params.includeUserAgent)
    host = host.concat("#" + req.headers['user-agent']);
  if (!table[host])
    table[host] = { count : 1, expiry : 1 }
  else {
    table[host].count++
    if (table[host].count > params.maxcount)
      table[host].count = params.maxcount
    if (table[host].count > params.burst) {
      if (table[host].expiry < params.maxexpiry)
        table[host].expiry = Math.min(params.maxexpiry,table[host].expiry * 2)
    } else {
      table[host].expiry = 1;
    }
  }
  if (table[host].count > params.limit) {
    if (!params.silent)
      console.log('ddos: denied: entry:', host, table[host])
    if (params.testmode) {
      response.json(table[host]).status(params.responseStatus).pipe(res)
    } else {
      if (res.writeHead) {
        res.writeHead(params.responseStatus);
        res.end(params.errormessage);
      } else {
        // hapi
        res(params.errormessage)
        .code(429);
      }
    }
  } else {
    next()
  }
  if (params.testmode) {
    console.log('ddos: handle: end:', table)
  }
};

ddos.prototype.handle = function(req,res,next) {

  const params = this.params;
  var table = this.table;

  handle(params, table, req, res, next);
};

ddos.prototype.express = ddos.prototype.handle;

ddos.prototype.koa = function() {

  return require('./lib/koa')(this.params,this.table,handle);
};

ddos.prototype.hapi = function (request, reply) {

  var req = request.raw.req;
  var res = reply;
  var next = reply.continue.bind(reply);
  var table = this.table;
  const params = this.params;

  handle(params, table, req, res, next);
};


module.exports = exports = ddos;

