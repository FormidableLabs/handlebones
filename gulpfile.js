var gulp = require("gulp"),
  mocha = require("gulp-mocha"),
  jshint = require("gulp-jshint"),
  uglify = require("gulp-uglify"),
  rename = require("gulp-rename"),
  clean = require("gulp-clean"),
  connect = require("gulp-connect");

gulp.task("mocha", ["lint"], function () {
  gulp.src("test.js")
    .pipe(mocha({
      reporter: "nyan"
    }));
});

gulp.task("compress", ["mocha"], function() {
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

gulp.task("connect", connect.server({
  root: ["test", "bower_components"],
  livereload: false,
  port: 8080
}));

gulp.task("default", ["mocha"]);