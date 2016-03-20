var marked = require( 'marked' );
var prism = require( './prism' );
var renderer = new marked.Renderer();
var inArguments = false;
var firstH2 = true;

marked.setOptions({
  highlight: function (code) {
    return prism.highlight( code, prism.languages.javascript );
  }
});

renderer.heading = function( text, level ){
	if( level !== 2 ) {
		return '<h' + level + '>' + text + '</h' + level + '>';
	}

	var html = '';

	if( firstH2 === true ) {
		firstH2 = false;
	} else {
		html += '</div>';
	}

	html += '<div class="section"><h2><a name="' + text + '">' + text + '</a></h2>';
	
	return html;
};


renderer.paragraph = function( content ) {
	content = content.trim();

	var html = '';

	if( content.substr( 0, 8 ) === 'argument' ) {
		if( inArguments === false ) {
			inArguments = true;
			html += createArgumentsTableHeader();
		}

		html += createArgumentsTableRow( content );

	} else {
		if( inArguments === true ) {
			inArguments = false;
			html += '</tbody></table>';
		}
		
		html += '<p>' + content + '</p>';
	}

	return html;
};

module.exports = function( markdown ) {
	inArguments = false;
	firstH2 = true;
	return marked( markdown, {renderer: renderer } );
};

var createArgumentsTableHeader = function() {
	var html = '<table class="args">';

	html += '<thead><tr>';
	html +=		'<th>argument</th>';
	html +=		'<th>type</th>';
	html +=		'<th>optional</th>';
	html +=		'<th>default</th>';
	html +=		'<th>description</th>';
	html += '</tr></thead><tbody>';

	return html;
};

var createArgumentsTableRow = function( content ) {
	var args = parseArgumentsMarkdown( content ),
		html = '';

	html += '<tr>';
	html +=		'<td class="argument">' + args.argument + '</td>';
	html +=		'<td class="type">' + args.type + '</td>';
	html +=		'<td class="optional">' + args.optional + '</td>';
	html +=		'<td class="default">' + ( args.default || '-' ) + '</td>';
	html +=		'<td class="description">' + args.desc + '</td>';
	html += '</tr>';

	return html;
};

var parseArgumentsMarkdown = function( content ) {
	var lines = content.split( /\n/g ),
		args = {},
		arg,
		line,
		index,
		i;

	for( i = 0; i < lines.length; i++ ) {
		line = lines[ i ];
		index = line.indexOf( ':' );
		args[ line.substr( 0, index ).trim() ] = line.substr( index + 1 ).trim();
	}

	return args;
};