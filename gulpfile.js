var gulp = require('gulp'),
  jshint = require('gulp-jshint');

gulp.task('lint', function() {
  gulp.src('./handlebones.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});