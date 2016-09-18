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
		 * RELEASE
		 ***********************/
        release: {
            options: {
                tagName: 'v<%= version %>',
                github: { 
                    repo: 'deepstreamIO/golden-layout',
                    usernameVar: 'GITHUB_USERNAME',
                    passwordVar: 'GITHUB_PASSWORD'
                }
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
            },
            travis: {
                configFile: 'karma.conf.js',
                singleRun: true,
                browsers: ['PhantomJS']
            }
        }

	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.loadNpmTasks('grunt-release');
	grunt.loadNpmTasks('grunt-karma');

	// Default task(s).
	grunt.registerTask('default', ['watch']);

    // travis support
    grunt.registerTask('test', ['karma:travis']);
};
