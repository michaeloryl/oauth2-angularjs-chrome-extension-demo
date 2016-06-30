myApp.factory('Broadcast', function ($rootScope) {
  var broadcast = {send: send};

  function send(msg, data) {
    $rootScope.$broadcast(msg, data);
  }

  // $scope.$on('login', function(event, args){ ...do something... });

  return broadcast;
});


