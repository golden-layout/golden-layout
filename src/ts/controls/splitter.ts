import { DomConstants } from '../utils/dom-constants';
import { DragListener } from '../utils/drag-listener';
import { EventEmitter } from '../utils/event-emitter';
import { numberToPixels } from '../utils/utils';

/** @internal */
export class Splitter {
    private _grabSize;
    private _dragListener: DragListener;

    private readonly _element: HTMLDivElement;
    private readonly _dragHandleElement: HTMLDivElement;
    private readonly _backgroundElement: HTMLDivElement;
    private readonly _dragHandleOffset: number;

    get element(): HTMLDivElement { return this._element; }
    get dragHandleElement(): HTMLDivElement { return this._dragHandleElement; }
    get backgroundElement(): HTMLDivElement { return this._backgroundElement; }
    get dragHandleOffset(): number { return this._dragHandleOffset; }

    constructor(private _isVertical: boolean, private _size: number, grabSize: number) {
        this._grabSize = grabSize < this._size ? this._size : grabSize;

        this._element = document.createElement('div');
        this._element.classList.add(DomConstants.ClassName.Splitter);
        this._backgroundElement = document.createElement('div');
        const dragHandleElement = document.createElement('div');
        this._dragHandleElement = dragHandleElement;
        dragHandleElement.classList.add(DomConstants.ClassName.DragHandle);
        this._backgroundElement.classList.add(DomConstants.ClassName.Bg);
        this._element.setAttribute('draggable', 'true');

        const handleExcessSize = this._grabSize - this._size;
        const handleExcessPos = handleExcessSize / 2;
        this._dragHandleOffset = handleExcessPos;
        const padding = numberToPixels(handleExcessPos);

        if (this._isVertical) {
            dragHandleElement.style.top = `${-handleExcessPos}px`;
            dragHandleElement.style.paddingTop = padding;
            dragHandleElement.style.paddingBottom = padding;
            dragHandleElement.style.height = numberToPixels(this._size);
            this._backgroundElement.style.top = `${-handleExcessPos}px`;
            this._backgroundElement.style.height = `${this._grabSize}px`;
            this._element.classList.add(DomConstants.ClassName.Vertical);
            this._element.style.height = numberToPixels(this._size);
        } else {
            dragHandleElement.style.left = `${-handleExcessPos}px`;
            dragHandleElement.style.paddingLeft = padding;
            dragHandleElement.style.paddingRight = padding;
            dragHandleElement.style.width = numberToPixels(this._size);
            this._backgroundElement.style.left = `${-handleExcessPos}px`;
            this._backgroundElement.style.width = `${this._grabSize}px`;
            this._element.classList.add(DomConstants.ClassName.Horizontal);
            this._element.style.width = numberToPixels(this._size);
        }

        this._element.appendChild(this._backgroundElement);
        this._element.appendChild(dragHandleElement);

        this._dragListener = new DragListener(this._element);
    }

    destroy(): void {
        this._element.remove();
    }

    on<K extends keyof EventEmitter.EventParamsMap>(eventName: K, callback: EventEmitter.Callback<K>): void {
        this._dragListener.on<K>(eventName, callback);
    }
}
