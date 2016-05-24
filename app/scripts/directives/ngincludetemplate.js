'use strict';

/**
 * @ngdoc directive
 * @name ngExplorerApp.directive:ngIncludeTemplate
 * @description
 * # ngIncludeTemplate
 */
angular.module('ngExplorerApp')
  .directive('ngIncludeTemplate', function() {  
  return {  
    templateUrl: function(elem, attrs) { return attrs.ngIncludeTemplate; },  
    restrict: 'A',  
    scope: {  
      'ngIncludeVariables': '&'  
    },  
    link: function(scope, elem, attrs) {  
      var vars = scope.ngIncludeVariables();  
      Object.keys(vars).forEach(function(key) {  
        scope[key] = vars[key];  
      });  
    }  
  }  
})
