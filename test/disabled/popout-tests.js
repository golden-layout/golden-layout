describe( 'it can popout components into browserwindows', function(){

	var layout, browserPopout;

	it( 'creates a layout', function(){
		layout = testTools.createLayout({
			content: [{
				type: 'stack',
				content: [{
					type: 'component',
					componentName: 'testComponent',
					id: 'componentA'
				},
				{
					type: 'component',
					componentName: 'testComponent',
					id: 'componentB'
				}]
			}]
		});

		expect( layout.isInitialised ).toBe( true );
	});

	it( 'opens testComponent in a new window', function(){
		expect( layout.openPopouts.length ).toBe( 0 );
		var component = layout.root.getItemsById( 'componentA' )[ 0 ];
		browserPopout = component.popout();

		expect( browserPopout.getWindow().closed ).toBe( false );
		expect( layout.openPopouts.length ).toBe( 1 );
	});

	/**
	 * TODO This test doens't run since karma injects
	 * all sorts of stuff into the new window which throws errors
	 * before GoldenLayout can initialise...
	 */
	/* global xit */
	xit( 'serialises the new window', function(){
		expect( layout.openPopouts.length ).toBe( 1 );

		waitsFor(function(){
			return layout.openPopouts[ 0 ].isInitialised;
		});

		runs(function(){
			var config = layout.toConfig();
			expect( config.openPopouts.length ).toBe( 1 );
			expect( typeof config.openPopouts[ 0 ].left ).toBe( 'number');
			expect( typeof config.openPopouts[ 0 ].top ).toBe( 'number');
			expect( config.openPopouts[ 0 ].width > 0 ).toBe( true );
			expect( config.openPopouts[ 0 ].height > 0 ).toBe( true );
			expect( config.openPopouts[ 0 ].config.content[ 0 ].type ).toBe( 'component' );
		});
	});

	xit( 'closes the open window', function(){
		runs(function(){
			browserPopout.close();
		});

		waitsFor(function(){
			return browserPopout.getWindow().closed && 
				layout.openPopouts.length === 0;
		});
	});

	it( 'destroys the layout', function(){
		layout.destroy();
	});
});