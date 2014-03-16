var gulp = require("gulp"),
  mocha = require("gulp-mocha"),
  jshint = require("gulp-jshint"),
  uglify = require("gulp-uglify"),
  rename = require("gulp-rename"),
  clean = require("gulp-clean"),
  connect = require("gulp-connect"),
  rjs = require("gulp-requirejs"),
  async = require("async"),
  exec = require("child_process").exec;

gulp.task("mocha", [
  "connect",
  "dist",
  "require:jquery",
  "require:zepto"
], function () {
  async.series([
    "jquery.html",
    "zepto.html",
    "jquery-bundle.html",
    "zepto-bundle.html"
  ].map(function (page) {
    return function (next) {
      var cmd = "mocha-phantomjs http://localhost:8080/" + page,
        child = exec(cmd, function (error, stdout, stderr) {
          if (error) {
            throw error;
          }
          if (stdout) {
            process.stdout.write(stdout);
          }
          if (stderr) {
            process.stderr.write(stderr);
          }
          next();
        });
    };
  }), function () {
    process.exit();
  });
});

function rjsShim(domLib) {
  var options = {
    "underscore": {
      exports: "_"
    },
    "backbone": {
      deps: [domLib, "underscore"],
      exports: "Backbone"
    },
    "Handlebars": {
      exports: "Handlebars"
    }
  };
  options[domLib] = {
    exports: "$"
  };
  return options;
}

var rjsPaths = {
  "jquery": "bower_components/jquery/dist/jquery",
  "zepto": "bower_components/zepto/zetp",
  "underscore": "bower_components/underscore/underscore",
  "backbone": "bower_components/backbone/backbone",
  "Handlebars": "bower_components/handlebars/handlebars",
};

gulp.task("require:jquery", function () {
  return rjs({
    baseUrl: "./",
    name: "handlebones",
    out: "handlebones-jquery-bundle.js",
    shim: rjsShim("jquery"),
    paths: rjsPaths,
    map: {
      "*": {
        // Handlebars is used variously by different vendors. Do both here.
        "handlebars": "Handlebars"
      }
    }
    // ... more require.js options
  }).pipe(gulp.dest("./")); // pipe it to the output DIR
});

gulp.task("require:zepto", function () {
  return rjs({
    baseUrl: "./",
    name: "handlebones",
    out: "handlebones-zepto-bundle.js",
    shim: rjsShim("zepto"),
    paths: rjsPaths,
    map: {
      "*": {
        // Handlebars is used variously by different vendors. Do both here.
        "handlebars": "Handlebars"
      }
    }
    // ... more require.js options
  }).pipe(gulp.dest("./")); // pipe it to the output DIR
});

gulp.task("connect", connect.server({
  root: ["test", "bower_components", __dirname],
  livereload: false,
  port: 8080
}));

gulp.task("dist", ["move-map"], function () {
  return gulp.src("./dist", {
    read: false
  }).pipe(clean({
    force: true
  }));
});

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

gulp.task("move-map", ["move-dist"], function () {
  return gulp.src("./dist/handlebones.js.map")
    .pipe(gulp.dest("."));
});

gulp.task("lint", function() {
  return gulp.src("./handlebones.js")
    .pipe(jshint())
    .pipe(jshint.reporter("default"));
});


gulp.task("default", ["lint", "mocha", "dist"]);