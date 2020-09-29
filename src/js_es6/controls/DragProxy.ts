import { AbstractContentItem } from '../items/AbstractContentItem';
import { LayoutManager } from '../LayoutManager';
import { DragListener } from '../utils/DragListener';
import { EventEmitter } from '../utils/EventEmitter';
import {
    createTemplateHtmlElement,
    numberToPixels,
    stripTags
} from '../utils/utils';

const _template = '<div class="lm_dragProxy">' +
    '<div class="lm_header">' +
    '<ul class="lm_tabs">' +
    '<li class="lm_tab lm_active"><i class="lm_left"></i>' +
    '<span class="lm_title"></span>' +
    '<i class="lm_right"></i></li>' +
    '</ul>' +
    '</div>' +
    '<div class="lm_content"></div>' +
    '</div>';

/**
 * This class creates a temporary container
 * for the component whilst it is being dragged
 * and handles drag events
 *
 * @constructor
 * @private
 *
 * @param {Number} x              The initial x position
 * @param {Number} y              The initial y position
 * @param {DragListener} dragListener
 * @param {lm.LayoutManager} layoutManager
 * @param {AbstractContentItem} contentItem
 * @param {AbstractContentItem} originalParent
 */
export class DragProxy extends EventEmitter {
    private _area: AbstractContentItem.Area | null;
    private _lastValidArea: AbstractContentItem.Area | null;
    private _minX: number;
    private _minY: number;
    private _maxX: number;
    private _maxY: number;
    private _contentItemParent: AbstractContentItem;
    private _sided: boolean;
    element: HTMLElement;

    constructor(x: number, y: number,
        private readonly _dragListener: DragListener,
        private readonly _layoutManager: LayoutManager,
        private readonly _contentItem: AbstractContentItem,
        private readonly _originalParent: HTMLElement) {

        super();

        this._area = null;
        this._lastValidArea = null;

        this._dragListener.on('drag', (offsetX, offsetY, event) => this.onDrag(offsetX, offsetY, event));
        this._dragListener.on('dragStop', () => this.onDrop());

        this.element = createTemplateHtmlElement(_template, 'div');
        if (this._originalParent !== undefined && originalParent._side) {
            this._sided = originalParent._sided;
            this.element.addClass('lm_' + originalParent._side);
            if (['right', 'bottom'].indexOf(originalParent._side) >= 0)
                this.element.find('.lm_content').after(this.element.find('.lm_header'));
        }
        this.element.css({
            left: x,
            top: y
        });
        this.element.find('.lm_tab').attr('title', stripTags(this._contentItem.config.title));
        this.element.find('.lm_title').html(this._contentItem.config.title);
        this.childElementContainer = this.element.find('.lm_content');
        this.childElementContainer.append(contentItem.element);

        this._undisplayTree();
        this._layoutManager.calculateItemAreas();
        this.setDimensions();

        $(document.body).append(this.element);

        var offset = this._layoutManager.container.offset();

        this._minX = offset.left;
        this._minY = offset.top;
        this._maxX = this._layoutManager.container.width() + this._minX;
        this._maxY = this._layoutManager.container.height() + this._minY;
        this._width = this.element.width();
        this._height = this.element.height();

        this._setDropPosition(x, y);
    }

    /**
     * Callback on every mouseMove event during a drag. Determines if the drag is
     * still within the valid drag area and calls the layoutManager to highlight the
     * current drop area
     *
     * @param   {Number} offsetX The difference from the original x position in px
     * @param   {Number} offsetY The difference from the original y position in px
     * @param   {jQuery DOM event} event
     *
     * @returns {void}
     */
    private onDrag(offsetX: number, offsetY: number, event: EventEmitter.DragEvent) {

        const x = event.pageX;
        const y = event.pageY;
        const isWithinContainer = x > this._minX && x < this._maxX && y > this._minY && y < this._maxY;

        if (!isWithinContainer && this._layoutManager.config.settings?.constrainDragToContainer === true) {
            return;
        }

        this._setDropPosition(x, y);
    }

    /**
     * Sets the target position, highlighting the appropriate area
     *
     * @param   {Number} x The x position in px
     * @param   {Number} y The y position in px
     *
     * @private
     *
     * @returns {void}
     */
    _setDropPosition(x, y) {
        this.element.css({
            left: x,
            top: y
        });
        this._area = this._layoutManager.getArea(x, y);

        if (this._area !== null) {
            this._lastValidArea = this._area;
            this._area.contentItem._$highlightDropZone(x, y, this._area);
        }
    }

    /**
     * Callback when the drag has finished. Determines the drop area
     * and adds the child to it
     *
     * @private
     *
     * @returns {void}
     */
    onDrop() {
        this.updateTree()
        this._layoutManager.dropTargetIndicator.hide();

        /*
         * Valid drop area found
         */
        if (this._area !== null) {
            this._area.contentItem._$onDrop(this._contentItem, this._area);

            /**
             * No valid drop area available at present, but one has been found before.
             * Use it
             */
        } else if (this._lastValidArea !== null) {
            this._lastValidArea.contentItem._$onDrop(this._contentItem, this._lastValidArea);

            /**
             * No valid drop area found during the duration of the drag. Return
             * content item to its original position if a original parent is provided.
             * (Which is not the case if the drag had been initiated by createDragSource)
             */
        } else if (this._originalParent) {
            this._originalParent.addChild(this._contentItem);

            /**
             * The drag didn't ultimately end up with adding the content item to
             * any container. In order to ensure clean up happens, destroy the
             * content item.
             */
        } else {
            this._contentItem._$destroy();
        }

        this.element.remove();

        this._layoutManager.emit('itemDropped', this._contentItem);
    }

    /**
     * Undisplays the item from its original position within the tree
     */
    private _undisplayTree() {

        /**
         * parent is null if the drag had been initiated by a external drag source
         */
        if (this._contentItem.parent !== null) {
            this._contentItem.parent.undisplayChild(this._contentItem);
        }
    }

    /**
     * Removes the item from its original position within the tree
     */
    private updateTree() {
        /**
         * parent is null if the drag had been initiated by a external drag source
         */
        if (this._contentItem.parent !== null) {
            this._contentItem.parent.removeChild(this._contentItem, true);
        }

        this._contentItem.setParent(this._contentItemParent);
    }

    /**
     * Updates the Drag Proxie's dimensions
     */
    private setDimensions() {
        const dimensions = this._layoutManager.config.dimensions;
        if (dimensions === undefined) {
            throw new Error('DragProxy.setDimensions: dimensions undefined');
        } else {
            let width = dimensions.dragProxyWidth;
            let height = dimensions.dragProxyHeight;
            if (width === undefined || height === undefined) {
                throw new Error('DragProxy.setDimensions: width and/or height undefined');
            } else {
                this.element.style.width = numberToPixels(width);
                this.element.style.height = numberToPixels(height)
                width -= (this._sided ? dimensions.headerHeight : 0);
                height -= (!this._sided ? dimensions.headerHeight : 0);
                this.childElementContainer.width(width);
                this.childElementContainer.height(height);
                this._contentItem.element.width(width);
                this._contentItem.element.height(height);
                this._contentItem.callDownwards('_$show');
                this._contentItem.callDownwards('setSize');
            }
        }
    }
}
