Dynamically adding Components
===================================
Often you'd want to give your users the ability to add new items to an existing layout. GoldenLayout offers a number of ways to do this.

- You can turn any DOM element on the page into a 'dragSource' that turns into a layoutItem when dragged
- You can let the user select an element and add items to it
- You can add items to a specified element

### Creating a layout
For this tutorial we won't insert the layout directly into the body, but rather into a div to leave some space for a component menu.
	
	<div id="wrapper">
		<ul id="menuContainer"></ul>
		<div id="layoutContainer"></div>
	</div>

Let's keep things simple: Create a basic layout with two components in a row

    var config = {
		content: [{
			type: 'row',
			content: [{
				type:'component',
				componentName: 'example',
				componentState: { text: 'Component 1' }
			},
			{
				type:'component',
				componentName: 'example',
				componentState: { text: 'Component 2' }
			}]
		}]
	};
    
    var myLayout = new window.GoldenLayout( config, $('#layoutContainer') );

    myLayout.registerComponent( 'example', function( container, state ){
		container.getElement().html( '<h2>' + state.text + '</h2>');
	});
    
    myLayout.init();
    
### Creating the "insert component" menu
The "insert component" menu will be created programmatically as well. That's where we'll add the actual insertion code later on

    var addMenuItem = function( text ) {
    	var element = $( '<li>' + text + '</li>' );
    	$( '#menuContainer' ).append( element );
    
        //insertion code will go here
    };

    addMenuItem( 'User added component A' );
	addMenuItem( 'User added component B' );
    
### Adding items to a layout - in general

Time to write some "add component" functionality. GoldenLayout builds up a tree of items internally that can be accessed through 'myLayout.root' once the layout is initialised. Every one of these items has an `addChild` method that expects two parameters: `itemOrConfig` and `index`. 

Nevermind `index` for now. It's optional and specifies at which position the new child will be added. The important bit for us is `itemOrConfig`. This can be any kind of item config - which means it's also possible to create / insert a whole tree of new items at once.

Let's prepare a bit of item configuration in our 'addMenuItem' function

    var newItemConfig = {
		type: 'component',
		componentName: 'example',
		componentState: { text: text }
	};

The tricky bit is not so much creating the item, but selecting the element to which to add the item to. All three approaches we'll cover next are basically just that: different ways of selecting the parent for the new item.

### First: The really awesome way
GoldenLayout makes it simple to turn any DOM element into a "dragSource" - which allows for the creation of components by simply dragging the element onto the layout.

All that needs adding to our 'addMenuItem' method is this line:

    myLayout.createDragSource( element, newItemConfig );
    
Works like a charm:

<p data-height="268" data-theme-id="7376" data-slug-hash="d508753b29c3001c24218bf3a6b25141" data-default-tab="result" class='codepen'>See the Pen <a href='http://codepen.io/wolframhempel/pen/d508753b29c3001c24218bf3a6b25141/'>Adding items from drag Sources</a> by Wolfram Hempel (<a href='http://codepen.io/wolframhempel'>@wolframhempel</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//codepen.io/assets/embed/ei.js"></script>


### Second: Add items to a selected stack
GoldenLayout supports selecting items by clicking the empty space in the header area. This is however disabled by default. To enable it, simply add this to your config:

    var config = {
        settings: {
            selectionEnabled: true
        },
        content: [...]
    };

Now if the user clicks a header it turns into a different color, GoldenLayout emits a 'selectionChanged' event and the value of 'myLayout.selectedItem' points to the selected item.

To use this we'll change our insert logic to this:

    element.click(function(){
		if( myLayout.selectedItem === null ) {
			alert( 'No item selected' );
		} else {
			myLayout.selectedItem.addChild( newItemConfig );
		}
	});
    
Now clicking a li in the "insert component" menu will add the component to whatever
stack is selected - or alert if no selection has been made.

<p data-height="268" data-theme-id="7376" data-slug-hash="9dd68b285dc421364ac9ec13f2bdc999" data-default-tab="result" class='codepen'>See the Pen <a href='http://codepen.io/wolframhempel/pen/9dd68b285dc421364ac9ec13f2bdc999/'>Adding items to selected stacks</a> by Wolfram Hempel (<a href='http://codepen.io/wolframhempel'>@wolframhempel</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//codepen.io/assets/embed/ei.js"></script>

### Third: Adding items to a previously specified element
If we don't want to give the user a choice of where to add the new item, we can just specify an element ourselves. Either by using one of the getter-functions, (e.g. `myLayout.root.getItemsById( 'someItem' );`) or by traversing the item tree.

For instance, if we always want to add items to the topmost row, it would look like this:

	element.click(function(){
		myLayout.root.contentItems[ 0 ].addChild( newItemConfig );
	});

<p data-height="268" data-theme-id="7376" data-slug-hash="cdcb9de8e7b305d2ec81b4ae4e392832" data-default-tab="result" class='codepen'>See the Pen <a href='http://codepen.io/wolframhempel/pen/cdcb9de8e7b305d2ec81b4ae4e392832/'>Adding items to a predefined parent</a> by Wolfram Hempel (<a href='http://codepen.io/wolframhempel'>@wolframhempel</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//codepen.io/assets/embed/ei.js"></script>