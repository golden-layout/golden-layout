var walk = require( 'walk' );
var rimraf = require( 'rimraf' );
var path = require( 'path' );
var async = require( 'async' );
var fs = require( 'fs' );
var hbs = require( './getHbs.js' );
var fileOptions = { encoding: 'utf8' };
var inputDir =  path.join( __dirname, '../pages' );
var outputDir = path.join( __dirname, '../htdocs' );
var mainTemplate = null;
var targetFileExtension = '.html';
var pagesWithNav = [ 'docs', 'tutorials' ];
var navPageExtension = '.md';
var navs = {};
var functionalFiles = [ 'nav.md' ];
var navFileName = 'nav.md';
var fileBuilder = {
	'hbs': require( './fileBuilder/HbsBuilder' ),
	'md': require( './fileBuilder/MdBuilder' )
};

exports.action = function( done ) {
	async.waterfall([
		readTemplate,
		//clearPagesDir,
		buildNav,
		walkTree
	], done );
};

var readTemplate = function( done ) {
	var templatePath = path.join( __dirname, '../index.hbs' );
	
	fs.readFile( templatePath, fileOptions, function( error, contents ){
		mainTemplate = hbs.compile( contents );
		done( error );
	});
};

var clearPagesDir = function( done ) {
	rimraf( outputDir, function( error ) {
		checkError( error );
		fs.mkdir( outputDir, done );
	});
};

var readNav = function( folder, next ) {
	var navPath = path.join( inputDir, folder, navFileName );

	fs.readFile( navPath, fileOptions, function( error, content ){
		navs[ folder ] = hbs.compile( content );
		next( error );
	});
};

var buildNav = function( next ) {
	async.each( pagesWithNav, readNav, next );
};

var checkError = function( error ) {
	if( error ) {
		throw error;
	}
};

var walkTree = function( done ) {
	var walker = walk.walk( inputDir );
	walker.on( 'directory', createTargetDirectory );
	walker.on( 'file', createTargetFile );
	walker.on( 'end', done );
};

var createTargetDirectory = function( root, stats, next ) {
	var targetDir = path.join( outputDir, stats.name );
	fs.mkdir( targetDir, next );
};

var createTargetFile = function( root, stats, next ) {
	
	if( functionalFiles.indexOf( stats.name ) !== -1 ) {
		next();
		return;
	}

	var srcFilePath = path.join( root, stats.name ),
		fileExtension = path.extname( stats.name ).replace( '.', '' ),
		targetFileName = stats.name.replace( '.' + fileExtension, targetFileExtension ),
		page = stats.name.replace( '.' + fileExtension, '' ),
		targetFilePath = path.join( root.replace( inputDir, outputDir ), targetFileName ),
		folder;

	if( root === inputDir ) {
		folder = '';
	} else {
		folder = root.replace( inputDir + '/', '' );
	}

	if( fileBuilder[ fileExtension ] === undefined ) {
		next( 'No fileBuilder found for ' + fileExtension );
		return;
	}

	var contextVars = {
		versions: CONFIG.versions,
		latest: CONFIG.latest,
		isDef: CONFIG.isDevelopment,
		isNotStart: folder.length > 0,
		category: folder,
		isDocs: pagesWithNav.indexOf( folder ) !== -1
	};

	contextVars[ 'pageIs_' + folder ] = true;
	contextVars[ 'fileIs_' + page ] = true;

	var data = {
		srcFilePath: srcFilePath,
		targetFilePath: targetFilePath,
		outputDir: outputDir,
		contextVars: contextVars
	};

	if( navs[ folder ] !== undefined ) {
		contextVars.hasNav = true;
		data.nav = navs[ folder ];
	}

	async.waterfall([
		readFile.bind( {}, srcFilePath ),
		buildFile.bind( {}, fileExtension, data ),
		writeFile.bind( {}, targetFilePath )
	], next );
};

/**
 * Parses a documentation page's html and extracts all h2
 *
 * @returns {Array} headlines
 */
var getSubNav = function( html ) {
	var regExp = /name="([^"]*)"/gm,
		result = [],
		matches = regExp.exec( html );

	while( matches !== null ) {
		result.push( matches[ 1 ] );
		matches = regExp.exec( html );
	}

	return result;
};

var readFile = function( srcFilePath, next ) {
	fs.readFile( srcFilePath, fileOptions, next );
};

var buildFile = function( fileExtension, data, fileContent, next ) {
	hbs.cwd = path.dirname( data.targetFilePath );
	hbs.outputDir = data.outputDir;

	fileBuilder[ fileExtension ].build( fileContent, data, function( error, innerHtml ){
		if( data.contextVars.hasNav ) {
			data.contextVars.subNav = getSubNav( innerHtml );
			data.contextVars.nav = new hbs.SafeString( data.nav( data.contextVars ) );
		}
		
		
		data.contextVars.pageContent = new hbs.SafeString( innerHtml );
		next( null, mainTemplate( data.contextVars ) );
	});
};

var writeFile = function( targetFilePath, content, next ) {
	fs.writeFile( targetFilePath, content, fileOptions, next );
};