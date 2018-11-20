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
 * Prepares the static files for production
 */
gulp.task('static', function() {
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

  /**
   * Copy the app icons
   */
  gulp.src('src/icons/**/*')
    .pipe(gulp.dest('dist/icons'));

  /**
   * Copy the icon fonts
   */
  gulp.src('src/font/**/*')
    .pipe(gulp.dest('dist/font'));
});

gulp.task('default', ['scripts', 'html', 'styles', 'static'], function() {
  gulp.src('src/*.{json,ico}')
    .pipe(gulp.dest('dist'));
});