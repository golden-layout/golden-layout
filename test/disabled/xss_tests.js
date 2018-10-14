describe( 'Basic XSS filtering is applied', function(){
	var filterFn = window.GoldenLayout.__lm.utils.filterXss;

	it( 'escapes tags', function(){
		var escapedString = filterFn( '>\'>"><img src=x onerror=alert(0)>' );
		expect( escapedString ).toBe( '&gt;\'&gt;"&gt;&lt;img src=x on&#101;rror=alert(0)&gt;' );
	});

	it( 'escapes javascript urls', function(){
		var escapedString = filterFn( 'javascript:alert("hi")' ); // jshint ignore:line
		expect( escapedString ).toBe( 'j&#97;va&#115;cript:alert("hi")' );
	});

	it( 'escapes expression statements', function(){
		var escapedString = filterFn( 'expression:alert("hi")' ); // jshint ignore:line
		expect( escapedString ).toBe( 'expr&#101;ssion:alert("hi")' );
	});

	it( 'escapes onload statements', function(){
		var escapedString = filterFn( 'onload=alert("hi")' ); // jshint ignore:line
		expect( escapedString ).toBe( 'onlo&#97;d=alert("hi")' );

		escapedString = filterFn( 'onLoad=alert("hi")' ); // jshint ignore:line
		expect( escapedString ).toBe( 'onlo&#97;d=alert("hi")' );
	});

	it( 'escapes onerror statements', function(){
		var escapedString = filterFn( 'onerror=alert("hi")' ); // jshint ignore:line
		expect( escapedString ).toBe( 'on&#101;rror=alert("hi")' );

		escapedString = filterFn( 'onError=alert("hi")' ); // jshint ignore:line
		expect( escapedString ).toBe( 'on&#101;rror=alert("hi")' );
	});
});