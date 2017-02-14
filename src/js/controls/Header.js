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
	this.tabDropdownContainer = this.element.find( '.lm_tabdropdown_list' );
	this.tabDropdownContainer.hide();
	this.controlsContainer = this.element.find( '.lm_controls' );
	this.parent = parent;
	this.parent.on( 'resize', this._updateTabSizes, this );
	this.tabs = [];
	this.activeContentItem = null;
	this.closeButton = null;
	this.tabDropdownButton = null;
	$(document).mouseup( lm.utils.fnBind( this._hideAdditionalTabsDropdown, this ) );

	this._lastVisibleTabIndex = -1;
	this._tabControlOffset = 10;
	this._createControls();
};

lm.controls.Header._template = [
	'<div class="lm_header">',
		'<ul class="lm_tabs"></ul>',
		'<ul class="lm_controls"></ul>',
	  '<ul class="lm_tabdropdown_list"></ul>',
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
		var i, j, isActive, activeTab;

		for( i = 0; i < this.tabs.length; i++ ) {
			isActive = this.tabs[ i ].contentItem === contentItem;
			this.tabs[ i ].setActive( isActive );
			if( isActive === true ) {
				this.activeContentItem = contentItem;
				this.parent.config.activeItemIndex = i;
			}
		}

	  /**
		 * If the tab selected was in the dropdown, move everything down one to make way for this one to be the first.
		 * This will make sure the most used tabs stay visible.
		 */
		if (this._lastVisibleTabIndex !== -1 && this.parent.config.activeItemIndex > this._lastVisibleTabIndex) {
			activeTab = this.tabs[this.parent.config.activeItemIndex];
			for (j = this.parent.config.activeItemIndex; j > 0; j--) {
				this.tabs[j] = this.tabs[j - 1];
			}
			this.tabs[0] = activeTab;
			this.parent.config.activeItemIndex = 0;
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
		this.emit( 'destroy', this );
	
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
			maximiseButton,
			tabDropdownLabel,
			showTabDropdown;

		/**
		* Dropdown to show additional tabs.
		*/
		showTabDropdown = lm.utils.fnBind( this._showAdditionalTabsDropdown, this );
		tabDropdownLabel = this.layoutManager.config.labels.tabDropdown;
		this.tabDropdownButton = new lm.controls.HeaderButton( this, tabDropdownLabel, 'lm_tabdropdown', showTabDropdown );
		this.tabDropdownButton.element.hide();

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
	  * Shows drop down for additional tabs when there are too many to display.
	  * 
	  * @returns {void} 
	  */
	 _showAdditionalTabsDropdown: function() {
	   this.tabDropdownContainer.show();
	 },

	 /**
	  * Hides drop down for additional tabs when there are too many to display.
	  * 
	  * @returns {void} 
	  */
	 _hideAdditionalTabsDropdown: function(e) {
	   this.tabDropdownContainer.hide();
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
	 * Pushes the tabs to the tab dropdown if the available space is not sufficient
	 * 
	 * @returns {void}
	 */
	_updateTabSizes: function() {
		if( this.tabs.length === 0 ) {
			return;
		}
		
		var availableWidth = this.element.outerWidth() - this.controlsContainer.outerWidth() - this._tabControlOffset,
			totalTabWidth = 0,
			tabElement,
			i,
			showTabDropdown,
		  swapTab,
			tabWidth,
		  hasVisibleTab = false;

		this._lastVisibleTabIndex = -1;

		for( i = 0; i < this.tabs.length; i++ ) {
			tabElement = this.tabs[ i ].element;

			/*
			 * Retain tab width when hidden so it can be restored.
			 */
			tabWidth = tabElement.data('lastTabWidth');
			if (!tabWidth) {
				tabWidth = tabElement.outerWidth() + parseInt(tabElement.css('margin-right'), 10);
			}

			totalTabWidth += tabWidth;

			// If the tab won't fit, put it in the dropdown for tabs, making sure there is always at least one tab visible.
			if (totalTabWidth > availableWidth && hasVisibleTab) {
				tabElement.data('lastTabWidth', tabWidth);
				this.tabDropdownContainer.append(tabElement);
			}
			else {
				hasVisibleTab = true;
				this._lastVisibleTabIndex = i;
				tabElement.removeData('lastTabWidth');
			  this.tabsContainer.append(tabElement);
			}
		}

		/*
		* Show the tab dropdown icon if not all tabs fit.
		*/
		showTabDropdown = totalTabWidth > availableWidth;
		this.tabDropdownButton.element[showTabDropdown ? 'show' : 'hide']();
	}
});

