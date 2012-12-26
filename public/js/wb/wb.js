$(function() {

  var socket = io.connect();
  wb.init("#whiteboard", {
    // width : 800,
    // height : 320,
    imagePos : "center",
    toolbarPos : "left",
    moveImage : true
  });
  // init wb client
  var username = $("#username").text();
  wbMsgClient.init(socket, username);

  // clear wb
  $("#clear_wb").click(function(evt) {
    wb.clear();
  });

  // toggle online user panel
  $("#onlineUserBtn").click(function(evt) {
    var btn = $(this);
    var h = btn.height();
    var pos = btn.position();
    $("#onlineUsers").css({
      top : pos.top + h + 5,
      left : pos.left
    });
    $("#onlineUsers").toggle();
  });

  // save image
  $("#save_img").click(function(evt) {
    var imageContent = wb.getImage();
    wbMsgClient.saveImage(imageContent);
  });

  // click image
  $("#wb_images").delegate(".imageItem", "click", function() {
    var filePath = $(this).data("filePath");
    wb.loadImage(filePath);
  });

  // handle upload request
  // var uploader = new qq.FineUploader({
  // element : $('#uploadImg')[0],
  // text : {
  // uploadButton : "Upload image"
  // },
  // validation : {
  // allowedExtensions : [ "jpg", "gif", "png", "bmp", "jpeg" ],
  // sizeLimit : 5 * 1024 * 1024
  // },
  // listElement : $('#uploadImageList')[0],
  // request : {
  // endpoint : "/ajaxUploader"
  // },
  // callbacks : {
  // onComplete : function(id, fileName, responseJSON) {
  // wb.loadImage("/uploads/" + fileName);
  // },
  // onError : function(event, id, fileName, reason) {
  // qq.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
  // }
  // }
  // });
});