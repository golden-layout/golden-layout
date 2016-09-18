describe( 'things', function () {
	var layout;

	it( 'creates a layout', function () {
		layout = testTools.createLayout( {
			content: [ {
				type: 'row',
				content: [ {
					type: 'component',
					componentName: 'testComponent'
				},
					{
						type: 'component',
						componentName: 'testComponent',
					} ]
			} ]
		} );
	} );

	it( 'does not overallocate space', function () {
		var root = $( 'body' );
		expect( layout.isInitialised ).toBe( true );
		function testWidth( width ) {
			root.width( width );
			layout.updateSize();
			var item1 = layout.root.contentItems[ 0 ].contentItems[ 0 ],
				item2 = layout.root.contentItems[ 0 ].contentItems[ 1 ];
			var totalWidth = item1.element.width() + item2.element.width() + layout.config.dimensions.borderWidth;

			expect( totalWidth ).toBe( Math.floor( width ) );
		}

		testWidth( 1000 );
		testWidth( 500 );
		testWidth( 50 );
		testWidth( 30 );
		testWidth( 31 );
		testWidth( 1000.5 );
		testWidth( 1000.1 );
		testWidth( 1000.999 );
	} );

	it( 'destroys the layout', function () {
		layout.destroy();
	} );
} );
