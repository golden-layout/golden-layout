lm.items.Root = function( layoutManager, config, containerElement ) {
	lm.items.AbstractContentItem.call( this, layoutManager, config, null );
	this.isRoot = true;
	this.type = 'root';
	this.element = $( '<div class="lm_goldenlayout lm_item lm_root"></div>' );
	this.childElementContainer = this.element;
	this._containerElement = containerElement;
	this._containerElement.append( this.element );
};

lm.utils.extend( lm.items.Root, lm.items.AbstractContentItem );

lm.utils.copy( lm.items.Root.prototype, {
	addChild: function( contentItem ) {
		if( this.contentItems.length > 0 ) {
			throw new Error( 'Root node can only have a single child' );
		}

		contentItem = this.layoutManager._$normalizeContentItem( contentItem, this );
		this.childElementContainer.append( contentItem.element );
		lm.items.AbstractContentItem.prototype.addChild.call( this, contentItem );
		
		this.callDownwards( 'setSize' );
		this.emitBubblingEvent( 'stateChanged' );
	},

	setSize: function() {
		var width = this._containerElement.width(),
			height = this._containerElement.height();

		this.element.width( width );
		this.element.height( height );

		/*
		 * Root can be empty
		 */
		if( this.contentItems[ 0 ] ) {
			this.contentItems[ 0 ].element.width( width );
			this.contentItems[ 0 ].element.height( height );
		}
	},

	_$onDrop: function( contentItem ) {
		var stack;

		if( contentItem.isComponent === true ) {
			stack = this.layoutManager.createContentItem( {type: 'stack' }, this );
			stack.addChild( contentItem );
			this.addChild( stack );
		} else {
			this.addChild( contentItem );
		}
	}
});


