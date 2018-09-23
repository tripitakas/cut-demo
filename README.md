# cut-demo

基于 jQuery、Raphael 的切分校对单元测试和原型。

[![Travis][travis_img]][travis]

[travis]: https://travis-ci.org/tripitakas/cut-demo
[travis_img]: https://travis-ci.org/tripitakas/cut-demo.svg?branch=master

[在线预览](http://ggbstudy.top/cut/)

- [x] 页面缩放(1~5倍、+/-)，快捷键为数字键
- [x] 显示字框和控制点，用不同颜色区分各种状态（原始状态、已改动、当前编辑、掠过字框）
- [x] 字框编辑：拖拽控制点，允许在框外较近处拖动控制点，按esc键可取消
- [x] 字框编辑：移动和微调大小，wasd 移动、alt+方向键：放大，shift+方向键：缩小
- [x] 字框编辑：增加字框，当没有控制点亮显（例如在空白处拖拽）时将画新框，或按 insert/ctrl+n
- [x] 字框编辑：删除字框，del键或回退键
- [x] 字框跳转导航，按方向键
- [x] 字框跳转自动滚动到可见区域
- [x] 自动单元测试
- [x] 缩放时当前字框位置保持不变，便于快速定位
- [x] 掠过字框与当前编辑字框分离，当前字框红背景，掠过字框无背景
- [x] 遮盖全部字框，检查是否有漏字
- [x] 高亮框间重叠部分
- [x] 高亮超大、超长框，检查是否框住两个字
- [x] 高亮小框，检查碎块
- [x] < >: 在高亮字框中快速跳转，ctrl+1~6: 高亮显示
- [ ] 在浮动区域放大显示当前字框的图形

## 文件说明

### 内核文件

- `app/cut1.html`：样例页面，包含页面相关的个性化数据。
- `app/js/cut.js`：切分校对内核文件，包含全局性配置数据。
- `app/js/cut_keys.js`：切分校对的快捷键映射文件。
- `app/js/vendor`：第三方开源插件。
- `app/css/cut.css`：切分校对样式文件。
- `app/data/*.jpg, *.js`：页面图和OCR数据。
- `app/data/gen_html.py`：自动生成页面及其缩略图的脚本，生成的`index.tmp` 可合并到`index.html`。
- `app/html/template.html`：页面模板网页，此目录下其他网页和缩略图自动生成。

## 单元测试文件

- `tests/karma.conf.js`：单元测试配置文件。
- `tests/html/template.html`：用于生成测试网页的模板文件。
- `tests/html/*.html, *.js`：由 `gen_html.py` 生成的测试网页和OCR数据文件。
- `tests/spec/*.js`：单元测试文件。

## 运行

- 在 WebStorm 等IDE中打开 `app/index.html`，然后选择某种浏览器启用和调试。
- 或先运行 `npm i`，然后运行 `npm start` 在Chrome中调试。

## 测试

- 先运行 `npm i`
- 运行 `npm test` 进行测试驱动开发
- 运行 `npm run test-single-run` 执行一次单元测试并退出
- 运行 `npm run jshint` 检查代码规范性

## 增加版面样本

在 `data` 下增加页面图和OCR结果文件(*.cut)，
然后运行 `app/data/gen_html.py` 生成页面，将 `index.tmp` 内容合并到 `app/index.html`。

## 参考资料

- [Raphael 图形库文档](http://dmitrybaranovskiy.github.io/raphael/reference.html)
