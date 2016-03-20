Properties
------------------------------
### width
The current width of the container in pixel

### height
The current height of the container in pixel

### parent
A reference to the component-item that controls this container

### tab
A reference to the tab that controls this container. Will initially be null (and populated once a tab event has been fired).

### title
The current title of the container

### layoutManager
A reference to the GoldenLayout instance this container belongs to

### isHidden
True if the item is currently hidden

Events
-----------------------------
### open
Emitted after the item has been sized and added to the DOM. Useful if you're working with an UI library that measures its container on startup.

### resize
Emitted after the container has been resized

### destroy
Emitted before the container will be destroyed. This will happen when the user clicks close as well as when a higher up part of the tree is destroyed.

### close
Emitted when the container is closed. Closing the container will also call destroy. To clarify: Only subscribe to this event if you want to do something specific when the user clicks close, otherwise always subscribe to destroy

### tab
Emitted when a tab for this container is created. Can be called more than once (e.g. when a new tab is created as result of dragging the item to a different position).

### hide
Emitted before the container is hidden

### show
Emitted before the container is shown

getElement()
-----------------------------
Returns the container's inner element as a jQuery element

setState( state )
-----------------------------
argument: state
type: Object
optional: false
desc: A serialisable object

Overwrites the components state with the provided value. To only change parts of the componentState see `extendState` below. 
This is the main mechanism for saving the state of a component. This state will be the value of `componentState`
when `layout.toConfig()` is called and will be passed back to the component's constructor function.
It will also be used when the component is opened in a new window.

extendState( state )
-----------------------------
argument: state
type: Object
optional: false
desc: A serialisable object

This is similar to `setState`, but merges the provided state into the current one, rather than overwriting it.

	var state = container.getState();
	// state is { firstname: 'Ray', lastname: 'Stantz' }

	container.extendState({ firstname: 'Egon' });
	// state is { firstname: 'Egon', lastname: 'Stantz' }

	container.setState({ firstname: 'Egon' });
	// state is { firstname: 'Egon' }

getState()
-----------------------------
Returns the current state.

hide()
-----------------------------
hides the container or returns false if hiding it is not possible

show()
-----------------------------
shows the container or returns false if showing it is not possible

setSize( width, height )
-----------------------------
argument: width
type: Number
optional: false
desc: the new width in pixel

argument: height
type: Number
optional: false
desc: the new height in pixel

Sets the container to the specified size or returns false if that's not possible

setTitle( title )
-----------------------------------
argument: title
type: String
optional: false
desc: the new title

Sets the item's title to the provided value. Triggers `titleChanged` and `stateChanged` events

close()
-----------------------------
Closes the container or returns false if that is not possible

</div>