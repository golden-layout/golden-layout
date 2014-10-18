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
lm.utils.EventEmitter = function()
{
	this._mSubscriptions = { };
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
	this.on = function( sEvent, fCallback, oContext )
	{
		if( !this._mSubscriptions[ sEvent ] )
		{
			this._mSubscriptions[ sEvent ] = [];
		}

		this._mSubscriptions[ sEvent ].push({ fn: fCallback, ctx: oContext });
	};

	/**
	 * Emit an event and notify listeners
	 *
	 * @param   {String} sEvent The name of the event
	 * @param 	{Mixed}  various additional arguments that will be passed to the listener
	 *
	 * @returns {void}
	 */
	this.emit = function( sEvent )
	{
		var i, ctx, args;

		args = Array.prototype.slice.call( arguments, 1 );
		
		if( this._mSubscriptions[ sEvent ] ) {
			for( i = 0; i < this._mSubscriptions[ sEvent ].length; i++ )
			{
				ctx = this._mSubscriptions[ sEvent ][ i ].ctx || {};
				this._mSubscriptions[ sEvent ][ i ].fn.apply( ctx, args );
			}
		}
		
		args.unshift( sEvent );

		for( i = 0; i < this._mSubscriptions[ lm.utils.EventEmitter.ALL_EVENT ].length; i++ )
		{
			ctx = this._mSubscriptions[ lm.utils.EventEmitter.ALL_EVENT ][ i ].ctx || {};
			this._mSubscriptions[ lm.utils.EventEmitter.ALL_EVENT ][ i ].fn.apply( ctx, args );
		}
	};

	/**
	 * Removes a listener for an event
	 *
	 * @param   {String} sEvent    The name of the event
	 * @param   {Function} fCallback The previously registered callback method
	 * @param   {Object} oContext  The previously registered context
	 *
	 * @returns {void}
	 */
	this.unbind = function( sEvent, fCallback, oContext )
	{
		if( !this._mSubscriptions[ sEvent ] ) {
			throw new Error( 'No subscribtions to unsubscribe for event ' + sEvent );
		}

		var i, bUnbound = false;

		for( i = 0; i < this._mSubscriptions[ sEvent ].length; i++ )
		{
			if
			(
				this._mSubscriptions[ sEvent ][ i ].fn === fCallback &&
				( !oContext || oContext === this._mSubscriptions[ sEvent ][ i ].ctx )
			)
			{
				this._mSubscriptions[ sEvent ].splice( i, 1 );
				bUnbound = true;
			}
		}

		if( bUnbound === false )
		{
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