describe( 'Sets and retrieves a component\'s state', function() {

	var myLayout, myComponent;

	it( 'Can create a most basic layout', function() {
		runs(function(){
			myLayout = new window.GoldenLayout({
				content: [{
					type: 'component',
					componentName: 'testComponent',
					componentState: { testValue: 'initial' }
				}]
			});


			myLayout.registerComponent( 'testComponent', function( container, state ){
				this.container = container;
				this.state = state;
				myComponent = this;
			});

			myLayout.init();
		});
		
		waitsFor(function(){
			return myLayout.isInitialised;
		});

		runs(function(){
			expect( myComponent.state.testValue ).toBe( 'initial' );
		});
	});

	it( 'returns the initial state', function(){
		var config = myLayout.toConfig();
		expect( config.content[ 0 ].content[ 0 ].componentState.testValue ).toBe( 'initial' );
	});

	it( 'emits stateChanged when a component updates its state', function(){
		var stateChanges = 0;

		myLayout.on( 'stateChanged', function(){
			stateChanges++;
		});

		runs(function(){
			myComponent.container.setState({ testValue: 'updated' });
		});

		waitsFor(function(){
			return stateChanges !== 0;
		});

		runs(function(){
			expect( stateChanges ).toBe( 1 );
		});
	});

	it( 'returns the updated state', function(){
		var config = myLayout.toConfig();
		expect( config.content[ 0 ].content[ 0 ].componentState.testValue ).toBe( 'updated' );
	});

	it( 'Destroys the layout', function(){
		myLayout.destroy();
		expect( myLayout.root.contentItems.length ).toBe( 0 );
	});
});