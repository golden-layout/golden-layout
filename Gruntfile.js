var async = require( 'async' );
var glRoot = '../../../dev/golden-layout';

module.exports = function(grunt) {

	CONFIG = require( './config.js' );
	var versions;
	var versionPath = './htdocs/files/v' + grunt.option( 'tag' );

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		/**
		 * Delete all files in the deployment directory except for the hidden .git folder
		 */
		clean: {
			deployDir:{
				options:{ force: true },
				src: [ CONFIG.deploymentDir + '/**/*', '!' + CONFIG.deploymentDir + '/.git' ]
			},

			htdocs: {
				src: [ './htdocs/*', '!./htdocs/assets', '!./htdocs/files' ]
			},

			latest: {
				src: './htdocs/files/latest'
			}
		},

		watch: {
			tasks: ['build'],
			files: [ './index.hbs', './pages/**', './htdocs/assets/**' ],
			options: { livereload: 5051 },
		},

		compress: {
			main:{
				options: { archive: versionPath + '/GoldenLayout.zip' },
				files:[
					{expand: true, src: ['**'], cwd: versionPath }
				]
			}
		},
			

		/**
		 * Copy all assets and flattened pages
		 *
		 * @type {Object}
		 */
		copy: {
			toplevelfiles: {
				files: [
					{expand: true, src: ['**'], cwd: './toplevelfiles', dest: './htdocs/' }
				]
			},
			htdocs: {
				files: [
					{expand: true, src: ['**'], cwd: './htdocs', dest: CONFIG.deploymentDir },
				]
			},
			glAssets: {
				files: [
					{expand: true, src: ['**'], cwd: glRoot + '/dist/', dest: './htdocs/assets/js' },
					{expand: true, src: [ 
						'goldenlayout-base.css', 
						'goldenlayout-dark-theme.css', 
						'goldenlayout-light-theme.css', 
						//'goldenlayout-translucent-theme.css' 
					], cwd: glRoot + '/src/css/', dest: './htdocs/assets/css' },
				]
			},
			release: {
				files: [
					{expand: true, src: ['**'], cwd: glRoot + '/dist/', dest: versionPath + '/js' },
					{expand: true, src: [ 'LICENSE-CC-NC-4.0.md', 'LICENSE-GPL-3.0.md' ], cwd: './htdocs/assets/license', dest: versionPath },
					{expand: true, src: [ 
						'goldenlayout-base.css', 
						'goldenlayout-dark-theme.css', 
						'goldenlayout-light-theme.css', 
						//'goldenlayout-translucent-theme.css' 
					], cwd: glRoot + '/src/css/', dest: versionPath + '/css' },
				]
			},
			latest:{
				files: [
					{expand: true, src: ['**'], cwd: versionPath, dest: './htdocs/files/latest' }
				]
			}
		}
		
	});


	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-compress');

	grunt.registerTask('buildPages', function() {
		async.parallel([
			require( './build/build' ).action
		] , this.async() );
	});

	grunt.registerTask('setVersionsOnConfig', function(){
		CONFIG.versions = versions;
		CONFIG.latest = versions[ 0 ];
	});

	grunt.registerTask('readVersions', function(){
		versions = JSON.parse( require( 'fs' ).readFileSync( 'versions.json', { encoding: 'utf8' } ) );
	});

	grunt.registerTask('logVersions', function(){
		for( var i = 0; i < versions.length; i++ ) {
			console.log( versions[ i ].tag + ' (' + versions[ i ].date + ')' );
		}
	});

	grunt.registerTask('writeVersion', function(){
		var now = new Date();
		var today = now.getDate() + '.' + ( now.getMonth() + 1 ) + '.' + now.getFullYear();

		versions.unshift({
			tag: grunt.option( 'tag' ),
			date: today
		});

		versions = require( 'fs' ).writeFileSync( 'versions.json', JSON.stringify( versions ) );
	});

	grunt.registerTask('setConfig', function() {
		CONFIG.isDevelopment = false;
		CONFIG.baseUrl = '/';
		CONFIG.pagesUrl = '/';
		CONFIG.assetUrl = '/';
	});

	grunt.registerTask( 'checkVersion', function(){

		if( !grunt.option( 'tag' ) ) {
			throw new Error( 'Please specify a version, e.g. --tag=0.1.2' );
		}

		if( !grunt.option( 'tag' ).match( /[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{1,2}/ ) ) {
			throw new Error( 'Invalid tag. Please specify e.g. 1.2.3' );
		}

		for( var i = 0; i < versions.length; i++ ) {
			if( versions[ i ].tag === grunt.option( 'tag' ) ) {
				throw new Error( 'Version ' + grunt.option( 'tag' ) + ' already exists' );
			}
		}
	});

	grunt.registerTask('release', [
		'update-gl',
		'readVersions',
		'checkVersion',
		'writeVersion',
		'copy:release',
		'compress', 
		'clean:latest',
		'copy:latest',
		'build'
	]);

	grunt.registerTask( 'show-versions', [ 'readVersions', 'logVersions' ] );
	grunt.registerTask('update-gl', ['copy:glAssets']);
	grunt.registerTask('build', [ 'clean:htdocs', 'readVersions', 'setVersionsOnConfig', 'buildPages' ] );
	grunt.registerTask('deploy', [ 'setConfig', 'build', 'copy:toplevelfiles', 'clean:deployDir','copy:htdocs' ]);
	grunt.registerTask('default', [ 'build', 'watch' ] );
};