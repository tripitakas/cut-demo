/* global $, Raphael */
(function() {
  'use strict';

  function getDistance(a, b) {
    var cx = a.x - b.x, cy = a.y - b.y;
    return Math.sqrt(cx * cx + cy * cy);
  }

  function getHandle(el, index) {
    var box = el.getBBox();
    var pt;

    if (!box) {
      return {};
    }
    switch (index) {
      case 0:   // left top
        pt = [box.x, box.y];
        break;
      case 1:   // right top
        pt = [box.x + box.width, box.y];
        break;
      case 2:   // right bottom
        pt = [box.x + box.width, box.y + box.height];
        break;
      case 3:   // left bottom
        pt = [box.x, box.y + box.height];
        break;
      case 4:   // top center
        pt = [box.x + box.width / 2, box.y];
        break;
      case 5:   // right center
        pt = [box.x + box.width, box.y + box.height / 2];
        break;
      case 6:   // bottom center
        pt = [box.x + box.width / 2, box.y + box.height];
        break;
      case 7:   // left center
        pt = [box.x, box.y + box.height / 2];
        break;
      default:  // center
        pt = [box.x + box.width / 2, box.y + box.height / 2];
        break;
    }

    return {x: pt[0], y: pt[1]};
  }

  function setHandle(el, index, pt) {
    var pts = [0, 0, 0, 0];

    for (var i = 0; i < 4; i++) {
      pts[i] = getHandle(el, Math.floor(index / 4) * 4 + i);
    }
    pts[index % 4] = pt;

    if (index >= 0 && index < 4) {
      if (index % 2 === 0) {
        pts[(index + 1) % 4].y = pt.y;
        pts[(index + 3) % 4].x = pt.x;
      } else {
        pts[(index + 1) % 4].x = pt.x;
        pts[(index + 3) % 4].y = pt.y;
      }
      var x1 = Math.min(pts[0].x, pts[1].x, pts[2].x, pts[3].x);
      var y1 = Math.min(pts[0].y, pts[1].y, pts[2].y, pts[3].y);
      var x2 = Math.max(pts[0].x, pts[1].x, pts[2].x, pts[3].x);
      var y2 = Math.max(pts[0].y, pts[1].y, pts[2].y, pts[3].y);
      return createRect({x: x1, y: y1}, {x: x2, y: y2});
    }
    else if (index >= 4 && index < 8) {
      return createRect({x: pts[3].x, y: pts[2].y}, {x: pts[1].x, y: pts[0].y});
    }
  }

  // 根据两个对角点创建字框图形，要求字框的宽高都不小于5
  function createRect(pt1, pt2) {
    var width = Math.abs(pt1.x - pt2.x), height = Math.abs(pt1.y - pt2.y);
    if (width >= 5 && height >= 5) {
      var x = Math.min(pt1.x, pt2.x), y = Math.min(pt1.y, pt2.y);
      return data.paper.rect(x, y, width, height);
    }
  }

  function rgb_a(rgb, a) {
    var c = Raphael.color(rgb);
    return 'rgba(' + [c.r, c.g, c.b, a].join(',') + ')';
  }

  var data = {
    normalColor: '#af82e4',                   // 正常字框的线色
    changedColor: '#e44349',                  // 改动字框的线色
    hoverColor: '#e42d81',                    // 掠过时的字框线色
    hoverFill: '#e474d3',                     // 掠过时的字框填充色
    handleColor: '#e3e459',                   // 字框控制点的线色
    handleFill: '#ffffff',                    // 字框控制点的填充色
    activeHandleColor: '#72141d',             // 活动控制点的线色
    activeHandleFill: '#0000ff',              // 活动控制点的填充色
    handleSize: 2,                            // 字框控制点的半宽
    boxFill: 'rgba(0, 0, 0, .01)',            // 默认的字框填充色，不能全透明
    ratio: 1,               // 缩放比例
    paper: null,            // Raphael 画布
    image: null,            // 背景图
    chars: []               // OCR识别出的字框
  };
  
  $.cut = {
    data: data,
    hover: {
      box: null,            // 掠过的字框
      stroke: 0,            // 字框原来的线色
      fill: 0,              // 字框原来的填充色，鼠标离开框后变为0
      down: null,           // 按下的坐标，未按下时为假
      edit: null,           // 正拖曳的字框
      originBox: null,      // 改动前的字框
      strokeBeforeEdit: 0,  // 拖曳字框原来的线色
      handles: [],          // 字框的控制点框
      activeHandle: -1      // 当前拖动的手柄框序号
    },

    create: function(p) {
      var self = this;
      var hover = this.hover;

      var showHandles = function(el) {
        var i, pt, r;
        var size = data.handleSize * ((data.ratio - 1) * 0.4 + 1);

        for (i = 0; i < hover.handles.length; i++) {
          hover.handles[i].remove();
        }
        hover.handles.length = 0;

        if (el) {
          for (i = 0; i < 8; i++) {
            pt = getHandle(el, i);
            r = data.paper.rect(pt.x - size, pt.y - size, size * 2, size * 2)
              .attr({
                stroke: i === hover.activeHandle ? data.activeHandleColor : data.hoverColor,
                fill: i === hover.activeHandle ? rgb_a(data.activeHandleFill, .8) : rgb_a(data.handleFill, .4)
              });
            hover.handles.push(r);
          }
        }
      };

      var activateHandle = function(el, pt) {
        var dist = hover.fill ? 20 : 8;
        var d, i;

        hover.activeHandle = -1;
        for (i = el ? 7 : -1; i >= 0; i--) {
          d = getDistance(pt, getHandle(el, i));
          if (dist > d) {
            dist = d;
            hover.activeHandle = i;
          }
        }
        showHandles(el);
      };

      var getPoint = function(e) {
        var box = document.getElementById(p.holder).getBoundingClientRect();
        return { x: e.clientX - box.x, y: e.clientY - box.y };
      };

      var hoverIn = function(box) {
        if (box && !hover.edit) {
          hover.box = box;
          hover.activeHandle = -1;
          hover.stroke = box.attr('stroke');
          hover.fill = box.attr('fill');
          box.attr({
            stroke: rgb_a(data.hoverColor, .7),
            fill: rgb_a(data.hoverFill, .1)
          });
        }
      };

      var hoverOut = function(box) {
        if (box && !hover.edit && hover.box === box && hover.fill) {
          box.attr({
            stroke: rgb_a(hover.stroke, .7),
            fill: data.boxFill
          });
          hover.fill = 0;   // 设置此标志，暂不清除 box 变量，以便在框外也可点控制点
        }
      };

      var mouseHover = function(e) {
        var pt = getPoint(e);
        var box = self.findBoxByPoint(pt);

        if (hover.box !== box) {
          hoverOut(hover.box);
          hoverIn(box);
        }
        activateHandle(hover.box, pt);

        if (hover.box && !hover.fill && hover.activeHandle < 0) {
          hoverOut(hover.box)
          hover.box = null;
          showHandles();
        }
        e.preventDefault();
      };

      var mouseDown = function(e) {
        e.preventDefault();
        hover.down = hover.box && getPoint(e);
        if (hover.down) {
          hover.edit = hover.box;
          hover.strokeBeforeEdit = hover.stroke;
          activateHandle(hover.edit, hover.down);

          if (hover.activeHandle >= 0) {
            hover.down = getHandle(hover.edit, hover.activeHandle);
          } else {
            // TODO: create box
          }
        }
      };

      var mouseDrag = function(e) {
        var pt = getPoint(e);
        var box = setHandle(hover.originBox || hover.edit, hover.activeHandle, pt);

        if (box) {
          box.initZoom().setAttr({
            stroke: rgb_a(data.changedColor, .7),
            'stroke-width': 1.5,
            fill: data.boxFill
          });
          if (!hover.originBox) {
            hover.originBox = hover.edit;
            hover.originBox.attr({stroke: 'rgba(0, 255, 0, .8)'});
          } else {
            hover.edit.remove();
          }
          hover.edit = box;
        }
        showHandles(hover.edit);
        e.preventDefault();
      };

      var mouseUp = function(e) {
        e.preventDefault();
        if (hover.edit) {
          var pt = getPoint(e);
          if (hover.originBox && getDistance(pt, hover.down) > 1) {
            var cid = hover.originBox.data('cid');
            var box = hover.edit;
            box.data('cid', cid).data('char', hover.originBox.data('char'));

            self.findCharById(cid).shape = box;
            box.insertBefore(hover.originBox);
            hover.originBox.remove();
            hover.originBox = null;
            hover.edit = hover.down = null;
            showHandles(box);
          }
          else {
            self.cancelDrag();
          }
        }
      };

      data.paper = Raphael(p.holder, p.width, p.height).initZoom();

      data.image = data.paper.image(p.image, 0, 0, p.width, p.height);
      data.paper.rect(0, 0, p.width, p.height)
        .attr({'stroke': 'transparent', fill: data.boxFill});

      $('#' + p.holder)
        .mousedown(mouseDown)
        .mouseup(mouseUp)
        .mousemove(function(e) {
          (hover.edit ? mouseDrag : mouseHover)(e);
        });

      p.chars.forEach(function(box) {
        box.shape = data.paper.rect(box.x, box.y, box.w, box.h)
          .attr({
            stroke: rgb_a(data.normalColor, .7),
            'stroke-width': 1.5,
            fill: data.boxFill
          })
          .data('cid', box.char_id)
          .data('char', box.ch);
      });

      data.width = p.width;
      data.height = p.height;
      data.chars = p.chars;
      return data;
    },

    findCharById: function(id) {
      return data.chars.filter(function(box) {
        return box.char_id === id;
      })[0];
    },

    findBoxByPoint: function(pt) {
      var ret = null, dist = 1e5, d, i, el;
      var isInRect = function(el, tol) {
        var box = el.getBBox();
        return box && pt.x > box.x - tol && pt.y > box.y - tol
          && pt.x < box.x + box.width + tol
          && pt.y < box.y + box.height + tol;
      };

      if (this.hover.box && isInRect(this.hover.box, 5)) {
        return this.hover.box;
      }
      if (this.hover.edit && this.hover.edit !== this.hover.box && isInRect(this.hover.edit, 5)) {
        return this.hover.edit;
      }
      for (i = 0; i < data.chars.length; i++) {
        el = data.chars[i].shape;
        if (isInRect(el, 5)) {
          d = getDistance(pt, getHandle(el, 8));
          if (dist > d) {
            dist = d;
            ret = el;
          }
        }
      }
      return ret;
    },

    cancelDrag: function() {
      var d = this.hover;
      if (d.down) {
        if (d.originBox) {
          d.edit.remove();
          d.edit = d.originBox;
          d.edit.attr('opacity', 1);
          delete d.originBox;
        }
        if (d.edit) {
          d.edit.attr({
            stroke: rgb_a(d.strokeBeforeEdit, .7),
            fill: this.data.boxFill
          });
          d.edit = null;
        }
        d.down = null;
      }
    },

    toggleBox: function(visible) {
      data.chars.forEach(function(box) {
        $(box.shape.node).toggle(visible);
      });
    },

    setRatio: function(ratio) {
      this.cancelDrag();
      data.ratio = ratio;
      data.paper.setZoom(ratio);
      data.paper.setSize(data.width * ratio, data.height * ratio);
    }
  };
}());
