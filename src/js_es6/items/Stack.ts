import { HeaderedItemConfig, ItemConfig, StackItemConfig } from '../config/config';
import { Header } from '../controls/Header';
import { AssertError, UnexpectedNullError } from '../errors/internal-error';
import { AbstractContentItem } from '../items/AbstractContentItem';
import { LayoutManager } from '../LayoutManager';
import { getJQueryOffset } from '../utils/jquery-legacy';
import { AreaLinkedRect, Side } from '../utils/types';
import {
    createTemplateHtmlElement,
    getElementHeight,
    getElementWidth,
    numberToPixels,
    setElementDisplayVisibility
} from '../utils/utils';
import { Component } from './Component';



export class Stack extends AbstractContentItem {
    private readonly _header: Header;
    private _activeContentItem: AbstractContentItem | null;
    private _dropSegment: Stack.Segment | null;
    private _dropIndex: number | null;
    private _contentAreaDimensions: Stack.ContentAreaDimensions | null;
    private _headerSideChanged = false;
    private _docker: Stack.Docker;

    private _elementMouseEnterEventListener = () => this.onElementMouseEnter();
    private _elementMouseLeaveEventListener = () => this.onElementMouseLeave();


    readonly childElementContainer: HTMLElement;

    get stackConfig(): StackItemConfig { return this._stackConfig; }
    get headerShow(): boolean { return this._header.show; }
    get headerSide(): Side { return this._header.side; }
    get headerLeftRightSided(): boolean { return this._header.leftRightSided; }
    get dockEnabled(): boolean { return this._header.dockEnabled; }
    get docker(): Stack.Docker { return this._docker; }
    get contentAreaDimensions(): Stack.ContentAreaDimensions | null { return this._contentAreaDimensions; }

    constructor(layoutManager: LayoutManager, private readonly _stackConfig: StackItemConfig, private _stackParent: Stack.Parent) {
        super(layoutManager, _stackConfig, _stackParent);

        this.element = createTemplateHtmlElement('<div class="lm_item lm_stack"></div>');
        this._activeContentItem = null;
        const itemHeaderConfig = _stackConfig.header;
        const managerHeaderConfig = layoutManager.config.header;
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
        const headerSettings: Header.Settings = {
            show: show !== false,
            side: show === false ? Side.top : show,
            popoutEnabled: popout !== false,
            popoutLabel: popout === false ? '' : popout,
            dockEnabled: dock !== false,
            dockLabel: dock === false ? '' : dock,
            maximiseEnabled: maximise !== false,
            maximiseLabel: maximise === false ? '' : maximise,
            closeEnabled: true,
            closeLabel: close,
            minimiseEnabled: true,
            minimiseLabel: minimise,
            tabDropdownEnabled: tabDropdown !== false,
            tabDropdownLabel: tabDropdown === false ? '' : tabDropdown,
        };

        this._header = new Header(layoutManager, this, headerSettings, () => this.remove());

        // this._dropZones = {};
        this._dropSegment = null;
        this._contentAreaDimensions = null;
        this._dropIndex = null;

        this.isStack = true;

        this.childElementContainer = createTemplateHtmlElement('<div class="lm_items"></div>');

        this.element.addEventListener('mouseenter', this._elementMouseEnterEventListener);
        this.element.addEventListener('mouseleave', this._elementMouseLeaveEventListener);
        this.element.appendChild(this._header.element);
        this.element.appendChild(this.childElementContainer);

        this.setUndocked();
        this.setupHeaderPosition();
        this.validateClosability();
    }

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

    private updateNodeSize(): void {
        if (this.element.style.display === 'none') return;
        const isDocked = this._docker.docked,
            content = {
                width: getElementWidth(this.element),
                height: getElementHeight(this.element),
            };

        if (this._header.show) {
            content[this._header.leftRightSided ? 'width' : 'height'] -= this.layoutManager.config.dimensions.headerHeight;
        }
        if (isDocked) {
            content[this._docker.dimension] = this._docker.realSize;
        }
        if (!isDocked || this._docker.dimension === 'height') {
            this.childElementContainer.style.width = numberToPixels(content.width);
        }
        if (!isDocked || this._docker.dimension === 'width') {
            this.childElementContainer.style.height = numberToPixels(content.height);
        }

        for (let i = 0; i < this.contentItems.length; i++) {
            this.contentItems[i].element.style.width = numberToPixels(content.width);
            this.contentItems[i].element.style.height = numberToPixels(content.height);
        }
        this.emit('resize');
        this.emitBubblingEvent('stateChanged');
    }

    _$init(): void {
        if (this.isInitialised === true) return;

        this.updateNodeSize();

        for (let i = 0; i < this.contentItems.length; i++) {
            this.childElementContainer.appendChild(this.contentItems[i].element);
        }

        super._$init();

        for (let i = 0; i < this.contentItems.length; i++) {
            const contentItem = this.contentItems[i];
            if (!(contentItem instanceof Component)) {
                throw new AssertError('SICI72110'); // Stacks can only have Component children
            } else {
                this._header.createTab(contentItem, i);
                contentItem._$hide();
            }
        }

        if (this.contentItems.length > 0) {
            const initialItem = this.contentItems[this._stackConfig.activeItemIndex ?? 0];

            if (!initialItem) {
                throw new Error('Configured activeItemIndex out of bounds');
            }

            this.setActiveContentItem(initialItem as Component);
        }
        this.validateClosability();		
		if (this._stackParent.isRow || this._stackParent.isColumn) {
			this._stackParent._validateDocking();
        }
        
        this.initContentItems();
    }

    setActiveContentItem(contentItem: Component): void {
        if (this._activeContentItem === contentItem) return;

        if (this.contentItems.indexOf(contentItem) === -1) {
            throw new Error('contentItem is not a child of this stack');
        }

        if (this._activeContentItem !== null) {
            this._activeContentItem._$hide();
        }

        this._activeContentItem = contentItem;
        this._header.setActiveContentItem(contentItem);
        contentItem._$show();
        this.emit('activeContentItemChanged', contentItem);
        this.layoutManager.emit('activeContentItemChanged', contentItem);
        this.emitBubblingEvent('stateChanged');
    }

    getActiveContentItem(): AbstractContentItem | null {
        return this._header.activeContentItem;
    }

    setDocked(value: Stack.Docker): void {
        if (!value.docked) {
            throw new AssertError('SSD3396');
        } else {
            this._docker = value;
        }
    }

    setUndocked(): void {
        this._docker = {
            docked: false,
            dimension: 'width', // value ignored
            size: 0, // value ignored
            realSize: 0, // value ignored
        }
    }

    setDockable(value: boolean): void {
        this._header.setDockable(value);
    }

    setClosable(value: boolean): void {
        this._header.setClosable(value);
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
            index -= 1
        }        
        // contentItem = this.layoutManager._$normalizeContentItem(contentItem, this);
        if (!(contentItem instanceof Component)) {
            throw new AssertError('SACC88532'); // Stacks can only have Component children
        } else {
            super.addChild(contentItem, index);
            this.childElementContainer.appendChild(contentItem.element);
            this._header.createTab(contentItem, index);
            this.setActiveContentItem(contentItem);
            this.updateSize();
            this.validateClosability();
            if (this._stackParent.isRow || this._stackParent.isColumn) {
                this._stackParent._validateDocking();
            }
            this.emitBubblingEvent('stateChanged');
        }
    }

    removeChild(contentItem: AbstractContentItem, keepChild: boolean): void {
        const index = this.contentItems.indexOf(contentItem);
        super.removeChild(contentItem, keepChild);
        this._header.removeTab(contentItem);
        if (this._header.activeContentItem === contentItem) {
            if (this.contentItems.length > 0) {
                this.setActiveContentItem(this.contentItems[Math.max(index - 1, 0)] as Component);
            } else {
                this._activeContentItem = null;
            }
        } else if (this._stackConfig.activeItemIndex >= this.contentItems.length) {
			if (this.contentItems.length > 0) {
                const activeContentItem = this.getActiveContentItem();
                if (activeContentItem !== null) {
                    const activeIndex = this.contentItems.indexOf(activeContentItem);
                    this._stackConfig.activeItemIndex = Math.max(activeIndex, 0);
                }
			}
		}

        this.validateClosability();
		if (this._stackParent.isRow || this._stackParent.isColumn) {
			this._stackParent._validateDocking();
        }
        this.emitBubblingEvent('stateChanged');
    }

    undisplayChild(contentItem: AbstractContentItem): void {
        if(this.contentItems.length > 1){
            const index = this.contentItems.indexOf(contentItem);
            contentItem._$hide && contentItem._$hide()
            this.setActiveContentItem(this.contentItems[index === 0 ? index+1 : index-1] as Component)
        } else {
            this._header.hideTab(contentItem);
            contentItem._$hide && contentItem._$hide()
            super.undisplayChild(contentItem);
            if (this._stackParent.isRow || this._stackParent.isColumn) {
                this._stackParent._validateDocking();
            }
        }
        this.emitBubblingEvent('stateChanged');
    }

    protected processChildReplaced(index: number, newChild: AbstractContentItem): void {
        if (!(newChild instanceof Component)) {
            throw new AssertError('SPCR11056'); // Stacks can only have Component children
        } else {
            this._header.tabs[index].component = newChild;
        }
    }

    /**
     * Validates that the stack is still closable or not. If a stack is able
     * to close, but has a non closable component added to it, the stack is no
     * longer closable until all components are closable.
     */
    private validateClosability() {
        let isClosable = this._header.isClosable();

        const len = this.contentItems.length;
        for (let i = 0; i < len; i++) {
            if (!isClosable) {
                break;
            }

            isClosable = this.contentItems[i].config.isClosable;
        }

        this._header.setClosable(isClosable);
    }

    _$destroy(): void {
        super._$destroy();
        this._header.destroy();
        this.element.removeEventListener('mouseenter', this._elementMouseEnterEventListener);
        this.element.removeEventListener('mouseleave', this._elementMouseLeaveEventListener);
    }

    toConfig(): StackItemConfig {
        // cannot rely on ItemConfig.createCopy() to create StackItemConfig as header may have changed
        const result = super.toConfig() as StackItemConfig;
        result.header = this.createHeaderConfig();
        return result;
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
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _$onDrop(contentItem: AbstractContentItem, area: AbstractContentItem.Area): void {
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
        this._stackParent._validateDocking();
    }

    /**
     * If the user hovers above the header part of the stack, indicate drop positions for tabs.
     * otherwise indicate which segment of the body the dragged item would be dropped on
     *
     * @param    x Absolute Screen X
     * @param    y Absolute Screen Y
     */
    _$highlightDropZone(x: number, y: number): void {
        for (const key in this._contentAreaDimensions) {
            const segment = key as Stack.Segment;
            const area = this._contentAreaDimensions[segment].hoverArea;

            if (area.x1 < x && area.x2 > x && area.y1 < y && area.y2 > y) {

                if (segment === Stack.Segment.Header) {
                    this._dropSegment = Stack.Segment.Header;
                    this._highlightHeaderDropZone(this._header.leftRightSided ? y : x);
                } else {
                    this.resetHeaderDropZone();
                    this._highlightBodyDropZone(segment);
                }

                return;
            }
        }
    }

    getArea(): AbstractContentItem.Area | null {
        if (this.element.style.display === 'none') {
            return null;
        }

        const headerArea = super.getElementArea(this._header.element);
        const contentArea = super.getElementArea(this.childElementContainer);
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
         * If this Stack is a parent to rows, columns or other stacks only its
         * header is a valid dropzone.
         */
        if (this._activeContentItem && this._activeContentItem.isComponent === false) {
            return headerArea;
        }

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

    _highlightHeaderDropZone(x: number): void {
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

    toggleMaximise(): void {
        if (!this.isMaximised)
            this.dock(false);
        super.toggleMaximise();
    }

    private setupHeaderPosition() {
        setElementDisplayVisibility(this._header.element, this._header.show);
        this.element.classList.remove('lm_left', 'lm_right', 'lm_bottom');
        if (this._header.leftRightSided) {
            this.element.classList.add('lm_' + this._header.side);
        }

        const adjacentPosition = [Side.right, Side.bottom].includes(this._header.side) ? 'beforeend' : 'afterend';
        this._header.element.insertAdjacentElement(adjacentPosition, this.childElementContainer); // move
        this.updateSize();
    }

    /**
     * Programmatically operate with header position.
     *
     * @param position one of ('top','left','right','bottom') to set or empty to get it.
     *
     * @returns previous header position
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

    _highlightBodyDropZone(segment: Stack.Segment): void {
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

    setParent(parent: AbstractContentItem): void {
        this._stackParent = parent as Stack.Parent;
        super.setParent(parent);
    }

    private onElementMouseEnter() {
        if (this._docker.docked) {
            this.childElementContainer.style[this._docker.dimension] = numberToPixels(this._docker.realSize);
        }
    }

    private onElementMouseLeave() {
        if (this._docker.docked) {
            this.childElementContainer.style[this._docker.dimension] = numberToPixels(0);
        }
    }

    private createHeaderConfig() {
        const currentHeaderConfig = this._stackConfig.header;
        if (!this._headerSideChanged) {
            return HeaderedItemConfig.Header.createCopy(currentHeaderConfig);
        } else {
            const show = this._header.show ? this._header.side : false;

            let result = HeaderedItemConfig.Header.createCopy(currentHeaderConfig);
            if (result !== undefined) {
                result.show = show;
            } else {
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
        _validateDocking(): void;
    }
}