const koa_handler = function(params, table, handle) {
  return function(ctx, next) {
    var req = ctx.req;
    var res = ctx.res;

    return handle(params, table, req);
  };
};

module.exports = exports = koa_handler;
