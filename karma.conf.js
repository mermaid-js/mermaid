import { puppeteer } from 'puppeteer/package.json'
import ChromiumDownloader from 'puppeteer/utils/ChromiumDownloader'

import { jsConfig } from './webpack.config.base'

process.env.CHROMIUM_BIN = ChromiumDownloader.revisionInfo(ChromiumDownloader.currentPlatform(), puppeteer.chromium_revision).executablePath

const webpackConfig = jsConfig()

export default function (config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '.',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      './src/**/*.spec.js'
    ],

    preprocessors: {
      'src/**/*.spec.js': ['webpack', 'sourcemap']
    },

    webpack: {
      node: webpackConfig.node,
      module: webpackConfig.module,
      devtool: 'inline-source-map'
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

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['ChromiumHeadless'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  })
}
