import { ComponentConfig, ItemConfig, ManagerConfig, PopoutManagerConfig, StackItemConfig } from './config/config'
import { UserItemConfig } from './config/UserConfig'
import { BrowserPopout } from './controls/BrowserPopout'
import { DragSource } from './controls/DragSource'
import { DropTargetIndicator } from './controls/DropTargetIndicator'
import { TransitionIndicator } from './controls/TransitionIndicator'
import { ConfigurationError, UnexpectedNullError, UnreachableCaseError } from './errors/error'
import { AbstractContentItem } from './items/AbstractContentItem'
import { Component } from './items/Component'
import { Root } from './items/Root'
import { RowOrColumn } from './items/RowOrColumn'
import { Stack } from './items/Stack'
import { ConfigMinifier } from './utils/ConfigMinifier'
import { EventEmitter } from './utils/EventEmitter'
import { EventHub } from './utils/EventHub'
import { getJQueryLeftAndTop } from './utils/jquery-legacy'
import { Rect } from './utils/types'
import {
    copy,
    createTemplateHtmlElement,
    fnBind,
    getElementHeight,
    getElementWidth,
    getUniqueId,
    indexOf,
    isFunction,


    removeFromArray,


    stripTags
} from './utils/utils'


declare global {
    interface Window {
        __glInstance: LayoutManager;
    }
}

/**
 * The main class that will be exposed as GoldenLayout.
 *
 * @public
 * @constructor
 * @param {GoldenLayout config} config
 * @param {[DOM element container]} container Can be a jQuery selector string or a Dom element. Defaults to body
 *
 * @returns {VOID}
 */


export abstract class LayoutManager extends EventEmitter {
    private _isFullPage = false;
    private _resizeTimeoutId: NodeJS.Timeout | undefined;
    private _componentConstructors: Record<string, Component.InstanceConstructor> = {};
    private _itemAreas: AbstractContentItem.Area[];
    private _maximisedItem: AbstractContentItem | null;
    private _maximisePlaceholder: JQuery<HTMLElement>;
    private _creationTimeoutPassed: boolean;
    private _subWindowsCreated = false;
    private _dragSources: DragSource[];
    private _updatingColumnsResponsive: boolean;
    private _firstLoad: boolean;
    private _getComponentConstructorFtn: LayoutManager.GetComponentConstructorFtn;

    private _windowResizeListener = () => this._onResize();
    private _windowUnloadListener = () => this._onUnload();
    private _maximisedItemBeforeDestroyedListener = (ev: EventEmitter.BubblingEvent) => this.cleanupBeforeMaximisedItemDestroyed(ev);

    isInitialised = false;

    width: number | null;
    height: number | null;
    root: Root | null;
    openPopouts: BrowserPopout[];
    selectedItem: { deselect: () => void } | null;
    eventHub: EventHub;
    container: HTMLElement;
    dropTargetIndicator: DropTargetIndicator | null;
    transitionIndicator: TransitionIndicator | null;
    tabDropPlaceholder: JQuery<HTMLElement>;

    protected get maximisedItem(): AbstractContentItem | null { return this._maximisedItem; }

    constructor(public isSubWindow: boolean, public readonly config: ManagerConfig, container?: HTMLElement) {        
        super();

        this._itemAreas = [];
        this._maximisedItem = null;
        this._maximisePlaceholder = $('<div class="lm_maximise_place"></div>');
        this._creationTimeoutPassed = false;
        this._dragSources = [];
        this._updatingColumnsResponsive = false;
        this._firstLoad = true;

        this.width = null;
        this.height = null;
        this.root = null;
        this.openPopouts = [];
        this.selectedItem = null;
        this.eventHub = new EventHub(this);
        this.dropTargetIndicator = null;
        this.transitionIndicator = null;
        this.tabDropPlaceholder = $('<div class="lm_drop_tab_placeholder"></div>');

        // if (this.isSubWindow === true) {
        //     $('body').css('visibility', 'hidden');
        // }
    }

    /**
     * Takes a GoldenLayout configuration object and
     * replaces its keys and values recursively with
     * one letter codes
     */
    minifyConfig(config: ManagerConfig): ManagerConfig {
        return (new ConfigMinifier()).minifyConfig(config);
    }

    /**
     * Takes a configuration Object that was previously minified
     * using minifyConfig and returns its original version
     */
    unminifyConfig(config: ManagerConfig): ManagerConfig {
        return (new ConfigMinifier()).unminifyConfig(config);
    }

    /**
     * Register a component with the layout manager. If a configuration node
     * of type component is reached it will look up componentName and create the
     * associated component
     *
     *  {
     *    type: "component",
     *    componentName: "EquityNewsFeed",
     *    componentState: { "feedTopic": "us-bluechips" }
     *  }
     *
     */
    registerComponent(name: string, componentConstructor: Component.InstanceConstructor): void {
        if (typeof componentConstructor !== 'function') {
            throw new Error('Please register a constructor function');
        }

        if (this._componentConstructors[name] !== undefined) {
            throw new Error('Component ' + name + ' is already registered');
        }

        this._componentConstructors[name] = componentConstructor;
    }

    /**
     * Register a component function with the layout manager. This function should
     * return a constructor for a component based on a config.  If undefined is returned, 
     * and no component has been registered under that name using registerComponent, an 
     * error will be thrown.
     */
    registerComponentFunction(callbackClosure: LayoutManager.GetComponentConstructorFtn): void {
        if (typeof callbackClosure !== 'function') {
            throw new Error('Please register a callback function');
        }

        if (this._getComponentConstructorFtn !== undefined) {
            console.warn('Multiple component functions are being registered.  Only the final registered function will be used.')
        }

        this._getComponentConstructorFtn = callbackClosure;
    }

    /**
     * Creates a layout configuration object based on the the current state
     *
     * @public
     * @returns {Object} GoldenLayout configuration
     */
    toConfig(root?: AbstractContentItem): ManagerConfig {
        if (this.isInitialised === false) {
            throw new Error('Can\'t create config, layout not yet initialised');
        }

        if (root !== undefined && !(root instanceof AbstractContentItem)) {
            throw new Error('Root must be a ContentItem');
        }

        /*
         * Content
         */
        let content: ItemConfig[];

        if (root !== undefined) {
            content = root.calculateConfigContent();
        } else {
            if (this.root === null) {
                throw new UnexpectedNullError('LMTC18244');
            } else {
                content = this.root.calculateConfigContent();
            }
        }

        /*
         * Retrieve config for subwindows
         */
        this.reconcilePopoutWindows();
        const openPopouts: PopoutManagerConfig[] = [];
        for (let i = 0; i < this.openPopouts.length; i++) {
            openPopouts.push(this.openPopouts[i].toConfig());
        }

        return this.createToConfig(content, openPopouts);
    }

    /**
     * Returns a previously registered component.  Attempts to utilize registered 
     * component by name first, then falls back to the component function.  If either
     * lack a response for what the component should be, it throws an error.
     *
     * @param config - The item config
     */
    getComponentConstructor(config: ComponentConfig): Component.InstanceConstructor {
        const name = this.getComponentNameFromConfig(config)
        let constructorToUse = this._componentConstructors[name]
        if (constructorToUse === undefined && this._getComponentConstructorFtn !== undefined) {
            constructorToUse = this._getComponentConstructorFtn(config)
        }
        if (constructorToUse === undefined) {
            throw new ConfigurationError('Unknown component constructor "' + name + '"', undefined);
        }

        return constructorToUse;
    }

    /**
     * Creates the actual layout. Must be called after all initial components
     * are registered. Recurses through the configuration and sets up
     * the item tree.
     *
     * If called before the document is ready it adds itself as a listener
     * to the document.ready event
     *
     * @public
     *
     * @returns {void}
     */
    init(): void {

        /**
         * Create the popout windows straight away. If popouts are blocked
         * an error is thrown on the same 'thread' rather than a timeout and can
         * be caught. This also prevents any further initilisation from taking place.
         */
        if (this._subWindowsCreated === false) {
            this.createSubWindows();
            this._subWindowsCreated = true;
        }


        /**
         * If the document isn't ready yet, wait for it.
         */
        if (document.readyState === 'loading' || document.body === null) {
            $(document).ready(() => this.init());
            return;
        }

        /**
         * If this is a subwindow, wait a few milliseconds for the original
         * page's js calls to be executed, then replace the bodies content
         * with GoldenLayout
         */
        if (this.isSubWindow === true && this._creationTimeoutPassed === false) {
            setTimeout(() => this.init, 7);
            this._creationTimeoutPassed = true;
            return;
        }

        if (this.isSubWindow === true) {
            this._adjustToWindowMode();
        }

        this._setContainer();
        this.dropTargetIndicator = new DropTargetIndicator(/*this.container*/);
        this.transitionIndicator = new TransitionIndicator();
        this.updateSizeFromContainer();
        this.create(this.config);
        this.bindEvents();
        this.isInitialised = true;
        this.adjustColumnsResponsive();
        this.emit('initialised');
    }

    /**
     * Updates the layout managers size
     *
     * @param width  width in pixels
     * @param height height in pixels
     */
    updateSize(width: number, height: number): void {
        this.width = width;
        this.height = height;

        if (this.isInitialised === true) {
            this.root.callDownwards('setSize', [this.width, this.height]);

            if (this._maximisedItem) {
                this._maximisedItem.element.width(this.container.width());
                this._maximisedItem.element.height(this.container.height());
                this._maximisedItem.callDownwards('setSize');
            }

            this.adjustColumnsResponsive();
        }
    }

    updateSizeFromContainer(): void {
        const width = getElementWidth(this.container);
        const height = getElementWidth(this.container);
        this.updateSize(width, height);
    }

    /**
     * Destroys the LayoutManager instance itself as well as every ContentItem
     * within it. After this is called nothing should be left of the LayoutManager.
     */
    destroy(): void {
        if (this.isInitialised === false) {
            return;
        }
        this._onUnload();
        globalThis.removeEventListener('resize', this._windowResizeListener);
        globalThis.removeEventListener('unload', this._windowUnloadListener);
        globalThis.removeEventListener('beforeunload', this._windowUnloadListener);
        if (this.root !== null) {
            this.root.callDownwards('_$destroy', [], true);
            this.root.contentItems = [];
        }
        this.tabDropPlaceholder.remove();
        if (this.dropTargetIndicator !== null) {
            this.dropTargetIndicator.destroy();
        }
        if (this.transitionIndicator !== null) {
            this.transitionIndicator.destroy();
        }
        this.eventHub.destroy();

        for (const dragSource of this._dragSources) {
            dragSource.destroy();
        }
        this._dragSources = [];
    }

    /**
     * Returns the name of the component for the config, taking into account whether it's a react component or not.
     */

    getComponentNameFromConfig(config: ComponentConfig): string {
        if (ComponentConfig.isReact(config)) {
            throw new Error('LayoutManager.getComponentNameFromConfig: Not implemented for React')
            // return config.component // what should this be
        } else {
            return config.componentName;
        }
    }

    /**
     * Recursively creates new item tree structures based on a provided
     * ItemConfiguration object
     *
     * @public
     * @param   {Object} config ItemConfig
     * @param   {[ContentItem]} parent The item the newly created item should be a child of
     *
     * @returns {ContentItem}
     */
    createContentItem(config: ItemConfig, parent: AbstractContentItem): AbstractContentItem {
        if (typeof config.type !== 'string') {
            throw new ConfigurationError('Missing parameter \'type\'', config);
        }

        // if (this.isReactConfig(config)) {
        //     config.type = 'component';
        //     config.componentName = REACT_COMPONENT_ID;
        // }

        /**
         * We add an additional stack around every component that's not within a stack anyways.
         */
        if (
            // If this is a component
            config.type === ItemConfig.Type.component &&

            // and it's not already within a stack
            !(parent instanceof Stack) &&

            // and we have a parent
            !!parent &&

            // and it's not the topmost item in a new window
            !(this.isSubWindow === true && parent instanceof Root)
        ) {
            config = {
                type: ItemConfig.Type.stack,
                content: [config],
                width: config.width,
                height: config.height,
                id: config.id,
                isClosable: config.isClosable,
                title: config.title,
                reorderEnabled: config.reorderEnabled,
                activeItemIndex: config.activeItemIndex,
            };
        }

        const contentItem = this.createContentItemFromConfig(config, parent);
        return contentItem;
    }

    /**
     * Creates a popout window with the specified content and dimensions
     *
     * @param   {Object|lm.itemsAbstractContentItem} configOrContentItem
     * @param   {[Object]} dimensions A map with width, height, left and top
     * @param    {[String]} parentId the id of the element this item will be appended to
     *                             when popIn is called
     * @param    {[Number]} indexInParent The position of this item within its parent element
     
     * @returns {BrowserPopout}
     */
    createPopoutFromContentItem(item: AbstractContentItem): BrowserPopout {
        const managerConfig = this.toConfig(item);
        const parentId = getUniqueId();

        /**
         * If the item is the only component within a stack or for some
         * other reason the only child of its parent the parent will be destroyed
         * when the child is removed.
         *
         * In order to support this we move up the tree until we find something
         * that will remain after the item is being popped out
         */
        let parent = item.parent;
        let child = item;
        while (parent !== null && parent.contentItems.length === 1 && !parent.isRoot) {
            child = parent;
            parent = parent.parent;
        }

        if (parent === null) {
            throw new UnexpectedNullError('LMCPFCI00834');
        } else {
            parent.addId(parentId);
            const indexInParent = indexOf(child, parent.contentItems);

            const windowLeft = globalThis.screenX || globalThis.screenLeft;
            const windowTop = globalThis.screenY || globalThis.screenTop;
            const { left: offsetLeft, top: offsetTop } = getJQueryLeftAndTop(item.element)

            const window: PopoutManagerConfig.Window = {
                left: windowLeft + offsetLeft,
                top: windowTop + offsetTop,
                width: getElementWidth(item.element),
                height: getElementHeight(item.element),
                maximised: false,
            };

            item.remove();

            const popoutManagerConfig: PopoutManagerConfig = {
                content: managerConfig.content,
                openPopouts: [],
                settings: managerConfig.settings,
                dimensions: managerConfig.dimensions,
                labels: managerConfig.labels,
                window,
                parentId,
                indexInParent,
            }

            return this.createPopoutFromConfig(popoutManagerConfig);
        }
    }

    createPopoutFromConfig(config: PopoutManagerConfig): BrowserPopout {
        const configWindow = config.window;
        const initialWindow: Rect = { 
            left: configWindow.left ?? (globalThis.screenX || globalThis.screenLeft + 20),
            top: configWindow.top ?? (globalThis.screenY || globalThis.screenTop + 20),
            width: configWindow.width ?? 500,
            height: configWindow.height ?? 309,
        };


        const browserPopout = new BrowserPopout(config, initialWindow, this);

        browserPopout.on('initialised', function() {
            self.emit('windowOpened', browserPopout);
        });

        browserPopout.on('closed', function() {
            self.reconcilePopoutWindows();
        });

        this.openPopouts.push(browserPopout);

        return browserPopout;
    }

    /**
     * Attaches DragListener to any given DOM element
     * and turns it into a way of creating new ContentItems
     * by 'dragging' the DOM element into the layout
     *
     * @param   element
     * @param   itemConfig for the new item to be created, or a function which will provide it
     *
     * @returns an opaque object that identifies the DOM element
	 *          and the attached itemConfig. This can be used in
	 *          removeDragSource() later to get rid of the drag listeners.
     */
    createDragSource(element: HTMLElement, itemConfig: ItemConfig): DragSource {
        this.config.settings.constrainDragToContainer = false;
        const dragSource = new DragSource(element, itemConfig, this);
        this._dragSources.push(dragSource);

        return dragSource;
    }

    /**
	 * Removes a DragListener added by createDragSource() so the corresponding
	 * DOM element is not a drag source any more.
	 */
	removeDragSource(dragSource: DragSource): void {
		dragSource.destroy();
		removeFromArray(dragSource, this._dragSources );
	}

    /**
     * Programmatically selects an item. This deselects
     * the currently selected item, selects the specified item
     * and emits a selectionChanged event
     *
     * @param   item
     * @param   _$silent Wheather to notify the item of its selection
     * @event   selectionChanged
     */
    selectItem(item: AbstractContentItem, _$silent: boolean): void {

        if (this.config.settings.selectionEnabled !== true) {
            throw new Error('Please set selectionEnabled to true to use this feature');
        }

        if (item === this.selectedItem) {
            return;
        }

        if (this.selectedItem !== null) {
            this.selectedItem.deselect();
        }

        if (item && _$silent !== true) {
            item.select();
        }

        this.selectedItem = item;

        this.emit('selectionChanged', item);
    }

    /*************************
     * PACKAGE PRIVATE
     *************************/
    private createContentItemFromConfig(config: ItemConfig, parent: AbstractContentItem): AbstractContentItem {
        switch (config.type) {
            case ItemConfig.Type.root: return new Root(this, config, this.container);
            case ItemConfig.Type.row: return new RowOrColumn(false, this, config, parent);
            case ItemConfig.Type.column: return new RowOrColumn(true, this, config, parent);
            case ItemConfig.Type.stack: return new Stack(this, config as StackItemConfig, parent);
            case ItemConfig.Type.component:
            case ItemConfig.Type["react-component"]:
                return new Component(this, config as ComponentConfig, parent);
            default:
                throw new UnreachableCaseError('CCC913564', config.type, 'Invalid Config Item type specified');
        }
    }

    maximiseItem(contentItem: AbstractContentItem): void {
        if (this._maximisedItem !== null) {
            this.minimiseItem(this._maximisedItem);
        }
        this._maximisedItem = contentItem;
        contentItem.on('beforeItemDestroyed', (ev: EventEmitter.BubblingEvent) => this.cleanupBeforeMaximisedItemDestroyed(ev));
        this._maximisedItem.addId('__glMaximised');
        contentItem.element.classList.add('lm_maximised');
        contentItem.element.after(this._maximisePlaceholder);
        this.root.element.prepend(contentItem.element);
        contentItem.element.width(this.container.width());
        contentItem.element.height(this.container.height());
        contentItem.callDownwards('setSize');
        this._maximisedItem.emit('maximised');
        this.emit('stateChanged');
    }

    private minimiseItem(contentItem: AbstractContentItem) {
        contentItem.element.classList.remove('lm_maximised');
        contentItem.removeId('__glMaximised');
        this._maximisePlaceholder.after(contentItem.element);
        this._maximisePlaceholder.remove();
        contentItem.parent.callDownwards('setSize');
        this._maximisedItem = null;
        contentItem.off('beforeItemDestroyed', this.cleanupBeforeMaximisedItemDestroyed);
        contentItem.emit('minimised');
        this.emit('stateChanged');
    }

    private cleanupBeforeMaximisedItemDestroyed(event: EventEmitter.BubblingEvent) {
		if (this._maximisedItem !== null && this._maximisedItem === event.origin) {
			this._maximisedItem.off( 'beforeItemDestroyed', this._maximisedItemBeforeDestroyedListener);
			this._maximisedItem = null;
		}
    }
    
    /**
     * This method is used to get around sandboxed iframe restrictions.
     * If 'allow-top-navigation' is not specified in the iframe's 'sandbox' attribute
     * (as is the case with codepens) the parent window is forbidden from calling certain
     * methods on the child, such as window.close() or setting document.location.href.
     *
     * This prevented GoldenLayout popouts from popping in in codepens. The fix is to call
     * _$closeWindow on the child window's gl instance which (after a timeout to disconnect
     * the invoking method from the close call) closes itself.
     *
     * @packagePrivate
     */
    closeWindow(): void {
        globalThis.setTimeout(() => globalThis.close(), 1);
    }

    getArea(x: number, y: number): AbstractContentItem.Area | null {
        let mathingArea = null;

        for (let i = 0; i < this._itemAreas.length; i++) {
            const area = this._itemAreas[i];

            let smallestSurface = Infinity;
            if (
                x > area.x1 &&
                x < area.x2 &&
                y > area.y1 &&
                y < area.y2 &&
                smallestSurface > area.surface
            ) {
                smallestSurface = area.surface;
                mathingArea = area;
            }
        }

        return mathingArea;
    }

    private createRootItemAreas() {
        const areaSize = 50;
        const sides = {
            y2: 'y1',
            x2: 'x1',
            y1: 'y2',
            x1: 'x2'
        };
        for (const side in sides) {
            if (this.root === null) {
                throw new UnexpectedNullError('LayoutManager.createRootItemAreas');
            } else {
                const area = this.root.getArea();
                if (area === null) {
                    throw new UnexpectedNullError('LMCRIA77553');
                } else {
                    area.side = side;
                    if (sides[side][1] === '2' )
                        area[side] = area[sides[side]] - areaSize;
                    else
                        area[side] = area[sides[side]] + areaSize;
                    area.surface = (area.x2 - area.x1) * (area.y2 - area.y1);
                    this._itemAreas.push(area);
                }
            }
        }
    }

    calculateItemAreas() {
        const allContentItems = this.getAllContentItems();
        this._itemAreas = [];

        /**
         * If the last item is dragged out, highlight the entire container size to
         * allow to re-drop it. allContentItems[ 0 ] === this.root at this point
         *
         * Don't include root into the possible drop areas though otherwise since it
         * will used for every gap in the layout, e.g. splitters
         */
        if (allContentItems.length === 1) {
            this._itemAreas.push(this.root.getArea());
            return;
        }
        this.createRootItemAreas();

        for (let i = 0; i < allContentItems.length; i++) {

            if (!(allContentItems[i].isStack)) {
                continue;
            }

            const area = allContentItems[i].getArea();

            if (area === null) {
                continue;
            } else if (area instanceof Array) {
                this._itemAreas = this._itemAreas.concat(area);
            } else {
                this._itemAreas.push(area);
                const header: AbstractContentItem.Area = {
                    x1: area.x1,
                    x2: area.x2,
                    y1: area.y1,
                    y2: area.y2,
                    contentItem: 1,
                };
                const h = area.contentItem._contentAreaDimensions.header.highlightArea
                copy(header, area);
                copy(header, area.contentItem._contentAreaDimensions.header.highlightArea);
                header.surface = (header.x2 - header.x1) * (header.y2 - header.y1);
                this._itemAreas.push(header);
            }
        }
    }

    /**
     * Takes a contentItem or a configuration and optionally a parent
     * item and returns an initialised instance of the contentItem.
     * If the contentItem is a function, it is first called
     *
     * @packagePrivate
     *
     * @param   {AbtractContentItem|Object|Function} contentItemOrConfig
     * @param   {AbtractContentItem} parent Only necessary when passing in config
     *
     * @returns {AbtractContentItem}
     */
    _$normalizeContentItem(contentItemOrConfig, parent) {
        if (!contentItemOrConfig) {
            throw new Error('No content item defined');
        }

        if (isFunction(contentItemOrConfig)) {
            contentItemOrConfig = contentItemOrConfig();
        }

        if (contentItemOrConfig instanceof AbstractContentItem) {
            return contentItemOrConfig;
        }

        if ($.isPlainObject(contentItemOrConfig) && contentItemOrConfig.type) {
            var newContentItem = this.createContentItem(contentItemOrConfig, parent);
            newContentItem.callDownwards('_$init');
            return newContentItem;
        } else {
            throw new Error('Invalid contentItem');
        }
    }

    /**
     * Iterates through the array of open popout windows and removes the ones
     * that are effectively closed. This is necessary due to the lack of reliably
     * listening for window.close / unload events in a cross browser compatible fashion.
     */
    private reconcilePopoutWindows() {
        var openPopouts = [],
            i;

        for (i = 0; i < this.openPopouts.length; i++) {
            if (this.openPopouts[i].getWindow().closed === false) {
                openPopouts.push(this.openPopouts[i]);
            } else {
                this.emit('windowClosed', this.openPopouts[i]);
            }
        }

        if (this.openPopouts.length !== openPopouts.length) {
            this.openPopouts = openPopouts;
            this.emit('stateChanged');
        }

    }

    protected abstract createToConfig(content: ItemConfig[], openPopouts: PopoutManagerConfig[]): ManagerConfig;

    /***************************
     * PRIVATE
     ***************************/
    /**
     * Returns a flattened array of all content items,
     * regardles of level or type
     *
     * @private
     *
     * @returns {void}
     */
    private getAllContentItems() {
        if (this.root === null) {
            throw new UnexpectedNullError('LMGACI13130');
        } else {
            const allContentItems: AbstractContentItem[] = [this.root];
            this.root.addChildContentItems(allContentItems);
            return allContentItems;
        }
    }

    /**
     * Binds to DOM/BOM events on init
     */
    private bindEvents() {
        if (this._isFullPage) {
            globalThis.addEventListener('resize', this._windowResizeListener);
        }
        globalThis.addEventListener('unload', this._windowUnloadListener);
        globalThis.addEventListener('beforeunload', this._windowUnloadListener);
    }

    /**
     * Debounces resize events
     *
     * @private
     *
     * @returns {void}
     */
    _onResize() {
        if (this._resizeTimeoutId !== undefined) {
            clearTimeout(this._resizeTimeoutId);
        }
        this._resizeTimeoutId = setTimeout(() => this.updateSizeFromContainer(), 100);
    }

    /**
     * This is executed when GoldenLayout detects that it is run
     * within a previously opened popout window.
     *
     * @private
     *
     * @returns {void}
     */
    private _adjustToWindowMode() {
        const popInButton = createTemplateHtmlElement('<div class="lm_popin" title="' + this.config.header.dock + '">' +
            '<div class="lm_icon"></div>' +
            '<div class="lm_bg"></div>' +
            '</div>', 'div');

        popInButton.click = () => this.emit('popIn');

        document.title = stripTags(this.config.content[0].title);

        const headElement = document.head;

        const appendNodeLists = new Array<NodeListOf<Element>>(4);
        appendNodeLists[0] = document.querySelectorAll('body link');
        appendNodeLists[1] = document.querySelectorAll('body style');
        appendNodeLists[2] = document.querySelectorAll('template');
        appendNodeLists[3] = document.querySelectorAll('.gl_keep');

        for (let listIdx = 0; listIdx < appendNodeLists.length; listIdx++) {
            const appendNodeList = appendNodeLists[listIdx];
            for (let nodeIdx = 0; nodeIdx < appendNodeList.length; nodeIdx++) {
                const node = appendNodeList[nodeIdx];
                headElement.append(node);
            }
        }

        const bodyElement = document.body;
        bodyElement.innerHTML = '';
        bodyElement.style.visibility = 'visible';
        bodyElement.append(popInButton);

        /*
        * This seems a bit pointless, but actually causes a reflow/re-evaluation getting around
        * slickgrid's "Cannot find stylesheet." bug in chrome
        */
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const x = document.body.offsetHeight;

        /*
        * Expose this instance on the window object
        * to allow the opening window to interact with
        * it
        */
        window.__glInstance = this;
    }

    /**
     * Creates Subwindows (if there are any). Throws an error
     * if popouts are blocked.
     */
    private createSubWindows() {
        for (let i = 0; i < this.config.openPopouts.length; i++) {
            const popoutConfig = this.config.openPopouts[i];
            this.createPopoutFromConfig(popoutConfig);
        }
    }

    /**
     * Determines what element the layout will be created in
     *
     * @private
     *
     * @returns {void}
     */
    private _setContainer() {
        var container = $(this.container || 'body');

        if (container.length === 0) {
            throw new Error('GoldenLayout container not found');
        }

        if (container.length > 1) {
            throw new Error('GoldenLayout more than one container element specified');
        }

        if (container[0] === document.body) {
            this._isFullPage = true;

            $('html, body').css({
                height: '100%',
                margin: 0,
                padding: 0,
                overflow: 'hidden'
            });
        }

        this.container = container;
    }

    /**
     * Kicks of the initial, recursive creation chain
     *
     * @param   managerConfig GoldenLayout Config
     */
    private create(managerConfig: ManagerConfig) {
        var errorMsg;

        if (!(managerConfig.content instanceof Array)) {
            if (managerConfig.content === undefined) {
                errorMsg = 'Missing setting \'content\' on top level of configuration';
            } else {
                errorMsg = 'Configuration parameter \'content\' must be an array';
            }

            throw new ConfigurationError(errorMsg, managerConfig);
        }

        if (managerConfig.content.length > 1) {
            errorMsg = 'Top level content can\'t contain more then one element.';
            throw new ConfigurationError(errorMsg, managerConfig);
        }

        // convert config.content to an ItemConfig
        const rootUserItemConfig: UserItemConfig = {
            type: ItemConfig.Type.root,
            content: managerConfig.content,
        }

        const rootConfig = ManagerConfig.createRootItemConfig(managerConfig);

        this.root = new Root(this, rootConfig, this.container);
        this.root.callDownwards('_$init');

        if (managerConfig.maximisedItemId === '__glMaximised') {
            this.root.getItemsById(managerConfig.maximisedItemId)[0].toggleMaximise();
        }
    }

    /**
     * Called when the window is closed or the user navigates away
     * from the page
     *
     * @returns {void}
     */
    _onUnload() {
        if (this.config.settings.closePopoutsOnUnload === true) {
            for (var i = 0; i < this.openPopouts.length; i++) {
                this.openPopouts[i].close();
            }
        }
    }

    /**
     * Adjusts the number of columns to be lower to fit the screen and still maintain minItemWidth.
     */
    private adjustColumnsResponsive() {
        // If there is no min width set, or not content items, do nothing.
        if (!this.useResponsiveLayout() || this._updatingColumnsResponsive || !this.config.dimensions || !this.config.dimensions.minItemWidth || this.root.contentItems.length === 0 || !this.root.contentItems[0].isRow) {
            this._firstLoad = false;
            return;
        }

        this._firstLoad = false;

        // If there is only one column, do nothing.
        var columnCount = this.root.contentItems[0].contentItems.length;
        if (columnCount <= 1) {
            return;
        }

        // If they all still fit, do nothing.
        var minItemWidth = this.config.dimensions.minItemWidth;
        var totalMinWidth = columnCount * minItemWidth;
        if (totalMinWidth <= this.width) {
            return;
        }

        // Prevent updates while it is already happening.
        this._updatingColumnsResponsive = true;

        // Figure out how many columns to stack, and put them all in the first stack container.
        var finalColumnCount = Math.max(Math.floor(this.width / minItemWidth), 1);
        var stackColumnCount = columnCount - finalColumnCount;

        var rootContentItem = this.root.contentItems[0];
        var firstStackContainer = this._findAllStackContainers()[0];
        for (var i = 0; i < stackColumnCount; i++) {
            // Stack from right.
            var column = rootContentItem.contentItems[rootContentItem.contentItems.length - 1];
            this.addChildContentItemsToContainer(firstStackContainer, column);
        }

        this._updatingColumnsResponsive = false;
    }

    /**
     * Determines if responsive layout should be used.
     *
     * @returns True if responsive layout should be used; otherwise false.
     */
    private useResponsiveLayout() {
        const settings = this.config.settings;
        const alwaysResponsiveMode = settings.responsiveMode === ManagerConfig.Settings.ResponsiveMode.always;
        const onLoadResponsiveModeAndFirst = settings.responsiveMode === ManagerConfig.Settings.ResponsiveMode.onload && this._firstLoad;
        return alwaysResponsiveMode || onLoadResponsiveModeAndFirst;
    }

    /**
     * Adds all children of a node to another container recursively.
     * @param {object} container - Container to add child content items to.
     * @param {object} node - Node to search for content items.
     * @returns {void}
     */
    private addChildContentItemsToContainer(container, node) {
        if (node.type === 'stack') {
            node.contentItems.forEach(function(item) {
                container.addChild(item);
                node.removeChild(item, true);
            });
        } else {
            node.contentItems.forEach(fnBind(function(item) {
                this._addChildContentItemsToContainer(container, item);
            }, this));
        }
    }

    /**
     * Finds all the stack containers.
     * @returns {array} - The found stack containers.
     */
    _findAllStackContainers() {
        var stackContainers = [];
        this._findAllStackContainersRecursive(stackContainers, this.root);

        return stackContainers;
    }

    /**
     * Finds all the stack containers.
     *
     * @param {array} - Set of containers to populate.
     * @param {object} - Current node to process.
     *
     * @returns {void}
     */
    _findAllStackContainersRecursive(stackContainers, node) {
        node.contentItems.forEach(fnBind(function(item) {
            if (item.type == 'stack') {
                stackContainers.push(item);
            } else if (!item.isComponent) {
                this._findAllStackContainersRecursive(stackContainers, item);
            }
        }, this));
    }
}

/**
 * Hook that allows to access private classes
 */
// LayoutManager.__lm = lm;

export namespace LayoutManager {
    export type GetComponentConstructorFtn = (this: void, config: ComponentConfig) => Component.InstanceConstructor
}