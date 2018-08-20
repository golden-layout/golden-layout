/* global GoldenLayout */
describe( 'Can minify and unminify configuration objects', function() {

	it( 'has minification methods', function() {
		expect( typeof GoldenLayout.minifyConfig ).toBe( 'function' );
		expect( typeof GoldenLayout.unminifyConfig ).toBe( 'function' );
	} );

	it( 'doesn\'t manipulate the original config', function() {
		var minifiedTestConfig = GoldenLayout.minifyConfig( testConfig );
		expect( typeof minifiedTestConfig ).toBe( 'object' );
		expect( minifiedTestConfig === testConfig ).toBe( false );
	} );

	it( 'minifies and unminifies the config directly', function() {
		var min = GoldenLayout.minifyConfig( testConfig ),
			max = GoldenLayout.unminifyConfig( min );

		expect( JSON.stringify( max ) ).toBe( JSON.stringify( testConfig ) );
	} );

	it( 'doesn\'t change single character keys and values', function() {
		var conf = { 'a': 'some', 'thing': 'b' },
			min = GoldenLayout.minifyConfig( conf ),
			max = GoldenLayout.unminifyConfig( min );

		expect( JSON.stringify( max ) ).toBe( JSON.stringify( conf ) );
	} );

	function allExistingKeysConfig() {
		var res = {};
		(new lm.utils.ConfigMinifier())._keys.forEach( function( k ) {
			res[ k ] = k;
		} );
		return res;
	}

	it( 'works with existing minified configurations', function() {
		// Create with this:
		// var min = GoldenLayout.minifyConfig( allExistingKeysConfig() );
		// console.log( JSON.stringify( min ) );
		var existingMinified = JSON.parse( '{"0":"settings","1":"hasHeaders","2":"constrainDragToContainer","3":"selectionEnabled","4":"dimensions","5":"borderWidth","6":"minItemHeight","7":"minItemWidth","8":"headerHeight","9":"dragProxyWidth","a":"dragProxyHeight","b":"labels","c":"6","d":"7","e":"8","f":"popout","g":"content","h":"componentName","i":"componentState","j":"id","k":"width","l":"type","m":"height","n":"isClosable","o":"title","p":"popoutWholeStack","q":"openPopouts","r":"parentId","s":"activeItemIndex","t":"reorderEnabled"}' );
		var max = GoldenLayout.unminifyConfig( existingMinified );
		// Each key should map to its own name.
		Object.keys( max ).forEach( function( k ) {
			expect( max[ k ] ).toBe( k );
		} );
	} );

	var testConfig = {
		dimensions: {
			borderWidth: 5
		},

		content: [
			{
				type: 'row',
				content: [
					{
						width: 80,
						type: 'column',
						content: [
							{
								type: 'component',
								componentName: 'watchlist',
								componentState: { 'instruments': [ 'MSFT', 'GOOG', 'AAPL' ] }
							},
							{
								isClosable: false,
								type: 'row',
								content: [
									{
										type: 'component',
										componentName: 'research'
									},
									{
										type: 'component',
										componentName: 'research'
									}
								]
							},
							{
								type: 'stack',
								content: [
									{
										type: 'component',
										componentName: 'research',
										componentState: { index: 1 }
									},
									{
										isClosable: false,
										type: 'component',
										componentName: 'research',
										componentState: { index: 2 }
									},
									{
										type: 'component',
										componentName: 'research',
										componentState: { index: 3 }
									}
								]
							}
						]
					},
					{
						width: 20,
						type: 'column',
						content: [
							{
								height: 30,
								type: 'component',
								componentName: 'commentary',
								componentState: { 'feedTopic': 'us-bluechips' }
							},
							{
								type: 'component',
								componentName: 'commentary',
								componentState: { 'feedTopic': 'lse' }
							}
						]
					}
				]
			}
		]
	};

} );