/**
 * @license AngularJS v1.0.4
 * (c) 2010-2012 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window) {
'use strict';

/**
 * JSTestDriver adapter for angular scenario tests
 *
 * Example of jsTestDriver.conf for running scenario tests with JSTD:
  <pre>
    server: http://localhost:9877

    load:
      - lib/angular-scenario.js
      - lib/jstd-scenario-adapter-config.js
      - lib/jstd-scenario-adapter.js
      # your test files go here #

    proxy:
     - {matcher: "/your-prefix/*", server: "http://localhost:8000/"}
  </pre>
 *
 * For more information on how to configure jstd proxy, see {@link http://code.google.com/p/js-test-driver/wiki/Proxy}
 * Note the order of files - it's important !
 *
 * Example of jstd-scenario-adapter-config.js
  <pre>
    var jstdScenarioAdapter = {
      relativeUrlPrefix: '/your-prefix/'
    };
  </pre>
 *
 * Whenever you use <code>browser().navigateTo('relativeUrl')</code> in your scenario test, the relativeUrlPrefix will be prepended.
 * You have to configure this to work together with JSTD proxy.
 *
 * Let's assume you are using the above configuration (jsTestDriver.conf and jstd-scenario-adapter-config.js):
 * Now, when you call <code>browser().navigateTo('index.html')</code> in your scenario test, the browser will open /your-prefix/index.html.
 * That matches the proxy, so JSTD will proxy this request to http://localhost:8000/index.html.
 */

/**
 * Custom type of test case
 *
 * @const
 * @see jstestdriver.TestCaseInfo
 */
var SCENARIO_TYPE = 'scenario';

/**
 * Plugin for JSTestDriver
 * Connection point between scenario's jstd output and jstestdriver.
 *
 * @see jstestdriver.PluginRegistrar
 */
function JstdPlugin() {
  var nop = function() {};

  this.reportResult = nop;
  this.reportEnd = nop;
  this.runScenario = nop;

  this.name = 'Angular Scenario Adapter';

  /**
   * Called for each JSTD TestCase
   *
   * Handles only SCENARIO_TYPE test cases. There should be only one fake TestCase.
   * Runs all scenario tests (under one fake TestCase) and report all results to JSTD.
   *
   * @param {jstestdriver.TestRunConfiguration} configuration
   * @param {Function} onTestDone
   * @param {Function} onAllTestsComplete
   * @returns {boolean} True if this type of test is handled by this plugin, false otherwise
   */
  this.runTestConfiguration = function(configuration, onTestDone, onAllTestsComplete) {
    if (configuration.getTestCaseInfo().getType() != SCENARIO_TYPE) return false;

    this.reportResult = onTestDone;
    this.reportEnd = onAllTestsComplete;
    this.runScenario();

    return true;
  };

  this.getTestRunsConfigurationFor = function(testCaseInfos, expressions, testRunsConfiguration) {
    testRunsConfiguration.push(
        new jstestdriver.TestRunConfiguration(
            new jstestdriver.TestCaseInfo(
                'Angular Scenario Tests', function() {}, SCENARIO_TYPE), []));

    return true;
  };
}

/**
 * Singleton instance of the plugin
 * Accessed using closure by:
 *  - jstd output (reports to this plugin)
 *  - initScenarioAdapter (register the plugin to jstd)
 */
var plugin = new JstdPlugin();

/**
 * Initialise scenario jstd-adapter
 * (only if jstestdriver is defined)
 *
 * @param {Object} jstestdriver Undefined when run from browser (without jstd)
 * @param {Function} initScenarioAndRun Function that inits scenario and runs all the tests
 * @param {Object=} config Configuration object, supported properties:
 *  - relativeUrlPrefix: prefix for all relative links when navigateTo()
 */
function initScenarioAdapter(jstestdriver, initScenarioAndRun, config) {
  if (jstestdriver) {
    // create and register ScenarioPlugin
    jstestdriver.pluginRegistrar.register(plugin);
    plugin.runScenario = initScenarioAndRun;

    /**
     * HACK (angular.scenario.Application.navigateTo)
     *
     * We need to navigate to relative urls when running from browser (without JSTD),
     * because we want to allow running scenario tests without creating its own virtual host.
     * For example: http://angular.local/build/docs/docs-scenario.html
     *
     * On the other hand, when running with JSTD, we need to navigate to absolute urls,
     * because of JSTD proxy. (proxy, because of same domain policy)
     *
     * So this hack is applied only if running with JSTD and change all relative urls to absolute.
     */
    var appProto = angular.scenario.Application.prototype,
        navigateTo = appProto.navigateTo,
        relativeUrlPrefix = config && config.relativeUrlPrefix || '/';

    appProto.navigateTo = function(url, loadFn, errorFn) {
      if (url.charAt(0) != '/' && url.charAt(0) != '#' &&
          url != 'about:blank' && !url.match(/^https?/)) {
        url = relativeUrlPrefix + url;
      }

      return navigateTo.call(this, url, loadFn, errorFn);
    };
  }
}

/**
 * Builds proper TestResult object from given model spec
 *
 * TODO(vojta) report error details
 *
 * @param {angular.scenario.ObjectModel.Spec} spec
 * @returns {jstestdriver.TestResult}
 */
function createTestResultFromSpec(spec) {
  var map = {
    success: 'PASSED',
    error:   'ERROR',
    failure: 'FAILED'
  };

  return new jstestdriver.TestResult(
    spec.fullDefinitionName,
    spec.name,
    jstestdriver.TestResult.RESULT[map[spec.status]],
    spec.error || '',
    spec.line || '',
    spec.duration);
}

/**
 * Generates JSTD output (jstestdriver.TestResult)
 */
angular.scenario.output('jstd', function(context, runner, model) {
  model.on('SpecEnd', function(spec) {
    plugin.reportResult(createTestResultFromSpec(spec));
  });

  model.on('RunnerEnd', function() {
    plugin.reportEnd();
  });
});
initScenarioAdapter(window.jstestdriver, angular.scenario.setUpAndRun, window.jstdScenarioAdapter);
})(window);
