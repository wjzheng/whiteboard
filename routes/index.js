var fs = require("fs");
var crypto = require('crypto');
var ajaxUploader = require("../server/ajaxUploader");
ajaxUploader.settings({
  tmpDir : './public/uploads/',
  fileDir : "./public/uploads/"
});
var userManager = require("../server/wbUserManager");

module.exports = function(app) {
  app.get('/', function(req, res) {
    res.render('index.html');
  });

  app.get('/register', function(req, res) {
    res.render('register.html');
  });

  app.post('/register', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var md5 = crypto.createHash('md5');
    password = md5.update(password).digest('base64');
    userManager.add(username, password, function(err, user) {
      if (err) {
        res.redirect("back");
      } else {
        req.session.user = user;
        res.redirect("/wb");
      }
    });
  });

  app.get("/login", function(req, res) {
    res.render('login.html');
  });

  app.get("/logout", function(req, res) {
    req.session.user = null;
    res.redirect("/");
  });

  app.post("/login", function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var md5 = crypto.createHash('md5');
    password = md5.update(password).digest('base64');
    userManager.getUser(username, function(err, user) {
      var errMsg = "Incorrect username or password.";
      if (user) {
        if (user.password === password) {
          req.session.user = user;
          return res.redirect("/wb");
        } else {
          req.flash("error", errMsg);
          return res.redirect("/login");
        }
      } else {
        req.flash("error", errMsg);
        return res.redirect("/login");
      }
    });
  });

  app.get('/wb', checkLogin, function(req, res) {
    res.render('wb.html');
  });

  app.get('/up', function(req, res) {
    res.render('uploader.html', {
      layout : false
    });
  });

  app.post('/file-upload', function(req, res, next) {
    var tmpFile = req.files.uploadImg.path;
    var targetFile = './public/uploads/' + req.files.uploadImg.name;
    fs.rename(tmpFile, targetFile, function(err) {
      console.log(err);
    });
    res.send('File uploaded to: ' + targetFile + ' - ' + req.files.uploadImg.size + ' bytes');
  });

  app.post('/ajaxUploader', function(req, res) {
    ajaxUploader.upload(req, res, function(data) {
      if (data.success)
        res.send(JSON.stringify(data), {
          'Content-Type' : 'text/plain'
        }, 200);
      else
        res.send(JSON.stringify(data), {
          'Content-Type' : 'text/plain'
        }, 404);
    });
  });
}

function checkLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}