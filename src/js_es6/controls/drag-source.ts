import { ItemConfig } from '../config/config';
import { UnexpectedNullError } from '../errors/internal-error';
import { GroundItem } from '../items/ground-item';
import { LayoutManager } from '../layout-manager';
import { DragListener } from '../utils/drag-listener';
import { DragProxy } from './drag-proxy';

/**
 * Allows for any DOM item to create a component on drag
 * start tobe dragged into the Layout
 * @internal
 */
export class DragSource {
    private _dragListener: DragListener | null;
    private _dummyGroundContainer: HTMLElement;
    private _dummyGroundContentItem: GroundItem;
 
    constructor(private _element: HTMLElement, private _itemConfigOrFtn: ItemConfig | (() => ItemConfig), private _layoutManager: LayoutManager) {
        this._dragListener = null;

        // Need to review dummyGroundContainer
        // Should this part of a fragment or template?
        // Does this need to be regenerated with each drag operation?
        this._dummyGroundContainer = document.createElement('div');

        this._dummyGroundContentItem = new GroundItem(this._layoutManager, this._layoutManager.layoutConfig.root, this._dummyGroundContainer);

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
        this._dragListener.on('dragStart', (x, y) => this.onDragStart(x, y));
        this._dragListener.on('dragStop', () => this.onDragStop());
    }

    /**
     * Callback for the DragListener's dragStart event
     *
     * @param x - The x position of the mouse on dragStart
     * @param y - The x position of the mouse on dragStart
     */
    private onDragStart(x: number, y: number) {
        let itemConfig: ItemConfig;
        if (typeof this._itemConfigOrFtn === "function") {
            itemConfig = this._itemConfigOrFtn();
        } else {
            itemConfig = this._itemConfigOrFtn;
        }

        // const contentItem = this._layoutManager._$normalizeContentItem($.extend(true, {}, itemConfig));
        const copiedConfig = ItemConfig.createCopy(itemConfig);

        // Create a dummy ContentItem only for drag purposes
        // All ContentItems (except for GroundItem) need a parent.  When dragging, the parent is not used.
        // Instead of allowing null parents (as Javascript version did), use a temporary dummy GroundItem parent and add ContentItem to that
        // If this does not work, need to create alternative GroundItem class
        
        const contentItem = this._layoutManager.createAndInitContentItem(copiedConfig, this._dummyGroundContentItem);

        if (this._dragListener === null) {
            throw new UnexpectedNullError('DSODSD66746');
        } else {
            const dragProxy = new DragProxy(x, y, this._dragListener, this._layoutManager, contentItem, this._dummyGroundContentItem);

            const transitionIndicator = this._layoutManager.transitionIndicator;
            if (transitionIndicator === null) {
                throw new UnexpectedNullError('DSODST66746');
            } else {
                transitionIndicator.transitionElements(this._element, dragProxy.element);
            }
        }
    }

    private onDragStop() {
        // if (this._dummyGroundContentItem === undefined) {
        //     throw new UnexpectedUndefinedError('DSODSDRU08116');
        // } else {
        //     this._dummyGroundContentItem._$destroy
        //     this._dummyGroundContentItem = undefined;
        // }
        this.createDragListener();
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
