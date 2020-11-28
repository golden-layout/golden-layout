import { ComponentItemConfig, GroundItemConfig, HeaderedItemConfig, ItemConfig, RootItemConfig, StackItemConfig } from '../config/config';
import { UserComponentItemConfig, UserItemConfig, UserRowOrColumnItemConfig, UserSerialisableComponentConfig, UserStackItemConfig } from '../config/user-config';
import { AssertError, UnexpectedNullError, UnexpectedUndefinedError } from '../errors/internal-error';
import { LayoutManager } from '../layout-manager';
import { AreaLinkedRect, JsonValue } from '../utils/types';
import { createTemplateHtmlElement, getElementWidthAndHeight, setElementHeight, setElementWidth } from '../utils/utils';
import { ComponentItem } from './component-item';
import { ContentItem } from './content-item';
import { RowOrColumn } from './row-or-column';

/**
 * GroundItem is the ContentItem whose one child is the root ContentItem (Root is planted in Ground).
 * (Previously it was called root however this was incorrect as its child is the root item)
 * There is only one instance of GroundItem and it is automatically created by the Layout Manager
 * @internal
 */
export class GroundItem extends ContentItem {
    private readonly _childElementContainer: HTMLElement;
    private readonly _containerElement: HTMLElement;

    constructor(layoutManager: LayoutManager, rootItemConfig: RootItemConfig | undefined, containerElement: HTMLElement) {
      
        super(layoutManager, GroundItemConfig.create(rootItemConfig), null, createTemplateHtmlElement(GroundItem.templateHtml));

        this.isGround = true;
        this._childElementContainer = this.element;
        this._containerElement = containerElement;
        this._containerElement.appendChild(this.element);
    }

    init(): void {
        if (this.isInitialised === true) return;

        this.updateNodeSize();

        for (let i = 0; i < this.contentItems.length; i++) {
            this._childElementContainer.appendChild(this.contentItems[i].element);
        }

        super.init();

        this.initContentItems();
    }

    /** 
     * Loads a new Layout
     * Internal only.  To load a new layout with API, use {@link (LayoutManager:class).loadLayout}
     */
    loadRoot(rootItemConfig: RootItemConfig | undefined): void {
        // Remove existing root if it exists
        this.clearRoot();

        if (rootItemConfig !== undefined) {
            const rootContentItem = this.layoutManager.createAndInitContentItem(rootItemConfig, this);
            this.addChild(rootContentItem, 0);
        }
    }

    newSerialisableComponent(componentTypeName: string, componentState?: JsonValue, index?: number): ComponentItem {
        const itemConfig: UserSerialisableComponentConfig = {
            type: 'component',
            componentName: componentTypeName,
            componentState,
        };
        return this.newItem(itemConfig, index) as ComponentItem;
    }

    /**
     * Adds a Serialisable Component child to root ContentItem.
     * Internal only.  To load a add with API, use {@link (LayoutManager:class).addSerialisableComponent}
     */
    addSerialisableComponent(componentTypeName: string, componentState?: JsonValue, index?: number): number {
        const itemConfig: UserSerialisableComponentConfig = {
            type: 'component',
            componentName: componentTypeName,
            componentState,
        };
        return this.addItem(itemConfig, index);
    }

    newItem(userItemConfig: UserRowOrColumnItemConfig | UserStackItemConfig | UserComponentItemConfig,  index?: number): ContentItem {
        index = this.addItem(userItemConfig, index);
        let createdItem: ContentItem;
        if (index === -1) {
            // created ContentItem as root as root did not exist
            createdItem = this.contentItems[0];
        } else {
            const rootItem = this.contentItems[0];
            if (rootItem === undefined) {
                throw new UnexpectedUndefinedError('GINI8832');
            } else {
                createdItem = rootItem.contentItems[index];
            }
        }

        if (ContentItem.isStack(createdItem) && (UserItemConfig.isComponent(userItemConfig))) {
            // createdItem is a Stack which was created to hold wanted component.  Return component
            return createdItem.contentItems[0];
        } else {
            return createdItem;
        }
    }

    /**
     * Adds a ContentItem child to root ContentItem.
     * Internal only.  To load a add with API, use {@link (LayoutManager:class).addItem}
     * @returns -1 if added as root otherwise index in root ContentItem's content
     */
    addItem(userItemConfig: UserRowOrColumnItemConfig | UserStackItemConfig | UserComponentItemConfig, 
        index?: number
    ): number {
        const itemConfig = UserItemConfig.resolve(userItemConfig);
        let parent: ContentItem;
        if (this.contentItems.length > 0) {
            parent = this.contentItems[0];          
        } else {
            parent = this;
        }
        if (parent.isComponent) {
            throw new Error('Cannot add item as child to ComponentItem');
        } else {
            const contentItem = this.layoutManager.createAndInitContentItem(itemConfig, parent);
            index = parent.addChild(contentItem, index);
            return (parent === this) ? -1 : index;
        }
    }

    loadComponentAsRoot(userItemConfig: UserComponentItemConfig): void {
        // Remove existing root if it exists
        this.clearRoot();

        const itemConfig = UserItemConfig.resolve(userItemConfig) as ComponentItemConfig;

        if (itemConfig.maximised) {
            throw new Error('Root Component cannot be maximised');
        } else {
            const rootContentItem = new ComponentItem(this.layoutManager, itemConfig, this);
            rootContentItem.init();
            this.addChild(rootContentItem, 0);
        }
    }

    /**
     * Adds a Root ContentItem.
     * Internal only.  To replace Root ContentItem with API, use {@link (LayoutManager:class).loadLayout}
     */
    addChild(contentItem: ContentItem, index?: number): number {
        if (this.contentItems.length > 0) {
            throw new Error('Ground node can only have a single child');
        } else {
            // contentItem = this.layoutManager._$normalizeContentItem(contentItem, this);
            this._childElementContainer.appendChild(contentItem.element);
            index = super.addChild(contentItem, index);

            this.updateSize();
            this.emitBubblingEvent('stateChanged');

            return index;
        }
    }

    /** @internal */
    calculateConfigContent(): RootItemConfig[] {
        const contentItems = this.contentItems;
        const count = contentItems.length;
        const result = new Array<RootItemConfig>(count);
        for (let i = 0; i < count; i++) {
            const item = contentItems[i];
            const itemConfig = item.toConfig();
            if (RootItemConfig.isRootItemConfig(itemConfig)) {
                result[i] = itemConfig;
            } else {
                throw new AssertError('RCCC66832');
            }
        }
        return result;
    }

    /** @internal */
    setSize(width: number, height: number): void {
        if (width === undefined || height === undefined) {
            this.updateSize(); // For backwards compatibility with v1.x API
        } else {
            setElementWidth(this.element, width);
            setElementHeight(this.element, height);

            // GroundItem can be empty
            if (this.contentItems.length > 0) {
                setElementWidth(this.contentItems[0].element, width);
                setElementHeight(this.contentItems[0].element, height);
            }

            this.updateContentItemsSize();
        }
    }

    /**
     * Adds a Root ContentItem.
     * Internal only.  To replace Root ContentItem with API, use {@link (LayoutManager:class).updateRootSize}
     */
    updateSize(): void {
        this.updateNodeSize();
        this.updateContentItemsSize();
    }

    createSideAreas(): GroundItem.Area[] {
        const areaSize = 50;

        const oppositeSides = GroundItem.Area.oppositeSides;
        const result = new Array<GroundItem.Area>(Object.keys(oppositeSides).length);
        let idx = 0;

        for (const key in oppositeSides) {
            const side = key as keyof GroundItem.Area.Sides;
            const area = this.getElementArea() as GroundItem.Area;
            if (area === null) {
                throw new UnexpectedNullError('RCSA77553');
            } else {
                area.side = side;
                if (oppositeSides[side][1] === '2' )
                    area[side] = area[oppositeSides[side]] - areaSize;
                else
                    area[side] = area[oppositeSides[side]] + areaSize;
                area.surface = (area.x2 - area.x1) * (area.y2 - area.y1);
                result[idx++] = area;
            }
        }

        return result;
    }

    highlightDropZone(x: number, y: number, area: AreaLinkedRect): void {
        this.layoutManager.tabDropPlaceholder.remove();
        super.highlightDropZone(x, y, area);
    }

    onDrop(contentItem: ContentItem, area: GroundItem.Area): void {

        if (contentItem.isComponent) {
            const itemConfig = StackItemConfig.createDefault();
            // since ItemConfig.contentItems not set up, we need to add header from Component
            const component = contentItem as ComponentItem;
            itemConfig.header = HeaderedItemConfig.Header.createCopy(component.headerConfig);
            const stack = this.layoutManager.createAndInitContentItem(itemConfig, this);
            stack.addChild(contentItem);
            contentItem = stack;
        }

        if (this.contentItems.length === 0) {
            this.addChild(contentItem);
        } else {
            /*
             * If the contentItem that's being dropped is not dropped on a Stack (cases which just passed above and 
             * which would wrap the contentItem in a Stack) we need to check whether contentItem is a RowOrColumn.
             * If it is, we need to re-wrap it in a Stack like it was when it was dragged by its Tab (it was dragged!).
             */
            if(contentItem.config.type === ItemConfig.Type.row || contentItem.config.type === ItemConfig.Type.column){
                const itemConfig = StackItemConfig.createDefault();
                const stack = this.layoutManager.createContentItem(itemConfig, this);
                stack.addChild(contentItem)
                contentItem = stack
            }

            const type = area.side[0] == 'x' ? ItemConfig.Type.row : ItemConfig.Type.column;
            const dimension = area.side[0] == 'x' ? 'width' : 'height';
            const insertBefore = area.side[1] == '2';
            const column = this.contentItems[0];
            if (!(column instanceof RowOrColumn) || column.type !== type) {
                const itemConfig = ItemConfig.createDefault(type);
                const rowOrColumn = this.layoutManager.createContentItem(itemConfig, this);
                this.replaceChild(column, rowOrColumn);
                rowOrColumn.addChild(contentItem, insertBefore ? 0 : undefined, true);
                rowOrColumn.addChild(column, insertBefore ? undefined : 0, true);
                column.config[dimension] = 50;
                contentItem.config[dimension] = 50;
                rowOrColumn.updateSize();
            } else {
                const sibling = column.contentItems[insertBefore ? 0 : column.contentItems.length - 1]
                column.addChild(contentItem, insertBefore ? 0 : undefined, true);
                sibling.config[dimension] *= 0.5;
                contentItem.config[dimension] = sibling.config[dimension];
                column.updateSize();
            }
        }
    }

    // No ContentItem can dock with groundItem.  However Stack can have a GroundItem parent and Stack requires that
    // its parent implement dock() function.  Accordingly this function is implemented but throws an exception as it should
    // never be called
    dock(): void {
        throw new AssertError('GID87731');
    }

    // No ContentItem can dock with groundItem.  However Stack can have a GroundItem parent and Stack requires that
    // its parent implement validateDocking() function.  Accordingly this function is implemented but throws an exception as it should
    // never be called
    validateDocking(): void {
        throw new AssertError('GIVD87732');
    }

    private updateNodeSize(): void {
        const { width, height } = getElementWidthAndHeight(this._containerElement);

        setElementWidth(this.element, width);
        setElementHeight(this.element, height);

        /*
         * GroundItem can be empty
         */
        if (this.contentItems.length > 0) {
            setElementWidth(this.contentItems[0].element, width);
            setElementHeight(this.contentItems[0].element, height);
        }
    }

    private clearRoot() {
        // Remove existing root if it exists
        const contentItems = this.contentItems;
        switch (contentItems.length) {
            case 0: {
                return;
            }
            case 1: {
                const existingRootContentItem = contentItems[0];
                existingRootContentItem.remove();
                return;
            }
            default: {
                throw new AssertError('GILR07721');
            }
        }
    }
}

/** @internal */
export namespace GroundItem {
    export interface Area extends ContentItem.Area {
        side: keyof typeof Area.Side;
    }

    export namespace Area {
        export const enum Side {
            y2,
            x2,
            y1,
            x1,
        }

        export type Sides = { [side in keyof typeof Side]: keyof typeof Side; }

        export const oppositeSides: Sides = {
            y2: 'y1',
            x2: 'x1',
            y1: 'y2',
            x1: 'x2',
        };
    }

    export const templateHtml = '<div class="lm_goldenlayout lm_item lm_root"></div>';
}
