(function() {
  'use strict';

  var data = $.cut.data;
  var fillColor = '#00f';

  function isOverlap(r1, r2, tol) {
    return r1.x + r1.width > r2.x + tol &&
      r2.x + r2.width > r1.x + tol &&
      r1.y + r1.height > r2.y + tol &&
      r2.y + r2.height > r1.y + tol;
  }

  $.extend($.cut, {

    clearHighlight: function() {
      (data.highlight || []).forEach(function(box) {
        box.remove();
      });
      delete data.highlight;
    },

    highlightBoxes: function(kind) {
      var chars = data.chars.filter(function(c) {
        return c.shape;
      });
      var sizes, avgSize, boxes;

      if (kind === 'large' || kind === 'small') {
        sizes = chars.map(function(c) {
          var r = c.shape.getBBox();
          return r.width * r.height;
        });
        sizes.sort();
        avgSize = sizes[parseInt(sizes.length / 2)];
      }

      this.clearHighlight();
      data.highlight = chars.map(function(c) {
        if (c.shape) {
          var r = c.shape.getBBox();
          var degree = 0;

          if (kind === 'large') {
            degree = r.width * r.height / avgSize - 1;
            if (degree < 0.5) {
              return;
            }
          }
          else if (kind === 'small') {
            degree = avgSize / (r.width * r.height) - 1;
            if (degree < 0.5) {
              return;
            }
          }
          else if (kind === 'overlap') {
            boxes = chars.filter(function(c2) {
              return c2 !== c && isOverlap(r, c2.shape.getBBox(), 2);
            });
            if (boxes.length < 1) {
              return;
            }
            if (boxes.filter(function(c2) {
                return isOverlap(r, c2.shape.getBBox(), 5);
              }).length) {
              degree = 0.7;
              if (boxes.filter(function(c2) {
                  return isOverlap(r, c2.shape.getBBox(), 10);
                }).length) {
                degree = 0.9;
              }
            }
          }
          return data.paper.rect(r.x, r.y, r.width, r.height)
            .initZoom().setAttr({
              stroke: 'transparent',
              fill: $.cut.rgb_a(fillColor, degree >= 0.9 ? 0.7 : degree >= 0.7 ? 0.5 : 0.3)
            })
            .data('highlight', c.char_id);
        }
      }).filter(function(box) { return box; });

      return data.highlight;
    }
  });
}());
