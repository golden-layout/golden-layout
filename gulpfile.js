var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var insert = require('gulp-insert');

gulp.task('buildStatic', function() {

	return gulp.src([
			'./build/ns.js',
			'./src/js/utils/utils.js',
			'./src/js/utils/EventEmitter.js',
			'./src/js/utils/DragListener.js',
			'./src/js/**'
		])
		.pipe(concat('goldenlayout.js'))
		.pipe(insert.wrap('(function($){', '})(window.$);' ))
		.pipe(gulp.dest('./dist'))
		.pipe(uglify())
		.pipe(concat('goldenlayout.min.js'))
		.pipe(gulp.dest('./dist'));
});

gulp.task('default', ['buildStatic']);