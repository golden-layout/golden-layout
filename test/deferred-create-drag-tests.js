describe( 'supports drag creation with deferred content', function() {

	var layout, dragSrc;

	it( 'creates a layout', function() {
		layout = testTools.createLayout( {
			content: [ {
				type: 'stack',
				content: [ {
					type: 'component',
					componentState: { html: '<div id="dragsource"></div>' },
					componentName: 'testComponent'
				} ]
			} ]
		} );

		expect( layout.isInitialised ).toBe( true );
	} );

	it( 'creates a drag source', function() {
		dragSrc = layout.root.contentItems[ 0 ].element.find( '#dragsource' );
		expect( dragSrc.length ).toBe( 1 );

		layout.createDragSource( dragSrc, function() {
				return {
					type: 'component',
					componentState: { html: '<div class="dragged"></div>' },
					componentName: 'testComponent'
				};
			}
		);
	} );

	it( 'creates a new components if dragged', function() {
		expect( $( '.dragged' ).length ).toBe( 0 );

		var mouse = $.Event( 'mousedown' );
		mouse.pageX = dragSrc.position().left;
		mouse.pageY = dragSrc.position().top;
		mouse.button = 0;
		dragSrc.trigger( mouse );

		mouse = $.Event( 'mousemove' );
		mouse.pageX = dragSrc.position().left + 50;
		mouse.pageY = dragSrc.position().top;
		dragSrc.trigger( mouse );

		dragSrc.trigger( 'mouseup' );

		expect( $( '.dragged' ).length ).toBe( 1 );
		var node = testTools.verifyPath( "row.1", layout, expect );
		expect( node.element.find( ".dragged" ).length ).toBe( 1 );
	} );

	it( 'destroys the layout', function() {
		layout.destroy();
	} );
} );