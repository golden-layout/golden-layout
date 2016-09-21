describe( 'the EventEmitter works', function(){
	var EmitterImplementor = function() {
		lm.utils.EventEmitter.call( this );
	};

	it( 'is possible to inherit from EventEmitter', function(){
		var myObject = new EmitterImplementor();
		expect( typeof myObject.on ).toBe( 'function' );
		expect( typeof myObject.unbind ).toBe( 'function' );
		expect( typeof myObject.trigger ).toBe( 'function' );
	});

	it( 'notifies callbacks', function(){
		var myObject = new EmitterImplementor();
		var myListener = { callback: function(){} };
		spyOn( myListener, 'callback' );
		expect( myListener.callback ).not.toHaveBeenCalled();
		myObject.on( 'someEvent', myListener.callback );
		expect( myListener.callback ).not.toHaveBeenCalled();
		myObject.emit( 'someEvent', 'Good', 'Morning' );
		expect( myListener.callback ).toHaveBeenCalledWith( 'Good', 'Morning' );
		expect(myListener.callback.calls.length).toEqual(1);
	});

	it( 'triggers an \'all\' event', function(){
		var myObject = new EmitterImplementor();
		var myListener = { callback: function(){}, allCallback: function(){} };
		spyOn( myListener, 'callback' );
		spyOn( myListener, 'allCallback' );

		myObject.on( 'someEvent', myListener.callback );
		myObject.on( lm.utils.EventEmitter.ALL_EVENT, myListener.allCallback );
		

		expect( myListener.callback ).not.toHaveBeenCalled();
		expect( myListener.allCallback ).not.toHaveBeenCalled();
		myObject.emit( 'someEvent', 'Good', 'Morning' );
		expect( myListener.callback ).toHaveBeenCalledWith( 'Good', 'Morning' );
		expect(myListener.callback.calls.length).toEqual(1);
		expect( myListener.allCallback ).toHaveBeenCalledWith( 'someEvent', 'Good', 'Morning' );
		expect(myListener.allCallback.calls.length).toEqual(1);

		myObject.emit( 'someOtherEvent', 123 );
		expect(myListener.callback.calls.length).toEqual(1);
		expect(myListener.allCallback ).toHaveBeenCalledWith( 'someOtherEvent', 123 );
		expect(myListener.allCallback.calls.length).toEqual(2);
	});

	it( 'triggers sets the right context', function(){
		var myObject = new EmitterImplementor();
		var context = null;
		var myListener = { callback: function(){
			context = this;
		}};

		myObject.on( 'someEvent', myListener.callback, {some: 'thing' } );
		expect( context ).toBe( null );
		myObject.emit( 'someEvent' );
		expect( context.some ).toBe( 'thing' );
	});

	it( 'unbinds events', function(){
		var myObject = new EmitterImplementor();
		var myListener = { callback: function(){}};
		spyOn( myListener, 'callback' );
		myObject.on( 'someEvent', myListener.callback );
		expect(myListener.callback.calls.length).toEqual(0);
		myObject.emit( 'someEvent' );
		expect(myListener.callback.calls.length).toEqual(1);
		myObject.unbind( 'someEvent', myListener.callback );
		myObject.emit( 'someEvent' );
		expect(myListener.callback.calls.length).toEqual(1);
	});

	it( 'unbinds all events if no context is provided', function(){
		var myObject = new EmitterImplementor();
		var myListener = { callback: function(){}};
		spyOn( myListener, 'callback' );
		myObject.on( 'someEvent', myListener.callback );
		expect(myListener.callback.calls.length).toEqual(0);
		myObject.emit( 'someEvent' );
		expect(myListener.callback.calls.length).toEqual(1);
		myObject.unbind( 'someEvent' );
		myObject.emit( 'someEvent' );
		expect(myListener.callback.calls.length).toEqual(1);
	});

	it( 'unbinds events for a specific context only', function(){
		var myObject = new EmitterImplementor();
		var myListener = { callback: function(){}};
		var contextA = { name: 'a' };
		var contextB = { name: 'b' };
		spyOn( myListener, 'callback' );
		myObject.on( 'someEvent', myListener.callback, contextA );
		myObject.on( 'someEvent', myListener.callback, contextB );
		expect(myListener.callback.calls.length).toEqual(0);
		myObject.emit( 'someEvent' );
		expect(myListener.callback.calls.length).toEqual(2);
		myObject.unbind( 'someEvent', myListener.callback, contextA );
		myObject.emit( 'someEvent' );
		expect(myListener.callback.calls.length).toEqual(3);
		myObject.unbind( 'someEvent', myListener.callback, contextB );
		myObject.emit( 'someEvent' );
		expect(myListener.callback.calls.length).toEqual(3);
	});

	it( 'throws an exception when trying to unsubscribe for a non existing method', function(){
		var myObject = new EmitterImplementor();
		var myListener = { callback: function(){}};

		myObject.on( 'someEvent', myListener.callback );

		expect(function(){
			myObject.unbind( 'someEvent', function(){} );
		}).toThrow();

		expect(function(){
			myObject.unbind( 'doesNotExist', myListener.callback );
		}).toThrow();

		expect(function(){
			myObject.unbind( 'someEvent', myListener.callback );
		}).not.toThrow();
	});
	
	it( 'throws an exception when attempting to bind a non-function', function() {
		var myObject = new EmitterImplementor();
		
		expect(function(){
			myObject.on( 'someEvent', 1 );
		}).toThrow();

		expect(function(){
			myObject.on( 'someEvent', undefined );
		}).toThrow();
		
		expect(function(){
			myObject.on( 'someEvent', {} );
		}).toThrow();
	});
});