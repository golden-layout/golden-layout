import { UnexpectedNullError } from '../errors/internal-error';
import { WidthAndHeight } from './types';

/** @internal */
export function getQueryStringParam(key: string): string | null {
    const matches = location.hash.match(new RegExp(key + '=([^&]*)'));
    return matches ? matches[1] : null;
}

/** @deprecated
 * Caution! Try not to use this function.  Converting text to HTML can have security implications
 * While the templateText is not user generated and should be safe, some security reviews may reject
 * applications which use this technique regardless
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML
 * Try creating fragments using javascript without HTML text
 * @internal
 */
export function createTemplateHtmlElement(templateText: string): HTMLElement {
    const template = document.createElement('template')
    template.insertAdjacentHTML('afterbegin', templateText);
    const element = template.firstElementChild as HTMLElement;
    if (element === null) {
        throw new UnexpectedNullError('UCTHE43328', templateText);
    } else {
        return element;
    }
}

/** @internal */
export function numberToPixels(value: number): string {
    return value.toString(10) + 'px';
}

/** @internal */
export function pixelsToNumber(value: string): number {
    const numberStr = value.replace("px", "");
    return parseFloat(numberStr);
}

/** @internal */
export function getElementWidth(element: HTMLElement): number {
    const widthAsPixels = getComputedStyle(element).width;
    return pixelsToNumber(widthAsPixels);
}

/** @internal */
export function setElementWidth(element: HTMLElement, width: number): void {
    const widthAsPixels = numberToPixels(width);
    element.style.width = widthAsPixels;
}

/** @internal */
export function getElementHeight(element: HTMLElement): number {
    const heightAsPixels = getComputedStyle(element).height;
    return pixelsToNumber(heightAsPixels);
}

/** @internal */
export function setElementHeight(element: HTMLElement, height: number): void {
    const heightAsPixels = numberToPixels(height);
    element.style.height = heightAsPixels;
}

/** @internal */
export function getElementWidthAndHeight(element: HTMLElement): WidthAndHeight {
    const computedStyle = getComputedStyle(element);
    return {
        width: pixelsToNumber(computedStyle.width),
        height: pixelsToNumber(computedStyle.height),
    };
}

/** @internal */
export function setElementDisplayVisibility(element: HTMLElement, visible: boolean): void {
    if (visible) {
        element.style.display = '';
    } else {
        element.style.display = 'none';
    }
}

/**
 * Replacement for JQuery $.extend(target, obj)
 * @internal
*/
export function extend(target: Record<string, unknown>, obj: Record<string, unknown>): Record<string, unknown> {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            target[key] = obj[key];
        }
    }
    return target;
}

/**
 * Replacement for JQuery $.extend(true, target, obj)
 * @internal
*/
export function deepExtend(target: Record<string, unknown>, obj: Record<string, unknown> | undefined): Record<string, unknown> {
    if (obj !== undefined) {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                const existingTarget = target[key];
                target[key] = deepExtendValue(existingTarget, value);
            }
        }
    }

    return target;
}

/** @internal */
export function deepExtendValue(existingTarget: unknown, value: unknown): unknown {
    if (typeof value !== 'object') {
        return value;
    } else {
        if (value instanceof Array) {
            const length = value.length;
            const targetArray = new Array<unknown>(length);
            for (let i = 0; i < length; i++) {
                const element = value[i];
                targetArray[i] = deepExtendValue({}, element);
            }
            return targetArray;
        } else {
            if (value === null) {
                return null;
            } else {
                const valueObj = value as Record<string, unknown>;
                if (existingTarget === undefined) {
                    return deepExtend({}, valueObj); // overwrite
                } else {
                    if (typeof existingTarget !== "object") {
                        return deepExtend({}, valueObj); // overwrite
                    } else {
                        if (existingTarget instanceof Array) {
                            return deepExtend({}, valueObj); // overwrite
                        } else {
                            if (existingTarget === null) {
                                return deepExtend({}, valueObj); // overwrite
                            } else {
                                const existingTargetObj = existingTarget as Record<string, unknown>;
                                return deepExtend(existingTargetObj, valueObj); // merge
                            }
                        }
                    }
                }
            }
        }
    }
}

// REPLACED with window.requestAnimationFrame using arrow function
// I do not think animFrame() is needed anymore
// 
// This is based on Paul Irish's shim, but looks quite odd in comparison. Why?
// Because
// a) it shouldn't affect the global requestAnimationFrame function
// b) it shouldn't pass on the time that has passed
//
// @param   {Function} fn
// @returns {void}
// export function animFrame(fn) {
//     return (window.requestAnimationFrame ||
//         window.webkitRequestAnimationFrame ||
//         window.mozRequestAnimationFrame ||
//         function(callback) {
//             window.setTimeout(callback, 1000 / 60);
//         })(function() {
//         fn();
//     });
// }

/** @internal */
export function removeFromArray<T>(item: T, array: T[]): void {
    const index = array.indexOf(item);

    if (index === -1) {
        throw new Error('Can\'t remove item from array. Item is not in the array');
    }

    array.splice(index, 1);
}

/** @internal */
export function getUniqueId(): string {
    return (Math.random() * 1000000000000000)
        .toString(36)
        .replace('.', '');
}

/**
 * Removes html tags from a string
 * @returns input without tags
 * @internal
*/
export function stripTags(input: string): string {
    const strippedInput = input.replace(/(<([^>]+)>)/ig, '');
    return strippedInput.trim();
}
