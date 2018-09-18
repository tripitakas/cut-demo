#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
from PIL import Image

try:
    reload(sys)
    sys.setdefaultencoding('utf8')
except NameError:
    pass

path = os.path.dirname(__file__)
html_path = os.path.join(path, '..', 'html')
html = open(os.path.join(html_path, 'template.html')).read()
size = 400
piece = '''
    <div class="col-xs-6 col-md-3">
      <div class="thumbnail">
        <a href="html/GL_79_4_7.html"><img src="html/GL_79_4_7.png"></a>
        <div class="caption text-center">
          <p>GL_79_4_7</p>
        </div>
      </div>
    </div>'''

index = []
for fn in os.listdir(path):
    name = fn[:-4]
    img_file = os.path.join(path, name + '.jpg')
    if fn.endswith('.cut') and os.path.exists(img_file):
        im = Image.open(img_file)
        w, h = im.size
        print('%-12s\t%d x %d' % (name, w, h))
        with open(os.path.join(html_path, '%s.html' % name), 'w') as f:
            f.write(html.replace('GL_79_4_7', name)
                    .replace('1200', str(w))
                    .replace('780', str(h)))
        index.append(piece.replace('GL_79_4_7', name))
        if w > size:
            h = round(size * h / w)
            w = size
        if h > size:
            w = round(size * w / h)
            h = size
        im.thumbnail((int(w), int(h)), Image.ANTIALIAS)
        im.save(os.path.join(html_path, '%s.png' % name), 'png')
with open('index.tmp', 'w') as f:
    f.write(''.join(index))
