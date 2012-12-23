var datasource = require("./datasource");
var mongoose = require('mongoose');

exports.connect = function() {
  var dburl = "mongodb://" + datasource.conf.host + ":" + datasource.conf.port + "/" + datasource.conf.db;
  console.log("connect to mongoDB:" + dburl);
  mongoose.connect(dburl);
}

exports.disconnect = function(callback) {
  mongoose.disconnect(callback);
}

exports.addModel = function(tableName, object) {
  return mongoose.model(tableName, new mongoose.Schema(object));
}
