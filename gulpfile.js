var gulp = require('gulp');
var del = require('del');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');

var config = {
    dependencies: './dependencies/*.js',
    entryPoint: ['./src/script.js'],
    out: 'script.js',
    dest: 'build',
    chromeManifest: './src/manifest.json'
}

gulp.task('clean', function(done) {
    del([config.dest], done);
});

gulp.task('chrome', function() {
    return gulp.src(config.chromeManifest)
        .pipe(gulp.dest(config.dest));
});

gulp.task('copyDependencies', function() {
    return gulp.src(config.dependencies)
        .pipe(gulp.dest(config.dest));
});

gulp.task('js', ['copyDependencies'], function() {
    var b = browserify({
        entries: config.entryPoint,
        debug: true
    });

    return b.bundle()
        .pipe(source(config.out))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(config.dest));
});

gulp.task('default', ['js', 'chrome'], function() {
    gulp.watch(config.entryPoint)
});
