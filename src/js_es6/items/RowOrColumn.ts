import { ItemConfig, RowOrColumnItemConfig } from '../config/config'
import { Splitter } from '../controls/Splitter'
import { AssertError, UnexpectedNullError } from '../errors/internal-error'
import { AbstractContentItem } from '../items/AbstractContentItem'
import { Stack } from '../items/Stack'
import { LayoutManager } from '../LayoutManager'
import { Side } from '../utils/types'
import {
    createTemplateHtmlElement,
    getElementHeight,
    getElementWidth,
    getElementWidthAndHeight,
    numberToPixels,
    pixelsToNumber,

    setElementDisplayVisibility, setElementHeight,

    setElementWidth
} from '../utils/utils'

export class RowOrColumn extends AbstractContentItem {
    /** @internal */
    private readonly _childElementContainer: HTMLElement;
    /** @internal */
    private readonly _configType: ItemConfig.Type.row | ItemConfig.Type.column;
    /** @internal */
    private readonly _isColumn: boolean;
    /** @internal */
    private readonly _splitterSize: number;
    /** @internal */
    private readonly _splitterGrabSize: number;
    /** @internal */
    private readonly _dimension: ItemConfig.HeightOrWidthPropertyName;
    /** @internal */
    private readonly _splitter: Splitter[] = [];
    /** @internal */
    private _splitterPosition: number | null;
    /** @internal */
    private _splitterMinPosition: number | null;
    /** @internal */
    private _splitterMaxPosition: number | null;

    /** @internal */
    constructor(isColumn: boolean, layoutManager: LayoutManager, config: RowOrColumnItemConfig,
        private _rowOrColumnParent: AbstractContentItem
    ) {
        super(layoutManager, config, _rowOrColumnParent, createTemplateHtmlElement(RowOrColumn.createTemplateHtml(isColumn)));

        this.isRow = !isColumn;
        this.isColumn = isColumn;

        this._childElementContainer = this.element;
        this._splitterSize = layoutManager.managerConfig.dimensions.borderWidth;
        this._splitterGrabSize = layoutManager.managerConfig.dimensions.borderGrabWidth;
        this._isColumn = isColumn;
        this._dimension = isColumn ? 'height' : 'width';
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
    addChild(contentItem: AbstractContentItem, index: number | undefined, _$suspendResize: boolean): void {

        // contentItem = this.layoutManager._$normalizeContentItem(contentItem, this);

        if (index === undefined) {
            index = this.contentItems.length;
        }

        if (this.contentItems.length > 0) {
            const splitterElement = this.createSplitter(Math.max(0, index - 1)).element;

            if (index > 0) {
                this.contentItems[index - 1].element.insertAdjacentElement('afterend', splitterElement);
                splitterElement.insertAdjacentElement('afterend', contentItem.element);
                if (this.isDocked(index - 1)) {
                    setElementDisplayVisibility(this._splitter[index - 1].element, false);
                    setElementDisplayVisibility(this._splitter[index].element, true);
                }
            } else {
                this.contentItems[0].element.insertAdjacentElement('beforebegin', splitterElement);
                splitterElement.insertAdjacentElement('beforebegin', contentItem.element);
            }
        } else {
            this._childElementContainer.appendChild(contentItem.element);
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

        this.updateSize();
        this.emitBubblingEvent('stateChanged');
        this.validateDocking();
    }


    // /**
    //  * Undisplays a child of this element
    //  */
    // undisplayChild(contentItem: AbstractContentItem): void {
    //     const undisplayedItemSize = contentItem.config[this._dimension];
    //     const index = this.contentItems.indexOf(contentItem);
    //     const splitterIndex = Math.max(index - 1, 0);

    //     if (index === -1) {
    //         throw new Error('Can\'t undisplay child. ContentItem is not child of this Row or Column');
    //     }

    //     /**
    //      * Hide the splitter before the item or after if the item happens
    //      * to be the first in the row/column
    //      */
    //     if (this._splitter[splitterIndex]) {
    //         setElementDisplayVisibility(this._splitter[splitterIndex].element, false);
    //     }

    //     if (splitterIndex < this._splitter.length) {
    //         if (this.isDocked(splitterIndex)) {
    //             setElementDisplayVisibility(this._splitter[splitterIndex].element, false);
    //         }
    //     }

    //     /**
    //      * Allocate the space that the hidden item occupied to the remaining items
    //      */
    //     const dockedCount = this.calculateDockedCount();
    //     for (let i = 0; i < this.contentItems.length; i++) {
    //         if (this.contentItems[i] !== contentItem) {
    //             if (!this.isDocked(i))
    //                 this.contentItems[i].config[this._dimension] += undisplayedItemSize / (this.contentItems.length - 1 - dockedCount);                
    //         } else {
    //           this.contentItems[i].config[this._dimension] = 0
    //         }
    //     }

    //     if (this.contentItems.length === 1) {
    //         super.undisplayChild(contentItem);
    //     }

    //     this.updateSize();
    //     this.emitBubblingEvent('stateChanged');
    // }


    /**
     * Removes a child of this element
     *
     * @param   contentItem
     * @param   keepChild   If true the child will be removed, but not destroyed
     *
     */
    removeChild(contentItem: AbstractContentItem, keepChild: boolean): void {
        const removedItemSize = contentItem.config[this._dimension];
        const index = this.contentItems.indexOf(contentItem);
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
                setElementDisplayVisibility(this._splitter[splitterIndex].element, false);
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
            this.contentItems.length = 0;
            this._rowOrColumnParent.replaceChild(this, childItem, true);
            if (this._rowOrColumnParent instanceof RowOrColumn) { // this check not included originally.
                // If Root, then validateDocking not require
                this._rowOrColumnParent.validateDocking();
            }
        } else {
            this.updateSize();
            this.emitBubblingEvent('stateChanged');
            this.validateDocking();
        }
    }

    /**
     * Replaces a child of this Row or Column with another contentItem
     */
    replaceChild(oldChild: AbstractContentItem, newChild: AbstractContentItem): void {
        const size = oldChild.config[this._dimension];
        super.replaceChild(oldChild, newChild);
        newChild.config[this._dimension] = size;
        this.updateSize();
        this.emitBubblingEvent('stateChanged');
    }

    /**
     * Called whenever the dimensions of this item or one of its parents change
     */
    updateSize(): void {
        this.updateNodeSize();
        this.updateContentItemsSize();
    }

    /**
     * Dock or undock a child if it posiible
     *
     * @param   {AbstractContentItem} contentItem
     * @param   {Boolean} mode or toggle if undefined
     * @param   {Boolean} collapsed after docking
     */
    dock(contentItem: Stack, mode?: boolean, collapsed?: boolean): void {
        if (this.contentItems.length === 1)
            throw new Error('Can\'t dock child when it single');

        const removedItemSize = contentItem.config[this._dimension];
        const headerSize = this.layoutManager.managerConfig.header.show === false ? 0 : this.layoutManager.managerConfig.dimensions.headerHeight;
        const index = this.contentItems.indexOf(contentItem);
        const splitterIndex = Math.max(index - 1, 0);

        if (index === -1) {
            throw new Error('Can\'t dock child. ContentItem is not child of this Row or Column');
        }
        const isDocked = contentItem.docker.docked;
        if (mode !== undefined && mode === isDocked)
            return;
        if (isDocked) { // undock it
            this._splitter[splitterIndex].element.style.display = '';
            for (let i = 0; i < this.contentItems.length; i++) {
                const newItemSize = contentItem.docker.size;
                if (this.contentItems[i] === contentItem) {
                    contentItem.config[this._dimension] = newItemSize;
                } else {
                    const itemSize = this.contentItems[i].config[this._dimension] *= (100 - newItemSize) / 100;
                    this.contentItems[i].config[this._dimension] = itemSize;
                }
            }
            contentItem.setUndocked();
        } else { // dock
            if (this.contentItems.length - this.calculateDockedCount() < 2)
                throw new AssertError('Can\'t dock child when it is last in ' + this.config.type);
            const autoside = {
                column: {
                    first: Side.top,
                    last: Side.bottom,
                },
                row: {
                    first: Side.left,
                    last: Side.right,
                }
            };
            const required = autoside[this._configType][index ? 'last' : 'first'];
            if (contentItem.headerSide !== required)
                contentItem.positionHeader(required);

            if (this._splitter[splitterIndex]) {
                setElementDisplayVisibility(this._splitter[splitterIndex].element, false);
            }
            const dockedCount = this.calculateDockedCount();
            for (let i = 0; i < this.contentItems.length; i++) {
                if (this.contentItems[i] !== contentItem) {
                    if (!this.isDocked(i))
                        this.contentItems[i].config[this._dimension] += removedItemSize / (this.contentItems.length - 1 - dockedCount);
                } else
                    this.contentItems[i].config[this._dimension] = 0;
            }
            contentItem.setDocked({
                docked: true,
                dimension: this._dimension,
                size: removedItemSize,
                realSize: RowOrColumn.getElementDimensionSize(contentItem.element, this._dimension) - headerSize,
            });
            if (collapsed) {
                RowOrColumn.setElementDimensionSize(contentItem.childElementContainer, this._dimension, 0);
            }
        }
        contentItem.element.classList.toggle('lm_docked', contentItem.docker.docked);
        this.updateSize();
        this.emitBubblingEvent('stateChanged');
        this.validateDocking();
    }

    /**
     * Invoked recursively by the layout manager. AbstractContentItem.init appends
     * the contentItem's DOM elements to the container, RowOrColumn init adds splitters
     * in between them
     * @internal
     */
    init(): void {
        if (this.isInitialised === true) return;

        this.updateNodeSize();

        for (let i = 0; i < this.contentItems.length; i++) {
            this._childElementContainer.appendChild(this.contentItems[i].element);
        }

        super.init();

        for (let i = 0; i < this.contentItems.length - 1; i++) {
            this.contentItems[i].element.insertAdjacentElement('afterend', this.createSplitter(i).element);
        }
        for (let i = 0; i < this.contentItems.length; i++) {
            const contentItem = this.contentItems[i];
            // was previously
            // if (this.contentItems[i]._header && this.contentItems[i]._header.docked)
            // I think this.contentItems[i]._header.docked did not exist (and was always undefined) so the below may be wrong
            if (contentItem instanceof Stack && contentItem.docker.docked) {
                this.dock(contentItem, true, true);
            }
        }

        this.initContentItems();
    }

    /** @internal */
    setParent(parent: AbstractContentItem): void {
        this._rowOrColumnParent = parent;
        super.setParent(parent);
    }

    /** @internal */
    private updateNodeSize(): void {
        if (this.contentItems.length > 0) {
            this.calculateRelativeSizes();
            this.setAbsoluteSizes();
        }
        this.emitBubblingEvent('stateChanged');
        this.emit('resize');
    }

    /**
     * Turns the relative sizes calculated by _calculateRelativeSizes into
     * absolute pixel values and applies them to the children's DOM elements
     *
     * Assigns additional pixels to counteract Math.floor
     * @internal
     */
    private setAbsoluteSizes() {
        const sizeData = this.calculateAbsoluteSizes();

        for (let i = 0; i < this.contentItems.length; i++) {
            if (sizeData.additionalPixel - i > 0) {
                sizeData.itemSizes[i]++;
            }

            if (this._isColumn) {
                setElementWidth(this.contentItems[i].element, sizeData.totalWidth);
                setElementHeight(this.contentItems[i].element, sizeData.itemSizes[i]);
            } else {
                setElementWidth(this.contentItems[i].element, sizeData.itemSizes[i]);
                setElementHeight(this.contentItems[i].element, sizeData.totalHeight);
            }
        }
    }

    /**
     * Calculates the absolute sizes of all of the children of this Item.
     * @returns Set with absolute sizes and additional pixels.
     * @internal
     */
    private calculateAbsoluteSizes() {
        const totalSplitterSize = (this.contentItems.length - 1) * this._splitterSize;
        const headerSize = this.layoutManager.managerConfig.dimensions.headerHeight;
        let { width: totalWidth, height: totalHeight } = getElementWidthAndHeight(this.element);

        if (this._isColumn) {
            totalHeight -= totalSplitterSize;
        } else {
            totalWidth -= totalSplitterSize;
        }
        for (let i = 0; i < this.contentItems.length; i++) {
            if (this.isDocked(i)) {
                if (this._isColumn) {
                    totalHeight -= headerSize - this._splitterSize;
                } else {
                    totalWidth -= headerSize - this._splitterSize;
                }
            }
        }

        let totalAssigned = 0;
        const itemSizes = [];

        for (let i = 0; i < this.contentItems.length; i++) {
            let itemSize: number;
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

        const additionalPixel = Math.floor((this._isColumn ? totalHeight : totalWidth) - totalAssigned);

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
     * @internal
     */
    private calculateRelativeSizes() {

        let total = 0;
        const itemsWithoutSetDimension: AbstractContentItem[] = [];

        for (let i = 0; i < this.contentItems.length; i++) {
            if (this.contentItems[i].config[this._dimension] !== undefined) {
                total += this.contentItems[i].config[this._dimension];
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
            for (let i = 0; i < itemsWithoutSetDimension.length; i++) {
                itemsWithoutSetDimension[i].config[this._dimension] = (100 - total) / itemsWithoutSetDimension.length;
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
                itemsWithoutSetDimension[i].config[this._dimension] = 50;
                total += 50;
            }
        }

        /**
         * Set every items size relative to 100 relative to its size to total
         */
        for (let i = 0; i < this.contentItems.length; i++) {
            this.contentItems[i].config[this._dimension] = (this.contentItems[i].config[this._dimension] / total) * 100;
        }

        this.respectMinItemWidth();
    }

    /**
     * Adjusts the column widths to respect the dimensions minItemWidth if set.
     * @internal
     */
    private respectMinItemWidth() {
        interface Entry {
            width: number;
        }

        const minItemWidth = this.layoutManager.managerConfig.dimensions.minItemWidth;
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
     * @internal
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
     * @internal
     */
    private getItemsForSplitter(splitter: Splitter) {
        const index = this._splitter.indexOf(splitter);

        return {
            before: this.contentItems[index],
            after: this.contentItems[index + 1]
        };
    }

    /** @internal */
    private isDocked(index: number) {
        if (index >= this.contentItems.length) {
            return false;
        } else {
            const contentItem = this.contentItems[index];
            if (contentItem instanceof Stack) {
                return contentItem.docker.docked;
            } else {
                return false;
            }
        }
    }

    /** @internal */
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
     * @internal
     */
    private validateDocking(): void {
        const can = this.contentItems.length - this.calculateDockedCount() > 1;
        for (let i = 0; i < this.contentItems.length; ++i) {
            const contentItem = this.contentItems[i];
            if (contentItem instanceof Stack) {
                contentItem.setDockable(this.isDocked(i) ?? can);
                contentItem.setRowColumnClosable(can);
            }
        }
    }

    /**
     * Gets the minimum dimensions for the given item configuration array
     * @internal
     */
    private _getMinimumDimensions(arr: readonly ItemConfig[]) {
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
     * @internal
     */
    private onSplitterDragStart(splitter: Splitter) {
        const items = this.getItemsForSplitter(splitter);
        const minSize = this.layoutManager.managerConfig.dimensions[this._isColumn ? 'minItemHeight' : 'minItemWidth'];

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
     * @internal
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
     * @internal
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

            globalThis.requestAnimationFrame(() => this.updateSize());
        }
    }
}

/** @internal */
export namespace RowOrColumn {
    export function getElementDimensionSize(element: HTMLElement, dimension: ItemConfig.HeightOrWidthPropertyName): number {
        if (dimension === 'width') {
            return getElementWidth(element);
        } else {
            return getElementHeight(element);
        }
    }

    export function setElementDimensionSize(element: HTMLElement, dimension: ItemConfig.HeightOrWidthPropertyName, value: number): void {
        if (dimension === 'width') {
            return setElementWidth(element, value);
        } else {
            return setElementHeight(element, value);
        }
    }

    export function createTemplateHtml(isColumn: boolean): string {
        return '<div class="lm_item lm_' + (isColumn ? 'column' : 'row') + '"></div>'
    }
}
