goog.provide('label.App');

goog.require('goog.events.EventType');
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
 * @param {!angular.Scope} $scope
 * @constructor
 * @struct
 * @ngInject
 */
label.Controller = function($scope) {
    this.leftEl_ = document.querySelector('#list');
    this.rightEl_ = document.querySelector('#image');

    this.splitterEl_ = /** @type {!Element} */ (document.querySelector('.splitter'));
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

    window.addEventListener(goog.events.EventType.KEYDOWN, this.onKeyDown_.bind(this));

    /** @type {!Array<!label.ImgDirController>} */
    this.imgDirCtls_ = [];
    /** @type {label.ImgDirController} */
    this.curImgDirCtl_;
    this.curImgIndex_ = -1;
    /** @type {Element} */
    this.curImgEl_;
    $scope['imgDirCreated'] = this.imgDirCreated_.bind(this);
    /** @type {label.LabelImgController} */
    this.labelImgCtl_;
    $scope['labelImgCreated'] = this.labelImgCreated_.bind(this);
};

/**
 * @param {!label.ImgDirController} ctl
 */
label.Controller.prototype.imgDirCreated_ = function(ctl) {
    console.log('img-dir(%s) created.', ctl.name_);
    this.imgDirCtls_.push(ctl);
    const me = this;
    ctl.openImgCb_ = this.openImg_.bind(this);
};

/**
 * @param {!Element} el
 */
function scrollIntoViewIfNeeded(el) {
    const rect = el.getBoundingClientRect();
    if (rect.top < 0 ||
        rect.bottom > (window.innerHeight || document.documentElement.clientHeight)) {
        el.scrollIntoView();
    }
}

/**
 * @param {!label.ImgDirController} ctl
 * @param {!number} i
 * @param {!Element} el
 */
label.Controller.prototype.openImg_ = function(ctl, i, el) {
    const item = ctl.content_.items[i];
    if (item.isDir) return;
    this.curImgDirCtl_ = ctl;
    this.curImgIndex_ = i;
    if (this.curImgEl_) this.curImgEl_.classList.remove('editing');
    this.curImgEl_ = el;
    el.classList.add('editing');
    scrollIntoViewIfNeeded(el);
    this.labelImgCtl_.open(ctl.content_.path, item);
};

label.Controller.prototype.nextImg_ = function() {
    if (!this.curImgDirCtl_) return;
    const i = this.curImgIndex_ + 1;
    if (i >= this.curImgDirCtl_.content_.items.length) return;
    this.openImg_(this.curImgDirCtl_, i, this.curImgDirCtl_.nthItemEl_(i));
};

label.Controller.prototype.prevImg_ = function() {
    if (!this.curImgDirCtl_) return;
    const i = this.curImgIndex_ - 1;
    if (i < 0) return;
    this.openImg_(this.curImgDirCtl_, i, this.curImgDirCtl_.nthItemEl_(i));
};

/**
 * @param {!label.LabelImgController} ctl
 */
label.Controller.prototype.labelImgCreated_ = function(ctl) {
    console.log('label-img created.');
    this.labelImgCtl_ = ctl;
};

/**
 * @param {Event} evt
 */
label.Controller.prototype.onKeyDown_ = function(evt) {
    const ke = /** @type {KeyboardEvent} */ (evt);
    console.log(ke.key);
    if (ke.key == 'PageDown') {
        this.nextImg_();
        evt.preventDefault();
        evt.stopPropagation();
    } else if (ke.key == 'PageUp') {
        this.prevImg_();
        evt.preventDefault();
        evt.stopPropagation();
    } else if (ke.key == 'Delete') {
        if (this.labelImgCtl_.activeObj_) {
            this.labelImgCtl_.delObj_(this.labelImgCtl_.activeObj_);
            evt.preventDefault();
            evt.stopPropagation();
        }
    } else if (ke.key == 'ArrowUp') {
        if (this.labelImgCtl_.activeObj_) {
            if (ke.ctrlKey) {
                this.labelImgCtl_.moveObj_(this.labelImgCtl_.activeObj_, 0, -5, 0, 0);
            } else if (ke.shiftKey) {
                this.labelImgCtl_.moveObj_(this.labelImgCtl_.activeObj_, 0, 0, 0, -5);
            } else {
                this.labelImgCtl_.moveObj_(this.labelImgCtl_.activeObj_, 0, -5, 0, -5);
            }
            evt.preventDefault();
            evt.stopPropagation();
        }
    } else if (ke.key == 'ArrowDown') {
        if (this.labelImgCtl_.activeObj_) {
            if (ke.ctrlKey) {
                this.labelImgCtl_.moveObj_(this.labelImgCtl_.activeObj_, 0, 0, 0, 5);
            } else if (ke.shiftKey) {
                this.labelImgCtl_.moveObj_(this.labelImgCtl_.activeObj_, 0, 5, 0, 0);
            } else {
                this.labelImgCtl_.moveObj_(this.labelImgCtl_.activeObj_, 0, 5, 0, 5);
            }
            evt.preventDefault();
            evt.stopPropagation();
        }
    } else if (ke.key == 'ArrowLeft') {
        if (this.labelImgCtl_.activeObj_) {
            if (ke.ctrlKey) {
                this.labelImgCtl_.moveObj_(this.labelImgCtl_.activeObj_, -5, 0, 0, 0);
            } else if (ke.shiftKey) {
                this.labelImgCtl_.moveObj_(this.labelImgCtl_.activeObj_, 0, 0, -5, 0);
            } else {
                this.labelImgCtl_.moveObj_(this.labelImgCtl_.activeObj_, -5, 0, -5, 0);
            }
            evt.preventDefault();
            evt.stopPropagation();
        }
    } else if (ke.key == 'ArrowRight') {
        if (this.labelImgCtl_.activeObj_) {
            if (ke.ctrlKey) {
                this.labelImgCtl_.moveObj_(this.labelImgCtl_.activeObj_, 0, 0, 5, 0);
            } else if (ke.shiftKey) {
                this.labelImgCtl_.moveObj_(this.labelImgCtl_.activeObj_, 5, 0, 0, 0);
            } else {
                this.labelImgCtl_.moveObj_(this.labelImgCtl_.activeObj_, 5, 0, 5, 0);
            }
            evt.preventDefault();
            evt.stopPropagation();
        }
    }
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
 * @param {!angular.JQLite} $element
 * @constructor
 * @struct
 * @ngInject
 */
label.ImgDirController = function($scope, $route, $http, $element) {
    this.scope_ = $scope;
    this.route_ = $route;
    this.http_ = $http;
    this.el_ = $element[0];
    this.parent_ = $scope['parent'];
    this.name_ = $scope['name'];
    /** @type {FolderContent} */
    this.content_;
    this.reloading_ = false;
    if (!$scope['isCollapsed']) this.reload_(false);

    /** @type {!function(!label.ImgDirController, !number, !Element)} */
    this.openImgCb_;
    const link = $scope['link'];
    if (link) link(this);
};

/**
 * @param {!number} n
 */
label.ImgDirController.prototype.nthItemEl_ = function(n) {
    return this.el_.children[1].children[n].querySelector('.name');
};

label.ImgDirController.prototype.checkReload_ = function() {
    if (!this.content_) this.reload_(false);
};

/**
 * @param {!boolean} refresh
 */
label.ImgDirController.prototype.reload_ = function(refresh) {
    this.reloading_ = true;
    let url = goog.string.format('list_dir?parent=%s&name=%s',
                                 encodeURIComponent(this.parent_),
                                 encodeURIComponent(this.name_));
    if (refresh) url += '&refresh=1';
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
 * @param {!number} i
 * @param {!Element} el
 */
label.ImgDirController.prototype.open_ = function(i, el) {
    this.openImgCb_(this, i, el);
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
    <a role="button" class="btn btn-sm" ng-click="c.${reload}(true)"
                     ng-disabled="c.${reloading}">
        <i class="fa fa-refresh fa-fw" ng-class="{'fa-spin' : c.${reloading}}"></i>
    </a>
</span>
<div uib-collapse="isCollapsed" expanding="c.${checkReload}()">
    <div class="dependent-item" ng-repeat="item in c.${content}.items">
        <img-dir parent="c.${content}.path" name="item.name" is-collapsed="true" link="link"
                 ng-if="item.isDir">
        </img-dir>
        <span class="img-dir-title">
            <a href="#" ng-click="c.${open}($index, $event.target)" ng-if="!item.isDir"
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
            'link': '<'
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
 * @param {!ui.bootstrap.$modal} $uibModal
 * @constructor
 * @struct
 * @ngInject
 */
label.LabelImgController = function($scope, $route, $http, $element, $uibModal) {
    this.scope_ = $scope;
    this.route_ = $route;
    this.http_ = $http;
    this.modal_ = $uibModal;

    const ctnEl = $element[0];
    this.canZoomIn_ = false;
    this.canZoomOut_ = false;
    this.width_ = Math.floor(ctnEl.clientWidth);
    this.height_ = Math.floor(ctnEl.clientHeight);
    this.canvas_ = new fabric.Canvas(ctnEl.querySelector('canvas'));
    this.canvas_.on('mouse:wheel', this.onWheel_.bind(this));
    this.canvas_.on('mouse:down', this.onMouseDown_.bind(this));
    this.canvas_.on('mouse:up', this.onMouseUp_.bind(this));
    this.canvas_.on('object:modified', this.onObjMod_.bind(this));
    this.canvas_.on('object:moving', this.onObjMoving_.bind(this));

    this.parent_ = '';
    /** @type {FolderItem} */
    this.item_;
    /** @type {fabric.Image} */
    this.img_;
    /** @type {Annotation} */
    this.ann_;
    this.scale_ = 1;

    /** @type {fabric.Object} */
    this.activeObj_;
    this.isDrawing_ = false;
    /** @type {fabric.Point} */
    this.drawingStartPt_;
    this.objNames_ = ['person'];
	this.listObjs_();

    const link = $scope['link'];
    if (link) link(this);
};

/**
 * @param {!string} parent
 * @param {!FolderItem} item
 */
label.LabelImgController.prototype.open = function(parent, item) {
    this.canvas_.clear();
    this.img_ = null;
    this.ann_ = null;
    this.parent_ = parent;
    this.item_ = item;
    const url = goog.string.format(
        'get_img?parent=%s&name=%s', encodeURIComponent(parent), encodeURIComponent(item.name));
    fabric.Image.fromURL(url, this.onLoad_.bind(this));
};

label.LabelImgController.prototype.save = function() {
    if (!this.ann_) return;
    const url = goog.string.format(
        'post_ann?parent=%s&name=%s', encodeURIComponent(this.parent_),
        encodeURIComponent(this.item_.name));
    this.http_.post(url, JSON.stringify(this.ann_)).then(
        this.saveDone_.bind(this), this.saveFailed_.bind(this));
    this.item_.objects = [];
    for (let i = 0; i < this.ann_.objects.length; i++) {
        const name = this.ann_.objects[i].name;
        if (this.item_.objects.indexOf(name) < 0) this.item_.objects.push(name);
    }
};

/**
 * @param {angular.$http.Response} resp
 */
label.LabelImgController.prototype.saveDone_ = function(resp) {
};

/**
 * @param {angular.$http.Response} resp
 */
label.LabelImgController.prototype.saveFailed_ = function(resp) {
    console.log('Failed to save!');
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
 * @param {!fabric.Event} opt
 */
label.LabelImgController.prototype.onMouseDown_ = function(opt) {
    if (opt.target || opt.isClick || !this.ann_) return;
    this.isDrawing_ = true;
    this.drawingStartPt_ = opt.pointer;
    opt.e.preventDefault();
    opt.e.stopPropagation();
};

const MIN_OBJ_SIZE = 30;
const MIN_CANVAS_SIZE = 300;
const TEXT_OFFSET = 1;
const RECT_FILL_COLOR = 'beige';

/**
 * @param {!fabric.Event} opt
 */
label.LabelImgController.prototype.onMouseUp_ = function(opt) {
    this.activeObj_ = opt.target;
    this.isDrawing_ = false;
    this.route_.reload();
    if (opt.target || opt.isClick || !this.drawingStartPt_ || !this.ann_) return;
    const width = Math.floor(Math.abs(opt.pointer.x - this.drawingStartPt_.x) / this.scale_);
    const height = Math.floor(Math.abs(opt.pointer.y - this.drawingStartPt_.y) / this.scale_);
    if (width >= MIN_OBJ_SIZE && height >= MIN_OBJ_SIZE) {
        const left = Math.floor(Math.min(opt.pointer.x, this.drawingStartPt_.x) / this.scale_);
        const top = Math.floor(Math.min(opt.pointer.y, this.drawingStartPt_.y) / this.scale_);
        const obj = /** @type {!Obj} */ ({});
        obj.bndbox = /** @type {!BoundingBox} */ ({});
        obj.bndbox.xmin = left;
        obj.bndbox.ymin = top;
        obj.bndbox.xmax = left + width;
        obj.bndbox.ymax = top + height;
        this.selectObjName_(this.addObj_.bind(this, obj));
    }
    opt.e.preventDefault();
    opt.e.stopPropagation();
    this.canvas_.discardActiveObject();
    this.canvas_.requestRenderAll();
};

/**
 * @param {!fabric.Event} opt
 */
label.LabelImgController.prototype.onObjMod_ = function(opt) {
    const rect = opt.target;
    const obj = rect._lblJson;
    obj.bndbox.xmin = rect.left;
    obj.bndbox.ymin = rect.top;
    obj.bndbox.xmax = rect.left + rect.width;
    obj.bndbox.ymax = rect.top + rect.height;
    this.save();
};

/**
 * @param {!fabric.Event} opt
 */
label.LabelImgController.prototype.onObjMoving_ = function(opt) {
    const rect = opt.target;
    const text = rect._lblText;
    text.left = rect.left + TEXT_OFFSET;
    text.top = rect.top + TEXT_OFFSET;
    this.canvas_.requestRenderAll();
};

/**
 * @param {!fabric.Image} img
 */
label.LabelImgController.prototype.onLoad_ = function(img) {
    this.img_ = img;
    let scale = this.width_ / img.width;
    if (img.height * scale > this.height_) scale = this.height_ / img.height;
    this.scaleCanvas_(scale);
    const url = goog.string.format('get_ann?parent=%s&name=%s', encodeURIComponent(this.parent_),
                                   encodeURIComponent(this.item_.name));
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
        this.renderObj_(this.ann_.objects[i])
    }
    this.canvas_.requestRenderAll();
};

/**
 * @param {!Obj} obj
 */
label.LabelImgController.prototype.renderObj_ = function(obj) {
    const rect = new fabric.Rect({
        left: Math.floor(obj.bndbox.xmin * this.scale_),
        top: Math.floor(obj.bndbox.ymin * this.scale_),
        width: Math.floor((obj.bndbox.xmax - obj.bndbox.xmin) * this.scale_),
        height: Math.floor((obj.bndbox.ymax - obj.bndbox.ymin) * this.scale_)
    });
    rect.fill = RECT_FILL_COLOR;
    rect.opacity = 0.4;
    rect.hasBorders = false;
    rect.hasRotatingPoint = false;
    rect.stroke = 'bisque';
    rect.strokeWidth = 2;
    const text = new fabric.Text(obj.name, {
        left: rect.left + TEXT_OFFSET,
        top: rect.top + TEXT_OFFSET,
        fontSize: 20,
        fontWeight: 'bold',
        shadow: 'rgba(0,0,0,0.3) 5px 5px 5px'
    });
    text.fill = 'palegreen';
    text.hasBorders = false;
    text.hasControls = false;
    text.selectable = false;
    rect._lblJson = obj;
    rect._lblText = text;
    this.canvas_.add(rect, text);
    this.canvas_.setActiveObject(rect);
    this.activeObj_ = rect;
    this.route_.reload();
};

/**
 * @param {angular.$http.Response} resp
 */
label.LabelImgController.prototype.getAnnFailed_ = function(resp) {
    alert(goog.string.format('Failed to load annotation for "%s"!', this.item_.name));
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
    this.canZoomOut_ = !!this.img_ && 
        this.canvas_.width > Math.min(this.img_.width, MIN_CANVAS_SIZE) &&
        this.canvas_.height > Math.min(this.img_.height, MIN_CANVAS_SIZE);
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
    const minWidth = Math.min(this.img_.width, MIN_CANVAS_SIZE);
    if (this.img_.width * scale < minWidth) scale = minWidth / this.img_.width;
    const minHeight = Math.min(this.img_.height, MIN_CANVAS_SIZE);
    if (this.img_.height * scale < minHeight) scale = minHeight / this.img_.height;
    this.scaleCanvas_(scale);
};

label.LabelImgController.prototype.listObjs_ = function() {
    this.http_.get('list_objs').then(this.gotObjs_.bind(this), this.listObjsFailed_.bind(this));
};

/**
 * @param {angular.$http.Response} resp
 */
label.LabelImgController.prototype.gotObjs_ = function(resp) {
    this.objNames_ = resp.data;
    if (!this.objNames_ || this.objNames_.length == 0) {
        this.objNames_ = ['person'];
    }
};

/**
 * @param {angular.$http.Response} resp
 */
label.LabelImgController.prototype.listObjsFailed_ = function(resp) {
    alert('Failed to fetch object list!');
    this.objNames_ = ['person'];
};

/**
 * @param {!function(!string)} cb
 */
label.LabelImgController.prototype.selectObjName_ = function(cb) {
    /** @type {!label.SelectObjController} */
    let ctl;

    const close = goog.reflect.objectProperty('close', ctl);
    const done = goog.reflect.objectProperty('done_', ctl);
    const names = goog.reflect.objectProperty('names_', ctl);

    const tpl = `
<div class="modal-header">
	<h3 class="modal-title" id="modal-title">Please choose an object</h3>
</div>
<div class="modal-body" id="modal-body">
	<ul>
        <li><div class="form-group has-feedback has-feedback-left"
            ng-class="{'has-warning' : names.length == 0}">
            <input type="text" ng-model="search" class="form-control"
                    ng-click="$event.stopPropagation()">
            <i class="form-control-feedback fa fa-search"></i>
        </div></li>
		<li ng-repeat="name in names = (c.${names}|filter:search:strict)">
			<a href="#" ng-click="$event.preventDefault(); c.${done}(name); c.${close}()">
                {{name}}
            </a>
		</li>
	</ul>
</div>
<div class="modal-footer">
	<button class="btn btn-warning" type="button" ng-click="c.${close}()">
		Cancel
	</button>
</div>`;

    const me = this;
    this.modal_.open({
        animation: true,
        template: tpl,
        controller: label.SelectObjController,
        controllerAs: 'c',
        resolve: {
            names: function() { return me.objNames_; },
            done: function() { return cb; }
        }
    });
};

/**
 * @param {!string} name
 */
label.LabelImgController.prototype.prioritizeObjName_ = function(name) {
    for (let i = 0; i < this.objNames_.length; i++) {
        if (this.objNames_[i] == name) {
            this.objNames_.splice(i, 1);
            this.objNames_.unshift(name);
            break;
        }
    }
};

/**
 * @param {!Obj} obj
 * @param {!string} name
 */
label.LabelImgController.prototype.addObj_ = function(obj, name) {
    if (this.ann_) {
        obj.name = name;
        this.ann_.objects.push(obj);
        this.renderObj_(obj);
        this.save();
    }
    this.prioritizeObjName_(name);
};

/**
 * @param {!fabric.Object} obj
 * @param {!string} name
 */
label.LabelImgController.prototype.changeObj_ = function(obj, name) {
    if (this.ann_) {
        this.activeObj_ = obj;
        obj._lblJson.name = name;
        obj._lblText.text = name;
        this.canvas_.requestRenderAll();
        this.save();
        this.route_.reload();
    }
    this.prioritizeObjName_(name);
};

/**
 * @param {!fabric.Object} obj
 */
label.LabelImgController.prototype.tryChangeObj_ = function(obj) {
    this.selectObjName_(this.changeObj_.bind(this, obj));
};

/**
 * @param {!fabric.Object} rect
 */
label.LabelImgController.prototype.delObj_ = function(rect) {
    if (this.ann_) {
        const obj = rect._lblJson;
        for (let i = 0; i < this.ann_.objects.length; i++) {
            if (this.ann_.objects[i] == obj) {
                this.ann_.objects.splice(i, 1);
                break;
            }
        }
        this.canvas_.remove(rect);
        this.canvas_.remove(rect._lblText);
        this.canvas_.requestRenderAll();
        this.save();
        if (rect == this.activeObj_) this.activeObj_ = null;
    }
};

/**
 * @param {!fabric.Object} rect
 * @param {!number} xminD
 * @param {!number} yminD
 * @param {!number} xmaxD
 * @param {!number} ymaxD
 */
label.LabelImgController.prototype.moveObj_ = function(rect, xminD, yminD, xmaxD, ymaxD) {
    if (this.ann_) {
        const obj = rect._lblJson;
        obj.bndbox.xmin += xminD;
        if (obj.bndbox.xmin < 0) {
            obj.bndbox.xmin = 0;
        } else if (obj.bndbox.xmin > this.img_.width - MIN_OBJ_SIZE) {
            obj.bndbox.xmin = this.img_.width - MIN_OBJ_SIZE;
        }
        obj.bndbox.ymin += yminD;
        if (obj.bndbox.ymin < 0) {
            obj.bndbox.ymin = 0;
        } else if (obj.bndbox.ymin > this.img_.height - MIN_OBJ_SIZE) {
            obj.bndbox.ymin = this.img_.height - MIN_OBJ_SIZE;
        }
        obj.bndbox.xmax += xmaxD;
        if (obj.bndbox.xmax < obj.bndbox.xmin + MIN_OBJ_SIZE) {
            obj.bndbox.xmax = obj.bndbox.xmin + MIN_OBJ_SIZE;
            if (obj.bndbox.xmax > this.img_.width) {
                obj.bndbox.xmax = this.img_.width;
                obj.bndbox.xmin = obj.bndbox.xmax - MIN_OBJ_SIZE;
            }
        } else if (obj.bndbox.xmax > this.img_.width) {
            obj.bndbox.xmax = this.img_.width;
        }
        obj.bndbox.ymax += ymaxD;
        if (obj.bndbox.ymax < obj.bndbox.ymin + MIN_OBJ_SIZE) {
            obj.bndbox.ymax = obj.bndbox.ymin + MIN_OBJ_SIZE;
            if (obj.bndbox.ymax > this.img_.height) {
                obj.bndbox.ymax = this.img_.height;
                obj.bndbox.ymin = obj.bndbox.ymax - MIN_OBJ_SIZE;
            }
        } else if (obj.bndbox.ymax > this.img_.height) {
            obj.bndbox.ymax = this.img_.height;
        }
        rect.set('left', Math.floor(obj.bndbox.xmin * this.scale_));
        rect.set('top', Math.floor(obj.bndbox.ymin * this.scale_));
        rect.set('width', Math.floor((obj.bndbox.xmax - obj.bndbox.xmin) * this.scale_));
        rect.set('height', Math.floor((obj.bndbox.ymax - obj.bndbox.ymin) * this.scale_));
        const text = rect._lblText;
        text.left = rect.left + TEXT_OFFSET;
        text.top = rect.top + TEXT_OFFSET;
        this.canvas_.requestRenderAll();
        this.save();
    }
};

label.App.directive('labelImg', function() {
    /** @type {!label.LabelImgController} */
    let ctl;

    const tpl = `
<canvas></canvas>
<label-img-tb label-img-ctl="c"></label-img-tb>`;

    return {
        restrict: 'E',
        scope: {
            'link': '<'
        },
        template: tpl,
        controller: label.LabelImgController,
        controllerAs: 'c'
    };
});

/**
 * @param {!ui.bootstrap.modalInstance} $uibModalInstance
 * @param {!Array<!string>} names
 * @param {!function(!string)} done
 * @constructor
 * @struct
 * @ngInject
 */
label.SelectObjController = function($scope, $uibModalInstance, names, done) {
    this.modalInst_ = $uibModalInstance;
    this.names_ = names;
    this.done_ = done;
};

label.SelectObjController.prototype.close = function() {
    this.modalInst_.close();
};

/**
 * @param {!angular.JQLite} $element
 * @constructor
 * @struct
 * @ngInject
 */
label.ToolbarController = function($element) {
    draggable.makeDraggable($element[0]);
};

label.App.directive('labelImgTb', function() {
    /** @type {!label.LabelImgController} */
    let ctl;

    const activeObj = goog.reflect.objectProperty('activeObj_', ctl);
    const canZoomIn = goog.reflect.objectProperty('canZoomIn_', ctl);
    const canZoomOut = goog.reflect.objectProperty('canZoomOut_', ctl);
    const delObj = goog.reflect.objectProperty('delObj_', ctl);
    const tryChangeObj = goog.reflect.objectProperty('tryChangeObj_', ctl);
    const zoomIn = goog.reflect.objectProperty('zoomIn_', ctl);
    const zoomOut = goog.reflect.objectProperty('zoomOut_', ctl);

    const tpl = `
<a role="button" class="btn btn-sm" ng-click="labelImgCtl.${zoomIn}(1.2)"
                 ng-disabled="!labelImgCtl.${canZoomIn}">
    <i class="fa fa-search-plus"></i>
</a>
<a role="button" class="btn btn-sm" ng-click="labelImgCtl.${zoomOut}(0.8)"
                 ng-disabled="!labelImgCtl.${canZoomOut}">
    <i class="fa fa-search-minus"></i>
</a>
<a role="button" class="btn btn-sm" ng-click="labelImgCtl.${delObj}(labelImgCtl.${activeObj})"
                 ng-disabled="!labelImgCtl.${activeObj}">
    <i class="fa fa-trash"></i>
</a>
<a role="button" class="btn btn-sm" ng-click="labelImgCtl.${tryChangeObj}(labelImgCtl.${activeObj})"
                 ng-disabled="!labelImgCtl.${activeObj}">
    <i class="fa fa-edit"></i>
</a>`;

    return {
        restrict: 'E',
        scope: {
            'labelImgCtl': '<'
        },
        template: tpl,
        controller: label.ToolbarController,
        controllerAs: 'c',
    };
});
