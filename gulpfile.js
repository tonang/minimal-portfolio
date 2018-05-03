'use strict';

var gulp          = require( 'gulp' ),
	sass          = require( 'gulp-sass' ),
	autoprefixer  = require( 'gulp-autoprefixer' ),
	browserSync   = require( 'browser-sync' ),
	reload		  = browserSync.reload,
	babel         = require( 'gulp-babel' ),
	concat        = require( 'gulp-concat' ),
	pug           = require( 'gulp-pug' ),
	rename        = require( 'gulp-rename' ),
	uglifyCSS     = require( 'gulp-uglifycss' ),
	uglifyJs      = require( 'gulp-uglify' ),
	plumber       = require( 'gulp-plumber' ),
	notify        = require( 'gulp-notify' ),
	sourcemap     = require( 'gulp-sourcemaps' ),
	jshint        = require( 'gulp-jshint' ),
	stylish       = require( 'jshint-stylish' ),
	watch         = require( 'gulp-watch' ),
	optimizeImage = require( 'gulp-imagemin' ),
	ignore        = require( 'gulp-ignore' ),
	rimraf        = require( 'gulp-rimraf' ),
	svgSprite 		= require( 'gulp-svg-sprite' ),
	spriteSmith 	= require( 'gulp.spritesmith' ),
	zip           = require( 'gulp-zip' ),
	wait 					= require( 'gulp-wait' ),
	runSequence   = require( 'run-sequence' );

var settings = {
	projectName : 'gsi-static',
	version     : '1.1.0',
	srcDir      : 'source',
	destDir     : 'dist'
};

gulp.task( 'svg-sprite', function() {
	return gulp.src( './' + settings.srcDir + '/svg-sprite/*.svg')
		.pipe(svgSprite({
			mode 	: {
				// symbol mode to build the SVG
				symbol: {
					render: {
						// css output option for icon sizing
						css: false,
						// scss output option for icon sizing
						scss: false,
					},
					// destination folder
					dest: '.',
					// generated sprite name
					sprite: 'sprite-svg.svg',
					// build a sample page to the svg icon set
					example: true
				}
			}
		}))
		.pipe(gulp.dest( './' + settings.destDir + '/assets/images/' ) );
});

gulp.task( 'img-sprite', function() {
	var spriteData =
	gulp.src( './' + settings.srcDir + '/img-sprite/*.png')
		.pipe(spriteSmith({
			imgName: 'img-sprite.png',
			cssName: '_sprite-img.scss'
		}));
	spriteData.img.pipe(gulp.dest( './' + settings.destDir + '/assets/images/' ) );
	spriteData.css.pipe(gulp.dest( './' + settings.srcDir + '/sass/modules/') );
});

//- Pug Task for compiling pug template into HTML
gulp.task( 'pug', function ()  {

	return gulp.src( './' + settings.srcDir + '/pug/*.pug' )
				.pipe( plumber() )
				.pipe( pug({ pretty: '\t' }) )
				.on( 'error', function (err) {
					console.log(err);
				} )
				.on('error', notify.onError({
					title   : 'Sob sob!!',
					message : 'pug error bro',
					icon    : '',
					sound   : 'Basso'
			   	}))
				.pipe( gulp.dest( './' + settings.destDir + '' ) );

} );
gulp.task( 'pug-watch', ['pug'], reload );

gulp.task( 'style', function ()  {

	return gulp.src( './' + settings.srcDir + '/sass/main.scss' )
				.pipe( wait(500) )
				.pipe( plumber() )
				.pipe( sourcemap.init() )
				.pipe( sass().on('error',sass.logError) )
				.on('error', notify.onError({
					title   : 'Eh Bro!!',
					message : 'SASS nya ada yang error tuh',
					icon    : '',
					sound   : 'Basso'
			   	}))
				.on('error', function () { this.emit( 'end' ) })
				.pipe( autoprefixer({browsers: "last 3 version"}) )
				.pipe( sourcemap.write( '.' ) )
				.pipe( gulp.dest( './' + settings.destDir + '/assets/css/' ) )
				.pipe( browserSync.stream({match: '**/*.css'}) )
				.pipe( uglifyCSS() )
				.pipe( rename({suffix: '.min'}) )
				.pipe( gulp.dest( './' + settings.destDir + '/assets/css/' ) );

} );

gulp.task( 'script', function ()  {

	return gulp.src( './' + settings.srcDir + '/js/main.js' )
				.pipe( plumber() )
				.pipe( jshint()  )
				.pipe( jshint.reporter( stylish ) )
				.pipe( babel({ "presets": ["es2015"] }) )
				.pipe( gulp.dest( './' + settings.destDir + '/assets/js/' ) )
				.pipe( sourcemap.init() )
				.pipe( uglifyJs() )
				.pipe( rename({ suffix: '.min' }) )
				.pipe( sourcemap.write( '.' ) )
				.pipe( gulp.dest( './' + settings.destDir + '/assets/js' ) );

});

gulp.task( 'script-watcher', ['script'], reload );

gulp.task( 'script-plugins', function ()  {

	return gulp.src( './' + settings.srcDir + '/js/plugins/**/*.js' )
				.pipe( concat( 'plugins.js' ) )
				.pipe( gulp.dest( './' + settings.destDir + '/assets/js' ) )
				.pipe( sourcemap.init() )
				.pipe( uglifyJs() )
				.pipe( rename({ suffix: '.min' }) )
				.pipe( sourcemap.write( '.' ) )
				.pipe( gulp.dest( './' + settings.destDir + '/assets/js' ) );

} );

gulp.task( 'script-plugins-watcher', ['script-plugins'], reload );

gulp.task( 'image', function () {

	return gulp.src( './' + settings.destDir + '/assets/images/*' )
				.pipe( optimizeImage() )
				.pipe( gulp.dest( './' + settings.destDir + '/assets/images' ) );

} );

gulp.task( 'cleanup', function () {
	return gulp.src( ['**/.sass-cache','**./DS_Store'], {read:false} )
				.pipe( ignore('node_modules/**') )
				.pipe( rimraf({ force: true }) );
} );

gulp.task( 'build-zip', function () {

	return gulp.src( './' + settings.destDir + '/**/' )
				.pipe( zip( settings.projectName+settings.version+'.zip' ) )
				.pipe( gulp.dest('./') )
				.pipe( notify({
					title   : settings.projectName,
					message : "Bundling Project Completed. Output file: "+settings.projectName+settings.version+".zip",
					sound   : false,
					icon    : false,
					onLast  : true
			   	}) );

});

gulp.task( 'bundle', function(cb) {

	runSequence( 'style', 'script', 'script-plugins', 'image', 'cleanup' , 'build-zip', cb  );

} );

gulp.task( 'watch', function ()  {
	
	browserSync({ server: './' + settings.destDir + '/' });

	watch( './' + settings.srcDir + '/pug/**/*.pug', function () {
		gulp.start( 'pug-watch' );
	} );

	watch( './' + settings.srcDir + '/sass/**/*.scss', function () {
		gulp.start( 'style' )	;
	} );

	watch( './' + settings.srcDir + '/js/*.js', function ()  {
		gulp.start( 'script-watcher');
	} );

	watch( './' + settings.srcDir + '/js/plugins/*.js', function ()  {
		gulp.start( 'script-plugins-watcher');
	} );

});

gulp.task( 'default', ['watch'] );