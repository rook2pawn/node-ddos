var router = function(req,res) {
    var routes = { POST : {}, GET : {}};
    var setter = function(method) {
        return function() {
            var args = [].concat.apply({},arguments).slice(1);
            routes[method][args[0]] = args.slice(1);
        }
    }
    this.get = setter('GET');
    this.post = setter('POST');
    var next = function() {
        routes[this.req.method][this.req.url][++this.index](this.req,this.res,next.bind({req:this.req,res:this.res,index:this.index}));
    }
    this.handle = function(req,res) {
        if (routes[req.method][req.url])
            routes[req.method][req.url][0](req,res,next.bind({req:req,res:res,index:0}));
    }
}
module.exports = exports = router
