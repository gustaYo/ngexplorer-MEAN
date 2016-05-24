'use strict';

/**
 * @ngdoc service
 * @name ngExplorerApp.sharedvalues
 * @description
 * # sharedvalues
 * Factory in the ngExplorerApp.
 */
angular.module('ngExplorerApp')
        .factory('sharedValues', function() {
            var model = {
                value: {}
            };
            // public API
            return {
                getValue: function(value) {
                    if (typeof model[value] == 'undefined') {
                        model[value] = {}
                    }
                    return model[value];
                },
                updateValue: function(value, data) {
                    model[value] = data;
                    return model[value];
                }
            };
        })
