const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require('gulp-imagemin');
const htmlmin = require('gulp-htmlmin');
const browserSync = require('browser-sync').create();
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const replace = require('gulp-replace');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const rtlcss = require('gulp-rtlcss');
const { parallel, series } = require('gulp');

/**
 * Compile SCSS
 */
function compileSCSS() {
	return gulp.src('./style.scss')
		.pipe(sourcemaps.init())
		.pipe(sass())
		.pipe(concat('./style.css'))
		.pipe(postcss([autoprefixer()]))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('./'))
		.pipe(browserSync.stream());
}

function convertRTL() {
	return gulp.src('./style.css')
		.pipe(rtlcss())
		.pipe(concat('./style-rtl.css'))
		.pipe(gulp.dest('./'));
}

function compressImages() {
	return gulp.src(['./**/*.{jpg,png,jpeg,gif,svg}', '!**/node_modules{,/**}', '!**/dist{,/**}'])
		.pipe(imagemin([
			imagemin.gifsicle(),
			imagemin.mozjpeg(),
			imagemin.optipng(),
			imagemin.svgo({
				plugins: [
					{ removeViewBox: true },
					{ cleanupIDs: false }
				]
			})
		]))
		.pipe(gulp.dest('./dist'));
}

function minifyHTML() {
	return gulp.src('./*.html')
		.pipe(htmlmin({
			"collapseWhitespace": true,
			"removeComments": true,
			"removeOptionalTags": true,
			"removeRedundantAttributes": true,
			"removeScriptTypeAttributes": true,
			"minifyCss": true,
			"minifyJs": true
		}))
		.pipe(gulp.dest('./dist'));
}

function minifyJS() {
	return gulp.src(['./js/*.js', './js/**/*.js'])
		.pipe(uglify())
		.pipe(gulp.dest('./dist/js'));
}

function minifyCSS() {
	return gulp.src(['./**/*.css', '!**/node_modules{,/**}', '!**/dist{,/**}'])
		.pipe(cleanCSS())
		.pipe(gulp.dest('./dist'));
}

function copyStaticFiles() {
	return gulp.src([
		'./**/*',
		'!./node_modules{,/**}',
		'!./dist{,/**}',
		'!./gulpfile.js',
		'!./package*.json',
		'!./**/*.scss'
	])
		.pipe(gulp.dest('./dist'));
}

function watch() {
	browserSync.init({
		server: {
			baseDir: './'
		}
	});

	gulp.watch('./**/*.scss', series(compileSCSS, convertRTL));
	gulp.watch('./*.html').on('change', browserSync.reload);
	gulp.watch('./js/**/*.js').on('change', browserSync.reload);
}

// Build task for production
const build = series(
	parallel(minifyHTML, minifyCSS, minifyJS, compressImages),
	copyStaticFiles
);

exports.scsscompile = compileSCSS;
exports.imageminify = compressImages;
exports.htmlminify = minifyHTML;
exports.cssminify = minifyCSS;
exports.jsminify = minifyJS;
exports.minify = parallel(minifyCSS, minifyJS);
exports.watch = watch;
exports.build = build; // This is the missing build task!
exports.default = build;