'use strict';

var gulp   = require('gulp');
//var karma  = require('karma').server;
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

gulp.task('uglify', function () {
  return gulp.src('src/*.js')
    .pipe(sourcemaps.init())
    .pipe(concat('angular-google-client.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

/*
gulp.task('test', function (done) {
  karma.start({
    configFile: __dirname + '/test/karma.conf.js',
    singleRun: true
  }, done);
});
*/

//gulp.task('watch', function () {
//  gulp.watch('src/*.js', ['copy', 'uglify', 'test']);
//  gulp.watch('test/**/*.spec.js', ['test']);
//});

gulp.task('default', ['uglify']);
