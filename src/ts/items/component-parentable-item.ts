import { ComponentItem } from './component-item';
import { ContentItem } from './content-item';

export abstract class ComponentParentableItem extends ContentItem {

    static isComponentParentableItem(item: ContentItem): item is ComponentParentableItem {
        return item.isStack || item.isGround;
    }

    /** @internal */
    private _focused = false;

    get focused(): boolean { return this._focused; }

    /** @internal */
    setFocusedValue(value: boolean): void {
        this._focused = value;
    }

    abstract setActiveComponentItem(item: ComponentItem, focus: boolean, suppressFocusEvent: boolean): void;
}
