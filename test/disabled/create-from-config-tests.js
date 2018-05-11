describe( 'Creates the right structure based on the provided config', function() {

	var createLayout = function( config ) {
		var myLayout = new window.GoldenLayout( config );

		myLayout.registerComponent( 'testComponent', function( container ){
			container.getElement().html( 'that worked' );
		});

		myLayout.init();

		return myLayout;
	};


	it( 'creates the right primitive types: component only', function() {
		var layout;

		runs(function(){
			layout = createLayout({
				content: [{
					type: 'component',
					componentName: 'testComponent'
				}]
			});
		});

		waitsFor(function(){
			return layout.isInitialised;
		});
		
		runs(function(){
			expect( layout.isInitialised ).toBe( true );
			expect( layout.root.isRoot ).toBe( true );
			expect( layout.root.contentItems.length ).toBe( 1 );
			expect( layout.root.contentItems[ 0 ].isStack ).toBe( true );
			expect( layout.root.contentItems[ 0 ].contentItems[ 0 ].isComponent ).toBe( true );
		});

		runs(function(){
			layout.destroy();
		});
	});

	it( 'creates the right primitive types: stack and component', function() {
		var layout;

		runs(function(){
			layout = createLayout({
				content: [{
					type: 'stack',
					content: [{
						type: 'component',
						componentName: 'testComponent'
					}]
				}]
			});
		});

		waitsFor(function(){
			return layout.isInitialised;
		});
		
		runs(function(){
			expect( layout.isInitialised ).toBe( true );
			expect( layout.root.isRoot ).toBe( true );
			expect( layout.root.contentItems.length ).toBe( 1 );
			expect( layout.root.contentItems[ 0 ].isStack ).toBe( true );
			expect( layout.root.contentItems[ 0 ].contentItems[ 0 ].isComponent ).toBe( true );
		});

		runs(function(){
			layout.destroy();
		});
	});

	it( 'creates the right primitive types: row and two component', function() {
		var layout;

		runs(function(){
			layout = createLayout({
				content: [{
					type: 'row',
					content: [{
						type: 'component',
						componentName: 'testComponent'
					},
					{
						type: 'component',
						componentName: 'testComponent'
					}]
				}]
			});
		});

		waitsFor(function(){
			return layout.isInitialised;
		});
		
		runs(function(){
			expect( layout.isInitialised ).toBe( true );
			expect( layout.root.contentItems.length ).toBe( 1 );
			expect( layout.root.contentItems[ 0 ].isRow ).toBe( true );
			expect( layout.root.contentItems[ 0 ].contentItems[ 0 ].isStack ).toBe( true );
			expect( layout.root.contentItems[ 0 ].contentItems[ 1 ].isStack ).toBe( true );
			expect( layout.root.contentItems[ 0 ].contentItems.length ).toBe( 2 );
			expect( layout.root.contentItems[ 0 ].contentItems[ 0 ].contentItems[ 0 ].isComponent ).toBe( true );
			expect( layout.root.contentItems[ 0 ].contentItems[ 1 ].contentItems[ 0 ].isComponent ).toBe( true );
		});

		runs(function(){
			layout.destroy();
		});
	});


	it( 'creates the right primitive types: stack -> column -> component', function() {
		var layout;

		runs(function(){
			layout = createLayout({
				content: [{
					type: 'stack',
					content: [{
						type: 'column',
						content:[{
							type: 'component',
							componentName: 'testComponent'
						}]
					}]
				}]
			});
		});

		waitsFor(function(){
			return layout.isInitialised;
		});
		
		runs(function(){
			expect( layout.isInitialised ).toBe( true );

			expect( layout.root.contentItems.length ).toBe( 1 );
			expect( layout.root.contentItems[ 0 ].isStack ).toBe( true );

			expect( layout.root.contentItems[ 0 ].contentItems.length ).toBe( 1 );
			expect( layout.root.contentItems[ 0 ].contentItems[ 0 ].isColumn ).toBe( true );

			expect( layout.root.contentItems[ 0 ].contentItems[ 0 ].contentItems.length ).toBe( 1 );
			expect( layout.root.contentItems[ 0 ].contentItems[ 0 ].contentItems[ 0 ].isStack ).toBe( true );

			expect( layout.root.contentItems[ 0 ].contentItems[ 0 ].contentItems[ 0 ].contentItems.length ).toBe( 1 );
			expect( layout.root.contentItems[ 0 ].contentItems[ 0 ].contentItems[ 0 ].contentItems[ 0 ].isComponent ).toBe( true );
		});

		runs(function(){
			layout.destroy();
		});
	});
});