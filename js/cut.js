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

  // 根据两个对角点创建字框图形，要求字框的面积大于等于100且宽高都至少为5，以避免误点出碎块
  function createRect(pt1, pt2, force) {
    var width = Math.abs(pt1.x - pt2.x), height = Math.abs(pt1.y - pt2.y);
    if (width >= 5 && height >= 5 && width * height >= 100 || force) {
      var x = Math.min(pt1.x, pt2.x), y = Math.min(pt1.y, pt2.y);
      return data.paper.rect(x, y, width, height)
        .initZoom().setAttr({
          stroke: rgb_a(data.changedColor, data.boxOpacity),
          'stroke-width': 1.5,
          // fill: rgb_a(data.hoverFill, .15)
        });
    }
  }

  // 将RGB颜色串(例如 #00ff00)与透明度合并为rgba颜色串
  function rgb_a(rgb, a) {
    var c = Raphael.color(rgb);
    return 'rgba(' + [c.r, c.g, c.b, a].join(',') + ')';
  }

  var data = {
    normalColor: '#158815',                   // 正常字框的线色
    changedColor: '#C53433',                  // 改动字框的线色
    hoverColor: '#e42d81',                    // 掠过时的字框线色
    hoverFill: '#ff0000',                     // 掠过时的字框填充色
    handleColor: '#e3e459',                   // 字框控制点的线色
    handleFill: '#ffffff',                    // 字框控制点的填充色
    activeHandleColor: '#72141d',             // 活动控制点的线色
    activeHandleFill: '#0000ff',              // 活动控制点的填充色
    handleSize: 1.7,                          // 字框控制点的半宽
    boxFill: 'rgba(0, 0, 0, .01)',            // 默认的字框填充色，不能全透明
    boxOpacity: .7,                           // 字框线半透明度
    ratio: 1,                                 // 缩放比例
    unit: 5,                                  // 微调量
    paper: null,                              // Raphael 画布
    image: null,                              // 背景图
    chars: []                                 // OCR识别出的字框
  };

  var state = {
    hover: null,                              // 掠过的字框
    hoverStroke: 0,                           // 掠过的字框原来的线色
    hoverHandle: {handles: [], index: -1, fill: 0}, // 掠过的字框的控制点，fill为原来的填充色，鼠标离开框后变为0

    down: null,                               // 按下时控制点的坐标，未按下时为空
    downOrigin: null,                         // 按下的坐标
    edit: null,                               // 当前编辑的字框
    originBox: null,                          // 改动前的字框
    editStroke: 0,                            // 当前编辑字框原来的线色
    editHandle: {handles: [], index: -1, fill: 0} // 当前编辑字框的控制点
  };

  $.cut = {
    data: data,
    state: state,

    showHandles: function(el, handle) {
      var i, pt, r;
      var size = data.handleSize * ((data.ratio - 1) * 0.4 + 1);

      for (i = 0; i < handle.handles.length; i++) {
        handle.handles[i].remove();
      }
      handle.handles.length = 0;

      if (el) {
        for (i = 0; i < 8; i++) {
          pt = getHandle(el, i);
          r = data.paper.rect(pt.x - size, pt.y - size, size * 2, size * 2)
            .attr({
              stroke: i === handle.index ? data.activeHandleColor : data.hoverColor,
              fill: i === handle.index ? rgb_a(data.activeHandleFill, .8) : rgb_a(data.handleFill, .4)
            });
          handle.handles.push(r);
        }
      }
    },

    activateHandle: function(el, handle, pt) {
      var dist = handle.fill ? 50 : 8;
      var d, i;

      handle.index = -1;
      for (i = el ? 7 : -1; i >= 0; i--) {
        d = getDistance(pt, getHandle(el, i));
        if (dist > d) {
          dist = d;
          handle.index = i;
        }
      }
      this.showHandles(el, handle);
    },

    hoverIn: function(box) {
      if (box && box !== state.edit) {
        state.hover = box;
        state.hoverHandle.index = -1;
        state.hoverStroke = box.attr('stroke');
        state.hoverHandle.fill = box.attr('fill');
        box.attr({
          stroke: rgb_a(data.hoverColor, data.boxOpacity),
          // fill: rgb_a(data.hoverFill, .05)
        });
      }
    },

    hoverOut: function(box) {
      if (box && state.hover === box && state.hoverHandle.fill) {
        box.attr({ stroke: state.hoverStroke, fill: state.hoverHandle.fill });
        state.hoverHandle.fill = 0;   // 设置此标志，暂不清除 box 变量，以便在框外也可点控制点
      }
      else if (box && state.edit === box && state.editHandle.fill) {
        box.attr({ stroke: state.editStroke, fill: state.editHandle.fill });
        state.editHandle.fill = 0;
      }
    },
    
    switchCurrentBox: function(box) {
      this.hoverOut(state.hover);
      this.hoverOut(state.edit);
      state.hover = null;
      this.showHandles(state.hover, state.hoverHandle);

      state.edit = box;
      if (box) {
        state.editStroke = box.attr('stroke');
        state.editHandle.fill = box.attr('fill');
        box.attr({
          stroke: rgb_a(data.changedColor, data.boxOpacity),
          fill: rgb_a(data.hoverFill, .4)
        });
      }
      this.showHandles(state.edit, state.editHandle);
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

        if (state.hover !== box) {
          self.hoverOut(state.hover);
          self.hoverIn(box);
        }
        if (box === state.edit) {
          self.activateHandle(state.edit, state.editHandle, pt);
          state.hover = null;
          self.showHandles(null, state.hoverHandle);
        } else {
          state.editHandle.index = -1;
          self.showHandles(null, state.editHandle);
          self.activateHandle(state.hover, state.hoverHandle, pt);
        }

        if (state.hover && !state.hoverHandle.fill && state.hoverHandle.index < 0) {
          self.hoverOut(state.hover);
          state.hover = null;
          self.showHandles(state.hover, state.hoverHandle);
        }
        e.preventDefault();
      };

      var mouseDown = function(e) {
        e.preventDefault();
        state.downOrigin = state.down = getPoint(e);

        if (!state.edit || state.editHandle.index < 0) {
          self.switchCurrentBox(state.hover);
        }
        self.activateHandle(state.edit, state.editHandle, state.down);
        if (state.editHandle.index >= 0) {
          state.down = getHandle(state.edit, state.editHandle.index);
        } else {
          self.hoverOut(state.edit);
          state.edit = null;
        }

        if (!state.edit) {
          state.editHandle.index = 2;  // 右下角
          state.edit = createRect(state.down, state.down, true);
        }
      };

      var mouseDrag = function(e) {
        var pt = getPoint(e);

        e.preventDefault();
        if (!state.originBox && getDistance(pt, state.downOrigin) < 3) {
          return;
        }

        var box = setHandle(state.originBox || state.edit, state.editHandle.index, pt);
        if (box) {
          // 刚开始改动，记下原来的图框并变暗，改完将删除，或放弃改动时(cancelDrag)恢复属性
          if (!state.originBox) {
            state.originBox = state.edit;
            state.originBox.attr({stroke: 'rgba(0, 255, 0, .8)', 'opacity': .5});
          } else {
            state.edit.remove();
          }
          state.edit = box;
        }
        self.showHandles(state.edit, state.editHandle);
      };

      var mouseUp = function(e) {
        e.preventDefault();
        if (state.down) {
          var pt = getPoint(e);
          if (state.originBox && getDistance(pt, state.down) > 1) {
            self._changeBox(state.originBox, state.edit);
          }
          else {
            self.cancelDrag();
          }
          self.switchCurrentBox(state.edit);
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
          (state.down ? mouseDrag : mouseHover)(e);
        });

      p.chars.forEach(function(box) {
        box.shape = data.paper.rect(box.x, box.y, box.w, box.h)
          .attr({
            stroke: rgb_a(data.normalColor, data.boxOpacity),
            'stroke-width': 1.5,
            // fill: data.boxFill
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
      state.originBox = null;
      state.edit = state.down = null;
      this.switchCurrentBox(dst);

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

      if (state.edit && isInRect(state.edit, 5)) {
        return state.edit;
      }
      if (state.hover && isInRect(state.hover, 5)) {
        return state.hover;
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
      if (state.down) {
        if (state.originBox) {
          state.edit.remove();
          state.edit = state.originBox;
          state.edit.attr('opacity', 1);
          delete state.originBox;
        }
        if (state.edit && state.edit.getBBox().width < 1) {
          state.edit.remove();
          state.edit = null;
        }
        else if (state.edit) {
          state.edit.attr({
            stroke: state.editStroke,
            fill: state.editHandle.fill
          });
        }
        state.down = null;
      }
    },

    removeBox: function() {
      this.cancelDrag();
      if (state.edit) {
        var info = this.findCharById(state.edit.data('cid'));
        info.shape = null;
        state.edit.remove();
        state.edit = null;
        this.showHandles(state.edit, state.editHandle);
        return info.char_id;
      }
    },

    navigate: function(direction) {
      var i, cur, chars, calc, invalid = 1e5;
      var minDist = invalid, d, ret;

      chars = data.chars.filter(function(c) { return c.shape; });
      ret = cur = state.edit || state.hover || (chars[chars.length - 1] || {}).shape;
      cur = cur && cur.getBBox();

      if (direction === 'left' || direction === 'right') {
        calc = function(box) {
          // 排除水平反方向的框：如果方向为left，则用当前框右边的x来过滤；如果方向为right，则用当前框左边的x来过滤
          var dx = direction === 'left' ? (box.x + box.width - cur.x - cur.width) : (box.x - cur.x);
          if (direction === 'left' ? dx > -data.unit : dx < data.unit) {
            return invalid;
          }
          // 找中心点离得近的，优先找X近的，不要跳到较远的其他栏
          var dy = Math.abs(box.y + box.height / 2 - cur.y - cur.height / 2);
          if (dy > Math.max(cur.height, box.height) * 5) {
            return invalid;
          }
          return dy * 2 + Math.abs(dx);
        };
      }
      else {
        calc = function(box) {
          // 排除垂直反方向的框：如果方向为up，则用当前框下边的y来过滤；如果方向为down，则用当前框上边的y来过滤
          var dy = direction === 'up' ? (box.y + box.height - cur.y - cur.height) : (box.y - cur.y);
          if (direction === 'up' ? dy > -data.unit : dy < data.unit) {
            return invalid;
          }
          // 找中心点离得近的，优先找Y近的
          var dx = Math.abs(box.x + box.width / 2 - cur.x - cur.width / 2);
          return dx * 2 + Math.abs(dy);
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
        this.switchCurrentBox(ret);
        return ret.data('cid');
      }
    },

    moveBox: function(direction) {
      this.cancelDrag();
      var box = state.edit && state.edit.getBBox();
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

        var newBox = createRect({x: box.x, y: box.y}, {x: box.x + box.width, y: box.y + box.height});
        return this._changeBox(state.edit, newBox);
      }
    },

    resizeBox: function(direction, shrink) {
      this.cancelDrag();
      var box = state.edit && state.edit.getBBox();
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

        var newBox = createRect({x: box.x, y: box.y}, {x: box.x + box.width, y: box.y + box.height});
        return this._changeBox(state.edit, newBox);
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
      var el = state.edit || state.hover;
      var box = el && el.getBBox();
      var body = document.documentElement || document.body;
      var pos = [body.scrollLeft, body.scrollTop];

      this.cancelDrag();
      this.hoverOut(state.hover);
      this.hoverOut(state.edit);

      data.ratio = ratio;
      data.paper.setZoom(ratio);
      data.paper.setSize(data.width * ratio, data.height * ratio);

      this.switchCurrentBox(el);

      if (box) {
        var box2 = el.getBBox();
        window.scrollTo(box2.x + box2.width / 2 - box.x - box.width / 2 + pos[0],
          box2.y + box2.width / 2 - box.y - box.width / 2 + pos[1]);
      }
    }

  };
}());
