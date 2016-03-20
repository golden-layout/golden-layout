Getting started
=====================================
Getting started with GoldenLayout is a breeze, but a bit off handholding is always nice. This tutorial takes you through the initial steps until you're up and running with your first managed layout.

### Including dependencies
GoldenLayout needs jQuery to work - that’s it. Either include it directly, using a script tag, e.g.

    <script type="text/javascript" src="http://code.jquery.com/jquery-1.11.1.min.js">
    </script>
    
or, if you’re using RequireJs, make jQuery available as a path, e.g. by adding this to your require config

	paths: {
	    'jquery':  '../bower_components/jquery/dist/jquery.min'
	}

Next, add GoldenLayout's main JS and CSS file, e.g.

	<script type="text/javascript" src="https://golden-layout.com/files/latest/js/goldenlayout.min.js"></script>
	<link type="text/css" rel="stylesheet" href="https://golden-layout.com/files/latest/css/goldenlayout-base.css" />

`goldenlayout-base.css` contains purely the structural bits, so you also need a theme. Just pick one of the available
ones and include its CSS file

	<link type="text/css" rel="stylesheet" href="https://golden-layout.com/files/latest/css/goldenlayout-dark-theme.css" />

### Configuring the Layout
Next we need to configure the initial layout (the user can move things around later).
For this example we'll create a big component on the left of the screen and two smaller ones on the right,
on top of each other, like so:

<img class="centered" src="../assets/images/tutorial_1_image_1.png" width="204" height="130" />

All GoldenLayout structures are created from three building blocks: Rows, Columns and Stacks. Row's arrange items from left to right, Columns from top to bottom and Stacks from front to back (as a tab-strip). These can be nested.

The actual parts that your app is composed of (forms, charts, tables etc.) are referred to as "components". Components can be put into any of these building blocks.

For our example we'll start with a row. The first item in this row is the big component that we want to put on the left hand side (A). To the right we want two components on top of each other (B and C) - so we need to put them into a column.

The whole structure should look like this:

<img class="centered" src="../assets/images/tutorial_1_image_2.png" width="204" height="130" />

Or as GoldenLayout configuration

	var config = {
		content: [{
			type: 'row',
			content:[{
				type: 'component',
				componentName: 'testComponent',
				componentState: { label: 'A' }
			},{
				type: 'column',
				content:[{
					type: 'component',
					componentName: 'testComponent',
					componentState: { label: 'B' }
				},{
					type: 'component',
					componentName: 'testComponent',
					componentState: { label: 'C' }
				}]
			}]
		}]
	};

A few things to note about this config:
- Every item (apart from components) can have children, specified in the `content` array
- `type` can be `'row'`, `'column'`, `'stack'` or `'component'`
- `componentName` specifies which component should be created. More about that further down
- `componentState` can be any serialisable Object and will be passed to the component

### Instantiating the layout
Now it's time to instantiate the Layout with our config

	var myLayout = new GoldenLayout( config );

<div class="info">This is not going to do anything just yet! Don't be disappointed though, the magic happens when we call `myLayout.init();` later on.</div>

The config argument is required. A DOM element can be provided as optional second argument. If none is specified GoldenLayout takes over the entire page by adding itself to `document.body`

### Registering Components
In our configuration we asked GoldenLayout to create a `'testComponent'`, now we need to specify what that is. This is done using

	myLayout.registerComponent( 'testComponent', function( container, componentState ){
		container.getElement().html( '<h2>' + componentState.label + '</h2>' );
	});

This needs a bit of explanation. `myLayout.registerComponent` takes two arguments: the name of the component and a constructor or factory function. 
This function is called by GoldenLayout with `new` - which creates an instance of your component if you've provided a constructor - or just executes the function if not.

The function receives two arguments. 

* `container` is an object that allows you to interact with the box that your compontent lives in. It gives you access to the DOM element, emits all sorts of events like `resize`, `hide`, `close` etc. and provides methods like `setSize()` or `setState()`. [Read more about container here](../docs/Container.html)
* `componentState` is what you've specified in the configuration, e.g. `{ label: 'C' }`

Your component's instance or whatever your function returns is stored and can later be accessed from `myLayout`.

### Initialise the Layout
That's it. Now all that's left to start up your layout is calling

    myLayout.init();

### Result
<p data-height="268" data-theme-id="7376" data-slug-hash="c41f82acbaafcc1a3211c64778a04bbb" data-default-tab="result" class='codepen'>See the Pen <a href='http://codepen.io/wolframhempel/pen/c41f82acbaafcc1a3211c64778a04bbb/'>Tutorial 1</a> by Wolfram Hempel (<a href='http://codepen.io/wolframhempel'>@wolframhempel</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//codepen.io/assets/embed/ei.js"></script>