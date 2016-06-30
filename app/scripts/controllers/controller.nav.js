myApp.controller('NavCtrl', function ($scope, $http, Data, $q, $timeout, $log) {
  $log.debug("NavCtrl instantiated");

  this.closeWindow = function () {
    window.close();
  };

  return this;
});
