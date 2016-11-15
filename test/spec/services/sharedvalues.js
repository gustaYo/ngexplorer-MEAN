'use strict';

describe('Service: sharedvalues', function () {

  // load the service's module
  beforeEach(module('ngExplorerApp'));

  // instantiate service
  var sharedvalues;
  beforeEach(inject(function (_sharedvalues_) {
    sharedvalues = _sharedvalues_;
  }));

  it('should do something', function () {
    expect(!!sharedvalues).toBe(true);
  });

});
