import { ItemConfig } from '../config/config'
import { BrowserPopout } from '../controls/BrowserPopout'
import { ConfigurationError } from '../errors/external-error'
import { AssertError, UnexpectedNullError } from '../errors/internal-error'
import { LayoutManager } from '../LayoutManager'
import { EventEmitter } from '../utils/EventEmitter'
import { getJQueryOffset, getJQueryWidthAndHeight } from '../utils/jquery-legacy'
import { AreaLinkedRect } from '../utils/types'
import { getUniqueId, setElementDisplayVisibility } from '../utils/utils'
import { ComponentItem } from './ComponentItem'
import { Stack } from './Stack'

/**
 * This is the baseclass that all content items inherit from.
 * Most methods provide a subset of what the sub-classes do.
 *
 * It also provides a number of functions for tree traversal
 */

export abstract class AbstractContentItem extends EventEmitter {
    /** @internal */
    private _contentItems: AbstractContentItem[];
    /** @internal */
    private _pendingEventPropagations: Record<string, unknown>;
    /** @internal */
    private _throttledEvents: string[];
    /** @internal */
    private _isInitialised;
    /** @internal */
    private _isMaximised;

    isRoot: boolean
    isRow: boolean
    isColumn: boolean
    isStack: boolean
    isComponent: boolean

    get type(): ItemConfig.Type { return this._config.type; }
    get parent(): AbstractContentItem | null { return this._parent; }
    get config(): ItemConfig { return this._config; }
    get contentItems(): AbstractContentItem[] { return this._contentItems; }
    get element(): HTMLElement { return this._element; }
    get isInitialised(): boolean { return this._isInitialised; }
    get isMaximised(): boolean { return this._isMaximised; }

    static isStack(item: AbstractContentItem): item is Stack {
        return item.isStack;
    }

    static isComponentItem(item: AbstractContentItem): item is ComponentItem {
        return item.isComponent;
    }

    /** @internal */
    constructor(readonly layoutManager: LayoutManager,
        private _config: ItemConfig,
        private _parent: AbstractContentItem | null,
        private readonly _element: HTMLElement
    ) {
        super();

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

        this._contentItems = this.createContentItems(this._config);
    }

    /**
     * Updaters the size of the component and its children, called recursively
     * @internal
     */
    abstract updateSize(): void;

    /**
     * Removes a child node (and its children) from the tree
     */
    removeChild(contentItem: AbstractContentItem, keepChild = false): void {
        /*
         * Get the position of the item that's to be removed within all content items this node contains
         */
        const index = this._contentItems.indexOf(contentItem);

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
        if (!keepChild) {
			this._contentItems[index].destroy();
        }

        /**
         * Remove the content item from this nodes array of children
         */
        this._contentItems.splice(index, 1);

        /**
         * Remove the item from the configuration
         */
        const content = this._config.content;
        const contentCount = content.length;
        if (contentCount === 1) {
            this._config.content = [];
        } else {
            this._config.content = [...content.slice(0, index), ...content.slice(index + 1, contentCount)];
        }

        /**
         * If this node still contains other content items, adjust their size
         */
        if (this._contentItems.length > 0) {
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
     * Sets up the tree structure for the newly added child
     * The responsibility for the actual DOM manipulations lies
     * with the concrete item
     *
     * @param contentItem
     * @param index If omitted item will be appended
     * @param suspendResize Used by descendent implementations
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    addChild(contentItem: AbstractContentItem, index?: number | null, suspendResize?: boolean): void {
        index ??= this._contentItems.length;

        this._contentItems.splice(index, 0, contentItem);

        if (this._config.content === undefined) {
            this._config.content = [];
        }

        const content = this._config.content;
        const contentCount = content.length;
        if (contentCount === 0) {
            this._config.content = [contentItem._config];
        } else {
            this._config.content = [...content.slice(0, index), contentItem._config, ...content.slice(index, contentCount)];
        }
        contentItem.setParent(this);

        if (this._isInitialised === true && contentItem._isInitialised === false) {
            contentItem.init();
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

        const index = this._contentItems.indexOf(oldChild);
        const parentNode = oldChild._element.parentNode;

        if (index === -1) {
            throw new AssertError('CIRCI23232', 'Can\'t replace child. oldChild is not child of this');
        }

        if (parentNode === null) {
            throw new UnexpectedNullError('CIRCP23232');
        } else {
            parentNode.replaceChild(newChild._element, oldChild._element);

            /*
            * Optionally destroy the old content item
            */
            if (_$destroyOldChild === true) {
                oldChild._parent = null;
                oldChild.destroy(); // will now also destroy all children of oldChild
            }

            /*
            * Wire the new contentItem into the tree
            */
            this._contentItems[index] = newChild;
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
                    newChild.init();
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
        const parentId = getUniqueId();
        const browserPopout = this.layoutManager.createPopoutFromContentItem(this, undefined, parentId, undefined);
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
            this._element.classList.add('lm_selected');
        }
    }

    /**
     * De-selects the item if it is selected
     */
    deselect(): void {
        if (this.layoutManager.selectedItem === this) {
            this.layoutManager.clearSelectedItem();
            this._element.classList.remove('lm_selected');
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

    getItemsById(id: string): AbstractContentItem[] {
        const result: AbstractContentItem[] = [];
        this.deepFilterAddChildContentItems(result, (item) => ItemConfig.idEqualsOrContainsId(item._config.id, id));
        return result;
    }

    toConfig(): ItemConfig {
        const content = this.calculateConfigContent();
        return ItemConfig.createCopy(this._config, content);
    }

    /** @internal */
    calculateConfigContent(): ItemConfig[] {
        const contentItems = this._contentItems;
        const count = contentItems.length;
        const result = new Array<ItemConfig>(count);
        for (let i = 0; i < count; i++) {
            const item = contentItems[i];
            result[i] = item.toConfig();
        }
        return result;
    }

    /** @internal */
    deepAddChildContentItems(contentItems: AbstractContentItem[]): void {
        for (let i = 0; i < this._contentItems.length; i++) {
            const contentItem = this._contentItems[i];
            contentItems.push(contentItem);
            contentItem.deepAddChildContentItems(contentItems);
        }
    }

    /** @internal */
    highlightDropZone(x: number, y: number, area: AreaLinkedRect): void {
        const dropTargetIndicator = this.layoutManager.dropTargetIndicator;
        if (dropTargetIndicator === null) {
            throw new UnexpectedNullError('ACIHDZ5593');
        } else {
            dropTargetIndicator.highlightArea(area);
        }
    }

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onDrop(contentItem: AbstractContentItem, area: AbstractContentItem.Area): void {
        this.addChild(contentItem);
    }

    /** @internal */
    show(): void {
        this.layoutManager.showAllActiveContentItems(); // not sure why this is done. (Code moved to Layout manager)
        setElementDisplayVisibility(this._element, true);
        this.layoutManager.updateSizeFromContainer();

        for (let i = 0; i < this._contentItems.length; i++) {
            this._contentItems[i].show();
        }
    }

    /**
     * Destroys this item ands its children
     * @internal
     */
    destroy(): void {
        for (let i = 0; i < this._contentItems.length; i++) {
            this._contentItems[i].destroy();
        }
        this._contentItems = [];

        this.emitBubblingEvent('beforeItemDestroyed');
        this._element.remove();
        this.emitBubblingEvent('itemDestroyed');
    }

    /**
     * Returns the area the component currently occupies
     * @internal
     */
    getElementArea(element?: HTMLElement): AbstractContentItem.Area | null {
        element = element ?? this._element;

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
     * @internal
     */
    init(): void {
        this._isInitialised = true;
        this.emitBubblingEvent('itemCreated');
        this.emitUnknownBubblingEvent(this.type + 'Created');
    }

    /** @internal */
    setParent(parent: AbstractContentItem): void {
        this._parent = parent;
    }

    /** @internal */
    protected initContentItems(): void {
        for (let i = 0; i < this._contentItems.length; i++) {
            this._contentItems[i].init();
        }
    }

    /** @internal */
    protected hide(): void {
        this.layoutManager.hideAllActiveContentItems(); // not sure why this is done. (Code moved to Layout manager)
        setElementDisplayVisibility(this._element, false);
        this.layoutManager.updateSizeFromContainer();
    }

    /** @internal */
    protected updateContentItemsSize(): void {
        for (let i = 0; i < this._contentItems.length; i++) {
            this._contentItems[i].updateSize();
        }
    }

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected processChildReplaced(index: number, newChild: AbstractContentItem): void {
        // virtual function to allow descendants to further process replaceChild()
    }

    /**
     * creates all content items for this node at initialisation time
     * PLEASE NOTE, please see addChild for adding contentItems at runtime
     * @internal
     */
    private createContentItems(config: ItemConfig) {
        if (!(config.content instanceof Array)) {
            throw new ConfigurationError('content must be an Array', JSON.stringify(config));
        } else {
            const count = config.content.length;
            const result = new Array<AbstractContentItem>(count);
            for (let i = 0; i < config.content.length; i++) {
                result[i] = this.layoutManager.createContentItem(config.content[i], this);
            }
            return result;
        }
    }

    /** @internal */
    private deepFilterAddChildContentItems(contentItems: AbstractContentItem[],
        checkAcceptFtn: ((this: void, item: AbstractContentItem) => boolean)
    ): void {
        for (let i = 0; i < this._contentItems.length; i++) {
            const contentItem = this._contentItems[i];
            if (checkAcceptFtn(contentItem)) {
                contentItems.push(contentItem);
                contentItem.deepFilterAddChildContentItems(contentItems, checkAcceptFtn);
            }
        }
    }

    /**
     * Called for every event on the item tree. Decides whether the event is a bubbling
     * event and propagates it to its parent
     *
     * @param    name the name of the event
     * @param   event
     * @internal
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
     * @internal
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
     * @internal
     */
    private propagateEventToLayoutManager(name: string, event: EventEmitter.BubblingEvent) {
        this._pendingEventPropagations[name] = false;
        this.layoutManager.emitUnknown(name, event);
    }
}

/** @internal */
export namespace AbstractContentItem {
    export interface Area extends AreaLinkedRect {
        surface: number;
        contentItem: AbstractContentItem;
    }
}
