import { LeftAndTop, WidthAndHeight } from './types';
import { pixelsToNumber } from './utils';

export interface JQueryOffset {
    top: number;
    left: number;    
}

export function getJQueryOffset(element: HTMLElement): JQueryOffset {
    const rect = element.getBoundingClientRect();
    return {
        top: rect.top + document.body.scrollTop,
        left: rect.left + document.body.scrollLeft,
    }
}

export function getJQueryWidthAndHeight(element: HTMLElement): WidthAndHeight {
    const style = getComputedStyle(element, null);
    const widthAndHeight: WidthAndHeight = {
        width: pixelsToNumber(style.width),
        height: pixelsToNumber(style.height),
    }
    return widthAndHeight;
}

export function getJQueryLeftAndTop(element: HTMLElement): LeftAndTop {
    const style = getComputedStyle(element, null);
    const leftAndTop: LeftAndTop = {
        left: pixelsToNumber(style.left),
        top: pixelsToNumber(style.top),
    }
    return leftAndTop;
}
