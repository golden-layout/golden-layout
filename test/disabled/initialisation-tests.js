describe( 'Can initialise the layoutmanager', function() {

	var myLayout;

	it( 'Finds the layoutmanager on the global namespace', function() {
		expect( window.GoldenLayout ).toBeDefined();
	});

	it( 'Can create a most basic layout', function() {
		myLayout = new window.GoldenLayout({
			content: [{
				type: 'component',
				componentName: 'testComponent'
			}]
		});

		myLayout.registerComponent( 'testComponent', function( container ){
			container.getElement().html( 'that worked' );
		});

		myLayout.init();
		expect( $( '.lm_goldenlayout' ).length ).toBe( 1 );
		testTools.verifyPath( 'stack.0.component', myLayout, expect );
	});

	it( 'Destroys the layout', function(){
		myLayout.destroy();
		expect( myLayout.root.contentItems.length ).toBe( 0 );
	});
});