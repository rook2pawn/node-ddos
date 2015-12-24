var http = require('http');
var express = require('express');
var request = require('request');
var response = require('response');
var Ddos = require('../');
var ddos = new Ddos({burst:3,limit:4,testmode:true});
var app = express();
app.use(ddos.express);
var server = http.createServer(app);

var QL = require('queuelib')
var q = new QL;

server.listen(5050);

var a = function(req,res,next) {
    next()
}
var b = function(req,res,next) {
    // some more random middleware
    next()
}
var c = function(req,res,next) {
    response.json({foo:"bar"}).pipe(res)
}
app.get('/article',a,b,c);

var tape = require('tape')
tape('count and expiry test', function(t) {
    t.plan(7)
    q.series([
        function(lib) {
        request.get({url:'http://localhost:5050/article', json:true}, function(err, resp, body) {
            var key = Object.keys(ddos.table)[0]
            t.deepEqual(ddos.table[key], {count:1, expiry:1})
            lib.done()
        })
        },
        function(lib) {
        request.get({url:'http://localhost:5050/article', json:true}, function(err, resp, body) {
            var key = Object.keys(ddos.table)[0]
            t.deepEqual(ddos.table[key], {count:2, expiry:1})
            lib.done()
        })
        },
        function(lib) {
        request.get({url:'http://localhost:5050/article', json:true}, function(err, resp, body) {
            var key = Object.keys(ddos.table)[0]
            t.deepEqual(ddos.table[key], {count:3, expiry:1})
            lib.done()
        })
        },
        function(lib) {
        request.get({url:'http://localhost:5050/article', json:true}, function(err, resp, body) {
            var key = Object.keys(ddos.table)[0]
            t.deepEqual(ddos.table[key], {count:4, expiry:2})
            lib.done()
        })
        },
        function(lib) {
        request.get({url:'http://localhost:5050/article', json:true}, function(err, resp, body) {
            var key = Object.keys(ddos.table)[0]
            t.deepEqual(ddos.table[key], {count:5, expiry:4})
            t.equal(resp.statusCode, 429, 'should be 429')
            t.equal(body.count, 5, 'should be 5')        
            lib.done()
        })
        },
        function(lib) {
            lib.done()
            t.end()
        }
    ],
    100)
})

tape('then', function(t) {
    t.plan(1)
    setTimeout(function() {
        request.get({url:'http://localhost:5050/article', json:true}, function(err, resp, body) {
            var key = Object.keys(ddos.table)[0]
            // should start at {count:5, expiry:1} since 4 - 3 = 1
            // after a request, it should penalize for being over burst, which means
            // expiry goes to 2 
            t.deepEqual(ddos.table[key], {count:6, expiry:2})
        })
    },3100)
})

tape('finally',function(t) {
    t.plan(2)
    setTimeout(function() {
        t.deepEqual(ddos.table, {})
        request.get({url:'http://localhost:5050/article', json:true}, function(err, resp, body) {
            var key = Object.keys(ddos.table)[0]
            t.deepEqual(ddos.table[key], {count:1,expiry:1})
            server.close()
            ddos.stop()
        })
    },2100)
})
