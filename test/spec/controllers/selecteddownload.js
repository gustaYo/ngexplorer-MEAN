'use strict';

describe('Controller: SelecteddownloadCtrl', function () {

  // load the controller's module
  beforeEach(module('ngExplorerApp'));

  var SelecteddownloadCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    SelecteddownloadCtrl = $controller('SelecteddownloadCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(SelecteddownloadCtrl.awesomeThings.length).toBe(3);
  });
});
