goog.provide('draggable');

/**
 * @param {!Element} el
 */
draggable.makeDraggable = function(el) {
    el.style.position = 'absolute';
    const hammer = new Hammer(el, {'touchAction': 'none'});
    hammer.get('swipe').set({'enable': false});
    hammer.get('tap').set({'enable': false});
    hammer.get('doubletap').set({'enable': false});
    hammer.get('press').set({'enable': false});
    hammer.get('rotate').set({'enable': false});
    hammer.get('pinch').set({'enable': false});
    hammer.get('pan').set({'enable': true});
    let isDragging = false;
    let dragStartX = -1, dragStartY = -1;
    hammer.on('pan', /** @param {Hammer.Event} evt */ function(evt) {
        if (!isDragging) {
            isDragging = true;
            dragStartX = el.offsetLeft;
            dragStartY = el.offsetTop;
        }
        el.style.left = (evt.deltaX + dragStartX) + "px";
        el.style.top = (evt.deltaY + dragStartY) + "px";
        if (evt.isFinal) {
            isDragging = false;
            dragStartX = -1;
            dragStartY = -1;
        }
    });
    el['hammer'] = hammer;
};
