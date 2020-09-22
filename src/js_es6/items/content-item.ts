export interface ContentItem extends EventEmitter {
    _header: any;
    _docker: any;
    /**
     * This items configuration in its current state
     */
    config: ItemConfigType;

    /**
     * The type of the item. Can be row, column, stack, component or root
     */
    type: string;

    /**
     * An array of items that are children of this item
     */
    contentItems: ContentItem[];

    container: Container;
    /**
     * The item that is this item's parent (or null if the item is root)
     */
    parent: ContentItem;

    /**
     * A String or array of identifiers if provided in the configuration
     */
    id: string;

    /**
     * True if the item had been initialised
     */
    isInitialised: boolean;

    /**
     * True if the item is maximised
     */
    isMaximised: boolean;

    /**
     * True if the item is the layout's root item
     */
    isRoot: boolean;

    /**
     * True if the item is a row
     */
    isRow: boolean;

    /**
     * True if the item is a column
     */
    isColumn: boolean;

    /**
     * True if the item is a stack
     */
    isStack: boolean;

    /**
     * True if the item is a component
     */
    isComponent: boolean;

    /**
     * A reference to the layoutManager that controls this item
     */
    layoutManager: any;

    /**
     * The item's outer element
     */
    element: Container;

    /**
     * The item's inner element. Can be the same as the outer element.
     */
    childElementContainer: Container;

    /**
     * Adds an item as a child to this item. If the item is already a part of a layout it will be removed
     * from its original position before adding it to this item.
     * @param itemOrItemConfig A content item (or tree of content items) or an ItemConfiguration to create the item from
     * @param index last index  An optional index that determines at which position the new item should be added. Default: last index.
     */
    addChild(itemOrItemConfig: ContentItem | ItemConfigType, index?: number): void;

    /**
     * Destroys the item and all it's children
     * @param contentItem The contentItem that should be removed
     * @param keepChild If true the item won't be destroyed. (Use cautiosly, if the item isn't destroyed it's up to you to destroy it later). Default: false.
     */
    removeChild(contentItem: ContentItem, keepChild?: boolean): void;

    /**
     * The contentItem that should be removed
     * @param oldChild    ContentItem The contentItem that should be removed
     * @param newChild A content item (or tree of content items) or an ItemConfiguration to create the item from
     */
    replaceChild(oldChild: ContentItem, newChild: ContentItem | ItemConfigType): void;

    /**
     * Updates the items size. To actually assign a new size from within a component, use container.setSize( width, height )
     */
    setSize(): void;

    /**
     * Sets the item's title to the provided value. Triggers titleChanged and stateChanged events
     * @param title the new title
     */
    setTitle(title: string): void;

    /**
     * A powerful, yet admittedly confusing method to recursively call methods on items in a tree. Usually you wouldn't need
     * to use it directly, but it's used internally to setSizes, destroy parts of the item tree etc.
     * @param functionName The name of the method to invoke
     * @param functionArguments An array of arguments to pass to every function
     * @param bottomUp If true, the method is invoked on the lowest parts of the tree first and then bubbles upwards. Default: false
     * @param skipSelf If true, the method will only be invoked on the item's children, but not on the item itself. Default: false
     */
    callDownwards(functionName: string, functionArguments?: any[], bottomUp?: boolean, skipSelf?: boolean): void;

    /**
     * Emits an event that bubbles up the item tree until it reaches the root element (and after a delay the layout manager). Useful e.g. for indicating state changes.
     */
    emitBubblingEvent(name: string): void;

    /**
     * Convenience method for item.parent.removeChild( item )
     */
    remove(): void;

    /**
     * Removes the item from its current position in the layout and opens it in a window
     */
    popout(): BrowserWindow;

    /**
     * Maximises the item or minimises it if it's already maximised
     */
    toggleMaximise(): void;

    /**
     * Selects the item. Only relevant if settings.selectionEnabled is set to true
     */
    select(): void;

    /**
     * Unselects the item. Only relevant if settings.selectionEnabled is set to true
     */
    deselect(): void;

    /**
     * Returns true if the item has the specified id or false if not
     * @param id An id to check for
     */
    hasId(id: string): boolean;

    /**
     * Only Stacks have this method! It's the programmatical equivalent of clicking a tab.
     * @param contentItem The new active content item
     */
    setActiveContentItem(contentItem: ContentItem): void;

    /**
     * Only Stacks have this method! Returns the currently selected contentItem.
     */
    getActiveContentItem(): ContentItem;

    /**
     * Adds an id to an item or does nothing if the id is already present
     * @param id The id to be added
     */
    addId(id: string): void;

    /**
     * Removes an id from an item or throws an error if the id couldn't be found
     * @param id The id to be removed
     */
    removeId(id: string): void;

    /**
     * Calls filterFunction recursively for every item in the tree. If the function returns true the item is added to the resulting array
     * @param filterFunction A function that determines whether an item matches certain criteria
     */
    getItemsByFilter(filterFunction: (contentItem: ContentItem) => boolean): ContentItem[];

    /**
     * Returns all items with the specified id.
     * @param id An id specified in the itemConfig
     */
    getItemsById(id: string | string[]): ContentItem[];

    /**
     * Returns all items with the specified type
     * @param type 'row', 'column', 'stack', 'component' or 'root'
     */
    getItemsByType(type: string): ContentItem[];

    /**
     * Returns all instances of the component with the specified componentName
     * @param componentName a componentName as specified in the itemConfig
     */
    getComponentsByName(componentName: string): any;

}
