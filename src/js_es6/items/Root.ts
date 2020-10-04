import { HeaderedItemConfig, ItemConfig, StackItemConfig } from '../config/config';
import { AbstractContentItem } from '../items/AbstractContentItem';
import { RowOrColumn } from '../items/RowOrColumn';
import { LayoutManager } from '../LayoutManager';
import { Area } from '../utils/types';
import { createTemplateHtmlElement, getElementHeight, getElementWidth, setElementHeight, setElementWidth } from '../utils/utils';
import { Component } from './Component';

export class Root extends AbstractContentItem {
    private readonly _childElementContainer;
    private _containerElement: HTMLElement;

    constructor(layoutManager: LayoutManager, config: ItemConfig, containerElement: HTMLElement) {
      
        super(layoutManager, config, null);

        this.isRoot = true;
        this.element = createTemplateHtmlElement('<div class="lm_goldenlayout lm_item lm_root"></div>');
        this._childElementContainer = this.element;
        this._containerElement = containerElement;
        this._containerElement.appendChild(this.element);
    }

    _$init(): void {
        if (this.isInitialised === true) return;

        this.setSize();

        for (let i = 0; i < this.contentItems.length; i++) {
            this._childElementContainer.appendChild(this.contentItems[i].element);
        }

        super._$init();
    }

    addChild(contentItem: AbstractContentItem, index?: number): void {
        if (this.contentItems.length > 0) {
            throw new Error('Root node can only have a single child');
        }

        // contentItem = this.layoutManager._$normalizeContentItem(contentItem, this);
        this._childElementContainer.appendChild(contentItem.element);
        super.addChild(contentItem, index);

        this.callDownwards('setSize');
        this.emitBubblingEvent('stateChanged');
    }

    setSize(width?: number, height?: number): void {
        width = (width === undefined) ? getElementWidth(this._containerElement) : width;
        height = (height === undefined) ? getElementHeight(this._containerElement) : height;

        setElementWidth(this.element, width);
        setElementHeight(this.element, height);

        /*
         * Root can be empty
         */
        if (this.contentItems.length > 0) {
            setElementWidth(this.contentItems[0].element, width);
            setElementHeight(this.contentItems[0].element, height);
        }
    }

    _$highlightDropZone(x: number, y: number, area: Area): void {
        this.layoutManager.tabDropPlaceholder.remove();
        super._$highlightDropZone(x, y, area);
    }

    _$onDrop(contentItem: AbstractContentItem, area: Area): void {

        if (contentItem.isComponent) {
            const itemConfig = StackItemConfig.createDefault();
            // since ItemConfig.contentItems not set up, we need to add header from Component
            const component = contentItem as Component;
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
                rowOrColumn.callDownwards('setSize');
            } else {
                const sibling = column.contentItems[insertBefore ? 0 : column.contentItems.length - 1]
                column.addChild(contentItem, insertBefore ? 0 : undefined, true);
                sibling.config[dimension] *= 0.5;
                contentItem.config[dimension] = sibling.config[dimension];
                column.callDownwards('setSize');
            }
        }
    }
}
