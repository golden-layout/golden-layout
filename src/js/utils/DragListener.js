lm.utils.DragListener = function(eElement, nButtonCode)
{
	lm.utils.EventEmitter.call(this);

	this._eElement = $(eElement);
	this._oDocument = $(document);
	this._eBody = $(document.body);
	this._nButtonCode = nButtonCode || 0;

	/**
	* The delay after which to start the drag in milliseconds
	*/
	this._nDelay = 200;

	/**
	* The distance the mouse needs to be moved to qualify as a drag
	*/
	this._nDistance = 10;//TODO - works better with delay only

	this._nX = 0;
	this._nY = 0;

	this._nOriginalX = 0;
	this._nOriginalY = 0;

	this._bDragging = false;

	this._fMove = lm.utils.fnBind( this.onMouseMove, this );
	this._fUp = lm.utils.fnBind( this.onMouseUp, this );
	this._fDown = lm.utils.fnBind( this.onMouseDown, this );

	this._eElement.mousedown( this._fDown );
};

lm.utils.DragListener.timeout = null;

lm.utils.copy( lm.utils.DragListener.prototype, {
	destroy: function() {
		this._eElement.unbind( 'mousedown', this._fDown );
	},

	onMouseDown: function(oEvent)
	{
		oEvent.preventDefault();
		
		this._nOriginalX = oEvent.pageX;
		this._nOriginalY = oEvent.pageY;

		this._oDocument.on('mousemove', this._fMove);
		this._oDocument.one('mouseup', this._fUp);

		this._timeout = setTimeout( lm.utils.fnBind( this._startDrag, this ), this._nDelay );
	},

	onMouseMove: function(oEvent)
	{
		oEvent.preventDefault();

		this._nX = oEvent.pageX - this._nOriginalX;
		this._nY = oEvent.pageY - this._nOriginalY;

		if( this._bDragging === false ) {
			if(
				Math.abs( this._nX ) > this._nDistance ||
				Math.abs( this._nY ) > this._nDistance
			){
				clearTimeout( this._timeout );
				this._startDrag();
			}
		}

		if( this._bDragging )
		{
			this.emit('drag', this._nX, this._nY, oEvent );
		}
	},

	onMouseUp: function(oEvent)
	{
		clearTimeout( this._timeout );
		this._eBody.removeClass( 'lm_dragging' );
		this._oDocument.unbind( 'mousemove', this._fMove);
		
		if( this._bDragging === true )
		{
			this._bDragging = false;
			this.emit('dragStop', oEvent, this._nOriginalX + this._nX);
		}
	},

	_startDrag: function()
	{
		this._bDragging = true;
		this._eBody.addClass( 'lm_dragging' );
		this.emit('dragStart', this._nOriginalX, this._nOriginalY);
	}
});

