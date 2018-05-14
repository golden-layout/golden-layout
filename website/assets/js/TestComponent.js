TestComponent = function( container, state ) {
	var src = 'assets/images/example_bg_' + state.bg + '.jpg';
	container.getElement().append( '<img class="testImg" src="' + src + '" />' );
};
