var dbManager = require("./db/wbDBManager");
var util = require('util');
var User = {
  username : String,
  password : String
};

var UserModel = dbManager.addModel("User", User);

exports.add = function(username, password, callback) {
  var userObj = new UserModel();
  userObj.username = username;
  userObj.password = password;
  userObj.save(function(err) {
    if (err) {
      util.log('FATAL ' + err);
      callback(err, null);
    } else {
      callback(null, arguments[1]);
    }
  })
}

exports.getUser = function(username, callback) {
  UserModel.findOne({
    username : username
  }, function(err, doc) {
    if (err) {
      util.log('FATAL ' + err);
      callback(err, null);
    } else {
      callback(null, doc);
    }
  });
}