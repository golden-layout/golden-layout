import { DragListener } from '../utils/DragListener';
import { EventEmitter } from '../utils/EventEmitter';
import { createTemplateHtmlElement, numberToPixels } from '../utils/utils';

/** @internal */
export class Splitter {
    private _grabSize;
    private _dragListener: DragListener;

    readonly element;

    constructor(private _isVertical: boolean, private _size: number, grabSize: number) {
        this._grabSize = grabSize < this._size ? this._size : grabSize;

        this.element = this.createElement();
        this._dragListener = new DragListener(this.element);
    }

    destroy(): void {
        this.element.remove();
    }

    on<K extends keyof EventEmitter.EventParamsMap>(eventName: K, callback: EventEmitter.Callback<K>): void {
        this._dragListener.on<K>(eventName, callback);
    }

    private createElement(): HTMLElement {
        const dragHandle = createTemplateHtmlElement('<div class="lm_drag_handle"></div>');
        const element = createTemplateHtmlElement('<div class="lm_splitter"></div>');
        element.appendChild(dragHandle);

        const handleExcessSize = this._grabSize - this._size;
        const handleExcessPos = handleExcessSize / 2;

        if (this._isVertical) {
            dragHandle.style.top = numberToPixels(-handleExcessPos);
            dragHandle.style.height = numberToPixels(this._size + handleExcessSize);
            element.classList.add('lm_vertical');
            element.style.height = numberToPixels(this._size);
        } else {
            dragHandle.style.left = numberToPixels(-handleExcessPos);
            dragHandle.style.width = numberToPixels(this._size + handleExcessSize);
            element.classList.add('lm_horizontal');
            element.style.width = numberToPixels(this._size);
        }

        return element;
    }
}
