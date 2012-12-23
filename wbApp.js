var express = require('express');
var routes = require('./routes');
var msgServer = require('./server/wbMsgServer');
var dbManager = require("./server/db/wbDBManager");
var app = express.createServer();
var io = require('socket.io');
io = io.listen(app);
msgServer.initWbMsgServer(io);

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.register('html', require('ejs'));
  app.use(express.static(__dirname + '/public'));

  app.use(express.bodyParser({
    // setting upload file dir
    uploadDir : './public/uploads/'
  }));
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({
    secret : "kim whiteboard"
  }));
  app.use(express.router(routes));
  app.set('env', 'production');
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

app.dynamicHelpers({
  user : function(req, res) {
    return req.session.user;
  },
  info : function(req, res) {
    return req.flash('info');
  },
  error : function(req, res) {
    return req.flash('error');
  }
});

// init mongodb connection
dbManager.connect(function(error) {
  if (error)
    throw error;
});
app.on("close", function(err) {
  dbManager.disconnect(function(err) {
    console.log(err);
  });
});

app.listen(80);
console.log('Webchat server listening on port 80');