'use strict';

/**
 * @ngdoc overview
 * @name angularMermaidApp
 * @description
 * # angularMermaidApp
 *
 * Main module of the application.
 */
angular
  .module('angularMermaidApp', ['ngSanitize', 'ab-base64'])
  .config(['$compileProvider', function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|local|data):/);
  }]);
