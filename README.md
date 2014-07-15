Configurable Denial-Of-Service prevention for http services

[![Build Status](https://travis-ci.org/rook2pawn/node-ddos.svg?branch=master)](https://travis-ci.org/rook2pawn/node-ddos)


example
=======

    var Ddos = require('ddos')
    var ddos = new Ddos;
    var express = require('express')
    var app = express();
    app.use(ddos.express)


How does this ddos prevention module work?
==========================================

Every request marks the internal table.
This is how an entry in the table managed by this module looks

    { host : <ip address>, count: 5, expiry: 6 }

When count exceeds the limit, then the request is denied, otherwise, the request is permitted.

Every time the internal table is checked, the expiration goes down by the time elapsed.
When expiration hits 0, the entry is deleted from the table, and new requests are allowed like normal.


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

When a request is denied, the user receives a 500 and the error message.
