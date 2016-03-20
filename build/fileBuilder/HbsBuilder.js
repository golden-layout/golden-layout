var hbs = require( '../getHbs.js' );
var path = require( 'path' );

exports.build = function( fileContent, data, done ) {
	done( null, hbs.compile( fileContent )( data.contextVars ) );
};