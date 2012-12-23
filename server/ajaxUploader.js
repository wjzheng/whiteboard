var fs = require('fs');
var uuid = require('node-uuid');
var tmpDir = "./uploads/";
var fileDir = "./uploads/";
var uploadURL = "/ajaxUploader";

exports.upload = function(req, res, callback) {
  var moveToDestination = function(sourcefile, targetfile) {
    moveFile(sourcefile, targetfile, function(err) {
      if (!err)
        callback({
          success : true
        });
      else
        callback({
          success : false,
          error : err
        });
    });
  };

  if (req.xhr) {
    var fname = req.header('x-file-name');
    var tmpFile = tmpDir + uuid.v1();
    var ws = fs.createWriteStream(tmpFile);
    ws.on('error', function(err) {
      console.log("uploadFile() - req.xhr - could not open writestream.");
      callback({
        success : false,
        error : "Sorry, could not open writestream."
      });
    });
    ws.on('close', function(err) {
      moveToDestination(tmpFile, fileDir + fname);
    });
    req.on('data', function(data) {
      ws.write(data);
    });
    req.on('end', function() {
      ws.end();
    });
  } else {
    moveToDestination(req.files.qqfile.path, fileDir + req.files.qqfile.name);
  }
};

function moveFile(source, dest, callback) {
  var is = fs.createReadStream(source)
  is.on('error', function(err) {
    console.log('moveFile() - Could not open readstream.');
    callback('Sorry, could not open readstream.')
  });
  is.on('end', function() {
    fs.unlinkSync(source);
    callback();
  });
  var os = fs.createWriteStream(dest);
  os.on('error', function(err) {
    console.log('moveFile() - Could not open writestream.');
    callback('Sorry, could not open writestream.');
  });
  is.pipe(os);
}

exports.settings = function(options) {
  if (options.tmpDir) {
    tmpDir = options.tmpDir;
  }

  if (options.fileDir) {
    fileDir = options.fileDir;
  }

  if (options.uploadURL) {
    uploadURL = options.uploadURL;
  }
}