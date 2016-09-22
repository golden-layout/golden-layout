var gulp = require( 'gulp' );
var concat = require( 'gulp-concat' );
var uglify = require( 'gulp-uglify' );
var insert = require( 'gulp-insert' );
var watch = require( 'gulp-watch' );

/* global require */
module.exports = function( grunt ) {

	grunt.registerTask( 'build', require( './build/task' ) );

	var sources = [
		'./build/ns.js',
		'./src/js/utils/utils.js',
		'./src/js/utils/EventEmitter.js',
		'./src/js/utils/DragListener.js',
		'./src/js/**'
	];

	var basicGulpStream = function( stream ) {
		return stream
			.pipe( concat( 'goldenlayout.js' ) )
			.pipe( insert.wrap( '(function($){', '})(window.$);' ) );
	};

	// Project configuration.
	grunt.initConfig( {
			pkg: grunt.file.readJSON( 'package.json' ),

			/***********************
			 * WATCH
			 ***********************/
			watch: {
				tasks: [ 'dist', 'test' ],
				files: [ './src/**', './test/**' ],
				options: { livereload: 5051 },
			},

			/***********************
			 * RELEASE
			 ***********************/
			release: {
				options: {
					additionalFiles: [ 'bower.json' ],
					beforeRelease: [ 'gulp:gl', 'gulp:glmin' ],
					tagName: 'v<%= version %>',
					github: {
						repo: 'deepstreamIO/golden-layout',
						accessTokenVar: 'GITHUB_ACCESS_TOKEN'
					}
				}
			},
			/***********************
			 * GULP
			 ***********************/
			gulp: {
				gl: {
					options: {
						tasks: basicGulpStream
					},
					src: sources,
					dest: 'dist/goldenlayout.js'
				},
				glmin: {
					options: {
						tasks: function( stream ) {
							return basicGulpStream( stream )
								.pipe( uglify() )
								.pipe( concat( 'goldenlayout.min.js' ) );
						}
					},
					src: sources,
					dest: 'dist/goldenlayout.min.js'
				}
			},

			/***********************
			 * KARMA
			 ***********************/
			karma: {
				unit: {
					configFile: 'karma.conf.js',
					background: true,
					singleRun: false
				}
				,
				travis: {
					configFile: 'karma.conf.js',
					singleRun: true,
					browsers: [ 'PhantomJS' ]
				}
			}
		}
	);

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks( 'grunt-contrib-watch' );

	grunt.loadNpmTasks( 'grunt-release' );
	grunt.loadNpmTasks( 'grunt-karma' );
	grunt.loadNpmTasks( 'grunt-gulp' );

	// Default task(s).
	grunt.registerTask( 'default', [ 'watch' ] );

	// travis support
	grunt.registerTask( 'test', [ 'karma:travis' ] );

    // distribution support
	grunt.registerTask( 'dist', [ 'build', 'gulp' ] );
};
