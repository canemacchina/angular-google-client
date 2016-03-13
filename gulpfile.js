'use strict';

var gulp   = require('gulp');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var stripDebug = require('gulp-strip-debug');
var rename = require('gulp-rename');
var gutil = require('gulp-util');
var notifier = require('node-notifier');
var plumber = require('gulp-plumber');
var path = require('path');

var handleError = function(taskName, err){
  notifier.notify({
    'icon': path.join(__dirname, '..', 'assets', 'bug.png'),
    'title': 'Error during task \'' + taskName + '\'',
    'message': 'Open the console for error details',
    'sound': 'Glass'
  });
  gutil.log(gutil.colors.red(err.name) + ' during task '+ gutil.colors.cyan(taskName) + ' (plugin ' + gutil.colors.cyan('\'' + err.plugin + '\'') + ')');
  gutil.log(gutil.colors.yellow(err.message));
};

gulp.task('uglify', function () {
  return gulp.src(['src/googleApi.module.js', 'src/providers/*.js', 'src/services/*.js', 'src/directives/*.js'])
    .pipe(plumber({errorHandler: function(error){handleError('uglify', error); this.emit('end'); }}))
    .pipe(sourcemaps.init())
    .pipe(concat('angular-google-client.js'))
    .pipe(gulp.dest('dist'))
    .pipe(rename('angular-google-client.min.js'))
    .pipe(stripDebug())
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', function () {
  gulp.watch('src/**/*.js', ['uglify']);
});

gulp.task('default', ['watch']);
