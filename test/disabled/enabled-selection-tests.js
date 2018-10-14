describe( 'content items are abled to to emit events that bubble up the tree', function(){

	var layout, selectionChangedSpy, stackA, stackB;

	it( 'creates a layout', function(){
		layout = testTools.createLayout({
			settings:{
				selectionEnabled: true
			},
			content: [{
				type: 'stack',
				content: [{
					type: 'column',
					content:[{
						type: 'component',
						componentName: 'testComponent',
						id: 'test'
					},
					{
						type: 'component',
						componentName: 'testComponent',
						id: 'test'
					}]
				},{
					type: 'row'
				}]
			}]
		});
		expect( layout.isInitialised ).toBe( true );
		testTools.verifyPath( 'stack.0.column.0.stack.0.component', layout, expect );
		testTools.verifyPath( 'stack.1.row', layout, expect );
	});

	it( 'attaches event listeners and retrieves stacks', function(){

		var components = layout.root.getItemsById( 'test' );

		expect( components.length ).toBe( 2 );

		stackA = components[ 0 ].parent;
		stackB = components[ 1 ].parent;

		expect( stackA.type ).toBe( 'stack' );
		expect( stackB.type ).toBe( 'stack' );

		selectionChangedSpy = window.jasmine.createSpyObj( 'selectionChanged', ['onselectionChanged'] );
	
		layout.on( 'selectionChanged', selectionChangedSpy.onselectionChanged );
	});

	it( 'clicks a header and it selects a stack', function(){
		var headerElement = stackA.element.find( '.lm_header' );
		expect( headerElement.length ).toBe( 1 );
		expect( selectionChangedSpy.onselectionChanged.calls.length ).toBe( 0 );
		expect( layout.selectedItem ).toBe( null );
		expect( headerElement.hasClass( 'lm_selectable' ) ).toBe( true );
		expect( stackA.element.hasClass( 'lm_selected' ) ).toBe( false );

		headerElement.trigger( 'click' );

		expect( selectionChangedSpy.onselectionChanged.calls.length ).toBe( 1 );
		expect( layout.selectedItem ).toBe( stackA );
		expect( stackA.element.hasClass( 'lm_selected' ) ).toBe( true );
	});

	it( 'clicks changes selection', function(){
		var headerElement = stackB.element.find( '.lm_header' );
		expect( headerElement.length ).toBe( 1 );
		expect( selectionChangedSpy.onselectionChanged.calls.length ).toBe( 1 );
		expect( layout.selectedItem ).toBe( stackA );
		expect( headerElement.hasClass( 'lm_selectable' ) ).toBe( true );
		expect( stackA.element.hasClass( 'lm_selected' ) ).toBe( true );

		headerElement.trigger( 'click' );

		expect( selectionChangedSpy.onselectionChanged.calls.length ).toBe( 2 );
		expect( layout.selectedItem ).toBe( stackB );
		expect( stackA.element.hasClass( 'lm_selected' ) ).toBe( false );
		expect( stackB.element.hasClass( 'lm_selected' ) ).toBe( true );
	});

	it( 'changes selection programatically', function(){
		var headerElement = stackA.element.find( '.lm_header' );
		expect( headerElement.length ).toBe( 1 );
		expect( selectionChangedSpy.onselectionChanged.calls.length ).toBe( 2 );
		expect( layout.selectedItem ).toBe( stackB );
		expect( headerElement.hasClass( 'lm_selectable' ) ).toBe( true );
		expect( stackA.element.hasClass( 'lm_selected' ) ).toBe( false );

		layout.selectItem( stackA );

		expect( selectionChangedSpy.onselectionChanged.calls.length ).toBe( 4 );
		expect( layout.selectedItem ).toBe( stackA );
		expect( stackA.element.hasClass( 'lm_selected' ) ).toBe( true );
		expect( stackB.element.hasClass( 'lm_selected' ) ).toBe( false );
	});

	it( 'destroys the layout', function(){
		layout.destroy();
	});
});