import { ComponentItemConfig, ItemConfig, LayoutConfig, RowOrColumnItemConfig, StackItemConfig } from './config/config';
import {
    ResolvedComponentItemConfig,
    ResolvedItemConfig,
    ResolvedLayoutConfig,
    ResolvedPopoutLayoutConfig,
    ResolvedRootItemConfig,
    ResolvedRowOrColumnItemConfig,
    ResolvedStackItemConfig
} from "./config/resolved-config";
import { ComponentContainer } from './container/component-container';
import { BrowserPopout } from './controls/browser-popout';
import { DragProxy } from './controls/drag-proxy';
import { DragSource } from './controls/drag-source';
import { DropTargetIndicator } from './controls/drop-target-indicator';
import { TransitionIndicator } from './controls/transition-indicator';
import { ConfigurationError } from './errors/external-error';
import { AssertError, UnexpectedNullError, UnexpectedUndefinedError, UnreachableCaseError } from './errors/internal-error';
import { ComponentItem } from './items/component-item';
import { ComponentParentableItem } from './items/component-parentable-item';
import { ContentItem } from './items/content-item';
import { GroundItem } from './items/ground-item';
import { RowOrColumn } from './items/row-or-column';
import { Stack } from './items/stack';
import { ConfigMinifier } from './utils/config-minifier';
import { DomConstants } from './utils/dom-constants';
import { DragListener } from './utils/drag-listener';
import { EventEmitter } from './utils/event-emitter';
import { EventHub } from './utils/event-hub';
import { I18nStringId, I18nStrings, i18nStrings } from './utils/i18n-strings';
import { ItemType, JsonValue, Rect, ResponsiveMode } from './utils/types';
import {
    getElementWidthAndHeight,
    removeFromArray,
    setElementHeight,
    setElementWidth
} from './utils/utils';

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
    private _containerElement: HTMLElement;
    /** @internal */
    private _isFullPage = false;
    /** @internal */
    private _isInitialised = false;
    /** @internal */
    private _groundItem: GroundItem | undefined = undefined;
    /** @internal */
    private _openPopouts: BrowserPopout[] = [];
    /** @internal */
    private _dropTargetIndicator: DropTargetIndicator | null = null;
    /** @internal */
    private _transitionIndicator: TransitionIndicator | null = null;
    /** @internal */
    private _resizeTimeoutId: ReturnType<typeof setTimeout> | undefined;
    /** @internal */
    private _itemAreas: ContentItem.Area[] = [];
    /** @internal */
    private _maximisedStack: Stack | undefined;
    /** @internal */
    private _maximisePlaceholder = LayoutManager.createMaximisePlaceElement(document);
    /** @internal */
    private _tabDropPlaceholder = LayoutManager.createTabDropPlaceholderElement(document);
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
    private _focusedComponentItem: ComponentItem | undefined;
    /** @internal */
    private _virtualSizedContainers: ComponentContainer[] = [];
    /** @internal */
    private _virtualSizedContainerAddingBeginCount = 0;

    /** @internal */
    private _windowResizeListener = () => this.processResizeWithDebounce();
    /** @internal */
    private _windowUnloadListener = () => this.onUnload();
    /** @internal */
    private _maximisedStackBeforeDestroyedListener = (ev: EventEmitter.BubblingEvent) => this.cleanupBeforeMaximisedStackDestroyed(ev);

    readonly isSubWindow: boolean;
    layoutConfig: ResolvedLayoutConfig;

    beforeVirtualRectingEvent: LayoutManager.BeforeVirtualRectingEvent | undefined;
    afterVirtualRectingEvent: LayoutManager.AfterVirtualRectingEvent | undefined;

    get container(): HTMLElement { return this._containerElement; }
    get isInitialised(): boolean { return this._isInitialised; }
    /** @internal */
    get groundItem(): GroundItem | undefined { return this._groundItem; }
    /** @internal @deprecated use {@link (LayoutManager:class).groundItem} instead */
    get root(): GroundItem | undefined { return this._groundItem; }
    get openPopouts(): BrowserPopout[] { return this._openPopouts; }
    /** @internal */
    get dropTargetIndicator(): DropTargetIndicator | null { return this._dropTargetIndicator; }
    /** @internal @deprecated To be removed */
    get transitionIndicator(): TransitionIndicator | null { return this._transitionIndicator; }
    get width(): number | null { return this._width; }
    get height(): number | null { return this._height; }
    /**
     * Retrieves the {@link (EventHub:class)} instance associated with this layout manager.
     * This can be used to propagate events between the windows
     * @public
     */
    get eventHub(): EventHub { return this._eventHub; }
    get rootItem(): ContentItem | undefined {
        if (this._groundItem === undefined) {
            throw new Error('Cannot access rootItem before init');
        } else {
            const groundContentItems = this._groundItem.contentItems;
            if (groundContentItems.length === 0) {
                return undefined;
            } else {
                return this._groundItem.contentItems[0];
            }
        }
    }
    get focusedComponentItem(): ComponentItem | undefined { return this._focusedComponentItem; }
    /** @internal */
    get tabDropPlaceholder(): HTMLElement { return this._tabDropPlaceholder; }
    get maximisedStack(): Stack | undefined { return this._maximisedStack; }


    /**
    * @param container - A Dom HTML element. Defaults to body
    * @internal
    */
    constructor(parameters: LayoutManager.ConstructorParameters) {
        super();

        let layoutConfig = parameters.layoutConfig;
        if (layoutConfig === undefined) {
            layoutConfig = ResolvedLayoutConfig.createDefault();
        }

        this.layoutConfig = layoutConfig;
        this.isSubWindow = parameters.isSubWindow;

        I18nStrings.checkInitialise();
        ConfigMinifier.checkInitialise();

        if (parameters.containerElement !== undefined) {
            this._containerElement = parameters.containerElement;
        }
    }

    /**
     * Destroys the LayoutManager instance itself as well as every ContentItem
     * within it. After this is called nothing should be left of the LayoutManager.
     */
    destroy(): void {
        if (this._isInitialised) {
            if (this.layoutConfig.settings.closePopoutsOnUnload === true) {
                for (let i = 0; i < this._openPopouts.length; i++) {
                    this._openPopouts[i].close();
                }
            }
            if (this._isFullPage) {
                globalThis.removeEventListener('resize', this._windowResizeListener);
            }
            globalThis.removeEventListener('unload', this._windowUnloadListener);
            globalThis.removeEventListener('beforeunload', this._windowUnloadListener);
            if (this._groundItem !== undefined) {
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

            this._isInitialised = false;
        }
    }

    /**
     * Takes a GoldenLayout configuration object and
     * replaces its keys and values recursively with
     * one letter codes
     * @deprecated use {@link (ResolvedLayoutConfig:namespace).minifyConfig} instead
     */
    minifyConfig(config: ResolvedLayoutConfig): ResolvedLayoutConfig {
        return ResolvedLayoutConfig.minifyConfig(config);
    }

    /**
     * Takes a configuration Object that was previously minified
     * using minifyConfig and returns its original version
     * @deprecated use {@link (ResolvedLayoutConfig:namespace).unminifyConfig} instead
     */
    unminifyConfig(config: ResolvedLayoutConfig): ResolvedLayoutConfig {
        return ResolvedLayoutConfig.unminifyConfig(config);
    }

    /** @internal */
    abstract bindComponent(container: ComponentContainer, itemConfig: ResolvedComponentItemConfig): ComponentContainer.BindableComponent;
    /** @internal */
    abstract unbindComponent(container: ComponentContainer, virtual: boolean, component: ComponentContainer.Component | undefined): void;

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
        this._groundItem = new GroundItem(this, layoutConfig.root, this._containerElement);
        this._groundItem.init();

        this.checkLoadedLayoutMaximiseItem();

        this.bindEvents();
        this._isInitialised = true;
        this.adjustColumnsResponsive();
        this.emit('initialised');
    }

    /**
     * Loads a new layout
     * @param layoutConfig - New layout to be loaded
     */
    loadLayout(layoutConfig: LayoutConfig): void {
        if (!this.isInitialised) {
            // In case application not correctly using legacy constructor
            throw new Error('GoldenLayout: Need to call init() if LayoutConfig with defined root passed to constructor')
        } else {
            if (this._groundItem === undefined) {
                throw new UnexpectedUndefinedError('LMLL11119');
            } else {
                this.layoutConfig = LayoutConfig.resolve(layoutConfig);
                this._groundItem.loadRoot(this.layoutConfig.root);
                this.checkLoadedLayoutMaximiseItem();
                this.adjustColumnsResponsive();
            }
        }
    }

    /**
     * Creates a layout configuration object based on the the current state
     *
     * @public
     * @returns GoldenLayout configuration
     */
    saveLayout(): ResolvedLayoutConfig {
        if (this._isInitialised === false) {
            throw new Error('Can\'t create config, layout not yet initialised');
        } else {

            // if (root !== undefined && !(root instanceof ContentItem)) {
            //     throw new Error('Root must be a ContentItem');
            // }

            /*
            * Content
            */
            if (this._groundItem === undefined) {
                throw new UnexpectedUndefinedError('LMTC18244');
            } else {
                const groundContent = this._groundItem.calculateConfigContent();

                let rootItemConfig: ResolvedRootItemConfig | undefined;
                if (groundContent.length !== 1) {
                    rootItemConfig = undefined;
                } else {
                    rootItemConfig = groundContent[0];
                }

                /*
                * Retrieve config for subwindows
                */
                this.reconcilePopoutWindows();
                const openPopouts: ResolvedPopoutLayoutConfig[] = [];
                for (let i = 0; i < this._openPopouts.length; i++) {
                    openPopouts.push(this._openPopouts[i].toConfig());
                }

                const config: ResolvedLayoutConfig = {
                    root: rootItemConfig,
                    openPopouts,
                    settings:  ResolvedLayoutConfig.Settings.createCopy(this.layoutConfig.settings),
                    dimensions: ResolvedLayoutConfig.Dimensions.createCopy(this.layoutConfig.dimensions),
                    header: ResolvedLayoutConfig.Header.createCopy(this.layoutConfig.header),
                    resolved: true,
                }

                return config;
            }
        }
    }

    /**
     * Removes any existing layout. Effectively, an empty layout will be loaded.
     */

     clear(): void {
        if (this._groundItem === undefined) {
            throw new UnexpectedUndefinedError('LMCL11129');
        } else {
            this._groundItem.clearRoot();
        }
    }

    /**
     * @deprecated Use {@link (LayoutManager:class).saveLayout}
     */
    toConfig(): ResolvedLayoutConfig {
        return this.saveLayout();
    }

    /**
     * Adds a new ComponentItem.  Will use default location selectors to ensure a location is found and
     * component is successfully added
     * @param componentTypeName - Name of component type to be created.
     * @param state - Optional initial state to be assigned to component
     * @returns New ComponentItem created.
     */
    newComponent(componentType: JsonValue, componentState?: JsonValue, title?: string): ComponentItem {
        const componentItem = this.newComponentAtLocation(componentType, componentState, title);
        if (componentItem === undefined) {
            throw new AssertError('LMNC65588');
        } else {
            return componentItem;
        }
    }

    /**
     * Adds a ComponentItem at the first valid selector location.
     * @param componentTypeName - Name of component type to be created.
     * @param state - Optional initial state to be assigned to component
     * @param locationSelectors - Array of location selectors used to find location in layout where component
     * will be added. First location in array which is valid will be used. If locationSelectors is undefined,
     * {@link (LayoutManager:namespace).defaultLocationSelectors} will be used
     * @returns New ComponentItem created or undefined if no valid location selector was in array.
     */
    newComponentAtLocation(componentType: JsonValue, componentState?: JsonValue, title?: string,
        locationSelectors?: LayoutManager.LocationSelector[]
    ): ComponentItem | undefined{
        if (this._groundItem === undefined) {
            throw new Error('Cannot add component before init');
        } else {
            const location = this.addComponentAtLocation(componentType, componentState, title, locationSelectors);
            if (location === undefined) {
                return undefined;
            } else {
                const createdItem = location.parentItem.contentItems[location.index];
                if (!ContentItem.isComponentItem(createdItem)) {
                    throw new AssertError('LMNC992877533');
                } else {
                    return createdItem;
                }
            }
        }
    }

    /**
     * Adds a new ComponentItem.  Will use default location selectors to ensure a location is found and
     * component is successfully added
     * @param componentType - Type of component to be created.
     * @param state - Optional initial state to be assigned to component
     * @returns Location of new ComponentItem created.
     */
    addComponent(componentType: JsonValue, componentState?: JsonValue, title?: string): LayoutManager.Location {
        const location = this.addComponentAtLocation(componentType, componentState, title);
        if (location === undefined) {
            throw new AssertError('LMAC99943');
        } else {
            return location;
        }
    }

    /**
     * Adds a ComponentItem at the first valid selector location.
     * @param componentType - Type of component to be created.
     * @param state - Optional initial state to be assigned to component
     * @param locationSelectors - Array of location selectors used to find determine location in layout where component
     * will be added. First location in array which is valid will be used. If undefined,
     * {@link (LayoutManager:namespace).defaultLocationSelectors} will be used.
     * @returns Location of new ComponentItem created or undefined if no valid location selector was in array.
     */
    addComponentAtLocation(componentType: JsonValue, componentState?: JsonValue, title?: string,
        locationSelectors?: readonly LayoutManager.LocationSelector[]
    ): LayoutManager.Location | undefined {
        const itemConfig: ComponentItemConfig = {
            type: 'component',
            componentType,
            componentState,
            title,
        };

        return this.addItemAtLocation(itemConfig, locationSelectors);
    }

    /**
     * Adds a new ContentItem.  Will use default location selectors to ensure a location is found and
     * component is successfully added
     * @param itemConfig - ResolvedItemConfig of child to be added.
     * @returns New ContentItem created.
    */
    newItem(itemConfig: RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig): ContentItem {
        const contentItem = this.newItemAtLocation(itemConfig);
        if (contentItem === undefined) {
            throw new AssertError('LMNC65588');
        } else {
            return contentItem;
        }
    }

    /**
     * Adds a new child ContentItem under the root ContentItem.  If a root does not exist, then create root ContentItem instead
     * @param itemConfig - ResolvedItemConfig of child to be added.
     * @param locationSelectors - Array of location selectors used to find determine location in layout where ContentItem
     * will be added. First location in array which is valid will be used. If undefined,
     * {@link (LayoutManager:namespace).defaultLocationSelectors} will be used.
     * @returns New ContentItem created or undefined if no valid location selector was in array. */
    newItemAtLocation(itemConfig: RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig,
        locationSelectors?: readonly LayoutManager.LocationSelector[]
    ): ContentItem | undefined {
        if (this._groundItem === undefined) {
            throw new Error('Cannot add component before init');
        } else {
            const location = this.addItemAtLocation(itemConfig, locationSelectors);
            if (location === undefined) {
                return undefined;
            } else {
                const createdItem = location.parentItem.contentItems[location.index];
                return createdItem;
            }
        }
    }

    /**
     * Adds a new ContentItem.  Will use default location selectors to ensure a location is found and
     * component is successfully added.
     * @param itemConfig - ResolvedItemConfig of child to be added.
     * @returns Location of new ContentItem created. */
    addItem(itemConfig: RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig): LayoutManager.Location {
        const location = this.addItemAtLocation(itemConfig);
        if (location === undefined) {
            throw new AssertError('LMAI99943');
        } else {
            return location;
        }
    }

    /**
     * Adds a ContentItem at the first valid selector location.
     * @param itemConfig - ResolvedItemConfig of child to be added.
     * @param locationSelectors - Array of location selectors used to find determine location in layout where ContentItem
     * will be added. First location in array which is valid will be used. If undefined,
     * {@link (LayoutManager:namespace).defaultLocationSelectors} will be used.
     * @returns Location of new ContentItem created or undefined if no valid location selector was in array. */
    addItemAtLocation(itemConfig: RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig,
        locationSelectors?: readonly LayoutManager.LocationSelector[]
    ): LayoutManager.Location | undefined {
        if (this._groundItem === undefined) {
            throw new Error('Cannot add component before init');
        } else {
            if (locationSelectors === undefined) {
                // defaultLocationSelectors should always find a location
                locationSelectors = LayoutManager.defaultLocationSelectors;
            }

            const location = this.findFirstLocation(locationSelectors);
            if (location === undefined) {
                return undefined;
            } else {
                let parentItem = location.parentItem;
                let addIdx: number;
                switch (parentItem.type) {
                    case ItemType.ground: {
                        const groundItem = parentItem as GroundItem;
                        addIdx = groundItem.addItem(itemConfig, location.index);
                        if (addIdx >= 0) {
                            parentItem = this._groundItem.contentItems[0]; // was added to rootItem
                        } else {
                            addIdx = 0; // was added as rootItem (which is the first and only ContentItem in GroundItem)
                        }
                        break;
                    }
                    case ItemType.row:
                    case ItemType.column: {
                        const rowOrColumn = parentItem as RowOrColumn;
                        addIdx = rowOrColumn.addItem(itemConfig, location.index);
                        break;
                    }
                    case ItemType.stack: {
                        if (!ItemConfig.isComponent(itemConfig)) {
                            throw Error(i18nStrings[I18nStringId.ItemConfigIsNotTypeComponent]);
                        } else {
                            const stack = parentItem as Stack;
                            addIdx = stack.addItem(itemConfig, location.index);
                            break;
                        }
                    }
                    case ItemType.component: {
                        throw new AssertError('LMAIALC87444602');
                    }
                    default:
                        throw new UnreachableCaseError('LMAIALU98881733', parentItem.type);
                }

                if (ItemConfig.isComponent(itemConfig)) {
                    // see if stack was inserted
                    const item = parentItem.contentItems[addIdx];
                    if (ContentItem.isStack(item)) {
                        parentItem = item;
                        addIdx = 0;
                    }
                }

                location.parentItem = parentItem;
                location.index = addIdx;

                return location;
            }
        }
    }

    /** Loads the specified component ResolvedItemConfig as root.
     * This can be used to display a Component all by itself.  The layout cannot be changed other than having another new layout loaded.
     * Note that, if this layout is saved and reloaded, it will reload with the Component as a child of a Stack.
    */
    loadComponentAsRoot(itemConfig: ComponentItemConfig): void {
        if (this._groundItem === undefined) {
            throw new Error('Cannot add item before init');
        } else {
            this._groundItem.loadComponentAsRoot(itemConfig);
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
            if (this._groundItem === undefined) {
                throw new UnexpectedUndefinedError('LMUS18881');
            } else {
                this._groundItem.setSize(this._width, this._height);

                if (this._maximisedStack) {
                    const { width, height } = getElementWidthAndHeight(this._containerElement);
                    setElementWidth(this._maximisedStack.element, width);
                    setElementHeight(this._maximisedStack.element, height);
                    this._maximisedStack.updateSize();
                }

                this.adjustColumnsResponsive();
            }
        }
    }

    /** @internal */
    updateSizeFromContainer(): void {
        const { width, height } = getElementWidthAndHeight(this._containerElement);
        this.setSize(width, height);
    }

    /**
     * Update the size of the root ContentItem.  This will update the size of all contentItems in the tree
     */
    updateRootSize(): void {
        if (this._groundItem === undefined) {
            throw new UnexpectedUndefinedError('LMURS28881');
        } else {
            this._groundItem.updateSize();
        }
    }

    /** @public */
    createAndInitContentItem(config: ResolvedItemConfig, parent: ContentItem): ContentItem {
        const newItem = this.createContentItem(config, parent);
        newItem.init();
        return newItem;
    }

    /**
     * Recursively creates new item tree structures based on a provided
     * ItemConfiguration object
     *
     * @param config - ResolvedItemConfig
     * @param parent - The item the newly created item should be a child of
     * @internal
     */
    createContentItem(config: ResolvedItemConfig, parent: ContentItem): ContentItem {
        if (typeof config.type !== 'string') {
            throw new ConfigurationError('Missing parameter \'type\'', JSON.stringify(config));
        }

        /**
         * We add an additional stack around every component that's not within a stack anyways.
         */
        if (
            // If this is a component
            ResolvedItemConfig.isComponentItem(config) &&

            // and it's not already within a stack
            !(parent instanceof Stack) &&

            // and we have a parent
            !!parent &&

            // and it's not the topmost item in a new window
            !(this.isSubWindow === true && parent instanceof GroundItem)
        ) {
            const stackConfig: ResolvedStackItemConfig = {
                type: ItemType.stack,
                content: [config],
                width: config.width,
                minWidth: config.minWidth,
                height: config.height,
                minHeight: config.minHeight,
                id: config.id,
                maximised: config.maximised,
                isClosable: config.isClosable,
                activeItemIndex: 0,
                header: undefined,
            };

            config = stackConfig;
        }

        const contentItem = this.createContentItemFromConfig(config, parent);
        return contentItem;
    }

    findFirstComponentItemById(id: string): ComponentItem | undefined {
        if (this._groundItem === undefined) {
            throw new UnexpectedUndefinedError('LMFFCIBI82446');
        } else {
            return this.findFirstContentItemTypeByIdRecursive(ItemType.component, id, this._groundItem) as ComponentItem;
        }
    }

    /**
     * Creates a popout window with the specified content at the specified position
     *
     * @param itemConfigOrContentItem - The content of the popout window's layout manager derived from either
     * a {@link (ContentItem:class)} or {@link (ItemConfig:interface)} or ResolvedItemConfig content (array of {@link (ItemConfig:interface)})
     * @param positionAndSize - The width, height, left and top of Popout window
     * @param parentId -The id of the element this item will be appended to when popIn is called
     * @param indexInParent - The position of this item within its parent element
     */

    createPopout(itemConfigOrContentItem: ContentItem | ResolvedRootItemConfig,
        positionAndSize: ResolvedPopoutLayoutConfig.Window,
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
        window: ResolvedPopoutLayoutConfig.Window | undefined,
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
                parent.addPopInParentId(parentId);
            }

            if (window === undefined) {
                const windowLeft = globalThis.screenX || globalThis.screenLeft;
                const windowTop = globalThis.screenY || globalThis.screenTop;
                const offsetLeft = item.element.offsetLeft;
                const offsetTop = item.element.offsetTop
                // const { left: offsetLeft, top: offsetTop } = getJQueryLeftAndTop(item.element);
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

            if (!ResolvedRootItemConfig.isRootItemConfig(itemConfig)) {
                throw new Error(`${i18nStrings[I18nStringId.PopoutCannotBeCreatedWithGroundItemConfig]}`);
            } else {
                return this.createPopoutFromItemConfig(itemConfig, window, parentId, indexInParent);
            }
        }
    }

    /** @internal */
    beginVirtualSizedContainerAdding(): void {
        if (++this._virtualSizedContainerAddingBeginCount === 0) {
            this._virtualSizedContainers.length = 0;
        }
    }

    /** @internal */
    addVirtualSizedContainer(container: ComponentContainer): void {
        this._virtualSizedContainers.push(container);
    }

    /** @internal */
    endVirtualSizedContainerAdding(): void {
        if (--this._virtualSizedContainerAddingBeginCount === 0) {
            const count = this._virtualSizedContainers.length;
            if (count > 0) {
                this.fireBeforeVirtualRectingEvent(count);
                for (let i = 0; i < count; i++) {
                    const container = this._virtualSizedContainers[i];
                    container.notifyVirtualRectingRequired();
                }
                this.fireAfterVirtualRectingEvent();
                this._virtualSizedContainers.length = 0;
            }
        }
    }

    /** @internal */
    fireBeforeVirtualRectingEvent(count: number): void {
        if (this.beforeVirtualRectingEvent !== undefined) {
            this.beforeVirtualRectingEvent(count);
        }
    }

    /** @internal */
    fireAfterVirtualRectingEvent(): void {
        if (this.afterVirtualRectingEvent !== undefined) {
            this.afterVirtualRectingEvent();
        }
    }

    /** @internal */
    private createPopoutFromItemConfig(rootItemConfig: ResolvedRootItemConfig,
        window: ResolvedPopoutLayoutConfig.Window,
        parentId: string | null,
        indexInParent: number | null
    ) {
        const layoutConfig = this.toConfig();

        const popoutLayoutConfig: ResolvedPopoutLayoutConfig = {
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
    createPopoutFromPopoutLayoutConfig(config: ResolvedPopoutLayoutConfig): BrowserPopout {
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
     * and turns it into a way of creating new ComponentItems
     * by 'dragging' the DOM element into the layout
     *
     * @param element -
     * @param componentTypeOrFtn - Type of component to be created, or a function which will provide both component type and state
     * @param componentState - Optional initial state of component.  This will be ignored if componentTypeOrFtn is a function
     *
     * @returns an opaque object that identifies the DOM element
	 *          and the attached itemConfig. This can be used in
	 *          removeDragSource() later to get rid of the drag listeners.
     */
    newDragSource(element: HTMLElement,
        componentTypeOrFtn: JsonValue | (() => DragSource.ComponentItemConfig),
        componentState?: JsonValue,
        title?: string,
    ): DragSource {
        const dragSource = new DragSource(this, element, [], componentTypeOrFtn, componentState, title);
        this._dragSources.push(dragSource);

        return dragSource;
    }

    /**
	 * Removes a DragListener added by createDragSource() so the corresponding
	 * DOM element is not a drag source any more.
	 */
	removeDragSource(dragSource: DragSource): void {
		removeFromArray(dragSource, this._dragSources );
		dragSource.destroy();
    }

    /** @internal */
    startComponentDrag(x: number, y: number, dragListener: DragListener, componentItem: ComponentItem, stack: Stack): void {
        new DragProxy(
            x,
            y,
            dragListener,
            this,
            componentItem,
            stack
        );
    }

    /**
     * Programmatically focuses an item. This focuses the specified component item
     * and the item emits a focus event
     *
     * @param item - The component item to be focused
     * @param suppressEvent - Whether to emit focus event
     */
    focusComponent(item: ComponentItem, suppressEvent = false): void {
        item.focus(suppressEvent);
    }

    /**
     * Programmatically blurs (defocuses) the currently focused component.
     * If a component item is focused, then it is blurred and and the item emits a blur event
     *
     * @param item - The component item to be blurred
     * @param suppressEvent - Whether to emit blur event
     */
    clearComponentFocus(suppressEvent = false): void {
        this.setFocusedComponentItem(undefined, suppressEvent);
    }

    /**
     * Programmatically focuses a component item or removes focus (blurs) from an existing focused component item.
     *
     * @param item - If defined, specifies the component item to be given focus.  If undefined, clear component focus.
     * @param suppressEvents - Whether to emit focus and blur events
     * @internal
     */
    setFocusedComponentItem(item: ComponentItem | undefined, suppressEvents = false): void {
        if (item !== this._focusedComponentItem) {

            let newFocusedParentItem: ComponentParentableItem | undefined;
            if (item === undefined) {
                newFocusedParentItem === undefined;
            } else {
                newFocusedParentItem = item.parentItem;
            }

            if (this._focusedComponentItem !== undefined) {
                const oldFocusedItem = this._focusedComponentItem;
                this._focusedComponentItem = undefined;
                oldFocusedItem.setBlurred(suppressEvents);
                const oldFocusedParentItem = oldFocusedItem.parentItem;
                if (newFocusedParentItem === oldFocusedParentItem) {
                    newFocusedParentItem = undefined;
                } else {
                    oldFocusedParentItem.setFocusedValue(false);
                }
            }

            if (item !== undefined) {
                this._focusedComponentItem = item;
                item.setFocused(suppressEvents);
                if (newFocusedParentItem !== undefined) {
                    newFocusedParentItem.setFocusedValue(true);
                }
            }
        }
    }

    /** @internal */
    private createContentItemFromConfig(config: ResolvedItemConfig, parent: ContentItem): ContentItem {
        switch (config.type) {
            case ItemType.ground: throw new AssertError('LMCCIFC68871');
            case ItemType.row: return new RowOrColumn(false, this, config as ResolvedRowOrColumnItemConfig, parent);
            case ItemType.column: return new RowOrColumn(true, this, config as ResolvedRowOrColumnItemConfig, parent);
            case ItemType.stack: return new Stack(this, config as ResolvedStackItemConfig, parent);
            case ItemType.component:
                return new ComponentItem(this, config as ResolvedComponentItemConfig, parent as Stack);
            default:
                throw new UnreachableCaseError('CCC913564', config.type, 'Invalid Config Item type specified');
        }
    }

    /**
     * This should only be called from stack component.
     * Stack will look after docking processing associated with maximise/minimise
     * @internal
     **/
    setMaximisedStack(stack: Stack | undefined): void {
        if (stack === undefined) {
            if (this._maximisedStack !== undefined) {
                this.processMinimiseMaximisedStack();
            }
        } else {
            if (stack !== this._maximisedStack) {
                if (this._maximisedStack !== undefined) {
                    this.processMinimiseMaximisedStack();
                }

                this.processMaximiseStack(stack);
            }
        }
    }

    checkMinimiseMaximisedStack(): void {
        if (this._maximisedStack !== undefined) {
            this._maximisedStack.minimise();
        }
    }

    // showAllActiveContentItems() was called from ContentItem.show().  Not sure what its purpose was so have commented out
    // Everything seems to work ok without this.  Have left commented code just in case there was a reason for it becomes
    // apparent

    // /** @internal */
    // showAllActiveContentItems(): void {
    //     const allStacks = this.getAllStacks();

    //     for (let i = 0; i < allStacks.length; i++) {
    //         const stack = allStacks[i];
    //         const activeContentItem = stack.getActiveComponentItem();

    //         if (activeContentItem !== undefined) {
    //             if (!(activeContentItem instanceof ComponentItem)) {
    //                 throw new AssertError('LMSAACIS22298');
    //             } else {
    //                 activeContentItem.container.show();
    //             }
    //         }
    //     }
    // }

    // hideAllActiveContentItems() was called from ContentItem.hide().  Not sure what its purpose was so have commented out
    // Everything seems to work ok without this.  Have left commented code just in case there was a reason for it becomes
    // apparent

    // /** @internal */
    // hideAllActiveContentItems(): void {
    //     const allStacks = this.getAllStacks();

    //     for (let i = 0; i < allStacks.length; i++) {
    //         const stack = allStacks[i];
    //         const activeContentItem = stack.getActiveComponentItem();

    //         if (activeContentItem !== undefined) {
    //             if (!(activeContentItem instanceof ComponentItem)) {
    //                 throw new AssertError('LMSAACIH22298');
    //             } else {
    //                 activeContentItem.container.hide();
    //             }
    //         }
    //     }
    // }

    /** @internal */
    private cleanupBeforeMaximisedStackDestroyed(event: EventEmitter.BubblingEvent) {
		if (this._maximisedStack !== null && this._maximisedStack === event.target) {
			this._maximisedStack.off('beforeItemDestroyed', this._maximisedStackBeforeDestroyedListener);
			this._maximisedStack = undefined;
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
        let matchingArea = null;
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
                matchingArea = area;
            }
        }

        return matchingArea;
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
        if (groundItem === undefined) {
            throw new UnexpectedUndefinedError('LMCIAR44365');
        } else {
            if (allContentItems.length === 1) {
                // No root ContentItem (just Ground ContentItem)
                const groundArea = groundItem.getElementArea();
                if (groundArea === null) {
                    throw new UnexpectedNullError('LMCIARA44365')
                } else {
                    this._itemAreas = [groundArea];
                }
                return;
            } else {
                if (groundItem.contentItems[0].isStack) {
                    // if root is Stack, then split stack and sides of Layout are same, so skip sides
                    this._itemAreas = [];
                } else {
                    // sides of layout
                    this._itemAreas = groundItem.createSideAreas();
                }

                for (let i = 0; i < allContentItems.length; i++) {
                    const stack = allContentItems[i];
                    if (ContentItem.isStack(stack)) {
                        const area = stack.getArea();

                        if (area === null) {
                            continue;
                        } else {
                            this._itemAreas.push(area);
                            const stackContentAreaDimensions = stack.contentAreaDimensions;
                            if (stackContentAreaDimensions === undefined) {
                                throw new UnexpectedUndefinedError('LMCIASC45599');
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

    /**
     * Called as part of loading a new layout (including initial init()).
     * Checks to see layout has a maximised item. If so, it maximises that item.
     * @internal
     */
    private checkLoadedLayoutMaximiseItem() {
        if (this._groundItem === undefined) {
            throw new UnexpectedUndefinedError('LMCLLMI43432');
        } else {
            const configMaximisedItems = this._groundItem.getConfigMaximisedItems();

            if (configMaximisedItems.length > 0) {
                let item = configMaximisedItems[0];
                if (ContentItem.isComponentItem(item)) {
                    const stack = item.parent;
                    if (stack === null) {
                        throw new UnexpectedNullError('LMXLLMI69999');
                    } else {
                        item = stack;
                    }
                }
                if (!ContentItem.isStack(item)) {
                    throw new AssertError('LMCLLMI19993');
                } else {
                    item.maximise();
                }
            }
        }
    }

    /** @internal */
    private processMaximiseStack(stack: Stack): void {
        this._maximisedStack = stack;
        stack.on('beforeItemDestroyed', this._maximisedStackBeforeDestroyedListener);
        stack.element.classList.add(DomConstants.ClassName.Maximised);
        stack.element.insertAdjacentElement('afterend', this._maximisePlaceholder);
        if (this._groundItem === undefined) {
            throw new UnexpectedUndefinedError('LMMXI19993');
        } else {
            this._groundItem.element.prepend(stack.element);
            const { width, height } = getElementWidthAndHeight(this._containerElement);
            setElementWidth(stack.element, width);
            setElementHeight(stack.element, height);
            stack.updateSize();
            stack.focusActiveContentItem();
            this._maximisedStack.emit('maximised');
            this.emit('stateChanged');
        }
    }

    /** @internal */
    private processMinimiseMaximisedStack(): void {
        if (this._maximisedStack === undefined) {
            throw new AssertError('LMMMS74422');
        } else {
            const stack = this._maximisedStack;
            if (stack.parent === null) {
                throw new UnexpectedNullError('LMMI13668');
            } else {
                stack.element.classList.remove(DomConstants.ClassName.Maximised);
                this._maximisePlaceholder.insertAdjacentElement('afterend', stack.element);
                this._maximisePlaceholder.remove();
                stack.parent.updateSize();
                this._maximisedStack = undefined;
                stack.off('beforeItemDestroyed', this._maximisedStackBeforeDestroyedListener);
                stack.emit('minimised');
                this.emit('stateChanged');
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
        if (this._groundItem === undefined) {
            throw new UnexpectedUndefinedError('LMGACI13130');
        } else {
            return this._groundItem.getAllContentItems();
        }
    }

    /**
     * Binds to DOM/BOM events on init
     * @internal
     */
    private bindEvents() {
        if (this._isFullPage) {
            globalThis.addEventListener('resize', this._windowResizeListener, { passive: true });
        }
        globalThis.addEventListener('unload', this._windowUnloadListener, { passive: true });
        globalThis.addEventListener('beforeunload', this._windowUnloadListener, { passive: true });
    }

    /**
     * Debounces resize events
     * @internal
     */
    private processResizeWithDebounce(): void {
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
        const containerElement = this._containerElement ?? bodyElement;

        if (containerElement === bodyElement) {
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

        this._containerElement = containerElement;
    }

    /**
     * Called when the window is closed or the user navigates away
     * from the page
     * @internal
     */
    private onUnload(): void {
        this.destroy();
    }

    /**
     * Adjusts the number of columns to be lower to fit the screen and still maintain minItemWidth.
     * @internal
     */
    private adjustColumnsResponsive() {
        if (this._groundItem === undefined) {
            throw new UnexpectedUndefinedError('LMACR20883');
        } else {
            this._firstLoad = false;
            // If there is no min width set, or not content items, do nothing.
            if (this.useResponsiveLayout() &&
                !this._updatingColumnsResponsive &&
                this._groundItem.contentItems.length > 0 &&
                this._groundItem.contentItems[0].isRow)
            {
                if (this._groundItem === undefined || this._width === null) {
                    throw new UnexpectedUndefinedError('LMACR77412');
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
        const alwaysResponsiveMode = settings.responsiveMode === ResponsiveMode.always;
        const onLoadResponsiveModeAndFirst = settings.responsiveMode === ResponsiveMode.onload && this._firstLoad;
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
                node.removeChild(item, true);
                container.addChild(item);
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
        if (this._groundItem === undefined) {
            throw new UnexpectedUndefinedError('LMFASC52778');
        } else {
            const stacks: Stack[] = [];
            this.findAllStacksRecursive(stacks, this._groundItem);

            return stacks;
        }
    }

    /** @internal */
    private findFirstContentItemType(type: ItemType): ContentItem | undefined {
        if (this._groundItem === undefined) {
            throw new UnexpectedUndefinedError('LMFFCIT82446');
        } else {
            return this.findFirstContentItemTypeRecursive(type, this._groundItem);
        }
    }

    /** @internal */
    private findFirstContentItemTypeRecursive(type: ItemType, node: ContentItem): ContentItem | undefined {
        const contentItems = node.contentItems;
        const contentItemCount = contentItems.length;
        if (contentItemCount === 0) {
            return undefined;
        } else {
            for (let i = 0; i < contentItemCount; i++) {
                const contentItem = contentItems[i];
                if (contentItem.type === type) {
                    return contentItem;
                }
            }

            for (let i = 0; i < contentItemCount; i++) {
                const contentItem = contentItems[i];
                const foundContentItem = this.findFirstContentItemTypeRecursive(type, contentItem);
                if (foundContentItem !== undefined) {
                    return foundContentItem;
                }
            }

            return undefined;
        }
    }

    /** @internal */
    private findFirstContentItemTypeByIdRecursive(type: ItemType, id: string, node: ContentItem): ContentItem | undefined {
        const contentItems = node.contentItems;
        const contentItemCount = contentItems.length;
        if (contentItemCount === 0) {
            return undefined;
        } else {
            for (let i = 0; i < contentItemCount; i++) {
                const contentItem = contentItems[i];
                if (contentItem.type === type && contentItem.id === id) {
                    return contentItem;
                }
            }

            for (let i = 0; i < contentItemCount; i++) {
                const contentItem = contentItems[i];
                const foundContentItem = this.findFirstContentItemTypeByIdRecursive(type, id, contentItem);
                if (foundContentItem !== undefined) {
                    return foundContentItem;
                }
            }

            return undefined;
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

    /** @internal */
    private findFirstLocation(selectors: readonly LayoutManager.LocationSelector[]): LayoutManager.Location | undefined {
        const count = selectors.length;
        for (let i = 0; i < count; i++) {
            const selector = selectors[i];
            const location = this.findLocation(selector);
            if (location !== undefined) {
                return location;
            }
        }
        return undefined;
    }

    /** @internal */
    private findLocation(selector: LayoutManager.LocationSelector): LayoutManager.Location | undefined {
        const selectorIndex = selector.index;
        switch (selector.typeId) {
            case LayoutManager.LocationSelector.TypeId.FocusedItem: {
                if (this._focusedComponentItem === undefined) {
                    return undefined
                } else {
                    const parentItem = this._focusedComponentItem.parentItem;
                    const parentContentItems = parentItem.contentItems;
                    const parentContentItemCount = parentContentItems.length;
                    if (selectorIndex === undefined) {
                        return { parentItem, index: parentContentItemCount };
                    } else {
                        const focusedIndex = parentContentItems.indexOf(this._focusedComponentItem);
                        const index = focusedIndex + selectorIndex;
                        if (index < 0 || index > parentContentItemCount) {
                            return undefined;
                        } else {
                            return { parentItem, index };
                        }
                    }
                }
            }
            case LayoutManager.LocationSelector.TypeId.FocusedStack: {
                if (this._focusedComponentItem === undefined) {
                    return undefined
                } else {
                    const parentItem = this._focusedComponentItem.parentItem;
                    return this.tryCreateLocationFromParentItem(parentItem, selectorIndex);
                }
            }
            case LayoutManager.LocationSelector.TypeId.FirstStack: {
                const parentItem = this.findFirstContentItemType(ItemType.stack);
                if (parentItem === undefined) {
                    return undefined;
                } else {
                    return this.tryCreateLocationFromParentItem(parentItem, selectorIndex);
                }
            }
            case LayoutManager.LocationSelector.TypeId.FirstRowOrColumn: {
                let parentItem = this.findFirstContentItemType(ItemType.row);
                if (parentItem !== undefined) {
                    return this.tryCreateLocationFromParentItem(parentItem, selectorIndex);
                } else {
                    parentItem = this.findFirstContentItemType(ItemType.column);
                    if (parentItem !== undefined) {
                        return this.tryCreateLocationFromParentItem(parentItem, selectorIndex);
                    } else {
                        return undefined;
                    }
                }
            }
            case LayoutManager.LocationSelector.TypeId.FirstRow: {
                const parentItem = this.findFirstContentItemType(ItemType.row);
                if (parentItem === undefined) {
                    return undefined;
                } else {
                    return this.tryCreateLocationFromParentItem(parentItem, selectorIndex);
                }
            }
            case LayoutManager.LocationSelector.TypeId.FirstColumn: {
                const parentItem = this.findFirstContentItemType(ItemType.column);
                if (parentItem === undefined) {
                    return undefined;
                } else {
                    return this.tryCreateLocationFromParentItem(parentItem, selectorIndex);
                }
            }
            case LayoutManager.LocationSelector.TypeId.Empty: {
                if (this._groundItem === undefined) {
                    throw new UnexpectedUndefinedError('LMFLRIF18244');
                } else {
                    if (this.rootItem !== undefined) {
                        return undefined;
                    } else {
                        if (selectorIndex === undefined || selectorIndex === 0)
                            return { parentItem: this._groundItem, index: 0 };
                        else {
                            return undefined;
                        }
                    }
                }
            }
            case LayoutManager.LocationSelector.TypeId.Root: {
                if (this._groundItem === undefined) {
                    throw new UnexpectedUndefinedError('LMFLF18244');
                } else {
                    const groundContentItems = this._groundItem.contentItems;
                    if (groundContentItems.length === 0) {
                        if (selectorIndex === undefined || selectorIndex === 0)
                            return { parentItem: this._groundItem, index: 0 };
                        else {
                            return undefined;
                        }
                    } else {
                        const parentItem = groundContentItems[0];
                        return this.tryCreateLocationFromParentItem(parentItem, selectorIndex);
                    }
                }
            }
        }
    }

    /** @internal */
    private tryCreateLocationFromParentItem(parentItem: ContentItem,
        selectorIndex: number | undefined
    ): LayoutManager.Location | undefined {
        const parentContentItems = parentItem.contentItems;
        const parentContentItemCount = parentContentItems.length;
        if (selectorIndex === undefined) {
            return { parentItem, index: parentContentItemCount };
        } else {
            if (selectorIndex < 0 || selectorIndex > parentContentItemCount) {
                return undefined;
            } else {
                return { parentItem, index: selectorIndex };
            }
        }
    }
}

/** @public */
export namespace LayoutManager {
    export type BeforeVirtualRectingEvent = (this: void, count: number) => void;
    export type AfterVirtualRectingEvent = (this: void) => void;

    /** @internal */
    export interface ConstructorParameters {
        layoutConfig: ResolvedLayoutConfig | undefined;
        isSubWindow: boolean;
        containerElement: HTMLElement | undefined;
    }

    /** @internal */
    export function createMaximisePlaceElement(document: Document): HTMLElement {
        const element = document.createElement('div');
        element.classList.add(DomConstants.ClassName.MaximisePlace);
        return element;
    }

    /** @internal */
    export function createTabDropPlaceholderElement(document: Document): HTMLElement {
        const element = document.createElement('div');
        element.classList.add(DomConstants.ClassName.DropTabPlaceholder);
        return element;
    }

    /**
     * Specifies a location of a ContentItem without referencing the content item.
     * Used to specify where a new item is to be added
     * @public
     */
    export interface Location {
        parentItem: ContentItem;
        index: number;
    }

    /**
     * A selector used to specify a unique location in the layout
     * @public
     */
    export interface LocationSelector {
        /** Specifies selector algorithm */
        typeId: LocationSelector.TypeId;
        /** Used by algorithm to determine index in found ContentItem */
        index?: number;
    }

    /** @public */
    export namespace LocationSelector {
        export const enum TypeId {
            /** Stack with focused Item. Index specifies offset from index of focused item (eg 1 is the position after focused item) */
            FocusedItem,
            /** Stack with focused Item. Index specfies ContentItems index */
            FocusedStack,
            /** First stack found in layout */
            FirstStack,
            /** First Row or Column found in layout (rows are searched first) */
            FirstRowOrColumn,
            /** First Row in layout */
            FirstRow,
            /** First Column in layout */
            FirstColumn,
            /** Finds a location if layout is empty. The found location will be the root ContentItem. */
            Empty,
            /** Finds root if layout is empty, otherwise a child under root */
            Root,
        }
    }

    /**
     * Default LocationSelectors array used if none is specified.  Will always find a location.
     * @public
     */
    export const defaultLocationSelectors: readonly LocationSelector[] = [
        { typeId: LocationSelector.TypeId.FocusedStack, index: undefined },
        { typeId: LocationSelector.TypeId.FirstStack, index: undefined },
        { typeId: LocationSelector.TypeId.FirstRowOrColumn, index: undefined },
        { typeId: LocationSelector.TypeId.Root, index: undefined },
    ];

    /**
     * LocationSelectors to try to get location next to existing focused item
     * @public
     */
    export const afterFocusedItemIfPossibleLocationSelectors: readonly LocationSelector[] = [
        { typeId: LocationSelector.TypeId.FocusedItem, index: 1 },
        { typeId: LocationSelector.TypeId.FirstStack, index: undefined },
        { typeId: LocationSelector.TypeId.FirstRowOrColumn, index: undefined },
        { typeId: LocationSelector.TypeId.Root, index: undefined },
    ];
}
