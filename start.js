$( function() {
	var queryParams = getQueryParams();
	var layout = queryParams.layout || '';
	var config = null;
	switch( layout.toLowerCase() ) {
		case 'responsive':
			config = createResponsiveConfig();
			break;
		case 'tab-dropdown':
			config = createTabDropdownConfig();
			break;
		default:
			config = createStandardConfig();
			break;
	}

	window.myLayout = new GoldenLayout( config );

	var rotate = function( container ) {
		if( !container ) return;
		while( container.parent && container.type != 'stack' )
			container = container.parent;
		if( container.parent ) {
			var p = container.header.position();
			var sides = [ 'top', 'right', 'bottom', 'left', false ];
			var n = sides[ ( sides.indexOf( p ) + 1 ) % sides.length ];
			container.header.position( n );
		}
	}
	var nexttheme = function() {
		var link = $( 'link[href*=theme]' ), href = link.attr( 'href' ).split( '-' );
		var themes = [ 'dark', 'light', 'soda', 'translucent' ];
		href[ 1 ] = themes[ ( themes.indexOf( href[ 1 ] ) + 1 ) % themes.length ];
		link.attr( 'href', href.join( '-' ) );
	}

	myLayout.registerComponent( 'html', function( container, state ) {
		container
			.getElement()
			.html( state.html ? state.html.join( '\n' ) : '<p>' + container._config.title + '</p>' );

		if( state.style ) {
			$( 'head' ).append( '<style type="text/css">\n' + state.style.join( '\n' ) + '\n</style>' );
		}

		if( state.className ) {
			container.getElement().addClass( state.className );
		}

		if( state.bg ) {
			container
				.getElement()
				.text( 'hey' )
				.append( '<br/>' )
				.append( $( '<button>' ).on( 'click', function() {
					rotate( container )
				} ).text( 'rotate header' ) )
				.append( '<br/>' )
				.append( $( '<button>' ).on( 'click', nexttheme ).text( 'next theme' ) );
		}
	} );

	myLayout.init();

	function getQueryParams() {
		var params = {};
		window.location.search.replace( /^\?/, '' ).split( '&' ).forEach( function( pair ) {
			var parts = pair.split( '=' );
			if( parts.length > 1 ) {
				params[ decodeURIComponent( parts[ 0 ] ).toLowerCase() ] = decodeURIComponent( parts[ 1 ] );
			}
		} );

		return params;
	}

	function createStandardConfig() {
		return {
			content: [
				{
					type: 'row',
					content: [
						{
							width: 80,
							type: 'column',
							content: [
								{
									title: 'Fnts 100',
									header: { show: 'bottom' },
									type: 'component',
									componentName: 'html',
								},
								{
									type: 'row',
									content: [
										{
											type: 'component',
											title: 'Golden',
											header: { show: 'right' },
											isClosable: false,
											componentName: 'html',
											width: 30,
											componentState: { bg: 'golden_layout_spiral.png' }
										},
										{
											title: 'Layout',
											header: { show: 'left', popout: false },
											type: 'component',
											componentName: 'html',
											componentState: { bg: 'golden_layout_text.png' }
										}
									]
								},
								{
									type: 'stack',
									content: [
										{
											type: 'component',
											title: 'Acme, inc.',
											componentName: 'html',
											componentState: {
												companyName: 'Stock X'
											}
										},
										{
											type: 'component',
											title: 'LexCorp plc.',
											componentName: 'html',
											componentState: {
												companyName: 'Stock Y'
											}
										},
										{
											type: 'component',
											title: 'Springshield plc.',
											componentName: 'html',
											componentState: {
												companyName: 'Stock Z'
											}
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
									type: 'component',
									title: 'Performance',
									componentName: 'html'
								},
								{
									height: 40,
									type: 'component',
									title: 'Market',
									componentName: 'html'
								}
							]
						}
					]
				}
			]
		};
	}

	function createResponsiveConfig() {
		return {
			settings: {
				responsiveMode: 'always'
			},
			dimensions: {
				minItemWidth: 250
			},
			content: [
				{
					type: 'row',
					content: [
						{
							width: 30,
							type: 'column',
							content: [
								{
									title: 'Fnts 100',
									type: 'component',
									componentName: 'html',
								},
								{
									type: 'row',
									content: [
										{
											type: 'component',
											title: 'Golden',
											componentName: 'html',
											width: 30,
											componentState: { bg: 'golden_layout_spiral.png' }
										}
									]
								},
								{
									type: 'stack',
									content: [
										{
											type: 'component',
											title: 'Acme, inc.',
											componentName: 'html',
											componentState: {
												companyName: 'Stock X'
											}
										},
										{
											type: 'component',
											title: 'LexCorp plc.',
											componentName: 'html',
											componentState: {
												companyName: 'Stock Y'
											}
										},
										{
											type: 'component',
											title: 'Springshield plc.',
											componentName: 'html',
											componentState: {
												companyName: 'Stock Z'
											}
										}
									]
								}
							]
						},
						{
							width: 30,
							title: 'Layout',
							type: 'component',
							componentName: 'html',
							componentState: { bg: 'golden_layout_text.png' }
						},
						{
							width: 20,
							type: 'component',
							title: 'Market',
							componentName: 'html',
							componentState: {
								className: 'market-content',
								style: [
									'.market-content label {',
									'  margin-top: 10px;',
									'  display: block;',
									'  text-align: left;',
									'}',
									'.market-content input {',
									'  width: 250px;',
									'  border: 1px solid red',
									'}'
								],
								html: [
									'<label for="name">Name<label>',
									'<input id="name" type="text"></input>'
								]
							}
						},
						{
							width: 20,
							type: 'column',
							content: [
								{
									height: 20,
									type: 'component',
									title: 'Performance',
									componentName: 'html'
								},
								{
									height: 80,
									type: 'component',
									title: 'Profile',
									componentName: 'html'
								}
							]
						}
					]
				}
			]
		};
	}

	function createTabDropdownConfig() {
		return {
			settings: {
				tabOverlapAllowance: 25,
				reorderOnTabMenuClick: false,
				tabControlOffset: 5
			},
			content: [
				{
					type: 'row',
					content: [
						{
							width: 30,
							type: 'column',
							content: [
								{
									title: 'Fnts 100',
									type: 'component',
									componentName: 'html',
								},
								{
									type: 'row',
									content: [
										{
											type: 'component',
											title: 'Golden',
											componentName: 'html',
											width: 30,
											componentState: { bg: 'golden_layout_spiral.png' }
										}
									]
								},
								{
									type: 'stack',
									content: [
										{
											type: 'component',
											title: 'Acme, inc.',
											componentName: 'html',
											componentState: {
												companyName: 'Stock X'
											}
										},
										{
											type: 'component',
											title: 'LexCorp plc.',
											componentName: 'html',
											componentState: {
												companyName: 'Stock Y'
											}
										},
										{
											type: 'component',
											title: 'Springshield plc.',
											componentName: 'html',
											componentState: {
												companyName: 'Stock Z'
											}
										}
									]
								}
							]
						},
						{
							width: 20,
							type: 'stack',
							content: [
								{
									type: 'component',
									title: 'Market',
									componentName: 'html'
								},
								{
									type: 'component',
									title: 'Performance',
									componentName: 'html'
								},
								{
									type: 'component',
									title: 'Trend',
									componentName: 'html'
								},
								{
									type: 'component',
									title: 'Balance',
									componentName: 'html'
								},
								{
									type: 'component',
									title: 'Budget',
									componentName: 'html'
								},
								{
									type: 'component',
									title: 'Curve',
									componentName: 'html'
								},
								{
									type: 'component',
									title: 'Standing',
									componentName: 'html'
								},
								{
									type: 'component',
									title: 'Lasting',
									componentName: 'html',
									componentState: { bg: 'golden_layout_spiral.png' }
								},
								{
									type: 'component',
									title: 'Profile',
									componentName: 'html'
								}
							]
						},
						{
							width: 30,
							title: 'Layout',
							type: 'component',
							componentName: 'html',
							componentState: { bg: 'golden_layout_text.png' }
						}
					]
				}
			]
		};
	}
} );
