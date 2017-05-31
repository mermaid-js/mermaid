// Karma configuration
// Generated on Mon Nov 03 2014 07:53:38 GMT+0100 (CET)

module.exports = function (config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '.',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      './src/*.spec.js',
      './src/diagrams/flowchart/**/*.spec.js',
      './src/diagrams/example/**/*.spec.js',
      './src/diagrams/sequenceDiagram/**/*.spec.js',
      './src/diagrams/classDiagram/**/*.spec.js',
      './src/diagrams/gantt/**/*.spec.js',
      './src/diagrams/gitGraph/**/*.spec.js'
    ],

    preprocessors: {
      'src/**/*.spec.js': ['webpack']
    },

    webpack: {
      externals: ['fs'],
      module: {
        rules: [
          {
            test: /\.js$/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  ['env', {
                    'targets': {
                      'browsers': ['last 3 versions']
                    }
                  }]
                ],
                plugins: [
                  'transform-remove-strict-mode'
                ]
              }
            }
          }
        ]
      }
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    customLaunchers: {
      ChromeHeadless: {
        base: 'Chrome',
        flags: [
          '--incognito',
          // '--headless',
          '--disable-gpu',
          '--no-sandbox',
          // Without a remote debugging port, Google Chrome exits immediately.
          '--remote-debugging-port=9222'
        ]
      }
    },

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['ChromeHeadless'],
    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-webpack'
    ],
    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  })
}
