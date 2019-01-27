/**
 * @const
 */
var fabric = {};

/**
 * @constructor
 */
fabric.Object = function() {};

/**
 * @type {string}
 */
fabric.Object.prototype.fill;

/**
 * @type {!boolean}
 */
fabric.Object.prototype.hasBorders;

/**
 * @type {!boolean}
 */
fabric.Object.prototype.hasControls;

/**
 * @type {!boolean}
 */
fabric.Object.prototype.hasRotatingPoint;

/**
 * @type {!number}
 */
fabric.Object.prototype.height;

/**
 * @type {!number}
 */
fabric.Object.prototype.left;

/**
 * @type {!boolean}
 */
fabric.Object.prototype.lockRotation;

/**
 * @type {!boolean}
 */
fabric.Object.prototype.lockUniScaling;

/**
 * @type {!number}
 */
fabric.Object.prototype.opacity;

/**
 * @type {!number}
 */
fabric.Object.prototype.right;

/**
 * @type {!boolean}
 */
fabric.Object.prototype.selectable;

/**
 * @type {string}
 */
fabric.Object.prototype.stroke;

/**
 * @type {number}
 */
fabric.Object.prototype.strokeWidth;

/**
 * @type {!number}
 */
fabric.Object.prototype.width;

/**
 * @return {!number}
 */
fabric.Object.prototype.complexity = function() {};

/**
 * @constructor
 */
fabric.Event = function() {};

/**
 * @type {Event|MouseEvent|TouchEvent}
 */
fabric.Event.prototype.e;

/**
 * @type {fabric.Object}
 */
fabric.Event.prototype.target;

/**
 * @param {!string} evt
 * @param {function(!fabric.Event)} cb
 */
fabric.Object.prototype.on = function(evt, cb) {};

/**
 * @param {!CanvasRenderingContext2D} ctx
 */
fabric.Object.prototype.render = function(ctx) {};

/**
 * @param {{bl: boolean,
 *          br: boolean,
 *          ml: boolean,
 *          mt: boolean,
 *          mr: boolean,
 *          mb: boolean,
 *          mtr: boolean,
 *          tl: boolean,
 *          tr: boolean}} opt
 */
fabric.Object.prototype.setControlsVisibility = function(opt) {};

/**
 * @param {{format: (string|undefined),
 *          quality: (number|undefined),
 *          left: (number|undefined),
 *          top: (number|undefined),
 *          width: (number|undefined),
 *          height: (number|undefined)}=} opts
 * @return {!string}
 */
fabric.Object.prototype.toDataURL = function(opts) {};

/**
 * @param {Array<!string>=} propertiesToInclude
 * @return {!Object}
 */
fabric.Object.prototype.toObject = function(propertiesToInclude) {};

/**
 * @return {!string}
 */
fabric.Object.prototype.toString = function() {};

/**
 * @return {!string}
 */
fabric.Object.prototype.toSVG = function() {};

/**
 * @constructor
 * @extends {fabric.Object}
 */
fabric.Circle = function() {};

/**
 * @constructor
 * @extends {fabric.Object}
 */
fabric.Collection = function() {};

/**
 * @constructor
 * @extends {fabric.Object}
 */
fabric.Color = function() {};

/**
 * @constructor
 * @extends {fabric.Object}
 */
fabric.Ellipse = function() {};

/**
 * @constructor
 * @extends {fabric.Object}
 */
fabric.Gradient = function() {};

/**
 * @constructor
 * @extends {fabric.Object}
 */
fabric.Group = function() {};

/**
 * @param {Element|string} el
 * @constructor
 * @extends {fabric.Object}
 */
fabric.Image = function(el) {};

/**
 * @param {!string} url
 * @param {function(!fabric.Image)=} cb
 */
fabric.Image.fromURL = function(url, cb) {};

/**
 * @constructor
 * @extends {fabric.Object}
 */
fabric.IText = function() {};

/**
 * @constructor
 * @extends {fabric.Object}
 */
fabric.Line = function() {};

/**
 * @constructor
 * @extends {fabric.Object}
 */
fabric.Observable = function() {};

/**
 * @constructor
 * @extends {fabric.Object}
 */
fabric.Path = function() {};

/**
 * @constructor
 * @extends {fabric.Object}
 */
fabric.PathGroup = function() {};

/**
 * @constructor
 * @extends {fabric.Object}
 */
fabric.Pattern = function() {};

/**
 * @constructor
 * @extends {fabric.Object}
 */
fabric.Point = function() {};

/**
 * @constructor
 * @extends {fabric.Object}
 */
fabric.Polygon = function() {};

/**
 * @param {{width: number,
 *          height: number,
 *          left: number,
 *          top: number}} opt
 * @constructor
 * @extends {fabric.Object}
 */
fabric.Rect = function(opt) {};

/**
 * @constructor
 * @extends {fabric.Object}
 */
fabric.Shadow = function() {};

/**
 * @constructor
 * @extends {fabric.Object}
 */
fabric.Triangle = function() {};

/**
 * @param {!string} text
 * @param {{fontFamily: (string|undefined),
 *          fontSize: (number|undefined),
 *          fontStyle: (number|undefined),
 *          fontWeight: (string|undefined),
 *          shadow: (string|undefined),
 *          left: (number|undefined),
 *          top: (number|undefined)}} opt
 * @constructor
 * @extends {fabric.Object}
 */
fabric.Text = function(text, opt) {};

/**
 * @constructor
 * @extends {fabric.Object}
 */
fabric.BaseBrush = function() {};

/**
 * @constructor
 * @extends {fabric.BaseBrush}
 */
fabric.CircleBrush = function() {};

/**
 * @constructor
 * @extends {fabric.BaseBrush}
 */
fabric.PatternBrush = function() {};

/**
 * @constructor
 * @extends {fabric.BaseBrush}
 */
fabric.PencilBrush = function() {};

/**
 * @constructor
 * @extends {fabric.BaseBrush}
 */
fabric.SprayBrush = function() {};

/**
 * @constructor
 * @extends {fabric.Object}
 */
fabric.StaticCanvas = function() {};

/**
 * @param {...fabric.Object} objs
 */
fabric.StaticCanvas.prototype.add = function(objs) {};

fabric.StaticCanvas.prototype.clear = function() {};

/**
 * @param {string=} opt
 * @return {!Array<!fabric.Object>}
 */
fabric.StaticCanvas.prototype.getObjects = function(opt) {};

fabric.StaticCanvas.prototype.renderAll = function() {};

/**
 * @param {fabric.Image|string} img
 * @param {function()=} cb
 * @param {{opacity: (number|undefined),
            angle: (number|undefined),
            left: (number|undefined),
            top: (number|undefined),
            originX: (string|undefined),
            originY: (string|undefined),
            scaleX: (number|undefined),
            scaleY: (number|undefined)}=} opts
 */
fabric.StaticCanvas.prototype.setBackgroundImage = function(img, cb, opts) {};

/**
 * @param {string|number} value
 */
fabric.StaticCanvas.prototype.setHeight = function(value) {};

/**
 * @param {string|number} value
 */
fabric.StaticCanvas.prototype.setWidth = function(value) {};

/**
 * @param {!number} value
 */
fabric.StaticCanvas.prototype.setZoom = function(value) {};

/**
 * @param {Element|string} el
 * @constructor
 * @extends {fabric.StaticCanvas}
 */
fabric.Canvas = function(el) {};

/**
 * @return {Element}
 */
fabric.Canvas.prototype.getSelectionElement = function() {};

