describe( 'The layout can be manipulated at runtime', function(){

	var myLayout;

	it('Creates an initial layout', function(){
		myLayout = testTools.createLayout({
			content: [{
				type: 'component',
				componentName: 'testComponent'
			}]
		});
	});

	it( 'has the right initial structure', function(){
		testTools.verifyPath( 'stack.0.component', myLayout, expect );
	});

	it( 'adds a child to the stack', function(){
		myLayout.root.contentItems[ 0 ].addChild({
			type: 'component',
			componentName: 'testComponent'
		});

		expect( myLayout.root.contentItems[ 0 ].contentItems.length ).toBe( 2 );
		testTools.verifyPath( 'stack.1.component', myLayout, expect );
	});

	it( 'replaces a component with a row of components', function(){

		var oldChild = myLayout.root.contentItems[ 0 ].contentItems[ 1 ];
		var newChild = {
			type: 'row',
			content: [{
				type: 'component',
				componentName: 'testComponent'
			},
			{
				type: 'component',
				componentName: 'testComponent'
			}]
		};

		myLayout.root.contentItems[ 0 ].replaceChild( oldChild, newChild );

		testTools.verifyPath( 'stack.1.row.0.stack.0.component', myLayout, expect );
		testTools.verifyPath( 'stack.1.row.1.stack.0.component', myLayout, expect );
	});

	it( 'Has setup parents correctly', function(){
		var component = testTools.verifyPath( 'stack.1.row.1.stack.0.component', myLayout, expect );
		expect( component.isComponent ).toBe( true );
		expect( component.parent.isStack ).toBe( true );
		expect( component.parent.parent.isRow ).toBe( true );
		expect( component.parent.parent.parent.isStack ).toBe( true );
		expect( component.parent.parent.parent.parent.isRoot ).toBe( true );
	});

	it( 'Destroys a component and its parent', function(){
		var stack = testTools.verifyPath( 'stack.1.row.1.stack', myLayout, expect );
		expect( stack.contentItems.length ).toBe( 1 );
		stack.contentItems[ 0 ].remove();
		expect( stack.contentItems.length ).toBe( 0 );
	});
});