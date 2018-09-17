/* global $, Raphael */
(function() {
  'use strict';

  function getDistance(a, b) {
    var cx = a.x - b.x, cy = a.y - b.y;
    return Math.sqrt(cx * cx + cy * cy);
  }

  // 得到字框矩形的控制点坐标
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

  // 移动字框矩形的控制点，生成新的矩形
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
  function createRect(pt1, pt2, force) {
    var width = Math.abs(pt1.x - pt2.x), height = Math.abs(pt1.y - pt2.y);
    if (width >= 5 && height >= 5 || force) {
      var x = Math.min(pt1.x, pt2.x), y = Math.min(pt1.y, pt2.y);
      return data.paper.rect(x, y, width, height)
        .initZoom().setAttr({
          stroke: rgb_a(data.changedColor, data.boxOpacity),
          'stroke-width': 1.5,
          fill: rgb_a(data.hoverFill, .15)
        });
    }
  }

  // 将RGB颜色串(例如 #00ff00)与透明度合并为rgba颜色串
  function rgb_a(rgb, a) {
    var c = Raphael.color(rgb);
    return 'rgba(' + [c.r, c.g, c.b, a].join(',') + ')';
  }

  var data = {
    normalColor: '#af82e4',                   // 正常字框的线色
    changedColor: '#e44349',                  // 改动字框的线色
    hoverColor: '#e42d81',                    // 掠过时的字框线色
    hoverFill: '#ff0000',                     // 掠过时的字框填充色
    handleColor: '#e3e459',                   // 字框控制点的线色
    handleFill: '#ffffff',                    // 字框控制点的填充色
    activeHandleColor: '#72141d',             // 活动控制点的线色
    activeHandleFill: '#0000ff',              // 活动控制点的填充色
    handleSize: 2,                            // 字框控制点的半宽
    boxFill: 'rgba(0, 0, 0, .01)',            // 默认的字框填充色，不能全透明
    boxOpacity: .7,                           // 字框线半透明度
    ratio: 1,               // 缩放比例
    unit: 5,                // 微调量
    paper: null,            // Raphael 画布
    image: null,            // 背景图
    chars: []               // OCR识别出的字框
  };

  var hover = {
    box: null,              // 掠过的字框
    stroke: 0,              // 字框原来的线色
    fill: 0,                // 字框原来的填充色，鼠标离开框后变为0
    down: null,             // 按下的坐标，未按下时为假
    edit: null,             // 正拖拽的字框
    originBox: null,        // 改动前的字框
    strokeBeforeEdit: 0,    // 拖拽字框原来的线色
    fillBeforeEdit: 0,      // 拖拽字框原来的填充色
    handles: [],            // 字框的控制点框
    activeHandle: -1        // 当前拖动的手柄框序号
  };

  $.cut = {
    data: data,
    hover: hover,

    showHandles: function(el) {
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
    },

    activateHandle: function(el, pt) {
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
      this.showHandles(el);
    },

    hoverIn: function(box) {
      if (box && !hover.edit) {
        hover.box = box;
        hover.activeHandle = -1;
        hover.stroke = box.attr('stroke');
        hover.fill = box.attr('fill');
        box.attr({
          stroke: rgb_a(data.hoverColor, data.boxOpacity),
          fill: rgb_a(data.hoverFill, .2)
        });
      }
    },

    hoverOut: function(box) {
      if (box && !hover.edit && hover.box === box && hover.fill) {
        box.attr({ stroke: hover.stroke, fill: hover.fill });
        hover.fill = 0;   // 设置此标志，暂不清除 box 变量，以便在框外也可点控制点
      }
    },

    create: function(p) {
      var self = this;

      var getPoint = function(e) {
        var box = data.holder.getBoundingClientRect();
        return { x: e.clientX - box.x, y: e.clientY - box.y };
      };

      var mouseHover = function(e) {
        var pt = getPoint(e);
        var box = self.findBoxByPoint(pt);

        if (hover.box !== box) {
          self.hoverOut(hover.box);
          self.hoverIn(box);
        }
        self.activateHandle(hover.box, pt);

        if (hover.box && !hover.fill && hover.activeHandle < 0) {
          self.hoverOut(hover.box);
          hover.box = null;
          self.showHandles();
        }
        e.preventDefault();
      };

      var mouseDown = function(e) {
        e.preventDefault();
        hover.down = getPoint(e);
        if (hover.box) {
          hover.edit = hover.box;
          hover.strokeBeforeEdit = hover.stroke;
          hover.fillBeforeEdit = hover.fill;
          self.activateHandle(hover.edit, hover.down);

          if (hover.activeHandle >= 0) {
            hover.down = getHandle(hover.edit, hover.activeHandle);
          } else {
            hover.edit = null;    // for hoverOut
            self.hoverOut(hover.box);
            hover.box = null;
          }
        }
        if (!hover.box) {
          hover.activeHandle = 2;  // 右下角
          hover.edit = createRect(hover.down, hover.down, true);
        }
      };

      var mouseDrag = function(e) {
        var pt = getPoint(e);
        var box = setHandle(hover.originBox || hover.edit, hover.activeHandle, pt);

        if (box) {
          // 刚开始改动，记下原来的图框并变暗，改完将删除，或放弃改动时(cancelDrag)恢复属性
          if (!hover.originBox) {
            hover.originBox = hover.edit;
            hover.originBox.attr({stroke: 'rgba(0, 255, 0, .8)', 'opacity': .5});
          } else {
            hover.edit.remove();
          }
          hover.edit = box;
        }
        self.showHandles(hover.edit);
        e.preventDefault();
      };

      var mouseUp = function(e) {
        e.preventDefault();
        if (hover.edit) {
          var pt = getPoint(e);
          if (hover.originBox && getDistance(pt, hover.down) > 1) {
            self._changeBox(hover.originBox, hover.edit);
          }
          else {
            self.cancelDrag();
          }
        }
      };

      data.paper = Raphael(p.holder, p.width, p.height).initZoom();
      data.holder = document.getElementById(p.holder);

      data.image = data.paper.image(p.image, 0, 0, p.width, p.height);
      data.paper.rect(0, 0, p.width, p.height)
        .attr({'stroke': 'transparent', fill: data.boxFill});

      $(data.holder)
        .mousedown(mouseDown)
        .mouseup(mouseUp)
        .mousemove(function(e) {
          (hover.edit ? mouseDrag : mouseHover)(e);
        });

      p.chars.forEach(function(box) {
        box.shape = data.paper.rect(box.x, box.y, box.w, box.h)
          .attr({
            stroke: rgb_a(data.normalColor, data.boxOpacity),
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

    _changeBox: function(src, dst) {
      if (!src || !dst) {
        return;
      }

      var info = this.findCharById(src.data('cid')) || {};

      if (!info.char_id) {
        for (var i = 1; i < 999; i++) {
          info.char_id = 'new' + i;
          if (!this.findCharById(info.char_id)) {
            data.chars.push(info);
            break;
          }
        }
      }
      dst.data('cid', info.char_id).data('char', dst.ch);
      info.shape = dst;

      dst.insertBefore(src);
      src.remove();
      hover.originBox = null;
      hover.edit = hover.down = null;
      this.hoverIn(dst);
      this.showHandles(dst);

      return info.char_id;
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

      if (hover.box && isInRect(hover.box, 5)) {
        return hover.box;
      }
      if (hover.edit && hover.edit !== hover.box && isInRect(hover.edit, 5)) {
        return hover.edit;
      }
      for (i = 0; i < data.chars.length; i++) {
        el = data.chars[i].shape;
        if (el && isInRect(el, 5)) {
          d = getDistance(pt, getHandle(el));
          if (dist > d) {
            dist = d;
            ret = el;
          }
        }
      }
      return ret;
    },

    cancelDrag: function() {
      if (hover.down) {
        if (hover.originBox) {
          hover.edit.remove();
          hover.edit = hover.originBox;
          hover.edit.attr('opacity', 1);
          delete hover.originBox;
        }
        if (hover.edit && hover.edit.getBBox().width < 1) {
          hover.edit.remove();
        }
        else if (hover.edit) {
          hover.edit.attr({
            stroke: hover.strokeBeforeEdit,
            fill: hover.fillBeforeEdit
          });
        }
        hover.edit = null;
        hover.down = null;
      }
    },

    removeBox: function() {
      this.cancelDrag();
      if (hover.box) {
        var info = this.findCharById(hover.box.data('cid'));
        info.shape = null;
        hover.box.remove();
        hover.box = null;
        this.showHandles();
        return info.char_id;
      }
    },

    navigate: function(direction) {
      var i, cur, chars, calc, unit, invalid = 1e5;
      var minDist = invalid, d, ret;

      chars = data.chars.filter(function(c) { return c.shape; });
      ret = cur = hover.box || (chars[chars.length - 1] || {}).shape;
      cur = cur && cur.getBBox();

      if (direction === 'left' || direction === 'right') {
        unit = Math.min(cur.width / 2, 10);
        calc = function(box) {
          // left：待测框的左侧不在当前框左边，则跳过；right：待测框的右侧不在当前框右边，则跳过
          if (direction === 'left' ? (box.x > cur.x - unit)
              : (box.x + box.width < cur.x + cur.width + unit)) {
            return invalid;
          }
          // 优先找中心Y坐标离得近的，其次找X方向离得近的
          var rowUnit = Math.max(unit, box.width / 2);
          return Math.abs(box.y + box.height / 2 - cur.y - cur.height / 2) +
            Math.floor(Math.abs(box.x + box.width / 2 - cur.x - cur.width / 2) / rowUnit) * 10;
        };
      }
      else {
        unit = Math.min(cur.height / 2, 10);
        calc = function(box) {
          if (direction === 'up' ? (box.y > cur.y - unit)
              : (box.y + box.height < cur.y + cur.height + unit)) {
            return invalid;
          }
          var colUnit = Math.max(unit, box.height / 2);
          return Math.abs(box.x + box.width / 2 - cur.x - cur.width / 2) +
            Math.floor(Math.abs(box.y + box.height / 2 - cur.y - cur.height / 2) / colUnit) * 10;
        };
      }

      // 找加权距离最近的字框
      for (i = 0; i < chars.length; i++) {
        d = calc(chars[i].shape.getBBox());
        if (minDist > d) {
          minDist = d;
          ret = chars[i].shape;
        }
      }

      if (ret) {
        this.cancelDrag();
        this.hoverOut(hover.box);
        this.hoverIn(ret);
        this.showHandles(ret);
        return ret.data('cid');
      }
    },

    moveBox: function(direction) {
      this.cancelDrag();
      var box = hover.box && hover.box.getBBox();
      if (box) {
        if (direction === 'left') {
          box.x -= data.unit;
        }
        else if (direction === 'right') {
          box.x += data.unit;
        }
        else if (direction === 'up') {
          box.y -= data.unit;
        }
        else {
          box.y += data.unit;
        }

        hover.edit = createRect({x: box.x, y: box.y}, {x: box.x + box.width, y: box.y + box.height});
        return this._changeBox(hover.box, hover.edit);
      }
    },

    resizeBox: function(direction, shrink) {
      this.cancelDrag();
      var box = hover.box && hover.box.getBBox();
      if (box) {
        if (direction === 'left') {
          box.x += shrink ? data.unit : -data.unit;
          box.width += shrink ? -data.unit : data.unit;
        }
        else if (direction === 'right') {
          box.width += shrink ? -data.unit : data.unit;
        }
        else if (direction === 'up') {
          box.y += shrink ? data.unit : -data.unit;
          box.height += shrink ? -data.unit : data.unit;
        }
        else {
          box.height += shrink ? -data.unit : data.unit;
        }

        hover.edit = createRect({x: box.x, y: box.y}, {x: box.x + box.width, y: box.y + box.height});
        return this._changeBox(hover.box, hover.edit);
      }
    },

    toggleBox: function(visible) {
      data.chars.forEach(function(box) {
        if (box.shape) {
          $(box.shape.node).toggle(visible);
        }
      });
    },

    setRatio: function(ratio) {
      var el = hover.box;
      var box = el && el.getBBox();
      var body = document.documentElement || document.body;
      var pos = [body.scrollLeft, body.scrollTop];

      this.cancelDrag();
      this.hoverOut(el);

      data.ratio = ratio;
      data.paper.setZoom(ratio);
      data.paper.setSize(data.width * ratio, data.height * ratio);

      this.hoverIn(el);
      this.showHandles(el);

      if (box) {
        var box2 = el.getBBox();
        window.scrollTo(box2.x + box2.width / 2 - box.x - box.width / 2 + pos[0],
          box2.y + box2.width / 2 - box.y - box.width / 2 + pos[1]);
      }
    }

  };
}());
