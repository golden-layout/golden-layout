/** @internal */
export interface WidthAndHeight {
    width: number;
    height: number;    
}

/** @internal */
export namespace WidthAndHeight {
    export const widthPropertyName = 'width';
    export const heightPropertyName = 'height';
}

/** @internal */
export interface LeftAndTop {
    left: number;
    top: number;    
}

/** @public */
export type Side = 'top' | 'left' | 'right' | 'bottom';
export namespace Side {
    export const top = 'top';
    export const left = 'left';
    export const right = 'right';
    export const bottom = 'bottom';
}

/** @internal */
export interface Rect {
    left: number,
    top: number,
    width: number,
    height: number,
}

/** @internal */
export interface AreaLinkedRect {
    x1: number, // left
    x2: number, // nextLeft
    y1: number, // top
    y2: number, // nextTop
}

/** @public */
export type JsonValue = string | number | boolean | null | Json | JsonValueArray;
/** @public */
export interface Json {
    [name: string]: JsonValue;
}
/** @public */
export type JsonValueArray = Array<JsonValue>
/** @public */
export namespace JsonValue {
    export function isJson(value: JsonValue): value is Json {
        return !Array.isArray(value) && value !== null && typeof value === 'object';
    }
}
