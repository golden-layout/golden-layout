import DragListener from '../utils/DragListener';

export default class Splitter {
  constructor(isVertical, size, grabSize) {
    this._isVertical = isVertical;
    this._size = size;
    this._grabSize = grabSize < size ? size : grabSize;

    this.element = this._createElement();
    this._dragListener = new DragListener(this.element);
  }

  on(event, callback, context) {
    this._dragListener.on(event, callback, context);
  }

  _$destroy() {
    this.element.remove();
  }

  _createElement() {
    const dragHandle = $('<div class="lm_drag_handle"></div>');
    const element = $('<div class="lm_splitter"></div>');
    element.append(dragHandle);

    const handleExcessSize = this._grabSize - this._size;
    const handleExcessPos = handleExcessSize / 2;

    if (this._isVertical) {
      dragHandle.css('top', -handleExcessPos);
      dragHandle.css('height', this._size + handleExcessSize);
      element.addClass('lm_vertical');
      element.height(this._size);
    } else {
      dragHandle.css('left', -handleExcessPos);
      dragHandle.css('width', this._size + handleExcessSize);
      element.addClass('lm_horizontal');
      element.width(this._size);
    }

    return element;
  }
}
