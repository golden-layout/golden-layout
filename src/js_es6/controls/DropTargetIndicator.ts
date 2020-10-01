import { LinkedRect } from '../utils/types';
import { createTemplateHtmlElement, numberToPixels } from '../utils/utils';

const _template = '<div class="lm_dropTargetIndicator"><div class="lm_inner"></div></div>'

export class DropTargetIndicator {
    element: HTMLElement;

    constructor() {
        // Maybe use container instead of Document Body?
        this.element = createTemplateHtmlElement(_template, 'div');
        document.body.appendChild(this.element);
    }

    destroy(): void {
        this.element.remove();
    }

    highlight(left: number, top: number, nextLeft: number, nextTop: number): void {
        this.highlightArea({
            x1: left,
            y1: top,
            x2: nextLeft,
            y2: nextTop
        });
    }

    highlightArea(rectSegment: LinkedRect): void {
        this.element.style.left = numberToPixels(rectSegment.x1);
        this.element.style.top = numberToPixels(rectSegment.y1);
        this.element.style.width = numberToPixels(rectSegment.x2 - rectSegment.x1);
        this.element.style.height = numberToPixels(rectSegment.y2 - rectSegment.y1);
        this.element.style.display = '';
    }
}
