Layout Configuration
===========================================
	var layout = new GoldenLayout({
		settings:{
			hasHeaders: true,
			constrainDragToContainer: true,
			reorderEnabled: true,
			selectionEnabled: false,
			popoutWholeStack: false,
			blockedPopoutsThrowError: true,
			closePopoutsOnUnload: true,
			showPopoutIcon: true,
			showMaximiseIcon: true,
			showCloseIcon: true
		},
		dimensions: {
			borderWidth: 5,
			minItemHeight: 10,
			minItemWidth: 10,
			headerHeight: 20,
			dragProxyWidth: 300,
			dragProxyHeight: 200
		},
		labels: {
			close: 'close',
			maximise: 'maximise',
			minimise: 'minimise',
			popout: 'open in new window'
		},
		content: [ /* see item config */ ]
	});

settings
-------------------------------------
argument: hasHeaders
type: Boolean
optional: true
default: true
desc: Turns headers on or off. If false, the layout will be displayed with splitters only.

argument: constrainDragToContainer
type: Boolean
optional: true
default: true
desc: Constrains the area in which items can be dragged to the layout's container. Will be set to false automatically when `layout.createDragSource()` is called.

argument: reorderEnabled
type: Boolean
optional: true
default: true
desc: If true, the user can re-arrange the layout by dragging items by their tabs to the desired location.

argument: selectionEnabled
type: Boolean
optional: true
default: false
desc: If true, the user can select items by clicking on their header. This sets the value of layout.selectedItem to the clicked item, highlights its header and the layout emits a 'selectionChanged' event.

argument: popoutWholeStack
type: Boolean
optional: true
default: false
desc: Decides what will be opened in a new window if the user clicks the popout icon. If true the entire stack will be transferred to the new window, if false only the active component will be opened.

argument: blockedPopoutsThrowError
type: Boolean
optional: true
default: true
desc: Specifies if an error is thrown when a popout is blocked by the browser (e.g. by opening it programmatically). If false, the popout call will fail silently.

argument: closePopoutsOnUnload
type: Boolean
optional: true
default: true
desc: Specifies if all popouts should be closed when the page that created them is closed. Popouts don't have a strong dependency on their parent and can exist on their own, but can be quite annoying to close by hand. In addition, any changes made to popouts won't be stored after the parent is closed.

argument: showPopoutIcon
type: Boolean
optional: true
default: true
desc: Specifies if the popout icon should be displayed in the header-bar.

argument: showMaximiseIcon
type: Boolean
optional: true
default: true
desc: Specifies if the maximise icon should be displayed in the header-bar.

argument: showCloseIcon
type: Boolean
optional: true
default: true
desc: Specifies if the close icon should be displayed in the header-bar.

&nbsp;


dimensions
-------------------------------------
argument: borderWidth
type: Number
optional: true
default: 5
desc: The width of the borders between the layout items in pixel. Please note: The actual draggable area is wider than the visible one, making it safe to set this to small values without affecting usability.

argument: minItemHeight
type: Number
optional: true
default: 10
desc: The minimum height an item can be resized to (in pixel).

argument: minItemWidth
type: Number
optional: true
default: 10
desc: The minimum width an item can be resized to (in pixel).

argument: headerHeight
type: Number
optional: Number
default: 20
desc: The height of the header elements in pixel. This can be changed, but your theme's header css needs to be adjusted accordingly.

argument: dragProxyWidth
type: Number
optional: true
default: 300
desc: The width of the element that appears when an item is dragged (in pixel).

argument: dragProxyHeight
type: Number
optional: true
default: 200
desc: The height of the element that appears when an item is dragged (in pixel).

&nbsp;

labels
-------------------------------------
argument: close
type: String
optional: true
default: 'close'
desc: The tooltip text that appears when hovering over the close icon.

argument: maximise
type: String
optional: true
default: 'maximise'
desc: The tooltip text that appears when hovering over the maximise icon.

argument: minimise
type: String
optional: true
default: 'minimise'
desc: The tooltip text that appears when hovering over the minimise icon.

argument: popout
type: String
optional: true
default: 'open in new window'
desc: The tooltip text that appears when hovering over the popout icon.

</div>
