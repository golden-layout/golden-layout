import {
    ComponentItemConfig,
    ItemConfig,
    LayoutConfig,
    PopoutLayoutConfig,
    RootItemConfig,
    RowOrColumnItemConfig,
    StackItemConfig
} from './config/config'
import { UserComponentItemConfig, UserLayoutConfig, UserRowOrColumnItemConfig, UserSerialisableComponentConfig, UserStackItemConfig } from './config/user-config'
import { BrowserPopout } from './controls/browser-popout'
import { DragSource } from './controls/drag-source'
import { DropTargetIndicator } from './controls/drop-target-indicator'
import { TransitionIndicator } from './controls/transition-indicator'
import { ApiError, ConfigurationError } from './errors/external-error'
import { AssertError, UnexpectedNullError, UnreachableCaseError } from './errors/internal-error'
import { ComponentItem } from './items/component-item'
import { ContentItem } from './items/content-item'
import { GroundItem } from './items/ground-item'
import { RowOrColumn } from './items/row-or-column'
import { Stack } from './items/stack'
import { ConfigMinifier } from './utils/config-minifier'
import { EventEmitter } from './utils/event-emitter'
import { EventHub } from './utils/event-hub'
import { I18nStringId, I18nStrings, i18nStrings } from './utils/i18n-strings'
import { getJQueryLeftAndTop } from './utils/jquery-legacy'
import { JsonValue, Rect } from './utils/types'
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

/** @public */
export abstract class LayoutManager extends EventEmitter {
    /** @internal */
    private _container: HTMLElement;
    /** @internal */
    private _isFullPage = false;
    /** @internal */
    private _isInitialised = false;
    /** @internal */
    private _groundItem: GroundItem | null = null;
    /** @internal */
    private _openPopouts: BrowserPopout[] = [];
    /** @internal */
    private _dropTargetIndicator: DropTargetIndicator | null = null;
    /** @internal */
    private _transitionIndicator: TransitionIndicator | null = null;
    /** @internal */
    private _resizeTimeoutId: ReturnType<typeof setTimeout> | undefined;
    /** @internal */
    private _componentTypes: Record<string, ComponentItem.ComponentInstantiator> = {};
    /** @internal */
    private _itemAreas: ContentItem.Area[] = [];
    /** @internal */
    private _maximisedItem: ContentItem | null = null;
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
    private _selectedItem: ContentItem | null = null;

    /** @internal */
    private _getComponentConstructorFtn: LayoutManager.GetComponentConstructorCallback;

    /** @internal */
    private _windowResizeListener = () => this.onResize();
    /** @internal */
    private _windowUnloadListener = () => this.onUnload();
    /** @internal */
    private _maximisedItemBeforeDestroyedListener = (ev: EventEmitter.BubblingEvent) => this.cleanupBeforeMaximisedItemDestroyed(ev);

    /** @internal */
    protected get maximisedItem(): ContentItem | null { return this._maximisedItem; }

    public readonly isSubWindow: boolean;
    public layoutConfig: LayoutConfig;

    get container(): HTMLElement { return this._container; }
    get isInitialised(): boolean { return this._isInitialised; }
    /** @internal */
    get groundItem(): GroundItem | null { return this._groundItem; }
    /** @deprecated use {@link (LayoutManager:class).groundItem} instead */
    get root(): GroundItem | null { return this._groundItem; }
    get openPopouts(): BrowserPopout[] { return this._openPopouts; }
    /** @internal */
    get dropTargetIndicator(): DropTargetIndicator | null { return this._dropTargetIndicator; }
    /** @internal */
    get transitionIndicator(): TransitionIndicator | null { return this._transitionIndicator; }
    get width(): number | null { return this._width; }
    get height(): number | null { return this._height; }
    /** @internal */
    get eventHub(): EventHub { return this._eventHub; }
    get selectedItem(): ContentItem | null { return this._selectedItem; }
    /** @internal */
    get tabDropPlaceholder(): HTMLElement { return this._tabDropPlaceholder; }

    /**
    * @param container - A Dom HTML element. Defaults to body
    * @internal
    */
    constructor(layoutConfigAndIsSubWindow: LayoutManager.LayoutConfigAndIsSubWindow, container?: HTMLElement) {        
        super();

        this.layoutConfig = layoutConfigAndIsSubWindow.layoutConfig;
        this.isSubWindow = layoutConfigAndIsSubWindow.isSubWindow;

        I18nStrings.checkInitialise();

        if (container !== undefined) {
            this._container = container;
        }
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
        if (this._groundItem !== null) {
            this._groundItem.destroy();
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
     * Takes a GoldenLayout configuration object and
     * replaces its keys and values recursively with
     * one letter codes
     * @internal
     */
    minifyConfig(config: LayoutConfig): LayoutConfig {
        return (new ConfigMinifier()).minifyConfig(config);
    }

    /**
     * Takes a configuration Object that was previously minified
     * using minifyConfig and returns its original version
     * @internal
     */
    unminifyConfig(config: LayoutConfig): LayoutConfig {
        return (new ConfigMinifier()).unminifyConfig(config);
    }

    /**
     * Register a new component type with the layout manager.
     *
     * @deprecated See {@link https://stackoverflow.com/questions/40922531/how-to-check-if-a-javascript-function-is-a-constructor}
     * instead use {@link (LayoutManager:class).registerComponentConstructor}
     * or {@link (LayoutManager:class).registerComponentFactoryFunction}
     */
    registerComponent(name: string,
        componentConstructorOrFactoryFtn: ComponentItem.ComponentConstructor | ComponentItem.ComponentFactoryFunction
    ): void {
        if (typeof componentConstructorOrFactoryFtn !== 'function') {
            throw new ApiError('registerComponent() componentConstructorOrFactoryFtn parameter is not a function')
        } else {
            if (componentConstructorOrFactoryFtn.hasOwnProperty('prototype')) {
                const componentConstructor = componentConstructorOrFactoryFtn as ComponentItem.ComponentConstructor;
                this.registerComponentConstructor(name, componentConstructor);   
            } else {
                const componentFactoryFtn = componentConstructorOrFactoryFtn as ComponentItem.ComponentFactoryFunction;
                this.registerComponentFactoryFunction(name, componentFactoryFtn);   
            }
        }
    }

    /**
     * Register a new component type with the layout manager.
     */
    registerComponentConstructor(name: string, componentConstructor: ComponentItem.ComponentConstructor): void {
        if (typeof componentConstructor !== 'function') {
            throw new Error(i18nStrings[I18nStringId.PleaseRegisterAConstructorFunction]);
        }

        if (this._componentTypes[name] !== undefined) {
            throw new Error(`${i18nStrings[I18nStringId.ComponentIsAlreadyRegistered]}: ${name}`);
        }

        this._componentTypes[name] = {
            constructor: componentConstructor,
            factoryFunction: undefined,
        }
    }

    /**
     * Register a new component with the layout manager.
     */
    registerComponentFactoryFunction(name: string, componentFactoryFunction: ComponentItem.ComponentFactoryFunction): void {
        if (typeof componentFactoryFunction !== 'function') {
            throw new Error('Please register a constructor function');
        }

        if (this._componentTypes[name] !== undefined) {
            throw new Error('Component ' + name + ' is already registered');
        }

        this._componentTypes[name] = {
            constructor: undefined,
            factoryFunction: componentFactoryFunction,
        }
    }

    /**
     * Register a component function with the layout manager. This function should
     * return a constructor for a component based on a config.
     * @deprecated use {@link (LayoutManager:class).registerGetComponentConstructorCallback}
     */
    registerComponentFunction(callback: LayoutManager.GetComponentConstructorCallback): void {
        this.registerGetComponentConstructorCallback(callback);
    }

    /**
     * Register a callback closure with the layout manager which supplies a Component Constructor.
     * This callback should return a constructor for a component based on a config.
     */
    registerGetComponentConstructorCallback(callback: LayoutManager.GetComponentConstructorCallback): void {
        if (typeof callback !== 'function') {
            throw new Error('Please register a callback function');
        }

        if (this._getComponentConstructorFtn !== undefined) {
            console.warn('Multiple component functions are being registered.  Only the final registered function will be used.')
        }

        this._getComponentConstructorFtn = callback;
    }

    getRegisteredComponentTypeNames(): string[] {
        return Object.keys(this._componentTypes);
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
        let constructorToUse = this._componentTypes[name]
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
     * Called from GoldenLayout class. Finishes of init
     * @internal
     */
    init(): void {
        this.setContainer();
        this._dropTargetIndicator = new DropTargetIndicator(/*this.container*/);
        this._transitionIndicator = new TransitionIndicator();
        this.updateSizeFromContainer();

        const layoutConfig = this.layoutConfig;
        if (layoutConfig.root === undefined) {
            const errorMsg = 'Missing setting \'content\' on top level of configuration';
            throw new ConfigurationError(errorMsg, JSON.stringify(layoutConfig));
        } else {
            this._groundItem = new GroundItem(this, layoutConfig.root, this._container);
            this._groundItem.init();

            this.checkLoadedLayoutMaximiseItem();

            this.bindEvents();
            this._isInitialised = true;
            this.adjustColumnsResponsive();
            this.emit('initialised');
        }
    }

    /**
     * Loads a new layout
     * @param userLayoutConfig - New layout to be loaded
     */
    loadLayout(userLayoutConfig: UserLayoutConfig): void {
        if (this._groundItem === null) {
            throw new Error('Cannot load layout before init');
        } else {
            this.layoutConfig = UserLayoutConfig.resolve(userLayoutConfig);
            this._groundItem.loadRoot(this.layoutConfig.root);
            this.checkLoadedLayoutMaximiseItem();
            this.adjustColumnsResponsive();
        }
    }

    /**
     * Creates a layout configuration object based on the the current state
     *
     * @public
     * @returns GoldenLayout configuration
     */
    saveLayout(): LayoutConfig {
        if (this._isInitialised === false) {
            throw new Error('Can\'t create config, layout not yet initialised');
        } else {

            // if (root !== undefined && !(root instanceof ContentItem)) {
            //     throw new Error('Root must be a ContentItem');
            // }

            /*
            * Content
            */
            if (this._groundItem === null) {
                throw new UnexpectedNullError('LMTC18244');
            } else {
                const groundContent = this._groundItem.calculateConfigContent();

                if (groundContent.length !== 1) {
                    throw new AssertError('LMTC16682');
                } else {
                    const rootItemConfig = groundContent[0];                    

                    /*
                    * Retrieve config for subwindows
                    */
                    this.reconcilePopoutWindows();
                    const openPopouts: PopoutLayoutConfig[] = [];
                    for (let i = 0; i < this._openPopouts.length; i++) {
                        openPopouts.push(this._openPopouts[i].toConfig());
                    }

                    const config: LayoutConfig = {
                        root: rootItemConfig,
                        openPopouts,
                        settings:  LayoutConfig.Settings.createCopy(this.layoutConfig.settings),
                        dimensions: LayoutConfig.Dimensions.createCopy(this.layoutConfig.dimensions),
                        header: LayoutConfig.Header.createCopy(this.layoutConfig.header),
                        resolved: true,
                    }
            
                    return config;
                }
            }
        }
    }

    /**
     * @deprecated Use {@link (LayoutManager:class).saveLayout}
     */
    toConfig(): LayoutConfig {
        return this.saveLayout();
    }

    /**
     * Adds a new child ContentItem under the root ContentItem.
     * @param userItemConfig - ItemConfig of child to be added.
     * @param index - Position under root. If undefined, then last.
     */
    addItem(userItemConfig: UserRowOrColumnItemConfig | UserStackItemConfig | UserComponentItemConfig,  index?: number): void {
        if (this._groundItem === null) {
            throw new Error('Cannot add item before init');
        } else {
            this._groundItem.addItem(userItemConfig, index);
        }
    }

    /**
     * Adds a new child Serialisable ComponentItem under the root ContentItem.
     * @param userItemConfig - ItemConfig of child to be added.
     * @param index - Position under root. If undefined, then last.
     */
    addSerialisableComponent(componentTypeName: string, componentState?: JsonValue, index?: number): void {
        if (this._groundItem === null) {
            throw new Error('Cannot add component before init');
        } else {
            const itemConfig: UserSerialisableComponentConfig = {
                type: 'component',
                componentName: componentTypeName,
                componentState,
            };
            this._groundItem.addItem(itemConfig, index);
        }
    }

    /** @deprecated Use {@link (LayoutManager:class).setSize} */
    updateSize(width: number, height: number): void {
        this.setSize(width, height);
    }

    /**
     * Updates the layout managers size
     *
     * @param width - Width in pixels
     * @param height - Height in pixels
     */
    setSize(width: number, height: number): void {
        this._width = width;
        this._height = height;

        if (this._isInitialised === true) {
            if (this._groundItem === null) {
                throw new UnexpectedNullError('LMUS18881');
            } else {
                this._groundItem.setSize(this._width, this._height);

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
     * Update the size of the root ContentItem.  This will update the size of all contentItems in the tree
     */
    updateRootSize(): void {
        if (this._groundItem === null) {
            throw new UnexpectedNullError('LMURS28881');
        } else {
            this._groundItem.updateSize();
        }
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

    /** @public */
    createAndInitContentItem(config: ItemConfig, parent: ContentItem): ContentItem {
        const newItem = this.createContentItem(config, parent);
        newItem.init();
        return newItem;
    }

    /**
     * Recursively creates new item tree structures based on a provided
     * ItemConfiguration object
     *
     * @param config - ItemConfig
     * @param parent - The item the newly created item should be a child of
     * @internal
     */
    createContentItem(config: ItemConfig, parent: ContentItem): ContentItem {
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
            !(this.isSubWindow === true && parent instanceof GroundItem)
        ) {
            const stackConfig: StackItemConfig = {
                type: ItemConfig.Type.stack,
                content: [config],
                width: config.width,
                minWidth: config.minWidth,
                height: config.height,
                minHeight: config.minHeight,
                id: config.id,
                maximised: config.maximised,
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
     * @param itemConfigOrContentItem - The content of the popout window's layout manager derived from either
     * a {@link (ContentItem:class)} or {@link (ItemConfig:interface)} or ItemConfig content (array of {@link (ItemConfig:interface)})
     * @param positionAndSize - The width, height, left and top of Popout window
     * @param parentId -The id of the element this item will be appended to when popIn is called
     * @param indexInParent - The position of this item within its parent element
     */

    createPopout(itemConfigOrContentItem: ContentItem | RootItemConfig,
        positionAndSize: PopoutLayoutConfig.Window,
        parentId: string | null,
        indexInParent: number | null
    ): BrowserPopout {
        if (itemConfigOrContentItem instanceof ContentItem) {
            return this.createPopoutFromContentItem(itemConfigOrContentItem, positionAndSize, parentId, indexInParent);
        } else {
            return this.createPopoutFromItemConfig(itemConfigOrContentItem, positionAndSize, parentId, indexInParent);
        }
    }

    /** @internal */
    createPopoutFromContentItem(item: ContentItem,
        window: PopoutLayoutConfig.Window | undefined,
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
        while (parent !== null && parent.contentItems.length === 1 && !parent.isGround) {
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

            if (!RootItemConfig.isRootItemConfig(itemConfig)) {
                throw new Error(`${i18nStrings[I18nStringId.PopoutCannotBeCreatedWithGroundItemConfig]}`);
            } else {
                return this.createPopoutFromItemConfig(itemConfig, window, parentId, indexInParent);
            }
        }
    }

    /** @internal */
    private createPopoutFromItemConfig(rootItemConfig: RootItemConfig,
        window: PopoutLayoutConfig.Window,
        parentId: string | null,
        indexInParent: number | null
    ) {
        const layoutConfig = this.toConfig();

        const popoutLayoutConfig: PopoutLayoutConfig = {
            root: rootItemConfig,
            openPopouts: [],
            settings: layoutConfig.settings,
            dimensions: layoutConfig.dimensions,
            header: layoutConfig.header,
            window,
            parentId,
            indexInParent,
            resolved: true,
        }

        return this.createPopoutFromPopoutLayoutConfig(popoutLayoutConfig);
    }

    /** @internal */
    createPopoutFromPopoutLayoutConfig(config: PopoutLayoutConfig): BrowserPopout {
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
     * @param element -
     * @param itemConfig - For the new item to be created, or a function which will provide it
     *
     * @returns 1) an opaque object that identifies the DOM element
	 *          and the attached itemConfig. This can be used in
	 *          removeDragSource() later to get rid of the drag listeners.
     *          2) undefined if constrainDragToContainer is specified
     */
    createDragSource(element: HTMLElement, itemConfig: ItemConfig | (() => ItemConfig)): DragSource | undefined {
        if (this.layoutConfig.settings.constrainDragToContainer) {
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
     * @param item -
     * @param silent - Whether to notify the item of its selection
     */
    selectItem(item: ContentItem, silent: boolean): void {

        if (this.layoutConfig.settings.selectionEnabled !== true) {
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
    private createContentItemFromConfig(config: ItemConfig, parent: ContentItem): ContentItem {
        switch (config.type) {
            case ItemConfig.Type.ground: throw new AssertError('LMCCIFC68871');
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
    maximiseItem(contentItem: ContentItem): void {
        if (this._maximisedItem !== null) {
            this.minimiseItem(this._maximisedItem);
        }
        this._maximisedItem = contentItem;
        contentItem.on('beforeItemDestroyed', this._maximisedItemBeforeDestroyedListener);
        contentItem.element.classList.add('lm_maximised');
        contentItem.element.insertAdjacentElement('afterend', this._maximisePlaceholder);
        if (this._groundItem === null) {
            throw new UnexpectedNullError('LMMXI19993');
        } else {
            this._groundItem.element.prepend(contentItem.element);
            const { width, height } = getElementWidthAndHeight(this._container);
            setElementWidth(contentItem.element, width);
            setElementHeight(contentItem.element, height);
            contentItem.updateSize();
            this._maximisedItem.emit('maximised');
            this.emit('stateChanged');
        }
    }

    /** @internal */
    minimiseItem(contentItem: ContentItem): void {
        if (contentItem.parent === null) {
            throw new UnexpectedNullError('LMMI13668');
        } else {
            contentItem.element.classList.remove('lm_maximised');
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
    getArea(x: number, y: number): ContentItem.Area | null {
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
         * allow to re-drop it. this.ground.contentiItems.length === 0 at this point
         *
         * Don't include ground into the possible drop areas though otherwise since it
         * will used for every gap in the layout, e.g. splitters
         */
        const groundItem = this._groundItem;
        if (groundItem === null) {
            throw new UnexpectedNullError('LMCIAR44365');
        } else {
            if (allContentItems.length === 1) {
                const groundArea = groundItem.getElementArea();
                if (groundArea === null) {
                    throw new UnexpectedNullError('LMCIARA44365')
                } else {
                    this._itemAreas = [groundArea];
                }
                return;
            } else {
                // sides of layout
                this._itemAreas = groundItem.createSideAreas();

                for (let i = 0; i < allContentItems.length; i++) {
                    const stack = allContentItems[i];
                    if (ContentItem.isStack(stack)) {
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

                                    const header: ContentItem.Area = {
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
     * Called as part of loading a new layout (including initial init()).
     * Checks to see layout has a maximised item. If so, it maximises that item.
     * @internal
     */
    private checkLoadedLayoutMaximiseItem() {
        if (this._groundItem === null) {
            throw new UnexpectedNullError('LMCLLMI43432');
        } else {
            const configMaximisedItems = this._groundItem.getConfigMaximisedItems();

            if (configMaximisedItems.length > 0) {
                let item = configMaximisedItems[0];
                if (ContentItem.isComponentItem(item)) {
                    item = item.stack;
                }
                if (!ContentItem.isStack(item)) {
                    throw new AssertError('LMCLLMI19993');
                } else {
                    item.toggleMaximise();
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
        if (this._groundItem === null) {
            throw new UnexpectedNullError('LMGACI13130');
        } else {
            const allContentItems: ContentItem[] = [this._groundItem];
            this._groundItem.deepAddChildContentItems(allContentItems);
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
     * Called when the window is closed or the user navigates away
     * from the page
     * @internal
     */
    private onUnload(): void {
        if (this.layoutConfig.settings.closePopoutsOnUnload === true) {
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
        if (this._groundItem === null) {
            throw new UnexpectedNullError('LMACR20883');
        } else {
            this._firstLoad = false;
            // If there is no min width set, or not content items, do nothing.
            if (this.useResponsiveLayout() &&
                !this._updatingColumnsResponsive &&
                this._groundItem.contentItems.length > 0 &&
                this._groundItem.contentItems[0].isRow)
            {
                if (this._groundItem === null || this._width === null) {
                    throw new UnexpectedNullError('LMACR77412');
                } else {
                    // If there is only one column, do nothing.
                    const columnCount = this._groundItem.contentItems[0].contentItems.length;
                    if (columnCount <= 1) {
                        return;
                    } else {
                        // If they all still fit, do nothing.
                        const minItemWidth = this.layoutConfig.dimensions.minItemWidth;
                        const totalMinWidth = columnCount * minItemWidth;
                        if (totalMinWidth <= this._width) {
                            return;
                        } else {
                            // Prevent updates while it is already happening.
                            this._updatingColumnsResponsive = true;

                            // Figure out how many columns to stack, and put them all in the first stack container.
                            const finalColumnCount = Math.max(Math.floor(this._width / minItemWidth), 1);
                            const stackColumnCount = columnCount - finalColumnCount;

                            const rootContentItem = this._groundItem.contentItems[0];
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
        const settings = this.layoutConfig.settings;
        const alwaysResponsiveMode = settings.responsiveMode === LayoutConfig.Settings.ResponsiveMode.always;
        const onLoadResponsiveModeAndFirst = settings.responsiveMode === LayoutConfig.Settings.ResponsiveMode.onload && this._firstLoad;
        return alwaysResponsiveMode || onLoadResponsiveModeAndFirst;
    }

    /**
     * Adds all children of a node to another container recursively.
     * @param container - Container to add child content items to.
     * @param node - Node to search for content items.
     * @internal
     */
    private addChildContentItemsToContainer(container: ContentItem, node: ContentItem) {
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
        if (this._groundItem === null) {
            throw new UnexpectedNullError('LMFASC52778');
        } else {
            const stacks: Stack[] = [];
            this.findAllStacksRecursive(stacks, this._groundItem);

            return stacks;
        }
    }

    /**
     * Finds all the stack containers.
     *
     * @param stacks - Set of containers to populate.
     * @param node - Current node to process.
     * @internal
     */
    private findAllStacksRecursive(stacks: Stack[], node: ContentItem) {
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

/** @public */
export namespace LayoutManager {
    export type GetComponentConstructorCallback = (this: void, config: ComponentItemConfig) => ComponentItem.ComponentConstructor

    /** @internal */
    export interface LayoutConfigAndIsSubWindow {
        layoutConfig: LayoutConfig;
        isSubWindow: boolean;
    }
}