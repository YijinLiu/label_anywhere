goog.provide('label.App');
goog.provide('label.Controller');

/**
 * @param {!angular.Scope} $scope
 * @param {!angular.$location} $location
 * @constructor
 * @struct
 * @ngInject
 */
label.Controller = function($scope, $location) {
};

/**
 * @param {!angular.$locationProvider} $locationProvider The Angular locationProvider service.
 * @ngInject
 */
label.Controller.config = function($locationProvider) {
    $locationProvider.html5Mode({enabled: true, requireBase: false}).hashPrefix('!');
};

label.App = angular.module('labelApp', ['ngRoute', 'ui.bootstrap']);
label.App.controller('aboutCtrl', label.Controller).config(label.Controller.config);

