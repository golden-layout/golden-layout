describe( 'content items are abled to to emit events that bubble up the tree', function(){

	var layout;

	it( 'creates a layout', function(){
		layout = testTools.createLayout({
			content: [{
				type: 'stack',
				content: [{
					type: 'column',
					content:[{
						type: 'component',
						componentName: 'testComponent'
					}]
				},{
					type: 'row'
				}]
			}]
		});

		testTools.verifyPath( 'stack.0.column.0.stack.0.component', layout, expect );
		testTools.verifyPath( 'stack.1.row', layout, expect );
	});

	it( 'emits bubbling events', function(){
		var invocations = [],
			eventName = 'eventA',
			hasReachedLayout = false;

		runs(function(){
			layout.root
				.contentItems[ 0 ]
				.contentItems[ 0 ]
				.contentItems[ 0 ]
				.contentItems[ 0 ]
				.on( eventName, function(){
					invocations.push( 'component' );
				});
		
			layout.root
				.contentItems[ 0 ]
				.contentItems[ 0 ]
				.contentItems[ 0 ]
				.on( eventName, function(){ invocations.push( 'stackBottom' ); });

			layout.root
				.contentItems[ 0 ]
				.contentItems[ 0 ]
				.on( eventName, function(){ invocations.push( 'column' ); });

			layout.root
				.contentItems[ 0 ]
				.on( eventName, function(){ invocations.push( 'stackTop' ); });

			layout.root.on( eventName, function( event ){
				invocations.push( 'root' );
				expect( event.origin.type ).toBe( 'component' );
			});

			layout.on( eventName, function(){
				hasReachedLayout = true;
				invocations.push( 'layout' );
			});

			layout.root.getItemsByType( 'row' )[ 0 ].on( eventName, function(){
				expect( 'this' ).toBe( 'never called' );
			});

			layout.root.getItemsByType( 'component' )[ 0 ].emitBubblingEvent( eventName );
		});

		waitsFor(function(){
			return hasReachedLayout;
		});

		runs(function(){
			expect( invocations.length ).toBe( 6 );
			expect( invocations[ 0 ] ).toBe( 'component' );
			expect( invocations[ 1 ] ).toBe( 'stackBottom' );
			expect( invocations[ 2 ] ).toBe( 'column' );
			expect( invocations[ 3 ] ).toBe( 'stackTop' );
			expect( invocations[ 4 ] ).toBe( 'root' );
			expect( invocations[ 5 ] ).toBe( 'layout' );
		});
	});

	it( 'stops propagation', function(){
		var invocations = [],
			eventName = 'eventB';

		layout.root
			.contentItems[ 0 ]
			.contentItems[ 0 ]
			.contentItems[ 0 ]
			.contentItems[ 0 ]
			.on( eventName, function(){
				invocations.push( 'component' );
			});
	
		layout.root
			.contentItems[ 0 ]
			.contentItems[ 0 ]
			.contentItems[ 0 ]
			.on( eventName, function(){ invocations.push( 'stackBottom' ); });

		layout.root
			.contentItems[ 0 ]
			.contentItems[ 0 ]
			.on( eventName, function( event ){
				event.stopPropagation();
				invocations.push( 'column' );
			});

		layout.root
			.contentItems[ 0 ]
			.on( eventName, function(){ invocations.push( 'stackTop' ); });

		layout.root.on( eventName, function(){ invocations.push( 'root' ); });
		
		layout.on( eventName, function(){ invocations.push( 'layout' ); });
		
		layout.root.getItemsByType( 'component' )[ 0 ].emitBubblingEvent( eventName );

		expect( invocations.length ).toBe( 3 );
		expect( invocations[ 0 ] ).toBe( 'component' );
		expect( invocations[ 1 ] ).toBe( 'stackBottom' );
		expect( invocations[ 2 ] ).toBe( 'column' );
	});

	it( 'destroys the layout', function(){
		layout.destroy();
	});
});