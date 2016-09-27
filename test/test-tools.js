
testTools = {};

testTools.createLayout = function( config ) {
	var myLayout = new window.GoldenLayout( config );

	myLayout.registerComponent( 'testComponent', testTools.TestComponent );

	myLayout.init();


	waitsFor(function(){
		return myLayout.isInitialised;
	});

	return myLayout;
};

testTools.TestComponent = function( container, state ){
	if ( state === undefined ) {
		container.getElement().html( 'that worked' );
	} else {
		container.getElement().html( state.html );
	}
	this.isTestComponentInstance = true;
};

/**
 * Takes a path of type.index.type.index, e.g.
 *
 * 'row.0.stack.1.component'
 *
 * and resolves it to an element
 *
 * @param   {String} path
 * @param   {GoldenLayout} layout
 * @param	{Function} expect Jasmine expect function
 *
 * @returns {AbstractContentItem}
 */
testTools.verifyPath = function( path, layout, expect ) {
	expect( layout.root ).toBeDefined();
	expect( layout.root.contentItems.length ).toBe( 1 );

	var pathSegments = path.split( '.' ),
		node = layout.root.contentItems[ 0 ],
		i;

	for( i = 0; i < pathSegments.length; i++ ) {
		
		if( isNaN( pathSegments[ i ] ) ) {
			expect( node.type ).toBe( pathSegments[ i ] );
		} else {
			node = node.contentItems[ parseInt( pathSegments[ i ], 10 ) ];

			expect( node ).toBeDefined();
			
			if( node === undefined ) {
				return null;
			}
		}
	}

	return node;
};