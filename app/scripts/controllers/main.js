'use strict';

/**
 * @ngdoc function
 * @name ngExplorerApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the ngExplorerApp
 */
angular.module('ngExplorerApp')
        .controller('MainCtrl', MainCtrl)
        .filter('keyboardShortcut', function($window) {
            return function(str) {
                if (!str)
                    return;
                var keys = str.split('-');
                var isOSX = /Mac OS X/.test($window.navigator.userAgent);
                var seperator = (!isOSX || keys.length > 2) ? '+' : '';
                var abbreviations = {
                    M: isOSX ? '⌘' : 'Ctrl',
                    A: isOSX ? 'Option' : 'Alt',
                    S: 'Shift'
                };
                return keys.map(function(key, index) {
                    var last = index == keys.length - 1;
                    return last ? key : abbreviations[key];
                }).join(seperator);
            };
        })
function MainCtrl($mdDialog, $mdMedia, $scope, $log, $rootScope, Proveedores, localStorageService, $timeout, $q, hotkeys, sharedValues) {
    $rootScope.viewFilter = false;
    $scope.files = [];
    $scope.tabs = [];
    var selected = null,
            previous = null;
    $scope.selected = [];
    $scope.settings = {
        printLayout: true,
        showRuler: true,
        showSpellingSuggestions: true,
        presentationMode: 'edit'
    };
    // archivos seleccionados para mostrar en descarga
    $scope.selected = [];
    $scope.autoSelect=false;
    var selected = localStorageService.get('selectedDOWNLOAD');
    if (selected !== null) {
        $scope.selected = selected;
    } else {
        localStorageService.add('selectedDOWNLOAD', []);
    }
    $scope.deselect = function(item) {
        console.log(item.name, 'was deselected');        
//        localStorageService.add('selectedDOWNLOAD', $scope.selected);
    };    
    $scope.log = function(item) {
        console.log(item.name, 'was selected');
        // eliminar repetidos
//        localStorageService.add('selectedDOWNLOAD', $scope.selected);
    };
    $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
    $scope.DescargarFilesSelected = function(ev) {
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
        $mdDialog.show({
            controller: 'SelecteddownloadCtrl',
            templateUrl: 'views/selecteddownload.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true,
            fullscreen: useFullScreen,
            resolve: {
                selected: function() {
                    return $scope.selected;
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

    $scope.onReorder = function(order) {
        console.log('Scope Order: ' + $scope.query.order);
        console.log('Order: ' + order);

        $scope.promise = $timeout(function() {

        }, 1000);
    };
    $scope.onPaginate = function(page, limit) {
        console.log('Page: ' + page + ' Limit: ' + limit);
        $scope.promise = $timeout(function() {
        }, 700);
    };
    $scope.loadScrollEvent = function(tab) {
        if (tab.init) {
            tab.init = false;
        } else {
            // buscado mas que agregar
            if (tab.files.length > tab.paso) {
                tab.paso += 20;
            }
        }
    };
    $scope.icons = {
        folder: {
            active: 'folder_open',
            desactive: 'folder'
        },
        file: {
            active: 'inbox',
            desactive: 'archive'
        }
    }
    $scope.topDirections = ['left', 'up'];
    $scope.bottomDirections = ['down', 'right'];
    $scope.isOpen = false;
    $scope.availableModes = ['md-fling', 'md-scale'];
    $scope.selectedMode = 'md-fling';
    $scope.availableDirections = ['up', 'down', 'left', 'right'];
    $scope.selectedDirection = 'up';
    $scope.breadcrumb = true;
    $scope.breadcrumbList = [];
    $scope.modeView = 0;
    $scope.simulateQuery = true;
    $scope.isDisabled = false;
    $scope.states = [];
    $scope.ViewMode = [
        {
            title: "viewIcons",
            urlView: 'views/folderview.html',
            icon: "view_module"
        },
        {
            title: "viewList",
            urlView: 'views/listview.html',
            icon: "view_list"
        }
    ];
    // opciones de configuracion
    $scope.settings = {};
    var settings = localStorageService.get('settings');
    if (settings !== null) {
        $scope.settings = settings;
    } else {
        $scope.settings = {
            viewcols: {
                type: true,
                size: true,
                time: true
            },
            sizeMode: 'MB'
        }
        localStorageService.add('settings', $scope.settings);
    }
    $scope.updateConfig = function() {
        localStorageService.add('settings', $scope.settings);
    }
    /******************************************************************/
    var tabAux = [];
    var timer;
    $scope.findFileFolder = function(text) {
        $timeout.cancel(timer);
        timer = $timeout(
                function() {
                    if (!tabAux[$scope.selectedIndex]) {
                        tabAux[$scope.selectedIndex] = angular.copy($scope.tabs[$scope.selectedIndex]);
                    }
                    var filter = {
                        type: 'file',
                        ftps: [tabAux[$scope.selectedIndex]._id],
                        name: text
                    }
                    Proveedores.getFiles(filter, function(res) {
                        var files = new Array();
                        for (var i in res) {
                            var item = {
                                icon: getTipeIconItem(res[i]),
                                file: res[i]
                            };
                            item.name = $scope.decodeURIComponent(res[i].name);
                            item.ico = $scope.icons[item.icon].desactive,
                                    files.push(item);
                        }
                        $scope.tabs[$scope.selectedIndex].files = files;
                    }, function(error) {
                        console.log(error);
                    });
                },
                500
                );
    }
    $scope.cancelfindFileFolder = function() {
        if (tabAux[$scope.selectedIndex]) {
            $scope.tabs[$scope.selectedIndex] = tabAux[$scope.selectedIndex];
            $scope.selectedItem = {_id: $scope.tabs[$scope.selectedIndex]._id, url: $scope.tabs[$scope.selectedIndex].url};
            $scope.showBreadcrumb();
            delete tabAux[$scope.selectedIndex];
        }
    }
    $scope.changeViewMode = function() {
        $scope.tabs[$scope.selectedIndex].viewMode = $scope.tabs[$scope.selectedIndex].viewMode === 0 ? 1 : 0;
        $scope.tabs[$scope.selectedIndex].paso = 40;
    };

    $scope.showOnly = function(string) {
        return string.length > 12 ? string.substring(0, 12) + '..' : string;
    }

    var ftpsUrlvisited = localStorageService.get('ftpsUrlvisited');
    if (ftpsUrlvisited !== null) {
        $scope.states = ftpsUrlvisited;
    } else {
        localStorageService.add('ftpsUrlvisited', []);
    }
    $scope.showBreadcrumb = function(show) {
        if (show)
            $scope.breadcrumb = !$scope.breadcrumb ? true : false;
        if (typeof $scope.tabs[$scope.selectedIndex] != 'undefined') {
            if ($scope.breadcrumb) {
                var url = angular.copy($scope.tabs[$scope.selectedIndex].url);
                if (url === "/") {
                    url = [""];
                } else {
                    url = url.split('/');
                }
                $scope.breadcrumbList = url;

            }
        }
    }
    $scope.activeBreadcrumb = function(post) {
        var retorn = new Array();
        var newURl = "";
        if (post === 0) {
            newURl = "/";
        } else {
            for (var i = 0; i <= post; i++) {
                retorn.push($scope.breadcrumbList[i]);
            }
            newURl = retorn.join('/');
        }
        $scope.tabs[$scope.selectedIndex].url = newURl;
        $scope.loadFiles($scope.tabs[$scope.selectedIndex]);
    }
    $scope.subMenusCache = [];
    $scope.getMenuSubFolder = function(post,id) {
        var retorn = new Array();
        var newURl = "";
        if (post === 0) {
            newURl = "/";
        } else {
            for (var i = 0; i <= post; i++) {
                retorn.push($scope.breadcrumbList[i]);
            }
            newURl = retorn.join('/');
        }
        // obteniendo id de proveedor
        var idproveedor = $scope.tabs[$scope.selectedIndex]._id;
        if (!$scope.subMenusCache[idproveedor]) {
            $scope.subMenusCache[idproveedor] = {}
        }
        $scope.subMenusCache[idproveedor][post]={};
       // if (!$scope.subMenusCache[idproveedor][post]) {
            Proveedores.getFiles({directory: newURl, ftp: idproveedor}, function(res) {
                var subfloders = new Array();
                for (var i in res) {
                    if (fileFolder(res[i])) {
                        subfloders.push(res[i])
                    }
                }
                $scope.subMenusCache[idproveedor][post] = subfloders;
            }, function(error) {
                console.log(error);
            });
//            $scope.subMenusCache[idproveedor][post] = ['subfloder1', 'subfolder2', 'subfolder3'];
       // }
    }
    var ftpsfolders = localStorageService.get('ftpsfolders');
    if (ftpsfolders !== null) {
        $scope.tabs = ftpsfolders;
    } else {
        localStorageService.add('ftpsfolders', []);
    }
    // acceso rapido de teclado

    hotkeys.bindTo($scope)
            .add({
                combo: 'up',
                description: 'This one goes to 11',
                callback: function() {
                    $scope.IrArriba()
                }
            })
            .add({
                combo: 'left',
                description: 'Tsdfdsfd',
                callback: function() {
                    $scope.history(-1)
                }
            })
            .add({
                combo: 'left',
                description: 'Tsdfdsfd',
                callback: function() {
                    $scope.history(-1)
                }
            })
            .add({
                combo: 'b',
                description: 'Tsdfdsfd',
                callback: function() {
                    $scope.showBreadcrumb(true);
                }
            })
    $scope.addFavorite = function() {
        var newTAb = angular.copy($scope.tabs[$scope.selectedIndex]);
        var directName = newTAb.url.split('/');
        directName = directName[directName.length - 1];
        if (directName !== '') {
            newTAb.title = directName;
        }
        $scope.favoritos = [];
        var ftpsFavorites = localStorageService.get('ftpsFavorites');
        if (ftpsFavorites !== null) {
            $scope.favoritos = ftpsFavorites;
            $scope.favoritos.push(newTAb)
            localStorageService.add('ftpsFavorites', $scope.favoritos);
        } else {
            $scope.favoritos.push(newTAb)
            localStorageService.add('ftpsFavorites', $scope.favoritos);
        }
    }
    $scope.selectedIndex = $scope.tabs.length - 1;
    $scope.$watch('selectedIndex', function(current, old) {
        previous = selected;
        selected = $scope.tabs[current];
//        if (typeof selected != 'undefined') {
//            if (old + 1 && (old != current))
//                $log.debug('Goodbye ' + previous.title + '!');
//            if (current + 1)
//                $log.debug('Hello ' + selected.title + '!');
//        }
        localStorageService.add('ftpsfolders', $scope.tabs);
        if (typeof selected != 'undefined') {
            $scope.selectedItem = {_id: selected._id, url: selected.url};
            $scope.showBreadcrumb()
        }
    });
    var formatTab = function(data) {
        return {title: data.name,
            url: data.dirscan,
            type: data.type,
            uri: data.uri,
            disabled: false,
            _id: data._id,
            files: [],
            viewMode: 1,
            paso: 40,
            init: true,
            nave: {
                current: 0,
                list: []
            },
            query: {
                order: 'name',
                limit: 15,
                page: 1
            }
        }
    }
    $rootScope.$on('openTab', function(event, data) {
        var found = foundTab(data._id);
        if (found) {
            $scope.selectedIndex = found;
        } else {
            $scope.tabs.push(formatTab(data));
        }
    });
    var foundTab = function(tab) {
        for (var i in $scope.tabs) {
            if ($scope.tabs[i]._id === tab) {
                return i;
            }
        }
        return false;
    }
    $scope.decodeName = function(str) {
        return decodeURIComponent(str);
    }
    $scope.addTab = function(title, view) {
        view = view || title + " Content View";
        $scope.tabs.push({title: title, content: view, disabled: false});
    };
    $scope.removeTab = function(id) {
        var index = foundTab(id);
        $scope.tabs.splice(index, 1);
        localStorageService.add('ftpsfolders', $scope.tabs);
    };
    var fileFolder = function(obj) {
        return typeof obj.extname === 'undefined';
    }
    var getTipeIconItem = function(item) {
        var retorn = fileFolder(item) ? 'folder' : 'file';
        return retorn;
    }
    $scope.openInNewTab = function() {
        var newTAb = angular.copy($scope.tabs[$scope.selectedIndex]);
        $scope.tabs.push(newTAb);
    }
    $scope.reloadDirect = function() {
        $scope.loadFiles($scope.tabs[$scope.selectedIndex]);
    }
    var addUrlVisited = function(tab) {
        var index = tab.nave.list.indexOf(tab.url);
        if (index === -1) {
            if (tab.nave.list.length > 10) {
                // eliminar primera posicion
                tab.nave.list.splice(0, 1);
            }
            tab.nave.list.push(tab.url);
            tab.nave.current = tab.nave.list.length - 1;
        }
        $scope.addUrlVisited(angular.copy($scope.selectedItem));
    }
    $scope.loadFiles = function(tab, current) {
        var current = current || false;
        var o = angular.copy(tab);
        $scope.selectedItem = {_id: o._id, url: o.url};
        $scope.showBreadcrumb();
        if (!current) {
            addUrlVisited(tab);
        }
        var baseURl = tab.type === 'ftp' ? 'ftp://' : '';
        baseURl = baseURl + tab.uri;
        $scope.promise = $timeout(function() {
            Proveedores.getFiles({directory: tab.url, ftp: tab._id}, function(res) {
                var files = new Array();
                var post = 0;
                for (var i in res) {
                    var item = {
                        icon: getTipeIconItem(res[i]),
                        file: res[i]
                    };
                    item.name = $scope.decodeURIComponent(res[i].name);
                    item.base_url = baseURl + res[i].directory
                    item.ico = $scope.icons[item.icon].desactive,
                            files.push(item);
                }
                tab.files = files;
                tab.query.page = 1;
            }, function(error) {
                console.log(error);
            });
        });
        localStorageService.add('ftpsfolders', $scope.tabs);
    }
    $scope.convertFecha = function(d) {
        return new Date(d);
    }
    $scope.findFolder = function(node, tab) {
        // determinar si es un archivo descarga
        var conector = '/';
        if (node.directory[node.directory.length - 1] === '/') {
            conector = '';
        }
        var newURl = node.directory + conector + node.name;
        if (!fileFolder(node)) {
            var url = tab.type === 'ftp' ? 'ftp://' : '';
            OpenInNewTab(url + tab.uri + newURl);
        } else {
            tab.url = newURl;
            $scope.loadFiles(tab);
            getSizeFolder(tab._id, node);
        }
    }
    var getSizeFolder = function(idtab, file) {
        if (typeof file.size === 'undefined') {
            Proveedores.getSizeFolder(file, function(res) {
                console.log(res);
            }, function(error) {
                console.log(error);
            });
        }
    };
    var OpenInNewTab = function(url) {
        var win = window.open(url, '_blank');
        win.focus();
    }
    $scope.history = function(post) {
        var newPost = $scope.tabs[$scope.selectedIndex].nave.current + post;
        if (newPost > -1 && newPost < $scope.tabs[$scope.selectedIndex].nave.list.length) {
            $scope.tabs[$scope.selectedIndex].nave.current = newPost;
            $scope.tabs[$scope.selectedIndex].url = $scope.tabs[$scope.selectedIndex].nave.list[newPost];
            $scope.loadFiles($scope.tabs[$scope.selectedIndex], true);
        }
    }
    $scope.IrArriba = function() {
        var url = angular.copy($scope.tabs[$scope.selectedIndex].url);
        if (typeof url.split('/') !== 'undefined') {
            url = url.split('/');
            if (url.length >= 1) {
                url.splice(url.length - 1, 1);
                if (url.length > 0) {
                    var newUrl = "";
                    if (url.length === 1 && url[0] === '') {
                        newUrl = "/";
                    } else {
                        newUrl = url.join('/');
                    }
                    $scope.tabs[$scope.selectedIndex].url = newUrl;
                    $scope.selectedItem = {_id: $scope.tabs[$scope.selectedIndex]._id, url: $scope.tabs[$scope.selectedIndex].url};
                    $scope.loadFiles($scope.tabs[$scope.selectedIndex], true);
                }
            }
        }
    }
    $scope.moveTo = function(item) {
        var newTab = angular.copy(formatTab($rootScope.ProveedoresList[item._id]));
        newTab.url = item.url;
        //indicar de nuevo en false para evitar recursividad 
        selectt = false;
        // toma el modo anterior de vista de tab
        newTab.viewMode = $scope.tabs[$scope.selectedIndex].viewMode;
        $scope.tabs[$scope.selectedIndex] = angular.copy(newTab);
        $scope.loadFiles($scope.tabs[$scope.selectedIndex], true);
    }
    function selectedItemChange(item) {
        if (typeof item != 'undefined') {
            if (selectt) {
                $scope.moveTo(item);
            }
        }
    }
    $scope.FileSizeConvert = function(size) {
        var retorn = parseFloat(size / 1024 / 1024).toFixed(2);
        var s = " MB";
        if (retorn >= 1024) {
            // convertir a gigas
            retorn = parseFloat(retorn / 1024).toFixed(2);
            s = " GB";
        }
        return retorn == 'NaN' ? 'none' : retorn + s;
    }

    $scope.viewModeSee = function() {
        if (typeof $scope.tabs[$scope.selectedIndex] !== 'undefined') {
            if (typeof $scope.tabs[$scope.selectedIndex].viewMode !== 'undefined') {
                return  $scope.tabs[$scope.selectedIndex].viewMode === 1 ? 0 : 1;
            }
        }
        return 0;
    }
    // list of `state` value/display objects
    var foundTb = function(id, url) {
        for (var i in $scope.states) {
            if ($scope.states[i]._id === id && $scope.states[i].url === url) {
                return true;
            }
        }
        return false;
    }
    $scope.addUrlVisited = function(tab) {
        if (!foundTb(tab._id, tab.url)) {
            $scope.states.push(tab);
            if ($scope.states.length > 20) {
                // eliminar primera posicion
                $scope.states.splice(0, 1);
            }
            localStorageService.add('ftpsUrlvisited', $scope.states);
        }
    }

    $scope.foundUrlVisited = function(query, max) {
        var retorn = new Array();
        var idFtp = $scope.tabs[$scope.selectedIndex]._id;
        for (var i in $scope.states) {
            if (query !== '/' && $scope.states[i].url.toLowerCase().match(query.toLowerCase())) {
                if (retorn.length <= max) {
                    retorn.push($scope.states[i]);
                } else {
                    return retorn;
                }
            }
        }
        return retorn;
    }
    $scope.querySearch = querySearch;
    $scope.selectedItemChange = selectedItemChange;
    $scope.searchTextChange = searchTextChange;
    $scope.newState = newState;
    function newState(state) {
        alert("Sorry! You'll need to create a Constituion for " + state + " first!");
    }
    // ******************************
    // Internal methods
    // ******************************
    /**
     * Search for states... use $timeout to simulate
     * remote dataservice call.
     */
    function querySearch(query) {
        var results = query ? $scope.foundUrlVisited(query, 10) : $scope.states,
                deferred;
        if ($scope.simulateQuery) {
            deferred = $q.defer();
            $timeout(function() {
                deferred.resolve(results);
            }, Math.random() * 1000, false);
            return deferred.promise;
        } else {
            return results;
        }
    }
    var selectt = false;
    function searchTextChange(text) {
        $log.info('Text changed to ' + text);
        selectt = true;
    }

}
