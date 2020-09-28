import { pixelsToNumber } from './utils';

export interface JQueryOffset {
    top: number;
    left: number;    
}

export interface JQueryWidthAndHeight {
    width: number;
    height: number;    
}

export interface JQueryLeftAndTop {
    left: number;
    top: number;    
}

export function getJQueryOffset(element: HTMLElement): JQueryOffset {
    const rect = element.getBoundingClientRect();
    return {
        top: rect.top + document.body.scrollTop,
        left: rect.left + document.body.scrollLeft,
    }
}

export function getJQueryWidthAndHeight(element: HTMLElement): JQueryWidthAndHeight {
    const style = getComputedStyle(element, null);
    const widthAndHeight: JQueryWidthAndHeight = {
        width: pixelsToNumber(style.width),
        height: pixelsToNumber(style.height),
    }
    return widthAndHeight;
}

export function getJQueryLeftAndTop(element: HTMLElement): JQueryLeftAndTop {
    const style = getComputedStyle(element, null);
    const leftAndTop: JQueryLeftAndTop = {
        left: pixelsToNumber(style.left),
        top: pixelsToNumber(style.top),
    }
    return leftAndTop;
}
