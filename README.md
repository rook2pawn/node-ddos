Configurable Denial-Of-Service prevention for http services

[![Build Status](https://travis-ci.org/rook2pawn/node-ddos.svg?branch=master)](https://travis-ci.org/rook2pawn/node-ddos)


Features
========

    * support the X-Forwarded-For header in a reverse proxy request 

Supports
========

    * Express 4+
    * Koa, or 
    * Any middleware stack that supports *next* 
      e.g. fn (req,res,next)

With Express
============

    var Ddos = require('ddos')
    var ddos = new Ddos;
    var express = require('express')
    var app = express();
    app.use(ddos.express)

With Koa 
========

    var Ddos = require('ddos')
    var ddos = new Ddos;
    var koa = require('koa')
    var app = koa()
    app.use(ddos.koa)


Any Middleware Stack with fn(req,res,next)
==========================================

    var http = require('http')
    var Ddos = require('ddos')
    var ddos = new Ddos;
    
    http.createServer(ddos.handle)



How does this ddos prevention module work?
==========================================

Every request marks the internal table.
This is how an entry in the table managed by this module looks

    { host : <ip address>, count: 1, expiry: 1 }

When a second request is made

    { host : <ip address>, count: 2, expiry: 1 }

and the third 

    { host : <ip address>, count: 3, expiry: 1 }

and so on. If the count exceeds the configurable **burst** amount, then the expiry goes up by twice the previous expiry, 1, 2, 4, 8, 16, etc.

When count exceeds the **limit**, then the request is denied, otherwise, the request is permitted.

Every time the internal table is checked, the expiration goes down by the time elapsed.

The only way for a user who has denied requests to continue is for them to let the expiration time pass, and when expiration hits 0, the entry is deleted from the table, and new requests are allowed like normal.

Processing and Memory Usage by this module
==========================================

There is only ONE table, and within it only one small entry per IP, and that entry is transient and will be deleted within normal parameters. The table itself is combed over at the configurable **checkinterval** in seconds.

Yes, this will not deal with distributed denial-of-service attacks
==================================================================

But it will deal with simple DOS ones, but the concept is associated with DDOS whereas DOS is about the classic operating system from the 90's.


Let's review Configuration
==========================

Let's go over the configuration options to help illustrate how this module works.
All of the configurations default to the following:

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


params.limit 
------------

limit is the number of maximum counts allowed.
If the count exceeds the limit, then the request is denied.
Recommended limit is to use a multiple of the number of bursts.


params.burst
------------

Burst is the number or amount of allowable burst requests before the client starts being penalized.
When the client is penalized, the expiration is increased by twice the previous expiration.


params.maxexpiry
----------------

maxexpiry is the seconds of maximum amount of expiration time. 
In order for the user to use whatever service you are providing again, they have to wait through the expiration time.


params.checkinterval
--------------------

checkinterval is the seconds between updating the internal table. 

params.errormessage
-------------------

When a request is denied, the user receives a 429 and the error message.

params.responseStatus
-------------------

By default HTTP status code 429 (Too Many Requests) are sent in response.



TODO
====

Looking for a more advanced Koa test!



Contribute
==========

Contributions welcome!
