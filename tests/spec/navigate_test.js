'use strict';

describe('navigate', function() {
  var data;

  beforeEach(function() {
    $.cut.test.addHolder();
  });

  describe('simple', function() {
    beforeEach(function() {
      data = $.cut.test.loadPage('PL_1114_10', 1200, 847);
    });

    it('simple', function() {
      expect(data.chars.length).toBeGreaterThan(100);
      expect($.cut.state.edit).toBeNull();
      expect($.cut.navigate('left')).toBeDefined();
      expect($.cut.findCharById($.cut.getCurrentCharID())).toBeDefined();
    });
  });
});
