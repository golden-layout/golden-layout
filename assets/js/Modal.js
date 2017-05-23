(function(){

	var Modal = function(){
		this._element = $( '#modal' );
		this._titleElement = this._element.find( '.title' );
		this._backgroundElement = this._element.find( '.background' );
		this._closeElement = this._element.find( '.close' );
		this._contentElement = this._element.find( '.content' );
		this._bindEvents();
	};

	Modal.prototype.show = function() {
		this._element.fadeIn( 500 );
		return this;
	};

	Modal.prototype.setLoading = function( isLoading ) {
		if( isLoading === true ) {
			this._element.addClass( 'loading' );
		} else {
			this._element.removeClass( 'loading' );
		}

		return this;
	};

	Modal.prototype.setTitle = function( title ) {
		this._titleElement.html( title );
		return this;
	};

	Modal.prototype.setContent = function( content ) {
		this._contentElement.html( content );
		return this;
	};

	Modal.prototype.close = function() {
		this._element.fadeOut( 400 );
		return this;
	};

	Modal.prototype._bindEvents = function() {
		var self = this;

		this._backgroundElement.click(function(){
			self.close();
		});

		this._closeElement.click(function(){
			self.close();
		});
	};

	window.modal = new Modal();
})();