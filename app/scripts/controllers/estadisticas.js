'use strict';

/**
 * @ngdoc function
 * @name ngExplorerApp.controller:EstadisticasCtrl
 * @description
 * # EstadisticasCtrl
 * Controller of the ngExplorerApp
 */
angular.module('ngExplorerApp')
        .controller('EstadisticasCtrl', function($scope, $mdDialog, User) {
            $scope.stadi = {}
            $scope.hide = function() {
                $mdDialog.hide();
            };
            $scope.cancel = function() {
                $mdDialog.cancel();
            };
            $scope.getsta = function() {
                User.getStadist(function(res) {
                    $scope.stadi = res;
                }, function(e) {
                    console.log(e)
                });
            }
        });
