/**
 * This class represents a header above a Stack ContentItem.
 *
 * @param {lm.LayoutManager} layoutManager
 * @param {lm.item.AbstractContentItem} parent
 */
lm.controls.Header = function( layoutManager, parent ) {
	lm.utils.EventEmitter.call( this );

	this.layoutManager = layoutManager;
	this.element = $( lm.controls.Header._template );

	if( this.layoutManager.config.settings.selectionEnabled === true ) {
		this.element.addClass( 'lm_selectable' );
		this.element.click( lm.utils.fnBind( this._onHeaderClick, this ) );
	}
	
	this.element.height( layoutManager.config.dimensions.headerHeight );
	this.tabsContainer = this.element.find( '.lm_tabs' );
	this.controlsContainer = this.element.find( '.lm_controls' );
	this.parent = parent;
	this.parent.on( 'resize', this._updateTabSizes, this );
	this.tabs = [];
	this.activeContentItem = null;
	this.closeButton = null;

	this._createControls();
};

lm.controls.Header._template = [
	'<div class="lm_header">',
		'<ul class="lm_tabs"></ul>',
		'<ul class="lm_controls"></ul>',
	'</div>'
].join( '' );

lm.utils.copy( lm.controls.Header.prototype, {

	/**
	 * Creates a new tab and associates it with a contentItem
	 *
	 * @param	{lm.item.AbstractContentItem} contentItem
	 * @param	{Integer} index The position of the tab
	 *
	 * @returns {void}
	 */
	createTab: function( contentItem, index ) {
		var tab, i;

		//If there's already a tab relating to the
		//content item, don't do anything
		for( i = 0; i < this.tabs.length; i++ ) {
			if( this.tabs[ i ].contentItem === contentItem ) {
				return;
			}
		}

		tab = new lm.controls.Tab( this, contentItem );
		
		if( this.tabs.length === 0 ) {
			this.tabs.push( tab );
			this.tabsContainer.append( tab.element );
			return;
		}
	
		if( index === undefined ) {
			index = this.tabs.length;
		}
	
		if( index > 0 ) {
			this.tabs[ index - 1 ].element.after( tab.element );
		} else {
			this.tabs[ 0 ].element.before( tab.element );
		}
	
		this.tabs.splice( index, 0, tab );
		this._updateTabSizes();
	},

	/**
	 * Finds a tab based on the contentItem its associated with and removes it.
	 *
	 * @param	{lm.item.AbstractContentItem} contentItem
	 *
	 * @returns {void}
	 */
	removeTab: function( contentItem ) {
		for( var i = 0; i < this.tabs.length; i++ ) {
			if( this.tabs[ i ].contentItem === contentItem ) {
				this.tabs[ i ]._$destroy();
				this.tabs.splice( i, 1 );
				return;
			}
		}
	
		throw new Error( 'contentItem is not controlled by this header' );
	},
	
	/**
	 * The programmatical equivalent of clicking a Tab.
	 *
	 * @param {lm.item.AbstractContentItem} contentItem
	 */
	setActiveContentItem: function( contentItem ) {
		var i, isActive;

		for( i = 0; i < this.tabs.length; i++ ) {
			isActive = this.tabs[ i ].contentItem === contentItem;
			this.tabs[ i ].setActive( isActive );
			if( isActive === true ) {
				this.activeContentItem = contentItem;
				this.parent.config.activeItemIndex = i;
			}
		}

		this._updateTabSizes();
		this.parent.emitBubblingEvent( 'stateChanged' );
	},

	/**
	 * Programmatically set closability.
	 *
	 * @package private
	 * @param {Boolean} isClosable Whether to enable/disable closability.
	 *
	 * @returns {Boolean} Whether the action was successful
	 */
	_$setClosable: function( isClosable ) {
		if ( this.closeButton && this._isClosable() ) {
			this.closeButton.element[ isClosable ? "show" : "hide" ]();
			return true;
		}

		return false;
	},

	/**
	 * Destroys the entire header
	 *
	 * @package private
	 * 
	 * @returns {void}
	 */
	_$destroy: function() {
		this.emit( 'destroy' );
	
		for( var i = 0; i < this.tabs.length; i++ ) {
			this.tabs[ i ]._$destroy();
		}
	
		this.element.remove();
	},

	/**
	 * Creates the popout, maximise and close buttons in the header's top right corner
	 *
	 * @returns {void}
	 */
	_createControls: function() {
		var closeStack,
			popout,
			label,
			maximiseLabel,
			minimiseLabel,
			maximise,
			maximiseButton;

		/**
		 * Popout control to launch component in new window.
		 */
		if( this.layoutManager.config.settings.showPopoutIcon ) {
			popout = lm.utils.fnBind( this._onPopoutClick, this );
			label = this.layoutManager.config.labels.popout;
			new lm.controls.HeaderButton( this, label, 'lm_popout', popout );
		}

		/**
		 * Maximise control - set the component to the full size of the layout
		 */
		if( this.layoutManager.config.settings.showMaximiseIcon ) {
			maximise = lm.utils.fnBind( this.parent.toggleMaximise, this.parent );
			maximiseLabel = this.layoutManager.config.labels.maximise;
			minimiseLabel = this.layoutManager.config.labels.minimise;
			maximiseButton = new lm.controls.HeaderButton( this, maximiseLabel, 'lm_maximise', maximise );
			
			this.parent.on( 'maximised', function(){
				maximiseButton.element.attr( 'title', minimiseLabel );
			});

			this.parent.on( 'minimised', function(){
				maximiseButton.element.attr( 'title', maximiseLabel );
			});
		}

		/**
		 * Close button
		 */
		if( this._isClosable() ) {
			closeStack = lm.utils.fnBind( this.parent.remove, this.parent );
			label = this.layoutManager.config.labels.close;
			this.closeButton = new lm.controls.HeaderButton( this, label, 'lm_close', closeStack );
		}
	},

	/**
	 * Checks whether the header is closable based on the parent config and 
	 * the global config.
	 *
	 * @returns {Boolean} Whether the header is closable.
	 */
	_isClosable: function() {
		return this.parent.config.isClosable && this.layoutManager.config.settings.showCloseIcon;
	},

	_onPopoutClick: function() {
		if( this.layoutManager.config.settings.popoutWholeStack === true ) {
			this.parent.popout();
		} else {
			this.activeContentItem.popout();
		}
	},


	/**
	 * Invoked when the header's background is clicked (not it's tabs or controls)
	 *
	 * @param	{jQuery DOM event} event
	 *
	 * @returns {void}
	 */
	_onHeaderClick: function( event ) {
		if( event.target === this.element[ 0 ] ) {
			this.parent.select();
		}
	},

	/**
	 * Shrinks the tabs if the available space is not sufficient
	 *
	 * @returns {void}
	 */
	_updateTabSizes: function() {
		if( this.tabs.length === 0 ) {
			return;
		}
		
		var availableWidth = this.element.outerWidth() - this.controlsContainer.outerWidth(),
			totalTabWidth = 0,
			tabElement,
			i,
			marginLeft,
			gap;

		for( i = 0; i < this.tabs.length; i++ ) {
			tabElement = this.tabs[ i ].element;

			/*
			 * In order to show every tab's close icon, decrement the z-index from left to right
			 */
			tabElement.css( 'z-index', this.tabs.length - i );
			totalTabWidth += tabElement.outerWidth() + parseInt( tabElement.css( 'margin-right' ), 10 );
		}

		gap = ( totalTabWidth - availableWidth ) / ( this.tabs.length - 1 );

		for( i = 0; i < this.tabs.length; i++ ) {

			/*
			 * The active tab keeps it's original width
			 */
			if( !this.tabs[ i ].isActive && gap > 0 ) {
				marginLeft = '-' + Math.floor( gap )+ 'px';
			} else {
				marginLeft = '';
			}

			this.tabs[ i ].element.css( 'margin-left', marginLeft );
		}

		if( availableWidth < totalTabWidth ) {
			this.element.css( 'overflow', 'hidden' );
		} else {
			this.element.css( 'overflow', 'visible' );
		}
	}
});

