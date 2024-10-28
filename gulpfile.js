const {series, watch, src, dest, parallel} = require('gulp');
const pump = require('pump');
const tailwind = require("tailwindcss");
// const concat = require('gulp-concat');

// gulp plugins and utils
const livereload = require('gulp-livereload');
const postcss = require('gulp-postcss');
const uglify = require('gulp-uglify');

// postcss plugins
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const easyimport = require('postcss-import');

function serve(done) {
    livereload.listen();
    done();
}

const handleError = (done) => {
    return function (err) {
        if (err) {
            console.log(err);
        }
        return done(err);
    };
};

function hbs(done) {
    pump([
        src(["*.hbs", "**/**/*.hbs", "!node_modules/**/*.hbs"]),
        livereload()],
        handleError(done)
    );
    css(done);
}

function css(done) {
    pump([
        src('assets/css/*.css', {sourcemaps: false}),
        postcss([
            easyimport,
            tailwind(),
            autoprefixer(),
            cssnano()
        ]),
        dest('assets/built/', {sourcemaps: '.'}),
        livereload()
    ], handleError(done));
}

function js(done) {
    pump([
        src([
            // pull in lib files first so our own code can depend on it
            'assets/js/*.js'
        ], {sourcemaps: false}),
        // concat('main.js'),
        uglify(),
        dest('assets/built/', {sourcemaps: '.'}),
        livereload()
    ], handleError(done));
}


const cssWatcher = () => watch('assets/css/**', css);
const jsWatcher = () => watch('assets/js/**', js);
const hbsWatcher = () => watch(['*.hbs', 'partials/**/*.hbs'], hbs);
const watcher = parallel(
    cssWatcher,
    jsWatcher,
    hbsWatcher
);
const build = series(css, js);

exports.build = build;
exports.default = series(build, serve, watcher);
