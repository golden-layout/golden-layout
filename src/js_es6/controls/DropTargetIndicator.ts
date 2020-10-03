import { LinkedRect } from '../utils/types';
import { createTemplateHtmlElement, numberToPixels, setElementVisibility } from '../utils/utils';

const _template = '<div class="lm_dropTargetIndicator"><div class="lm_inner"></div></div>'

export class DropTargetIndicator {
    private _element: HTMLElement;

    constructor() {
        // Maybe use container instead of Document Body?
        this._element = createTemplateHtmlElement(_template, 'div');
        document.body.appendChild(this._element);
    }

    destroy(): void {
        this._element.remove();
    }

    highlight(x1: number, y1: number, x2: number, y2: number): void {
        this.highlightArea({
            x1,
            y1,
            x2,
            y2,
        });
    }

    highlightArea(rectSegment: LinkedRect): void {
        this._element.style.left = numberToPixels(rectSegment.x1);
        this._element.style.top = numberToPixels(rectSegment.y1);
        this._element.style.width = numberToPixels(rectSegment.x2 - rectSegment.x1);
        this._element.style.height = numberToPixels(rectSegment.y2 - rectSegment.y1);
        this._element.style.display = '';
    }

    hide(): void {
        setElementVisibility(this._element, false);
    }
}
