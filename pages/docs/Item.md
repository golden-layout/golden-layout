Properties
---------------------------------
### config
This items configuration in its current state

### type
The type of the item. Can be `row`, `column`, `stack`, `component` or `root`

### contentItems
An array of items that are children of this item

### parent
The item that is this item's parent (or null if the item is root)

### id
A String or array of identifiers if provided in the configuration

### isInitialised
True if the item had been initialised

### isMaximised
True if the item is maximised

### isRoot
True if the item is the layout's root item

### isRow
True if the item is a row

### isColumn
True if the item is a column

### isStack
True if the item is a stack

### isComponent
True if the item is a component

### layoutManager
A reference to the layoutManager that controls this item

### element
The item's outer element

### childElementContainer
The item's inner element. Can be the same as the outer element.

Events
-------------------------------
### stateChanged
Fired whenever something happened to this item or its children that changes the state of the layout (as returned by `layout.toConfig`)

### titleChanged
Updated whenever the item's title changes as a result of calling `setTitle()` on either the item or from a container

### activeContentItemChanged <contentItem>
Fired whenever a different item is selected from a Stack

### itemDestroyed <Bubbling Event>
Fired whenever this item or one of its children gets destroyed

### itemCreated <Bubbling Event>
Fired whenever an item gets created as child of this item

### componentCreated <Bubbling Event>
Fired whenever a component gets created as child of this item

### rowCreated <Bubbling Event>
Fired whenever a row gets created as child of this item

### columnCreated <Bubbling Event>
Fired whenever a column gets created as child of this item

### stackCreated <Bubbling Event>
Fired whenever a stack gets created as child of this item



addChild( itemOrItemConfig, index )
-----------------------------------
argument: itemOrItemConfig
type: ContentItem or Configuration
optional: false
desc: A content item (or tree of content items) or an ItemConfiguration to create the item from

argument: index
type: Number
optional: true
default: last index
desc: An optional index that determines at which position the new item should be added.

Adds an item as a child to this item. If the item is already a part of a layout it will be removed from
its original position before adding it to this item.

removeChild( contentItem, keepChild )
-----------------------------------
argument: contentItem
type: ContentItem
optional: false
desc: The contentItem that should be removed

argument: keepChild
type: Boolean
optional: true
default: false
desc: If true the item won't be destroyed. (Use cautiosly, if the item isn't destroyed it's up to you to destroy it later)

Destroys the item and all it's children.

replaceChild( oldChild, newChild )
-----------------------------------
argument: oldChild
type: ContentItem
optional: false
desc: The contentItem that should be removed

argument: newChild
type: ContentItem or Configuration
optional: false
desc: A content item (or tree of content items) or an ItemConfiguration to create the item from

Replaces oldChild with newChild

setSize()
-----------------------------------
Updates the items size. To actually assign a new size from within a component, use `container.setSize( width, height )`

setTitle( title )
-----------------------------------
argument: title
type: String
optional: false
desc: the new title

Sets the item's title to the provided value. Triggers `titleChanged` and `stateChanged` events

callDownwards(functionName, functionArguments, bottomUp, skipSelf)
-----------------------------------
argument: functionName
type: String
optional: false
desc: The name of the method to invoke

argument: functionArguments
type: Array
optional: true
desc: An array of arguments to pass to every function

argument: bottomUp
type: Boolean
optional: true
default: false
desc: If true, the method is invoked on the lowest parts of the tree first and then bubbles upwards

argument: skipSelf
type: Boolean
optional: true
default: false
desc: If true, the method will only be invoked on the item's children, but not on the item itself

A powerful, yet admittedly confusing method to recursively call methods on items in a tree. Usually you wouldn't need to use it directly, but it's used internally to setSizes, destroy parts of the item tree etc.

emitBubblingEvent( name )
-----------------------------------
argument: title
type: String
optional: false
desc: the name of the event

Emits an event that bubbles up the item tree until it reaches the root element (and after a delay the layout manager). Useful e.g. for indicating state changes.

remove()
-----------------------------------
Convenience method for `item.parent.removeChild( item )`

popout()
-----------------------------------
Removes the item from its current position in the layout and opens it in a window

toggleMaximise()
-----------------------------------
Maximises the item or minimises it if it's already maximised

select()
-----------------------------------
Selects the item. Only relevant if `settings.selectionEnabled` is set to true

deselect()
-----------------------------------
Unselects the item. Only relevant if `settings.selectionEnabled` is set to true

hasId(id)
-----------------------------------
argument: id
type: String
optional: false
desc: An id to check for

Returns true if the item has the specified id or false if not

setActiveContentItem( contentItem )
-----------------------------------
argument: contentItem
type: GoldenLayout item
optional: false
desc: The new active content item

Only Stacks have this method! It's the programmatical equivalent of clicking a tab.

getActiveContentItem()
-----------------------------------
Only Stacks have this method! Returns the currently selected contentItem.

addId(id)
-----------------------------------
argument: id
type: String
optional: false
desc: The id to be added

Adds an id to an item or does nothing if the id is already present

removeId(id)
-----------------------------------
argument: id
type: String
optional: false
desc: The id to be removed

Removes an id from an item or throws an error if the id couldn't be found

getItemsByFilter(filterFunction)
-----------------------------------
argument: filterFunction
type: Function
optional: false
desc: A function that determines whether an item matches certain criteria

Calls filterFunction recursively for every item in the tree. If the function returns true the item
is added to the resulting array

getItemsById( id )
-----------------------------------
argument: id
type: String
optional: false
desc: An id specified in the itemConfig

Returns all items with the specified id.


getItemsByType( type )
-----------------------------------
argument: type
type: String
optional: false
desc: 'row', 'column', 'stack', 'component' or 'root'

Returns all items with the specified type

getComponentsByName( componentName )
-----------------------------------
argument: type
type: String
optional: false
desc: a componentName as specified in the itemConfig

Returns all instances of the component with the specified componentName

</div>