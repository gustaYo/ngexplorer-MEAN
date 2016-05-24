'use strict';

/**
 * @ngdoc service
 * @name ngExplorerApp.proveedores
 * @description
 * # proveedores
 * Service in the ngExplorerApp.
 */
var APISERVER = "";
angular.module('ngExplorerApp')
        .service('Proveedores', function($http, $resource, localStorageService) {
            // configurando ruta de servidor Rest
            var APISERVER = localStorageService.get('ngexplorer_server');

            // AngularJS will instantiate a singleton by calling "new" on this function
            var model = $resource(APISERVER + '/ftp/api/:entryId', {}, {
                query: {method: 'GET', params: {entryId: '@entryId'}, isArray: true},
                post: {method: 'POST'},
                update: {method: 'PUT'},
                remove: {method: 'DELETE', params: {entryId: '@entryId'}}
            });
            return {
                getFiles: function(parms, success, error) {
                    $http.post(APISERVER + '/ftp/files', parms).success(success).error(error)
                },
                countFiles: function(parms, success, error) {
                    $http.post(APISERVER + '/ftp/filescount', parms).success(success).error(error)
                },
                sincroProvServer: function(dirServer, parms, success, error) {
                    $http.get(dirServer + '/ftp/files', {params: parms}).success(success).error(error)
                },
                AddFileToServerProve: function(parms, success, error) {
                    $http.put(APISERVER + '/ftp/files', parms).success(success).error(error)
                },
                getSizeFolder: function(parms, success, error) {
                    $http.get(APISERVER + '/ftp/filescount', {params: parms}).success(success).error(error)
                },
                model: model
            }
        });


