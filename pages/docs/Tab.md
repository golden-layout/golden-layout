Properties
------------------------------
### isActive
True if this tab is the selected tab

### header
A reference to the header this tab is a child of

### contentIten
A reference to the content item this tab relates to

### element
The tabs outer (jQuery) DOM element

### titleElement
The (jQuery) DOM element containing the title

### isActive
The (jQuery) DOM element that closes the tab


setTitle( title )
-----------------------------
argument: title
type: String
optional: false
desc: The new title

Sets the tab's title. Does not affect the contentItem's title!

setActive( isActive )
-----------------------------
argument: isActive
type: Boolean
optional: false
desc: Whether the tab is active

Sets this tab's active state. To programmatically switch tabs, use header.setActiveContentItem( item ) instead.

</div>