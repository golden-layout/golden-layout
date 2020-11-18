import {
    ComponentItemConfig,
    Config,
    ItemConfig,
    ManagerConfig,
    PopoutManagerConfig,
    RootItemConfig,
    RowOrColumnItemConfig,
    StackItemConfig
} from './config/config'
import { BrowserPopout } from './controls/BrowserPopout'
import { DragSource } from './controls/DragSource'
import { DropTargetIndicator } from './controls/DropTargetIndicator'
import { TransitionIndicator } from './controls/TransitionIndicator'
import { ApiError, ConfigurationError } from './errors/external-error'
import { AssertError, UnexpectedNullError, UnreachableCaseError } from './errors/internal-error'
import { AbstractContentItem } from './items/AbstractContentItem'
import { ComponentItem } from './items/ComponentItem'
import { Root } from './items/Root'
import { RowOrColumn } from './items/RowOrColumn'
import { Stack } from './items/Stack'
import { ConfigMinifier } from './utils/ConfigMinifier'
import { EventEmitter } from './utils/EventEmitter'
import { EventHub } from './utils/EventHub'
import { I18nStringId, I18nStrings, i18nStrings } from './utils/i18n-strings'
import { getJQueryLeftAndTop } from './utils/jquery-legacy'
import { Rect } from './utils/types'
import {
    createTemplateHtmlElement,
    getElementWidthAndHeight,
    removeFromArray,
    setElementHeight,
    setElementWidth
} from './utils/utils'

/** @internal */
declare global {
    interface Window {
        __glInstance: LayoutManager;
    }
}

/**
 * The main class that will be exposed as GoldenLayout.
 */

export abstract class LayoutManager extends EventEmitter {
    /** @internal */
    private _container: HTMLElement;
    /** @internal */
    private _isFullPage = false;
    /** @internal */
    private _isInitialised = false;
    /** @internal */
    private _root: Root | null = null;
    /** @internal */
    private _openPopouts: BrowserPopout[] = [];
    /** @internal */
    private _dropTargetIndicator: DropTargetIndicator | null = null;
    /** @internal */
    private _transitionIndicator: TransitionIndicator | null = null;
    /** @internal */
    private _resizeTimeoutId: ReturnType<typeof setTimeout> | undefined;
    /** @internal */
    private _componentConstructors: Record<string, ComponentItem.ComponentInstantiator> = {};
    /** @internal */
    private _itemAreas: AbstractContentItem.Area[] = [];
    /** @internal */
    private _maximisedItem: AbstractContentItem | null = null;
    /** @internal */
    private _maximisePlaceholder = createTemplateHtmlElement('<div class="lm_maximise_place"></div>');
    /** @internal */
    private _tabDropPlaceholder = createTemplateHtmlElement('<div class="lm_drop_tab_placeholder"></div>');
    /** @internal */
    private _dragSources: DragSource[] = [];
    /** @internal */
    private _updatingColumnsResponsive = false;
    /** @internal */
    private _firstLoad = true;
    /** @internal */
    private _eventHub = new EventHub(this);
    /** @internal */
    private _width: number | null = null;
    /** @internal */
    private _height: number | null = null;
    /** @internal */
    private _selectedItem: AbstractContentItem | null = null;

    /** @internal */
    private _getComponentConstructorFtn: LayoutManager.GetComponentConstructorFtn;

    /** @internal */
    private _windowResizeListener = () => this.onResize();
    /** @internal */
    private _windowUnloadListener = () => this.onUnload();
    /** @internal */
    private _maximisedItemBeforeDestroyedListener = (ev: EventEmitter.BubblingEvent) => this.cleanupBeforeMaximisedItemDestroyed(ev);

    /** @internal */
    protected get maximisedItem(): AbstractContentItem | null { return this._maximisedItem; }

    public isSubWindow: boolean;
    public managerConfig: ManagerConfig;

    get container(): HTMLElement { return this._container; }
    get isInitialised(): boolean { return this._isInitialised; }
    get root(): Root | null { return this._root; }
    get openPopouts(): BrowserPopout[] { return this._openPopouts; }
    /** @internal */
    get dropTargetIndicator(): DropTargetIndicator | null { return this._dropTargetIndicator; }
    /** @internal */
    get transitionIndicator(): TransitionIndicator | null { return this._transitionIndicator; }
    get width(): number | null { return this._width; }
    get height(): number | null { return this._height; }
    /** @internal */
    get eventHub(): EventHub { return this._eventHub; }
    get selectedItem(): AbstractContentItem | null { return this._selectedItem; }
    /** @internal */
    get tabDropPlaceholder(): HTMLElement { return this._tabDropPlaceholder; }

    /**
    * @param container a Dom HTML element. Defaults to body
    * @internal
    */
    constructor(managerConfigAndIsSubWindow: LayoutManager.ManagerConfigAndIsSubWindow, container?: HTMLElement) {        
        super();

        this.managerConfig = managerConfigAndIsSubWindow.managerConfig;
        this.isSubWindow = managerConfigAndIsSubWindow.isSubWindow;

        I18nStrings.checkInitialise();

        if (container !== undefined) {
            this._container = container;
        }
    }

    /**
     * Takes a GoldenLayout configuration object and
     * replaces its keys and values recursively with
     * one letter codes
     * @internal
     */
    minifyConfig(config: ManagerConfig): ManagerConfig {
        return (new ConfigMinifier()).minifyConfig(config);
    }

    /**
     * Takes a configuration Object that was previously minified
     * using minifyConfig and returns its original version
     * @internal
     */
    unminifyConfig(config: ManagerConfig): ManagerConfig {
        return (new ConfigMinifier()).unminifyConfig(config);
    }

    /**
     * Register a component with the layout manager. If a configuration node
     * of type component is reached it will look up componentName and create the
     * associated component
     *
     * @deprecated See https://stackoverflow.com/questions/40922531/how-to-check-if-a-javascript-function-is-a-constructor
     * @see {@link registerComponentWithConstructor} or {@link registerComponentWithFactoryFunction}
     */
    registerComponent(name: string,
        componentConstructorOrFactoryFtn: ComponentItem.ComponentConstructor | ComponentItem.ComponentFactoryFunction
    ): void {
        if (typeof componentConstructorOrFactoryFtn !== 'function') {
            throw new ApiError('registerComponent() componentConstructorOrFactoryFtn parameter is not a function')
        } else {
            if (componentConstructorOrFactoryFtn.hasOwnProperty('prototype')) {
                const componentConstructor = componentConstructorOrFactoryFtn as ComponentItem.ComponentConstructor;
                this.registerComponentWithConstructor(name, componentConstructor);   
            } else {
                const componentFactoryFtn = componentConstructorOrFactoryFtn as ComponentItem.ComponentFactoryFunction;
                this.registerComponentWithFactoryFunction(name, componentFactoryFtn);   
            }
        }
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
    registerComponentWithConstructor(name: string, componentConstructor: ComponentItem.ComponentConstructor): void {
        if (typeof componentConstructor !== 'function') {
            throw new Error(i18nStrings[I18nStringId.PleaseRegisterAConstructorFunction]);
        }

        if (this._componentConstructors[name] !== undefined) {
            throw new Error(`${i18nStrings[I18nStringId.ComponentIsAlreadyRegistered]}: ${name}`);
        }

        this._componentConstructors[name] = {
            constructor: componentConstructor,
            factoryFunction: undefined,
        }
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
    registerComponentWithFactoryFunction(name: string, componentFactoryFunction: ComponentItem.ComponentFactoryFunction): void {
        if (typeof componentFactoryFunction !== 'function') {
            throw new Error('Please register a constructor function');
        }

        if (this._componentConstructors[name] !== undefined) {
            throw new Error('Component ' + name + ' is already registered');
        }

        this._componentConstructors[name] = {
            constructor: undefined,
            factoryFunction: componentFactoryFunction,
        }
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
     * @returns GoldenLayout configuration
     */
    toConfig(): Config {
        if (this._isInitialised === false) {
            throw new Error('Can\'t create config, layout not yet initialised');
        } else {

            // if (root !== undefined && !(root instanceof AbstractContentItem)) {
            //     throw new Error('Root must be a ContentItem');
            // }

            /*
            * Content
            */
            if (this._root === null) {
                throw new UnexpectedNullError('LMTC18244');
            } else {
                const content = this._root.calculateConfigContent();

                /*
                * Retrieve config for subwindows
                */
                this.reconcilePopoutWindows();
                const openPopouts: PopoutManagerConfig[] = [];
                for (let i = 0; i < this._openPopouts.length; i++) {
                    openPopouts.push(this._openPopouts[i].toConfig());
                }

                /*
                * calculate maximisedItemId
                */
                const maximisedItemId = this._maximisedItem ? '__glMaximised' : null;

                const config: Config = {
                    content,
                    openPopouts,
                    settings:  ManagerConfig.Settings.createCopy(this.managerConfig.settings),
                    dimensions: ManagerConfig.Dimensions.createCopy(this.managerConfig.dimensions),
                    header: ManagerConfig.Header.createCopy(this.managerConfig.header),
                    maximisedItemId,
                    resolved: true,
                }
        
                return config;
            }
        }
    }

    /**
     * Returns a previously registered component.  Attempts to utilize registered 
     * component by name first, then falls back to the component function.  If either
     * lack a response for what the component should be, it throws an error.
     *
     * @param config - The item config
     * @internal
     */
    getComponentInstantiator(config: ComponentItemConfig): ComponentItem.ComponentInstantiator {
        const name = this.getComponentNameFromConfig(config)
        let constructorToUse = this._componentConstructors[name]
        if (constructorToUse === undefined) {
            if (this._getComponentConstructorFtn !== undefined) {
                constructorToUse = {
                    constructor: this._getComponentConstructorFtn(config),
                    factoryFunction: undefined,
                }
            }
        }
        if (constructorToUse === undefined) {
            throw new ConfigurationError('Unknown component constructor "' + name + '"', undefined);
        }

        return constructorToUse;
    }

    /**
     * Called from GolderLayout class. Finishes of init
     * @internal
     */
    init(): void {
        this.setContainer();
        this._dropTargetIndicator = new DropTargetIndicator(/*this.container*/);
        this._transitionIndicator = new TransitionIndicator();
        this.updateSizeFromContainer();
        this.create(this.managerConfig);
        this.bindEvents();
        this._isInitialised = true;
        this.adjustColumnsResponsive();
        this.emit('initialised');
    }

    /** @deprecated Use {@link setSize} */
    updateSize(width: number, height: number): void {
        this.setSize(width, height);
    }

    /**
     * Updates the layout managers size
     *
     * @param width  width in pixels
     * @param height height in pixels
     */
    setSize(width: number, height: number): void {
        this._width = width;
        this._height = height;

        if (this._isInitialised === true) {
            if (this._root === null) {
                throw new UnexpectedNullError('LMUS18881');
            } else {
                this._root.setSize(this._width, this._height);

                if (this._maximisedItem) {
                    const { width, height } = getElementWidthAndHeight(this._container);
                    setElementWidth(this._maximisedItem.element, width);
                    setElementHeight(this._maximisedItem.element, height);
                    this._maximisedItem.updateSize();
                }

                this.adjustColumnsResponsive();
            }
        }
    }

    /** @internal */
    updateSizeFromContainer(): void {
        const { width, height } = getElementWidthAndHeight(this._container);
        this.setSize(width, height);
    }

    /**
     * Destroys the LayoutManager instance itself as well as every ContentItem
     * within it. After this is called nothing should be left of the LayoutManager.
     */
    destroy(): void {
        if (this._isInitialised === false) {
            return;
        }
        this.onUnload();
        globalThis.removeEventListener('resize', this._windowResizeListener);
        globalThis.removeEventListener('unload', this._windowUnloadListener);
        globalThis.removeEventListener('beforeunload', this._windowUnloadListener);
        if (this._root !== null) {
            this._root.destroy();
        }
        this._tabDropPlaceholder.remove();
        if (this._dropTargetIndicator !== null) {
            this._dropTargetIndicator.destroy();
        }
        if (this._transitionIndicator !== null) {
            this._transitionIndicator.destroy();
        }
        this._eventHub.destroy();

        for (const dragSource of this._dragSources) {
            dragSource.destroy();
        }
        this._dragSources = [];
    }

    /**
     * Returns the name of the component for the config, taking into account whether it's a react component or not.
     * @internal
     */
    getComponentNameFromConfig(config: ComponentItemConfig): string {
        if (ComponentItemConfig.isReact(config)) {
            return config.component;
        } else {
            return config.componentName;
        }
    }

    /** @internal */
    createAndInitContentItem(config: ItemConfig, parent: AbstractContentItem): AbstractContentItem {
        const newItem = this.createContentItem(config, parent);
        newItem.init();
        return newItem;
    }

    /**
     * Recursively creates new item tree structures based on a provided
     * ItemConfiguration object
     *
     * @param   config ItemConfig
     * @param   parent The item the newly created item should be a child of
     * @internal
     */
    createContentItem(config: ItemConfig, parent: AbstractContentItem): AbstractContentItem {
        if (typeof config.type !== 'string') {
            throw new ConfigurationError('Missing parameter \'type\'', JSON.stringify(config));
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
            ItemConfig.isComponentItem(config) &&

            // and it's not already within a stack
            !(parent instanceof Stack) &&

            // and we have a parent
            !!parent &&

            // and it's not the topmost item in a new window
            !(this.isSubWindow === true && parent instanceof Root)
        ) {
            const stackConfig: StackItemConfig = {
                type: ItemConfig.Type.stack,
                content: [config],
                width: config.width,
                minWidth: config.minWidth,
                height: config.height,
                minHeight: config.minHeight,
                id: config.id,
                isClosable: config.isClosable,
                title: config.title,
                reorderEnabled: config.reorderEnabled,
                activeItemIndex: 0,
                header: undefined,
            };

            config = stackConfig;
        }

        const contentItem = this.createContentItemFromConfig(config, parent);
        return contentItem;
    }

    /**
     * Creates a popout window with the specified content at the specified position
     *
     * @param   itemConfigContentOrContentItem The content of the popout window's layout manager derived from either
     * a {@link AbstractContentItem ContentItem} or {@link ItemConfig} or ItemConfig content (array of {@link ItemConfig})
     * @param   positionAndSize The width, height, left and top of Popout window
     * @param   parentId The id of the element this item will be appended to when popIn is called
     * @param   indexInParent The position of this item within its parent element
     */

    createPopout(itemConfigContentOrContentItem: AbstractContentItem | ItemConfig | ItemConfig[],
        positionAndSize: PopoutManagerConfig.Window,
        parentId: string | null,
        indexInParent: number | null
    ): BrowserPopout {
        if (itemConfigContentOrContentItem instanceof AbstractContentItem) {
            return this.createPopoutFromContentItem(itemConfigContentOrContentItem, positionAndSize, parentId, indexInParent);
        } else {
            let itemConfigArray: readonly (RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig)[];
            if (itemConfigContentOrContentItem instanceof Array) {
                itemConfigArray = itemConfigContentOrContentItem as readonly (RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig)[];
            } else {
                if (ItemConfig.isRoot(itemConfigContentOrContentItem)) {
                    itemConfigArray = itemConfigContentOrContentItem.content;
                } else {
                    itemConfigArray = [itemConfigContentOrContentItem as (RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig)];
                }
            }

            // confirm array is ok (cannot accept root)
            const itemConfigCount = itemConfigArray.length;
            for (let i = 0; i < itemConfigCount; i++) {
                if (itemConfigArray[i].type === ItemConfig.Type.root) {
                    throw new Error(`${i18nStrings[I18nStringId.PopoutCannotBeCreatedWithRootItemConfig]}`)
                }
            }
            return this.createPopoutFromItemConfig(itemConfigArray, positionAndSize, parentId, indexInParent);
        }
    }

    /** @internal */
    createPopoutFromContentItem(item: AbstractContentItem,
        window: PopoutManagerConfig.Window | undefined,
        parentId: string | null,
        indexInParent: number | null | undefined,
    ): BrowserPopout {
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
            if (indexInParent === undefined) {
                indexInParent = parent.contentItems.indexOf(child);
            }
            if (parentId !== null) {
                parent.addId(parentId);
            }

            if (window === undefined) {
                const windowLeft = globalThis.screenX || globalThis.screenLeft;
                const windowTop = globalThis.screenY || globalThis.screenTop;
                const { left: offsetLeft, top: offsetTop } = getJQueryLeftAndTop(item.element);
                const { width, height } = getElementWidthAndHeight(item.element);

                window = {
                    left: windowLeft + offsetLeft,
                    top: windowTop + offsetTop,
                    width,
                    height,
                };
            }

            const itemConfig = item.toConfig();
            item.remove();

            const content = itemConfig.content as readonly (RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig)[];
            // confirm content is ok (cannot accept root)
            const contentCount = content.length;
            for (let i = 0; i < contentCount; i++) {
                if (content[i].type === ItemConfig.Type.root) {
                    throw new Error(`${i18nStrings[I18nStringId.PopoutCannotBeCreatedWithRootItemConfig]}`)
                }
            }

            return this.createPopoutFromItemConfig(content, window, parentId, indexInParent);
        }
    }

    /** @internal */
    private createPopoutFromItemConfig(content: readonly (RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig)[],
        window: PopoutManagerConfig.Window,
        parentId: string | null,
        indexInParent: number | null
    ) {
        const managerConfig = this.toConfig();

        const popoutManagerConfig: PopoutManagerConfig = {
            content,
            openPopouts: [],
            settings: managerConfig.settings,
            dimensions: managerConfig.dimensions,
            header: managerConfig.header,
            maximisedItemId: null,
            window,
            parentId,
            indexInParent,
        }

        return this.createPopoutFromPopoutManagerConfig(popoutManagerConfig);
    }

    /** @internal */
    createPopoutFromPopoutManagerConfig(config: PopoutManagerConfig): BrowserPopout {
        const configWindow = config.window;
        const initialWindow: Rect = { 
            left: configWindow.left ?? (globalThis.screenX || globalThis.screenLeft + 20),
            top: configWindow.top ?? (globalThis.screenY || globalThis.screenTop + 20),
            width: configWindow.width ?? 500,
            height: configWindow.height ?? 309,
        };


        const browserPopout = new BrowserPopout(config, initialWindow, this);

        browserPopout.on('initialised', () => this.emit('windowOpened', browserPopout));
        browserPopout.on('closed', () => this.reconcilePopoutWindows());

        this._openPopouts.push(browserPopout);

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
     * @returns 1) an opaque object that identifies the DOM element
	 *          and the attached itemConfig. This can be used in
	 *          removeDragSource() later to get rid of the drag listeners.
     *          2) undefined if constrainDragToContainer is specified
     */
    createDragSource(element: HTMLElement, itemConfig: ItemConfig | (() => ItemConfig)): DragSource | undefined {
        if (this.managerConfig.settings.constrainDragToContainer) {
            return undefined;
        } else {
            const dragSource = new DragSource(element, itemConfig, this);
            this._dragSources.push(dragSource);

            return dragSource;
        }
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
     * @param   silent Wheather to notify the item of its selection
     * @event   selectionChanged
     */
    selectItem(item: AbstractContentItem, silent: boolean): void {

        if (this.managerConfig.settings.selectionEnabled !== true) {
            throw new Error('Please set selectionEnabled to true to use this feature');
        }

        if (item === this._selectedItem) {
            return;
        }

        if (this._selectedItem !== null) {
            this._selectedItem.deselect();
        }

        if (item && silent !== true) {
            item.select();
        }

        this._selectedItem = item;

        this.emit('selectionChanged', item);
    }

    /** @Internal */
    clearSelectedItem(): void {
        this._selectedItem = null;
    }

    /** @internal */
    private createContentItemFromConfig(config: ItemConfig, parent: AbstractContentItem): AbstractContentItem {
        switch (config.type) {
            case ItemConfig.Type.root: return new Root(this, config as RootItemConfig, this._container);
            case ItemConfig.Type.row: return new RowOrColumn(false, this, config as RowOrColumnItemConfig, parent);
            case ItemConfig.Type.column: return new RowOrColumn(true, this, config as RowOrColumnItemConfig, parent);
            case ItemConfig.Type.stack: return new Stack(this, config as StackItemConfig, parent as Stack.Parent);
            case ItemConfig.Type.component:
            case ItemConfig.Type.reactComponent:
                return new ComponentItem(this, config as ComponentItemConfig, parent as Stack);
            default:
                throw new UnreachableCaseError('CCC913564', config.type, 'Invalid Config Item type specified');
        }
    }

    /** @internal */
    maximiseItem(contentItem: AbstractContentItem): void {
        if (this._maximisedItem !== null) {
            this.minimiseItem(this._maximisedItem);
        }
        this._maximisedItem = contentItem;
        contentItem.on('beforeItemDestroyed', this._maximisedItemBeforeDestroyedListener);
        this._maximisedItem.addId('__glMaximised');
        contentItem.element.classList.add('lm_maximised');
        contentItem.element.insertAdjacentElement('afterend', this._maximisePlaceholder);
        if (this._root === null) {
            throw new UnexpectedNullError('LMMXI19993');
        } else {
            this._root.element.prepend(contentItem.element);
            const { width, height } = getElementWidthAndHeight(this._container);
            setElementWidth(contentItem.element, width);
            setElementHeight(contentItem.element, height);
            contentItem.updateSize();
            this._maximisedItem.emit('maximised');
            this.emit('stateChanged');
        }
    }

    /** @internal */
    minimiseItem(contentItem: AbstractContentItem): void {
        if (contentItem.parent === null) {
            throw new UnexpectedNullError('LMMI13668');
        } else {
            contentItem.element.classList.remove('lm_maximised');
            contentItem.removeId('__glMaximised');
            this._maximisePlaceholder.insertAdjacentElement('afterend', contentItem.element);
            this._maximisePlaceholder.remove();
            contentItem.parent.updateSize();
            this._maximisedItem = null;
            contentItem.off('beforeItemDestroyed', this._maximisedItemBeforeDestroyedListener);
            contentItem.emit('minimised');
            this.emit('stateChanged');
        }
    }

    /** @internal */
    showAllActiveContentItems(): void {
        const allStacks = this.getAllStacks();

        for (let i = 0; i < allStacks.length; i++) {
            const stack = allStacks[i];
            const activeContentItem = stack.getActiveComponentItem();

            if (activeContentItem !== undefined) {
                if (!(activeContentItem instanceof ComponentItem)) {
                    throw new AssertError('LMSAACIS22298');
                } else {
                    activeContentItem.container.show();
                }
            }
        }
    }

    /** @internal */
    hideAllActiveContentItems(): void {
        const allStacks = this.getAllStacks();

        for (let i = 0; i < allStacks.length; i++) {
            const stack = allStacks[i];
            const activeContentItem = stack.getActiveComponentItem();

            if (activeContentItem !== undefined) {
                if (!(activeContentItem instanceof ComponentItem)) {
                    throw new AssertError('LMSAACIH22298');
                } else {
                    activeContentItem.container.hide();
                }
            }
        }
    }

    /** @internal */
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
     * @internal
     */
    closeWindow(): void {
        globalThis.setTimeout(() => globalThis.close(), 1);
    }

    /** @internal */
    getArea(x: number, y: number): AbstractContentItem.Area | null {
        let mathingArea = null;
        let smallestSurface = Infinity;

        for (let i = 0; i < this._itemAreas.length; i++) {
            const area = this._itemAreas[i];

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

    /** @internal */
    calculateItemAreas(): void {
        const allContentItems = this.getAllContentItems();
        /**
         * If the last item is dragged out, highlight the entire container size to
         * allow to re-drop it. this.root.contentiItems.length === 0 at this point
         *
         * Don't include root into the possible drop areas though otherwise since it
         * will used for every gap in the layout, e.g. splitters
         */
        const root = this._root;
        if (root === null) {
            throw new UnexpectedNullError('LMCIAR44365');
        } else {
            if (allContentItems.length === 1) {
                const rootArea = root.getElementArea();
                if (rootArea === null) {
                    throw new UnexpectedNullError('LMCIARA44365')
                } else {
                    this._itemAreas = [rootArea];
                }
                return;
            } else {
                // sides of layout
                this._itemAreas = root.createSideAreas();

                for (let i = 0; i < allContentItems.length; i++) {
                    const stack = allContentItems[i];
                    if (AbstractContentItem.isStack(stack)) {
                        const area = stack.getArea();

                        if (area === null) {
                            continue;
                        } else {
                            // This does not look correct. Stack.getArea() never returns an array.  Needs review
                            if (area instanceof Array) {
                                this._itemAreas = this._itemAreas.concat(area);
                            } else {
                                this._itemAreas.push(area);
                                const stackContentAreaDimensions = stack.contentAreaDimensions;
                                if (stackContentAreaDimensions === null) {
                                    throw new UnexpectedNullError('LMCIASC45599');
                                } else {
                                    const highlightArea = stackContentAreaDimensions.header.highlightArea
                                    const surface = (highlightArea.x2 - highlightArea.x1) * (highlightArea.y2 - highlightArea.y1);

                                    const header: AbstractContentItem.Area = {
                                        x1: highlightArea.x1,
                                        x2: highlightArea.x2,
                                        y1: highlightArea.y1,
                                        y2: highlightArea.y2,
                                        contentItem: stack,
                                        surface,
                                    };
                                    this._itemAreas.push(header);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Iterates through the array of open popout windows and removes the ones
     * that are effectively closed. This is necessary due to the lack of reliably
     * listening for window.close / unload events in a cross browser compatible fashion.
     * @internal
     */
    private reconcilePopoutWindows() {
        const openPopouts: BrowserPopout[] = [];

        for (let i = 0; i < this._openPopouts.length; i++) {
            if (this._openPopouts[i].getWindow().closed === false) {
                openPopouts.push(this._openPopouts[i]);
            } else {
                this.emit('windowClosed', this._openPopouts[i]);
            }
        }

        if (this._openPopouts.length !== openPopouts.length) {
            this._openPopouts = openPopouts;
            this.emit('stateChanged');
        }

    }

    /**
     * Returns a flattened array of all content items,
     * regardles of level or type
     * @internal
     */
    private getAllContentItems() {
        if (this._root === null) {
            throw new UnexpectedNullError('LMGACI13130');
        } else {
            const allContentItems: AbstractContentItem[] = [this._root];
            this._root.deepAddChildContentItems(allContentItems);
            return allContentItems;
        }
    }

    /**
     * Binds to DOM/BOM events on init
     * @internal
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
     * @internal
     */
    private onResize(): void {
        if (this._resizeTimeoutId !== undefined) {
            clearTimeout(this._resizeTimeoutId);
        }
        this._resizeTimeoutId = setTimeout(() => this.updateSizeFromContainer(), 100);
    }

    /**
     * Determines what element the layout will be created in
     * @internal
     */
    private setContainer() {
        const bodyElement = document.body;
        const container = this._container ?? bodyElement;

        if (container === bodyElement) {
            this._isFullPage = true;

            const documentElement = document.documentElement;
            documentElement.style.height = '100%';
            documentElement.style.margin = '0';
            documentElement.style.padding = '0';
            documentElement.style.overflow = 'hidden';
            bodyElement.style.height = '100%';
            bodyElement.style.margin = '0';
            bodyElement.style.padding = '0';
            bodyElement.style.overflow = 'hidden';
        }

        this._container = container;
    }

    /**
     * Kicks of the initial, recursive creation chain
     *
     * @param   managerConfig GoldenLayout Config
     * @internal
     */
    private create(managerConfig: ManagerConfig) {
        if (!(managerConfig.content instanceof Array)) {
            let errorMsg: string;
            if (managerConfig.content === undefined) {
                errorMsg = 'Missing setting \'content\' on top level of configuration';
            } else {
                errorMsg = 'Configuration parameter \'content\' must be an array';
            }

            throw new ConfigurationError(errorMsg, JSON.stringify(managerConfig));
        }

        if (managerConfig.content.length > 1) {
            const errorMsg = 'Top level content can\'t contain more then one element.';
            throw new ConfigurationError(errorMsg, JSON.stringify(managerConfig));
        }

        const rootConfig = ManagerConfig.createRootItemConfig(managerConfig);

        this._root = new Root(this, rootConfig, this._container);
        this._root.init();

        if (managerConfig.maximisedItemId === '__glMaximised') {
            const maximisedItems = this._root.getItemsById(managerConfig.maximisedItemId);
            if (maximisedItems.length > 0) {
                // should only be one - if more, just do first
                maximisedItems[0].toggleMaximise();
            }
        }
    }

    /**
     * Called when the window is closed or the user navigates away
     * from the page
     * @internal
     */
    private onUnload(): void {
        if (this.managerConfig.settings.closePopoutsOnUnload === true) {
            for (let i = 0; i < this._openPopouts.length; i++) {
                this._openPopouts[i].close();
            }
        }
    }

    /**
     * Adjusts the number of columns to be lower to fit the screen and still maintain minItemWidth.
     * @internal
     */
    private adjustColumnsResponsive() {
        if (this._root === null) {
            throw new UnexpectedNullError('LMACR20883');
        } else {
            this._firstLoad = false;
            // If there is no min width set, or not content items, do nothing.
            if (this.useResponsiveLayout() &&
                !this._updatingColumnsResponsive &&
                this._root.contentItems.length > 0 &&
                this._root.contentItems[0].isRow)
            {
                if (this._root === null || this._width === null) {
                    throw new UnexpectedNullError('LMACR77412');
                } else {
                    // If there is only one column, do nothing.
                    const columnCount = this._root.contentItems[0].contentItems.length;
                    if (columnCount <= 1) {
                        return;
                    } else {
                        // If they all still fit, do nothing.
                        const minItemWidth = this.managerConfig.dimensions.minItemWidth;
                        const totalMinWidth = columnCount * minItemWidth;
                        if (totalMinWidth <= this._width) {
                            return;
                        } else {
                            // Prevent updates while it is already happening.
                            this._updatingColumnsResponsive = true;

                            // Figure out how many columns to stack, and put them all in the first stack container.
                            const finalColumnCount = Math.max(Math.floor(this._width / minItemWidth), 1);
                            const stackColumnCount = columnCount - finalColumnCount;

                            const rootContentItem = this._root.contentItems[0];
                            const allStacks = this.getAllStacks();
                            if (allStacks.length === 0) {
                                throw new AssertError('LMACRS77413')
                            } else {
                                const firstStackContainer = allStacks[0];
                                for (let i = 0; i < stackColumnCount; i++) {
                                    // Stack from right.
                                    const column = rootContentItem.contentItems[rootContentItem.contentItems.length - 1];
                                    this.addChildContentItemsToContainer(firstStackContainer, column);
                                }

                                this._updatingColumnsResponsive = false;
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Determines if responsive layout should be used.
     *
     * @returns True if responsive layout should be used; otherwise false.
     * @internal
     */
    private useResponsiveLayout() {
        const settings = this.managerConfig.settings;
        const alwaysResponsiveMode = settings.responsiveMode === ManagerConfig.Settings.ResponsiveMode.always;
        const onLoadResponsiveModeAndFirst = settings.responsiveMode === ManagerConfig.Settings.ResponsiveMode.onload && this._firstLoad;
        return alwaysResponsiveMode || onLoadResponsiveModeAndFirst;
    }

    /**
     * Adds all children of a node to another container recursively.
     * @param container - Container to add child content items to.
     * @param node - Node to search for content items.
     * @internal
     */
    private addChildContentItemsToContainer(container: AbstractContentItem, node: AbstractContentItem) {
        const contentItems = node.contentItems;
        if (node instanceof Stack) {
            for (let i = 0; i < contentItems.length; i++) {
                const item = contentItems[i];
                container.addChild(item);
                node.removeChild(item, true);
            }
        } else {
            for (let i = 0; i < contentItems.length; i++) {
                const item = contentItems[i];
                this.addChildContentItemsToContainer(container, item);
            }
        }
    }

    /**
     * Finds all the stacks.
     * @returns The found stack containers.
     * @internal
     */
    private getAllStacks() {
        if (this._root === null) {
            throw new UnexpectedNullError('LMFASC52778');
        } else {
            const stacks: Stack[] = [];
            this.findAllStacksRecursive(stacks, this._root);

            return stacks;
        }
    }

    /**
     * Finds all the stack containers.
     *
     * @param stacks Set of containers to populate.
     * @param node Current node to process.
     * @internal
     */
    private findAllStacksRecursive(stacks: Stack[], node: AbstractContentItem) {
        const contentItems = node.contentItems;
        for (let i = 0; i < contentItems.length; i++) {
            const item = contentItems[i];
            if (item instanceof Stack) {
                stacks.push(item);
            } else {
                if (!item.isComponent) {
                    this.findAllStacksRecursive(stacks, item);
                }
            }
        }
    }
}

export namespace LayoutManager {
    export type GetComponentConstructorFtn = (this: void, config: ComponentItemConfig) => ComponentItem.ComponentConstructor

    /** @internal */
    export interface ManagerConfigAndIsSubWindow {
        managerConfig: ManagerConfig;
        isSubWindow: boolean;
    }
}