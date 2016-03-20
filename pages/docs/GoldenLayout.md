Properties
--------------------------------------------
### root
The topmost item in the layout item tree. In browser terms: Think of the GoldenLayout instance as
window object and of goldenLayout.root as the document.

### container
A reference to the (jQuery) DOM element containing the layout

### isInitialised
True once the layout item tree has been created and the `initialised` event has been fired.

### config
A reference to the current, extended top level config.
<div class="info">Don't rely on this object for state saving / serialisation. Use layout.toConfig() instead.</div>

### selectedItem
The currently selected item or null if no item is selected. Only relevant if `settings.selectionEnabled` is set to true.

### width
The current outer width of the layout in pixels

### height
The current outer height of the layout in pixels

### openPopouts
An array of [BrowserWindow](BrowserWindow.html) instances

### isSubWindow
True if the layout has been opened as a popout by another layout

### eventHub
A singleton instance of [EventEmitter](EventEmitter.html) that works across windows

Events
--------------------------------------------
### initialised
Fired after `layout.init()` has been called and the layout tree has been created.

### stateChanged
Fired whenever something happens that updates the state of the layout (as returned by `layout.toConfig`)

### windowOpened <window>
Fired when a new popout window was opened.

### windowClosed <window>
Fired when a previously created popout window was closed.

### selectionChanged <item>
Fired when the user selects a new / different item. Only relevant if `settings.selectionEnabled` is true.

### itemDestroyed <item>
Fired whenever an item gets destroyed.

### itemCreated <item>
Fired whenever an item is created.

### componentCreated <component>
Fired whenever a component is created.

### rowCreated <row>
Fired whenever a row is created.

### columnCreated <column>
Fired whenever a column is created.

### stackCreated <stack>
Fired whenever a stack is created.

### tabCreated <tab>
Fired whenever a tab is created.

GoldenLayout( configuration, container )
------------------------------------------------
argument: configuration
type: configuration
optional: false
desc:A GoldenLayout configuration object

argument: container
type: DOM | jQuery element
optional: true
default: document.body
desc: The DOM element the layout will be initialised in

Constructs a new layout. The simplest use case would look something like this
	
	myLayout = new GoldenLayout({
		content:[{ 
			type: 'component', 
			componentName: 'sayHi',
			componentState: { name: 'Wolfram' }
		}]
	});
	myLayout.registerComponent( 'sayHi',  function( container, state ){
		container.getElement().text( 'Hi ' + state.name ); 
	});
	myLayout.init();

registerComponent( name, component )
--------------------------------------------
argument: name
type: String
optional: false
desc: The name of the component, as referred to by componentName in the component configuration.

argument: component
type: Constructor | Function
optional: false
desc: A constructor or factory function. Will be invoked with new and two arguments, a container object and a component state.

Registers either a component constructor or a component factory function with GoldenLayout. 
`registerComponent` is the counterpart to the componentName and componentState config keys in <a href="{link 'apidocs/Config'}">the item config</a>.

Here's how it hangs together:

	// Write your StockChart component constructor
	StockChartComponent = function( container, state ) {
		//container will be an instance of {link 'apidocs/Container'}
	};

	// Register it with your GoldenLayout instance
	myLayout.registerComponent( 'StockChart', StockChartComponent );

	//Tell GoldenLayout where to create an instance of the component in
	//your config
	{
		componentName: 'StockChart',
		componentState: { stocks: [ 'APPL', 'GOOG' ] }
	}

Alternatively you can provide a factory function.

	myLayout.registerComponent( 'StockChart', function( container, state ){
		//For instance if you're using the same chart component and just pass
		//the type as an argument
		return new GenericChart( 'stock', state );
	});

init()
------------------------------------------------
Renders the layout into the container. If init() is called before the
document is ready it attaches itself as a listener to the document and executes once it becomes ready. 

toConfig()
--------------------------------------------
Returns the current state of the layout and its components as a serialisable object.

getComponent( name )
------------------------------------------------
argument: name
type: String
optional: false
desc: The name of a previously registered component

Returns a component that was previously registered with `layout.registerComponent()`. 

updateSize(width, height)
------------------------------------------------
argument: width
type: Integer
optional: true
default: The container elements width
desc: The outer width the layout should be resized to

argument: height
type: Integer
optional: true
default: The container elements height
desc: The outer height the layout should be resized to

Resizes the layout. If no arguments are provided GoldenLayout measures its container
and resizes accordingly.

destroy()
------------------------------------------------
Destroys the layout. Recursively calls destroy on all components and content items,
removes all event listeners and finally removes itself from the DOM.

createContentItem( itemConfiguration, parent )
------------------------------------------------
argument: itemConfiguration
type: Object
optional: false
desc: An item configuration (can be an entire tree of items)

argument: parent
type: Item
optional: true
desc: A parent item

Creates a new content item or tree of content items from configuration. Usually you wouldn't call this directly, but instead use methods like `layout.createDragSource()`, `item.addChild()` or `item.replaceChild()` that all call this method implicitly.


createPopout( configOrContentItem, dimensions, parentId, indexInParent )
------------------------------------------------
argument: configOrContentItem
type: GoldenLayout config or contentItem
optional: false
desc: The content item or config that will be created in the new window. If a item is provided its config will be read, if config is provided, only the content key will be used

argument: dimensions
type: Object
optional: false
desc: A map containing the keys left, top, width and height. Left and top can be negative to place the window in another screen.

argument: parentId
type: String
optional: true
default: null
desc: The id of the item within the current layout the child window's content will be appended to when popIn is clicked

argument: indexInParent
type: Number
optional: true
default: null
desc: The index at which the child window's contents will be appended to

Creates a new popout window with configOrContentItem as contents at the position specified in dimensions

	/*
	 * Open a popout with testComponent as content.
	 * Since parentId and indexInParent aren't specified
	 * the component will be appended to the topmost
	 * layout element if popIn() is called
	 */
	myLayout.createPopout({
		componentName: 'testComponent', 
		type: 'component'
	}, {
		width: 200, 
		height: 300, 
		left: 400, 
		top: 100
	});


createDragSource( element, itemConfiguration )
------------------------------------------------
argument: element
type: DOM or jQuery element
optional: false
desc: The DOM element that will be turned into a dragSource

argument: itemConfiguration
type: Object
optional: false
desc: An item configuration (can be an entire tree of items)

Turns a DOM element into a dragSource, meaning that the user can drag the element directly onto the layout where it turns into a contentItem.

selectItem( contentItem )
------------------------------------------------
argument: contentItem
type: Object
optional: false
desc: A ContentItem instance

If `settings.selectionEnabled` is set to true, this allows to select items programmatically.

GoldenLayout.minifyConfig( config )
--------------------------------------------
argument: config
type: Object
optional: false
desc: A GoldenLayout configuration object

Static method on the GoldenLayout constructor! This method will iterate through a GoldenLayout config object and replace frequent keys and values with single letter substitutes.

GoldenLayout.unminifyConfig( minifiedConfig )
--------------------------------------------
argument: config
type: Object
optional: false
desc: A minified GoldenLayout configuration object

Static method on the GoldenLayout constructor! This method will reverse the minifications of GoldenLayout.minifyConfig.

</div>
