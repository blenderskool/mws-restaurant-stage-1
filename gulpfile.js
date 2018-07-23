const gulp = require('gulp');
const babel = require('gulp-babel');
const cssmin = require('gulp-cssmin');
const htmlmin = require('gulp-htmlmin');
const webp = require('gulp-webp');

/**
 * Prepares the script files for production
 */
gulp.task('scripts', function() {

  /**
   * Bundles actual app scripts
   */
  gulp.src('src/js/*.js')
    .pipe(babel())
    .pipe(gulp.dest('dist/js'));

  /**
   * Use babel for service worker file
   */
  gulp.src('src/sw.js')
    .pipe(babel())
    .pipe(gulp.dest('dist'));
});

/**
 * Prepares the style files for production
 */
gulp.task('styles', function () {
  gulp.src('src/css/*.css')
    .pipe(cssmin())
    .pipe(gulp.dest('dist/css'));
});

/**
 * Prepares the html files for production
 */
gulp.task('html', function() {
  gulp.src('src/*.html')
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeOptionalTags: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      useShortDoctype: true
    }))
    .pipe(gulp.dest('dist'));
});

/**
 * Prepares the images for production
 */
gulp.task('images', function() {
  /**
   * WebP image files created
   */
  gulp.src('src/img/**/*')
    .pipe(webp())
    .pipe(gulp.dest('dist/img'));

  /**
   * Default format files are copied
   */
  gulp.src('src/img/**/*')
    .pipe(gulp.dest('dist/img'));
});

gulp.task('default', ['scripts', 'html', 'styles', 'images'], function() {
  gulp.src('src/*.json')
    .pipe(gulp.dest('dist'));
});