/**
 * @param {!Element} el
 * @param {Object=} opts
 * @constructor
 */
function Hammer(el, opts) {};

/**
 * @constructor
 */
Hammer.Event = function() {};
/**
 * @type {string}
 */
Hammer.Event.prototype.type;
/**
 * @type {number}
 * Movement of the X axis.
 */
Hammer.Event.prototype.deltaX;
/**
 * @type {number}
 * Movement of the Y axis.
 */
Hammer.Event.prototype.deltaY;
/**
 * @type {number}
 * Total time in ms since the first input.
 */
Hammer.Event.prototype.deltaTime;
/**
 * @type {number}
 * Distance moved.
 */
Hammer.Event.prototype.distance;
/**
 * @type {number}
 * Angle moved.
 */
Hammer.Event.prototype.angle;
/**
 * @type {number}
 * Velocity on the X axis, in px/ms.
 */
Hammer.Event.prototype.velocityX;
/**
 * @type {number}
 * Velocity on the Y axis, in px/ms
 */
Hammer.Event.prototype.velocityY;
/**
 * @type {number}
 * Highest velocityX/Y value.
 */
Hammer.Event.prototype.velocity;
/**
 * @type {number}
 * Direction moved. Matches the DIRECTION constants.
 */
Hammer.Event.prototype.direction;
/**
 * @type {number}
 * Direction moved from it’s starting point. Matches the DIRECTION constants.
 */
Hammer.Event.prototype.offsetDirection;
/**
 * @type {number}
 * Scaling that has been done when multi-touch. 1 on a single touch.
 */
Hammer.Event.prototype.scale;
/**
 * @type {number}
 * Rotation (in deg) that has been done when multi-touch. 0 on a single touch.
 */
Hammer.Event.prototype.rotation;
/**
 * @type {number}
 * Center position for multi-touch, or just the single pointer.
 */
Hammer.Event.prototype.center;
/**
 * @type {Event}
 * Source event object, type TouchEvent, MouseEvent or PointerEvent.
 */
Hammer.Event.prototype.srcEvent;
/**
 * @type {EventTarget}
 * Target that received the event.
 */
Hammer.Event.prototype.target;
/**
 * @type {string}
 * One of 'touch', 'pen', 'mouse' or 'kinect'.
 */
Hammer.Event.prototype.pointerType;
/**
 * @type {number}
 * Combination of Hammer.INPUT_*
 */
Hammer.Event.prototype.eventType;
/**
 * @type {boolean}
 * true when the first input.
 */
Hammer.Event.prototype.isFirst;
/**
 * @type {boolean}
 * true when the final (last) input.
 */
Hammer.Event.prototype.isFinal;
/**
 * @type {Array}
 * Array with all pointers, including the ended pointers (touchend, mouseup).
 */
Hammer.Event.prototype.pointers;
/**
 * @type {Array}
 * Array with all new/moved/lost pointers.
 */
Hammer.Event.prototype.changedPointers;
/**
 * Reference to the srcEvent.preventDefault() method. Only for experts!
 */
Hammer.Event.prototype.preventDefault = function() {};

/**
 * @type {number}
 * The amount of multi-taps being recognized.
 */
Hammer.Event.prototype.tapCount;

/**
 * @constructor
 */
Hammer.Recognizer = function() {};

/**
 * @param {Object} opts
 */
Hammer.Recognizer.prototype.set = function(opts) {};

/**
 * @param {!string} evts
 * @param {function(Hammer.Event)} handler
 */
Hammer.prototype.off = function(evts, handler) {};

/**
 * @param {!string} evts
 * @param {function(Hammer.Event)} handler
 */
Hammer.prototype.on = function(evts, handler) {};

/**
 * @param {!string} evt
 * @return {Hammer.Recognizer}
 */
Hammer.prototype.get = function(evt) {};

/**
 * @param {Object=} opts
 */
Hammer.prototype.set = function(opts) {};

/** @type {number} */
Hammer.DIRECTION_ALL;
/** @type {number} */
Hammer.DIRECTION_DOWN;
/** @type {number} */
Hammer.DIRECTION_HORIZONTAL;
/** @type {number} */
Hammer.DIRECTION_LEFT;
/** @type {number} */
Hammer.DIRECTION_NONE;
/** @type {number} */
Hammer.DIRECTION_RIGHT;
/** @type {number} */
Hammer.DIRECTION_UP;
/** @type {number} */
Hammer.DIRECTION_VERTICAL;
/** @type {number} */
Hammer.INPUT_CANCEL;
/** @type {number} */
Hammer.INPUT_END;
/** @type {number} */
Hammer.INPUT_MOVE;
/** @type {number} */
Hammer.INPUT_START;
/** @type {number} */
Hammer.STATE_BEGAN;
/** @type {number} */
Hammer.STATE_CANCELLED;
/** @type {number} */
Hammer.STATE_CHANGED;
/** @type {number} */
Hammer.STATE_ENDED;
/** @type {number} */
Hammer.STATE_FAILED;
/** @type {number} */
Hammer.STATE_POSSIBLE;
/** @type {number} */
Hammer.STATE_RECOGNIZED;
/** @type {string} */
Hammer.VERSION;
