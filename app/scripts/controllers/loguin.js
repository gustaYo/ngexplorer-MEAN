'use strict';

/**
 * @ngdoc function
 * @name ngExplorerApp.controller:LoguinCtrl
 * @description
 * # LoguinCtrl
 * Controller of the ngExplorerApp
 */
angular.module('ngExplorerApp')
        .controller('LoguinCtrl', function($scope, $mdDialog, User, localStorageService) {
            $scope.error = '';
            $scope.hide = function() {
                $mdDialog.hide();
            };
            $scope.cancel = function() {
                $mdDialog.cancel();
            };
            $scope.save = function(dataForm) {
                $mdDialog.hide(dataForm);
            };
            $scope.loguinUser = function() {
                User.signin($scope.user, function(res) {                    
                    localStorageService.add('token', res.token);
                    localStorageService.add('user', res.data);
                    $mdDialog.hide(res.data);
                }, function(e) {
                    $scope.error = e;
                });
            }
            $scope.logout = function() {
                User.logout(function() {
                    console.log('salir')
                });
            }
        });
