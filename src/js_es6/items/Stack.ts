import { HeaderedItemConfig, StackItemConfig } from '../config/config';
import { Header } from '../controls/Header';
import { AbstractContentItem } from '../items/AbstractContentItem';
import { RowOrColumn } from '../items/RowOrColumn';
import { LayoutManager } from '../LayoutManager';
import {
    createTemplateHtmlElement, fnBind,

    getElementHeight,

    getElementWidth,

    indexOf,
    numberToPixels
} from '../utils/utils';



export class Stack extends AbstractContentItem {
    private _side: Stack.Side;
    private _sided: boolean;
    private _header: Header.Settings; // config header
    private _activeContentItem: AbstractContentItem | null;

    header: Header;
    childElementContainer: HTMLElement;

    constructor(layoutManager: LayoutManager, config: StackItemConfig, parent: AbstractContentItem) {
        super(layoutManager, config, parent)

        this.element = createTemplateHtmlElement('<div class="lm_item lm_stack"></div>', 'div');
        this._activeContentItem = null;
        const itemHeaderConfig = config.header;
        const managerHeaderConfig = layoutManager.config.header;
        const configContent = config.content;
        let componentHeaderConfig: HeaderedItemConfig.Header | undefined;
        if (configContent.length === 0) {
            componentHeaderConfig = undefined;
        } else {
            const firstChildItemConfig = configContent[0];
            componentHeaderConfig = (firstChildItemConfig as HeaderedItemConfig).header; // will be undefined if not component (or Stack)
        }

        // check for defined value for each item in order of Stack (this Item), Component (first child), Manager.
        this._header = {
            show: itemHeaderConfig?.show ?? componentHeaderConfig?.show ?? managerHeaderConfig.show,
            popoutLabel: 
                Header.Settings.resolveLabel(itemHeaderConfig?.popout ?? componentHeaderConfig?.popout ?? managerHeaderConfig.popout),
            dockLabel: 
                Header.Settings.resolveLabel(itemHeaderConfig?.dock ?? componentHeaderConfig?.dock ?? managerHeaderConfig.dock),
            maximiseLabel:
                Header.Settings.resolveLabel(itemHeaderConfig?.maximise ?? componentHeaderConfig?.maximise ?? managerHeaderConfig.maximise),
            closeLabel:
                Header.Settings.resolveLabel(itemHeaderConfig?.close ?? componentHeaderConfig?.close ?? managerHeaderConfig.close),
            minimiseLabel:
                Header.Settings.resolveLabel(itemHeaderConfig?.minimise ?? componentHeaderConfig?.minimise ?? managerHeaderConfig.minimise),
            tabDropdownLabel:
                Header.Settings.resolveLabel(
                    itemHeaderConfig?.tabDropdown ?? componentHeaderConfig?.tabDropdown ?? managerHeaderConfig.tabDropdown
                ),
        };  

        this._dropZones = {};
        this._dropSegment = null;
        this._contentAreaDimensions = null;
        this._dropIndex = null;

        this.isStack = true;

        this.childElementContainer = createTemplateHtmlElement('<div class="lm_items"></div>', 'div');
        this.header = new Header(layoutManager, this, this._header);

        this.element.on('mouseleave mouseenter', fnBind(function(event) {
            if (this._docker && this._docker.docked)
                this.childElementContainer[this._docker.dimension](event.type == 'mouseenter' ? this._docker.realSize : 0);
        }, this));
        this.element.append(this.header.element);
        this.element.append(this.childElementContainer);
        this._setupHeaderPosition();
        this._$validateClosability();
    }

    dock(mode: boolean): void {
        if (this._header.dockLabel !== undefined)
            if (this.parent instanceof RowOrColumn)
                this.parent.dock(this, mode);
    }

    setSize() {
        if (this.element.style.display === 'none') return;
        const isDocked = this._docker && this._docker.docked,
            content = {
                width: getElementWidth(this.element),
                height: getElementHeight(this.element),
            };

        if (this._header.show)
            content[this._sided ? 'width' : 'height'] -= this.layoutManager.config.dimensions.headerHeight;
        if (isDocked)
            content[this._docker.dimension] = this._docker.realSize;
        if (!isDocked || this._docker.dimension == 'height')
            this.childElementContainer.style.width = numberToPixels(content.width);
        if (!isDocked || this._docker.dimension == 'width')
            this.childElementContainer.style.height = numberToPixels(content.height);

        for (let i = 0; i < this.contentItems.length; i++) {
            this.contentItems[i].element.style.width = numberToPixels(content.width);
            this.contentItems[i].element.style.height = numberToPixels(content.height);
        }
        this.emit('resize');
        this.emitBubblingEvent('stateChanged');
    }

    _$init() {
        if (this.isInitialised === true) return;

        super._$init();

        for (let i = 0; i < this.contentItems.length; i++) {
            this.header.createTab(this.contentItems[i]);
            this.contentItems[i]._$hide();
        }

        if (this.contentItems.length > 0) {
            const initialItem = this.contentItems[this.config.activeItemIndex || 0];

            if (!initialItem) {
                throw new Error('Configured activeItemIndex out of bounds');
            }

            this.setActiveContentItem(initialItem);
        }
        this._$validateClosability();		
		if (this.parent instanceof RowOrColumn) {
			this.parent._validateDocking();
        }
        
        this.initContentItems();
    }

    setActiveContentItem(contentItem: AbstractContentItem): void {
        if (this._activeContentItem === contentItem) return;

        if (this.contentItems.indexOf(contentItem) === -1) {
            throw new Error('contentItem is not a child of this stack');
        }

        if (this._activeContentItem !== null) {
            this._activeContentItem._$hide();
        }

        this._activeContentItem = contentItem;
        this.header.setActiveContentItem(contentItem);
        contentItem._$show();
        this.emit('activeContentItemChanged', contentItem);
        this.layoutManager.emit('activeContentItemChanged', contentItem);
        this.emitBubblingEvent('stateChanged');
    }

    getActiveContentItem(): AbstractContentItem {
        return this.header.activeContentItem;
    }

    addChild(contentItem, index) {
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
        contentItem = this.layoutManager._$normalizeContentItem(contentItem, this);
        super.addChild(contentItem, index);
        this.childElementContainer.append(contentItem.element);
        this.header.createTab(contentItem, index);
        this.setActiveContentItem(contentItem);
        this.callDownwards('setSize');
        this._$validateClosability();
        if (this.parent instanceof RowOrColumn)
            this.parent._validateDocking();
        this.emitBubblingEvent('stateChanged');
    }

    removeChild(contentItem: AbstractContentItem, keepChild: boolean): void {
        const index = this.contentItems.indexOf(contentItem);
        super.removeChild(contentItem, keepChild);
        this.header.removeTab(contentItem);
        if (this.header.activeContentItem === contentItem) {
            if (this.contentItems.length > 0) {
                this.setActiveContentItem(this.contentItems[Math.max(index - 1, 0)]);
            } else {
                this._activeContentItem = null;
            }
        } else if (this.config.activeItemIndex >= this.contentItems.length) {
			if (this.contentItems.length > 0) {
				const activeIndex = this.contentItems.indexOf(this.getActiveContentItem());
				this.config.activeItemIndex = Math.max(activeIndex, 0);
			}
		}

        this._$validateClosability();
        if (this.parent instanceof RowOrColumn)
            this.parent._validateDocking();
        this.emitBubblingEvent('stateChanged');
    }

    undisplayChild(contentItem: AbstractContentItem): void {
        if(this.contentItems.length > 1){
            var index = indexOf(contentItem, this.contentItems)
            contentItem._$hide && contentItem._$hide()
            this.setActiveContentItem(this.contentItems[index === 0 ? index+1 : index-1])
        } else {
            this.header.hideTab(contentItem);
            contentItem._$hide && contentItem._$hide()
            super.undisplayChild(contentItem);
            if (this.parent instanceof RowOrColumn)
                this.parent._validateDocking();
        }
        this.emitBubblingEvent('stateChanged');
    }

    protected processChildReplaced(index: number, newChild: AbstractContentItem): void {
        this.header.tabs[index].contentItem = newChild;
    }

    /**
     * Validates that the stack is still closable or not. If a stack is able
     * to close, but has a non closable component added to it, the stack is no
     * longer closable until all components are closable.
     *
     * @returns {void}
     */
    _$validateClosability() {
        var contentItem,
            isClosable,
            len,
            i;

        isClosable = this.header.isClosable();

        for (i = 0, len = this.contentItems.length; i < len; i++) {
            if (!isClosable) {
                break;
            }

            isClosable = this.contentItems[i].config.isClosable;
        }

        this.header._$setClosable(isClosable);
    }

    _$destroy(): void {
        super._$destroy();
        this.header._$destroy();
        this.element.off('mouseenter mouseleave');
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
    _$onDrop(contentItem: AbstractContentItem): void {
        /*
         * The item was dropped on the header area. Just add it as a child of this stack and
         * get the hell out of this logic
         */
        if (this._dropSegment === 'header') {
            this.resetHeaderDropZone();
            this.addChild(contentItem, this._dropIndex);
            return;
        }

        /*
         * The stack is empty. Let's just add the element.
         */
        if (this._dropSegment === 'body') {
            this.addChild(contentItem);
            return;
        }

        /*
         * The item was dropped on the top-, left-, bottom- or right- part of the content. Let's
         * aggregate some conditions to make the if statements later on more readable
         */
        var isVertical = this._dropSegment === 'top' || this._dropSegment === 'bottom',
            isHorizontal = this._dropSegment === 'left' || this._dropSegment === 'right',
            insertBefore = this._dropSegment === 'top' || this._dropSegment === 'left',
            hasCorrectParent = (isVertical && this.parent.isColumn) || (isHorizontal && this.parent.isRow),
            type = isVertical ? 'column' : 'row',
            dimension = isVertical ? 'height' : 'width',
            index,
            stack,
            rowOrColumn;

        /*
         * The content item can be either a component or a stack. If it is a component, wrap it into a stack
         */
        if (contentItem.isComponent) {
            stack = this.layoutManager.createContentItem({
                type: 'stack',
                header: contentItem.config.header || {}
            }, this);
            stack._$init();
            stack.addChild(contentItem);
            contentItem = stack;
        }


        /*
         * If the contentItem that's being dropped is not dropped on a Stack (cases which just passed above and 
         * which would wrap the contentItem in a Stack) we need to check whether contentItem is a RowOrColumn.
         * If it is, we need to re-wrap it in a Stack like it was when it was dragged by its Tab (it was dragged!).
         */
        if(contentItem.config.type === 'row' || contentItem.config.type === 'column'){
            stack = this.layoutManager.createContentItem({
                type: 'stack'
            }, this)
            stack.addChild(contentItem)
            contentItem = stack
        }

        /*
         * If the item is dropped on top or bottom of a column or left and right of a row, it's already
         * layd out in the correct way. Just add it as a child
         */
        if (hasCorrectParent) {
            index = indexOf(this, this.parent.contentItems);
            this.parent.addChild(contentItem, insertBefore ? index : index + 1, true);
            this.config[dimension] *= 0.5;
            contentItem.config[dimension] = this.config[dimension];
            this.parent.callDownwards('setSize');
            /*
             * This handles items that are dropped on top or bottom of a row or left / right of a column. We need
             * to create the appropriate contentItem for them to live in
             */
        } else {
            type = isVertical ? 'column' : 'row';
            rowOrColumn = this.layoutManager.createContentItem({
                type: type
            }, this);
            this.parent.replaceChild(this, rowOrColumn);

            rowOrColumn.addChild(contentItem, insertBefore ? 0 : undefined, true);
            rowOrColumn.addChild(this, insertBefore ? undefined : 0, true);

            this.config[dimension] = 50;
            contentItem.config[dimension] = 50;
            rowOrColumn.callDownwards('setSize');
        }
        this.parent._validateDocking();
    }

    /**
     * If the user hovers above the header part of the stack, indicate drop positions for tabs.
     * otherwise indicate which segment of the body the dragged item would be dropped on
     *
     * @param    x Absolute Screen X
     * @param    y Absolute Screen Y
     */
    _$highlightDropZone(x: number, y: number) {
        var segment, area;

        for (segment in this._contentAreaDimensions) {
            area = this._contentAreaDimensions[segment].hoverArea;

            if (area.x1 < x && area.x2 > x && area.y1 < y && area.y2 > y) {

                if (segment === 'header') {
                    this._dropSegment = 'header';
                    this._highlightHeaderDropZone(this._sided ? y : x);
                } else {
                    this.resetHeaderDropZone();
                    this._highlightBodyDropZone(segment);
                }

                return;
            }
        }
    }

    getArea() {
        if (this.element.style.display === 'none') {
            return null;
        }

        const getArea = super.getArea;
        const headerArea = getArea.call(this, this.header.element),
        const contentArea = getArea.call(this, this.childElementContainer),
        const contentWidth = contentArea.x2 - contentArea.x1,
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

            return getArea.call(this, this.element);
        }

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

        return getArea.call(this, this.element);
    }

    _highlightHeaderDropZone(x) {
        var i,
            tabElement,
            tabsLength = this.header.tabs.length,
            isAboveTab = false,
            tabTop,
            tabLeft,
            offset,
            placeHolderLeft,
            headerOffset,
            tabWidth,
            halfX;

        // Empty stack
        if (tabsLength === 0) {
            headerOffset = this.header.element.offset();

            this.layoutManager.dropTargetIndicator.highlightArea({
                x1: headerOffset.left,
                x2: headerOffset.left + 100,
                y1: headerOffset.top + this.header.element.height() - 20,
                y2: headerOffset.top + this.header.element.height()
            });

            return;
        }

        for (i = 0; i < tabsLength; i++) {
            tabElement = this.header.tabs[i].element;
            offset = tabElement.offset();
            if (this._sided) {
                tabLeft = offset.top;
                tabTop = offset.left;
                tabWidth = tabElement.height();
            } else {
                tabLeft = offset.left;
                tabTop = offset.top;
                tabWidth = tabElement.width();
            }

            if (x > tabLeft && x < tabLeft + tabWidth) {
                isAboveTab = true;
                break;
            }
        }

        if (isAboveTab === false && x < tabLeft) {
            return;
        }

        halfX = tabLeft + tabWidth / 2;

        if (x < halfX) {
            this._dropIndex = i;
            tabElement.before(this.layoutManager.tabDropPlaceholder);
        } else {
            this._dropIndex = Math.min(i + 1, tabsLength);
            tabElement.after(this.layoutManager.tabDropPlaceholder);
        }


        if (this._sided) {
            var placeHolderTop = this.layoutManager.tabDropPlaceholder.offset().top;
            this.layoutManager.dropTargetIndicator.highlightArea({
                x1: tabTop,
                x2: tabTop + tabElement.innerHeight(),
                y1: placeHolderTop,
                y2: placeHolderTop + this.layoutManager.tabDropPlaceholder.width()
            });
            return;
        }
        placeHolderLeft = this.layoutManager.tabDropPlaceholder.offset().left;

        this.layoutManager.dropTargetIndicator.highlightArea({
            x1: placeHolderLeft,
            x2: placeHolderLeft + this.layoutManager.tabDropPlaceholder.width(),
            y1: tabTop,
            y2: tabTop + tabElement.innerHeight()
        });
    }

    private resetHeaderDropZone() {
        this.layoutManager.tabDropPlaceholder.remove();
    }

    toggleMaximise(e) {
        if (!this.isMaximised)
            this.dock(false);
        super.toggleMaximise(e);
    }

    _setupHeaderPosition() {
        const side = ['right', 'left', 'bottom'].indexOf(this._header.show) >= 0 && this._header.show;
        this.header.element.toggle(!!this._header.show);
        this._side = side;
        this._sided = ['right', 'left'].indexOf(this._side) >= 0;
        this.element.removeClass('lm_left lm_right lm_bottom');
        if (this._side)
            this.element.addClass('lm_' + this._side);
        if (this.element.find('.lm_header').length && this.childElementContainer) {
            var headerPosition = ['right', 'bottom'].indexOf(this._side) >= 0 ? 'before' : 'after';
            this.header.element[headerPosition](this.childElementContainer);
            this.callDownwards('setSize');
        }
    }

    _highlightBodyDropZone(segment) {
        const highlightArea = this._contentAreaDimensions[segment].highlightArea;
        this.layoutManager.dropTargetIndicator.highlightArea(highlightArea);
        this._dropSegment = segment;
    }
}

export namespace Stack {
    export const enum Side {
        'right',
        'left',
        'bottom',
    }
}