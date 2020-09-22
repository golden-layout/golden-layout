import DragListener from '../utils/DragListener'
import $ from 'jquery'

export default class Splitter {
    private _grabSize;

    element;

    constructor(private _isVertical: boolean, private _size: number, grabSize: number) {
        this._grabSize = grabSize < this._size ? this._size : grabSize;

        this.element = this._createElement();
        this._dragListener = new DragListener(this.element);
    }

    on(event, callback, context) {
        this._dragListener.on(event, callback, context);
    }

    _$destroy() {
        this.element.remove();
    }

    _createElement(): HTMLElement {
        var dragHandle = $('<div class="lm_drag_handle"></div>');
        var element = $('<div class="lm_splitter"></div>');
        element.append(dragHandle);

        var handleExcessSize = this._grabSize - this._size;
        var handleExcessPos = handleExcessSize / 2;

        if (this._isVertical) {
            dragHandle.css('top', -handleExcessPos);
            dragHandle.css('height', this._size + handleExcessSize);
            element.addClass('lm_vertical');
            element['height'](this._size);
        } else {
            dragHandle.css('left', -handleExcessPos);
            dragHandle.css('width', this._size + handleExcessSize);
            element.addClass('lm_horizontal');
            element['width'](this._size);
        }

        return element;
    }
}
