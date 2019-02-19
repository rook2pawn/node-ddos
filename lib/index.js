const addWhitelist = function(ip) {
  return this.params.whitelist.push(ip);
}
exports.addWhitelist = addWhitelist;

const update = function() {
  var keys = Object.keys(this.table);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    this.table[key].expiry -= this.params.checkinterval;
    if (this.table[key].expiry <= 0) delete this.table[key];
  }
  if (this.params.testmode) {
    console.log(this.table);
  }
};
exports.update = update;

const stop = function() {
  clearInterval(this.timer);
  this.params.stop = true;
};

exports.stop = stop;

const ipv4re = new RegExp(/(::ffff:)?(\d+\.\d+.\d+\.\d+(:\d+)?)/);
exports.ipv4re = ipv4re;


const getAddress = (options, req) => {
  let address = options.trustProxy
      ? req.headers["x-forwarded-for"] || req.connection.remoteAddress
      : req.connection.remoteAddress;
  if (address === "::1") {
    address="127.0.0.1"
  } else {
    let result = address.match(ipv4re)
    if (result && result[2])
      address = result[2];
    else
      address = "127.0.0.1";
  }
  return address;
}

const _handle = function(options, table, req) {
  return new Promise((resolve, reject) => {
    if (options.stop) {
      return reject({action:"nothing", message:"stopped"})
    }
    if (options.testmode) {
      console.log("ddos: handle: beginning:", table);
    }
    let host = getAddress(options, req);
    if (options.testmode) {
      console.log("host:", host);
    }
    if (options.whitelist.indexOf(host) != -1) {
      return resolve();
    }
    if (options.includeUserAgent)
      host = host.concat("#" + req.headers["user-agent"]);
    if (!table[host]) 
      table[host] = { count: 1, expiry: 1 };
    else {
      table[host].count++;
      if (table[host].count > options.maxcount)
        table[host].count = options.maxcount;
      if ((table[host].count > options.burst) && (table[host].expiry <= options.maxexpiry)) {
          table[host].expiry = Math.min(
            options.maxexpiry,
            table[host].expiry * 2
          );
      } else {
        table[host].expiry = 1;
      }
    }
    if (options.testmode) {
      console.log("ddos: handle: end:", table);
    }

    if (table[host].count > options.limit) {
      (!options.testmode) && (console.log("ddos: denied: entry:", host, table[host]));
      if (options.testmode) {
        return reject({action:'respond', code:429, message:JSON.stringify(table[host])});
      } else {
        return reject({action:'respond', code:options.responseStatus, message:options.errormessage})
      }
    } else {
      return resolve();
    }
  })
};
exports._handle = _handle;

exports.handle = function (req, res, next) {
  return _handle(this.params, this.table, req)
  .then(() => next())
  .catch((e) => {
    if (e.action === "nothing") {
      return next();
    }
    if (e.action === "respond") {
      if (this.params.onDenial) {
        this.params.onDenial(req)
      }    

      res.writeHead(e.code, {'Content-Type':'application/json'});
      return res.end(e.message);
    }
  })
};
