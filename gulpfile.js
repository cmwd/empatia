const gulp = require('gulp');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const minifyCss = require('gulp-minify-css');
const nunjucks = require('gulp-nunjucks');
const data = require('gulp-data');
const htmlmin = require('gulp-html-minifier');
const util = require('gulp-util');
const uglify = require('gulp-uglify');
const toString = require('./gulp-toString');
const streamqueue = require('streamqueue');
const purecssModules = require('./purecss-config');
const path = require('path');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

const PATH_DEST = './dest';
const FILE_NAME_CSS = 'styles.css';
const FILE_NAME_JAVASCRIPT = 'index.js';

const purecss = () => gulp.src(purecssModules);
const styles = () => gulp
    .src('./src/scss/*.scss')
    .pipe(sass());

function compileStyles() {
  return new Promise((resolve) => {
    streamqueue({ objectMode: true }, purecss(), styles())
      .pipe(concat({ path: FILE_NAME_CSS }))
      .pipe(minifyCss())
      .pipe(toString(resolve));
  });
}

function getData() {
  return new Promise((resolve) => {
    Promise
      .all([compileStyles()])
      .then(([css]) => {
        resolve({css,
          jsPath: path.join(PATH_DEST, FILE_NAME_JAVASCRIPT),
        });
      });
  });
}

gulp.task('javascript', () =>
  browserify('./src/javascript/index.js')
    .bundle()
    .pipe(source(FILE_NAME_JAVASCRIPT))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest(PATH_DEST)));
gulp.task('html', () =>
  gulp.src('./src/html/index.html')
    .pipe(data(getData()))
    .pipe(nunjucks.compile())
    .on('error', e => util.log(e.message))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest('./')));
gulp.task('dev', ['default'], () => {
  gulp.watch('./src/**/*', ['default']);
});

gulp.task('default', ['javascript', 'html']);
