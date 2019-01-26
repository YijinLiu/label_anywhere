goog.provide('label.App');

goog.require('goog.reflect');
goog.require('goog.string.format');

/**
 * @constructor
 * @struct
 * @ngInject
 */
label.Controller = function() {
    Split(['#list', '#image'], {sizes: [25, 75], minSize: 100, gutterSize: 6});
};

/**
 * @param {!angular.$locationProvider} $locationProvider The Angular locationProvider service.
 * @ngInject
 */
label.Controller.config = function($locationProvider) {
    $locationProvider.html5Mode({enabled: true, requireBase: false}).hashPrefix('!');
};

label.App = angular.module('labelApp', ['ngRoute', 'ui.bootstrap']);
label.App.controller('labelCtrl', label.Controller).config(label.Controller.config);

/**
 * @param {!angular.Scope} $scope
 * @param {!angular.$route} $route
 * @param {!angular.$http} $http
 * @param {!angular.JQLite} $element
 * @constructor
 * @struct
 * @ngInject
 */
label.ImgDirController = function($scope, $route, $http, $element) {
    this.scope_ = $scope;
    this.route_ = $route;
    this.http_ = $http;
    this.parent_ = $scope['parent'];
    this.name_ = $scope['name'];
    /** @type {FolderContent} */
    this.content_;
    this.reloading_ = false;
    if (!$scope['isCollapsed']) this.reload_();
};

label.ImgDirController.prototype.checkReload_ = function() {
    if (!this.content_) this.reload_();
};

label.ImgDirController.prototype.reload_ = function() {
    this.reloading_ = true;
    const url = goog.string.format('/list_dir?parent=%s&name=%s',
                                   encodeURIComponent(this.parent_),
                                   encodeURIComponent(this.name_));
    this.http_.get(url).then(this.reloadDone_.bind(this), this.reloadFailed_.bind(this));
    this.route_.reload();
};

/**
 * @param {angular.$http.Response} resp
 */
label.ImgDirController.prototype.reloadDone_ = function(resp) {
    this.content_ = resp.data;
    this.reloading_ = false;
    this.scope_['isCollapsed'] = false;
    this.route_.reload();
};

/**
 * @param {angular.$http.Response} resp
 */
label.ImgDirController.prototype.reloadFailed_ = function(resp) {
    this.reloading_ = false;
    this.route_.reload();
    alert('Failed to list "' + this.name_ + '"!');
};

/**
 * @param {!string} parent
 * @param {!string} name
 */
label.ImgDirController.prototype.open_ = function(parent, name) {
};

label.App.directive('imgDir', function() {
    /** @type {!label.ImgDirController} */
    let ctl;

    const checkReload = goog.reflect.objectProperty('checkReload_', ctl);
    const content = goog.reflect.objectProperty('content_', ctl);
    const open = goog.reflect.objectProperty('open_', ctl);
    const reload = goog.reflect.objectProperty('reload_', ctl);
    const reloading = goog.reflect.objectProperty('reloading_', ctl);

    const tpl = `
<a role="button" class="img-dir-title btn btn-sm" ng-click="isCollapsed = !isCollapsed">
    <i class="fa" ng-class="{'fa-caret-right': isCollapsed, 'fa-caret-down': !isCollapsed}">
    </i>
</a>{{name}}
<a role="button" class="img-dir-title btn btn-sm" ng-click="c.${reload}()"
                 ng-disabled="c.${reloading}">
    <i class="fa fa-refresh fa-fw" ng-class="{'fa-spin' : c.${reloading}}"></i>
</a>
<div uib-collapse="isCollapsed" expanding="c.${checkReload}()">
    <div class="dependent-item" ng-repeat="item in c.${content}.items">
        <img-dir parent="c.${content}.path" name="item.name" is-collapsed="true" ng-if="item.isDir">
        </img-dir>
        <a href="#" ng-click="c.${open}(c.${content}.path, item.name)" ng-if="!item.isDir">
            {{item.name}}
        </a>
    </div>
<div>`;

    return {
        restrict: 'E',
        scope: {
            'parent': '<',
            'name': '<',
            'isCollapsed': '=',
        },
        template: tpl,
        controller: label.ImgDirController,
        controllerAs: 'c'
    };
});

