/* global $ */
(function() {
  'use strict';

  $.extend($.cut, {
    bindKeys: function() {
      var self = this;
      var on = function(key, func) {
        $.mapKey(key, func, {direction: 'down'});
      };

      // 方向键：在字框间导航
      on('left', function() {
        self.navigate('left');
      });
      on('right', function() {
        self.navigate('right');
      });
      on('up', function() {
        self.navigate('up');
      });
      on('down', function() {
        self.navigate('down');
      });

      // w a s d：移动当前字框
      on('a', function() {
        self.moveBox('left');
      });
      on('d', function() {
        self.moveBox('right');
      });
      on('w', function() {
        self.moveBox('up');
      });
      on('s', function() {
        self.moveBox('down');
      });

      // alt+方向键：缩小字框
      on('alt+left', function() {
        self.resizeBox('left', true);
      });
      on('alt+right', function() {
        self.resizeBox('right', true);
      });
      on('alt+up', function() {
        self.resizeBox('up', true);
      });
      on('alt+down', function() {
        self.resizeBox('down', true);
      });

      // shift+方向键：放大字框
      on('shift+left', function() {
        self.resizeBox('left');
      });
      on('shift+right', function() {
        self.resizeBox('right');
      });
      on('shift+up', function() {
        self.resizeBox('up');
      });
      on('shift+down', function() {
        self.resizeBox('down');
      });

      // DEL：删除当前字框，ESC 放弃拖拽改动
      on('back', function() {
        self.removeBox();
      });
      on('del', function() {
        self.removeBox();
      });
      on('esc', function() {
        self.cancelDrag();
        self.showHandles(hover.box);
      });

      // 1~5 页面缩放
      on('1', function() {
        self.setRatio(1);
      });
      on('2', function() {
        self.setRatio(2);
      });
      on('3', function() {
        self.setRatio(3);
      });
      on('4', function() {
        self.setRatio(4);
      });
      on('5', function() {
        self.setRatio(5);
      });

      // shift + 5~9 页面缩放
      on('shift+5', function() {
        self.setRatio(0.5);
      });
      on('shift+6', function() {
        self.setRatio(0.6);
      });
      on('shift+7', function() {
        self.setRatio(0.7);
      });
      on('shift+8', function() {
        self.setRatio(0.8);
      });
      on('shift+9', function() {
        self.setRatio(0.9);
      });
    }
  });
}());
