export function F() {}

export function getTouchEvent(event){
    if($.zepto){
        return event.touches ? event.targetTouches[0] : event;
    } else {
        return event.originalEvent && event.originalEvent.touches ? event.originalEvent.touches[0] : event;
    }
}

export function extend(subClass, superClass) {
    subClass.prototype = createObject(superClass.prototype);
    subClass.prototype.contructor = subClass;
}

export function createObject(prototype) {
    if (typeof Object.create === 'function') {
        return Object.create(prototype);
    } else {
        F.prototype = prototype;
        return new F();
    }
}

export function objectKeys(object) {
    var keys, key;

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

export function getHashValue(key) {
    var matches = location.hash.match(new RegExp(key + '=([^&]*)'));
    return matches ? matches[1] : null;
}

export function getQueryStringParam(param) {
    if (window.location.hash) {
        return getHashValue(param);
    } else if (!window.location.search) {
        return null;
    }

    var keyValuePairs = window.location.search.substr(1).split('&'),
        params = {},
        pair,
        i;

    for (i = 0; i < keyValuePairs.length; i++) {
        pair = keyValuePairs[i].split('=');
        params[pair[0]] = pair[1];
    }

    return params[param] || null;
}

export function copy(target, source) {
    for (var key in source) {
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


export var isFunction = (typeof /./ != 'function' && typeof Int8Array != 'object') ? 
    function isFunction(obj) {
        return typeof obj == 'function' || false;
    } : function isFunction(obj) {
        return toString.call(obj) === '[object Function]';
    }

export function fnBind(fn, context, boundArgs) {

    if (Function.prototype.bind !== undefined) {
        return Function.prototype.bind.apply(fn, [context].concat(boundArgs || []));
    }

    var bound = function() {

        // Join the already applied arguments to the now called ones (after converting to an array again).
        var args = (boundArgs || []).concat(Array.prototype.slice.call(arguments, 0));

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

export function removeFromArray(item, array) {
    var index = indexOf(item, array);

    if (index === -1) {
        throw new Error('Can\'t remove item from array. Item is not in the array');
    }

    array.splice(index, 1);
}

export function now() {
    if (typeof Date.now === 'function') {
        return Date.now();
    } else {
        return (new Date()).getTime();
    }
}

export function getUniqueId() {
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
export function filterXss(input, keepTags) {

    var output = input
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
export function stripTags(input) {
    return $.trim(input.replace(/(<([^>]+)>)/ig, ''));
}
