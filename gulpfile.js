const {series, watch, src, dest, parallel} = require('gulp');
const pump = require('pump');
const tailwind = require("tailwindcss");
const concat = require('gulp-concat');

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

function prism(done) {
    pump([
        src([
          // pull in lib files first so our own code can depend on it
            "node_modules/prismjs/prism.js",
            "node_modules/prismjs/components/prism-*.min.js",
            "node_modules/prismjs/plugins/line-numbers/prism-line-numbers.min.js",
            "node_modules/prismjs/plugins/toolbar/prism-toolbar.min.js",
            "node_modules/prismjs/plugins/show-language/prism-show-language.min.js",
            "node_modules/prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard.min.js"
        ], { sourcemaps: false }),
        concat('prism.js'),
        uglify(),
        dest("assets/built/", { sourcemaps: "." }),
        livereload(),
    ],
    handleError(done)
);
}


const cssWatcher = () => watch('assets/css/**', css);
const jsWatcher = () => watch('assets/js/**', js);
const hbsWatcher = () => watch(['*.hbs', 'partials/**/*.hbs'], hbs);
const prismWatcher = () => watch('gulpfile.js', prism);
const watcher = parallel(
    cssWatcher,
    jsWatcher,
    prismWatcher,
    hbsWatcher
);
const build = series(css, js, prism);

exports.build = build;
exports.default = series(build, serve, watcher);
