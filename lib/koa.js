const koa_handler = function(params,table,handle) {

  return async function (ctx, next) {

    var req = ctx.req;
    var res = ctx.res;

    handle(params, table, req, res, next);
  };
};

module.exports = exports = koa_handler;
