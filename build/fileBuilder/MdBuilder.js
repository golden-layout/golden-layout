var marked = require( '../getMarked.js' );

exports.build = function( fileContent, data, done ) {
	done( null, marked( fileContent ) );
};