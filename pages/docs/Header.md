Properties
------------------------------
### layoutManager
A reference to the LayoutManager instance

### parent
A reference to the Stack this Header belongs to

### tabs
An array of the Tabs within this header

### activeContentItem
The currently selected activeContentItem

### element
The outer (jQuery) DOM element of this Header

### tabsContainer
The (jQuery) DOM element containing the tabs

### controlsContainer
The (jQuery) DOM element containing the close, maximise and popout button

setActiveContentItem( contentItem )
-----------------------------------
argument: contentItem
type: ContentItem
optional: false
desc: The content item that will be selected

Hides the currently selected contentItem, shows the specified one and highlights
its tab.

createTab( contentItem, index )
-----------------------------------
argument: contentItem
type: ContentItem
optional: false
desc: The content item the tab will be associated with

argument: index
type: Number
optional: false
desc: A zero based index, specifying the position of the new tab

Creates a new tab and associates it with a content item

removeTab( contentItem )
-----------------------------------
argument: contentItem
type: ContentItem
optional: false
desc: The content item the tab is associated with

Finds a tab by its contentItem and removes it

</div>