/**
 * Created by knut on 2015-09-15.
 */
var navApp = angular.module('navApp', []);

navApp.controller('NavAppCtrl', function ($scope) {
    $scope.items = [
        {'name': 'Ett',
            'url': 'cases/ett.html'},
        {'name': 'Two',
            'url': 'cases/two.html'}
    ];

    $scope.frameUrl = "web.html"

    $scope.go = function(url){
        alert(url);
    }
});