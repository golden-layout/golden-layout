Adding controls to headers
========================================
GoldenLayout provides a number of hooks that make it easy to extend its native functionality, e.g. by adding additional controls to all headers.

### The goal
For this tutorial we'll add a dropdown to every header that allows the user to change the background color.

It needs to:
- Change the component's background color when a color is selected
- Set the initial color based on the component's configuration
- Notify the LayoutManager about state changes when a new color is selected

### The result
<p data-height="268" data-theme-id="7376" data-slug-hash="e15391fb136593e265013408cf68e561" data-default-tab="result" class='codepen'>See the Pen <a href='http://codepen.io/wolframhempel/pen/e15391fb136593e265013408cf68e561/'>Add Control to Header</a> by Wolfram Hempel (<a href='http://codepen.io/wolframhempel'>@wolframhempel</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//codepen.io/assets/embed/ei.js"></script>

###  The approach
Whenever a new Row, Column, Stack or Component is created, GoldenLayout emits an event, providing the new item as an argument.

	myLayout.on( 'stackCreated', function( stack ){
		// ...manipulate the stack
	});

	myLayout.on( 'componentCreated', function( component ){
		// ...manipulate the component
	});

Stacks, Rows, Columns and Components expose the [Item API](../docs/Item.html). 

<div class="info">Please note: All components are children of Stacks (the item with the header and the tabs)! Even if a component is not configured as a child of a stack one will implicitly be added.</div>

The Stack item provides access to its header and the components within it. Some examples:

	myLayout.on( 'stackCreated', function( stack ){
		
		/*
		 * Accessing the DOM element that contains the popout, maximise and * close icon
		 */
		stack.header.controlsContainer.prepend( '<div>foo</div>' );

		/*
		 * Listening for activeContentItemChanged. This happens initially
		 * when the stack is created and everytime the user clicks a tab
		 */
		stack.on( 'activeContentItemChanged', function( contentItem ){
	        // interact with the contentItem
	    });

		/*
		 * Accessing the container and updating its state
		 */
		stack.getActiveContentItem().container.extendState({color: '#faa'});
	});

### And that's the entire code for our dropdown

	/// Callback for every created stack
	myLayout.on( 'stackCreated', function( stack ){

	    //HTML for the colorDropdown is stored in a template tag
	    var colorDropdown = $( $( 'template' ).html() ),
	        colorDropdownBtn = colorDropdown.find( '.selectedColor' ),

	        setColor = function( color ){
		        var container = stack.getActiveContentItem().container;

		        // Set the color on both the dropDown and the background
		        colorDropdownBtn.css( 'background-color', color );
		        container.getElement().css( 'background-color', color );

		        // Update the state
		        container.extendState({ color: color });
		    };

	    // Add the colorDropdown to the header
	    stack.header.controlsContainer.prepend( colorDropdown );

	    // Update the color initially and whenever the tab changes
	    stack.on( 'activeContentItemChanged', function( contentItem ){
	        setColor( contentItem.container.getState().color );
	    });
	       
	    // Update when the user selects a different color
	    // from the dropdown
	    colorDropdown.find( 'li' ).click(function(){
	        setColor( $(this).css( 'background-color' ) );
	    });
	});