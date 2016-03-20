
Using GoldenLayout with HighCharts and Yahoo Finance
=========================================================
This tutorial shows how to create a layout with multiple historic stockprice charts using GoldenLayout, [HighCharts](http://www.highcharts.com/) and data from the [Yahoo Finance API](https://developer.yahoo.com/yql/console/?q=show%20tables&env=store://datatables.org/alltableswithkeys#h=select+*+from+yahoo.finance.historicaldata+where+symbol+%3D+%22YHOO%22+and+startDate+%3D+%222009-09-11%22+and+endDate+%3D+%222010-03-10%22). It tries to be a bit more complex, real-worldy use case.

### Here's what we're after

<p data-height="268" data-theme-id="7376" data-slug-hash="c0c2f3811adfef1f8fc3d78c47686409" data-default-tab="result" class='codepen'>See the Pen <a href='http://codepen.io/wolframhempel/pen/c0c2f3811adfef1f8fc3d78c47686409/'>HighCharts, YQL and GoldenLayout</a> by Wolfram Hempel (<a href='http://codepen.io/wolframhempel'>@wolframhempel</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//codepen.io/assets/embed/ei.js"></script>

### Structure
This example consists of three parts:

- A `StockDataRequest` class that retrieves data from Yahoo Finance using YQL (Yahoo Query Language)
- A `StockChartComponent` class that handles the interaction between HighCharts, GoldenLayout and the DataProvider
- A bootstrap script to configure and initialise the layout

For this tutorial we'll concentrate on the `StockChartComponent` class and the layout configuration. If you'd like to learn more about the `StockDataRequest` class, please have a look at the Codepen above.


### GoldenLayout config
Let's start with the configuration for GoldenLayout.

	var myLayout = new GoldenLayout({
		content:[{
			type: 'row',
			content: [{
				type: 'component',
				componentName: 'stockChart',
				componentState: {
					companyName: 'Google Inc.',
					tickerSymbol: 'GOOGL',
					color:'#7C7'
				}
			},{
				type: 'component',
				componentName: 'stockChart',
				componentState: {
					companyName: 'Apple Inc.',
					tickerSymbol: 'AAPL',
					color: '#77C' 
				}
			}]
		}]
	});

	myLayout.registerComponent( 'stockChart', StockChartComponent );
	myLayout.init();

It creates a basic layout with two components in a row (if you're not familiar with GoldenLayout configs yet, please have a look at the [getting started tutorial](getting-started.html)). The `componentState` attribute contains three keys:

- `companyName` will be used for the chart's title and series description
- `tickerSymbol` is a standardised way of identifying stocks and will be used to download the right historical prices from Yahoo Finance
- `color` defines the line-color for the plot

### StockChartComponent
The StockChart component is the glue between HighCharts, GoldenLayout and Yahoo Finance. The complete class looks like this:

	StockChartComponent = function( container, state ) {
		this._highChartsConfig = {
			title: { text: 'Historic prices for ' + state.companyName },
			series: [],
			plotOptions: { line: { marker: { enabled: false } } },
			xAxis:{ type: 'datetime' },
			yAxis:{ title: 'Price in USD' },
			chart:{ renderTo: container.getElement()[ 0 ] }
		};

		this._container = container;
		this._state = state;
		this._chart = null;

		this._container.setTitle( 'Chart for ' + state.companyName );
		this._container.on( 'open', this._createChart.bind( this ) );
	};

	StockChartComponent.prototype._createChart = function() {
		this._chart = new Highcharts.Chart( this._highChartsConfig );
		this._chart.showLoading( 'Loading data...' );
		new StockDataRequest( this._state.tickerSymbol, this._onDataReady.bind( this ) );
	};

	StockChartComponent.prototype._onDataReady = function( highchartsData ) {
		this._chart.addSeries({
			color: this._state.color,
			name: this._state.companyName,
			data: highchartsData
		});

		this._chart.hideLoading();
		this._bindContainerEvents();
	};

	StockChartComponent.prototype._bindContainerEvents = function() {
		this._container.on( 'resize', this._setSize.bind( this ) );
		this._container.on( 'destroy', this._chart.destroy.bind( this._chart ) );
	};

	StockChartComponent.prototype._setSize = function() {
		this._chart.setSize( this._container.width, this._container.height );
	};

Some bits worth noting

#### getElement() returns a jQuery element
	chart:{ renderTo: container.getElement()[ 0 ] }

`container.getElement()` returns a jQuery wrapped DOM element, yet HighCharts expects a raw element. `container.getElement()[ 0 ]` allows to access it.

#### setting titles
	this._container.setTitle( 'Chart for ' + state.companyName );

Every item in GoldenLayout can have a title. Titles are displayed on tabs or on window headers and can either be passed by configuration or set programmatically by calling `item.setTitle( title )` or `container.setTitle( title )`

#### deferring chart creation until the container is open
	this._chart = null;
	this._container.on( 'open', this._createChart.bind( this ) );

	StockChartComponent.prototype._createChart = function() {
		this._chart = new Highcharts.Chart( this._highChartsConfig );
		...
	}

When GoldenLayout creates the component it is not yet sized or attached to the DOM. This is okay for most cases, but some libraries like HighCharts or SlickGrid measure the size of the element they are placed into and resize themselves accordingly.

To support this, we'll have to wait until the container's `open` event.

#### handle resizing
	StockChartComponent.prototype._bindContainerEvents = function() {
		this._container.on( 'resize', this._setSize.bind( this ) );
		...
	};

	StockChartComponent.prototype._setSize = function() {
		this._chart.setSize( this._container.width, this._container.height );
	};

If your component's reflow is purely managed by CSS it will adjust to whatever size its container is. But for many usecases you'd want to resize it programmatically, e.g. to redraw a chart or to add / remove rows from a virtualised grid.


#### clean up
	this._container.on( 'destroy', this._chart.destroy.bind( this._chart ) );

Cleaning up after your components is important to prevent memoryleaks. Especially for apps that allow to add or remove components at runtime.