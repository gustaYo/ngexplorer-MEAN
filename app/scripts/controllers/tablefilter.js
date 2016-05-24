'use strict';

/**
 * @ngdoc function
 * @name ngExplorerApp.controller:TablefilterCtrl
 * @description
 * # TablefilterCtrl
 * Controller of the ngExplorerApp
 */
angular.module('ngExplorerApp')
        .controller('TablefilterCtrl', function($scope, Proveedores, sharedValues, $rootScope, localStorageService, $timeout) {
            $scope.hideCheckboxes = true;
            $scope.selected = [];
            $scope.query = {
                order: 'name',
                limit: 10,
                page: 1
            };
            $scope.baseURl = function(tab) {
                return tab.type === 'ftp' ? 'ftp://' : '';
            }

            $scope.decodeURIComponent = function(string) {
                var name = string;
                try {
                    // If the string is UTF-8, this will work and not throw an error.
                    name = decodeURIComponent(name);
                } catch (e) {
                    // If it isn't, an error will be thrown, and we can asume that we have an ISO string.

                }
                return name;
            }
            $scope.onPaginate = function(page, limit) {
                console.log('Scope Page: ' + $scope.query.page + ' Scope Limit: ' + $scope.query.limit);
                console.log('Page: ' + page + ' Limit: ' + limit);
                $scope.promise = $timeout(function() {

                }, 502);
            };
            $scope.deselect = function(item) {
                console.log(item.name, 'was deselected');
            };
            $scope.log = function(item) {
                console.log(item.name, 'was selected');
            };
            $scope.onReorder = function(order) {
                console.log('Scope Order: ' + $scope.query.order);
                console.log('Order: ' + order);
                $scope.promise = $timeout(function() {

                }, 500);
            };
            var value = localStorageService.get('filter');
            if (value !== null) {
                $scope.filter = value;
            } else {
                localStorageService.add('filter', {});
                $scope.filter = {};
            }
            var timer;
            $scope.filterEnter = function() {
                $timeout.cancel(timer);
                timer = $timeout(
                        function() {
                            $scope.filterTable();
                        },
                        500
                        );

            }
            $scope.timeConsult = "";
            $scope.filterTable = function() {
                $scope.filter.type = 'file';
                $scope.filter.ftps = localStorageService.get('ftpsActives');
                localStorageService.add('filter', $scope.filter);
                var timeConsult = new Date().getTime();
                $scope.promise = $timeout($scope.loadFiles($scope.filter));
                $scope.promise.then(
                        function() {
                            var demoro = new Date().getTime() - timeConsult;
                            demoro = demoro / 1000;
                            $scope.timeConsult = demoro;
                            $scope.query.page = 1;
                        },
                        function() {
                            console.log("Timer rejected!", Date.now());
                        }
                );
            }
            $scope.focusInput = function() {
                $timeout(function() {
                    $('.filtroinput input:first').focus();
                }, 20);
            }
            $scope.initTable = function() {
                $timeout(function() {
                    // en ocaciones se queda lento la obtencion de los ftps del sistema
                    $scope.getFtpsSystem(function() {
                        $scope.filterTable();
                    });
                }, 10);
            }
            $scope.loadFiles = function(filtro) {
                Proveedores.getFiles(filtro, function(res) {
                    var data = new Array();
                    for (var i in res) {
                        if (res[i] !== '') {
                            var baseURl = $scope.listProveedores[res[i].ftp].type === 'ftp' ? 'ftp://' : '';
                            var name = res[i].name;
                            try {
                                name = decodeURIComponent(res[i].name);
                            } catch (e) {
                            }
                            if ($scope.listProveedores[res[i].ftp] !== 'undefined') {
                                var doc = {
                                    file: res[i],
                                    name: name,
                                    baseurl: baseURl + $scope.listProveedores[res[i].ftp].uri + res[i].directory,
                                    ftpname: $scope.listProveedores[res[i].ftp].name
                                }
                                data.push(doc);
                            }
                        }
                    }
                    $scope.desserts = {
                        "count": res.length,
                        "data": data
                    };
                }, function(error) {
                    console.log(error);
                });
            }
            $rootScope.viewFilter = true;
            $rootScope.$on('ftpfilter', function(event, data) {
                $scope.filterTable();
                $scope.updateCount();
                $scope.focusInput();
            });
            $scope.updateCount = function() {
                Proveedores.countFiles($scope.filter.ftps, function(res) {
                    $scope.counts = res;
                }, function(error) {
                    console.log(error);
                })
            }
            $scope.listProveedores = [];
            $scope.getFtpsSystem = function(next) {
                Proveedores.model.query({entryId: JSON.stringify({type: 'ftps'})}).$promise
                        .then(function(result) {
                            for (var i in result) {
                                $scope.listProveedores[result[i]._id] = result[i];
                            }
                            next();
                        }, function(error) {
//                            alert('mal');
//                            OpenInNewTab(APISERVER.url)
                        });
            };
//            $scope.getFtpsSystem();
        });


