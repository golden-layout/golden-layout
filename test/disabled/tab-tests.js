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
		
		var firstComponent = layout.root.contentItems[0].contentItems[0];
        var secondComponent = layout.root.contentItems[0].contentItems[1];
        var layoutHeader = layout.root.contentItems[0].header;



		//var item1 = layout.root.contentItems[ 0 ].contentItems[ 0 ],
		//	item2 = layout.root.contentItems[ 0 ].contentItems[ 1 ],
		//	header = layout.root.contentItems[ 0 ].header;

		expect( layoutHeader.tabs.length ).toBe( 2 );

		expect( firstComponent.type ).toBe( 'component' );
		expect( firstComponent.config.reorderEnabled ).toBe( true );
		expect( layoutHeader.tabs[ 0 ]._dragListener ).toBeDefined();

		expect( secondComponent.type ).toBe( 'component' );
		expect( secondComponent.config.reorderEnabled ).toBe( false );
		expect( layoutHeader.tabs[ 1 ]._dragListener ).not.toBeDefined();
	});

	it( 'destroys the layout', function(){
		layout.destroy();
	});
});

//