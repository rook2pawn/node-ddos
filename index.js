var Hash = require('hashish')
var ddos = function(params) {
    // burst, maxexpiry, checkinterval is in seconds
    // limit is the maximum count
    var _params = {}
    _params.maxcount = 30;
    _params.burst = 5;
    _params.limit = _params.burst * 4;  
    _params.maxexpiry = 120;
    _params.checkinterval = 1;
    _params.errormessage = 'Error';
    _params.detailfeedback = false;
    if (!params) {
        params = _params;
    } else {
        Hash(_params).update(params)
        params = _params
    }
    console.log("ddos: starting params: ", params)
    var table = {}
    var update = function() {
        console.log("ddos: update", table)
        var keys = Object.keys(table)
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i]
            table[key].expiry -= params.checkinterval;
            if (table[key].expiry === 0) 
                delete table[key]
        }
    }
    var timer = setInterval(update,params.checkinterval*1000) 
    this.stop = function() {
        if (timer) 
            clearInterval(timer)
    }
    var handle = function(req,res,next) {
        var host = req.headers.host;
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
                table[host].expiry += params.checkinterval;
            }
        }
        if (table[host].count > params.limit) {
            console.log('ddos: denied: entry:', table[host])
            if (params.detailfeedback) {
                res.json(500, table[host])
            } else {
                res.writeHead(500);
                res.end(params.errormessage);
            }
        } else {         
            next()
        }
    }
    this.express = handle;
    this.middleware = handle;
    this.params = params;
    this.table = table;
}
module.exports = exports = ddos;
