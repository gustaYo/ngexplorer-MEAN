'use strict';

describe('Controller: TablefilterCtrl', function () {

  // load the controller's module
  beforeEach(module('ngExplorerApp'));

  var TablefilterCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    TablefilterCtrl = $controller('TablefilterCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(TablefilterCtrl.awesomeThings.length).toBe(3);
  });
});
