'use strict';

describe('Service: proveedores', function () {

  // load the service's module
  beforeEach(module('ngExplorerApp'));

  // instantiate service
  var proveedores;
  beforeEach(inject(function (_proveedores_) {
    proveedores = _proveedores_;
  }));

  it('should do something', function () {
    expect(!!proveedores).toBe(true);
  });

});
