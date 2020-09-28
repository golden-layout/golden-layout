import { ItemConfig } from '../config/config';
import { DragProxy } from '../controls/DragProxy';
import { LayoutManager } from '../LayoutManager';
import { DragListener } from '../utils/DragListener';

/**
 * Allows for any DOM item to create a component on drag
 * start tobe dragged into the Layout
 *
 * @param {jQuery element} element
 * @param {Object} itemConfig the configuration for the contentItem that will be created
 * @param {LayoutManager} layoutManager
 *
 * @constructor
 */
export class DragSource {
    private _dragListener: DragListener | null;
    constructor(private _element: HTMLElement, private _itemConfig: ItemConfig, private _layoutManager: LayoutManager) {
        this._dragListener = null;

        this.createDragListener();
    }

	/**
	 * Disposes of the drag listeners so the drag source is not usable any more.
	 */
	destroy(): void {
		this.removeDragListener();
    }
    
    /**
     * Called initially and after every drag
     */
    private createDragListener() {
        this.removeDragListener();

        this._dragListener = new DragListener(this._element);
        this._dragListener.on('dragStart', this.onDragStart);
        this._dragListener.on('dragStop', this.createDragListener);
    }

    /**
     * Callback for the DragListener's dragStart event
     *
     * @param   {int} x the x position of the mouse on dragStart
     * @param   {int} y the x position of the mouse on dragStart
     */
    private onDragStart(x: number, y: number) {
        const itemConfig = this._itemConfig;
        // if (isFunction(itemConfig)) {
        //     itemConfig = itemConfig();
        // }
        const
        const contentItem = this._layoutManager._$normalizeContentItem($.extend(true, {}, itemConfig));
        const dragProxy = new DragProxy(x, y, this._dragListener, this._layoutManager, contentItem, null);

        this._layoutManager.transitionIndicator.transitionElements(this._element, dragProxy.element);
    }

    /**
	 * Called after every drag and when the drag source is being disposed of.
	 */
	private removeDragListener() {
		if (this._dragListener !== null ) {
            this._dragListener.destroy();
            this._dragListener = null;
		}
	}
}
