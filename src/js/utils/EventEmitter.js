/**
 * A generic and very fast EventEmitter
 * implementation. On top of emitting the
 * actual event it emits an
 *
 * lm.utils.EventEmitter.ALL_EVENT
 *
 * event for every event triggered. This allows
 * to hook into it and proxy events forwards
 *
 * @constructor
 */
lm.utils.EventEmitter = function() {
	this._mSubscriptions = {};
	this._mSubscriptions[ lm.utils.EventEmitter.ALL_EVENT ] = [];

	/**
	 * Listen for events
	 *
	 * @param   {String} sEvent    The name of the event to listen to
	 * @param   {Function} fCallback The callback to execute when the event occurs
	 * @param   {[Object]} oContext The value of the this pointer within the callback function
	 *
	 * @returns {void}
	 */
	this.on = function( sEvent, fCallback, oContext ) {
		if( !lm.utils.isFunction( fCallback ) ) {
			throw new Error( 'Tried to listen to event ' + sEvent + ' with non-function callback ' + fCallback );
		}

		if( !this._mSubscriptions[ sEvent ] ) {
			this._mSubscriptions[ sEvent ] = [];
		}

		this._mSubscriptions[ sEvent ].push( { fn: fCallback, ctx: oContext } );
	};

	/**
	 * Emit an event and notify listeners
	 *
	 * @param   {String} sEvent The name of the event
	 * @param    {Mixed}  various additional arguments that will be passed to the listener
	 *
	 * @returns {void}
	 */
	this.emit = function( sEvent ) {
		var i, ctx, args;

		args = Array.prototype.slice.call( arguments, 1 );

		var subs = this._mSubscriptions[ sEvent ];

		if( subs ) {
        	subs = subs.slice();
			for( i = 0; i < subs.length; i++ ) {
				ctx = subs[ i ].ctx || {};
                subs[ i ].fn.apply( ctx, args );
			}
		}

		args.unshift( sEvent );

		var allEventSubs = this._mSubscriptions[ lm.utils.EventEmitter.ALL_EVENT ].slice()

		for( i = 0; i <allEventSubs.length; i++ ) {
			ctx = allEventSubs[ i ].ctx || {};
            allEventSubs[ i ].fn.apply( ctx, args );
		}
	};

	/**
	 * Removes a listener for an event, or all listeners if no callback and context is provided.
	 *
	 * @param   {String} sEvent    The name of the event
	 * @param   {Function} fCallback The previously registered callback method (optional)
	 * @param   {Object} oContext  The previously registered context (optional)
	 *
	 * @returns {void}
	 */
	this.unbind = function( sEvent, fCallback, oContext ) {
		if( !this._mSubscriptions[ sEvent ] ) {
			throw new Error( 'No subscribtions to unsubscribe for event ' + sEvent );
		}

		var i, bUnbound = false;

		for( i = 0; i < this._mSubscriptions[ sEvent ].length; i++ ) {
			if
			(
				( !fCallback || this._mSubscriptions[ sEvent ][ i ].fn === fCallback ) &&
				( !oContext || oContext === this._mSubscriptions[ sEvent ][ i ].ctx )
			) {
				this._mSubscriptions[ sEvent ].splice( i, 1 );
				bUnbound = true;
			}
		}

		if( bUnbound === false ) {
			throw new Error( 'Nothing to unbind for ' + sEvent );
		}
	};

	/**
	 * Alias for unbind
	 */
	this.off = this.unbind;

	/**
	 * Alias for emit
	 */
	this.trigger = this.emit;
};

/**
 * The name of the event that's triggered for every other event
 *
 * usage
 *
 * myEmitter.on( lm.utils.EventEmitter.ALL_EVENT, function( eventName, argsArray ){
 * 	//do stuff
 * });
 *
 * @type {String}
 */
lm.utils.EventEmitter.ALL_EVENT = '__all';