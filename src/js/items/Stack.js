lm.items.Stack = function( layoutManager, config, parent ) {
	lm.items.AbstractContentItem.call( this, layoutManager, config, parent );

	this.element = $( '<div class="lm_item lm_stack"></div>' );
	this._activeContentItem = null;

	this._dropZones = {};
	this._dropSegment = null;
	this._contentAreaDimensions = null;
	this._dropIndex = null;

	this.isStack = true;

	this.childElementContainer = $( '<div class="lm_items"></div>' );
	this.header = new lm.controls.Header( layoutManager, this );

	if( layoutManager.config.settings.hasHeaders === true ) {
		this.element.append( this.header.element );
	}

	this.element.append( this.childElementContainer );
	this._$validateClosability();
};

lm.utils.extend( lm.items.Stack, lm.items.AbstractContentItem );

lm.utils.copy( lm.items.Stack.prototype, {

	setSize: function() {
		var i,
			contentWidth = this.element.width(),
			contentHeight = this.element.height() - this.layoutManager.config.dimensions.headerHeight;

		this.childElementContainer.width( contentWidth );
		this.childElementContainer.height( contentHeight );

		for( i = 0; i < this.contentItems.length; i++ ) {
			this.contentItems[ i ].element.width( contentWidth ).height( contentHeight );
		}
		this.emit( 'resize' );
		this.emitBubblingEvent( 'stateChanged' );
	},

	_$init: function() {
		var i, initialItem;

		if( this.isInitialised === true ) return;

		lm.items.AbstractContentItem.prototype._$init.call( this );

		for( i = 0; i < this.contentItems.length; i++ ) {
			this.header.createTab( this.contentItems[ i ] );
			this.contentItems[ i ]._$hide();
		}

		if( this.contentItems.length > 0 ) {
			initialItem = this.contentItems[ this.config.activeItemIndex || 0 ];

			if( !initialItem ) {
				throw new Error( 'Configured activeItemIndex out of bounds' );
			}
			
			this.setActiveContentItem( initialItem );
		}
	},

	setActiveContentItem: function( contentItem ) {
		if( lm.utils.indexOf( contentItem, this.contentItems ) === -1 ) {
			throw new Error( 'contentItem is not a child of this stack' );
		}

		if( this._activeContentItem !== null ) {
			this._activeContentItem._$hide();
		}

		this._activeContentItem = contentItem;
		this.header.setActiveContentItem( contentItem );
		contentItem._$show();
		this.emit( 'activeContentItemChanged', contentItem );
		this.emitBubblingEvent( 'stateChanged' );
	},

	getActiveContentItem: function() {
		return this.header.activeContentItem;
	},

	addChild: function( contentItem, index ) {
		contentItem = this.layoutManager._$normalizeContentItem( contentItem, this );
		lm.items.AbstractContentItem.prototype.addChild.call( this, contentItem, index );
		this.childElementContainer.append( contentItem.element );
		this.header.createTab( contentItem, index );
		this.setActiveContentItem( contentItem );
		this.callDownwards( 'setSize' );
		this._$validateClosability();
		this.emitBubblingEvent( 'stateChanged' );
	},

	removeChild: function( contentItem, keepChild ) {
		var index = lm.utils.indexOf( contentItem, this.contentItems );
		lm.items.AbstractContentItem.prototype.removeChild.call( this, contentItem, keepChild );
		this.header.removeTab( contentItem );
		
		if( this.contentItems.length > 0 ) {
			this.setActiveContentItem( this.contentItems[ Math.max( index -1 , 0 ) ] );
		} else {
			this._activeContentItem = null;
		}
		
		this._$validateClosability();
		this.emitBubblingEvent( 'stateChanged' );
	},

	/**
	 * Validates that the stack is still closable or not. If a stack is able
	 * to close, but has a non closable component added to it, the stack is no
	 * longer closable until all components are closable.
	 *
	 * @returns {void}
	 */
	_$validateClosability: function() {
		var contentItem,
			isClosable,
			len,
			i;

		isClosable = this.header._isClosable();

		for ( i = 0, len = this.contentItems.length; i < len; i++ ) {
			if (!isClosable) { 
				break; 
			}

			isClosable = this.contentItems[ i ].config.isClosable;
		}

		this.header._$setClosable( isClosable );
	},

	_$destroy: function() {
		lm.items.AbstractContentItem.prototype._$destroy.call( this );
		this.header._$destroy();
	},


	/**
	 * Ok, this one is going to be the tricky one: The user has dropped {contentItem} onto this stack.
	 *
	 * It was dropped on either the stacks header or the top, right, bottom or left bit of the content area
	 * (which one of those is stored in this._dropSegment). Now, if the user has dropped on the header the case
	 * is relatively clear: We add the item to the existing stack... job done (might be good to have 
	 * tab reordering at some point, but lets not sweat it right now)
	 *
	 * If the item was dropped on the content part things are a bit more complicated. If it was dropped on either the
	 * top or bottom region we need to create a new column and place the items accordingly. 
	 * Unless, of course if the stack is already within a column... in which case we want 
	 * to add the newly created item to the existing column... 
	 * either prepend or append it, depending on wether its top or bottom.
	 *
	 * Same thing for rows and left / right drop segments... so in total there are 9 things that can potentially happen
	 * (left, top, right, bottom) * is child of the right parent (row, column) + header drop
	 * 
	 * @param	{lm.item} contentItem
	 *
	 * @returns {void}
	 */
	_$onDrop: function( contentItem ) {

		/*
		 * The item was dropped on the header area. Just add it as a child of this stack and
		 * get the hell out of this logic
		 */
		if( this._dropSegment === 'header' ) {
			this._resetHeaderDropZone();
			this.addChild( contentItem, this._dropIndex );
			return;
		}

		/*
		 * The stack is empty. Let's just add the element.
		 */
		if( this._dropSegment === 'body' ) {
			this.addChild( contentItem );
			return;
		}

		/*
		 * The item was dropped on the top-, left-, bottom- or right- part of the content. Let's
		 * aggregate some conditions to make the if statements later on more readable
		 */
		var isVertical = this._dropSegment === 'top' || this._dropSegment === 'bottom',
			isHorizontal = this._dropSegment === 'left' || this._dropSegment === 'right',
			insertBefore = this._dropSegment === 'top' || this._dropSegment === 'left',
			hasCorrectParent = ( isVertical && this.parent.isColumn ) || ( isHorizontal && this.parent.isRow ),
			type = isVertical ? 'column' : 'row',
			dimension = isVertical ? 'height' : 'width',
			index,
			stack,
			rowOrColumn;

		/*
		 * The content item can be either a component or a stack. If it is a component, wrap it into a stack
		 */
		if( contentItem.isComponent ) {
			stack = this.layoutManager.createContentItem({ type: 'stack' }, this );
			stack._$init();
			stack.addChild( contentItem );
			contentItem = stack;
		}

		/*
		 * If the item is dropped on top or bottom of a column or left and right of a row, it's already
		 * layd out in the correct way. Just add it as a child
		 */
		if( hasCorrectParent ) {
			index = lm.utils.indexOf( this, this.parent.contentItems );
			this.parent.addChild( contentItem, insertBefore ? index : index + 1, true );
			this.config[ dimension ] *= 0.5;
			contentItem.config[ dimension ] = this.config[ dimension ];
			this.parent.callDownwards( 'setSize' );
		/*
		 * This handles items that are dropped on top or bottom of a row or left / right of a column. We need
		 * to create the appropriate contentItem for them to live in
		 */
		} else {
			type = isVertical ? 'column' : 'row';
			rowOrColumn = this.layoutManager.createContentItem({ type: type }, this );
			this.parent.replaceChild( this, rowOrColumn );

			rowOrColumn.addChild( contentItem, insertBefore ? 0 : undefined, true );
			rowOrColumn.addChild( this, insertBefore ? undefined : 0, true );

			this.config[ dimension ] = 50;
			contentItem.config[ dimension ] = 50;
			rowOrColumn.callDownwards( 'setSize' );
		}
	},

	/**
	 * If the user hovers above the header part of the stack, indicate drop positions for tabs.
	 * otherwise indicate which segment of the body the dragged item would be dropped on
	 *
	 * @param	{Int} x Absolute Screen X
	 * @param	{Int} y Absolute Screen Y
	 *
	 * @returns {void}
	 */
	_$highlightDropZone: function( x, y ) {
		var segment, area;

		for( segment in this._contentAreaDimensions ) {
			area = this._contentAreaDimensions[ segment ].hoverArea;

			if( area.x1 < x && area.x2 > x && area.y1 < y && area.y2 > y ) {

				if( segment === 'header' ) {
					this._dropSegment = 'header';
					this._highlightHeaderDropZone( x );
				} else {
					this._resetHeaderDropZone();
					this._highlightBodyDropZone( segment );
				}
				
				return;
			}
		}
	},

	_$getArea: function() {
		if( this.element.is( ':visible' ) === false ) {
			return null;
		}
		
		var getArea = lm.items.AbstractContentItem.prototype._$getArea,
			headerArea = getArea.call( this, this.header.element ),
			contentArea = getArea.call( this, this.childElementContainer ),
			contentWidth = contentArea.x2 - contentArea.x1,
			contentHeight = contentArea.y2 - contentArea.y1;

		this._contentAreaDimensions = {
			header: {
				hoverArea: {
					x1: headerArea.x1,
					y1: headerArea.y1,
					x2: headerArea.x2,
					y2: headerArea.y2
				},
				highlightArea: {
					x1: headerArea.x1,
					y1: headerArea.y1,
					x2: headerArea.x2,
					y2: headerArea.y2
				}
			}
		};

		/**
		 * If this Stack is a parent to rows, columns or other stacks only its
		 * header is a valid dropzone.
		 */
		if( this._activeContentItem && this._activeContentItem.isComponent === false ) {
			return headerArea;
		}

		/**
		 * Highlight the entire body if the stack is empty
		 */
		if( this.contentItems.length === 0 ) {

			this._contentAreaDimensions.body = {
				hoverArea: {
					x1: contentArea.x1,
					y1: contentArea.y1,
					x2: contentArea.x2,
					y2: contentArea.y2
				},
				highlightArea: {
					x1: contentArea.x1,
					y1: contentArea.y1,
					x2: contentArea.x2,
					y2: contentArea.y2
				}
			};

			return getArea.call( this, this.element );
		}

		this._contentAreaDimensions.left = {
			hoverArea: {
				x1: contentArea.x1,
				y1: contentArea.y1,
				x2: contentArea.x1 + contentWidth * 0.25,
				y2: contentArea.y2
			},
			highlightArea: {
				x1: contentArea.x1,
				y1: contentArea.y1,
				x2: contentArea.x1 + contentWidth * 0.5,
				y2: contentArea.y2
			}
		};

		this._contentAreaDimensions.top = {
			hoverArea: {
				x1: contentArea.x1 + contentWidth * 0.25,
				y1: contentArea.y1,
				x2: contentArea.x1 + contentWidth * 0.75,
				y2: contentArea.y1 + contentHeight * 0.5
			},
			highlightArea: {
				x1: contentArea.x1,
				y1: contentArea.y1,
				x2: contentArea.x2,
				y2: contentArea.y1 + contentHeight * 0.5
			}
		};
		
		this._contentAreaDimensions.right = {
			hoverArea: {
				x1: contentArea.x1 + contentWidth * 0.75,
				y1: contentArea.y1,
				x2: contentArea.x2,
				y2: contentArea.y2
			},
			highlightArea: {
				x1: contentArea.x1 + contentWidth * 0.5,
				y1: contentArea.y1,
				x2: contentArea.x2,
				y2: contentArea.y2
			}
		};

		this._contentAreaDimensions.bottom = {
			hoverArea: {
				x1: contentArea.x1 + contentWidth * 0.25,
				y1: contentArea.y1 + contentHeight * 0.5,
				x2: contentArea.x1 + contentWidth * 0.75,
				y2: contentArea.y2
			},
			highlightArea: {
				x1: contentArea.x1,
				y1: contentArea.y1 + contentHeight * 0.5,
				x2: contentArea.x2,
				y2: contentArea.y2
			}
		};

		return getArea.call( this, this.element );
	},

	_highlightHeaderDropZone: function( x ) {
		var i,
			tabElement,
			tabsLength = this.header.tabs.length,
			isAboveTab = false,
			tabTop,
			tabLeft,
			offset,
			placeHolderLeft,
			headerOffset,
			tabWidth,
			halfX;

		// Empty stack
		if( tabsLength === 0 ) {
			headerOffset = this.header.element.offset();

			this.layoutManager.dropTargetIndicator.highlightArea({
				x1: headerOffset.left,
				x2: headerOffset.left + 100,
				y1: headerOffset.top + this.header.element.height() - 20,
				y2: headerOffset.top + this.header.element.height()
			});

			return;
		}

		for( i = 0; i < tabsLength; i++ ) {
			tabElement = this.header.tabs[ i ].element;
			offset = tabElement.offset();
			tabLeft = offset.left;
			tabTop = offset.top;
			tabWidth = tabElement.width();

			if( x > tabLeft && x < tabLeft + tabWidth ) {
				isAboveTab = true;
				break;
			}
		}

		if( isAboveTab === false && x < tabLeft ) {
			return;
		}

		halfX = tabLeft + tabWidth / 2;

		if( x < halfX ) {
			this._dropIndex = i;
			tabElement.before( this.layoutManager.tabDropPlaceholder );
		} else {
			this._dropIndex = Math.min( i + 1, tabsLength );
			tabElement.after( this.layoutManager.tabDropPlaceholder );
		}


		placeHolderLeft = this.layoutManager.tabDropPlaceholder.offset().left;

		this.layoutManager.dropTargetIndicator.highlightArea({
			x1: placeHolderLeft,
			x2: placeHolderLeft + this.layoutManager.tabDropPlaceholder.width(),
			y1: tabTop,
			y2: tabTop + tabElement.innerHeight()
		});
	},

	_resetHeaderDropZone: function() {
		this.layoutManager.tabDropPlaceholder.remove();
	},

	_highlightBodyDropZone: function( segment ) {
		var highlightArea = this._contentAreaDimensions[ segment ].highlightArea;
		this.layoutManager.dropTargetIndicator.highlightArea( highlightArea );
		this._dropSegment = segment;
	}
});
