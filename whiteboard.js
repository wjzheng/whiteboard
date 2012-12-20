var express = require('express');
var routes = require('./routes');
var msgServer = require('./server/wbMsgServer');
var app = express.createServer();
msgServer.initWbMsgServer(app);

app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.router(routes));
  app.use(express.static(__dirname + '/public'));
  app.register('html', require('ejs'));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.set('env', 'development');
});

app.configure('development', function() {
  app.use(express.errorHandler({
    dumpExceptions : true,
    showStack : true
  }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});
app.listen(80);
console.log('Webchat server listening on port 80');