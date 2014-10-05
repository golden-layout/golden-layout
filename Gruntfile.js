/* global require */
module.exports = function(grunt) {

	grunt.registerTask( 'build', require( './build/task' ) );

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		/***********************
		* WATCH
		***********************/
		watch: {
			tasks: [ 'build' ],
			files: [ './src/**' ],
			options: { livereload: 5051 },
		}

	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-watch');

	// Default task(s).
	grunt.registerTask('default', ['watch']);

};