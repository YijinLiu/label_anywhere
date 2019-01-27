goog.provide('label.App');

goog.require('goog.labs.userAgent.device');
goog.require('goog.reflect');
goog.require('goog.string.format');

goog.require('draggable');

// NOTE: Due to security reasons, this doesn't work.
if (goog.labs.userAgent.device.isMobile() || goog.labs.userAgent.device.isTablet()) {
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape');
    } else {
        const lock = screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation;
        if (lock) {
            lock('landscape');
        } else {
            console.log('screen.lockOrientation is not supported on this device!');
        }
    }
}

/**
 * @constructor
 * @struct
 * @ngInject
 */
label.Controller = function() {
    this.splitterEl_ = /** @type {!Element} */ (document.querySelector('.splitter'));
    this.leftEl_ = document.querySelector('#list');
    this.rightEl_ = document.querySelector('#image');
    this.hammer_ = new Hammer(this.splitterEl_, {'touchAction': 'none'});
    this.hammer_.get('swipe').set({'enable': false});
    this.hammer_.get('tap').set({'enable': false});
    this.hammer_.get('doubletap').set({'enable': false});
    this.hammer_.get('press').set({'enable': false});
    this.hammer_.get('rotate').set({'enable': false});
    this.hammer_.get('pinch').set({'enable': false});
    this.hammer_.get('pan').set({'enable': true});
    this.hammer_.on('pan', this.dragSplitter_.bind(this));
    this.isDragging_ = false;
    this.leftWidth_ = -1;
    this.rightWidth_ = -1;
};

/** @param {Hammer.Event} evt */
label.Controller.prototype.dragSplitter_ = function(evt) {
    if (!this.isDragging_) {
        this.isDragging_ = true;
        this.leftWidth_ = this.leftEl_.offsetWidth;
        this.rightWidth_ = this.rightEl_.offsetWidth;
    }
    const leftWidth = this.leftWidth_ + evt.deltaX;
    const rightWidth = this.rightWidth_ - evt.deltaX;
    if (leftWidth >= 100 && rightWidth >= 150) {
        this.leftEl_.style.width = leftWidth + 'px';
        this.rightEl_.style.width = rightWidth + 'px';
    }
    if (evt.isFinal) {
        this.isDragging_ = false;
        this.leftWidth_ = -1;
        this.rightWidth_ = -1;
    }
};

/**
 * @param {!angular.$locationProvider} $locationProvider The Angular locationProvider service.
 * @ngInject
 */
label.Controller.config = function($locationProvider) {
    $locationProvider.html5Mode({enabled: true, requireBase: false}).hashPrefix('!');
};

label.App = angular.module('labelApp', ['ngRoute', 'ngSanitize', 'ui.bootstrap']);
label.App.controller('labelCtrl', label.Controller).config(label.Controller.config);

/**
 * @param {!angular.Scope} $scope
 * @param {!angular.$route} $route
 * @param {!angular.$http} $http
 * @constructor
 * @struct
 * @ngInject
 */
label.ImgDirController = function($scope, $route, $http) {
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
    const url = goog.string.format('list_dir?parent=%s&name=%s',
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
    alert(goog.string.format('Failed to list "%s"!', this.name_));
};

/**
 * @type {label.LabelImgController}
 */
label.labelImg_;

/**
 * @param {!string} name
 */
label.ImgDirController.prototype.open_ = function(name) {
    label.labelImg_.load_(this.content_.path, name);
};

/**
 * @param {!string} name
 */
label.ImgDirController.prototype.del_ = function(name) {
    const url = goog.string.format('del_img?parent=%s&name=%s',
                                   encodeURIComponent(this.content_.path),
                                   encodeURIComponent(name));
    this.http_.get(url).then(this.delDone_.bind(this, name), this.delFailed_.bind(this, name));
};

/**
 * @param {!string} name
 */
label.ImgDirController.prototype.delDone_ = function(name) {
    for (let i = 0; i < this.content_.items.length; i++) {
        if (this.content_.items[i].name == name) {
            this.content_.items.splice(i, 1);
            this.route_.reload();
            break;
        }
    }
};

/**
 * @param {!string} name
 */
label.ImgDirController.prototype.delFailed_ = function(name) {
    alert(goog.string.format('Failed to delete "%s"!', name));
};

label.App.directive('imgDir', function() {
    /** @type {!label.ImgDirController} */
    let ctl;

    const checkReload = goog.reflect.objectProperty('checkReload_', ctl);
    const content = goog.reflect.objectProperty('content_', ctl);
    const del = goog.reflect.objectProperty('del_', ctl);
    const open = goog.reflect.objectProperty('open_', ctl);
    const reload = goog.reflect.objectProperty('reload_', ctl);
    const reloading = goog.reflect.objectProperty('reloading_', ctl);

    const tpl = `
<span class="img-dir-title">
    <a role="button" class="btn btn-sm" ng-click="isCollapsed = !isCollapsed">
        <i class="fa" ng-class="{'fa-caret-right': isCollapsed, 'fa-caret-down': !isCollapsed}">
        </i>
    </a><span class="name">{{name}}</span>
    <a role="button" class="btn btn-sm" ng-click="c.${reload}()"
                     ng-disabled="c.${reloading}">
        <i class="fa fa-refresh fa-fw" ng-class="{'fa-spin' : c.${reloading}}"></i>
    </a>
</span>
<div uib-collapse="isCollapsed" expanding="c.${checkReload}()">
    <div class="dependent-item" ng-repeat="item in c.${content}.items">
        <img-dir parent="c.${content}.path" name="item.name" is-collapsed="true" ng-if="item.isDir">
        </img-dir>
        <span class="img-dir-title">
            <a href="#" ng-click="c.${open}(item.name)" ng-if="!item.isDir"
                        ng-attr-title="{{item.objects}}" class="name"
                        ng-class="{'annotated' : item.objects && item.objects.length > 0}">
                {{item.name}}
            </a>
            <a role="button" class="btn btn-sm" ng-click="c.${del}(item.name)" ng-if="!item.isDir">
                <i class="fa fa-trash"></i>
            </a>
        </span>
    </div>
</div>`;

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

/**
 * @param {!angular.Scope} $scope
 * @param {!angular.$route} $route
 * @param {!angular.$http} $http
 * @param {!angular.JQLite} $element
 * @constructor
 * @struct
 * @ngInject
 */
label.LabelImgController = function($scope, $route, $http, $element) {
    this.scope_ = $scope;
    this.route_ = $route;
    this.http_ = $http;
    const ctnEl = $element[0];
    this.canZoomIn_ = false;
    this.canZoomOut_ = false;
    this.width_ = Math.floor(ctnEl.clientWidth);
    this.height_ = Math.floor(ctnEl.clientHeight);
    this.canvas_ = new fabric.Canvas(ctnEl.querySelector('canvas'));
    this.canvas_.on('mouse:wheel', this.onWheel_.bind(this));
    this.parent_ = '';
    this.name_ = '';
    /** @type {fabric.Image} */
    this.img_;
    /** @type {Annotation} */
    this.ann_;
    this.scale_ = 1;
    label.labelImg_ = this;
};

/**
 * @param {!fabric.Event} opt
 */
label.LabelImgController.prototype.onWheel_ = function(opt) {
    const evt = /** @type {MouseEvent} */ (opt.e)
    evt.preventDefault();
    evt.stopPropagation();
    if (evt.deltaY) {
        if (evt.deltaY > 20) {
            this.zoomOut_(0.9);
        } else if (evt.deltaY < -20) {
            this.zoomIn_(1.1);
        }
    }
};

/**
 * @param {!string} parent
 * @param {!string} name
 */
label.LabelImgController.prototype.load_ = function(parent, name) {
    this.canvas_.clear();
    this.img_ = null;
    this.ann_ = null;
    this.parent_ = parent;
    this.name_ = name;
    const url = goog.string.format(
        'get_img?parent=%s&name=%s', encodeURIComponent(parent), encodeURIComponent(name));
    fabric.Image.fromURL(url, this.onLoad_.bind(this));
};

/**
 * @param {!fabric.Image} img
 */
label.LabelImgController.prototype.onLoad_ = function(img) {
    this.img_ = img;
    let scale = 1;
    if (img.width > this.width_) scale = this.width_ / img.width;
    if (img.height * scale > this.height_) scale = this.height_ / img.height;
    this.scaleCanvas_(scale);
    const url = goog.string.format('get_ann?parent=%s&name=%s', encodeURIComponent(this.parent_),
                                   encodeURIComponent(this.name_));
    this.http_.get(url).then(this.gotAnn_.bind(this), this.getAnnFailed_.bind(this));
};

/**
 * @param {angular.$http.Response} resp
 */
label.LabelImgController.prototype.gotAnn_ = function(resp) {
    this.ann_ = resp.data;
    if (!this.ann_.objects) this.ann_.objects = [];
    this.renderAnn_();
};

label.LabelImgController.prototype.renderAnn_ = function() {
    if (!this.ann_) return;
    for (let i = 0; i < this.ann_.objects.length; i++) {
        const obj = this.ann_.objects[i];
        const rect = new fabric.Rect({
            left: Math.floor(obj.bndbox.xmin * this.scale_),
            top: Math.floor(obj.bndbox.ymin * this.scale_),
            width: Math.floor((obj.bndbox.xmax - obj.bndbox.xmin) * this.scale_),
            height: Math.floor((obj.bndbox.ymax - obj.bndbox.ymin) * this.scale_)
        });
        rect.fill = 'beige';
        rect.opacity = 0.4;
        rect.hasBorders = false;
        rect.hasRotatingPoint = false;
        rect.stroke = 'bisque';
        rect.strokeWidth = 2;
        const text = new fabric.Text(obj.name, {
            left: rect.left + 3,
            top: rect.top + 3,
            fontSize: 20,
            fontWeight: 'bold',
            shadow: 'rgba(0,0,0,0.3) 5px 5px 5px'
        });
        text.fill = 'palegreen';
        text.hasBorders = false;
        text.hasControls = false;
        text.selectable = false;
        this.canvas_.add(rect, text);
    }
    this.canvas_.renderAll();
};

/**
 * @param {angular.$http.Response} resp
 */
label.LabelImgController.prototype.getAnnFailed_ = function(resp) {
    alert(goog.string.format('failed to load annotation for "%s"!', this.name_));
};

/**
 * @param {!number} scale
 */
label.LabelImgController.prototype.scaleCanvas_ = function(scale) {
    this.scale_ = scale;
    this.canvas_.clear();
    this.canvas_.setWidth(Math.floor(this.img_.width * scale));
    this.canvas_.setHeight(Math.floor(this.img_.height * scale));
    this.canvas_.setBackgroundImage(
        this.img_, this.canvas_.renderAll.bind(this.canvas_),
        { originX: 'left',
          originY: 'top',
          scaleX: scale,
          scaleY: scale });
    this.renderAnn_();
    this.updateZooming_();
};

label.LabelImgController.prototype.updateZooming_ = function() {
    this.canZoomIn_ = !!this.img_ && this.canvas_.width < this.width_ &&
        this.canvas_.height < this.height_;
    this.canZoomOut_ = !!this.img_ && this.canvas_.width > Math.min(this.img_.width, 300) &&
        this.canvas_.height > Math.min(this.img_.height, 300);
    this.route_.reload();
};

/**
 * @param {number} times
 */
label.LabelImgController.prototype.zoomIn_ = function(times) {
    if (!this.canZoomIn_) return;
    let scale = this.scale_ * times;
    if (this.img_.width * scale > this.width_) scale = this.width_ / this.img_.width;
    if (this.img_.width * scale > this.height_) scale = this.height_ / this.img_.height;
    this.scaleCanvas_(scale);
};

/**
 * @param {number} times
 */
label.LabelImgController.prototype.zoomOut_ = function(times) {
    if (!this.canZoomOut_) return;
    let scale = this.scale_ * times;
    const minWidth = Math.min(this.img_.width, 300);
    if (this.img_.width * scale < minWidth) scale = minWidth / this.img_.width;
    const minHeight = Math.min(this.img_.height, 300);
    if (this.img_.height * scale < minHeight) scale = minHeight / this.img_.height;
    this.scaleCanvas_(scale);
};

label.App.directive('labelImg', function() {
    /** @type {!label.LabelImgController} */
    let ctl;

    const tpl = `
<canvas></canvas>`;

    return {
        restrict: 'E',
        scope: {},
        template: tpl,
        controller: label.LabelImgController,
        controllerAs: 'c'
    };
});

/**
 * @param {!angular.JQLite} $element
 * @constructor
 * @struct
 * @ngInject
 */
label.ToolbarController = function($element) {
    draggable.makeDraggable($element[0]);
    this.canZoomIn_ = function() {
        return label.labelImg_ && label.labelImg_.canZoomIn_;
    };
    this.canZoomOut_ = function() {
        return label.labelImg_ && label.labelImg_.canZoomOut_;
    };
    this.zoomIn_ = function(scale) {
        label.labelImg_.zoomIn_(scale);
    };
    this.zoomOut_ = function(scale) {
        label.labelImg_.zoomOut_(scale);
    };
};

label.App.directive('labelImgTb', function() {
    /** @type {!label.ToolbarController} */
    let ctl;

    const canZoomIn = goog.reflect.objectProperty('canZoomIn_', ctl);
    const canZoomOut = goog.reflect.objectProperty('canZoomOut_', ctl);
    const zoomIn = goog.reflect.objectProperty('zoomIn_', ctl);
    const zoomOut = goog.reflect.objectProperty('zoomOut_', ctl);

    const tpl = `
<a role="button" class="btn btn-sm" ng-click="c.${zoomIn}(1.2)" ng-disabled="!c.${canZoomIn}()">
    <i class="fa fa-search-plus"></i>
</a>
<a role="button" class="btn btn-sm" ng-click="c.${zoomOut}(0.8)" ng-disabled="!c.${canZoomOut}()">
    <i class="fa fa-search-minus"></i>
</a>`;

    return {
        restrict: 'E',
        scope: {},
        template: tpl,
        controller: label.ToolbarController,
        controllerAs: 'c',
    };
});
