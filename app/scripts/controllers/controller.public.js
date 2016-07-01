myApp.controller('PublicCtrl', function ($scope, $http, Data, $q, $timeout, $log, Chrome, Auth, $route) {
  var controller = $route.current.controller;
  $log.debug(controller, "instantiated");
  $scope.userName = null;
  $scope.authenticated = null;

  $scope.$on('userInfo', function (event, args) {
    $log.debug(controller, 'received event:', event, args);
    $timeout(function () { // do this to make sure updates are noticed
      $scope.userName = Auth.getUserName();
    }, 0);
  });

  $scope.$on('login', function (event, args) {
    $log.debug(controller, 'received event:', event, args);
    $timeout(function () { // do this to make sure updates are noticed
      $scope.authenticated = args.authenticated;
      if (!$scope.authenticated) {
        $scope.userName = null;
      }
    }, 0);
  });

  $scope.$on('warning', function (event, args) {
    $log.debug(controller, 'received event:', event, args);
    alert("Timeout in " + args.remaining + " seconds");
  });

  this.isAuthenticated = Auth.isAuthenticated;

  this.doLogin = Auth.doLogin;

  this.doLogout = Auth.doLogout;

  return this;
});