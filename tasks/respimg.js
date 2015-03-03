/**
 * grunt-respimg
 * https://github.com/nwtn/grunt-respimg
 *
 * Copyright (c) 2015 David Newton
 * Licensed under the MIT license.
 *
 * Automatically resizes image assets
 *
 * Portions borrowed liberally from:
 *		<https://github.com/andismith/grunt-responsive-images>, and
 *		<https://github.com/dbushell/grunt-svg2png>, and
 *		<https://github.com/JamieMason/grunt-imageoptim>, and
 *		<https://github.com/sindresorhus/grunt-svgmin>
 *
 * @author David Newton (http://twitter.com/newtron)
 * @version 0.0.0
 */

'use strict';

module.exports = function(grunt) {

	var async =				require('async'),
		im =				require('node-imagemagick'),
		path =				require('path'),
		phantomjs =			require('phantomjs'),
		q =					require('q'),
		childProcess =		require('child_process'),
		eachAsync =			require('each-async'),
		prettyBytes =		require('pretty-bytes'),
		SVGO =				require('svgo'),
		fs =				require('fs'),

		cpExec =			childProcess.exec,
		cpSpawn =			childProcess.spawn,
		gruntFile =			path.resolve(),
		cliPaths = [
							'../node_modules/imageoptim-cli/bin',
							'../../imageoptim-cli/bin'
		].map(function(dir) {
			return path.resolve(__dirname, dir);
		}),

		DEFAULT_OPTIONS = {
			// options: Activate, Associate, Background, Copy, Deactivate, Disassociate, Extract, Off, On, Opaque, Remove, Set, Shape, Transparent
			// no-optim default: Background
			alpha :						null,

			// options: an ImageMagick-compatible color (see http://www.imagemagick.org/script/color.php)
			// no-optim default: Black
			background :				null,

			// options: CMY, CMYK, Gray, HCL, HCLp, HSB, HSI, HSL, HSV, HWB, Lab, LCHab, LCHuv, LMS, Log, Luv, OHTA, Rec601YCbCr, Rec709YCbCr, RGB, scRGB, sRGB, Transparent, xyY, XYZ, YCbCr, YCC, YDbDr, YIQ, YPbPr, YUV
			// no-optim default: sRGB
			colorspace :				null,

			// options: FloydSteinberg, None, plus, Riemersma
			dither :					'None',

			// options: Bartlett, Bessel, Blackman, Bohman, Box, Catrom, Cosine, Cubic, Gaussian, Hamming, Hann, Hanning, Hermite, Jinc, Kaiser, Lagrange, Lanczos, Lanczos2, Lanczos2Sharp, LanczosRadius, LanczosSharp, Mitchell, none, Parzen, Point, Quadratic, Robidoux, RobidouxSharp, Sinc, SincFast, Spline, Triangle, Welch, Welsh
			filter :					'Triangle',

			// options: (float)
			filterSupport :				2,

			// options: GIF, JPEG, line, none, partition, plane, PNG
			interlace :					'none',

			// options: off, on
			// no-optim default: off
			jpegFancyUpsampling :		null,

			// options for each: true, false
			// TODO: make these ints representing how many times to run optimization
			optimize :		{
				svg:					true,
				rasterInput:			true,
				rasterOutput:			true
			},

			// options: (int) 0–9
			// no-optim default: 5
			pngCompressionFilter :		null,

			// options: (int) 0–9
			// no-optim default: 9
			pngCompressionLevel :		null,

			// options: (int) 0–9
			// no-optim default: 1
			pngCompressionStrategy :	null,

			// options: “all” or the name of chunk(s) to be excluded (see http://www.imagemagick.org/script/command-line-options.php#define)
			// no-optim default: all
			pngExcludeChunk :			null,

			// options: true, false
			// note that “false” is equivalent to “null”; actually passing “false” behaves the same as passing “true”
			pngPreserveColormap :		true,

			// options: (int)
			posterize :					136,

			// options: (int) 0–100
			quality :					82,

			// options: adaptive, distort, geometry, interpolative, liquid, resize, sample, scale, thumbnail
			resizeFunction :			'thumbnail',

			// options: true, false
			// note that “false” is equivalent to “null”
			// no-optim default: true
			strip :						null,

			// see https://github.com/sindresorhus/grunt-svgmin/blob/master/readme.md and https://github.com/svg/svgo/tree/master/plugins
			svgoPlugins :	[
				{
					removeUnknownsAndDefaults :	false
				}
			],

			// options: each one is a (float)
			// no-optim default for threshold: 0.065
			unsharp : {
				radius :				0.25,
				sigma :					0.25,
				gain :					9,
				threshold :				0.045
			},

			// options: (int)s
			widths : [
										320,
										640,
										1280
			]
		},






		/**
		 * Get the ImageOptim-CLI terminal command to be run for a given directory
		 * @param  {String} directory
		 * @return {String}
		 */
		getCommandByDirectory = function(directory) {
			return './imageOptim --quit --directory ' + directory.replace(/\s/g, '\\ ');
		},


		/**
		 * @param  {String} command
		 * @param  {String} cwd
		 * @return {Promise}
		 */
		executeDirectoryCommand = function(command, cwd) {
			var deferred = q.defer(),
				errorMessage = 'ImageOptim-CLI exited with a failure status',
				imageOptimCli = cpExec(command, {
					cwd: cwd
				});

			imageOptimCli.stdout.on('data', function(message) {
				console.log(String(message || '').replace(/\n+$/, ''));
			});

			imageOptimCli.on('exit', function(code) {
				return code === 0 ? deferred.resolve(true) : deferred.reject(new Error(errorMessage));
			});

			return deferred.promise;
		},


		/**
		 * @param  {String[]}  files             Array of paths to directories from src: in config.
		 * @return {Promise}
		 */
		processDirectories = function(files, cliPath) {
			return files.map(function(directory) {
				return getCommandByDirectory(directory);
			}).reduce(function(promise, command) {
				return promise.then(function() {
					return executeDirectoryCommand(command, cliPath);
				});
			}, q());
		},


		/**
		 * @param  {String[]}  files             Array of paths to files from src: in config.
		 * @return {Promise}
		 */
		processFiles = function(files, cliPath) {
			var imageOptimCli,
				deferred = q.defer(),
				errorMessage = 'ImageOptim-CLI exited with a failure status';

			imageOptimCli = cpSpawn('./imageOptim', ['--quit'], {
				cwd: cliPath
			});

			imageOptimCli.stdout.on('data', function(message) {
				console.log(String(message || '').replace(/\n+$/, ''));
			});

			imageOptimCli.on('exit', function(code) {
				return code === 0 ? deferred.resolve(true) : deferred.reject(new Error(errorMessage));
			});

			imageOptimCli.stdin.setEncoding('utf8');
			imageOptimCli.stdin.end(files.join('\n') + '\n');

			return deferred.promise;
		},


		/**
		 * @param  {String} str "hello"
		 * @return {String}     "Hello"
		 */
		firstUp = function(str) {
			return str.charAt(0).toUpperCase() + str.slice(1);
		},


		/**
		 * @param  {String}  fileType "file" or "Dir"
		 * @return {Function}
		 */
		isFileType = function(fileType) {
			var methodName = 'is' + firstUp(fileType);
			return function(file) {
				return grunt.file[methodName](file);
			};
		},


		/**
		 * Ensure the ImageOptim-CLI binary is accessible
		 * @return {String}
		 */
		getPathToCli = function() {
			return cliPaths.filter(function(cliPath) {
				return grunt.file.exists(cliPath);
			})[0];
		},


		/**
		 * Convert a relative path to an absolute file system path
		 * @param  {String} relativePath
		 * @return {String}
		 */
		toAbsolute = function(relativePath) {
			return path.resolve(gruntFile, relativePath);
		},


		/**
		 * Given a collection of files to be run in a task, seperate the files from the directories to
		 * handle them in their own way.
		 * @param  {String} fileType "dir" or "file"
		 * @param  {String} cliPath
		 * @param  {Object} options
		 * @param  {Array} taskFiles
		 * @param  {Promise} promise
		 * @return {Promise}
		 */
		processBatch = function(fileType, cliPath, options, taskFiles, promise) {
			var files = taskFiles.filter(isFileType(fileType)).map(toAbsolute);
			var processor = fileType === 'dir' ? processDirectories : processFiles;
			return files.length === 0 ? promise : promise.then(function() {
				return processor(files, cliPath);
			});
		},


		/**
		 * Checks for a valid array, and that there are items in the array.
		 *
		 * @private
		 * @param   {object}          obj       The object to check
		 * @return  {boolean}         Whether it is a valid array with items.
		 */
		isValidArray = function(obj) {
			return (Array.isArray(obj) && obj.length > 0);
		},


		/**
		 * Checks for a valid width
		 *
		 * @private
		 * @param   {number/string}   width     The width as a number of pixels
		 * @return  {boolean}         Whether the size is valid.
		 */
		isValidWidth = function(width) {
			var pxRegExp =	/^[0-9]+$/,
				isValid =	false;

			if (width) {
				// check if we have a valid pixel value
				if (!!(width || 0).toString().match(pxRegExp)) {
					isValid = true;
				} else {
					grunt.log.error('Width value is not valid.');
				}

			} else {
				grunt.log.error('Width must be specified.');
			}

			return isValid;
		},


		/**
		 * Checks for a valid quality
		 *
		 * @private
		 * @param   {number/string}   quality     The quality, a value from 1–100
		 * @return  {boolean}         Whether the quality is valid.
		 */
		isValidQuality = function(quality) {
			if (quality < 1 || quality > 100) {
				return false;
			}

			return true;
		},


		/**
		 * Add a suffix.
		 *
		 * @private
		 * @param   {string}          root          The root value
		 * @param   {string}          suffix        The required suffix
		 */
		addPrefixSuffix = function(root, suffix) {
			return root + (suffix || '');
		},


		/**
		 * Check the target has been set up properly in Grunt.
		 * Graceful handling of https://github.com/andismith/grunt-responsive-images/issues/2
		 *
		 * @private
		 * @param   {object}          files         The files object
		 */
		checkForValidTarget = function(files) {
			var test;

			try {
				test = files.src;
			} catch (exception) {
				grunt.fail.fatal('Unable to read configuration.\n' +
				'Have you specified a target? See: http://gruntjs.com/configuring-tasks');
			}
		},


		/**
		 * Check that there is only one source file in compact/files object format.
		 *
		 * @private
		 * @param   {object}          files         The files object
		 */
		checkForSingleSource = function(files) {
			// more than 1 source.
			if (files.src.length > 1) {
				return grunt.fail.warn('Unable to resize more than one image in compact or files object format.\n'+
				'For multiple files please use the files array format.\nSee http://gruntjs.com/configuring-tasks');
			}
		},


		/**
		 * Check if a directory exists, and create it if it doesn't.
		 *
		 * @private
		 * @param   {string}          dirPath   The path we want to check
		 */
		checkDirectoryExists = function(dirPath) {
			if (!grunt.file.isDir(dirPath)) {
				grunt.file.mkdir(dirPath);
			}
		},


		/**
		 * Handle showing errors to the user.
		 *
		 * @private
		 * @param   {string}          error     The error message.
		 */
		handleImageErrors = function(error) {
			grunt.fail.warn(error);
		},


		/**
		 * Determine if the file is an animated GIF
		 *
		 * @private
		 * @param   {Object}          data      The image data
		 * @param   {string}          dstPath   The destination path
		 */
		isAnimatedGif = function(data, dstPath) {
			// GIF87 cannot be animated.
			// data.Delay and Scene can identify an animation GIF
			if (data.format.toUpperCase() === 'GIF' && data.Delay && data.Scene) {
				grunt.verbose.warn(dstPath + ' is animated - skipping');
				return true;
			}
		},


		/**
		 * Process the image
		 *
		 * @private
		 * @param   {srcPath}         count     The source path
		 * @param   {string}          dstPath   The destination path
		 * @param   {Object}          options   Options
		 * @param   {int}             width     Width
		 */
		processImage = function(srcPath, dstPath, options, width) {
			var deferred = q.defer();

			// determine the image type by looking at the file extension
			// TODO: do this better, maybe with something like <https://github.com/mscdex/mmmagic>
			var extName = path.extname(dstPath).toLowerCase();

			// if it’s an SVG, generate a PNG using PhantomJS
			if (extName === '.svg') {

				// make the destination file a PNG
				dstPath = dstPath.replace(/\.svg$/i, '.png');
				extName = '.png';

				var spawn = grunt.util.spawn(
					{
						cmd :	phantomjs.path,
						args :	[
								path.resolve(__dirname, 'lib/svg2png.js'),
								srcPath,
								dstPath,
								width
						]
					},
					function doneFunction(error, result, code) {
						if (error) {
							return deferred.reject();
						}
					}
				);

				spawn.stdout.on('data', function(buffer) {
					try {
						var result = JSON.parse(buffer.toString());
						if (result.status) {
							grunt.verbose.ok('Resized image: ' + srcPath + ' resized to ' + width + 'px wide, saved to ' + dstPath);
							return deferred.resolve(true);
						} else {
							return deferred.reject();
						}
					} catch (error) {
						handleImageErrors(error);
						return deferred.reject(error);
					}
				});


			// all other images get loaded into ImageMagick
			} else {
				// get properties about the image
				im.identify(srcPath, function(error, data) {

					// bail if there’s an error
					if (error) {
						handleImageErrors(error);
						return deferred.reject(error);
					}

					// bail if it’s an animated GIF
					if (isAnimatedGif(data, dstPath)) {
						return deferred.resolve(true);
					}

					var args = [srcPath];

					// set the resize filter
					if (options.filter !== null) {
						args.push('-filter');
						args.push(options.filter);
					}

					// set the filter support
					if (options.filterSupport !== null) {
						args.push('-define');
						args.push('filter:support=' + options.filterSupport);
					}

					// set the resize function
					if (options.resizeFunction !== null) {
						args.push('-' + options.resizeFunction);
					}

					// set the width
					args.push(width);

					// set the unsharp mask
					if (options.unsharp.radius !== null &&
						options.unsharp.sigma !== null &&
						options.unsharp.gain !== null &&
						options.unsharp.threshold !== null) {
						args.push('-unsharp');
						args.push(options.unsharp.radius + 'x' + options.unsharp.sigma + '+' + options.unsharp.gain + '+' + options.unsharp.threshold);
					} else if (options.unsharp.radius !== null &&
						options.unsharp.sigma !== null &&
						options.unsharp.gain !== null) {
						args.push('-unsharp');
						args.push(options.unsharp.radius + 'x' + options.unsharp.sigma + '+' + options.unsharp.gain);
					} else if (options.unsharp.radius !== null &&
						options.unsharp.sigma !== null) {
						args.push('-unsharp');
						args.push(options.unsharp.radius + 'x' + options.unsharp.sigma);
					} else if (options.unsharp.radius !== null) {
						args.push('-unsharp');
						args.push(options.unsharp.radius);
					}

					// set the dither
					if (options.dither !== null) {
						if (options.dither === 'plus') {
							args.push('+dither');
						} else {
							args.push('-dither');
							args.push(options.dither);
						}
					}

					// set posterize
					if (options.posterize !== null) {
						args.push('-posterize');
						args.push(options.posterize);
					}

					// set background
					if (options.background !== null) {
						args.push('-background');
						args.push(options.background);
					}

					// set alpha
					if (options.alpha !== null) {
						args.push('-alpha');
						args.push(options.alpha);
					}

					// set the quality
					if (options.quality !== null) {
						args.push('-quality');
						args.push(options.quality);
					}

					// set pngPreserveColormap
					if (options.pngPreserveColormap === true) {
						args.push('-define');
						args.push('png:preserve-colormap=true');
					}

					// set jpegFancyUpsampling
					if (options.jpegFancyUpsampling !== null) {
						args.push('-define');
						args.push('jpeg:fancy-upsampling=' + options.jpegFancyUpsampling);
					}

					// set pngCompressionFilter
					if (options.pngCompressionFilter !== null) {
						args.push('-define');
						args.push('png:compression-filter=' + options.pngCompressionFilter);
					}

					// set pngCompressionLevel
					if (options.pngCompressionLevel !== null) {
						args.push('-define');
						args.push('png:compression-level=' + options.pngCompressionLevel);
					}

					// set pngCompressionStrategy
					if (options.pngCompressionStrategy !== null) {
						args.push('-define');
						args.push('png:compression-strategy=' + options.pngCompressionStrategy);
					}

					// set pngExcludeChunk
					if (options.pngExcludeChunk !== null) {
						args.push('-define');
						args.push('png:exclude-chunk=' + options.pngExcludeChunk);
					}

					// set interlace
					if (options.interlace !== null) {
						args.push('-interlace');
						args.push(options.interlace);
					}

					// colorspace
					if (options.colorspace !== null) {
						args.push('-colorspace');
						args.push(options.colorspace);
					}

					// set strip
					if (options.strip === true) {
						args.push('-strip');
					}

					// add output filename
					args.push(dstPath);

					// do the resizing
					im.convert(args, function(err, stdout, stderr) {
						// bail if there’s an error
						if (err) {
							handleImageErrors(err);
							return deferred.reject(error);
						}

						// output info about the saved image
						grunt.verbose.ok('Resized image: ' + srcPath + ' resized to ' + width + 'px wide, saved to ' + dstPath);
						return deferred.resolve(true);
					});
				});
			}

			return deferred.promise;
		},


		/**
		 * Gets the destination path
		 *
		 * @private
		 * @param   {string}          srcPath   The source path
		 * @param   {string}          filename  Image Filename
		 * @param   {object}          options
		 * @param   {int}             width
		 * @param   {string}          customDest
		 * @param   {string}          origCwd
		 * @return                    The complete path and filename
		 */
		getDestination = function(srcPath, dstPath, options, width, customDest, origCwd) {
			var baseName =	'',
				dirName =	'',
				extName =	'';

			extName = path.extname(dstPath);
			baseName = path.basename(srcPath, extName); // filename without extension
			dirName = path.dirname(dstPath);

			checkDirectoryExists(path.join(dirName));

			return path.join(dirName, baseName + '-w' + width + extName);
		};





	// let's get this party started
	grunt.registerMultiTask('respimg', 'Automatically resizes image assets.', function() {
		var task = this;

		// Merge task-specific and/or target-specific options with these defaults.
		var options = this.options(DEFAULT_OPTIONS);

		// change some default options if we’re not optimizing images
		if (!options.optimize.rasterOutput) {
			DEFAULT_OPTIONS.alpha =						'Background';
			DEFAULT_OPTIONS.background =				'Black';
			DEFAULT_OPTIONS.colorspace =				'sRGB';
			DEFAULT_OPTIONS.jpegFancyUpsampling =		'off';
			DEFAULT_OPTIONS.pngCompressionFilter =		5;
			DEFAULT_OPTIONS.pngCompressionLevel =		9;
			DEFAULT_OPTIONS.pngCompressionStrategy =	1;
			DEFAULT_OPTIONS.pngExcludeChunk =			'all';
			DEFAULT_OPTIONS.pngPreserveColormap =		true;
			DEFAULT_OPTIONS.strip =						true;
			DEFAULT_OPTIONS.unsharp.threshold =			0.065;
			options = this.options(DEFAULT_OPTIONS);
		}

		// now some setup
		var done =			this.async(),
			i =				0,
			series =		[],
			task =			this,
			promise =		q(),
			cliPath =		getPathToCli(),
			outputFiles = 	[],
			svgo =			new SVGO(options),
			totalSaved =	0;

		// make sure valid sizes have been defined
		if (!isValidArray(options.widths)) {
			return grunt.fail.fatal('No widths have been defined.');
		}

		// make sure ImageOptim is available
		if (!cliPath) {
			return grunt.fail.fatal('Unable to locate ImageOptim-CLI.');
		}

		async.series([

			// optimize SVG inputs
			function(callback) {
				grunt.log.writeln('Optimizing SVG inputs…');
				task.files.forEach(function (file) {
					// bail if it’s not an SVG
					var extName = path.extname(file.dest).toLowerCase();
					if (extName === '.svg') {
						var	srcPath = file.src[0],
							srcSvg = grunt.file.read(srcPath);

						svgo.optimize(srcSvg, function (result) {
							if (result.error) {
								grunt.warn('Error parsing SVG:', result.error);
							} else {
								var saved = srcSvg.length - result.data.length;
								var percentage = saved / srcSvg.length * 100;
								totalSaved += saved;

								grunt.log.writeln(srcPath + ' (saved ' + prettyBytes(saved) + ' ' + Math.round(percentage) + '%)');
								grunt.file.write(file.dest, result.data);
							}
						});
					}
				});
				grunt.log.writeln('Total saved: ' + prettyBytes(totalSaved));
				callback(null);
			},

			// optimize raster inputs
			function(callback) {
				grunt.log.writeln('Optimizing raster inputs…');
				task.files.forEach(function(file) {
					var extName = path.extname(file.dest).toLowerCase();
					if (extName !== '.svg') {
						promise = processBatch('file', cliPath, options, file.src, promise);
						promise = processBatch('dir', cliPath, options, file.src, promise);
					}
				});

				promise.done(function() {
					callback(null);
				});
			},

			// do some validation
			function(callback) {
				async.each(options.widths, function(width, callback2) {
					// make sure the width is valid
					if (!isValidWidth(width)) {
						return grunt.log.warn('Width is invalid (' + width + '). Make sure it’s an integer.');
					}

					// make sure quality is valid
					if (!isValidQuality(options.quality)) {
						return grunt.log.warn('Quality is invalid (' + options.quality + '). Make sure it’s a value between 0 and 100.');
					}

					// make sure there are valid images to resize
					if (task.files.length === 0) {
						return grunt.log.warn('Unable to compile; no valid source files were found.');
					}

					callback2(null);
				}, callback);
			},

			// process images
			function(callback) {
				grunt.log.writeln('Resizing images…');
				async.each(options.widths, function(width, callback2) {
					async.each(task.files, function(f, callback3) {
						// make sure we have a valid target and source
						checkForValidTarget(f);
						checkForSingleSource(f);

						// set the source and destination
						var srcPath =	f.src[0],
							dstPath =	getDestination(srcPath, f.dest, options, width, f.custom_dest, f.orig.cwd);

						// process the image
						var promise2 = q();
						promise2 = processImage(srcPath, dstPath, options, width);
						promise2.done(function() {
							var extName = path.extname(dstPath).toLowerCase();
							if (extName === '.svg') {
								dstPath = dstPath.replace(/\.svg$/i, '.png');
								extName = '.png';
							}
							outputFiles.push(dstPath);
							callback3(null);
						});
					}, callback2);
				}, callback);
			},

			// optimize outputs
			function(callback) {
				grunt.log.writeln('Optimizing resized images…');
				var promise2 = q();
				promise2 = processFiles(outputFiles.map(function(dir) {
					return path.resolve(__dirname, '../' + dir);
				}), cliPath);

				promise2.done(function() {
					callback(null);
				});
			}

		],
		function(err, results) {
			done();
		});
	});
};
