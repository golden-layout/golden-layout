import { ItemConfig } from '../config/config'
import { BrowserPopout } from '../controls/BrowserPopout'
import { ConfigurationError } from '../errors/external-error'
import { AssertError, UnexpectedNullError } from '../errors/internal-error'
import { LayoutManager } from '../LayoutManager'
import { EventEmitter } from '../utils/EventEmitter'
import { getJQueryOffset, getJQueryWidthAndHeight } from '../utils/jquery-legacy'
import { AreaLinkedRect } from '../utils/types'
import { setElementDisplayVisibility } from '../utils/utils'

/**
 * This is the baseclass that all content items inherit from.
 * Most methods provide a subset of what the sub-classes do.
 *
 * It also provides a number of functions for tree traversal
 */


export abstract class AbstractContentItem extends EventEmitter {
    private _pendingEventPropagations: Record<string, unknown>;
    private _throttledEvents: string[];
    private _isInitialised;
    private _isMaximised;

    contentItems: AbstractContentItem[];
    element: HTMLElement;
    isRoot: boolean
    isRow: boolean
    isColumn: boolean
    isStack: boolean
    isComponent: boolean

    get type(): ItemConfig.Type { return this._config.type; }
    get parent(): AbstractContentItem | null { return this._parent; }
    get config(): ItemConfig { return this._config; }
    get isInitialised(): boolean { return this._isInitialised; }
    get isMaximised(): boolean { return this._isMaximised; }

    /**
    *
    * @param {lm.LayoutManager} layoutManager
    * @param {item node configuration} config
    * @param {lm.item} _parent
    *
    * @event stateChanged
    * @event beforeItemDestroyed
    * @event itemDestroyed
    * @event itemCreated
    * @event componentCreated
    * @event rowCreated
    * @event columnCreated
    * @event stackCreated
    */
    constructor(readonly layoutManager: LayoutManager, private _config: ItemConfig, private _parent: AbstractContentItem | null) {

        super();

        this.contentItems = [];

        this._isInitialised = false;
        this._isMaximised = false;
        this.isRoot = false;
        this.isRow = false;
        this.isColumn = false;
        this.isStack = false;
        this.isComponent = false;

        this._pendingEventPropagations = {};
        this._throttledEvents = ['stateChanged'];

        this.on(EventEmitter.ALL_EVENT, (name, ...args: unknown[]) => this.propagateEvent(name as string, args));

        if (_config.content) {
            this.createContentItems(_config);
        }
    }

    /**
     * Updaters the size of the component and its children, called recursively
     */
    abstract updateSize(): void;

    /**
     * Removes a child node (and its children) from the tree
     */
    removeChild(contentItem: AbstractContentItem, keepChild = false): void {
        /*
         * Get the position of the item that's to be removed within all content items this node contains
         */
        const index = this.contentItems.indexOf(contentItem);

        /*
         * Make sure the content item to be removed is actually a child of this item
         */
        if (index === -1) {
            throw new Error('Can\'t remove child item. Unknown content item');
        }

        /**
		 * Call ._$destroy on the content item. 
		 * All children are destroyed as well
		 */
        if (keepChild !== true) {
			this.contentItems[index]._$destroy();
        }

        /**
         * Remove the content item from this nodes array of children
         */
        this.contentItems.splice(index, 1);

        /**
         * Remove the item from the configuration
         */
        this._config.content.splice(index, 1);

        /**
         * If this node still contains other content items, adjust their size
         */
        if (this.contentItems.length > 0) {
            this.updateSize();

            /**
             * If this was the last content item, remove this node as well
             */
        } else if (!this.isRoot && this._config.isClosable === true) {
            if (this._parent === null) {
                throw new UnexpectedNullError('CIUC00874');
            } else {
                this._parent.removeChild(this);
            }
        }
    }

    /**
     * Hides a child node (and its children) from the tree reclaiming its space in the layout
     */
    undisplayChild(contentItem: AbstractContentItem): void {
        /*
         * Get the position of the item that's to be removed within all content items this node contains
         */
        const index = this.contentItems.indexOf(contentItem);

        /*
         * Make sure the content item to be removed is actually a child of this item
         */
        if (index === -1) {
            throw new Error('Can\'t remove child item. Unknown content item');
        }

        if (!(this.isRoot) && this._config.isClosable === true) {
            if (this._parent === null) {
                throw new UnexpectedNullError('CIUC00874');
            } else {
                this._parent.undisplayChild(this);
            }
        }
    }

    /**
     * Sets up the tree structure for the newly added child
     * The responsibility for the actual DOM manipulations lies
     * with the concrete item
     *
     * @param contentItem
     * @param index If omitted item will be appended
     * @param suspendResize Used by descendent implementations
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    addChild(contentItem: AbstractContentItem, index?: number, suspendResize?: boolean): void {
        if (index === undefined) {
            index = this.contentItems.length;
        }

        this.contentItems.splice(index, 0, contentItem);

        if (this._config.content === undefined) {
            this._config.content = [];
        }

        this._config.content.splice(index, 0, contentItem._config);
        contentItem.setParent(this);

        if (this._isInitialised === true && contentItem._isInitialised === false) {
            contentItem._$init();
        }
    }

    /**
     * Replaces oldChild with newChild. This used to use jQuery.replaceWith... which for
     * some reason removes all event listeners, so isn't really an option.
     *
     * @param   {AbstractContentItem} oldChild
     * @param   {AbstractContentItem} newChild
     *
     * @returns {void}
     */
    replaceChild(oldChild: AbstractContentItem, newChild: AbstractContentItem, _$destroyOldChild = false): void {

        // newChild = this.layoutManager._$normalizeContentItem(newChild);

        const index = this.contentItems.indexOf(oldChild);
        const parentNode = oldChild.element.parentNode;

        if (index === -1) {
            throw new AssertError('CIRCI23232', 'Can\'t replace child. oldChild is not child of this');
        }

        if (parentNode === null) {
            throw new UnexpectedNullError('CIRCP23232');
        } else {
            parentNode.replaceChild(newChild.element, oldChild.element);

            /*
            * Optionally destroy the old content item
            */
            if (_$destroyOldChild === true) {
                oldChild._parent = null;
                oldChild._$destroy(); // will now also destroy all children of oldChild
            }

            /*
            * Wire the new contentItem into the tree
            */
            this.contentItems[index] = newChild;
            newChild.setParent(this);

            /*
            * Give descendants a chance to process replace using index - eg. used by Header to update tab
            */
            this.processChildReplaced(index, newChild)

            //TODO This doesn't update the config... refactor to leave item nodes untouched after creation
            if (newChild._parent === null) {
                throw new UnexpectedNullError('CIRCNC45699');
            } else {
                if (newChild._parent._isInitialised === true && newChild._isInitialised === false) {
                    newChild._$init();
                }

                this.updateSize();
            }
        }
    }

    /**
     * Convenience method.
     * Shorthand for this.parent.removeChild( this )
     */
    remove(): void {
        if (this._parent === null) {
            throw new UnexpectedNullError('CIR11110');
        } else {
            this._parent.removeChild(this);
        }
    }

    /**
     * Removes the component from the layout and creates a new
     * browser window with the component and its children inside
     */
    popout(): BrowserPopout {
        const browserPopout = this.layoutManager.createPopoutFromContentItem(this);
        this.emitBubblingEvent('stateChanged');
        return browserPopout;
    }

    /**
     * Maximises the Item or minimises it if it is already maximised
     */
    toggleMaximise(ev?: Event): void {
        if (ev !== undefined) {
            ev.preventDefault();
        }
        if (this._isMaximised === true) {
            this.layoutManager.minimiseItem(this);
        } else {
            this.layoutManager.maximiseItem(this);
        }

        this._isMaximised = !this._isMaximised;
        this.emitBubblingEvent('stateChanged');
    }

    /**
     * Selects the item if it is not already selected
     */
    select(): void {
        if (this.layoutManager.selectedItem !== this) {
            this.layoutManager.selectItem(this, true);
            this.element.classList.add('lm_selected');
        }
    }

    /**
     * De-selects the item if it is selected
     */
    deselect(): void {
        if (this.layoutManager.selectedItem === this) {
            this.layoutManager.selectedItem = null;
            this.element.classList.remove('lm_selected');
        }
    }

    /**
     * Set this component's title
     *
     * @public
     * @param {String} title
     *
     * @returns {void}
     */
    setTitle(title: string): void {
        this._config.title = title;
        this.emit('titleChanged', title);
        this.emit('stateChanged');
    }

    /**
     * Checks whether a provided id is present
     *
     * @param   id
     *
     * @returns isPresent
     */
    hasId(id: string): boolean {
        if (typeof this._config.id === 'string') {
            return this._config.id === id;
        } else {
            if (this._config.id instanceof Array) {
                return this._config.id.includes(id);
            } else {
                throw new AssertError('ACIHI55521', `ItemConfig.id is not string or string array ${this._config.id}`);
            }
        }
    }

    /**
     * Adds an id. Adds it as a string if the component doesn't
     * have an id yet or creates/uses an array
     */
    addId(id: string): void {
        if (this.hasId(id)) {
            return;
        }

        if (!this._config.id) {
            this._config.id = id;
        } else if (typeof this._config.id === 'string') {
            this._config.id = [this._config.id, id];
        } else if (this._config.id instanceof Array) {
            this._config.id.push(id);
        }
    }

    /**
     * Removes an existing id. Throws an error
     * if the id is not present
     */
    removeId(id: string): void {
        if (!this.hasId(id)) {
            throw new Error('Id not found');
        }

        if (typeof this._config.id === 'string') {
            this._config.id = [];
        } else if (this._config.id instanceof Array) {
            const index = this._config.id.indexOf(id);
            this._config.id.splice(index, 1);
        }
    }

    /****************************************
     * SELECTOR
     ****************************************/

    private deepFilterAddChildContentItems(contentItems: AbstractContentItem[],
        checkAcceptFtn: ((this: void, item: AbstractContentItem) => boolean)
    ): void {
        for (let i = 0; i < this.contentItems.length; i++) {
            const contentItem = this.contentItems[i];
            if (checkAcceptFtn(contentItem)) {
                contentItems.push(contentItem);
                contentItem.deepFilterAddChildContentItems(contentItems, checkAcceptFtn);
            }
        }
    }

    getItemsById(id: string): AbstractContentItem[] {
        const result: AbstractContentItem[] = [];
        this.deepFilterAddChildContentItems(result, (item) => ItemConfig.idEqualsOrContainsId(item._config.id, id));
        return result;
    }

    /****************************************
     * PACKAGE PRIVATE
     ****************************************/
    toConfig(): ItemConfig {
        const content = this.calculateConfigContent();
        return ItemConfig.createCopy(this._config, content);
    }

    calculateConfigContent(): ItemConfig[] {
        const contentItems = this.contentItems;
        const count = contentItems.length;
        const result = new Array<ItemConfig>(count);
        for (let i = 0; i < count; i++) {
            const item = contentItems[i];
            result[i] = item.toConfig();
        }
        return result;
    }

    deepAddChildContentItems(contentItems: AbstractContentItem[]): void {
        for (let i = 0; i < this.contentItems.length; i++) {
            const contentItem = this.contentItems[i];
            contentItems.push(contentItem);
            contentItem.deepAddChildContentItems(contentItems);
        }
    }

    _$highlightDropZone(x: number, y: number, area: AreaLinkedRect): void {
        const dropTargetIndicator = this.layoutManager.dropTargetIndicator;
        if (dropTargetIndicator === null) {
            throw new UnexpectedNullError('ACIHDZ5593');
        } else {
            dropTargetIndicator.highlightArea(area);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _$onDrop(contentItem: AbstractContentItem, area: AbstractContentItem.Area): void {
        this.addChild(contentItem);
    }

    _$hide(): void {
        this.layoutManager.hideAllActiveContentItems(); // not sure why this is done. (Code moved to Layout manager)
        setElementDisplayVisibility(this.element, false);
        this.layoutManager.updateSizeFromContainer();
    }

    _$show(): void {
        this.layoutManager.showAllActiveContentItems(); // not sure why this is done. (Code moved to Layout manager)
        setElementDisplayVisibility(this.element, true);
        this.layoutManager.updateSizeFromContainer();

        for (let i = 0; i < this.contentItems.length; i++) {
            this.contentItems[i]._$show();
        }
    }

    /**
     * Destroys this item ands its children
     */
    _$destroy(): void {
        for (let i = 0; i < this.contentItems.length; i++) {
            this.contentItems[i]._$destroy();
        }
        this.contentItems = [];

        this.emitBubblingEvent('beforeItemDestroyed');
        this.element.remove();
        this.emitBubblingEvent('itemDestroyed');
    }

    /**
     * Returns the area the component currently occupies in the format
     *
     * {
     *		x1: int
     *		xy: int
     *		y1: int
     *		y2: int
     *		contentItem: contentItem
     * }
     */
    getElementArea(element?: HTMLElement): AbstractContentItem.Area | null {
        element = element || this.element;

        const offset = getJQueryOffset(element);
        const widthAndHeight = getJQueryWidthAndHeight(element);

        return {
            x1: offset.left,
            y1: offset.top,
            x2: offset.left + widthAndHeight.width,
            y2: offset.top + widthAndHeight.height,
            surface: widthAndHeight.width * widthAndHeight.height,
            contentItem: this
        };
    }

    /**
     * The tree of content items is created in two steps: First all content items are instantiated,
     * then init is called recursively from top to bottem. This is the basic init function,
     * it can be used, extended or overwritten by the content items
     *
     * Its behaviour depends on the content item
     *
     * @package private
     *
     * @returns {void}
     */
    _$init(): void {
        this._isInitialised = true;
        this.emitBubblingEvent('itemCreated');
        this.emitUnknownBubblingEvent(this.type + 'Created');
    }

    setParent(parent: AbstractContentItem): void {
        this._parent = parent;
    }

    protected initContentItems(): void {
        for (let i = 0; i < this.contentItems.length; i++) {
            this.contentItems[i]._$init();
        }
    }

    protected updateContentItemsSize(): void {
        for (let i = 0; i < this.contentItems.length; i++) {
            this.contentItems[i].updateSize();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected processChildReplaced(index: number, newChild: AbstractContentItem): void {
        // virtual function to allow descendants to further process replaceChild()
    }

    /**
     * Private method, creates all content items for this node at initialisation time
     * PLEASE NOTE, please see addChild for adding contentItems add runtime
     */
    private createContentItems(config: ItemConfig) {
        if (!(config.content instanceof Array)) {
            throw new ConfigurationError('content must be an Array', config);
        }

        for (let i = 0; i < config.content.length; i++) {
            const oContentItem = this.layoutManager.createContentItem(config.content[i], this);
            this.contentItems.push(oContentItem);
        }
    }

    /**
     * Called for every event on the item tree. Decides whether the event is a bubbling
     * event and propagates it to its parent
     *
     * @param    name the name of the event
     * @param   event
     */
    private propagateEvent(name: string, args: unknown[]) {
        if (args.length === 1) {
            const event = args[0];
            if (event instanceof EventEmitter.BubblingEvent &&
                event.isPropagationStopped === false &&
                this._isInitialised === true) {

                /**
                 * In some cases (e.g. if an element is created from a DragSource) it
                 * doesn't have a parent and is not below root. If that's the case
                 * propagate the bubbling event from the top level of the substree directly
                 * to the layoutManager
                 */
                if (this.isRoot === false && this._parent) {
                    this._parent.emitUnknown(name, event);
                } else {
                    this.scheduleEventPropagationToLayoutManager(name, event);
                }
            }
        }
    }

    /**
     * All raw events bubble up to the root element. Some events that
     * are propagated to - and emitted by - the layoutManager however are
     * only string-based, batched and sanitized to make them more usable
     *
     * @param {String} name the name of the event
     */
    private scheduleEventPropagationToLayoutManager(name: string, event: EventEmitter.BubblingEvent) {
        if (this._throttledEvents.indexOf(name) === -1) {
            this.layoutManager.emitUnknown(name, event.origin);
        } else {
            if (this._pendingEventPropagations[name] !== true) {
                this._pendingEventPropagations[name] = true;
                globalThis.requestAnimationFrame(() => this.propagateEventToLayoutManager(name, event));
            }
        }

    }

    /**
     * Callback for events scheduled by _scheduleEventPropagationToLayoutManager
     *
     * @param name the name of the event
     */
    private propagateEventToLayoutManager(name: string, event: EventEmitter.BubblingEvent) {
        this._pendingEventPropagations[name] = false;
        this.layoutManager.emitUnknown(name, event);
    }
}

export namespace AbstractContentItem {
    export interface Area extends AreaLinkedRect {
        surface: number;
        contentItem: AbstractContentItem;
    }
}
