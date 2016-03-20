on( eventName, callback, context )
----------------------------------------
argument: eventName
type: String
optional: false
desc: The name of the event to describe to

argument: callback
type: Function
optional: false
desc: The function that should be invoked when the event occurs

argument: context
type: Object
optional: true
desc: The value of the `this` pointer in the callback function

Subscribe to an event

emit( eventName, arg1, arg2, ...argN )
----------------------------------------
argument: eventName
type: String
optional: false
desc: The name of the event to emit

Notify listeners of an event and pass arguments along

trigger( eventName, arg1, arg2, ...argN )
----------------------------------------
Alias for `emit`

unbind( eventName, callback, context )
----------------------------------------
argument: eventName
type: String
optional: false
desc: The name of the event to unsubscribe from

argument: callback
type: Function
optional: true
desc: The function that should be invoked when the event occurs

argument: context
type: Object
optional: true
desc: The value of the `this` pointer in the callback function

Unsubscribes either all listeners if just an eventName is provided, just a specific callback
if invoked with eventName and callback or just a specific callback with a specific context if invoked
with all three arguments.

off( eventName, callback, context )
----------------------------------------
Alias for `unbind`

</div>