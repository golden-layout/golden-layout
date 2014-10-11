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
		},

		/***********************
		* WATCH
		***********************/
		release: {
			options: {
			tagName: 'v<%= version %>',
			github: { 
				repo: 'hoxton-one/golden-layout',
				usernameVar: 'GITHUB_USERNAME',
				passwordVar: 'GITHUB_PASSWORD'
			}
		}
  	}

	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-release');

	// Default task(s).
	grunt.registerTask('default', ['watch']);

};