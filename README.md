Configurable Denial-Of-Service prevention for http services

<img align="right" src="stopcat.jpg">

[![Build Status](https://travis-ci.org/rook2pawn/node-ddos.svg?branch=master)](https://travis-ci.org/rook2pawn/node-ddos)

[![Coverage Status](https://coveralls.io/repos/github/rook2pawn/node-ddos/badge.svg?branch=master)](https://coveralls.io/github/rook2pawn/node-ddos?branch=master)

# install

```
    npm install --save ddos
```

# setup helper (new!)

```
    npm run setup-helper
```

Run `npm run setup-helper` and place the console side by side with your browser window and reload a few times and see how `burst` and `limit` are separate
concepts. `burst` controls the expiry timer, and `limit` is what governs the actual denial. I made a [video tutorial](https://youtu.be/yx2T0oaF2T0) on this, which should
give you an intuitive sense of what's going on. Play with the limit and burst in the `setupHelper.js`.



# A Quick Overview

```js
    var Ddos = require('ddos')
    var express = require('express')
    var ddos = new Ddos({burst:10, limit:15})
    var app = express();
    app.use(ddos.express);
```

* **Rule 1** Every request per user increments an internal **count**. When the count exceeds the **limit**, the requests are denied with a HTTP 429 Too Many Requests.

* **Rule 2** The *only* way for count to go away, is for an internal expiration time to expire, called the **expiry**, and is measured in seconds. Every second, the expiry time will go down by one.

The first request comes in and the expiry is set to 1 second. If 1 second passes and no additional requests are made, then the entry is removed
from the internal table. In fact, there can be up to **burst** amount of requests made and the **expiry time will not change**.
The only way the expiry goes up is when a request comes, the count goes up, and then if the count *exceeds* the burst amount (greater than, not greater than or equal to), then the expiry goes up to twice its previous value.

Every time the table is checked (defaults to 1 second, configurable by the **checkinterval** setting), the expiry goes down by that amount of time.
Now we loop back to **Rule 2** when that when expiry is less than or equal to 0, then that entry is removed along with the count.


## Features

[![Join the chat at https://gitter.im/rook2pawn/node-ddos](https://badges.gitter.im/rook2pawn/node-ddos.svg)](https://gitter.im/rook2pawn/node-ddos?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

    * support the X-Forwarded-For header in a reverse proxy request

## Supports

    * HapiJS 17+ 
    * HapiJS 16 and before
    * Express 4+
    * Koa

### With [Express](https://github.com/expressjs/expressjs.com "Express")

```js
    var Ddos = require('ddos')
    var express = require('express')
    var ddos = new Ddos;
    var app = express();
    app.use(ddos.express)
```

or with a router

```js
    const router = express.Router();

    router.use(ddos.express);
    router.get("/", (req,res,next) => {
      console.log("Beep");
      res.end("Boop");
    })
    app.use(router);
```
This way, all paths defined on the router will be protected.

### With [HapiJS 17+](https://hapijs.com/ "HapiJS")

```js
    var Ddos = require('ddos')
    var Hapi = require('hapi');

    var ddos = new Ddos;
    const server = Hapi.server({
      port: 3000,
      host: "localhost"
    });
    server.route({
        method: "GET",
        path: "/",
        handler: (request, h) => {
            return "Hello, world!";
        }
    });
    server.ext("onRequest", ddos.hapi17.bind(ddos));

    server.start()
    .then(() => {

    })

```

### With [HapiJS 16 and before](https://hapijs.com/ "HapiJS")

```js
    var Ddos = require('ddos')
    var Hapi = require('hapi');

    var ddos = new Ddos;
    const server = new Hapi.Server();
    server.ext('onRequest', ddos.hapi.bind(ddos));
```

### With [Koa](http://koajs.com "KoaJS")

```js
    var Ddos = require('ddos')
    var koa = require('koa')
    var ddos = new Ddos;

    var app = new koa;
    app.use(ddos.koa().bind(ddos)) // be sure to bind ddos as koa rebinds the context
```

### With [Router-Middleware](https://github.com/rook2pawn/router-middleware "Router Middleware")

```js
    var Router = require('router-middleware');
    var Ddos = require('ddos')

    var ddos = new Ddos;
    var app = Router();
    app.use(ddos);
```

## How does this ddos prevention module work?

Every request marks the internal table and increments the `count`.
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

## Processing and Memory Usage by this module

There is only ONE table, and within it only one small entry per IP, and that entry is transient and will be deleted within normal parameters. The table itself is combed over at the configurable **checkinterval** in seconds.

## Yes, this will not deal with distributed denial-of-service attacks

But it will deal with simple DOS ones, but the concept is associated with DDOS whereas DOS is about the classic operating system from the 90's.


## Let's review Configuration

To override any configuration option, simply specify it at construction time.

```js
    var Ddos = require('ddos');
    var ddos = new Ddos({burst:3,limit:4,testmode:true,whitelist:['74.125.224.72']});
```

Let's go over the configuration options to help illustrate how this module works.
All of the configurations default to the following:

    params.maxcount = 30;
    params.burst = 5;
    params.limit = _params.burst * 4;
    params.maxexpiry = 120;
    params.checkinterval = 1;
    params.trustProxy = true;
    params.includeUserAgent = true;
    params.whitelist = [];
    params.errormessage = 'Error';
    params.testmode = false;
    params.responseStatus = 429;

### testmode

`testmode` allows you to see exactly how your setup is functioning.

### limit

`limit` is the number of maximum counts allowed (do not confuse that with maxcount). `count` increments with each request.
If the `count` exceeds the `limit`, then the request is denied. Recommended limit is to use a multiple of the number of bursts.


### maxcount

When the `count` exceeds the `limit` and then the `maxcount`, the count is reduced to the `maxcount`. The maxcount is simply is the maximum amount of "punishment" that could be applied to a denial time-out.


### burst

Burst is the number or amount of allowable burst requests before the client starts being penalized.
When the client is penalized, the expiration is increased by twice the previous expiration.


### maxexpiry

maxexpiry is the seconds of maximum amount of expiration time.
In order for the user to use whatever service you are providing again, they have to wait through the expiration time.


### checkinterval

checkinterval is the seconds between updating the internal table.

### trustProxy

Defaults to true. If true then we use the x-forwarded-for header, otherwise we use the remote address.

```js
    var host = _params.trustProxy ? (req.headers['x-forwarded-for'] || req.connection.remoteAddress) : req.connection.remoteAddress
```

### includeUserAgent

Defaults to true. If true we include the user agent as part of identifying a unique user. If false, then we only use IP. If set to false
this can lead to an entire block being banned unintentionally. Included to leave it up to the developer how they want to use it.


### whitelist

Defaults to empty list. Specify the IP's or addresses you would like to whitelist

```js
    var Ddos = require('ddos');
    var ddos = new Ddos({whitelist:['74.125.224.72', '216.239.63.255']});
```

Whitelisted IP's bypass all table checks. If the address in question is in IPV6 form, simply enable testmode

```js
    var ddos = new Ddos({whitelist:['74.125.224.72', '216.239.63.255'], testmode:true});
```

and see the exact form of the address you want to whitelist. See this [link on stackoverflow about IPv6 addresses](http://stackoverflow.com/questions/29411551/express-js-req-ip-is-returning-ffff127-0-0-1)

### .addWhitelist(ip)

Update whitelist while running.

```js
    ddos.addWhitelist('74.125.224.72')
```

### errormessage

When a request is denied, the user receives a 429 and the error message.

### responseStatus

By default HTTP status code 429 (Too Many Requests) are sent in response.

### onDenial

If this callback is specified, it will be called with the `req` object on a denial. Useful for logging.

```js
  const onDenial = function(req) {
    // log it
  }
  const ddos = new Ddos({ limit: 2, onDenial });
```

Contribute
==========

Contributions welcome!


LICENSE
=======

MIT
