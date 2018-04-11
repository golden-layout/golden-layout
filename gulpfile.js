// Deprecated but left here for now; use the gulp tasks in the Gruntfile.
const gulp = require('gulp');
const concat = require('gulp-concat');
const cConcat = require('gulp-continuous-concat');
const uglify = require('gulp-uglify-es').default;
const insert = require('gulp-insert');
const watch = require('gulp-watch');

gulp.task('dev', () =>
  gulp
    .src([
      './build/ns.js',
      './src/js/utils/utils.js',
      './src/js/utils/EventEmitter.js',
      './src/js/utils/DragListener.js',
      './src/js/**',
    ])
    .pipe(watch('./src/js/**'))
    .pipe(cConcat('goldenlayout.js'))
    .pipe(insert.wrap('(function($){', '})(window.$);'))
    .pipe(gulp.dest('./dist'))
);

gulp.task('build', () =>
  gulp
    .src([
      './build/ns.js',
      './src/js/utils/utils.js',
      './src/js/utils/EventEmitter.js',
      './src/js/utils/DragListener.js',
      './src/js/**',
    ])
    .pipe(concat('goldenlayout.js'))
    .pipe(gulp.dest('./dist'))
    .pipe(uglify())
    .pipe(concat('goldenlayout.min.js'))
    .pipe(gulp.dest('./dist'))
);
