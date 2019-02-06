var Ddos = require('./')
const opener = require("opener");
var express = require('express')
var ddos = new Ddos({
  burst:4,
  limit:4,
  testmode:true
});
var app = express();
app.use(ddos.express);
app.get("/", (req,res,next) => {
  console.log("Beep");
  res.end("Boop");
})
app.listen(5150, () => {
  opener("http://127.0.0.1:5150");
});
