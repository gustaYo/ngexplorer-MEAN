'use strict';

describe('Controller: EstadisticasCtrl', function () {

  // load the controller's module
  beforeEach(module('ngExplorerApp'));

  var EstadisticasCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    EstadisticasCtrl = $controller('EstadisticasCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(EstadisticasCtrl.awesomeThings.length).toBe(3);
  });
});
