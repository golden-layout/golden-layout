describe( 'The layout can handle empty stacks', function(){

	var myLayout;

	it('Creates an initial layout', function(){
		myLayout = testTools.createLayout({
		content: [{
			type: 'row',
			content: [{
				type:'component',
				componentName: 'testComponent',
				componentState: { text: 'Component 1' }
			},{
				type:'component',
				componentName: 'testComponent',
				componentState: { text: 'Component 2' }
			},{
				isClosable: false,
				type: 'stack',
				content: []
			}]
		}]
		});
	});

	it( 'can manipulate the layout tree with an empty item present', function(){
		var row = myLayout.root.contentItems[ 0 ];
		expect( row.isRow ).toBe( true );

		row.addChild({
			type:'component',
			componentName: 'testComponent'
		});
	});

	it( 'can add children to the empty stack', function(){
		var stack = myLayout.root.contentItems[ 0 ].contentItems[ 2 ];
		expect( stack.isStack ).toBe( true );
		expect( stack.contentItems.length ).toBe( 0 );

		stack.addChild({
			type:'component',
			componentName: 'testComponent'
		});

		expect( stack.contentItems.length ).toBe( 1 );
	});

	it( 'destroys the layout', function(){
		myLayout.destroy();
	});
});