var gulp = require("gulp"),
  jshint = require("gulp-jshint"),
  uglify = require("gulp-uglify"),
  rename = require("gulp-rename"),
  clean = require("gulp-clean");

gulp.task("compress", function() {
  return gulp.src("./handlebones.js")
    .pipe(uglify({
      outSourceMap: true
    }))
    .pipe(gulp.dest("./dist"));
});

gulp.task("move-dist", ["compress"], function () {
  return gulp.src("./dist/handlebones.js")
    .pipe(rename("handlebones.min.js"))
    .pipe(gulp.dest("."));
});

// TODO: probably a better way to combine

gulp.task("move-map", ["move-dist"], function () {
  return gulp.src("./dist/handlebones.js.map")
    .pipe(gulp.dest("."));
});

gulp.task("dist", ["move-map"], function () {
  return gulp.src("./dist", {
    read: false
  }).pipe(clean({
    force: true
  }));
});

gulp.task("lint", function() {
  return gulp.src("./handlebones.js")
    .pipe(jshint())
    .pipe(jshint.reporter("default"));
});