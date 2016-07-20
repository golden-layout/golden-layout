/**
 * An EventEmitter singleton that propagates events
 * across multiple windows. This is a little bit trickier since
 * windows are allowed to open childWindows in their own right
 *
 * This means that we deal with a tree of windows. Hence the rules for event propagation are:
 *
 * - Propagate events from this layout to both parents and children
 * - Propagate events from parent to this and children
 * - Propagate events from children to the other children (but not the emitting one) and the parent
 *
 * @constructor
 * 
 * @param {lm.LayoutManager} layoutManager
 */
lm.utils.EventHub = function( layoutManager ) {
	lm.utils.EventEmitter.call( this );
	this._layoutManager = layoutManager;
	this._dontPropagateToParent = null;
	this._childEventSource = null;
	this.on( lm.utils.EventEmitter.ALL_EVENT, lm.utils.fnBind( this._onEventFromThis, this ) );
	this._boundOnEventFromChild = lm.utils.fnBind( this._onEventFromChild, this );
	$(window).on( 'gl_child_event', this._boundOnEventFromChild );
};

/**
 * Called on every event emitted on this eventHub, regardles of origin.
 *
 * @private
 *
 * @param {Mixed}
 * 
 * @returns {void}
 */
lm.utils.EventHub.prototype._onEventFromThis = function() {
	var args = Array.prototype.slice.call( arguments );

	if( this._layoutManager.isSubWindow && args[ 0 ] !== this._dontPropagateToParent ) {
		this._propagateToParent( args );
	}
	this._propagateToChildren( args );

	//Reset
	this._dontPropagateToParent = null;
	this._childEventSource = null;
};

/**
 * Called by the parent layout.
 *
 * @param   {Array} args Event name + arguments
 *
 * @returns {void}
 */
lm.utils.EventHub.prototype._$onEventFromParent = function( args ) {
	this._dontPropagateToParent = args[ 0 ];
	this.emit.apply( this, args );
};

/**
 * Callback for child events raised on the window
 *
 * @param   {DOMEvent} event
 * @private
 *
 * @returns {void}
 */
lm.utils.EventHub.prototype._onEventFromChild = function( event ) {
	this._childEventSource = event.originalEvent.__gl;
	this.emit.apply( this, event.originalEvent.__glArgs );
};

/**
 * Propagates the event to the parent by emitting
 * it on the parent's DOM window
 *
 * @param   {Array} args Event name + arguments
 * @private
 *
 * @returns {void}
 */
lm.utils.EventHub.prototype._propagateToParent = function( args ) {
	var event,
		eventName = 'gl_child_event'; 

	if (document.createEvent) {
		event = window.opener.document.createEvent( 'HTMLEvents' );
		event.initEvent( eventName, true, true);
	} else {
		event = window.opener.document.createEventObject();
		event.eventType = eventName;
	}

	event.eventName = eventName;
	event.__glArgs = args;
	event.__gl = this._layoutManager;

	if (document.createEvent) {
		window.opener.dispatchEvent(event);
	} else {
		window.opener.fireEvent( 'on' + event.eventType, event );
	}
};

/**
 * Propagate events to children
 *
 * @param   {Array} args Event name + arguments
 * @private
 *
 * @returns {void}
 */
lm.utils.EventHub.prototype._propagateToChildren = function( args ) {
	var childGl, i;

	for( i = 0; i < this._layoutManager.openPopouts.length; i++ ) {
		childGl = this._layoutManager.openPopouts[ i ].getGlInstance();

		if( childGl !== this._childEventSource ) {
			childGl.eventHub._$onEventFromParent( args );
		}
	}
};


/**
 * Destroys the EventHub
 *
 * @public
 * @returns {void}
 */

lm.utils.EventHub.prototype.destroy = function() {
	$(window).off( 'gl_child_event', this._boundOnEventFromChild );
};