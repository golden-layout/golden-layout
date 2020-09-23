import $ from 'jquery';

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
    if (window.location.hash) {
        return getHashValue(param);
    } else if (!window.location.search) {
        return null;
    }

    const keyValuePairs = window.location.search.substr(1).split('&');
    const params = {};
    let pair: string[];

    for (let i = 0; i < keyValuePairs.length; i++) {
        pair = keyValuePairs[i].split('=');
        params[pair[0]] = pair[1];
    }

    return params[param] || null;
}

export function createTemplateHtmlElement(templateText: string, selector: string): HTMLElement {
    const template = document.createElement('template')
    // modify the template's content
    // template.content.append(document.createElement('div'))
    // add it to the document so it is parsed and ready to be used
    document.head.append(template)
    const parsedDocument = new DOMParser().parseFromString(templateText, 'text/html')
    const node = parsedDocument.querySelector(selector);
    if (node === null) {
        throw new Error('Drag Proxy Template error: First node is not div')
    } else {
        template.content.append(node);
        return node as HTMLElement;
    }
}

export function copy(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    for (const key in source) {
        target[key] = source[key];
    }
    return target;
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
