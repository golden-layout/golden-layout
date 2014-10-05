describe('It creates and extends config segments correctly', function(){

	it( 'doesn\'t change the default config when calling extend', function(){
		var createConfig = window.GoldenLayout.prototype._createConfig;
		
		expect( createConfig({}).dimensions.borderWidth ).toBe( 5 );

		var myConfig = createConfig({
			dimensions:{
				borderWidth: 10
			}
		});

		expect( myConfig ).not.toEqual( createConfig({}) );
		expect( createConfig({}).dimensions.borderWidth ).toBe( 5 );
		expect( myConfig.dimensions.borderWidth ).toBe( 10 );

	});

});