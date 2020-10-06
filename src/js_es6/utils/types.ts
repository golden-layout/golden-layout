export interface WidthAndHeight {
    width: number;
    height: number;    
}

export interface LeftAndTop {
    left: number;
    top: number;    
}

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

export interface AreaLinkedRect {
    x1: number, // left
    x2: number, // nextLeft
    y1: number, // top
    y2: number, // nextTop
}

export type JsonValue = string | number | boolean | null | undefined | Json | JsonValueArray;
export interface Json {
    [name: string]: JsonValue;
}
export type JsonValueArray = Array<JsonValue>