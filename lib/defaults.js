
function genDefaults () {
  const defaults = {};
  // burst, maxexpiry, checkinterval is in seconds
  defaults.maxcount = 30;
  defaults.burst = 5;
  defaults.checkinterval = 1;

  // limit is the maximum count
  defaults.limit = defaults.burst * 4;

  defaults.maxexpiry = 120;
  defaults.trustProxy = true;
  defaults.includeUserAgent = true;
  defaults.whitelist = [];
  defaults.errormessage = "Error";
  defaults.testmode = false;
  defaults.responseStatus = 429;
  return defaults;
}

module.exports = exports = genDefaults;
