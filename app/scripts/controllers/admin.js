'use strict';

/**
 * @ngdoc function
 * @name ngExplorerApp.controller:DatatablesCtrl
 * @description
 * # DatatablesCtrl
 * Controller of the ngExplorerApp
 */
angular.module('ngExplorerApp')
        .controller('DialogController', DialogController)
        .controller('RemoteSincronizeController', RemoteSincronizeController)
        .controller('EditUserController', EditUserController)
        .controller('AdminCtrl', ['$http', '$mdEditDialog', '$q', '$timeout', '$scope', 'Proveedores', '$mdMedia', '$mdDialog', 'localStorageService', 'User', function($http, $mdEditDialog, $q, $timeout, $scope, Proveedores, $mdMedia, $mdDialog, localStorageService, User) {
                'use strict';
                $scope.selected = [];
                $scope.query = {
                    order: 'name',
                    limit: 5,
                    page: 1
                };
                var ftpsproxy = localStorageService.get('ftpsproxy');
                if (ftpsproxy !== null) {
                    $scope.proxy = ftpsproxy;
                } else {
                    $scope.proxy = {"enabled": "none"};
                    localStorageService.add('ftpsproxy', $scope.proxy);
                }
                $scope.ConfigAdminUpdate = function() {
                    localStorageService.add('ftpsproxy', $scope.proxy);
                }
                $scope.loadProveedores = function() {
                    Proveedores.model.query({entryId: JSON.stringify({type: 'ftps'})}).$promise
                            .then(function(result) {
                                $scope.desserts = {
                                    "count": result.length,
                                    "data": result
                                };
                            }, function(error) {
                                console.log(error);
                            });
                }
                $scope.editComment = function(event, dessert) {
                    event.stopPropagation();

                    var promise = $mdEditDialog.large({
                        // messages: {
                        //   test: 'I don\'t like tests!'
                        // },
                        modelValue: dessert.dirscan,
                        placeholder: '/',
                        save: function(input) {
                            dessert.dirscan = input.$modelValue;
                        },
                        targetEvent: event,
                        title: 'Editar DirScan',
                        validators: {
                            'md-maxlength': 30
                        }
                    });
                    promise.then(function(ctrl) {
                        var input = ctrl.getInput();
                        input.$viewChangeListeners.push(function() {
                            input.$setValidity('test', input.$modelValue !== 'test');
                        });
                    });
                };
                $scope.onPaginate = function(page, limit) {
                    console.log('Scope Page: ' + $scope.query.page + ' Scope Limit: ' + $scope.query.limit);
                    console.log('Page: ' + page + ' Limit: ' + limit);
                    $scope.promise = $timeout(function() {
                    }, 1000);
                };

                $scope.deselect = function(item) {
                    console.log(item.name, 'was deselected');
                };

                $scope.log = function(item) {
                    console.log(item.name, 'was selected');
                };

                $scope.loadStuff = function() {
                    $scope.promise = $timeout(function() {

                    }, 1000);
                };

                $scope.onReorder = function(order) {
                    console.log('Scope Order: ' + $scope.query.order);
                    console.log('Order: ' + order);
                    $scope.promise = $timeout(function() {

                    }, 1000);
                };
                $scope.SincronizeRemoteServer = function(ev, node) {
                    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
                    $mdDialog.show({Sinc
                        controller: RemoteSincronizeController,
                        templateUrl: 'views/sincronize.html',
                        parent: angular.element(document.body),
                        targetEvent: ev,
                        clickOutsideToClose: true,
                        fullscreen: useFullScreen,
                        resolve: {
                            node: function() {
                                return node || false;
                            }
                        }
                    })
                            .then(function(prov) {

                            }, function() {
                                $scope.status = 'You cancelled the dialog.';
                            });
                    $scope.$watch(function() {
                        return $mdMedia('xs') || $mdMedia('sm');
                    }, function(wantsFullScreen) {
                        $scope.customFullscreen = (wantsFullScreen === true);
                    });
                };

                $scope.status = '  ';
                $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
                $scope.showAdvanced = function(ev, node) {
                    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
                    $mdDialog.show({
                        controller: DialogController,
                        templateUrl: 'views/addproveedor.html',
                        parent: angular.element(document.body),
                        targetEvent: ev,
                        clickOutsideToClose: true,
                        fullscreen: useFullScreen,
                        resolve: {
                            node: function() {
                                return node || false;
                            }
                        }
                    })
                            .then(function(prov) {
                                $scope.loadProveedores();
                            }, function() {
                                $scope.status = 'You cancelled the dialog.';
                            });
                    $scope.$watch(function() {
                        return $mdMedia('xs') || $mdMedia('sm');
                    }, function(wantsFullScreen) {
                        $scope.customFullscreen = (wantsFullScreen === true);
                    });
                };

                $scope.actionsAdmin = function(ev, action, node) {
                    switch (action) {
                        case 'edit':
                            $scope.showAdvanced(ev, node)
                            break;
                        case 'del':
                            $scope.showConfirm(ev, node)
                            break;
                        case 'sincro':
                            $scope.SincronizeRemoteServer(ev, node)
                            break;
                        case 'escan':
                            var parms = {_idServer: node._id, proxy: $scope.proxy, complete: 'yes'};
                            $scope.WindowsScanner(ev, parms);
                            break;
                        case 'continueScanner':
                            var parms = {_idServer: node._id, proxy: $scope.proxy, complete: 'no'};
                            $scope.WindowsScanner(ev, parms);
                            break;
                    }
                }
                $scope.WindowsScanner = function(ev, parms) {
                    Proveedores.model.update(parms)
                            .$promise
                            .then(function(result) {
                                var men = {
                                    title: 'Escaneando el ftp',
                                    textContent: 'Esto puede demorar un poco'
                                }
                                $scope.showAlert(ev, men);
                            }, function(error) {
                                var men = {
                                    title: 'Error al escanear',
                                    textContent: error.data
                                }
                                $scope.showAlert(ev, men);
                            });
                }
                $scope.showAlert = function(ev, men) {
                    $mdDialog.show(
                            $mdDialog.alert()
                            .parent(angular.element(document.querySelector('#popupContainer')))
                            .clickOutsideToClose(true)
                            .title(men.title)
                            .textContent(men.textContent)
                            .ariaLabel('Alert Dialog Demo')
                            .ok('Continuar')
                            .targetEvent(ev)
                            );
                };
                $scope.showConfirm = function(ev, node) {
                    var confirm = $mdDialog.confirm()
                            .title('Seguro de eliminar ' + node.name)
                            .textContent('Todos los elementos asociados seran eliminados')
                            .ariaLabel('Lucky day')
                            .targetEvent(ev)
                            .ok('Eliminar')
                            .cancel('Cancelar');
                    $mdDialog.show(confirm).then(function() {
                        delProveedores([node._id]);
                    }, function() {
                        //
                    });
                };
                $scope.delMultiple = function() {
                    var ids = new Array();
                    for (var i in $scope.selected) {
                        ids.push($scope.selected[i]._id);
                    }
                    delProveedores(ids);
                }
                var delProveedores = function(ids) {
                    Proveedores.model.remove({entryId: JSON.stringify(ids)}).$promise
                            .then(function(result) {
                                $scope.loadProveedores();
                                $scope.selected = [];
                            }, function(error) {
                                console.log(error);
                            });
                }
                $scope.logout = function() {
                    User.logout(function() {
                        console.log('salir')
                        window.location.reload();
                    })
                }
                $scope.enableSelection = function() {
                    return $scope.hideCheckboxes ? 'enable_selection' : 'disable_selection';
                }
                $scope.enableHead = function() {
                    return $scope.hideHead ? 'show_head' : 'no_head';
                }

                $scope.UserEdit = function(ev) {
                    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
                    $mdDialog.show({
                        controller: 'EditUserController',
                        templateUrl: 'views/edituser.html',
                        parent: angular.element(document.body),
                        targetEvent: ev,
                        clickOutsideToClose: true,
                        fullscreen: useFullScreen
                    })
                            .then(function(prov) {
                                $scope.loadProveedores();
                            }, function() {
                                $scope.status = 'You cancelled the dialog.';
                            });
                    $scope.$watch(function() {
                        return $mdMedia('xs') || $mdMedia('sm');
                    }, function(wantsFullScreen) {
                        $scope.customFullscreen = (wantsFullScreen === true);
                    });
                };

            }]);
function EditUserController($scope, $mdDialog, User) {
    $scope.user = User.getUser();
    $scope.user.password = "";

    $scope.hide = function() {
        $mdDialog.hide();
    };
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
    $scope.save = function() {
        User.save($scope.user, function(res) {
            $mdDialog.hide(res);
        }, function(error) {
            alert(error);
        })
//        $mdDialog.hide(dataForm);
    };
}
function DialogController($scope, $mdDialog, node, Proveedores) {
    $scope.prov = {}
    if (node) {
        $scope.prov = node;
    }
    $scope.tiposProveedores = ['ftp', 'http'];
    $scope.hide = function() {
        $mdDialog.hide();
    };
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
    $scope.save = function(dataForm) {
        Proveedores.model.post(dataForm).$promise
                .then(function(result) {
                    $mdDialog.hide(dataForm);
                }, function(error) {
                    $scope.error = error;
                });
    };
}
function RemoteSincronizeController($scope, $mdDialog, Proveedores, node, localStorageService) {

    $scope.state = false;
    $scope.remote = {}
    var page = 0;
    $scope.count = 0;
    $scope.TestSincronize = function() {
        // busca
        $scope.mensaje = false;
        if ($scope.server.url === localStorageService.get('ngexplorer_server')) {
            $scope.mensaje = {title: "Jaja", description: 'Operacion no permitida'};
        } else {
            var data = {
                'action': 'found',
                'uri': node.uri,
                'dirscan': node.dirscan,
            }
            Proveedores.sincroProvServer($scope.server.url, data, function(res) {
                $scope.state = true;
                console.log(res);
                $scope.remote = res;
            }, function(error) {
                console.log(error);
                $scope.mensaje = {title: "Error", description: 'Host remoto desconocido'};
            });
        }
    }
    $scope.run = false;
    $scope.RunSincronize = function() {
        $scope.run = true;
        $scope.mensaje = false;
        sincro();
    }
    var sincro = function() {
        var data = {
            'action': 'getfiles',
            'idprove': $scope.remote.ftp._id,
            page: page,
            perPage: 1000
        }
        Proveedores.sincroProvServer($scope.server.url, data, function(res) {
//            console.log(res);
            $scope.count += res.length;
            // insertar estos archivos en el servidor local
            Proveedores.AddFileToServerProve({action: 'insert', files: res}, function(r) {
                if ($scope.count < $scope.remote.numFiles) {
                    page += 1;
                    sincro();
                } else {
                    // termino
                    console.log($scope.remote.ftp)
                    Proveedores.AddFileToServerProve({action: 'finish', idOld: $scope.remote.ftp._id, idNew: node._id}, function(r) {
                        console.log('termine');
                        $scope.run = false;
                        $scope.state = false;
                        $scope.remote = {}
                        page = 0;
                        $scope.count = 0;
                        $scope.mensaje = {title: "Terminado", description: "La sicronizacion fue un exito"};
                        // actualizar identificador por el de local
                    }, function(error) {
                        $scope.mensaje = {title: "Error", description: "Hubo algun problema"};
                    });
                }

            }, function(error) {
                console.log(error);
            });
        }, function(error) {
            console.log(error);
        });
    }

    $scope.hide = function() {
        $mdDialog.hide();
    };
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
    $scope.save = function(dataForm) {

    };
}