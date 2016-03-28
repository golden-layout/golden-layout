lm.utils.ReactComponentHandler = function( container, state ) {
	if( !container._config.component ) {
		throw new Error( 'No react component specified. type: react-component needs a field `component`' );
	}
	this._reactClass = container._config.component;
	this._container = container;
	this._initialState = state;
	this._container.on( 'open', this._render, this );
};

lm.utils.copy( lm.utils.ReactComponentHandler.prototype, {
	_render: function() {
		ReactDOM.render( this._reactClass, this._container.getElement()[ 0 ]);
	},
});