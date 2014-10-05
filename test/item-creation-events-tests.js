describe( 'emits events when items are created', function(){

	var layout, eventListener = window.jasmine.createSpyObj( 'eventListener', [
		'onItemCreated',
		'onStackCreated',
		'onComponentCreated',
		'onRowCreated',
		'onColumnCreated',
	]);

	it( 'creates a layout', function(){
		layout = new window.GoldenLayout({
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

		layout.registerComponent( 'testComponent', testTools.TestComponent );
	});

	it( 'registeres listeners', function(){
		expect( eventListener.onItemCreated ).not.toHaveBeenCalled();
		expect( eventListener.onStackCreated ).not.toHaveBeenCalled();
		expect( eventListener.onRowCreated ).not.toHaveBeenCalled();
		expect( eventListener.onColumnCreated ).not.toHaveBeenCalled();
		expect( eventListener.onComponentCreated ).not.toHaveBeenCalled();

		layout.on( 'itemCreated', eventListener.onItemCreated );
		layout.on( 'stackCreated', eventListener.onStackCreated );
		layout.on( 'rowCreated', eventListener.onRowCreated );
		layout.on( 'columnCreated', eventListener.onColumnCreated );
		layout.on( 'componentCreated', eventListener.onComponentCreated );

		layout.init();
	});

	it( 'has called listeners', function(){
		expect( eventListener.onItemCreated.calls.length ).toBe( 6 );
		expect( eventListener.onStackCreated.calls.length ).toBe( 2 );
		expect( eventListener.onRowCreated.calls.length ).toBe( 1 );
		expect( eventListener.onColumnCreated.calls.length ).toBe( 1 );
		expect( eventListener.onComponentCreated.calls.length ).toBe( 1 );
	});

	it( 'provided the right arguments', function(){
		expect( eventListener.onComponentCreated.mostRecentCall.args[0].type ).toEqual( 'component' );
		expect( eventListener.onStackCreated.mostRecentCall.args[0].type ).toEqual( 'stack' );
		expect( eventListener.onColumnCreated.mostRecentCall.args[0].type ).toEqual( 'column' );
		expect( eventListener.onRowCreated.mostRecentCall.args[0].type ).toEqual( 'row' );
	});

	it( 'destroys the layout', function(){
		layout.destroy();
	});
});