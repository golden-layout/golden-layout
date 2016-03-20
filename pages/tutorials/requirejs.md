Using GoldenLayout with RequireJS
========================================
Like most modern libraries, GoldenLayout uses UMD (Universal Module Definition) to ensure compatibility with AMD / RequireJS and CommonJS alike. This means that when it comes to using it with RequireJS, there really isn't much to it.

### jQuery
GoldenLayout depends on jQuery. When requiring GoldenLayout it in turn will require `'jquery'` (all lowercase) which is the name that jQuery registeres itself under as a named module. So all that's left is telling RequireJS where this model can be found, e.g. like this:

	requirejs.config({
		paths: {
			'jquery': 'lib/jquery'
		}
	});

And that's it. Now you can require GoldenLayout and your components and start it, e.g. like that:

	requirejs.config({
		baseUrl: '../js',
		paths: {
			'jquery': 'lib/jquery'
		}
	});

	require( [ 'lib/goldenlayout', 'src/TestComponent' ], 
		function( GoldenLayout, TestComponent ){
		
		var myLayout = new GoldenLayout({
			content:[{
				type: 'row',
				content: [{
					type: 'component',
					componentName: 'testComponent',
					componentState: { title: 'First Item' }
				},{
					type: 'component',
					componentName: 'testComponent',
					componentState: { title: 'Second Item' }
				}]
			}]
		});

		myLayout.registerComponent( 'testComponent', TestComponent );
		myLayout.init();
	});
