'use strict';

var gulp   = require('gulp');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var stripDebug = require('gulp-strip-debug');
var rename = require("gulp-rename");

gulp.task('uglify', function () {
  return gulp.src(['src/googleApi.module.js', 'src/providers/*.js'])
    .pipe(sourcemaps.init())
    .pipe(concat('angular-google-client.js'))
    .pipe(gulp.dest('example'))
    .pipe(rename("angular-google-client.min.js"))
    .pipe(stripDebug())
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'))
    .pipe(gulp.dest('example'));
});

gulp.task('default', ['uglify']);
