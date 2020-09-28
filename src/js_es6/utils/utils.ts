import $ from 'jquery';
import { AssertError } from '../errors/error';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function F(): void {}

// export function extend(subClass, superClass) {
//     subClass.prototype = createObject(superClass.prototype);
//     subClass.prototype.contructor = subClass;
// }

// export function createObject(prototype) {
//     if (typeof Object.create === 'function') {
//         return Object.create(prototype);
//     } else {
//         F.prototype = prototype;
//         return new F();
//     }
// }

export function objectKeys(object: Record<string, unknown>): string[] {
    let keys: string[];
    let key: string;

    if (typeof Object.keys === 'function') {
        return Object.keys(object);
    } else {
        keys = [];
        for (key in object) {
            keys.push(key);
        }
        return keys;
    }
}

export function getHashValue(key: string): string | null {
    const matches = location.hash.match(new RegExp(key + '=([^&]*)'));
    return matches ? matches[1] : null;
}

export function getQueryStringParam(param: string): string | null {
    return getHashValue(param);
}

export function createTemplateHtmlElement(templateText: string, selector: string): HTMLElement {
    const template = document.createElement('template')
    // modify the template's content
    // template.content.append(document.createElement('div'))
    // add it to the document so it is parsed and ready to be used
    document.head.appendChild(template)
    const parsedDocument = new DOMParser().parseFromString(templateText, 'text/html')
    const node = parsedDocument.querySelector(selector);
    if (node === null) {
        throw new AssertError('UCTHE772242', `${selector}: ${templateText.substr(0, 400)}`);
    } else {
        template.content.appendChild(node);
        return node as HTMLElement;
    }
}

export function numberToPixels(value: number): string {
    return value.toString(10) + 'px';
}

export function pixelsToNumber(value: string): number {
    const numberStr = value.replace("px", "");
    return parseFloat(numberStr);
}

export function getElementWidth(element: HTMLElement): number {
    const widthAsPixels = getComputedStyle(element).width;
    return pixelsToNumber(widthAsPixels);
}

export function getElementHeight(element: HTMLElement): number {
    const widthAsPixels = getComputedStyle(element).height;
    return pixelsToNumber(widthAsPixels);
}

export function copy(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    for (const key in source) {
        target[key] = source[key];
    }
    return target;
}

// replacement for JQuery $.extend(true, target, ...objs)
export function multiDeepExtend(target: Record<string, unknown>, ...objs: Record<string, unknown>[]): Record<string, unknown> {
    for (const obj of objs) {
        target = deepExtend(target, obj);
    }

    return target;
}

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

export function deepExtendValue(existingTarget: unknown, value: unknown): unknown {
    if (typeof value !== 'object') {
        return value;
    } else {
        if (value instanceof Array) {
            const length = value.length;
            const targetArray = new Array<unknown>(length);
            for (let i = 0; i < length; i++) {
                const element = value[i];
                targetArray[i] = deepExtend({}, element);
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

/**
 * This is based on Paul Irish's shim, but looks quite odd in comparison. Why?
 * Because
 * a) it shouldn't affect the global requestAnimationFrame function
 * b) it shouldn't pass on the time that has passed
 *
 * @param   {Function} fn
 *
 * @returns {void}
 */
export function animFrame(fn) {
    return (window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        })(function() {
        fn();
    });
}

export function indexOf(needle, haystack) {
    if (!(haystack instanceof Array)) {
        throw new Error('Haystack is not an Array');
    }

    if (haystack.indexOf) {
        return haystack.indexOf(needle);
    } else {
        for (var i = 0; i < haystack.length; i++) {
            if (haystack[i] === needle) {
                return i;
            }
        }
        return -1;
    }
}


export const isFunction = (typeof /./ != 'function' && typeof Int8Array != 'object') ? 
    function isFunction(obj: unknown) {
        return typeof obj == 'function' || false;
    } : function isFunction(obj: unknown) {
        return toString.call(obj) === '[object Function]';
    }

export function fnBind(fn, context: unknown, boundArgs: [...unknown[]] | undefined): unknown {

    if (Function.prototype.bind !== undefined) {
        return Function.prototype.bind.apply(fn, [context].concat(boundArgs ?? []));
    }

    const bound = function(this: unknown, ...argsRest: unknown[]) {

        // Join the already applied arguments to the now called ones (after converting to an array again).
        const args = (boundArgs || []).concat(Array.prototype.slice.call(argsRest, 0));

        // If not being called as a constructor
        if (!(this instanceof bound)) {
            // return the result of the function called bound to target and partially applied.
            return fn.apply(context, args);
        }
        // If being called as a constructor, apply the function bound to self.
        fn.apply(this, args);
    };
    // Attach the prototype of the function to our newly created function.
    bound.prototype = fn.prototype;
    return bound;
}

export function removeFromArray<T>(item: T, array: T[]): void {
    const index = array.indexOf(item);

    if (index === -1) {
        throw new Error('Can\'t remove item from array. Item is not in the array');
    }

    array.splice(index, 1);
}

export function now(): number {
    if (typeof Date.now === 'function') {
        return Date.now();
    } else {
        return (new Date()).getTime();
    }
}

export function getUniqueId(): string {
    return (Math.random() * 1000000000000000)
        .toString(36)
        .replace('.', '');
}

/**
 * A basic XSS filter. It is ultimately up to the
 * implementing developer to make sure their particular
 * applications and usecases are save from cross site scripting attacks
 *
 * @param   {String} input
 * @param    {Boolean} keepTags
 *
 * @returns {String} filtered input
 */
export function filterXss(input: string, keepTags: boolean): string {

    const output = input
        .replace(/javascript/gi, 'j&#97;vascript')
        .replace(/expression/gi, 'expr&#101;ssion')
        .replace(/onload/gi, 'onlo&#97;d')
        .replace(/script/gi, '&#115;cript')
        .replace(/onerror/gi, 'on&#101;rror');

    if (keepTags === true) {
        return output;
    } else {
        return output
            .replace(/>/g, '&gt;')
            .replace(/</g, '&lt;');
    }
}

/**
 * Removes html tags from a string
 *
 * @param   {String} input
 *
 * @returns {String} input without tags
 */
export function stripTags(input: string): string {
    return $.trim(input.replace(/(<([^>]+)>)/ig, ''));
}
