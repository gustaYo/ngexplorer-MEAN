'use strict';

/**
 * @ngdoc directive
 * @name ngExplorerApp.directive:whenScrolled
 * @description
 * # whenScrolled
 */
angular.module('ngExplorerApp')
        .directive('whenScrolled', function() {
            return function(scope, elm, attr) {                
                var scroll_parent=elm.parent('div').parent();
                var raw = scroll_parent[0];
                scroll_parent.bind('scroll', function() {
                    if (raw.scrollTop + raw.offsetHeight+50 >= raw.scrollHeight) {
                        scope.$apply(attr.whenScrolled);
                    }
                });
            };
        });
