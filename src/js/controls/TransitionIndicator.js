lm.controls.TransitionIndicator = function() {
  this._element = $('<div class="lm_transition_indicator"></div>');
  $(document.body).append(this._element);

  this._toElement = null;
  this._fromDimensions = null;
  this._totalAnimationDuration = 200;
  this._animationStartTime = null;
};

lm.utils.copy(lm.controls.TransitionIndicator.prototype, {
  destroy() {
    this._element.remove();
  },

  transitionElements(fromElement, toElement) {
    /**
     * TODO - This is not quite as cool as expected. Review.
     */
    // this._toElement = toElement;
    // this._animationStartTime = lm.utils.now();
    // this._fromDimensions = this._measure( fromElement );
    // this._fromDimensions.opacity = 0.8;
    // this._element.show().css( this._fromDimensions );
    // lm.utils.animFrame( lm.utils.fnBind( this._nextAnimationFrame, this ) );
  },

  _nextAnimationFrame() {
    const toDimensions = this._measure(this._toElement);
    const animationProgress =
      (lm.utils.now() - this._animationStartTime) / this._totalAnimationDuration;
    const currentFrameStyles = {};
    let cssProperty;

    if (animationProgress >= 1) {
      this._element.hide();
      return;
    }

    toDimensions.opacity = 0;

    for (cssProperty in this._fromDimensions) {
      currentFrameStyles[cssProperty] =
        this._fromDimensions[cssProperty] +
        (toDimensions[cssProperty] - this._fromDimensions[cssProperty]) * animationProgress;
    }

    this._element.css(currentFrameStyles);
    lm.utils.animFrame(lm.utils.fnBind(this._nextAnimationFrame, this));
  },

  _measure(element) {
    const offset = element.offset();

    return {
      left: offset.left,
      top: offset.top,
      width: element.outerWidth(),
      height: element.outerHeight(),
    };
  },
});
