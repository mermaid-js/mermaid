'use strict';

/**
 * @ngdoc function
 * @name angularMermaidApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the angularMermaidApp
 */
angular.module('angularMermaidApp')
  .controller('MainCtrl', ['$scope', '$sce', '$location', 'base64', function($scope, $sce, $location, base64) {
    var absurl = window.location.href.split('#')[0];
    var exampleCode = 'sequenceDiagram\n' +
      'A->> B: Query\n' +
      'B->> C: Forward query\n' +
      'Note right of C: Thinking...\n' +
      'C->> B: Response\n' +
      'B->> A: Forward response\n';

    $scope.viewlink = '';
    $scope.editlink = '';
    $scope.svglink = '';
    $scope.showerror = false;

    $scope.checkUpdate = function() {
      $scope.viewlink = buildURL('view', $scope.mermaidsyntax);
      $scope.editlink = buildURL('edit', $scope.mermaidsyntax);
      setTimeout(function() {
        var syntax = $sce.trustAsHtml($scope.mermaidsyntax) + '\n';
        // Delete and re add the mermaid node from the DOM
        var mermaidholder = document.getElementById('mermaidholder');
        //Delete the exisiting child nodes
        while (mermaidholder.firstChild) {
          mermaidholder.removeChild(mermaidholder.firstChild);
        }

        if (mermaid.parse(syntax)) { //jshint ignore:line
          $scope.showerror = false;
          //Add the new node
          var mermaidnode = document.createElement('div');
          mermaidnode.className = 'mermaid';
          mermaidnode.appendChild(document.createTextNode($sce.trustAsHtml($scope.mermaidsyntax)));
          mermaidholder.appendChild(mermaidnode);
          mermaid.init(); // jshint ignore:line
          $scope.svglink = buildSVGURL();
        } else {
          $scope.showerror = true;
        }
        $scope.$apply();
      }, 1000);
    };

    $scope.$watch(function() { return $location.url(); }, route);

    function route() {
      var code;

      // ##uriEncodedDiagramString (for backwards compatibility)
      if ($location.hash()) {
        code = $location.hash();
        return viewDiagram(code);
      }

      // #/view/base64EncodedDiagramString
      if ($location.path().match(/^\/view\//)) {
        code = base64.urldecode($location.path().split('/')[2]);
        return viewDiagram(code);
      }

      // #/edit/base64EncodedDiagramString
      if ($location.path().match(/^\/edit\//)) {
        code = base64.urldecode($location.path().split('/')[2]);
        return editDiagram(code);
      }

      return editDiagram(exampleCode);
    }

    function viewDiagram(code) {
      $scope.mermaidsyntax = code;
      // Delete the other elements and leave only the diagram
      $scope.showform = false;
      $scope.diagclass = 'col s12 m12 l12';
      $scope.cardclass = '';
      $scope.checkUpdate();
    }

    function editDiagram(code) {
      $scope.mermaidsyntax = code;
      $scope.showform = true;
      $scope.diagclass = 'col s12 m12 l9';
      $scope.cardclass = 'card';
      document.getElementsByClassName('materialize-textarea')[0].focus();
      $scope.checkUpdate();
    }

    function buildURL(action, code) {
      return absurl + '#/' + action + '/' + base64.urlencode(code);
    }

    function buildSVGURL() {
      var svg = document.querySelector('svg').outerHTML;
      return 'data:image/svg+xml;base64,' + base64.encode(svg);
    }
  }]);
