var http = require('http');
var express = require('express')
var request = require('request');
var response = require('response')
var Ddos = require('../');
var ddos = new Ddos;
var app = express();
app.use(ddos.express)
var server = http.createServer(app);

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


var x = 0;
for (var i = 0; i < 25; i++) {
    request.get({url:'http://localhost:5050/article', json:true}, function(err, resp, body) {
        x++;
        console.log(x,body)
    })
}
setInterval(function() {
    request.get({url:'http://localhost:5050/article', json:true}, function(err, resp, body) {
        console.log(body)
    })
},5000)
