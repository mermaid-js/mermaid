'use strict';

/**
 * @ngdoc function
 * @name angularMermaidApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the angularMermaidApp
 */
angular.module('angularMermaidApp')
  .controller('MainCtrl', ['$scope', '$sce', '$location', function($scope, $sce, $location) {
    $scope.absurl = '';
    $scope.diaglink = '';
    $scope.showerror = false;

    $scope.checkUpdate = function() {
      $scope.diaglink = $scope.absurl + '##' + encodeURIComponent($scope.mermaidsyntax);
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
          console.log($scope.diaglink);
          mermaid.init(); // jshint ignore:line
        } else {
          $scope.showerror = true;
        }
      }, 1000);
    };

    if ($location.hash()) {
      $scope.mermaidsyntax = $location.hash();
      console.log($location.hash());
      //Delete the other elements and leave only the diagram
      $scope.showform = false;
      $scope.diagclass = 'col s12 m12 l12';
      $scope.cardclass = '';

    } else {
      $scope.absurl = $location.absUrl();
      $scope.showform = true;
      $scope.diagclass = 'col s12 m12 l9';
      $scope.cardclass = 'card';
      $scope.mermaidsyntax = 'sequenceDiagram\n' +
        'A->> B: Query\n' +
        'B->> C: Forward query\n' +
        'Note right of C: Thinking...\n' +
        'C->> B: Response\n' +
        'B->> A: Forward response\n';
    }
    document.getElementsByClassName('materialize-textarea')[0].focus();
    $scope.checkUpdate();

  }]);
