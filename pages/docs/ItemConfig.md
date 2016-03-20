Item Configuration
===========================================
	var layout = new GoldenLayout({
		content: [{
			type: 'component',
			content: [],
			componentName: 'someName',
			componentState: { some: 'value' },
			id: 'some id',
			width: 30,
			height: 30,
			isClosable: true,
			title: 'some title',
			activeItemIndex: 1
		}]
	});

&nbsp;

General
-------------------------------------------
argument: type
type: String
optional: false
desc: The type of the item. Possible values are 'row', 'column', 'stack' and 'component'

argument: content
type: Array
optional: true
desc: An array of configurations for items that will be created as children of this item

argument: width
type: Number
optional: true
desc: The width of this item, relative to the other children of its parent in percent

argument: height
type: Number
optional: true
desc: The height of this item, relative to the other children of its parent in percent

argument: id
type: Mixed
optional: true
desc: A String or an Array of Strings. Used to retrieve the item using item.getItemsById()

argument: isClosable
type: Boolean
optional: true
default: true
desc: Determines if the item is closable. If false, the x on the items tab will be hidden and container.close() will return false

argument: title
type: String
optional: true
default: componentName or ''
desc: The title of the item as displayed on its tab and on popout windows

&nbsp;

Component Specific
-------------------------------------------
argument: componentName
type: String
optional: false
desc: The name of the component as specified in layout.registerComponent. Mandatory if type is 'component'

argument: componentState
type: Object
optional: true
desc: A serialisable object. Will be passed to the component constructor function and will be the value returned by container.getState().

&nbsp;

Stack Specific
-------------------------------------------
argument: activeItemIndex
type: Number
optional: true
default: 0
desc: The index of the initially selected tab



</div>
