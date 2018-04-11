lm.controls.DropTargetIndicator = function() {
  this.element = $(lm.controls.DropTargetIndicator._template);
  $(document.body).append(this.element);
};

lm.controls.DropTargetIndicator._template =
  '<div class="lm_dropTargetIndicator"><div class="lm_inner"></div></div>';

lm.utils.copy(lm.controls.DropTargetIndicator.prototype, {
  destroy() {
    this.element.remove();
  },

  highlight(x1, y1, x2, y2) {
    this.highlightArea({ x1, y1, x2, y2 });
  },

  highlightArea(area) {
    this.element
      .css({
        left: area.x1,
        top: area.y1,
        width: area.x2 - area.x1,
        height: area.y2 - area.y1,
      })
      .show();
  },

  hide() {
    this.element.hide();
  },
});
