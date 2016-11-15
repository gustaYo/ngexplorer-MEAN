'use strict';

describe('Controller: LoguinCtrl', function () {

  // load the controller's module
  beforeEach(module('ngExplorerApp'));

  var LoguinCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    LoguinCtrl = $controller('LoguinCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(LoguinCtrl.awesomeThings.length).toBe(3);
  });
});
