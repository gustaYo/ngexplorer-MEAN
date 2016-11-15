'use strict';

/**
 * @ngdoc function
 * @name ngExplorerApp.controller:SelecteddownloadCtrl
 * @description
 * # SelecteddownloadCtrl
 * Controller of the ngExplorerApp
 */
angular.module('ngExplorerApp')
        .controller('SelecteddownloadCtrl', function($scope, selected,$mdDialog) {
            console.log(selected)
            $scope.listadoFilesDownload = selected;
            $scope.hide = function() {
                $mdDialog.hide();
            };
            $scope.cancel = function() {
                $mdDialog.cancel();
            };
        });
