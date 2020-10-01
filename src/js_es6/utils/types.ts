export const enum Side {
    'top',
    'left',
    'right',
    'bottom',
}

export interface Rect {
    left: number,
    top: number,
    width: number,
    height: number,
}

export interface LinkedRect {
    x1: number, // left
    x2: number, // nextLeft
    y1: number, // top
    y2: number, // nextTop
}

export type JsonValue = string | number | boolean | Json | JsonValueArray;
export interface Json {
    [name: string]: JsonValue;
}
export type JsonValueArray = Array<JsonValue>
