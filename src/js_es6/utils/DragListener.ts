import { EventEmitter } from './EventEmitter';

export class DragListener extends EventEmitter {
    private _timeout: NodeJS.Timeout | undefined;
    private _oDocument: Document;
    private _eBody: HTMLElement;
    private _nDelay: number;
    private _nDistance: number;
    private _nX: number;
    private _nY: number;
    private _nOriginalX: number;
    private _nOriginalY: number;
    private _bDragging: boolean;

    constructor(private _eElement: HTMLElement) {

        super();

        this._timeout = undefined;

        this._oDocument = document;
        this._eBody = document.body;

        /**
         * The delay after which to start the drag in milliseconds
         */
        this._nDelay = 200;

        /**
         * The distance the mouse needs to be moved to qualify as a drag
         */
        this._nDistance = 10; //TODO - works better with delay only

        this._nX = 0;
        this._nY = 0;

        this._nOriginalX = 0;
        this._nOriginalY = 0;

        this._bDragging = false;

        this._eElement.addEventListener('mousedown', (ev) => this.onMouseDown(ev));
        this._eElement.addEventListener('touchstart', (ev) => this.onTouchStart(ev));
    }

    destroy(): void {
        this._eElement.removeEventListener('mousedown', (ev) => this.onMouseDown(ev));
        this._eElement.removeEventListener('touchstart', (ev) => this.onTouchStart(ev));
        this._oDocument.removeEventListener('mouseup', (ev) => this.onMouseUp(ev));
        this._oDocument.removeEventListener('touchend', (ev) => this.onTouchEnd(ev));
    }

    private onMouseDown(oEvent: MouseEvent) {
        oEvent.preventDefault();

        if (oEvent.button == 0) {
            const coordinates = this.getMouseCoordinates(oEvent);
            this.processMouseDownTouchStart(coordinates);
        }
    }

    private onTouchStart(oEvent: TouchEvent) {
        oEvent.preventDefault();

        const coordinates = this.getTouchCoordinates(oEvent);
        if (coordinates !== undefined) {
            this.processMouseDownTouchStart(coordinates);
        }
    }

    private processMouseDownTouchStart(coordinates: DragProxy.MouseTouchCoordinates) {
        this._nOriginalX = coordinates.x;
        this._nOriginalY = coordinates.y;

        this._oDocument.addEventListener('mousemove', (ev) => this.onMouseMove(ev));
        this._oDocument.addEventListener('touchmove', (ev) => this.onTouchMove(ev));
        this._eElement.addEventListener('mouseup', (ev) => this.onMouseUp(ev));
        this._eElement.addEventListener('touchend', (ev) => this.onTouchEnd(ev));

        this._timeout = setTimeout(() => this.startDrag(), this._nDelay);
    }

    private onMouseMove(oEvent: MouseEvent) {
        if (this._timeout !== undefined) {
            oEvent.preventDefault();

            const coordinates = this.getMouseCoordinates(oEvent);
            this.processMouseMoveTouchMove(coordinates, oEvent);
        }
    }

    private onTouchMove(oEvent: TouchEvent) {
        if (this._timeout !== undefined) {
            oEvent.preventDefault();

            const coordinates = this.getTouchCoordinates(oEvent);
            if (coordinates !== undefined) {
                const mouseTouchEvent: EventEmitter.DragEvent = {
                    mouseEvent: undefined,
                    touchEvent: oEvent,
                    pageX: coordinates.x,
                    pageY: coordinates.y,
                }
                this.processMouseMoveTouchMove(coordinates, mouseTouchEvent);
            }
        }
    }

    private processMouseMoveTouchMove(coordinates: DragProxy.MouseTouchCoordinates, mouseTouchEvent: EventEmitter.DragEvent) {
        this._nX = coordinates.x - this._nOriginalX;
        this._nY = coordinates.y - this._nOriginalY;

        if (this._bDragging === false) {
            if (
                Math.abs(this._nX) > this._nDistance ||
                Math.abs(this._nY) > this._nDistance
            ) {
                if (this._timeout !== undefined) {
                    clearTimeout(this._timeout);
                }
                this.startDrag();
            }
        }

        if (this._bDragging) {
            this.emit('drag', this._nX, this._nY, mouseTouchEvent);
        }
    }

    private onMouseUp(oEvent: MouseEvent) {
        this.processMouseUpTouchEnd(oEvent);
    }

    private onTouchEnd(oEvent: TouchEvent): void {
        this.processMouseUpTouchEnd(oEvent);
    }

    private processMouseUpTouchEnd(uiEvent: UIEvent) {
        if (this._timeout != null) {
            clearTimeout(this._timeout);
            this._eBody.classList.remove('lm_dragging');
            this._eElement.classList.remove('lm_dragging');
            this._oDocument.querySelector('iframe')?.style.setProperty('pointer-events', '');
            this._eElement.removeEventListener('mousemove', (ev) => this.onMouseMove(ev));
            this._eElement.removeEventListener('touchmove', (ev) => this.onTouchMove(ev));
            this._oDocument.removeEventListener('mouseup', (ev) => this.onMouseUp(ev));
            this._oDocument.removeEventListener('touchend', (ev) => this.onTouchEnd(ev));
    
            if (this._bDragging === true) {
                this._bDragging = false;
                this.emit('dragStop', uiEvent, this._nOriginalX + this._nX);
            }
        }
    }

    private startDrag() {
        this._bDragging = true;
        this._eBody.classList.add('lm_dragging');
        this._eElement.classList.add('lm_dragging');
        this._oDocument.querySelector('iframe')?.style.setProperty('pointer-events', 'none');
        this.emit('dragStart', this._nOriginalX, this._nOriginalY);
    }

    private getMouseCoordinates(event: MouseEvent) {
        const result: DragProxy.MouseTouchCoordinates = {
            x: event.pageX,
            y: event.pageY
        };
        return result;
    }

    private getTouchCoordinates(event: TouchEvent) {
        const targetTouches = event.targetTouches;
        if (targetTouches.length === 0) {
            return undefined;
        } else {
            const targetTouch = event.targetTouches[0]
            const result: DragProxy.MouseTouchCoordinates = {
                x: targetTouch.pageX,
                y: targetTouch.pageY
            };
            return result;
        }
    }
}

export namespace DragProxy {
    export interface MouseTouchCoordinates {
        x: number,
        y: number,
    }
}