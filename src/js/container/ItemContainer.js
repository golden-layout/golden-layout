lm.container.ItemContainer = function( config, parent, layoutManager ) {
	lm.utils.EventEmitter.call( this );

	this.width = null;
	this.height = null;
	this.title = config.componentName;
	this.parent = parent;
	this.layoutManager = layoutManager;
	this.isHidden = false;
	
	this._config = config;
	this._element = $([
		'<div class="lm_item_container">',
			'<div class="lm_content"></div>',
		'</div>'
	].join( '' ));
	
	this._contentElement = this._element.find( '.lm_content' );
};

lm.utils.copy( lm.container.ItemContainer.prototype, {

	/**
	 * Get the inner DOM element the container's content
	 * is intended to live in
	 *
	 * @returns {DOM element}
	 */
	getElement: function() {
		return this._contentElement;
	},
	
	/**
	 * Hide the container. Notifies the containers content first
	 * and then hides the DOM node. If the container is already hidden
	 * this should have no effect
	 *
	 * @returns {void}
	 */
	hide: function() {
		this.emit( 'hide' );
		this.isHidden = true;
		this._element.hide();
	},
	
	/**
	 * Shows a previously hidden container. Notifies the
	 * containers content first and then shows the DOM element.
	 * If the container is already visible this has no effect.
	 *
	 * @returns {void}
	 */
	show: function() {
		this.emit( 'show' );
		this.isHidden = false;
		this._element.show();
	},

	/**
	 * Set the size from within the container. Traverses up
	 * the item tree until it finds a row or column element
	 * and resizes its items accordingly.
	 *
	 * If this container isn't a descendant of a row or column
	 * it returns false
	 * @todo  Rework!!!
	 * @param {Number} width  The new width in pixel
	 * @param {Number} height The new height in pixel
	 * 
	 * @returns {Boolean} resizeSuccesful
	 */
	setSize: function( width, height ) {
		var rowOrColumn = this.parent,
			rowOrColumnChild = this,
			totalPixelHeight,
			percentageHeight,
			heightDelta,
			i;

		while( !rowOrColumn.isColumn && !rowOrColumn.isRow ) {
			rowOrColumnChild = rowOrColumn;
			rowOrColumn = rowOrColumn.parent;
			

			/**
			 * No row or column has been found
			 */
			if( rowOrColumn.isRoot ) {
				return false;
			}
		}

		totalPixelHeight = this.height * ( 1 / ( rowOrColumnChild.config.height / 100 ) );
		percentageHeight = ( height / totalPixelHeight ) * 100;
		heightDelta = ( rowOrColumnChild.config.height - percentageHeight ) / rowOrColumn.contentItems.length;

		for( i = 0; i < rowOrColumn.contentItems.length; i++ ) {
			if( rowOrColumn.contentItems[ i ] === rowOrColumnChild ) {
				rowOrColumn.contentItems[ i ].config.height = percentageHeight;
			} else {
				rowOrColumn.contentItems[ i ].config.height += heightDelta;
			}
		}

		rowOrColumn.callDownwards( 'setSize' );

		return true;
	},
	
	/**
	 * Closes the container if it is closable. Can be called by
	 * both the component within at as well as the contentItem containing
	 * it. Emits a close event before the container itself is closed.
	 *
	 * @returns {void}
	 */
	close: function() {
		if( this._config.isClosable ) {
			this.emit( 'close' );
			this.parent.close();
		}
	},

	/**
	 * Returns the current state object
	 *
	 * @returns {Object} state
	 */
	getState: function() {
		return this._config.componentState;
	},

	/**
	 * Merges the provided state into the current one
	 *
	 * @param   {Object} state
	 *
	 * @returns {void}
	 */
	extendState: function( state ) {
		this.setState( $.extend( true, this.getState(), state ) );
	},

	/**
	 * Notifies the layout manager of a stateupdate
	 *
	 * @param {serialisable} state
	 */
	setState: function( state ) {
		this._config.componentState = state;
		this.parent.emitBubblingEvent( 'stateChanged' );
	},

	/**
	 * Set's the components title
	 *
	 * @param {String} title
	 */
	setTitle: function( title ) {
		this.parent.setTitle( title );
	},

	/**
	 * Set's the containers size. Called by the container's component.
	 * To set the size programmatically from within the container please
	 * use the public setSize method
	 *
	 * @param {[Int]} width  in px
	 * @param {[Int]} height in px
	 * 
	 * @returns {void}
	 */
	_$setSize: function( width, height ) {
		if( width !== this.width || height !== this.height ) {
			this.width = width;
			this.height = height;
			this._contentElement.width( this.width ).height( this.height );
			this.emit( 'resize' );
		}
	}
});