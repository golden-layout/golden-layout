import { LayoutConfig } from '../config/config';

/**
 * Minifies and unminifies configs by replacing frequent keys
 * and values with one letter substitutes. Config options must
 * retain array position/index, add new options at the end.
 * @internal
*/

export class ConfigMinifier {
    _keys: readonly string[];
    _values: readonly (boolean | string)[];

    constructor() {
        this._keys = [
            'settings',
            'hasHeaders',
            'constrainDragToContainer',
            'selectionEnabled',
            'dimensions',
            'borderWidth',
            'minItemHeight',
            'minItemWidth',
            'headerHeight',
            'dragProxyWidth',
            'dragProxyHeight',
            'labels',
            'close',
            'maximise',
            'minimise',
            'popout',
            'content',
            'componentName',
            'componentState',
            'id',
            'width',
            'type',
            'height',
            'isClosable',
            'title',
            'popoutWholeStack',
            'openPopouts',
            'parentId',
            'activeItemIndex',
            'reorderEnabled',
            'borderGrabWidth',




            //Maximum 36 entries, do not cross this line!
        ];
        if (this._keys.length > 36) {
            throw new Error('Too many keys in config minifier map');
        }

        this._values = [
            true,
            false,
            'row',
            'column',
            'stack',
            'component',
            'close',
            'maximise',
            'minimise',
            'open in new window'
        ];
    }


    /**
     * Takes a GoldenLayout configuration object and
     * replaces its keys and values recursively with
     * one letter counterparts
     */
    minifyConfig(config: LayoutConfig): LayoutConfig {
        return this.translateObject(config, true) as LayoutConfig;
    }

    /**
     * Takes a configuration Object that was previously minified
     * using minifyConfig and returns its original version
     */
    unminifyConfig(minifiedConfig: LayoutConfig): LayoutConfig {
        return this.translateObject(minifiedConfig, false) as LayoutConfig;
    }

    private translateObject(from: Record<string, unknown>, minify: boolean) {
        const to: Record<string, unknown> = {};
        for (const key in from) {
            if (from.hasOwnProperty(key)) { // In case something has extended Object prototypes
                let translatedKey: string;
                if (minify) {
                    translatedKey = this.minifyKey(key);
                } else {
                    translatedKey = this.unminifyKey(key);
                }

                const fromValue = from[key];
                to[translatedKey] = this.translateValue(fromValue, minify);
            }
        }

        return to;
    }

    private translateArray(from: unknown[], minify: boolean) {
        const length = from.length;
        const to = new Array<unknown>(length);
        for (let i = 0; i < length; i++) {
            // In original code, array indices were numbers and not translated
            const fromValue = from[i];
            to[i] = this.translateValue(fromValue, minify);
        }
        return to;
    }

    private translateValue(from: unknown, minify: boolean) {
        if (typeof from === 'object') {
            if (from === null) {
                return null;
            } else {
                if (from instanceof Array) {
                    return this.translateArray(from, minify);
                } else {
                    return this.translateObject(from as Record<string, unknown>, minify);
                }
            }
        } else {
            if (minify) {
                return this.minifyValue(from);
            } else {
                return this.unminifyValue(from);
            }
        }
    }

    private minifyKey(value: string) {
        /**
         * If a value actually is a single character, prefix it
         * with ___ to avoid mistaking it for a minification code
         */
        if (typeof value === 'string' && value.length === 1) {
            return '___' + value;
        }
    
        const index = this.indexOfKey(value);
    
        /**
         * value not found in the dictionary, return it unmodified
         */
        if (index === -1) {
            return value;
    
            /**
             * value found in dictionary, return its base36 counterpart
             */
        } else {
            return index.toString(36);
        }
    }

    private unminifyKey(key: string) {
        /**
         * value is a single character. Assume that it's a translation
         * and return the original value from the dictionary
         */
        if (key.length === 1) {
            return this._keys[parseInt(key, 36)];
        }
    
        /**
         * value originally was a single character and was prefixed with ___
         * to avoid mistaking it for a translation. Remove the prefix
         * and return the original character
         */
        if (key.substr(0, 3) === '___') {
            return key[3];
        }
        /**
         * value was not minified
         */
        return key;
    }

    private minifyValue(value: unknown) {
        /**
         * If a value actually is a single character, prefix it
         * with ___ to avoid mistaking it for a minification code
         */
        if (typeof value === 'string' && value.length === 1) {
            return '___' + value;
        }
    
        const index = this.indexOfValue(value);
    
        /**
         * value not found in the dictionary, return it unmodified
         */
        if (index === -1) {
            return value;
    
            /**
             * value found in dictionary, return its base36 counterpart
             */
        } else {
            return index.toString(36);
        }
    }

    private unminifyValue(value: unknown) {
        /**
         * value is a single character. Assume that it's a translation
         * and return the original value from the dictionary
         */
        if (typeof value === 'string' && value.length === 1) {
            return this._values[parseInt(value, 36)];
        }

        /**
         * value originally was a single character and was prefixed with ___
         * to avoid mistaking it for a translation. Remove the prefix
         * and return the original character
         */
        if (typeof value === 'string' && value.substr(0, 3) === '___') {
            return value[3];
        }
        /**
         * value was not minified
         */
        return value;
    }

    private indexOfKey(key: string) {
        for (let i = 0; i < this._keys.length; i++) {
            if (this._keys[i] === key) {
                return i;
            }
        }
        return -1;
    }

    private indexOfValue(value: unknown) {
        for (let i = 0; i < this._values.length; i++) {
            if (this._values[i] === value) {
                return i;
            }
        }
        return -1;
    }
}
