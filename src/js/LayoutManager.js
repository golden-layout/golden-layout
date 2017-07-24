/**
 * The main class that will be exposed as GoldenLayout.
 *
 * @public
 * @constructor
 * @param {GoldenLayout config} config
 * @param {[DOM element container]} container Can be a jQuery selector string or a Dom element. Defaults to body
 *
 * @returns {VOID}
 */
lm.LayoutManager = function( config, container ) {

	if( !$ || typeof $.noConflict !== 'function' ) {
		var errorMsg = 'jQuery is missing as dependency for GoldenLayout. ';
		errorMsg += 'Please either expose $ on GoldenLayout\'s scope (e.g. window) or add "jquery" to ';
		errorMsg += 'your paths when using RequireJS/AMD';
		throw new Error( errorMsg );
	}
	lm.utils.EventEmitter.call( this );

	this.isInitialised = false;
	this._isFullPage = false;
	this._resizeTimeoutId = null;
	this._components = { 'lm-react-component': lm.utils.ReactComponentHandler };
	this._itemAreas = [];
	this._resizeFunction = lm.utils.fnBind( this._onResize, this );
	this._unloadFunction = lm.utils.fnBind( this._onUnload, this );
	this._maximisedItem = null;
	this._maximisePlaceholder = $( '<div class="lm_maximise_place"></div>' );
	this._creationTimeoutPassed = false;
	this._subWindowsCreated = false;
	this._dragSources = [];
	this._updatingColumnsResponsive = false;
	this._firstLoad = true;

	this.width = null;
	this.height = null;
	this.root = null;
	this.openPopouts = [];
	this.selectedItem = null;
	this.isSubWindow = false;
	this.eventHub = new lm.utils.EventHub( this );
	this.config = this._createConfig( config );
	this.container = container;
	this.dropTargetIndicator = null;
	this.transitionIndicator = null;
	this.tabDropPlaceholder = $( '<div class="lm_drop_tab_placeholder"></div>' );

	if( this.isSubWindow === true ) {
		$( 'body' ).css( 'visibility', 'hidden' );
	}

	this._typeToItem = {
		'column': lm.utils.fnBind( lm.items.RowOrColumn, this, [ true ] ),
		'row': lm.utils.fnBind( lm.items.RowOrColumn, this, [ false ] ),
		'stack': lm.items.Stack,
		'component': lm.items.Component
	};
};

/**
 * Hook that allows to access private classes
 */
lm.LayoutManager.__lm = lm;

/**
 * Takes a GoldenLayout configuration object and
 * replaces its keys and values recursively with
 * one letter codes
 *
 * @static
 * @public
 * @param   {Object} config A GoldenLayout config object
 *
 * @returns {Object} minified config
 */
lm.LayoutManager.minifyConfig = function( config ) {
	return ( new lm.utils.ConfigMinifier() ).minifyConfig( config );
};

/**
 * Takes a configuration Object that was previously minified
 * using minifyConfig and returns its original version
 *
 * @static
 * @public
 * @param   {Object} minifiedConfig
 *
 * @returns {Object} the original configuration
 */
lm.LayoutManager.unminifyConfig = function( config ) {
	return ( new lm.utils.ConfigMinifier() ).unminifyConfig( config );
};

lm.utils.copy( lm.LayoutManager.prototype, {

	/**
	 * Register a component with the layout manager. If a configuration node
	 * of type component is reached it will look up componentName and create the
	 * associated component
	 *
	 *  {
	 *		type: "component",
	 *		componentName: "EquityNewsFeed",
	 *		componentState: { "feedTopic": "us-bluechips" }
	 *  }
	 *
	 * @public
	 * @param   {String} name
	 * @param   {Function} constructor
	 *
	 * @returns {void}
	 */
	registerComponent: function( name, constructor ) {
		if( typeof constructor !== 'function' ) {
			throw new Error( 'Please register a constructor function' );
		}

		if( this._components[ name ] !== undefined ) {
			throw new Error( 'Component ' + name + ' is already registered' );
		}

		this._components[ name ] = constructor;
	},

	/**
	 * Creates a layout configuration object based on the the current state
	 *
	 * @public
	 * @returns {Object} GoldenLayout configuration
	 */
	toConfig: function( root ) {
		var config, next, i;

		if( this.isInitialised === false ) {
			throw new Error( 'Can\'t create config, layout not yet initialised' );
		}

		if( root && !( root instanceof lm.items.AbstractContentItem ) ) {
			throw new Error( 'Root must be a ContentItem' );
		}

		/*
		 * settings & labels
		 */
		config = {
			settings: lm.utils.copy( {}, this.config.settings ),
			dimensions: lm.utils.copy( {}, this.config.dimensions ),
			labels: lm.utils.copy( {}, this.config.labels )
		};

		/*
		 * Content
		 */
		config.content = [];
		next = function( configNode, item ) {
			var key, i;

			for( key in item.config ) {
				if( key !== 'content' ) {
					configNode[ key ] = item.config[ key ];
				}
			}

			if( item.contentItems.length ) {
				configNode.content = [];

				for( i = 0; i < item.contentItems.length; i++ ) {
					configNode.content[ i ] = {};
					next( configNode.content[ i ], item.contentItems[ i ] );
				}
			}
		};

		if( root ) {
			next( config, { contentItems: [ root ] } );
		} else {
			next( config, this.root );
		}

		/*
		 * Retrieve config for subwindows
		 */
		this._$reconcilePopoutWindows();
		config.openPopouts = [];
		for( i = 0; i < this.openPopouts.length; i++ ) {
			config.openPopouts.push( this.openPopouts[ i ].toConfig() );
		}

		/*
		 * Add maximised item
		 */
		config.maximisedItemId = this._maximisedItem ? '__glMaximised' : null;
		return config;
	},

	/**
	 * Returns a previously registered component
	 *
	 * @public
	 * @param   {String} name The name used
	 *
	 * @returns {Function}
	 */
	getComponent: function( name ) {
		if( this._components[ name ] === undefined ) {
			throw new lm.errors.ConfigurationError( 'Unknown component "' + name + '"' );
		}

		return this._components[ name ];
	},

	/**
	 * Creates the actual layout. Must be called after all initial components
	 * are registered. Recurses through the configuration and sets up
	 * the item tree.
	 *
	 * If called before the document is ready it adds itself as a listener
	 * to the document.ready event
	 *
	 * @public
	 *
	 * @returns {void}
	 */
	init: function() {

		/**
		 * Create the popout windows straight away. If popouts are blocked
		 * an error is thrown on the same 'thread' rather than a timeout and can
		 * be caught. This also prevents any further initilisation from taking place.
		 */
		if( this._subWindowsCreated === false ) {
			this._createSubWindows();
			this._subWindowsCreated = true;
		}


		/**
		 * If the document isn't ready yet, wait for it.
		 */
		if( document.readyState === 'loading' || document.body === null ) {
			$( document ).ready( lm.utils.fnBind( this.init, this ) );
			return;
		}

		/**
		 * If this is a subwindow, wait a few milliseconds for the original
		 * page's js calls to be executed, then replace the bodies content
		 * with GoldenLayout
		 */
		if( this.isSubWindow === true && this._creationTimeoutPassed === false ) {
			setTimeout( lm.utils.fnBind( this.init, this ), 7 );
			this._creationTimeoutPassed = true;
			return;
		}

		if( this.isSubWindow === true ) {
			this._adjustToWindowMode();
		}

		this._setContainer();
		this.dropTargetIndicator = new lm.controls.DropTargetIndicator( this.container );
		this.transitionIndicator = new lm.controls.TransitionIndicator();
		this.updateSize();
		this._create( this.config );
		this._bindEvents();
		this.isInitialised = true;
		this._adjustColumnsResponsive();
		this.emit( 'initialised' );
	},

	/**
	 * Updates the layout managers size
	 *
	 * @public
	 * @param   {[int]} width  height in pixels
	 * @param   {[int]} height width in pixels
	 *
	 * @returns {void}
	 */
	updateSize: function( width, height ) {
		if( arguments.length === 2 ) {
			this.width = width;
			this.height = height;
		} else {
			this.width = this.container.width();
			this.height = this.container.height();
		}

		if( this.isInitialised === true ) {
			this.root.callDownwards( 'setSize', [ this.width, this.height ] );

			if( this._maximisedItem ) {
				this._maximisedItem.element.width( this.container.width() );
				this._maximisedItem.element.height( this.container.height() );
				this._maximisedItem.callDownwards( 'setSize' );
			}

			this._adjustColumnsResponsive();
		}
	},

	/**
	 * Destroys the LayoutManager instance itself as well as every ContentItem
	 * within it. After this is called nothing should be left of the LayoutManager.
	 *
	 * @public
	 * @returns {void}
	 */
	destroy: function() {
		if( this.isInitialised === false ) {
			return;
		}
		this._onUnload();
		$( window ).off( 'resize', this._resizeFunction );
		$( window ).off( 'unload beforeunload', this._unloadFunction );
		this.root.callDownwards( '_$destroy', [], true );
		this.root.contentItems = [];
		this.tabDropPlaceholder.remove();
		this.dropTargetIndicator.destroy();
		this.transitionIndicator.destroy();
		this.eventHub.destroy();

		this._dragSources.forEach( function( dragSource ) {
			dragSource._dragListener.destroy();
			dragSource._element = null;
			dragSource._itemConfig = null;
			dragSource._dragListener = null;
		} );
		this._dragSources = [];
	},

	/**
	 * Recursively creates new item tree structures based on a provided
	 * ItemConfiguration object
	 *
	 * @public
	 * @param   {Object} config ItemConfig
	 * @param   {[ContentItem]} parent The item the newly created item should be a child of
	 *
	 * @returns {lm.items.ContentItem}
	 */
	createContentItem: function( config, parent ) {
		var typeErrorMsg, contentItem;

		if( typeof config.type !== 'string' ) {
			throw new lm.errors.ConfigurationError( 'Missing parameter \'type\'', config );
		}

		if( config.type === 'react-component' ) {
			config.type = 'component';
			config.componentName = 'lm-react-component';
		}

		if( !this._typeToItem[ config.type ] ) {
			typeErrorMsg = 'Unknown type \'' + config.type + '\'. ' +
				'Valid types are ' + lm.utils.objectKeys( this._typeToItem ).join( ',' );

			throw new lm.errors.ConfigurationError( typeErrorMsg );
		}


		/**
		 * We add an additional stack around every component that's not within a stack anyways.
		 */
		if(
			// If this is a component
		config.type === 'component' &&

		// and it's not already within a stack
		!( parent instanceof lm.items.Stack ) &&

		// and we have a parent
		!!parent &&

		// and it's not the topmost item in a new window
		!( this.isSubWindow === true && parent instanceof lm.items.Root )
		) {
			config = {
				type: 'stack',
				width: config.width,
				height: config.height,
				content: [ config ]
			};
		}

		contentItem = new this._typeToItem[ config.type ]( this, config, parent );
		return contentItem;
	},

	/**
	 * Creates a popout window with the specified content and dimensions
	 *
	 * @param   {Object|lm.itemsAbstractContentItem} configOrContentItem
	 * @param   {[Object]} dimensions A map with width, height, left and top
	 * @param    {[String]} parentId the id of the element this item will be appended to
	 *                             when popIn is called
	 * @param    {[Number]} indexInParent The position of this item within its parent element

	 * @returns {lm.controls.BrowserPopout}
	 */
	createPopout: function( configOrContentItem, dimensions, parentId, indexInParent ) {
		var config = configOrContentItem,
			isItem = configOrContentItem instanceof lm.items.AbstractContentItem,
			self = this,
			windowLeft,
			windowTop,
			offset,
			parent,
			child,
			browserPopout;

		parentId = parentId || null;

		if( isItem ) {
			config = this.toConfig( configOrContentItem ).content;
			parentId = lm.utils.getUniqueId();

			/**
			 * If the item is the only component within a stack or for some
			 * other reason the only child of its parent the parent will be destroyed
			 * when the child is removed.
			 *
			 * In order to support this we move up the tree until we find something
			 * that will remain after the item is being popped out
			 */
			parent = configOrContentItem.parent;
			child = configOrContentItem;
			while( parent.contentItems.length === 1 && !parent.isRoot ) {
				parent = parent.parent;
				child = child.parent;
			}

			parent.addId( parentId );
			if( isNaN( indexInParent ) ) {
				indexInParent = lm.utils.indexOf( child, parent.contentItems );
			}
		} else {
			if( !( config instanceof Array ) ) {
				config = [ config ];
			}
		}


		if( !dimensions && isItem ) {
			windowLeft = window.screenX || window.screenLeft;
			windowTop = window.screenY || window.screenTop;
			offset = configOrContentItem.element.offset();

			dimensions = {
				left: windowLeft + offset.left,
				top: windowTop + offset.top,
				width: configOrContentItem.element.width(),
				height: configOrContentItem.element.height()
			};
		}

		if( !dimensions && !isItem ) {
			dimensions = {
				left: window.screenX || window.screenLeft + 20,
				top: window.screenY || window.screenTop + 20,
				width: 500,
				height: 309
			};
		}

		if( isItem ) {
			configOrContentItem.remove();
		}

		browserPopout = new lm.controls.BrowserPopout( config, dimensions, parentId, indexInParent, this );

		browserPopout.on( 'initialised', function() {
			self.emit( 'windowOpened', browserPopout );
		} );

		browserPopout.on( 'closed', function() {
			self._$reconcilePopoutWindows();
		} );

		this.openPopouts.push( browserPopout );

		return browserPopout;
	},

	/**
	 * Attaches DragListener to any given DOM element
	 * and turns it into a way of creating new ContentItems
	 * by 'dragging' the DOM element into the layout
	 *
	 * @param   {jQuery DOM element} element
	 * @param   {Object|Function} itemConfig for the new item to be created, or a function which will provide it
	 *
	 * @returns {void}
	 */
	createDragSource: function( element, itemConfig ) {
		this.config.settings.constrainDragToContainer = false;
		var dragSource = new lm.controls.DragSource( $( element ), itemConfig, this );
		this._dragSources.push( dragSource );

		return dragSource;
	},

	/**
	 * Programmatically selects an item. This deselects
	 * the currently selected item, selects the specified item
	 * and emits a selectionChanged event
	 *
	 * @param   {lm.item.AbstractContentItem} item#
	 * @param   {[Boolean]} _$silent Wheather to notify the item of its selection
	 * @event    selectionChanged
	 *
	 * @returns {VOID}
	 */
	selectItem: function( item, _$silent ) {

		if( this.config.settings.selectionEnabled !== true ) {
			throw new Error( 'Please set selectionEnabled to true to use this feature' );
		}

		if( item === this.selectedItem ) {
			return;
		}

		if( this.selectedItem !== null ) {
			this.selectedItem.deselect();
		}

		if( item && _$silent !== true ) {
			item.select();
		}

		this.selectedItem = item;

		this.emit( 'selectionChanged', item );
	},

	/*************************
	 * PACKAGE PRIVATE
	 *************************/
	_$maximiseItem: function( contentItem ) {
		if( this._maximisedItem !== null ) {
			this._$minimiseItem( this._maximisedItem );
		}
		this._maximisedItem = contentItem;
		this._maximisedItem.addId( '__glMaximised' );
		contentItem.element.addClass( 'lm_maximised' );
		contentItem.element.after( this._maximisePlaceholder );
		this.root.element.prepend( contentItem.element );
		contentItem.element.width( this.container.width() );
		contentItem.element.height( this.container.height() );
		contentItem.callDownwards( 'setSize' );
		this._maximisedItem.emit( 'maximised' );
		this.emit( 'stateChanged' );
	},

	_$minimiseItem: function( contentItem ) {
		contentItem.element.removeClass( 'lm_maximised' );
		contentItem.removeId( '__glMaximised' );
		this._maximisePlaceholder.after( contentItem.element );
		this._maximisePlaceholder.remove();
		contentItem.parent.callDownwards( 'setSize' );
		this._maximisedItem = null;
		contentItem.emit( 'minimised' );
		this.emit( 'stateChanged' );
	},

	/**
	 * This method is used to get around sandboxed iframe restrictions.
	 * If 'allow-top-navigation' is not specified in the iframe's 'sandbox' attribute
	 * (as is the case with codepens) the parent window is forbidden from calling certain
	 * methods on the child, such as window.close() or setting document.location.href.
	 *
	 * This prevented GoldenLayout popouts from popping in in codepens. The fix is to call
	 * _$closeWindow on the child window's gl instance which (after a timeout to disconnect
	 * the invoking method from the close call) closes itself.
	 *
	 * @packagePrivate
	 *
	 * @returns {void}
	 */
	_$closeWindow: function() {
		window.setTimeout( function() {
			window.close();
		}, 1 );
	},

	_$getArea: function( x, y ) {
		var i, area, smallestSurface = Infinity, mathingArea = null;

		for( i = 0; i < this._itemAreas.length; i++ ) {
			area = this._itemAreas[ i ];

			if(
				x > area.x1 &&
				x < area.x2 &&
				y > area.y1 &&
				y < area.y2 &&
				smallestSurface > area.surface
			) {
				smallestSurface = area.surface;
				mathingArea = area;
			}
		}

		return mathingArea;
	},

	_$createRootItemAreas: function() {
		var areaSize = 50;
		var sides = { y2: 0, x2: 0, y1: 'y2', x1: 'x2' };
		for( var side in sides ) {
			var area = this.root._$getArea();
			area.side = side;
			if( sides [ side ] )
				area[ side ] = area[ sides [ side ] ] - areaSize;
			else
				area[ side ] = areaSize;			
			area.surface = ( area.x2 - area.x1 ) * ( area.y2 - area.y1 );
			this._itemAreas.push( area );
		}
	},

	_$calculateItemAreas: function() {
		var i, area, allContentItems = this._getAllContentItems();
		this._itemAreas = [];

		/**
		 * If the last item is dragged out, highlight the entire container size to
		 * allow to re-drop it. allContentItems[ 0 ] === this.root at this point
		 *
		 * Don't include root into the possible drop areas though otherwise since it
		 * will used for every gap in the layout, e.g. splitters
		 */
		if( allContentItems.length === 1 ) {
			this._itemAreas.push( this.root._$getArea() );
			return;
		}
		this._$createRootItemAreas();

		for( i = 0; i < allContentItems.length; i++ ) {

			if( !( allContentItems[ i ].isStack ) ) {
				continue;
			}

			area = allContentItems[ i ]._$getArea();

			if( area === null ) {
				continue;
			} else if( area instanceof Array ) {
				this._itemAreas = this._itemAreas.concat( area );
			} else {
				this._itemAreas.push( area );
				var header = {};
				lm.utils.copy( header, area );
				lm.utils.copy( header, area.contentItem._contentAreaDimensions.header.highlightArea );
				header.surface = ( header.x2 - header.x1 ) * ( header.y2 - header.y1 );
				this._itemAreas.push( header );
			}
		}
	},

	/**
	 * Takes a contentItem or a configuration and optionally a parent
	 * item and returns an initialised instance of the contentItem.
	 * If the contentItem is a function, it is first called
	 *
	 * @packagePrivate
	 *
	 * @param   {lm.items.AbtractContentItem|Object|Function} contentItemOrConfig
	 * @param   {lm.items.AbtractContentItem} parent Only necessary when passing in config
	 *
	 * @returns {lm.items.AbtractContentItem}
	 */
	_$normalizeContentItem: function( contentItemOrConfig, parent ) {
		if( !contentItemOrConfig ) {
			throw new Error( 'No content item defined' );
		}

		if( lm.utils.isFunction( contentItemOrConfig ) ) {
			contentItemOrConfig = contentItemOrConfig();
		}

		if( contentItemOrConfig instanceof lm.items.AbstractContentItem ) {
			return contentItemOrConfig;
		}

		if( $.isPlainObject( contentItemOrConfig ) && contentItemOrConfig.type ) {
			var newContentItem = this.createContentItem( contentItemOrConfig, parent );
			newContentItem.callDownwards( '_$init' );
			return newContentItem;
		} else {
			throw new Error( 'Invalid contentItem' );
		}
	},

	/**
	 * Iterates through the array of open popout windows and removes the ones
	 * that are effectively closed. This is necessary due to the lack of reliably
	 * listening for window.close / unload events in a cross browser compatible fashion.
	 *
	 * @packagePrivate
	 *
	 * @returns {void}
	 */
	_$reconcilePopoutWindows: function() {
		var openPopouts = [], i;

		for( i = 0; i < this.openPopouts.length; i++ ) {
			if( this.openPopouts[ i ].getWindow().closed === false ) {
				openPopouts.push( this.openPopouts[ i ] );
			} else {
				this.emit( 'windowClosed', this.openPopouts[ i ] );
			}
		}

		if( this.openPopouts.length !== openPopouts.length ) {
			this.emit( 'stateChanged' );
			this.openPopouts = openPopouts;
		}

	},

	/***************************
	 * PRIVATE
	 ***************************/
	/**
	 * Returns a flattened array of all content items,
	 * regardles of level or type
	 *
	 * @private
	 *
	 * @returns {void}
	 */
	_getAllContentItems: function() {
		var allContentItems = [];

		var addChildren = function( contentItem ) {
			allContentItems.push( contentItem );

			if( contentItem.contentItems instanceof Array ) {
				for( var i = 0; i < contentItem.contentItems.length; i++ ) {
					addChildren( contentItem.contentItems[ i ] );
				}
			}
		};

		addChildren( this.root );

		return allContentItems;
	},

	/**
	 * Binds to DOM/BOM events on init
	 *
	 * @private
	 *
	 * @returns {void}
	 */
	_bindEvents: function() {
		if( this._isFullPage ) {
			$( window ).resize( this._resizeFunction );
		}
		$( window ).on( 'unload beforeunload', this._unloadFunction );
	},

	/**
	 * Debounces resize events
	 *
	 * @private
	 *
	 * @returns {void}
	 */
	_onResize: function() {
		clearTimeout( this._resizeTimeoutId );
		this._resizeTimeoutId = setTimeout( lm.utils.fnBind( this.updateSize, this ), 100 );
	},

	/**
	 * Extends the default config with the user specific settings and applies
	 * derivations. Please note that there's a seperate method (AbstractContentItem._extendItemNode)
	 * that deals with the extension of item configs
	 *
	 * @param   {Object} config
	 * @static
	 * @returns {Object} config
	 */
	_createConfig: function( config ) {
		var windowConfigKey = lm.utils.getQueryStringParam( 'gl-window' );

		if( windowConfigKey ) {
			this.isSubWindow = true;
			config = localStorage.getItem( windowConfigKey );
			config = JSON.parse( config );
			config = ( new lm.utils.ConfigMinifier() ).unminifyConfig( config );
			localStorage.removeItem( windowConfigKey );
		}

		config = $.extend( true, {}, lm.config.defaultConfig, config );

		var nextNode = function( node ) {
			for( var key in node ) {
				if( key !== 'props' && typeof node[ key ] === 'object' ) {
					nextNode( node[ key ] );
				}
				else if( key === 'type' && node[ key ] === 'react-component' ) {
					node.type = 'component';
					node.componentName = 'lm-react-component';
				}
			}
		}

		nextNode( config );

		if( config.settings.hasHeaders === false ) {
			config.dimensions.headerHeight = 0;
		}

		return config;
	},

	/**
	 * This is executed when GoldenLayout detects that it is run
	 * within a previously opened popout window.
	 *
	 * @private
	 *
	 * @returns {void}
	 */
	_adjustToWindowMode: function() {
		var popInButton = $( '<div class="lm_popin" title="' + this.config.labels.popin + '">' +
			'<div class="lm_icon"></div>' +
			'<div class="lm_bg"></div>' +
			'</div>' );

		popInButton.click( lm.utils.fnBind( function() {
			this.emit( 'popIn' );
		}, this ) );

		document.title = lm.utils.stripTags( this.config.content[ 0 ].title );

		$( 'head' ).append( $( 'body link, body style, template, .gl_keep' ) );

		this.container = $( 'body' )
			.html( '' )
			.css( 'visibility', 'visible' )
			.append( popInButton );

		/*
		 * This seems a bit pointless, but actually causes a reflow/re-evaluation getting around
		 * slickgrid's "Cannot find stylesheet." bug in chrome
		 */
		var x = document.body.offsetHeight; // jshint ignore:line

		/*
		 * Expose this instance on the window object
		 * to allow the opening window to interact with
		 * it
		 */
		window.__glInstance = this;
	},

	/**
	 * Creates Subwindows (if there are any). Throws an error
	 * if popouts are blocked.
	 *
	 * @returns {void}
	 */
	_createSubWindows: function() {
		var i, popout;

		for( i = 0; i < this.config.openPopouts.length; i++ ) {
			popout = this.config.openPopouts[ i ];

			this.createPopout(
				popout.content,
				popout.dimensions,
				popout.parentId,
				popout.indexInParent
			);
		}
	},

	/**
	 * Determines what element the layout will be created in
	 *
	 * @private
	 *
	 * @returns {void}
	 */
	_setContainer: function() {
		var container = $( this.container || 'body' );

		if( container.length === 0 ) {
			throw new Error( 'GoldenLayout container not found' );
		}

		if( container.length > 1 ) {
			throw new Error( 'GoldenLayout more than one container element specified' );
		}

		if( container[ 0 ] === document.body ) {
			this._isFullPage = true;

			$( 'html, body' ).css( {
				height: '100%',
				margin: 0,
				padding: 0,
				overflow: 'hidden'
			} );
		}

		this.container = container;
	},

	/**
	 * Kicks of the initial, recursive creation chain
	 *
	 * @param   {Object} config GoldenLayout Config
	 *
	 * @returns {void}
	 */
	_create: function( config ) {
		var errorMsg;

		if( !( config.content instanceof Array ) ) {
			if( config.content === undefined ) {
				errorMsg = 'Missing setting \'content\' on top level of configuration';
			} else {
				errorMsg = 'Configuration parameter \'content\' must be an array';
			}

			throw new lm.errors.ConfigurationError( errorMsg, config );
		}

		if( config.content.length > 1 ) {
			errorMsg = 'Top level content can\'t contain more then one element.';
			throw new lm.errors.ConfigurationError( errorMsg, config );
		}

		this.root = new lm.items.Root( this, { content: config.content }, this.container );
		this.root.callDownwards( '_$init' );

		if( config.maximisedItemId === '__glMaximised' ) {
			this.root.getItemsById( config.maximisedItemId )[ 0 ].toggleMaximise();
		}
	},

	/**
	 * Called when the window is closed or the user navigates away
	 * from the page
	 *
	 * @returns {void}
	 */
	_onUnload: function() {
		if( this.config.settings.closePopoutsOnUnload === true ) {
			for( var i = 0; i < this.openPopouts.length; i++ ) {
				this.openPopouts[ i ].close();
			}
		}
	},

	/**
	 * Adjusts the number of columns to be lower to fit the screen and still maintain minItemWidth.
	 *
	 * @returns {void}
	 */
	_adjustColumnsResponsive: function() {

		// If there is no min width set, or not content items, do nothing.
		if( !this._useResponsiveLayout() || this._updatingColumnsResponsive || !this.config.dimensions || !this.config.dimensions.minItemWidth || this.root.contentItems.length === 0 || !this.root.contentItems[ 0 ].isRow ) {
			this._firstLoad = false;
			return;
		}

		this._firstLoad = false;

		// If there is only one column, do nothing.
		var columnCount = this.root.contentItems[ 0 ].contentItems.length;
		if( columnCount <= 1 ) {
			return;
		}

		// If they all still fit, do nothing.
		var minItemWidth = this.config.dimensions.minItemWidth;
		var totalMinWidth = columnCount * minItemWidth;
		if( totalMinWidth <= this.width ) {
			return;
		}

		// Prevent updates while it is already happening.
		this._updatingColumnsResponsive = true;

		// Figure out how many columns to stack, and put them all in the first stack container.
		var finalColumnCount = Math.max( Math.floor( this.width / minItemWidth ), 1 );
		var stackColumnCount = columnCount - finalColumnCount;

		var rootContentItem = this.root.contentItems[ 0 ];
		var firstStackContainer = this._findAllStackContainers()[ 0 ];
		for( var i = 0; i < stackColumnCount; i++ ) {
			// Stack from right.
			var column = rootContentItem.contentItems[ rootContentItem.contentItems.length - 1 ];
			this._addChildContentItemsToContainer( firstStackContainer, column );
		}

		this._updatingColumnsResponsive = false;
	},

	/**
	 * Determines if responsive layout should be used.
	 *
	 * @returns {bool} - True if responsive layout should be used; otherwise false.
	 */
	_useResponsiveLayout: function() {
		return this.config.settings && ( this.config.settings.responsiveMode == 'always' || ( this.config.settings.responsiveMode == 'onload' && this._firstLoad ) );
	},

	/**
	 * Adds all children of a node to another container recursively.
	 * @param {object} container - Container to add child content items to.
	 * @param {object} node - Node to search for content items.
	 * @returns {void}
	 */
	_addChildContentItemsToContainer: function( container, node ) {
		if( node.type === 'stack' ) {
			node.contentItems.forEach( function( item ) {
				container.addChild( item );
				node.removeChild( item, true );
			} );
		}
		else {
			node.contentItems.forEach( lm.utils.fnBind( function( item ) {
				this._addChildContentItemsToContainer( container, item );
			}, this ) );
		}
	},

	/**
	 * Finds all the stack containers.
	 * @returns {array} - The found stack containers.
	 */
	_findAllStackContainers: function() {
		var stackContainers = [];
		this._findAllStackContainersRecursive( stackContainers, this.root );

		return stackContainers;
	},

	/**
	 * Finds all the stack containers.
	 *
	 * @param {array} - Set of containers to populate.
	 * @param {object} - Current node to process.
	 *
	 * @returns {void}
	 */
	_findAllStackContainersRecursive: function( stackContainers, node ) {
		node.contentItems.forEach( lm.utils.fnBind( function( item ) {
			if( item.type == 'stack' ) {
				stackContainers.push( item );
			}
			else if( !item.isComponent ) {
				this._findAllStackContainersRecursive( stackContainers, item );
			}
		}, this ) );
	}
} );

/**
 * Expose the Layoutmanager as the single entrypoint using UMD
 */
(function() {
	/* global define */
	if( typeof define === 'function' && define.amd ) {
		define( [ 'jquery' ], function( jquery ) {
			$ = jquery;
			return lm.LayoutManager;
		} ); // jshint ignore:line
	} else if( typeof exports === 'object' ) {
		module.exports = lm.LayoutManager;
	} else {
		window.GoldenLayout = lm.LayoutManager;
	}
})();
