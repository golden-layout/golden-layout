import { ComponentItemConfig, ItemConfig } from '../config/config';
import { ResolvedComponentItemConfig, ResolvedHeaderedItemConfig, ResolvedItemConfig, ResolvedStackItemConfig } from '../config/resolved-config';
import { Header } from '../controls/header';
import { AssertError, UnexpectedNullError, UnexpectedUndefinedError } from '../errors/internal-error';
import { LayoutManager } from '../layout-manager';
import { DomConstants } from '../utils/dom-constants';
import { DragListener } from '../utils/drag-listener';
import { EventEmitter } from '../utils/event-emitter';
import { getJQueryOffset } from '../utils/jquery-legacy';
import { AreaLinkedRect, ItemType, JsonValue, Side, WidthAndHeight, WidthOrHeightPropertyName } from '../utils/types';
import {
    getElementHeight,
    getElementWidth,
    getElementWidthAndHeight,
    numberToPixels,
    setElementDisplayVisibility
} from '../utils/utils';
import { ComponentItem } from './component-item';
import { ComponentParentableItem } from './component-parentable-item';
import { ContentItem } from './content-item';

/** @public */
export class Stack extends ComponentParentableItem {
    /** @internal */
    private readonly _headerConfig: ResolvedHeaderedItemConfig.Header | undefined;
    /** @internal */
    private readonly _header: Header;
    /** @internal */
    private readonly _childElementContainer: HTMLElement;
    /** @internal */
    private readonly _maximisedEnabled: boolean;
    /** @internal */
    private _activeComponentItem: ComponentItem | undefined;
    /** @internal */
    private _dropSegment: Stack.Segment;
    /** @internal */
    private _dropIndex: number;
    /** @internal */
    private _contentAreaDimensions: Stack.ContentAreaDimensions;
    /** @internal */
    private _headerSideChanged = false;
    /** @internal */
    private _docker: Stack.Docker;
    /** @internal */
    private readonly _initialWantMaximise: boolean;
    /** @internal */
    private _initialActiveItemIndex: number;

    /** @internal */
    private _elementMouseEnterEventListener = () => this.onElementMouseEnter();
    /** @internal */
    private _elementMouseLeaveEventListener = () => this.onElementMouseLeave();
    /** @internal */
    private _resizeListener = () => this.handleResize();
    /** @internal */
    private _maximisedListener = () => this.handleMaximised();
    /** @internal */
    private _minimisedListener = () => this.handleMinimised();

    get childElementContainer(): HTMLElement { return this._childElementContainer; }
    get headerShow(): boolean { return this._header.show; }
    get headerSide(): Side { return this._header.side; }
    get headerLeftRightSided(): boolean { return this._header.leftRightSided; }
    get dockEnabled(): boolean { return this._header.dockEnabled; }
    /** @internal */
    get docker(): Stack.Docker { return this._docker; }
    /** @internal */
    get contentAreaDimensions(): Stack.ContentAreaDimensions | undefined { return this._contentAreaDimensions; }
    /** @internal */
    get initialWantMaximise(): boolean { return this._initialWantMaximise; }
    get isMaximised(): boolean { return this === this.layoutManager.maximisedStack; }

    /** @internal */
    constructor(layoutManager: LayoutManager, config: ResolvedStackItemConfig,
        /** @internal */
        private _stackParent: Stack.Parent
    ) {
        super(layoutManager, config, _stackParent, Stack.createElement(document));

        this._headerConfig = config.header;
        const layoutHeaderConfig = layoutManager.layoutConfig.header;
        const configContent = config.content;
        // If stack has only one component, then we can also check this for header settings
        let componentHeaderConfig: ResolvedHeaderedItemConfig.Header | undefined;
        if (configContent.length !== 1) {
            componentHeaderConfig = undefined;
        } else {
            const firstChildItemConfig = configContent[0];
            componentHeaderConfig = (firstChildItemConfig as ResolvedHeaderedItemConfig).header; // will be undefined if not component (and wont be stack)
        }

        this._initialWantMaximise = config.maximised;
        this._initialActiveItemIndex = config.activeItemIndex ?? 0; // make sure defined

        // check for defined value for each item in order of Stack (this Item), Component (first child), Manager.
        const show = this._headerConfig?.show ?? componentHeaderConfig?.show ?? layoutHeaderConfig.show;
        const popout = this._headerConfig?.popout ?? componentHeaderConfig?.popout ?? layoutHeaderConfig.popout;
        const dock = this._headerConfig?.dock ?? componentHeaderConfig?.dock ?? layoutHeaderConfig.dock;
        const maximise = this._headerConfig?.maximise ?? componentHeaderConfig?.maximise ?? layoutHeaderConfig.maximise;
        const close = this._headerConfig?.close ?? componentHeaderConfig?.close ?? layoutHeaderConfig.close;
        const minimise = this._headerConfig?.minimise ?? componentHeaderConfig?.minimise ?? layoutHeaderConfig.minimise;
        const tabDropdown = this._headerConfig?.tabDropdown ?? componentHeaderConfig?.tabDropdown ?? layoutHeaderConfig.tabDropdown;
        this._maximisedEnabled = maximise !== false;
        const headerSettings: Header.Settings = {
            show: show !== false,
            side: show === false ? Side.top : show,
            popoutEnabled: popout !== false,
            popoutLabel: popout === false ? '' : popout,
            dockEnabled: dock !== false,
            dockLabel: dock === false ? '' : dock,
            maximiseEnabled: this._maximisedEnabled,
            maximiseLabel: maximise === false ? '' : maximise,
            closeEnabled: close !== false,
            closeLabel: close === false ? '' : close,
            minimiseEnabled: true,
            minimiseLabel: minimise,
            tabDropdownEnabled: tabDropdown !== false,
            tabDropdownLabel: tabDropdown === false ? '' : tabDropdown,
        };

        this._header = new Header(layoutManager,
            this, headerSettings,
            config.isClosable && close !== false,
            () => this.getActiveComponentItem(),
            () => this.remove(),
            () => this.handleDockEvent(),
            () => this.handlePopoutEvent(),
            () => this.toggleMaximise(),
            (ev) => this.handleHeaderClickEvent(ev),
            (ev) => this.handleHeaderTouchStartEvent(ev),
            (item) => this.handleHeaderComponentRemoveEvent(item),
            (item) => this.handleHeaderComponentFocusEvent(item),
            (x, y, dragListener, item) => this.handleHeaderComponentStartDragEvent(x, y, dragListener, item),
        );

        // this._dropZones = {};

        this.isStack = true;

        this._childElementContainer = document.createElement('section');
        this._childElementContainer.classList.add(DomConstants.ClassName.Items);

        this.on('resize', this._resizeListener);
        if (this._maximisedEnabled) {
            this.on('maximised', this._maximisedListener);
            this.on('minimised', this._minimisedListener);
        }

        this.element.addEventListener('mouseenter', this._elementMouseEnterEventListener, { passive: true });
        this.element.addEventListener('mouseleave', this._elementMouseLeaveEventListener, { passive: true });
        this.element.appendChild(this._header.element);
        this.element.appendChild(this._childElementContainer);

        this.setUndocked();
        this.setupHeaderPosition();
        this._header.updateClosability();
    }

    /** @internal */
    dock(mode?: boolean): void {
        if (this._header.dockEnabled)
            if (this._stackParent.isColumn || this._stackParent.isColumn) {
                this._stackParent.dock(this, mode);
            }
    }

    updateSize(): void {
        this.updateNodeSize();
        this.updateContentItemsSize();
    }

    /** @internal */
    init(): void {
        if (this.isInitialised === true) return;

        this.updateNodeSize();

        for (let i = 0; i < this.contentItems.length; i++) {
            this._childElementContainer.appendChild(this.contentItems[i].element);
        }

        super.init();

        const contentItems = this.contentItems;
        const contentItemCount = contentItems.length;
        if (contentItemCount > 0) { // contentItemCount will be 0 on drag drop
            if (this._initialActiveItemIndex < 0 || this._initialActiveItemIndex >= contentItemCount) {
                throw new Error(`ActiveItemIndex out of range: ${this._initialActiveItemIndex} id: ${this.id}`);
            } else {
                for (let i = 0; i < contentItemCount; i++) {
                    const contentItem = contentItems[i];
                    if (!(contentItem instanceof ComponentItem)) {
                        throw new Error(`Stack Content Item is not of type ComponentItem: ${i} id: ${this.id}`);
                    } else {
                        this._header.createTab(contentItem, i);
                        contentItem.hide();
                    }
                }

                this.setActiveComponentItem(contentItems[this._initialActiveItemIndex] as ComponentItem, false);

                this._header.updateTabSizes();
            }
        }
        
        this._header.updateClosability();
		if (this._stackParent.isRow || this._stackParent.isColumn) {
			this._stackParent.validateDocking();
        }
        
        this.initContentItems();
    }

    /** @deprecated Use {@link (Stack:class).setActiveComponentItem} */
    setActiveContentItem(item: ContentItem): void {
        if (!ContentItem.isComponentItem(item)) {
            throw new Error('Stack.setActiveContentItem: item is not a ComponentItem');
        } else {
            this.setActiveComponentItem(item, false);
        }
    }

    setActiveComponentItem(componentItem: ComponentItem, focus: boolean, suppressFocusEvent = false): void {
        if (this._activeComponentItem !== componentItem) {
            if (this.contentItems.indexOf(componentItem) === -1) {
                throw new Error('componentItem is not a child of this stack');
            } else {
                if (this._activeComponentItem !== undefined) {
                    this._activeComponentItem.hide();
                }
                this._activeComponentItem = componentItem;
                this._header.processActiveComponentChanged(componentItem);
                componentItem.show();
                this.emit('activeContentItemChanged', componentItem);
                this.layoutManager.emit('activeContentItemChanged', componentItem);
                this.emitStateChangedEvent();
            }
        }

        if (this.focused || focus) {
            this.layoutManager.setFocusedComponentItem(componentItem, suppressFocusEvent);
        }
    }

    /** @deprecated Use {@link (Stack:class).getActiveComponentItem} */
    getActiveContentItem(): ContentItem | null {
        return this.getActiveComponentItem() ?? null;
    }

    getActiveComponentItem(): ComponentItem | undefined {
        return this._activeComponentItem;
    }

    /** @internal */
    focusActiveContentItem(): void {
        this._activeComponentItem?.focus();
    }

    /** @internal */
    setFocusedValue(value: boolean): void {
        this._header.applyFocusedValue(value);
        super.setFocusedValue(value);
    }

    /** @internal */
    setDocked(value: Stack.Docker): void {
        if (!value.docked) {
            throw new AssertError('SSD3396');
        } else {
            this._docker = value;
        }
    }

    /** @internal */
    setUndocked(): void {
        this._docker = {
            docked: false,
            dimension: 'width', // value ignored
            size: 0, // value ignored
            realSize: 0, // value ignored
        }
    }

    /** @internal */
    setDockable(value: boolean): void {
        this._header.setDockable(value);
    }

    /** @internal */
    setRowColumnClosable(value: boolean): void {
        this._header.setRowColumnClosable(value);
    }

    newComponent(componentType: JsonValue, componentState?: JsonValue, title?: string, index?: number): ComponentItem {
        const itemConfig: ComponentItemConfig = {
            type: 'component',
            componentType,
            componentState,
            title,
        };
        return this.newItem(itemConfig, index) as ComponentItem;
    }

    addComponent(componentType: JsonValue, componentState?: JsonValue, title?: string, index?: number): number {
        const itemConfig: ComponentItemConfig = {
            type: 'component',
            componentType,
            componentState,
            title,
        };
        return this.addItem(itemConfig, index);
    }

    newItem(itemConfig: ComponentItemConfig,  index?: number): ContentItem {
        index = this.addItem(itemConfig, index);
        return this.contentItems[index];
    }

    addItem(itemConfig: ComponentItemConfig, index?: number): number {
        this.layoutManager.checkMinimiseMaximisedStack();

        const resolvedItemConfig = ItemConfig.resolve(itemConfig);
        const contentItem = this.layoutManager.createAndInitContentItem(resolvedItemConfig, this);
        return this.addChild(contentItem, index);
    }

    addChild(contentItem: ContentItem, index?: number, focus = false): number {
        if(index !== undefined && index > this.contentItems.length){
            index -= 1;
            throw new AssertError('SAC99728'); // undisplayChild() removed so this condition should no longer occur
        }        

        if (!(contentItem instanceof ComponentItem)) {
            throw new AssertError('SACC88532'); // Stacks can only have Component children
        } else {
            index = super.addChild(contentItem, index);
            this._childElementContainer.appendChild(contentItem.element);
            this._header.createTab(contentItem, index);
            this.setActiveComponentItem(contentItem, focus);
            this._header.updateTabSizes();
            this.updateSize();
            this._header.updateClosability();
            if (this._stackParent.isRow || this._stackParent.isColumn) {
                this._stackParent.validateDocking();
            }
            this.emitStateChangedEvent();

            return index;
        }
    }

    removeChild(contentItem: ContentItem, keepChild: boolean): void {
        const componentItem = contentItem as ComponentItem;
        const index = this.contentItems.indexOf(componentItem);
        const stackWillBeDeleted = this.contentItems.length === 1;

        if (this._activeComponentItem === componentItem) {
            if (componentItem.focused) {
                componentItem.blur();
            }
            if (!stackWillBeDeleted) {
                // At this point we're already sure we have at least one content item left *after*
                // removing contentItem, so we can safely assume index 1 is a valid one if 
                // the index of contentItem is 0, otherwise we just use the previous content item.
                const newActiveComponentIdx = index === 0 ? 1 : index - 1;
                this.setActiveComponentItem(this.contentItems[newActiveComponentIdx] as ComponentItem, false);
            }
        }

        this._header.removeTab(componentItem);

        super.removeChild(componentItem, keepChild);

        if (!stackWillBeDeleted) {
            this._header.updateClosability();
            if (this._stackParent.isRow || this._stackParent.isColumn) {
                this._stackParent.validateDocking();
            }
        }

        this.emitStateChangedEvent();
    }

    /**
     * Maximises the Item or minimises it if it is already maximised
     */
    toggleMaximise(): void {
        if (this.isMaximised) {
            this.minimise();
        } else {
            this.maximise();
        }
    }

    maximise(): void {
        if (!this.isMaximised) {
            this.dock(false);

            this.layoutManager.setMaximisedStack(this);
            this.emitStateChangedEvent();
        }
    }

    minimise(): void {
        if (this.isMaximised) {
            this.layoutManager.setMaximisedStack(undefined);
            this.emitStateChangedEvent();
        }
    }

    /** @internal */
    destroy(): void {
        if (this._activeComponentItem?.focused) {
            this._activeComponentItem.blur();
        }
        super.destroy();
        this.off('resize', this._resizeListener);
        if (this._maximisedEnabled) {
            this.off('maximised', this._maximisedListener);
            this.off('minimised', this._minimisedListener);
        }
        this.element.removeEventListener('mouseenter', this._elementMouseEnterEventListener);
        this.element.removeEventListener('mouseleave', this._elementMouseLeaveEventListener);
        this._header.destroy();
    }

    toConfig(): ResolvedStackItemConfig {
        let activeItemIndex: number | undefined;
        if (this._activeComponentItem) {
            activeItemIndex = this.contentItems.indexOf(this._activeComponentItem);
            if (activeItemIndex < 0) {
                throw new Error('active component item not found in stack');
            }
        }
        if (this.contentItems.length > 0 && activeItemIndex === undefined) {
            throw new Error('expected non-empty stack to have an active component item');
        } else {
            const result: ResolvedStackItemConfig = {
                type: 'stack',
                content: this.calculateConfigContent() as ResolvedComponentItemConfig[],
                width: this.width,
                minWidth: this.minWidth,
                height: this.height,
                minHeight: this.minHeight,
                id: this.id,
                isClosable: this.isClosable,
                maximised: this.isMaximised,
                header: this.createHeaderConfig(),
                activeItemIndex,
            }
            return result;
        }
    }

    /**
     * Ok, this one is going to be the tricky one: The user has dropped a {@link (ContentItem:class)} onto this stack.
     *
     * It was dropped on either the stacks header or the top, right, bottom or left bit of the content area
     * (which one of those is stored in this._dropSegment). Now, if the user has dropped on the header the case
     * is relatively clear: We add the item to the existing stack... job done (might be good to have
     * tab reordering at some point, but lets not sweat it right now)
     *
     * If the item was dropped on the content part things are a bit more complicated. If it was dropped on either the
     * top or bottom region we need to create a new column and place the items accordingly.
     * Unless, of course if the stack is already within a column... in which case we want
     * to add the newly created item to the existing column...
     * either prepend or append it, depending on wether its top or bottom.
     *
     * Same thing for rows and left / right drop segments... so in total there are 9 things that can potentially happen
     * (left, top, right, bottom) * is child of the right parent (row, column) + header drop
     *
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onDrop(contentItem: ContentItem, area: ContentItem.Area): void {
        /*
         * The item was dropped on the header area. Just add it as a child of this stack and
         * get the hell out of this logic
         */
        if (this._dropSegment === Stack.Segment.Header) {
            this.resetHeaderDropZone();
            if (this._dropIndex === undefined) {
                throw new UnexpectedUndefinedError('SODDI68990');
            } else {
                this.addChild(contentItem, this._dropIndex);
                return;
            }
        }

        /*
         * The stack is empty. Let's just add the element.
         */
        if (this._dropSegment === Stack.Segment.Body) {
            this.addChild(contentItem, 0, true);
            return;
        }

        /*
         * The item was dropped on the top-, left-, bottom- or right- part of the content. Let's
         * aggregate some conditions to make the if statements later on more readable
         */
        const isVertical = this._dropSegment === Stack.Segment.Top || this._dropSegment === Stack.Segment.Bottom;
        const isHorizontal = this._dropSegment === Stack.Segment.Left || this._dropSegment === Stack.Segment.Right;
        const insertBefore = this._dropSegment === Stack.Segment.Top || this._dropSegment === Stack.Segment.Left;
        const hasCorrectParent = (isVertical && this._stackParent.isColumn) || (isHorizontal && this._stackParent.isRow);
        const dimension = isVertical ? 'height' : 'width';

        /*
         * The content item can be either a component or a stack. If it is a component, wrap it into a stack
         */
        if (contentItem.isComponent) {
            const itemConfig = ResolvedStackItemConfig.createDefault();
            itemConfig.header = this.createHeaderConfig();
            const stack = this.layoutManager.createAndInitContentItem(itemConfig, this);
            stack.addChild(contentItem);
            contentItem = stack;
        }


        /*
         * If the contentItem that's being dropped is not dropped on a Stack (cases which just passed above and 
         * which would wrap the contentItem in a Stack) we need to check whether contentItem is a RowOrColumn.
         * If it is, we need to re-wrap it in a Stack like it was when it was dragged by its Tab (it was dragged!).
         */
        if(contentItem.type === ItemType.row || contentItem.type === ItemType.column){
            const itemConfig = ResolvedStackItemConfig.createDefault();
            itemConfig.header = this.createHeaderConfig();
            const stack = this.layoutManager.createContentItem(itemConfig, this);
            stack.addChild(contentItem)
            contentItem = stack
        }

        /*
         * If the item is dropped on top or bottom of a column or left and right of a row, it's already
         * layd out in the correct way. Just add it as a child
         */
        if (hasCorrectParent) {
            const index = this._stackParent.contentItems.indexOf(this);
            this._stackParent.addChild(contentItem, insertBefore ? index : index + 1, true);
            this[dimension] *= 0.5;
            contentItem[dimension] = this[dimension];
            this._stackParent.updateSize();
            /*
             * This handles items that are dropped on top or bottom of a row or left / right of a column. We need
             * to create the appropriate contentItem for them to live in
             */
        } else {
            const type = isVertical ? ItemType.column : ItemType.row;
            const itemConfig = ResolvedItemConfig.createDefault(type) as ResolvedItemConfig;
            const rowOrColumn = this.layoutManager.createContentItem(itemConfig, this);
            this._stackParent.replaceChild(this, rowOrColumn);

            rowOrColumn.addChild(contentItem, insertBefore ? 0 : undefined, true);
            rowOrColumn.addChild(this, insertBefore ? undefined : 0, true);

            this[dimension] = 50;
            contentItem[dimension] = 50;
            rowOrColumn.updateSize();
        }
        this._stackParent.validateDocking();
    }

    /**
     * If the user hovers above the header part of the stack, indicate drop positions for tabs.
     * otherwise indicate which segment of the body the dragged item would be dropped on
     *
     * @param x - Absolute Screen X
     * @param y - Absolute Screen Y
     * @internal
     */
    highlightDropZone(x: number, y: number): void {
        for (const key in this._contentAreaDimensions) {
            const segment = key as Stack.Segment;
            const area = this._contentAreaDimensions[segment].hoverArea;

            if (area.x1 < x && area.x2 > x && area.y1 < y && area.y2 > y) {

                if (segment === Stack.Segment.Header) {
                    this._dropSegment = Stack.Segment.Header;
                    this.highlightHeaderDropZone(this._header.leftRightSided ? y : x);
                } else {
                    this.resetHeaderDropZone();
                    this.highlightBodyDropZone(segment);
                }

                return;
            }
        }
    }

    /** @internal */
    getArea(): ContentItem.Area | null {
        if (this.element.style.display === 'none') {
            return null;
        }

        const headerArea = super.getElementArea(this._header.element);
        const contentArea = super.getElementArea(this._childElementContainer);
        if (headerArea === null || contentArea === null) {
            throw new UnexpectedNullError('SGAHC13086');
        }
        const contentWidth = contentArea.x2 - contentArea.x1;
        const contentHeight = contentArea.y2 - contentArea.y1;

        this._contentAreaDimensions = {
            header: {
                hoverArea: {
                    x1: headerArea.x1,
                    y1: headerArea.y1,
                    x2: headerArea.x2,
                    y2: headerArea.y2
                },
                highlightArea: {
                    x1: headerArea.x1,
                    y1: headerArea.y1,
                    x2: headerArea.x2,
                    y2: headerArea.y2
                }
            }
        };

        /**
         * Highlight the entire body if the stack is empty
         */
        if (this.contentItems.length === 0) {

            this._contentAreaDimensions.body = {
                hoverArea: {
                    x1: contentArea.x1,
                    y1: contentArea.y1,
                    x2: contentArea.x2,
                    y2: contentArea.y2
                },
                highlightArea: {
                    x1: contentArea.x1,
                    y1: contentArea.y1,
                    x2: contentArea.x2,
                    y2: contentArea.y2
                }
            };

            return super.getElementArea(this.element);
        } else {
            this._contentAreaDimensions.left = {
                hoverArea: {
                    x1: contentArea.x1,
                    y1: contentArea.y1,
                    x2: contentArea.x1 + contentWidth * 0.25,
                    y2: contentArea.y2
                },
                highlightArea: {
                    x1: contentArea.x1,
                    y1: contentArea.y1,
                    x2: contentArea.x1 + contentWidth * 0.5,
                    y2: contentArea.y2
                }
            };

            this._contentAreaDimensions.top = {
                hoverArea: {
                    x1: contentArea.x1 + contentWidth * 0.25,
                    y1: contentArea.y1,
                    x2: contentArea.x1 + contentWidth * 0.75,
                    y2: contentArea.y1 + contentHeight * 0.5
                },
                highlightArea: {
                    x1: contentArea.x1,
                    y1: contentArea.y1,
                    x2: contentArea.x2,
                    y2: contentArea.y1 + contentHeight * 0.5
                }
            };

            this._contentAreaDimensions.right = {
                hoverArea: {
                    x1: contentArea.x1 + contentWidth * 0.75,
                    y1: contentArea.y1,
                    x2: contentArea.x2,
                    y2: contentArea.y2
                },
                highlightArea: {
                    x1: contentArea.x1 + contentWidth * 0.5,
                    y1: contentArea.y1,
                    x2: contentArea.x2,
                    y2: contentArea.y2
                }
            };

            this._contentAreaDimensions.bottom = {
                hoverArea: {
                    x1: contentArea.x1 + contentWidth * 0.25,
                    y1: contentArea.y1 + contentHeight * 0.5,
                    x2: contentArea.x1 + contentWidth * 0.75,
                    y2: contentArea.y2
                },
                highlightArea: {
                    x1: contentArea.x1,
                    y1: contentArea.y1 + contentHeight * 0.5,
                    x2: contentArea.x2,
                    y2: contentArea.y2
                }
            };

            return super.getElementArea(this.element);
        }
    }

    /**
     * Programmatically operate with header position.
     *
     * @param position -
     *
     * @returns previous header position
     * @internal
     */
    positionHeader(position: Side): void {
        if (this._docker.docked) {
            throw new Error('Can\'t change header position in docked stack');
        }
        if (this._header.side !== position) {
            this._header.setSide(position);
            this._headerSideChanged = true;
            this.setupHeaderPosition();
        }
    }

    /** @internal */
    protected setParent(parent: ContentItem): void {
        this._stackParent = parent as Stack.Parent;
        super.setParent(parent);
    }

    /** @internal */
    private updateNodeSize(): void {
        if (this.element.style.display !== 'none') {
            const isDocked = this._docker.docked;
            const content: WidthAndHeight = getElementWidthAndHeight(this.element);

            if (this._header.show) {
                const dimension = this._header.leftRightSided ? WidthOrHeightPropertyName.width : WidthOrHeightPropertyName.height;
                content[dimension] -= this.layoutManager.layoutConfig.dimensions.headerHeight;
            }
            if (isDocked) {
                content[this._docker.dimension] = this._docker.realSize;
            }
            if (!isDocked || this._docker.dimension === WidthOrHeightPropertyName.height) {
                this._childElementContainer.style.width = numberToPixels(content.width);
            }
            if (!isDocked || this._docker.dimension === WidthOrHeightPropertyName.width) {
                this._childElementContainer.style.height = numberToPixels(content.height);
            }

            for (let i = 0; i < this.contentItems.length; i++) {
                this.contentItems[i].element.style.width = numberToPixels(content.width);
                this.contentItems[i].element.style.height = numberToPixels(content.height);
            }
            this.emit('resize');
            this.emitStateChangedEvent();
        }
    }

    /** @internal */
    private highlightHeaderDropZone(x: number): void {
        const tabsLength = this._header.tabs.length;

        const dropTargetIndicator = this.layoutManager.dropTargetIndicator;
        if (dropTargetIndicator === null) {
            throw new UnexpectedNullError('SHHDZDTI97110');
        }

        let area: AreaLinkedRect;

        // Empty stack
        if (tabsLength === 0) {
            const headerOffset = getJQueryOffset(this._header.element);

            const elementHeight = getElementHeight(this._header.element);
            area = {
                x1: headerOffset.left,
                x2: headerOffset.left + 100,
                y1: headerOffset.top + elementHeight - 20,
                y2: headerOffset.top + elementHeight,
            };
        } else {
            let tabIndex = 0;
            let isAboveTab = false;
            let tabTop: number;
            let tabLeft: number;
            let tabWidth: number;
            let tabElement: HTMLElement;
            do {
                tabElement = this._header.tabs[tabIndex].element;
                const offset = getJQueryOffset(tabElement);
                if (this._header.leftRightSided) {
                    tabLeft = offset.top;
                    tabTop = offset.left;
                    tabWidth = getElementHeight(tabElement);
                } else {
                    tabLeft = offset.left;
                    tabTop = offset.top;
                    tabWidth = getElementWidth(tabElement);
                }

                if (x > tabLeft && x < tabLeft + tabWidth) {
                    isAboveTab = true;
                } else {
                    tabIndex++;
                }
            } while (tabIndex < tabsLength && !isAboveTab);

            if (isAboveTab === false && x < tabLeft) {
                return;
            }

            const halfX = tabLeft + tabWidth / 2;

            if (x < halfX) {
                this._dropIndex = tabIndex;
                tabElement.insertAdjacentElement('beforebegin', this.layoutManager.tabDropPlaceholder);
            } else {
                this._dropIndex = Math.min(tabIndex + 1, tabsLength);
                tabElement.insertAdjacentElement('afterend', this.layoutManager.tabDropPlaceholder);
            }

            const tabDropPlaceholderOffset = getJQueryOffset(this.layoutManager.tabDropPlaceholder);
            const tabDropPlaceholderWidth = getElementWidth(this.layoutManager.tabDropPlaceholder)
            if (this._header.leftRightSided) {
                const placeHolderTop = tabDropPlaceholderOffset.top;
                area = {
                    x1: tabTop,
                    x2: tabTop + tabElement.clientHeight,
                    y1: placeHolderTop,
                    y2: placeHolderTop + tabDropPlaceholderWidth,
                };
            } else {
                const placeHolderLeft = tabDropPlaceholderOffset.left;

                area = {
                    x1: placeHolderLeft,
                    x2: placeHolderLeft + tabDropPlaceholderWidth,
                    y1: tabTop,
                    y2: tabTop + tabElement.clientHeight,
                };
            }
        }

        dropTargetIndicator.highlightArea(area);
        return;
    }

    /** @internal */
    private resetHeaderDropZone() {
        this.layoutManager.tabDropPlaceholder.remove();
    }

    /** @internal */
    private setupHeaderPosition() {
        setElementDisplayVisibility(this._header.element, this._header.show);
        this.element.classList.remove(DomConstants.ClassName.Left, DomConstants.ClassName.Right, DomConstants.ClassName.Bottom);
        if (this._header.leftRightSided) {
            this.element.classList.add('lm_' + this._header.side);
        }

        //if ([Side.right, Side.bottom].includes(this._header.side)) {
        //    // move the header behind the content.
        //    this.element.appendChild(this._header.element);  
        //}
        this.updateSize();
    }

    /** @internal */
    private highlightBodyDropZone(segment: Stack.Segment): void {
        if (this._contentAreaDimensions === undefined) {
            throw new UnexpectedUndefinedError('SHBDZC82265');
        } else {
            const highlightArea = this._contentAreaDimensions[segment].highlightArea;
            const dropTargetIndicator = this.layoutManager.dropTargetIndicator;
            if (dropTargetIndicator === null) {
                throw new UnexpectedNullError('SHBDZD96110');
            } else {
                dropTargetIndicator.highlightArea(highlightArea);
                this._dropSegment = segment;
            }
        }
    }

    /** @internal */
    private handleResize() {
        this._header.updateTabSizes()
    }

    /** @internal */
    private handleMaximised() {
        this._header.processMaximised();
    }

    /** @internal */
    private handleMinimised() {
        this._header.processMinimised();
    }

    /** @internal */
    private onElementMouseEnter() {
        if (this._docker.docked) {
            this._childElementContainer.style[this._docker.dimension] = numberToPixels(this._docker.realSize);
        }
    }

    /** @internal */
    private onElementMouseLeave() {
        if (this._docker.docked) {
            this._childElementContainer.style[this._docker.dimension] = numberToPixels(0);
        }
    }

    /** @internal */
    private handleDockEvent() {
        this.dock();
    }

    /** @internal */
    private handlePopoutEvent() {
        this.popout();
    }

    /** @internal */
    private handleHeaderClickEvent(ev: MouseEvent) {
        const eventName = EventEmitter.headerClickEventName;
        const bubblingEvent = new EventEmitter.ClickBubblingEvent(eventName, this, ev);
        this.emit(eventName, bubblingEvent);
    }

    /** @internal */
    private handleHeaderTouchStartEvent(ev: TouchEvent) {
        const eventName = EventEmitter.headerTouchStartEventName;
        const bubblingEvent = new EventEmitter.TouchStartBubblingEvent(eventName, this, ev);
        this.emit(eventName, bubblingEvent);
    }

    /** @internal */
    private handleHeaderComponentRemoveEvent(item: ComponentItem) {
        this.removeChild(item, false);
    }

    /** @internal */
    private handleHeaderComponentFocusEvent(item: ComponentItem) {
        this.setActiveComponentItem(item, true);
    }

    /** @internal */
    private handleHeaderComponentStartDragEvent(x: number, y: number, dragListener: DragListener, componentItem: ComponentItem) {
        if (this.isMaximised === true) {
            this.toggleMaximise();
        }
        this.layoutManager.startComponentDrag(x, y, dragListener, componentItem, this);
    }

    /** @internal */
    private createHeaderConfig() {
        if (!this._headerSideChanged) {
            return ResolvedHeaderedItemConfig.Header.createCopy(this._headerConfig);
        } else {
            const show = this._header.show ? this._header.side : false;

            let result = ResolvedHeaderedItemConfig.Header.createCopy(this._headerConfig, show);
            if (result === undefined) {
                result = {
                    show,
                    popout: undefined,
                    dock: undefined,
                    maximise: undefined,
                    close: undefined,
                    minimise: undefined,
                    tabDropdown: undefined,
                };
            }
            return result;
        }
    }

    /** @internal */
    private emitStateChangedEvent() {
        this.emitBaseBubblingEvent('stateChanged');
    }
}

/** @public */
export namespace Stack {
    /** @internal */
    export const enum Segment {
        Header = 'header',
        Body = 'body',
        Left = 'left',
        Right = 'right',
        Top = 'top',
        Bottom = 'bottom',
    }

    /** @internal */
    export interface ContentAreaDimension {
        hoverArea: AreaLinkedRect;
        highlightArea: AreaLinkedRect;
    }

    /** @internal */
    export type ContentAreaDimensions = {
        [segment: string]: ContentAreaDimension;
    };

    /** @internal */
    export interface Docker {
        docked: boolean;
        dimension: WidthOrHeightPropertyName;
        size: number;
        realSize: number;
    }

    export interface Parent extends ContentItem {
        dock(contentItem: Stack, mode?: boolean, collapsed?: boolean): void;
        validateDocking(): void;
    }

    /** @internal */
    export function createElement(document: Document): HTMLDivElement {
        const element = document.createElement('div');
        element.classList.add(DomConstants.ClassName.Item);
        element.classList.add(DomConstants.ClassName.Stack);
        return element;
    } 
}
