describe( 'tabs apply their configuration', function(){
	var layout;

	it( 'creates a layout', function(){
		layout = testTools.createLayout({
			content: [{
				type: 'stack',
				content: [{
					type: 'component',
					componentName: 'testComponent'
				},
				{
					type: 'component',
					componentName: 'testComponent',
					reorderEnabled: false
				}]
			}]
		});

		expect( layout.isInitialised ).toBe( true );
	});

	it( 'attached a drag listener to the first tab', function(){
		

		var item1 = layout.root.contentItems[ 0 ].contentItems[ 0 ],
			item2 = layout.root.contentItems[ 0 ].contentItems[ 1 ],
			header = layout.root.contentItems[ 0 ].header;

		expect( header.tabs.length ).toBe( 2 );

		expect( item1.type ).toBe( 'component' );
		expect( item1.config.reorderEnabled ).toBe( true );
		expect( header.tabs[ 0 ]._dragListener ).toBeDefined();

		expect( item2.type ).toBe( 'component' );
		expect( item2.config.reorderEnabled ).toBe( false );
		expect( header.tabs[ 1 ]._dragListener ).not.toBeDefined();
	});

	it( 'destroys the layout', function(){
		layout.destroy();
	});
});
