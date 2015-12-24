var Hash = require('hashish')
var response = require('response')
var ddos = function(params) {
    // burst, maxexpiry, checkinterval is in seconds
    // limit is the maximum count
    var _params = {};
    _params.maxcount = 30;
    _params.burst = 5;
    _params.limit = _params.burst * 4;  
    _params.maxexpiry = 120;
    _params.checkinterval = 1;
    _params.errormessage = 'Error';
    _params.testmode = false;
    _params.silent = false;
    _params.silentStart = false;
    _params.responseStatus = 429;
    if (!params) {
        params = _params;
    } else {
        if ((params.burst !== undefined) && (params.limit === undefined)) {
            params.limit = params.burst * 4;
        }
        if (params.limit != undefined) {
            params.maxcount = params.limit * 2;
        }
        Hash(_params).update(params)
        params = _params
    }
    if (!params.silentStart)
        console.log("ddos: starting params: ", params)
    var table = {}
    var update = function() {
        //console.log("ddos: update", table)
        var keys = Object.keys(table)
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i]
            table[key].expiry -= params.checkinterval;
            if (table[key].expiry <= 0) 
                delete table[key]
        }
    }
    var timer = setInterval(update,params.checkinterval*1000) 
    this.stop = function() {
        if (timer) {
            //console.log("ddos: stopping", timer)
            clearInterval(timer)
        }
    }
    var handle = function(req,res,next) {
        if (params.testmode) {
            console.log('ddos: handle: beginning:', table)
        }
        var host = (req.headers['x-forwarded-for'] || req.connection.remoteAddress) + "#" + req.headers['user-agent']
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
                res.writeHead(params.responseStatus);
                res.end(params.errormessage);
            }
        } else {         
            next()
        }
        if (params.testmode) {
            console.log('ddos: handle: end:', table)
        }
    }
    this.koa = function *(next) {
        if (params.testmode) {
            console.log('ddos: handle: beginning:', table)
        }
        var host = this.request.ip + "#" + this.request.headers['user-agent']
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
            console.log('ddos: denied: entry:', host, table[host])
            if (params.testmode) {
                response.json(table[host]).status(params.responseStatus).pipe(res)
            } else {
                res.writeHead(params.responseStatus);
                res.end(params.errormessage);
            }
        } else {         
          yield next
        }
        if (params.testmode) {
            console.log('ddos: handle: end:', table)
        }
    }
    this.express = handle;
    this.middleware = handle;
    this.params = params;
    this.table = table;
}
module.exports = exports = ddos;
