import { HeaderedItemConfig, ItemConfig, StackItemConfig } from '../config/config';
import { DragProxy } from '../controls/DragProxy';
import { Header } from '../controls/Header';
import { AssertError, UnexpectedNullError } from '../errors/internal-error';
import { AbstractContentItem } from '../items/AbstractContentItem';
import { LayoutManager } from '../LayoutManager';
import { DragListener } from '../utils/DragListener';
import { getJQueryOffset } from '../utils/jquery-legacy';
import { AreaLinkedRect, Side, WidthAndHeight } from '../utils/types';
import {
    createTemplateHtmlElement,
    getElementHeight,
    getElementWidth,
    getElementWidthAndHeight,
    numberToPixels,
    setElementDisplayVisibility
} from '../utils/utils';
import { ComponentItem } from './ComponentItem';



export class Stack extends AbstractContentItem {
    /** @internal */
    private readonly _header: Header;
    /** @internal */
    private readonly _childElementContainer: HTMLElement;
    /** @internal */
    private readonly _maximisedEnabled: boolean;
    /** @internal */
    private _activeComponentItem: ComponentItem;
    /** @internal */
    private _dropSegment: Stack.Segment | null;
    /** @internal */
    private _dropIndex: number | null;
    /** @internal */
    private _contentAreaDimensions: Stack.ContentAreaDimensions | null;
    /** @internal */
    private _headerSideChanged = false;
    /** @internal */
    private _docker: Stack.Docker;

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

    get stackConfig(): StackItemConfig { return this._stackConfig; }
    get childElementContainer(): HTMLElement { return this._childElementContainer; }
    get headerShow(): boolean { return this._header.show; }
    get headerSide(): Side { return this._header.side; }
    get headerLeftRightSided(): boolean { return this._header.leftRightSided; }
    get dockEnabled(): boolean { return this._header.dockEnabled; }
    get docker(): Stack.Docker { return this._docker; }
    get contentAreaDimensions(): Stack.ContentAreaDimensions | null { return this._contentAreaDimensions; }

    /** @internal */
    constructor(layoutManager: LayoutManager, private readonly _stackConfig: StackItemConfig, private _stackParent: Stack.Parent) {
        super(layoutManager, _stackConfig, _stackParent, createTemplateHtmlElement(Stack.templateHtml));

        const itemHeaderConfig = _stackConfig.header;
        const managerHeaderConfig = layoutManager.managerConfig.header;
        const configContent = _stackConfig.content;
        // If stack has only one component, then we can also check this for header settings
        let componentHeaderConfig: HeaderedItemConfig.Header | undefined;
        if (configContent.length !== 1) {
            componentHeaderConfig = undefined;
        } else {
            const firstChildItemConfig = configContent[0];
            componentHeaderConfig = (firstChildItemConfig as HeaderedItemConfig).header; // will be undefined if not component (and wont be stack)
        }

        // check for defined value for each item in order of Stack (this Item), Component (first child), Manager.
        const show = itemHeaderConfig?.show ?? componentHeaderConfig?.show ?? managerHeaderConfig.show;
        const popout = itemHeaderConfig?.popout ?? componentHeaderConfig?.popout ?? managerHeaderConfig.popout;
        const dock = itemHeaderConfig?.dock ?? componentHeaderConfig?.dock ?? managerHeaderConfig.dock;
        const maximise = itemHeaderConfig?.maximise ?? componentHeaderConfig?.maximise ?? managerHeaderConfig.maximise;
        const close = itemHeaderConfig?.close ?? componentHeaderConfig?.close ?? managerHeaderConfig.close;
        const minimise = itemHeaderConfig?.minimise ?? componentHeaderConfig?.minimise ?? managerHeaderConfig.minimise;
        const tabDropdown = itemHeaderConfig?.tabDropdown ?? componentHeaderConfig?.tabDropdown ?? managerHeaderConfig.tabDropdown;
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
            closeEnabled: true,
            closeLabel: close,
            minimiseEnabled: true,
            minimiseLabel: minimise,
            tabDropdownEnabled: tabDropdown !== false,
            tabDropdownLabel: tabDropdown === false ? '' : tabDropdown,
        };

        this._header = new Header(layoutManager,
            this, headerSettings,
            this._stackConfig.isClosable && this.layoutManager.managerConfig.settings.showCloseIcon,
            () => this.remove(),
            () => this.handleDockEvent(),
            () => this.handlePopoutEvent(),
            (ev) => this.toggleMaximise(ev),
            () => this.handleHeaderClickTouchEvent(),
            (item) => this.handleHeaderComponentRemoveEvent(item),
            (item) => this.handleHeaderComponentActivateEvent(item),
            (x, y, dragListener, item) => this.handleHeaderComponentStartDragEvent(x, y, dragListener, item),
            () => this.handleStateChangedEvent(),
        );

        // this._dropZones = {};
        this._dropSegment = null;
        this._contentAreaDimensions = null;
        this._dropIndex = null;

        this.isStack = true;

        this._childElementContainer = createTemplateHtmlElement('<div class="lm_items"></div>');

        this.on('resize', this._resizeListener);
        if (this._maximisedEnabled) {
            this.on('maximised', this._maximisedListener);
            this.on('minimised', this._minimisedListener);
        }

        this.element.addEventListener('mouseenter', this._elementMouseEnterEventListener);
        this.element.addEventListener('mouseleave', this._elementMouseLeaveEventListener);
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
            const activeItemIndex = this._stackConfig.activeItemIndex ?? 0; // should never be undefined
            if (activeItemIndex < 0 || activeItemIndex >= contentItemCount) {
                throw new Error(`ActiveItemIndex out of range: ${activeItemIndex}: ${JSON.stringify(this._stackConfig)}`);
            } else {
                for (let i = 0; i < contentItemCount; i++) {
                    const contentItem = contentItems[i];
                    if (!(contentItem instanceof ComponentItem)) {
                        throw new Error(`Stack Content Item is not of type ComponentItem: ${i}: ${JSON.stringify(this._stackConfig)}`);
                    } else {
                        this._header.createTab(contentItem, i);
                        contentItem.hide();
                    }
                }

                this.setActiveComponentItem(contentItems[activeItemIndex] as ComponentItem);
            }
        }
        
        this._header.updateClosability();
		if (this._stackParent.isRow || this._stackParent.isColumn) {
			this._stackParent.validateDocking();
        }
        
        this.initContentItems();
    }

    /** @deprecated Use {@link setActiveComponentItem} */
    setActiveContentItem(item: AbstractContentItem): void {
        if (!AbstractContentItem.isComponentItem(item)) {
            throw new Error('Stack.setActiveContentItem: item is not a ComponentItem');
        } else {
            this.setActiveComponentItem(item);
        }
    }

    setActiveComponentItem(componentItem: ComponentItem): void {
        if (this._activeComponentItem !== componentItem) {
            if (this.contentItems.indexOf(componentItem) === -1) {
                throw new Error('componentItem is not a child of this stack');
            } else {
                if (this._activeComponentItem !== undefined) {
                    this._activeComponentItem.hide();
                }
                this._activeComponentItem = componentItem;
                this._header.setActiveComponentItem(componentItem);
                componentItem.show();
                this.emit('activeContentItemChanged', componentItem);
                this.layoutManager.emit('activeContentItemChanged', componentItem);
                this.emitBubblingEvent('stateChanged');
            }
        }
    }

    /** @deprecated Use {@link getActiveComponentItem} */
    getActiveContentItem(): AbstractContentItem | null {
        let result: AbstractContentItem | null;
        result = this.getActiveComponentItem();
        if (result === undefined) {
            result = null;
        }
        return result;
    }

    getActiveComponentItem(): ComponentItem {
        return this._activeComponentItem;
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

    addChild(contentItem: AbstractContentItem, index: number): void {
        if(index > this.contentItems.length){
            /* 
             * UGLY PATCH: PR #428, commit a4e84ec5 fixed a bug appearing on touchscreens during the drag of a panel. 
             * The bug was caused by the physical removal of the element on drag: partial documentation is at issue #425. 
             * The fix introduced the function undisplayChild() (called 'undisplay' to differentiate it from jQuery.hide), 
             * which doesn't remove the element but only hides it: that's why when a tab is dragged & dropped into its 
             * original container (at the end), the index here could be off by one.
             */
            /* Better workarounds now exists
             * https://stackoverflow.com/questions/33298828/touch-move-event-dont-fire-after-touch-start-target-is-removed
             */
            index -= 1;
            throw new AssertError('SAC99728'); // undisplayChild() removed so this condition should no longer occur
        }        
        // contentItem = this.layoutManager._$normalizeContentItem(contentItem, this);
        if (!(contentItem instanceof ComponentItem)) {
            throw new AssertError('SACC88532'); // Stacks can only have Component children
        } else {
            super.addChild(contentItem, index);
            this._childElementContainer.appendChild(contentItem.element);
            this._header.createTab(contentItem, index);
            this.setActiveComponentItem(contentItem);
            this.updateSize();
            this._header.updateClosability();
            if (this._stackParent.isRow || this._stackParent.isColumn) {
                this._stackParent.validateDocking();
            }
            this.emitBubblingEvent('stateChanged');
        }
    }

    removeChild(contentItem: AbstractContentItem, keepChild: boolean): void {
        const index = this.contentItems.indexOf(contentItem);
        this._header.removeTab(contentItem);
        const stackWillBeDeleted = this.contentItems.length === 1;
        super.removeChild(contentItem, keepChild);
        if (!stackWillBeDeleted) {
            // there must be at least 1 content item
            if (this._activeComponentItem === contentItem) {
                this.setActiveComponentItem(this.contentItems[Math.max(index - 1, 0)] as ComponentItem);
            }

            this._header.updateClosability();
            if (this._stackParent.isRow || this._stackParent.isColumn) {
                this._stackParent.validateDocking();
            }
            this.emitBubblingEvent('stateChanged');
        }
    }

    // undisplayChild(contentItem: AbstractContentItem): void {
    //     if(this.contentItems.length > 1){
    //         const index = this.contentItems.indexOf(contentItem);
    //         contentItem._$hide && contentItem._$hide()
    //         this.setActiveContentItem(this.contentItems[index === 0 ? index+1 : index-1] as ComponentItem)
    //     } else {
    //         this._header.hideTab(contentItem);
    //         contentItem._$hide();
    //         this._$hide();
    //         super.undisplayChild(contentItem);
    //         if (this._stackParent.isRow || this._stackParent.isColumn) {
    //             this._stackParent.validateDocking();
    //         }
    //     }
    //     this.emitBubblingEvent('stateChanged');
    // }

    /** @internal */
    destroy(): void {
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

    toConfig(): StackItemConfig {
        // cannot rely on ItemConfig.createCopy() to create StackItemConfig as header may have changed
        const result = super.toConfig() as StackItemConfig;
        result.header = this.createHeaderConfig();
        result.activeItemIndex = this.contentItems.indexOf(this._activeComponentItem);
        if (result.activeItemIndex < 0) {
            throw new AssertError('STC69221');
        } else {
            return result;
        }
    }

    /**
     * Ok, this one is going to be the tricky one: The user has dropped {contentItem} onto this stack.
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
    onDrop(contentItem: AbstractContentItem, area: AbstractContentItem.Area): void {
        /*
         * The item was dropped on the header area. Just add it as a child of this stack and
         * get the hell out of this logic
         */
        if (this._dropSegment === Stack.Segment.Header) {
            this.resetHeaderDropZone();
            if (this._dropIndex === null) {
                throw new UnexpectedNullError('SODDI68990');
            } else {
                this.addChild(contentItem, this._dropIndex);
                return;
            }
        }

        /*
         * The stack is empty. Let's just add the element.
         */
        if (this._dropSegment === Stack.Segment.Body) {
            this.addChild(contentItem, 0);
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
            const itemConfig = StackItemConfig.createDefault();
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
        if(contentItem.config.type === ItemConfig.Type.row || contentItem.config.type === ItemConfig.Type.column){
            const itemConfig = StackItemConfig.createDefault();
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
            this.config[dimension] *= 0.5;
            contentItem.config[dimension] = this.config[dimension];
            this._stackParent.updateSize();
            /*
             * This handles items that are dropped on top or bottom of a row or left / right of a column. We need
             * to create the appropriate contentItem for them to live in
             */
        } else {
            const type = isVertical ? ItemConfig.Type.column : ItemConfig.Type.row;
            const itemConfig = ItemConfig.createDefault(type) as ItemConfig;
            const rowOrColumn = this.layoutManager.createContentItem(itemConfig, this);
            this._stackParent.replaceChild(this, rowOrColumn);

            rowOrColumn.addChild(contentItem, insertBefore ? 0 : undefined, true);
            rowOrColumn.addChild(this, insertBefore ? undefined : 0, true);

            this.config[dimension] = 50;
            contentItem.config[dimension] = 50;
            rowOrColumn.updateSize();
        }
        this._stackParent.validateDocking();
    }

    /**
     * If the user hovers above the header part of the stack, indicate drop positions for tabs.
     * otherwise indicate which segment of the body the dragged item would be dropped on
     *
     * @param    x Absolute Screen X
     * @param    y Absolute Screen Y
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
    getArea(): AbstractContentItem.Area | null {
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

    toggleMaximise(ev?: Event): void {
        if (!this.isMaximised) {
            this.dock(false);
        }
        super.toggleMaximise(ev);
    }

    /**
     * Programmatically operate with header position.
     *
     * @param position one of ('top','left','right','bottom') to set or empty to get it.
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
    protected processChildReplaced(index: number, newChild: AbstractContentItem): void {
        if (!(newChild instanceof ComponentItem)) {
            throw new AssertError('SPCR11056'); // Stacks can only have Component children
        } else {
            this._header.tabs[index].componentItem = newChild;
        }
    }

    /** @internal */
    private updateNodeSize(): void {
        if (this.element.style.display !== 'none') {
            const isDocked = this._docker.docked;
            const content: WidthAndHeight = getElementWidthAndHeight(this.element);

            if (this._header.show) {
                const dimension = this._header.leftRightSided ? WidthAndHeight.widthPropertyName : WidthAndHeight.heightPropertyName;
                content[dimension] -= this.layoutManager.managerConfig.dimensions.headerHeight;
            }
            if (isDocked) {
                content[this._docker.dimension] = this._docker.realSize;
            }
            if (!isDocked || this._docker.dimension === WidthAndHeight.heightPropertyName) {
                this._childElementContainer.style.width = numberToPixels(content.width);
            }
            if (!isDocked || this._docker.dimension === WidthAndHeight.widthPropertyName) {
                this._childElementContainer.style.height = numberToPixels(content.height);
            }

            for (let i = 0; i < this.contentItems.length; i++) {
                this.contentItems[i].element.style.width = numberToPixels(content.width);
                this.contentItems[i].element.style.height = numberToPixels(content.height);
            }
            this.emit('resize');
            this.emitBubblingEvent('stateChanged');
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

    private resetHeaderDropZone() {
        this.layoutManager.tabDropPlaceholder.remove();
    }

    /** @internal */
    private setupHeaderPosition() {
        setElementDisplayVisibility(this._header.element, this._header.show);
        this.element.classList.remove('lm_left', 'lm_right', 'lm_bottom');
        if (this._header.leftRightSided) {
            this.element.classList.add('lm_' + this._header.side);
        }

        const adjacentPosition = [Side.right, Side.bottom].includes(this._header.side) ? 'beforeend' : 'afterend';
        this._header.element.insertAdjacentElement(adjacentPosition, this._childElementContainer); // move
        this.updateSize();
    }

    /** @internal */
    private highlightBodyDropZone(segment: Stack.Segment): void {
        if (this._contentAreaDimensions === null) {
            throw new UnexpectedNullError('SHBDZC82265');
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
    setParent(parent: AbstractContentItem): void {
        this._stackParent = parent as Stack.Parent;
        super.setParent(parent);
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
    private handleStateChangedEvent() {
        this.emitBubblingEvent('stateChanged');
    }

    /** @internal */
    private handleHeaderClickTouchEvent() {
        this.select();
    }

    /** @internal */
    private handleHeaderComponentRemoveEvent(item: ComponentItem) {
        this.removeChild(item, false);
    }

    /** @internal */
    private handleHeaderComponentActivateEvent(item: ComponentItem) {
        this.setActiveComponentItem(item);
    }

    /** @internal */
    private handleHeaderComponentStartDragEvent(x: number, y: number, dragListener: DragListener, componentItem: ComponentItem) {
        if (this.isMaximised === true) {
            this.toggleMaximise();
        }
        new DragProxy(
            x,
            y,
            dragListener,
            this.layoutManager,
            componentItem,
            this
        );
    }

    /** @internal */
    private createHeaderConfig() {
        const currentHeaderConfig = this._stackConfig.header;
        if (!this._headerSideChanged) {
            return HeaderedItemConfig.Header.createCopy(currentHeaderConfig);
        } else {
            const show = this._header.show ? this._header.side : false;

            let result = HeaderedItemConfig.Header.createCopy(currentHeaderConfig, show);
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
}

/** @internal */
export namespace Stack {
    export const enum Segment {
        Header = 'header',
        Body = 'body',
        Left = 'left',
        Right = 'right',
        Top = 'top',
        Bottom = 'bottom',
    }

    export interface ContentAreaDimension {
        hoverArea: AreaLinkedRect;
        highlightArea: AreaLinkedRect;
    }

    export type ContentAreaDimensions = {
        [segment: string]: ContentAreaDimension;
    };

    export interface Docker {
        docked: boolean;
        dimension: ItemConfig.HeightOrWidthPropertyName;
        size: number;
        realSize: number;
    }

    export interface Parent extends AbstractContentItem {
        dock(contentItem: Stack, mode?: boolean, collapsed?: boolean): void;
        validateDocking(): void;
    }

    export const templateHtml = '<div class="lm_item lm_stack"></div>';
}
