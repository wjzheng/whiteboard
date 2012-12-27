(function(TCC) {

  var TPL = {
    sliderContainer : "<div class='imageContainer'><div class='imageHolder'></div></div>",
    imageItem1 : "<div class='imageItem'><img src='${imageSrc}'/></div>",
    imageItem2 : "<div class='imageItem'><img/></div>",
    imageItem3 : "<div class='multiImageItem'><div class='parentImageThumb'><img/></div><div class='subImageList'></div></div>",
    imageItem4 : "<div class='subImageItem'><div class='childImageThumb'><img/></div></div>",
    leftCtlBtn : "<div class='sliderCtlBtn'><span class='leftArrow'></span></div>",
    rightCtlBtn : "<div class='sliderCtlBtn'><span class='rightArrow'></span></div>"
  }, TYPE = {
    normal : "normal",
    multiLevel : "multiLevel"
  };

  TCC.widget("imageSlider", {

    // default options
    options : {
      dataSource : null,
      type : TYPE.normal,
      width : 800,
      height : 82,
      autoClick : true,
      itemWidth : 110,
      itemHeight : 62,
      subItemWidth : 103,
      subItemHeight : 58,
      itemBorderWidth : 10,
      subItemBorderWidth : 2,
      ctlBtnWidth : 20,
      primaryId : "id",

      clickItemFn : null,
      clickSubItemFn : null,

      showTips : false,
      // tip-yellow,tip-darkgray
      tipStyle : "tip-yellow"
    },

    _prepareParams : function() {
      this.imageItemCount = 0;
      this.totalWidth = 0;
      this.imageContainerWidth = 0;
      this.imageContainer = null;
      this.imageHolder = null;
      this.imageItemFullWidth = this.options.itemWidth + 2 * this.options.itemBorderWidth;
      this.isScrolling = false;
      this.currentSubList = null;
      this.tipsContent = {};
    },

    // render UI
    _create : function() {
      var that = this;
      that._prepareParams();

      // hide root element after render UI
      this.hide();
      this.addClass("imageSlider");
      this.css({
        "width" : this.options.width + "px",
        "height" : this.options.height + "px"
      });
      this.appendChild(TPL.sliderContainer);

      this.imageContainer = this.children(".imageContainer");
      this.imageHolder = this.imageContainer.children(".imageHolder");

      this.imageContainer.css({
        "width" : that._getContainerWidth() + "px",
        "height" : that.options.height + "px"
      });

      // append images to container
      TCC.each(this.options.dataSource, function(index, item) {
        var imageItem = that._genImageItem(item);
        imageItem.attr("index", index);
        that.imageHolder.appendChild(imageItem);
        that.imageItemCount = ++index;
      });

      // create control buttons
      this._adjustCtlBtn();
    },

    _getContainerWidth : function() {
      var width = this.width();
      this.imageContainerWidth = width;
      return width;
    },

    _getTotalWidth : function() {
      if (this.options.type === TYPE.normal) {
        this.totalWidth = this.imageItemCount * this.imageItemFullWidth;
      } else if (this.options.type === TYPE.multiLevel) {
        this.totalWidth = (this.imageItemCount - 1) * this.imageItemFullWidth + this.currentSubList.find(".subImageItem").length * (this.options.subItemWidth + 2 * this.options.subItemBorderWidth);
      }
      return this.totalWidth;
    },

    _genImageItem : function(imageObj) {
      var that = this, imageItem = null;
      if (typeof imageObj === "string") {
        imageItem = TCC.create(TPL.imageItem1.replace("${imageSrc}", imageObj));
        imageItem.css({
          "width" : that.options.itemWidth + "px",
          "height" : that.options.itemHeight + "px"
        });
      } else if (typeof imageObj === "object") {
        if (that.options.type === TYPE.multiLevel && imageObj.hasOwnProperty("subs")) {
          imageItem = TCC.create(TPL.imageItem3);
          for ( var prop in imageObj) {
            if (prop === "imageSrc") {
              var parentThumb = imageItem.find(".parentImageThumb");
              parentThumb.css({
                "width" : that.options.itemWidth + "px",
                "height" : that.options.itemHeight + "px"
              });
              parentThumb.find("img").attr("src", imageObj[prop])
            } else if (prop === "subs") {
              var subImages = imageObj.subs;
              TCC.each(imageObj.subs, function(index, subImageObj) {
                var subImage = TCC.create(TPL.imageItem4);
                subImage.css({
                  "width" : that.options.subItemWidth + "px",
                  "height" : that.options.subItemHeight + "px"
                });
                for ( var subProp in subImageObj) {
                  if (subProp === "tips") {
                    continue;
                  }
                  if (subProp === "imageSrc") {
                    subImage.find("img").attr("src", subImageObj[subProp]);
                  } else {
                    subImage.attr(subProp, subImageObj[subProp]);
                  }
                }
                var subImageList = imageItem.find(".subImageList");
                subImageList.hide();
                subImageList.appendChild(subImage);
              });
            } else if (prop !== "tips") {
              imageItem.find(".parentImageThumb").attr(prop, imageObj[prop]);
            }
          }
        } else {
          imageItem = TCC.create(TPL.imageItem2);
          imageItem.css({
            "width" : that.options.itemWidth + "px",
            "height" : that.options.itemHeight + "px"
          });
          for ( var prop in imageObj) {
            if (prop === "tips") {
              continue;
            }
            if (prop === "imageSrc") {
              imageItem.find("img").attr("src", imageObj[prop]);
            } else {
              imageItem.attr(prop, imageObj[prop]);
            }
          }
        }
      }
      return imageItem;
    },

    _adjustCtlBtn : function() {
      var createBtn = false;
      if (this.options.type === TYPE.normal) {
        var totalWidth = this._getTotalWidth();
        if (totalWidth > this.imageContainerWidth) {
          createBtn = true;
        }
      } else {
        createBtn = true;
      }
      if (createBtn) {
        if (this.find(".sliderCtlBtn").length == 0) {
          this.prepend(TPL.leftCtlBtn);
          this.appendChild(TPL.rightCtlBtn);
          this.css("width", this.options.width + this.options.ctlBtnWidth * 2 + "px");
        } else {
          this.find(".sliderCtlBtn").show();
          this.css("width", this.options.width + this.options.ctlBtnWidth * 2 + "px");
        }
      } else {
        if (this.find(".sliderCtlBtn").length > 0) {
          this.find(".sliderCtlBtn").hide();
          this.css("width", this.options.width + "px");
        }
      }
    },

    // bind events to imageSlider
    _bind : function() {
      var that = this;
      // bind click event to left&right arrow
      this.delegate("click", ".sliderCtlBtn", function(evt) {
        if (!that.isScrolling) {
          that.isScrolling = true;
          var target = evt.currentTarget;
          that._startScroll(target);
        }
      });

      // bind click event to image item
      this.delegate("click", ".imageItem", function(evt) {
        var target = evt.currentTarget;
        that.find(".imageItem.selected").removeClass("selected");
        target.addClass("selected");
        var itemId = target.attr(that.options.primaryId);
        that.clickItem(itemId);
      });

      // bind click event to multi image item
      this.delegate("click", ".multiImageItem", function(evt) {
        var target = evt.currentTarget;
        var currentId = that.currentSubList.parent().find(".parentImageThumb").attr(that.options.primaryId);
        var id = target.find(".parentImageThumb").attr(that.options.primaryId);
        if (currentId != id) {
          that._expandMultiImageItem(target);
        }
      });

      // bind click event to sub image item
      this.delegate("click", ".subImageItem", function(evt) {
        var target = evt.currentTarget;
        evt.e.stopPropagation();

        that.currentSubList.find(".subImageItem").removeClass("selected");
        target.addClass("selected");

        var parentId = that.currentSubList.parent().find(".parentImageThumb").attr(that.options.primaryId);
        var subItemId = target.attr(that.options.primaryId);
        that.clickSubItem(parentId, subItemId);
      });

    },

    _getTipsContent : function(id) {
      var that = this;
      TCC.each(this.options.dataSource, function(idx, item) {
        if (id == item[that.options.primaryId]) {
          that.tipsContent[id] = item.tips || id;
        }
        if (item.subs) {
          TCC.each(item.subs, function(idx, subItem) {
            if (id == subItem[that.options.primaryId]) {
              that.tipsContent[id] = subItem.tips || id;
            }
          });
        }
      })
      return this.tipsContent[id];
    },

    _init : function() {
      // auto click the first image item
      if (this.options.autoClick) {
        if (this.options.type === TYPE.multiLevel) {
          var firstMultiImageItem = this.find(".multiImageItem:first-of-type");
          this._expandMultiImageItem(firstMultiImageItem);
        } else {
          var firstItem = this.find(".imageItem:first-of-type");
          firstItem.trigger("click");
        }
      }
      // show imageSlider after finished event bind
      this.show();
      this._trigger("eventShowed");
    },

    _expandMultiImageItem : function(multiImageItem) {
      var that = this;
      if (this.currentSubList) {
        this.currentSubList.hide();
        this.currentSubList.parent().animate({
          width : that.options.itemWidth + 2 * that.options.itemBorderWidth + "px"
        }, 600);
        this.currentSubList.parent().find(".parentImageThumb").fadeIn();
      }

      var subImageList = multiImageItem.find(".subImageList");
      this.currentSubList = subImageList;
      var subImageListWidth = subImageList.find(".subImageItem").length * (that.options.subItemWidth + 2 * that.options.subItemBorderWidth);
      subImageList.css("width", subImageListWidth + "px");
      subImageList.show();
      multiImageItem.find(".parentImageThumb").hide();
      multiImageItem.animate({
        width : subImageListWidth + 2 * that.options.itemBorderWidth + 2 + "px"
      }, 10, function() {
        var index = parseInt(multiImageItem.attr("index"));
        var prev = multiImageItem.prev("div.multiImageItem");
        if (prev && prev.length > 0) {
          if (index == 0) {
            that.imageHolder.animate({
              left : 0 + "px"
            }, 600);
          } else {
            that.imageHolder.animate({
              left : (-index + 1) * that.imageItemFullWidth + "px"
            }, 600);
          }
        }
      });
      this._getTotalWidth();
      // auto click the first sub image item
      this.currentSubList.find(".subImageItem:first-of-type").trigger("click");
    },

    _startScroll : function(arrowBtn) {
      var that = this;
      var pos = this.imageHolder.position();
      var imageContainerWidth = this.imageContainerWidth;
      var imageItemWidth = this.imageItemFullWidth;
      if (arrowBtn.find(".rightArrow").length > 0) {
        if (imageContainerWidth - pos.left < this.totalWidth) {
          var l = this.imageHolder.position().left;
          this.imageHolder.animate({
            left : l - (imageContainerWidth - imageItemWidth) + "px"
          }, 600, function() {
            that.isScrolling = false;
          });
        } else {
          that.isScrolling = false;
        }
      } else if (arrowBtn.find(".leftArrow").length > 0) {
        if (-pos.left - imageContainerWidth > 0) {
          var l = this.imageHolder.position().left;
          this.imageHolder.animate({
            left : l + (imageContainerWidth - imageItemWidth) + "px"
          }, 600, function() {
            that.isScrolling = false;
          });
        } else {
          this.imageHolder.animate({
            left : 0 + "px"
          }, 600, function() {
            that.isScrolling = false;
          });
        }
      }
    },

    clickItem : function(itemId) {
      if (this.options.clickItemFn) {
        this.options.clickItemFn(itemId);
      }
    },

    clickSubItem : function(parentId, subItemId) {
      if (this.options.clickSubItemFn) {
        this.options.clickSubItemFn(parentId, subItemId);
      }
    },

    // append image item to the container
    addItem : function(itemObj) {
      var imageSrc = itemObj.imageSrc;
      if (!imageSrc) {
        return false;
      }
      // add subItem to data source
      this.options.dataSource.push(itemObj);
      var imageItem = TCC.create(TPL.imageItem1.replace("${imageSrc}", imageSrc));
      for ( var k in itemObj) {
        if (k !== "imageSrc") {
          imageItem.attr(k, itemObj[k]);
        }
      }
      imageItem.css({
        "width" : this.options.itemWidth + "px",
        "height" : this.options.itemHeight + "px"
      });
      imageItem.attr("index", this.imageItemCount);
      this.imageItemCount++;
      this.imageHolder.appendChild(imageItem);
      this._getTotalWidth();
      this._scrollToItem(imageItem);

      this._adjustCtlBtn();
    },

    // add sub item to the parent list container
    addSubItem : function(subItemObj) {
      var that = this;
      var imageSrc = subItemObj.imageSrc;
      if (!imageSrc) {
        return false;
      }
      var subImageItem = TCC.create(TPL.imageItem4);
      subImageItem.find("img").attr("src", imageSrc);
      for ( var k in subItemObj) {
        if (k !== "imageSrc") {
          subImageItem.attr(k, subItemObj[k]);
        }
      }
      subImageItem.css({
        "width" : this.options.subItemWidth + "px",
        "height" : this.options.subItemHeight + "px"
      });
      // add subItem to data source
      var parentId = this.currentSubList.parent().find(".parentImageThumb").attr(this.options.primaryId);
      TCC.each(this.options.dataSource, function(idx, item) {
        var pid = item[that.options.primaryId];
        if (pid == parentId) {
          item.subs.push(subItemObj);
          return false;
        }
      });
      var currentSubListWidth = this.currentSubList.width();
      this.currentSubList.css("width", currentSubListWidth + this.options.subItemWidth + 2 + "px");
      this.currentSubList.appendChild(subImageItem);
      this._getTotalWidth();
      this.currentSubList.parent().animate({
        "width" : this.currentSubList.parent().width() + this.options.subItemWidth + 2 + "px"
      }, 100);

      this._scrollToSubItem(subImageItem);
    },

    // remove the selected image item from the container
    removeItem : function() {
      var that = this;
      var selectedItem = this.find(".imageItem.selected");
      if (selectedItem.length > 0) {
        var nextItem = selectedItem.next("div.imageItem");
        // remove selected item from data source
        var selectedData = this.getSelectedData();
        this.options.dataSource.splice(selectedData.idx, 1);
        // remove selected item from document
        selectedItem.remove();
        this.find("div.imageItem").each(function(item, idx) {
          TCC.find(item).attr("index", idx);
        });
        this.imageItemCount--;
        this._getTotalWidth();
        // auto select the next item
        if (nextItem.length > 0) {
          this._scrollToItem(nextItem);
        }
      }
      this._adjustCtlBtn();
    },

    // remove the selected sub image item from the parent image list container
    removeSubItem : function(subItem) {
      var selectedSubItem = this.currentSubList.find(".subImageItem.selected");
      if (selectedSubItem.length > 0) {
        var nextSubItem = selectedSubItem.next("div.subImageItem");
        var prevSubItem = selectedSubItem.prev("div.subImageItem");
        // remove selected sub item from data source
        var selectedData = this.getSelectedData();
        this.options.dataSource[selectedData.pidx].subs.splice(selectedData.idx, 1);
        // remove selected sub item from document
        selectedSubItem.remove();
        this._getTotalWidth();
        if (nextSubItem.length > 0) {
          var currentSubListWidth = this.currentSubList.width();
          this.currentSubList.css("width", (currentSubListWidth - (this.options.subItemWidth + 2)) + "px");
          this.currentSubList.parent().animate({
            "width" : (this.currentSubList.parent().width() - (this.options.subItemWidth + 2)) + "px"
          }, 100);
          this._scrollToSubItem(nextSubItem);
        } else {
          if (prevSubItem.length > 0) {
            var currentSubListWidth = this.currentSubList.width();
            this.currentSubList.css("width", (currentSubListWidth - (this.options.subItemWidth + 2)) + "px");
            this.currentSubList.parent().animate({
              "width" : (this.currentSubList.parent().width() - (this.options.subItemWidth + 2)) + "px"
            }, 100);
            this._scrollToSubItem(prevSubItem);
          } else {
            var nextImageItem = this.currentSubList.parent().next("div.multiImageItem");
            this.currentSubList.parent().remove();
            this.find("div.multiImageItem").each(function(el, index) {
              TCC.find(el).attr("index", index);
            });
            if (nextImageItem.length > 0) {
              this._expandMultiImageItem(nextImageItem);
            }
            this.imageItemCount--;
          }
        }
      }
    },

    // update the imageSilder's width
    resize : function(width) {
      this.options.width = width;
      this.imageContainerWidth = width;
      this._adjustCtlBtn();
      this.imageContainer.css("width", width + "px");
    },

    // reload dataSource
    refresh : function(dataSource) {
      var that = this;
      if (dataSource.length > 0) {
        this.imageItemCount = 0;
        if (this.options.type === TYPE.normal) {
          this._destroyTips();
          this.imageHolder.clear();
          TCC.each(dataSource, function(index, item) {
            var imageItem = that._genImageItem(item);
            imageItem.attr("index", index);
            that.imageHolder.appendChild(imageItem);
            that.imageItemCount = ++index;
          });
          that._getContainerWidth();
          that._getTotalWidth();
          that._adjustCtlBtn();
        } else {
          // TODO
        }
      } else {
        this.imageHolder.clear();
      }
    },

    _destroyTips : function() {
      if (this.options.showTips === true) {
        this.imageContainer.find(".imageItem,.subImageItem,.parentImageThumb").originalObj.poshytip("destroy");
      }
    },

    getSelectedData : function() {
      var that = this, selectedData = {
        idx : 0,
        data : null,
        pidx : 0
      };
      if (this.options.type === TYPE.normal) {
        var ds = this.options.dataSource;
        var selectedItem = this.find(".imageItem.selected");
        var pid = selectedItem.attr(this.options.primaryId);
        TCC.each(ds, function(index, item) {
          if (pid == item[that.options.primaryId]) {
            selectedData.idx = index;
            selectedData.data = item;
            return false;
          }
        });
      } else if (this.options.type === TYPE.multiLevel) {
        var ds = this.options.dataSource;
        var pid = this.currentSubList.find(".subImageItem.selected").attr(this.options.primaryId);
        var ppid = this.currentSubList.parent().find(".parentImageThumb").attr(this.options.primaryId);
        TCC.each(ds, function(index1, item) {
          if (ppid == item[that.options.primaryId]) {
            TCC.each(item.subs, function(index2, subItem) {
              if (pid == subItem[that.options.primaryId]) {
                selectedData.idx = index2;
                selectedData.data = subItem;
                selectedData.pidx = index1;
                return false;
              }
            });
          }
        });
      }
      return selectedData;
    },

    _scrollToItem : function(imageItem) {
      var that = this;
      this.find(".imageItem").removeClass("selected");
      imageItem.addClass("selected");
      var imageHolderPos = this.imageHolder.position();
      var imageItemPos = imageItem.position();
      var overflow = (imageHolderPos.left + imageItemPos.left + this.imageItemFullWidth) - this.imageContainerWidth;
      if (overflow > 0) {
        var l = this.imageHolder.position().left;
        this.imageHolder.animate({
          left : l - (overflow + this.imageItemFullWidth) + "px"
        }, 600);
      }
      // click the selected item
      if (this.options.autoClick) {
        imageItem.trigger("click");
      }
    },

    _scrollToSubItem : function(subItem) {
      var that = this;
      this.find(".subImageItem.selected").removeClass("selected");
      subItem.addClass("selected");
      var imageHolderPos = this.imageHolder.position();
      var subImageItemPos = subItem.position();
      var overflow = (imageHolderPos.left + subImageItemPos.left + this.options.subItemWidth + 2) - this.imageContainerWidth;
      if (overflow > 0) {
        var l = this.imageHolder.position().left;
        this.imageHolder.animate({
          left : l - (overflow + this.options.subItemWidth + 2) + "px"
        }, 600);
      }
      overflow = imageHolderPos.left + subImageItemPos.left;
      if (overflow < 0) {
        var l = this.imageHolder.position().left;
        this.imageHolder.animate({
          left : l - (Math.abs(overflow) + this.options.subItemWidth + 2) + "px"
        }, 600);
      }
      // click the selected sub item
      subItem.trigger("click");
    },

    destroy : function() {
      console.log("destroy");
    }
  });
})(TCC);
