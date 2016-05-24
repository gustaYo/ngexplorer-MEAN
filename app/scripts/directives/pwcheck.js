'use strict';

/**
 * @ngdoc directive
 * @name ngExplorerApp.directive:pwCheck
 * @description
 * # pwCheck
 */
angular.module('ngExplorerApp')
        .directive('pwCheck', [function() {
                return {
                    require: 'ngModel',
                    link: function(scope, elem, attrs, ctrl) {
                        var firstPassword = '#' + attrs.pwCheck;
                        elem.add(firstPassword).on('keyup', function() {
                            scope.$apply(function() {
                                var v = elem.val() === $(firstPassword).val();
                                ctrl.$setValidity('pwmatch', v);
                            });
                        });
                    }
                }
            }]);
