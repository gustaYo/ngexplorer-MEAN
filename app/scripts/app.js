'use strict';
/**
 * @ngdoc overview
 * @name ngExplorerApp
 * @description
 * # ngExplorerApp
 *
 * Main module of the application.
 */
angular
        .module('ngExplorerApp', [
            'ngAnimate',
            'ngCookies',
            'ngResource',
            'ui.router',
            'ngSanitize',
            'ngMaterial',
            'md.data.table',
            'permission',
            'pascalprecht.translate',
            'LocalStorageModule',
            'ngMdIcons',
            'cfp.hotkeys',
            'ng.deviceDetector',
        ])
        // estableciendo roles para restringir el acceso a las rutas
        .run(permisosConfig)
        .config(function($stateProvider, $urlRouterProvider) {
            $urlRouterProvider
                    .otherwise('/');
            $stateProvider
                    .state('main', {
                        url: '/',
                        templateUrl: 'views/main.html',
                        controller: 'MainCtrl',
                    })
                    .state('admin', {
                        url: '/admin',
                        data: {
                            permissions: {
                                only: ['Admin'],
                                redirectTo: 'main'
                            }
                        },
                        templateUrl: 'views/admin.html',
                        controller: 'AdminCtrl',
                    })
                    .state('home', {
                        url: '/home',
                        templateUrl: 'views/home.html',
                        controller: 'TablefilterCtrl',
                    })
                    .state('filter', {
                        url: '/filter',
                        templateUrl: 'views/tablefilter.html',
                        controller: 'TablefilterCtrl',
                    })
        })
        .config(function($mdIconProvider) {
//            $mdIconProvider
//                    .defaultIconSet('images/icons/materialdesignicons-webfont.svg')
            $mdIconProvider
                    .defaultIconSet('images/icons/sets/core-icons.svg', 24);

        })
        .config(function($translateProvider, localStorageServiceProvider, $httpProvider) {
            // Establecer prefijo para el almacenamiento local
            localStorageServiceProvider.setPrefix('explNG');
            // Establecer las rutas para cargar los archivos estaticos de traduccion
            $translateProvider.useStaticFilesLoader({
                prefix: '../translations/trans_',
                suffix: '.json'
            });
            // Configuracion de seguridad el modulo de internacionalizacion
            $translateProvider.useSanitizeValueStrategy('escaped');
            // Predefinir idioma por defecto
            $translateProvider.preferredLanguage('es');
            // Establecer logica del httpIterceptor necesario para la autenticacion por tokes con el servidor
            $httpProvider.interceptors.push(['$q', '$location', 'localStorageService', function($q, $location, localStorageService) {
                    return {
                        'request': function(config) {
                            config.headers = config.headers || {};
                            if (localStorageService.get('token') != null) {
                                config.headers.Authorization = 'Bearer ' + localStorageService.get('token');
                            }
                            return config;
                        },
                        'responseError': function(response) {
                            if (response.status === 401 || response.status === 403) {
                                $location.path('/loguin');
                            }
                            return $q.reject(response);
                        }
                    };
                }]);
        })
        .controller('AppCtrl', function($scope, $timeout, $mdSidenav, $log, $location, hotkeys) {
            $scope.status = '  ';
            hotkeys.add({
                combo: 'f',
                description: 'Description goes here',
                callback: function(event, hotkey) {
                    $scope.Ir('filter')
                }
            });
            hotkeys.add({
                combo: 'c',
                description: 'Description goes here',
                callback: function(event, hotkey) {
                    $scope.Ir('chupaelperro')
                }
            });
            hotkeys.add({
                combo: 'a',
                description: 'Description goes here',
                callback: function(event, hotkey) {
                    $scope.Ir('admin')
                }
            });
            $scope.toggleLeft = buildDelayedToggler('left');
            $scope.toggleRight = buildToggler('right');
            $scope.isOpenRight = function() {
                return $mdSidenav('right').isOpen();
            };
            /**
             * Supplies a function that will continue to operate until the
             * time is up.
             */
            function debounce(func, wait, context) {
                var timer;
                return function debounced() {
                    var context = $scope,
                            args = Array.prototype.slice.call(arguments);
                    $timeout.cancel(timer);
                    timer = $timeout(function() {
                        timer = undefined;
                        func.apply(context, args);
                    }, wait || 10);
                };
            }
            /**
             * Build handler to open/close a SideNav; when animation finishes
             * report completion in console
             */
            function buildDelayedToggler(navID) {
                return debounce(function() {
                    $mdSidenav(navID)
                            .toggle()
                            .then(function() {
                                $log.debug("toggle " + navID + " is done");
                            });
                }, 200);
            }
            function buildToggler(navID) {
                return function() {
                    $mdSidenav(navID)
                            .toggle()
                            .then(function() {
                                $log.debug("toggle " + navID + " is done");
                            });
                }
            }
            $scope.Ir = function(url) {
                $location.path('/' + url);
            }
        })
        .controller('LeftCtrl', function(localStorageService, $scope, $timeout, $mdSidenav, $log, Proveedores, $rootScope) {
            $scope.ftpsActives = [];
            $timeout(function() {
//                $('.loadingapp').loading('load4');
                $('.apprun').fadeIn();
//                $timeout(function() {
//                    $('.loadingapp').loading(false);
//                }, 1500);
            }, 10);
            var loadFtpsSelect = function(list) {
                var retorn = [];
                for (var i in list) {
                    retorn[list[i]] = true;
                }
                return retorn;
            }
            $scope.close = function() {
                $mdSidenav('left').close()
                        .then(function() {
                            $log.debug("close LEFT is done");
                        });
            };
            $rootScope.ProveedoresList = [];
            $scope.loadProveedores = function() {
                Proveedores.model.query({entryId: JSON.stringify({type: 'ftps'})}).$promise
                        .then(function(result) {
                            $rootScope.ProveedoresList = [];
                            $scope.listProveedores = result;
                            var idFtpsActive = [];
                            for (var i in result) {
                                if (result[i]._id !== undefined) {
                                    $rootScope.ProveedoresList[result[i]._id] = result[i];
                                    idFtpsActive[result[i]._id] = true;
                                }
                            }
                            var value = localStorageService.get('ftpsActives');
                            if (value !== null) {
                                $scope.ftpsActives = loadFtpsSelect(value);
                            } else {
                                // activar todos los ftps por default
                                $scope.ftpsActives = idFtpsActive;
                                localStorageService.add('ftpsActives', saveFtpsSelect($scope.ftpsActives));
                            }

                        }, function(error) {
                            console.log(error);
                        });
            }

            $scope.loadProveedoresFavorites = function() {
                alert('no implement yet')
            }
            var OpenInNewTab = function(url) {
                var win = window.open(url, '_blank');
                win.focus();
            }
            $scope.openFtpTab = function(ftp) {
                if ($rootScope.viewFilter) {
                    $scope.ftpsActives[ftp._id] = $scope.ftpsActives[ftp._id] ? false : true;
                    localStorageService.add('ftpsActives', saveFtpsSelect($scope.ftpsActives));
                    $rootScope.$broadcast('ftpfilter', {});
                } else {
                    $rootScope.$broadcast('openTab', ftp);
                }
            }
            $scope.ChangeSwitch = function(ftp) {
                $scope.ftpsActives[ftp._id] = $scope.ftpsActives[ftp._id] ? true : false;
                localStorageService.add('ftpsActives', saveFtpsSelect($scope.ftpsActives));
                $rootScope.$broadcast('ftpfilter', {});
            }
            $rootScope.viewFilter = false;
            var saveFtpsSelect = function(list) {
                var retorn = new Array();
                for (var i in list) {
                    if (list[i])
                        retorn.push(i);
                }
                return retorn;
            }

        })
        .controller('RightCtrl', function($location, $scope, $timeout, $mdSidenav, $log, localStorageService, $translate, $mdDialog, $mdMedia, User, deviceDetector, $mdBottomSheet) {

            $scope.showListBottomSheet = function() {
                $scope.alert = '';
                $mdBottomSheet.show({
                    templateUrl: 'views/about.html',
                    controller: 'AboutCtrl'
                }).then(function(clickedItem) {
                    $scope.alert = clickedItem['name'] + ' clicked!';
                });
            };
            $scope.close = function() {
                $mdSidenav('right').close()
                        .then(function() {
                            $log.debug("close RIGHT is done");
                        });
            };
            $scope.server = localStorageService.get('ngexplorer_server');
            $scope.SaveUrlServer = function() {
                localStorageService.add('ngexplorer_server', $scope.server);
                window.location.reload();
            };
            var value = localStorageService.get('ngexplorer_idioma');
            if (value !== null) {
                $scope.idioma = value;
                $translate.use(value);
            } else {
                $scope.idioma = 'es';
                localStorageService.add('ngexplorer_idioma', 'es');
            }
            $scope.changeLanguage = function(key) {
                localStorageService.add('ngexplorer_idioma', key);
                $translate.use(key);
            };
            $scope.clearAllConfig = function() {
                localStorageService.clearAll();
                window.location.reload();
            }
            $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
            $scope.user = User.getUser();
            console.log($scope.user);
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
            $scope.AdminAccess = function(ev) {
                if (typeof $scope.user.username === 'undefined') {
                    $mdDialog.show({
                        controller: 'LoguinCtrl',
                        templateUrl: 'views/loguin.html',
                        parent: angular.element(document.body),
                        targetEvent: ev,
                        clickOutsideToClose: true,
                        fullscreen: useFullScreen
                    })
                            .then(function(admin) {
                                $scope.user = admin;
                                $scope.close();
                                $location.path('/admin');
                            }, function() {
                                $scope.status = 'You cancelled the dialog.';
                            });
                    $scope.$watch(function() {
                        return $mdMedia('xs') || $mdMedia('sm');
                    }, function(wantsFullScreen) {
                        $scope.customFullscreen = (wantsFullScreen === true);
                    });
                } else {
                    $scope.close();
                    $location.path('/admin');
                }
            };
            $scope.alert = '';
            $scope.showListBottomSheet = function() {
                $scope.alert = '';
                $mdBottomSheet.show({
                    templateUrl: 'views/about.html',
                    controller: 'AboutCtrl'
                }).then(function(clickedItem) {
                    $scope.alert = clickedItem['name'] + ' clicked!';
                });
            };
            $scope.counter = {};
            $scope.counterVisit = function() {
                $timeout(function() {
                    var data = {
                        browser: deviceDetector.browser,
                        browser_version: deviceDetector.browser_version,
                        device: deviceDetector.device,
                        os: deviceDetector.os,
                        os_version: deviceDetector.os_version,
                        type: 'v'
                    }
                    User.counterVisit(data, function(res) {
                        $scope.counter = res;
                    }, function(e) {
                        console.log(e)
                    });
                }, 1000);
            }
            $scope.openModalStadis = function(ev) {
                $mdDialog.show({
                    controller: 'EstadisticasCtrl',
                    templateUrl: 'views/estadisticas.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: useFullScreen
                })
                        .then(function(admin) {

                        }, function() {

                        });
            }
        });
function permisosConfig(Permission, User, localStorageService) {
    // estableciendo configuracion del api del servidor por defecto
    var ngexplorer_server = localStorageService.get('ngexplorer_server');
    if (ngexplorer_server === null) {
        var dev = "http://10.55.11.3:3010";
        var prod = window.location.origin;
        localStorageService.add('ngexplorer_server', prod);
    }
    //  https://github.com/Narzerus/angular-permission
    var roles = ['anonymous', 'Admin'];
    Permission.defineManyRoles(roles, function(stateParams, roleName) {
        return User.user_permission(roleName);
    });
}


(function($) {
    $.change_loading = function(num) {
        if ($('.overlay_loading').hasClass(num)) {
            //
        } else {
            for (var i = 1; i < 9; i++) {
                $('.overlay_loading').removeClass('load' + i);
            }
            if (num > 8) {
                num = 'load1';
            }
        }
        return num;
    }
    $.fn.loading = function(num_loading) {
        if (!num_loading) {
            $(this).children('div.overlay_loading').fadeOut()
            return;
        }
        var num_loading = num_loading || "load1";
        var load_cont = '<div class="overlay_loading load-container ' + $.change_loading(num_loading) + ' " >' +
                '<div class="loader" style="top:10%;">Loading...</div>' +
                '</div>';
        // eliminar anteriores
        $(this).children('div.overlay_loading').remove()
        $(this).prepend(load_cont);
        $(this).children('div.overlay_loading').css({
            width: this.outerWidth(),
            height: this.outerHeight()
        });
        $(this).children('div.overlay_loading').fadeIn();
    };
})(jQuery);


