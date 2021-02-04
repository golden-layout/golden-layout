import { DomConstants } from '../utils/dom-constants';
import { AreaLinkedRect } from '../utils/types';
import { numberToPixels, setElementDisplayVisibility } from '../utils/utils';

/** @internal */
export class DropTargetIndicator {
    private _element: HTMLElement;

    constructor() {
        // Maybe use container instead of Document Body?
        this._element = document.createElement('div');
        this._element.classList.add(DomConstants.ClassName.DropTargetIndicator);
        const innerElement = document.createElement('div');
        innerElement.classList.add(DomConstants.ClassName.Inner);
        this._element.appendChild(innerElement);

        document.body.appendChild(this._element);
    }

    destroy(): void {
        this._element.remove();
    }

    highlightArea(area: AreaLinkedRect): void {
        this._element.style.left = numberToPixels(area.x1);
        this._element.style.top = numberToPixels(area.y1);
        this._element.style.width = numberToPixels(area.x2 - area.x1);
        this._element.style.height = numberToPixels(area.y2 - area.y1);
        this._element.style.display = 'block';
    }

    hide(): void {
        setElementDisplayVisibility(this._element, false);
    }
}
