'use strict';

describe('navigate', function() {
  var data;

  beforeEach(function() {
    $.cut.test.addHolder();
  });

  describe('basic features', function() {
    beforeEach(function() {
      data = $.cut.test.loadPage('PL_1114_10', 1200, 847);
    });

    // 验证可测试
    it('simple example', function() {
      expect(data.chars.length).toBeGreaterThan(100);
      expect($.cut.navigate('left')).toBeDefined();
      expect($.cut.findCharById($.cut.getCurrentCharID())).toBeDefined();
    });

    // 初始字框为左上角的字框，不能再往左和往上了
    it('default box is leftmost and topmost box', function() {
      var cid = $.cut.getCurrentCharID();
      expect(cid).toBeTruthy();
      expect($.cut.navigate('left')).toEqual(cid);
      expect($.cut.navigate('up')).toEqual(cid);
      expect($.cut.navigate('right')).not.toEqual(cid);
    });
  });
});
