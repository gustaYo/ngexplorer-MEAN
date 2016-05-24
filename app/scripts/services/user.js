'use strict';

/**
 * @ngdoc service
 * @name ngExplorerApp.User
 * @description
 * # User
 * Factory in the ngExplorerApp.
 */
angular.module('ngExplorerApp')
        .factory('User', function(localStorageService, $http) {
            function urlBase64Decode(str) {
                var output = str.replace('-', '+').replace('_', '/');
                switch (output.length % 4) {
                    case 0:
                        break;
                    case 2:
                        output += '==';
                        break;
                    case 3:
                        output += '=';
                        break;
                    default:
                        throw 'Illegal base64url string!';
                }
                return window.atob(output);
            }
            function decodeToken() {
                var token = localStorageService.get('token');
                if (token != null) {
                    var encoded = token.split('.')[1];
                    token = JSON.parse(urlBase64Decode(encoded));
                } else {
                    console.log("no entro")
                }
                return token;
            }
            function getUserFromToken() {
                var dta = localStorageService.get('user');
                var user = {};
                if (dta !== null) {
                    user = dta;
                }
                return user;
            }
            return {
                save: function(data, success, error) {                   
                    $http.post(localStorageService.get('ngexplorer_server') + '/user/signin', data).success(success).error(error)
                },
                signin: function(data, success, error) {                    
                    $http.post(localStorageService.get('ngexplorer_server') + '/user/authenticate', data).success(success).error(error)
                },
                logout: function(success) {
                    localStorageService.remove('token');
                    localStorageService.remove('user');
                    success();
                },
                counterVisit: function(data, success, error) {
                    $http.post(localStorageService.get('ngexplorer_server') + '/user/counter', data).success(success).error(error)
                },
                getStadist: function(success, error) {
                    $http.get(localStorageService.get('ngexplorer_server') + '/user/counter').success(success).error(error)
                },
                user_permission: function(permisoRol) {
                    var user = getUserFromToken();
                    return user.role === permisoRol;
                },
                getUser: function() {
                    return getUserFromToken();
                }
            };
        });
