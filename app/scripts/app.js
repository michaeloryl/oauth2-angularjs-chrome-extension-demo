/**
 * Created with IntelliJ IDEA.
 * User: mfo
 * Date: 8/6/14
 * Time: 7:26 PM
 */
var myApp = angular.module('myApp', ['LocalStorageModule', 'ngRoute']);

myApp.config(function ($routeProvider) {
  $routeProvider
      .when('/options', {templateUrl: 'options.html', controller: 'OptionsCtrl', controllerAs: 'main', authenticate: false})
      .when('/public', {templateUrl: 'view.public.html', controller: 'PublicCtrl', controllerAs: 'main', authenticate: false})
      .otherwise({
        redirectTo: '/public'
      });
});

myApp.constant('Chrome', chrome); // not really necessary, but makes the 'chrome' object injectable