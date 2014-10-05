lm.utils.EventEmitter = function()
{
	this._mSubscriptions = { };
	this._mSubscriptions[ lm.utils.EventEmitter.ALL_EVENT ] = [];

	this.on = function( sEvent, fCallback, oContext )
	{
		if( !this._mSubscriptions[ sEvent ] )
		{
			this._mSubscriptions[ sEvent ] = [];
		}

		this._mSubscriptions[ sEvent ].push({ fn: fCallback, ctx: oContext });
	};

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

	this.off = this.unbind;
	//this.subscribe = this.on;
	this.trigger = this.emit;
};

lm.utils.EventEmitter.ALL_EVENT = '__all';