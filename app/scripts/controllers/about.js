'use strict';

/**
 * @ngdoc function
 * @name ngExplorerApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the ngExplorerApp
 */
angular.module('ngExplorerApp')
  .controller('AboutCtrl', function ($scope) {
      $scope.AcercaDe = {
                users: [
                    {
                        name: "Gustavo Crespo Sánchez",
                        email:"gcrespo@uci.cu",
                        urlImage: "http://directorio.uci.cu/sites/all/modules/custom/directorio_de_personas/display_foto.php?id=E115940",                        web: ""
                    },
                    {
                        name: "Vladimir López Salvador",
                        email:"vlopez@uci.cu",
                        urlImage: "http://directorio.uci.cu/sites/all/modules/custom/directorio_de_personas/display_foto.php?id=E123873",                        
                    }
                ]
            }           
            
  });
