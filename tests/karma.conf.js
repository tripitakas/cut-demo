//jshint strict: false
// README: http://karma-runner.github.io/2.0/config/configuration-file.html
module.exports = function(config) {
  config.set({

    basePath: '../',

    files: [
      'app/js/vendor/jquery.js',
      'app/js/vendor/jquery.mapkey.js',
      'app/js/vendor/raphael.js',
      'app/js/vendor/raphael.zoom.js',
      'app/js/cut.js',
      'node_modules/karma-read-json/karma-read-json.js',
      'app/js/**/*.js',
      'tests/spec/base.js',
      'tests/spec/**/*.js',

      {pattern: 'app/data/*.cut', included: false}
    ],

    autoWatch: true,

    frameworks: ['jasmine'],

    browsers: ['Chrome'],

    plugins: [
      'karma-chrome-launcher',
      'karma-jasmine',
      'karma-mocha-reporter',
      'karma-coverage'
    ],

    coverageReporter: {
      type: 'lcov',
      dir: 'coverage'
    },

    preprocessors: {'app/js/*.js': ['coverage']},
    reporters: ['coverage', 'mocha']

  });
};
