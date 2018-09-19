'use strict';

$.cut.test = {

  addHolder: function() {
    var div = document.createElement('div');
    div.id = 'holder';
    document.body.appendChild(div);
  },

  loadPage: function(name, width, height) {
    var cut_data = readJSON('app/data/' + name + '.cut');
    expect(cut_data).toBeDefined();

    var data = $.cut.create({
      width: width,
      height: height,
      holder: 'holder',
      chars: cut_data.char_data
    });
    expect(data).toBeDefined();
    return data;
  }
};
