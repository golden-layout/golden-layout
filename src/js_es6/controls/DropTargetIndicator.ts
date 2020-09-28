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
            left,
            top,
            nextLeft: nextLeft,
            nextTop: nextTop
        });
    }

    highlightArea(rectSegment: LinkedRect): void {
        this.element.style.left = numberToPixels(rectSegment.left);
        this.element.style.top = numberToPixels(rectSegment.top);
        this.element.style.width = numberToPixels(rectSegment.nextLeft - rectSegment.left);
        this.element.style.height = numberToPixels(rectSegment.nextTop - rectSegment.top);
        this.element.style.display = '';
    }
}
