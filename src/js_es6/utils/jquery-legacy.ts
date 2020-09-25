
export interface JQueryOffset {
    top: number;
    left: number;    
}

export interface JQueryWidthAndHeight {
    width: number;
    height: number;    
}

export function getJQueryOffset(element: HTMLElement): JQueryOffset {
    const rect = element.getBoundingClientRect();
    return {
        top: rect.top + document.body.scrollTop,
        left: rect.left + document.body.scrollLeft,
    }
}

export function getJQueryWidth(element: HTMLElement): number {
    return parseFloat(getComputedStyle(element, null).width.replace("px", ""));
}

export function getJQueryHeight(element: HTMLElement): number {
    return parseFloat(getComputedStyle(element, null).height.replace("px", ""));
}

export function getJQueryWidthAndHeight(element: HTMLElement): JQueryWidthAndHeight {
    const style = getComputedStyle(element, null);
    const widthAndHeight: JQueryWidthAndHeight = {
        width: parseFloat(style.width.replace("px", "")),
        height: parseFloat(style.height.replace("px", "")),
    }
    return widthAndHeight;
}
