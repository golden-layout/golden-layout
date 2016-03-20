var hbs = require( 'handlebars' );
var path = require( 'path' );
hbs.registerHelper( 'link', function( type, target ) {
	var url, folder;

	if( type === 'page' ) {
		folder = module.exports.outputDir;
	}

	if( type === 'asset' ) {
		folder = module.exports.outputDir + '\\assets';
	}

	url = path.relative( module.exports.cwd, folder );

	return path.join( url, target ).replace( /\\/g, '/');
});

hbs.registerHelper( 'issue', function( number ){
	var html = '<a class="githubIssue"'+
			' href="https://github.com/hoxton-one/golden-layout/issues/'+ 
			number +'">#'+ number +'</a>';

	return new hbs.SafeString( html );
});

module.exports = hbs;

module.exports.cwd = null;