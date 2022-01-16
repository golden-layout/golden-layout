import { StyleConstants } from './style-constants';

/** @internal */
export type WidthOrHeightPropertyName = 'width' | 'height';

/** @internal */
export namespace WidthOrHeightPropertyName {
    export const width = 'width';
    export const height = 'height';
}

/** @internal */
export interface WidthAndHeight {
    width: number;
    height: number;
}

/** @internal */
export interface LeftAndTop {
    left: number;
    top: number;
}

/** @public */
export type Side = 'top' | 'left' | 'right' | 'bottom';
/** @public */
export namespace Side {
    export const top = 'top';
    export const left = 'left';
    export const right = 'right';
    export const bottom = 'bottom';
}

/** @public */
export type LogicalZIndex = 'base' | 'drag' | 'stackMaximised';
/** @public */
export namespace LogicalZIndex {
    export const base = 'base';
    export const drag = 'drag';
    export const stackMaximised = 'stackMaximised';
}

/** @public */
export const LogicalZIndexToDefaultMap = {
    base: StyleConstants.defaultComponentBaseZIndex,
    drag: StyleConstants.defaultComponentDragZIndex,
    stackMaximised: StyleConstants.defaultComponentDragZIndex,
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
// eslint-disable-next-line @typescript-eslint/ban-types
export type JsonValue = string | number | boolean | null | Json | object | JsonValueArray;
/** @public */
export interface Json {
    [name: string]: JsonValue;
}
/** @public */
export type JsonValueArray = Array<JsonValue>
/** @public */
export namespace JsonValue {
    export function isJson(value: JsonValue): value is Json {
        return isJsonObject(value);
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    export function isJsonObject(value: JsonValue): value is Json | object {
        return !Array.isArray(value) && value !== null && typeof value === 'object';
    }
}

/** @public */
export type ItemType = 'ground' | 'row' | 'column' | 'stack' | 'component';

/** @public */
export namespace ItemType {
    export const ground = 'ground';
    export const row = 'row';
    export const column = 'column';
    export const stack = 'stack';
    export const component = 'component';
}

/** @public */
export type ResponsiveMode = 'none' | 'always' | 'onload';
/** @public */
export namespace ResponsiveMode {
    export const none = 'none';
    export const always = 'always';
    export const onload = 'onload';
}
