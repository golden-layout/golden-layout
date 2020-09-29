import { ItemConfig } from '../config/config'
import { Splitter } from '../controls/Splitter'
import { AssertError, UnexpectedNullError } from '../errors/error'
import { AbstractContentItem } from '../items/AbstractContentItem'
import { Stack } from '../items/Stack'
import { LayoutManager } from '../LayoutManager'
import {
    animFrame, createTemplateHtmlElement, fnBind,

    indexOf,
    numberToPixels,
    pixelsToNumber
} from '../utils/utils'



export class RowOrColumn extends AbstractContentItem {
    element: HTMLElement;
    childElementContainer: any;
    private _splitterSize: number;
    private _splitterGrabSize: any;
    private _isColumn: boolean;
    private _dimension: AbstractContentItem.ItemConfigHeightOrWidth;
    private _splitter: Splitter[];
    private _splitterPosition: number | null;
    private _splitterMinPosition: number | null;
    private _splitterMaxPosition: number | null;
    private readonly _configType: ItemConfig.Type.row | ItemConfig.Type.column;

    constructor(isColumn: boolean, layoutManager: LayoutManager, config: ItemConfig, parent: AbstractContentItem) {
      
        super(layoutManager, config, parent);

        this.isRow = !isColumn;
        this.isColumn = isColumn;

        this.element = createTemplateHtmlElement('<div class="lm_item lm_' + (isColumn ? 'column' : 'row') + '"></div>', 'div');
        this.childElementContainer = this.element;
        this._splitterSize = layoutManager.config.dimensions.borderWidth;
        this._splitterGrabSize = layoutManager.config?.dimensions?.borderGrabWidth;
        this._isColumn = isColumn;
        this._dimension = isColumn ? 'height' : 'width';
        this._splitter = [];
        this._splitterPosition = null;
        this._splitterMinPosition = null;
        this._splitterMaxPosition = null;

        switch (config.type) {
            case ItemConfig.Type.row:
            case ItemConfig.Type.column:
                this._configType = config.type;
                break;
            default:
                throw new AssertError('ROCCCT00925');
        }
    }


    /**
     * Add a new contentItem to the Row or Column
     *
     * @param {AbstractContentItem} contentItem
     * @param {[int]} index The position of the new item within the Row or Column.
     *                      If no index is provided the item will be added to the end
     * @param {[bool]} _$suspendResize If true the items won't be resized. This will leave the item in
     *                                 an inconsistent state and is only intended to be used if multiple
     *                                 children need to be added in one go and resize is called afterwards
     *
     * @returns {void}
     */
    addChild(contentItem: AbstractContentItem, index: number, _$suspendResize: boolean): void {

        contentItem = this.layoutManager._$normalizeContentItem(contentItem, this);

        if (index === undefined) {
            index = this.contentItems.length;
        }

        if (this.contentItems.length > 0) {
            const splitterElement = this.createSplitter(Math.max(0, index - 1)).element;

            if (index > 0) {
                this.contentItems[index - 1].element.after(splitterElement);
                splitterElement.after(contentItem.element);
                if (this.isDocked(index - 1)) {
                    this._splitter[index - 1].element.hide();
                    this._splitter[index].element.show();
                }
            } else {
                this.contentItems[0].element.before(splitterElement);
                splitterElement.before(contentItem.element);
            }
        } else {
            this.childElementContainer.append(contentItem.element);
        }

        super.addChild(contentItem, index);

        const newItemSize = (1 / this.contentItems.length) * 100;

        if (_$suspendResize === true) {
            this.emitBubblingEvent('stateChanged');
            return;
        }

        for (let i = 0; i < this.contentItems.length; i++) {
            if (this.contentItems[i] === contentItem) {
                contentItem.config[this._dimension] = newItemSize;
            } else {
                const itemSize = this.contentItems[i].config[this._dimension] *= (100 - newItemSize) / 100;
                this.contentItems[i].config[this._dimension] = itemSize;
            }
        }

        this.callDownwards('setSize');
        this.emitBubblingEvent('stateChanged');
        this._validateDocking();
    }


    /**
     * Undisplays a child of this element
     */
    undisplayChild(contentItem: AbstractContentItem) {
        var undisplayedItemSize = contentItem.config[this._dimension],
            index = indexOf(contentItem, this.contentItems),
            splitterIndex = Math.max(index - 1, 0),
            i,
            childItem;

        if (index === -1) {
            throw new Error('Can\'t undisplay child. ContentItem is not child of this Row or Column');
        }

        /**
         * Hide the splitter before the item or after if the item happens
         * to be the first in the row/column
         */
        if (this._splitter[splitterIndex]) {
            this._splitter[splitterIndex].element.hide();
        }

        if (splitterIndex < this._splitter.length) {
            if (this.isDocked(splitterIndex))
                this._splitter[splitterIndex].element.hide();
        }

        /**
         * Allocate the space that the hidden item occupied to the remaining items
         */
        const dockedCount = this.calculateDockedCount();
        for (i = 0; i < this.contentItems.length; i++) {
            if (this.contentItems[i] !== contentItem) {
                if (!this.isDocked(i))
                    this.contentItems[i].config[this._dimension] += undisplayedItemSize / (this.contentItems.length - 1 - dockedCount);                
            } else {
              this.contentItems[i].config[this._dimension] = 0
            }
        }

        if(this.contentItems.length === 1){
            super.undisplayChild(contentItem);
        }

        this.callDownwards('setSize');
        this.emitBubblingEvent('stateChanged');
    }


    /**
     * Removes a child of this element
     *
     * @param   {AbstractContentItem} contentItem
     * @param   {boolean} keepChild   If true the child will be removed, but not destroyed
     *
     * @returns {void}
     */
    removeChild(contentItem: AbstractContentItem, keepChild: boolean) {
        const removedItemSize = contentItem.config[this._dimension];
        const index = indexOf(contentItem, this.contentItems);
        const splitterIndex = Math.max(index - 1, 0);

        if (index === -1) {
            throw new Error('Can\'t remove child. ContentItem is not child of this Row or Column');
        }

        /**
         * Remove the splitter before the item or after if the item happens
         * to be the first in the row/column
         */
        if (this._splitter[splitterIndex]) {
            this._splitter[splitterIndex].destroy();
            this._splitter.splice(splitterIndex, 1);
        }

        if (splitterIndex < this._splitter.length) {
            if (this.isDocked(splitterIndex))
                this._splitter[splitterIndex].element.hide();
        }
        /**
         * Allocate the space that the removed item occupied to the remaining items
         */
        const dockedCount = this.calculateDockedCount();
        for (let i = 0; i < this.contentItems.length; i++) {
            if (this.contentItems[i] !== contentItem) {
                if (!this.isDocked(i))
                    this.contentItems[i].config[this._dimension] += removedItemSize / (this.contentItems.length - 1 - dockedCount);

            }
        }

        super.removeChild(contentItem, keepChild);

        if (this.contentItems.length === 1 && this.config.isClosable === true) {
            const childItem = this.contentItems[0];
            this.contentItems = [];
            this.parent.replaceChild(this, childItem, true);
            this._validateDocking(this.parent);
        } else {
            this.callDownwards('setSize');
            this.emitBubblingEvent('stateChanged');
            this._validateDocking();
        }
    }

    /**
     * Replaces a child of this Row or Column with another contentItem
     *
     * @param   {AbstractContentItem} oldChild
     * @param   {AbstractContentItem} newChild
     *
     * @returns {void}
     */
    replaceChild(oldChild: AbstractContentItem, newChild: AbstractContentItem) {
        var size = oldChild.config[this._dimension];
        super.replaceChild(oldChild, newChild);
        newChild.config[this._dimension] = size;
        this.callDownwards('setSize');
        this.emitBubblingEvent('stateChanged');
    }

    /**
     * Called whenever the dimensions of this item or one of its parents change
     *
     * @returns {void}
     */
    setSize() {
        if (this.contentItems.length > 0) {
            this.calculateRelativeSizes();
            this.setAbsoluteSizes();
        }
        this.emitBubblingEvent('stateChanged');
        this.emit('resize');
    }

    /**
     * Dock or undock a child if it posiible
     *
     * @param   {AbstractContentItem} contentItem
     * @param   {Boolean} mode or toggle if undefined
     * @param   {Boolean} collapsed after docking
     */
    dock(contentItem: AbstractContentItem, mode?: boolean, collapsed?: boolean): void {
        if (this.contentItems.length === 1)
            throw new Error('Can\'t dock child when it single');

        var removedItemSize = contentItem.config[this._dimension],
            headerSize = this.layoutManager.config.dimensions.headerHeight,
            index = indexOf(contentItem, this.contentItems),
            splitterIndex = Math.max(index - 1, 0);

        if (index === -1) {
            throw new Error('Can\'t dock child. ContentItem is not child of this Row or Column');
        }
        const isDocked = contentItem._docker && contentItem._docker.docked;
        var i
        if (typeof mode != 'undefined')
            if (mode == isDocked)
                return;
        if (isDocked) { // undock it
            this._splitter[splitterIndex].element.show();
            for (i = 0; i < this.contentItems.length; i++) {
                var newItemSize = contentItem._docker.size;
                if (this.contentItems[i] === contentItem) {
                    contentItem.config[this._dimension] = newItemSize;
                } else {
                    const itemSize = this.contentItems[i].config[this._dimension] *= (100 - newItemSize) / 100;
                    this.contentItems[i].config[this._dimension] = itemSize;
                }
            }
            contentItem._docker = {
                docked: false
            };
        } else { // dock
            if (this.contentItems.length - this.isDocked() < 2)
                throw new Error('Can\'t dock child when it is last in ' + this.config.type);
            const autoside = {
                column: {
                    first: 'top',
                    last: 'bottom'
                },
                row: {
                    first: 'left',
                    last: 'right'
                }
            };
            const required = autoside[this._configType][index ? 'last' : 'first'];
            if (contentItem.header.position() != required)
                contentItem.header.position(required);

            if (this._splitter[splitterIndex]) {
                this._splitter[splitterIndex].element.hide();
            }
            const dockedCount = this.calculateDockedCount();
            for (let i = 0; i < this.contentItems.length; i++) {
                if (this.contentItems[i] !== contentItem) {
                    if (!this.isDocked(i))
                        this.contentItems[i].config[this._dimension] += removedItemSize / (this.contentItems.length - 1 - dockedCount);
                } else
                    this.contentItems[i].config[this._dimension] = 0;
            }
            contentItem._docker = {
                dimension: this._dimension,
                size: removedItemSize,
                realSize: contentItem.element[this._dimension]() - headerSize,
                docked: true,
            };
            if (collapsed)
                contentItem.childElementContainer[this._dimension](0);
        }
        contentItem.element.toggleClass('lm_docked', contentItem._docker.docked);
        this.callDownwards('setSize');
        this.emitBubblingEvent('stateChanged');
        this._validateDocking();
    }

    /**
     * Invoked recursively by the layout manager. AbstractContentItem.init appends
     * the contentItem's DOM elements to the container, RowOrColumn init adds splitters
     * in between them
     *
     * @package private
     * @override AbstractContentItem._$init
     * @returns {void}
     */
    _$init(): void {
        if (this.isInitialised === true) return;

        super._$init();

        for (let i = 0; i < this.contentItems.length - 1; i++) {
            this.contentItems[i].element.after(this.createSplitter(i).element);
        }
        for (let i = 0; i < this.contentItems.length; i++) {
            if (this.contentItems[i]._header && this.contentItems[i]._header.docked)
                this.dock(this.contentItems[i], true, true);
        }

        this.initContentItems();
    }

    /**
     * Turns the relative sizes calculated by _calculateRelativeSizes into
     * absolute pixel values and applies them to the children's DOM elements
     *
     * Assigns additional pixels to counteract Math.floor
     *
     */
    private setAbsoluteSizes() {
        var i,
            sizeData = this.calculateAbsoluteSizes();

        for (i = 0; i < this.contentItems.length; i++) {
            if (sizeData.additionalPixel - i > 0) {
                sizeData.itemSizes[i]++;
            }

            if (this._isColumn) {
                this.contentItems[i].element.width(sizeData.totalWidth);
                this.contentItems[i].element.height(sizeData.itemSizes[i]);
            } else {
                this.contentItems[i].element.width(sizeData.itemSizes[i]);
                this.contentItems[i].element.height(sizeData.totalHeight);
            }
        }
    }

    /**
     * Calculates the absolute sizes of all of the children of this Item.
     * @returns {object} - Set with absolute sizes and additional pixels.
     */
    private calculateAbsoluteSizes() {
        var i,
            totalSplitterSize = (this.contentItems.length - 1) * this._splitterSize,
            headerSize = this.layoutManager.config.dimensions.headerHeight,
            totalWidth = this.element.width(),
            totalHeight = this.element.height(),
            totalAssigned = 0,
            additionalPixel,
            itemSize,
            itemSizes = [];

        if (this._isColumn) {
            totalHeight -= totalSplitterSize;
        } else {
            totalWidth -= totalSplitterSize;
        }
        for (i = 0; i < this.contentItems.length; i++) {
            if (this.isDocked(i))
                if (this._isColumn) {
                    totalHeight -= headerSize - this._splitterSize;
                } else {
                    totalWidth -= headerSize - this._splitterSize;
                }
        }

        for (i = 0; i < this.contentItems.length; i++) {
            if (this._isColumn) {
                itemSize = Math.floor(totalHeight * (this.contentItems[i].config.height / 100));
            } else {
                itemSize = Math.floor(totalWidth * (this.contentItems[i].config.width / 100));
            }
            if (this.isDocked(i))
                itemSize = headerSize;

            totalAssigned += itemSize;
            itemSizes.push(itemSize);
        }

        additionalPixel = Math.floor((this._isColumn ? totalHeight : totalWidth) - totalAssigned);

        return {
            itemSizes: itemSizes,
            additionalPixel: additionalPixel,
            totalWidth: totalWidth,
            totalHeight: totalHeight
        };
    }

    /**
     * Calculates the relative sizes of all children of this Item. The logic
     * is as follows:
     *
     * - Add up the total size of all items that have a configured size
     *
     * - If the total == 100 (check for floating point errors)
     *        Excellent, job done
     *
     * - If the total is > 100,
     *        set the size of items without set dimensions to 1/3 and add this to the total
     *        set the size off all items so that the total is hundred relative to their original size
     *
     * - If the total is < 100
     *        If there are items without set dimensions, distribute the remainder to 100 evenly between them
     *        If there are no items without set dimensions, increase all items sizes relative to
     *        their original size so that they add up to 100
     *
     */
    private calculateRelativeSizes() {

        let total = 0;
        let itemsWithoutSetDimension = [],
        const dimension = this._isColumn ? RowOrColumn.Dimension.height : RowOrColumn.Dimension.width;

        for (let i = 0; i < this.contentItems.length; i++) {
            if (this.contentItems[i].config[dimension] !== undefined) {
                total += this.contentItems[i].config[dimension];
            } else {
                itemsWithoutSetDimension.push(this.contentItems[i]);
            }
        }

        /**
         * Everything adds up to hundred, all good :-)
         */
        if (Math.round(total) === 100) {
            this.respectMinItemWidth();
            return;
        }

        /**
         * Allocate the remaining size to the items without a set dimension
         */
        if (Math.round(total) < 100 && itemsWithoutSetDimension.length > 0) {
            for (i = 0; i < itemsWithoutSetDimension.length; i++) {
                itemsWithoutSetDimension[i].config[dimension] = (100 - total) / itemsWithoutSetDimension.length;
            }
            this.respectMinItemWidth();
            return;
        }

        /**
         * If the total is > 100, but there are also items without a set dimension left, assing 50
         * as their dimension and add it to the total
         *
         * This will be reset in the next step
         */
        if (Math.round(total) > 100) {
            for (let i = 0; i < itemsWithoutSetDimension.length; i++) {
                itemsWithoutSetDimension[i].config[dimension] = 50;
                total += 50;
            }
        }

        /**
         * Set every items size relative to 100 relative to its size to total
         */
        for (let i = 0; i < this.contentItems.length; i++) {
            this.contentItems[i].config[dimension] = (this.contentItems[i].config[dimension] / total) * 100;
        }

        this.respectMinItemWidth();
    }

    /**
     * Adjusts the column widths to respect the dimensions minItemWidth if set.
     */
    private respectMinItemWidth() {
        interface Entry {
            width: number;
        }

        const minItemWidth = this.layoutManager.config.dimensions ? (this.layoutManager.config.dimensions.minItemWidth || 0) : 0;
        let totalOverMin = 0;
        let totalUnderMin = 0;
        const entriesOverMin: Entry[] = [];
        const allEntries: Entry[] = [];

        if (this._isColumn || !minItemWidth || this.contentItems.length <= 1) {
            return;
        }

        const sizeData = this.calculateAbsoluteSizes();

        /**
         * Figure out how much we are under the min item size total and how much room we have to use.
         */
        for (let i = 0; i < sizeData.itemSizes.length; i++) {
            const itemSize = sizeData.itemSizes[i];

            let entry: Entry;
            if (itemSize < minItemWidth) {
                totalUnderMin += minItemWidth - itemSize;
                entry = {
                    width: minItemWidth
                };

            } else {
                totalOverMin += itemSize - minItemWidth;
                entry = {
                    width: itemSize
                };
                entriesOverMin.push(entry);
            }

            allEntries.push(entry);
        }

        /**
         * If there is nothing under min, or there is not enough over to make up the difference, do nothing.
         */
        if (totalUnderMin === 0 || totalUnderMin > totalOverMin) {
            return;
        }

        /**
         * Evenly reduce all columns that are over the min item width to make up the difference.
         */
        const reducePercent = totalUnderMin / totalOverMin;
        let remainingWidth = totalUnderMin;
        for (let i = 0; i < entriesOverMin.length; i++) {
            const entry = entriesOverMin[i];
            const reducedWidth = Math.round((entry.width - minItemWidth) * reducePercent);
            remainingWidth -= reducedWidth;
            entry.width -= reducedWidth;
        }

        /**
         * Take anything remaining from the last item.
         */
        if (remainingWidth !== 0) {
            allEntries[allEntries.length - 1].width -= remainingWidth;
        }

        /**
         * Set every items size relative to 100 relative to its size to total
         */
        for (let i = 0; i < this.contentItems.length; i++) {
            this.contentItems[i].config.width = (allEntries[i].width / sizeData.totalWidth) * 100;
        }
    }

    /**
     * Instantiates a new Splitter, binds events to it and adds
     * it to the array of splitters at the position specified as the index argument
     *
     * What it doesn't do though is append the splitter to the DOM
     *
     * @param   {Int} index The position of the splitter
     *
     * @returns {Splitter}
     */
    private createSplitter(index: number): Splitter {
        const splitter = new Splitter(this._isColumn, this._splitterSize, this._splitterGrabSize);
        splitter.on('drag', (offsetX, offsetY) => this.onSplitterDrag(splitter, offsetX, offsetY));
        splitter.on('dragStop', () => this.onSplitterDragStop(splitter));
        splitter.on('dragStart', () => this.onSplitterDragStart(splitter));
        this._splitter.splice(index, 0, splitter);
        return splitter;
    }

    /**
     * Locates the instance of Splitter in the array of
     * registered splitters and returns a map containing the contentItem
     * before and after the splitters, both of which are affected if the
     * splitter is moved
     *
     * @returns A map of contentItems that the splitter affects
     */
    private getItemsForSplitter(splitter: Splitter) {
        const index = this._splitter.indexOf(splitter);

        return {
            before: this.contentItems[index],
            after: this.contentItems[index + 1]
        };
    }

    private isDocked(index: number) {
        if (index < this.contentItems.length) {
            return this.contentItems[index]._docker && this.contentItems[index]._docker.docked;
        } else {
            return false;
        }
    }

    private calculateDockedCount() {
        let count = 0;
        for (let i = 0; i < this.contentItems.length; ++i)
            if (this.isDocked(i))
                count++;
        return count;
    }

    /**
     * Validate if row or column has ability to dock
     * @private
     */
    _validateDocking(that?: RowOrColumn) {
        that = that ?? this;
        var can = that.contentItems.length - that.calculateDockedCount() > 1;
        for (var i = 0; i < that.contentItems.length; ++i)
            if (that.contentItems[i] instanceof Stack) {
                that.contentItems[i].header._setDockable(that.isDocked(i) ?? can);
                that.contentItems[i].header._$setClosable(can);
            }
    }

    /**
     * Gets the minimum dimensions for the given item configuration array
     * @param item
     * @private
     */
    private _getMinimumDimensions(arr: ItemConfig[]) {
        let minWidth = 0;
        let minHeight = 0;

        for (let i = 0; i < arr.length; ++i) {
            minWidth = Math.max(arr[i].minWidth ?? 0, minWidth);
            minHeight = Math.max(arr[i].minHeight ?? 0, minHeight);
        }

        return {
            horizontal: minWidth,
            vertical: minHeight
        };
    }

    /**
     * Invoked when a splitter's dragListener fires dragStart. Calculates the splitters
     * movement area once (so that it doesn't need calculating on every mousemove event)
     */
    private onSplitterDragStart(splitter: Splitter) {
        const items = this.getItemsForSplitter(splitter);
        const minSize = this.layoutManager.config.dimensions[this._isColumn ? 'minItemHeight' : 'minItemWidth'];

        const beforeMinDim = this._getMinimumDimensions(items.before.config.content);
        const beforeMinSize = this._isColumn ? beforeMinDim.vertical : beforeMinDim.horizontal;

        const afterMinDim = this._getMinimumDimensions(items.after.config.content);
        const afterMinSize = this._isColumn ? afterMinDim.vertical : afterMinDim.horizontal;

        this._splitterPosition = 0;
        this._splitterMinPosition = -1 * (pixelsToNumber(items.before.element.style[this._dimension]) - (beforeMinSize || minSize));
        this._splitterMaxPosition = pixelsToNumber(items.after.element.style[this._dimension]) - (afterMinSize || minSize);
    }

    /**
     * Invoked when a splitter's DragListener fires drag. Updates the splitters DOM position,
     * but not the sizes of the elements the splitter controls in order to minimize resize events
     *
     * @param   splitter
     * @param   offsetX  Relative pixel values to the splitters original position. Can be negative
     * @param   offsetY  Relative pixel values to the splitters original position. Can be negative
     */
    private onSplitterDrag(splitter: Splitter, offsetX: number, offsetY: number) {
        const offset = this._isColumn ? offsetY : offsetX;

        if (this._splitterMinPosition === null || this._splitterMaxPosition === null) {
            throw new UnexpectedNullError('ROCOSD59226');
        } else {
            if (offset > this._splitterMinPosition && offset < this._splitterMaxPosition) {
                this._splitterPosition = offset;
                const offsetPixels = numberToPixels(offset);
                if (this._isColumn) {
                    splitter.element.style.top = offsetPixels;
                } else {
                    splitter.element.style.left = offsetPixels;
                }
            }
        }
    }

    /**
     * Invoked when a splitter's DragListener fires dragStop. Resets the splitters DOM position,
     * and applies the new sizes to the elements before and after the splitter and their children
     * on the next animation frame
     */
    private onSplitterDragStop(splitter: Splitter) {
        if (this._splitterPosition === null) {
            throw new UnexpectedNullError('ROCOSDS66932');
        } else {
            const items = this.getItemsForSplitter(splitter);
            const sizeBefore = pixelsToNumber(items.before.element.style[this._dimension]);
            const sizeAfter = pixelsToNumber(items.after.element.style[this._dimension]);
            const splitterPositionInRange = (this._splitterPosition + sizeBefore) / (sizeBefore + sizeAfter);
            const totalRelativeSize = items.before.config[this._dimension] + items.after.config[this._dimension];

            items.before.config[this._dimension] = splitterPositionInRange * totalRelativeSize;
            items.after.config[this._dimension] = (1 - splitterPositionInRange) * totalRelativeSize;

            splitter.element.style.top = numberToPixels(0);
            splitter.element.style.left = numberToPixels(0);

            animFrame(fnBind(this.callDownwards, this, ['setSize']));
        }
    }
}
