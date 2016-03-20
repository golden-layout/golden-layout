Using GoldenLayout with SlickGrid
=======================================
This tutorial is in many ways similar to [Using GoldenLayout with HighCharts and Yahoo Finance](highcharts.html). It illustrates how to wire the lifecycle of third-party components up with GoldenLayout.

### Here's what we're after
<p data-height="268" data-theme-id="7376" data-slug-hash="8a90e7c51e2b8ba6c964e840793d22de" data-default-tab="result" data-user="wolframhempel" class='codepen'>See the Pen <a href='http://codepen.io/wolframhempel/pen/8a90e7c51e2b8ba6c964e840793d22de/'>SlickGrid component</a> by Wolfram Hempel (<a href='http://codepen.io/wolframhempel'>@wolframhempel</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//codepen.io/assets/embed/ei.js"></script>

### A quick note on resizing-behaviour
Some of the components you'll come across resize purely based on CSS. 
Others, like SlickGrid or HighCharts do all sorts of clever things when their size changes and therefor have an `onResize` or `setSize` method to notify them. Both of these approaches work perfectly well with GoldenLayout.
There are, however, also the others. Those who need to know about resizing, but assume the only thing that will ever change size is the browser window. (I'm looking at you here, ng-grid). For these components it might make sense to trigger the window resize event programmatically when the container resizes, e.g.

	container.on( 'resize', function(){
		$(window).trigger( 'resize' );
	});

### A few things to look out for

#### Defered grid creation
In order to determine its initial size, SlickGrid measures the component that it is inserted to. When GoldenLayout creates the Component however it is not yet inserted into the DOM. The size of the element returned by `container.getElement()` is therefor zero. So rather than creating the Grid straight away we'll wait for the container's `open` event - at which point it's inserted into the DOM and ready to go.
	
	var StockGridComponent = function( container, state ) {
		...
		container.on( 'open', this._createGrid, this );
	};

#### Binding events only after the component has been created
There’s no guarantee that your component won’t be resized or destroyed before `open` is called. So subscribe to events that expect the component to be there only after its been created.

	StockGridComponent.prototype._createGrid = function() {
		this._grid = new Slick.Grid( 
			this._container.getElement(),
			this._stockDataProvider.getStocksBySymbol( this._state.symbols ), 
			this._columns,
			this._options
		);

		this._container.on( 'resize', this._resize, this );
		this._container.on( 'destroy', this._destroy, this );
		this._resize();
	};

#### Destruction
Always include some clean-up logic to prevent memory leaks and keep your application running smoothly for days.
	
	StockGridComponent.prototype._destroy = function() {
		this._grid.destroy();
	};

### Putting it all together
This is what our SlickGrid component would look like. It uses an external `DataProvider` to get its data and is populated by a list of stock-ticker symbols provided from the state.

	var StockGridComponent = function( container, state ) {
		this._container = container;
		this._state = state;
		this._grid = null;
		this._stockDataProvider = new StockDataProvider();
		this._columns = [
			{id: "symbol", name: "Symbol", field: "symbol"},
			{id: "company", name: "Company", field: "company"},
			{id: "price", name: "Price", field: "price"},
			{id: "change", name: "Change", field: "change"},
			{id: "changeRel", name: "Change %", field: "changeRel"},
			{id: "volume", name: "Volume", field: "volume"}
		];
		this._options = {
			editable: false,
			enableAddRow: false,
			enableCellNavigation: true
		};

		container.on( 'open', this._createGrid, this );
	};

	StockGridComponent.prototype._createGrid = function() {
		this._grid = new Slick.Grid( 
			this._container.getElement(),
			this._stockDataProvider.getStocksBySymbol( this._state.symbols ), 
			this._columns,
			this._options
		);

		this._container.on( 'resize', this._resize, this );
		this._container.on( 'destroy', this._destroy, this );
		this._resize();
	};


	StockGridComponent.prototype._resize = function() {
		this._grid.resizeCanvas();
		this._grid.autosizeColumns();
	};

	StockGridComponent.prototype._destroy = function() {
		this._grid.destroy();
	};

