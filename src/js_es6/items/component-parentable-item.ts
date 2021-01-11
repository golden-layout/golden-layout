import { ContentItem } from './content-item';

export abstract class ComponentParentableItem extends ContentItem {
    private _focused = false;

    get focused(): boolean { return this._focused; }

    /** @internal */
    setFocusedValue(value: boolean): void {
        this._focused = value;
    }
}
