'use strict';

describe('highlight', function() {
  var data;

  beforeEach(function() {
    $.cut.test.addHolder();
  });

  describe('simple', function() {
    beforeEach(function() {
      data = $.cut.test.loadPage('QL_24_50', 1200, 1663);
    });

    it('simple', function() {
      expect($.cut.highlightBoxes('all').length).toEqual(data.chars.length);
    });
  });
});
