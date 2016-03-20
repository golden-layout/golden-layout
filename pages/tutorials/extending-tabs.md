Extending Tabs
======================================
GoldenLayout makes it easy to add new functionality to pretty much everything - and tabs are no exception. This tutorial shows how to add a simple counter to a tab, for instance to show new messages.

Here’s what we’re after:

<p data-height="268" data-theme-id="7376" data-slug-hash="9cb7e16c6e3a5ad427297cc4d390b971" data-default-tab="result" class='codepen'>See the Pen <a href='http://codepen.io/wolframhempel/pen/9cb7e16c6e3a5ad427297cc4d390b971/'>Extending Tabs</a> by Wolfram Hempel (<a href='http://codepen.io/wolframhempel'>@wolframhempel</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//codepen.io/assets/embed/ei.js"></script>

### Accessing the Tab

There are two ways to access an instance of a [Tab object](../docs/Tab.html). Either by traversing the item-tree, e.g.

	tab = myLayout.root.contentItems[ 0 ].header.tabs[ 1 ];

or, more commonly, via a container. The tricky bit though is that GoldenLayout changes the tab that’s associated with a component whilst it is dragged around the layout. So in order to manipulate the tab, we have to listen to the container’s `tab` event.

	container.on( 'tab', function( tab ){
		tab.element.append( counter );
	});

To put it into perspective, here's what the essential bits of our example-component look like:

	myLayout.registerComponent( 'example', function( container ){
		var counter = $( '<div class="messageCounter">0</div>' );

		container.on( 'tab', function( tab ){
			tab.element.append( counter );
		});
	});

Please note that the counter's DOM element (the orange bubble with the number) is only created once and then moved to every new tab that's created. This way we don't have to rebind events.
Another note-worthy bit is the css. Our bubble should be a bit darker when its tab isn't selected. This can be done by checking for an `.lm_active` class on the tab.

	.lm_active .messageCounter{
		background: #ee7813;
	}