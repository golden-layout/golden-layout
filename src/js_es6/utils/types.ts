export interface Rect {
    left: number,
    top: number,
    width: number,
    height: number,
}

export interface LinkedRect {
    left: number,
    top: number,
    nextLeft: number,
    nextTop: number,
}

export type JsonValue = string | number | boolean | Json | JsonValueArray;
export interface Json {
    [name: string]: JsonValue;
}
export type JsonValueArray = Array<JsonValue>
