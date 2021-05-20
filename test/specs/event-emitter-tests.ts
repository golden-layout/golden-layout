import { EventEmitter } from '../..';

describe( 'the EventEmitter', function(){

	class EmitterImplementor extends EventEmitter {}

	it( 'can be extended', function(){
		const myObject = new EmitterImplementor();
		expect( typeof myObject.on ).toBe( 'function' );
		expect( typeof myObject.unbind ).toBe( 'function' );
		expect( typeof myObject.trigger ).toBe( 'function' );
	});

	it( 'notifies callbacks', function(){
		const myObject = new EmitterImplementor();
		const myListener: { newTitleCallback: (newTitle: string) => void} =
			{ newTitleCallback: () => void 0 };
		const callbackSpy = spyOn( myListener, 'newTitleCallback' );
		expect( myListener.newTitleCallback ).not.toHaveBeenCalled();
		myObject.on( 'titleChanged', myListener.newTitleCallback );
		expect( myListener.newTitleCallback ).not.toHaveBeenCalled();
		myObject.emit( 'titleChanged', 'Good Morning' );
		expect( myListener.newTitleCallback ).toHaveBeenCalledWith( 'Good Morning' );
		expect(callbackSpy.calls.count()).toEqual(1);
	});

	it( 'triggers an \'all\' event', function(){
		const myObject = new EmitterImplementor();
		const myListener: {
			newTitleCallback: (newTitle: string) => void,
			allCallback: (...args: unknown[]) => void
		} = {
			newTitleCallback: () => void 0,
			allCallback: () => void 0
		}
		const titleCallbackSpy = spyOn( myListener, 'newTitleCallback' );
		const allCallbackSpy = spyOn( myListener, 'allCallback' );

		myObject.on( 'titleChanged', myListener.newTitleCallback );
		myObject.on( EventEmitter.ALL_EVENT, myListener.allCallback );
		

		expect(myListener.newTitleCallback ).not.toHaveBeenCalled();
		expect(myListener.allCallback ).not.toHaveBeenCalled();
		myObject.emit( 'titleChanged', 'Good Morning' );
		expect(myListener.newTitleCallback ).toHaveBeenCalledWith( 'Good Morning' );
		expect(titleCallbackSpy.calls.count()).toEqual(1);
		expect(myListener.allCallback ).toHaveBeenCalledWith('titleChanged', 'Good Morning');
		expect(allCallbackSpy.calls.count()).toEqual(1);

		myObject.emit( 'dragStart', 123, 456 );
		expect(titleCallbackSpy.calls.count()).toEqual(1);
		expect(myListener.allCallback ).toHaveBeenCalledWith('dragStart', 123, 456);
		expect(allCallbackSpy.calls.count()).toEqual(2);
	});

	it( 'unbinds events', function(){
		const myObject = new EmitterImplementor();
		const myListener: { titleCallback: () => void} = { titleCallback: () => void 0};
		const titleCallbackSpy = spyOn( myListener, 'titleCallback' );
		myObject.on( 'titleChanged', myListener.titleCallback );
		expect(titleCallbackSpy.calls.count()).toEqual(0);
		myObject.emit( 'titleChanged', 'new title' );
		expect(titleCallbackSpy.calls.count()).toEqual(1);
		myObject.unbind( 'titleChanged', myListener.titleCallback );
		myObject.emit( 'titleChanged', 'new title' );
		expect(titleCallbackSpy.calls.count()).toEqual(1);
	});

	it( 'throws an exception when trying to unsubscribe for a non existing method', function(){
		const myObject = new EmitterImplementor();
		const myListener: { callback: () => void} = { callback: () => void 0};

		myObject.on( 'titleChanged', myListener.callback );

		expect(function(){
			myObject.unbind( 'titleChanged', () => void 0 );
		}).toThrow();

		expect(function(){
			myObject.unbind( 'doesNotExist' as unknown as 'titleChanged', myListener.callback );
		}).toThrow();

		expect(function(){
			myObject.unbind( 'titleChanged', myListener.callback );
		}).not.toThrow();
	});
	
});
