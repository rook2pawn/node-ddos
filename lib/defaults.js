
// burst, maxexpiry, checkinterval is in seconds
exports.maxcount = 30;
exports.burst = 5;
exports.checkinterval = 1;

// limit is the maximum count
exports.limit = exports.burst * 4;  

exports.maxexpiry = 120;
exports.trustProxy = true;
exports.includeUserAgent = true;
exports.whitelist = [];
exports.errormessage = 'Error';
exports.testmode = false;
exports.silent = false;
exports.silentStart = true;
exports.responseStatus = 429;
