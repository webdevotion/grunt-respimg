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
 *		<https://github.com/dbushell/grunt-svg2png>
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

		DEFAULT_OPTIONS = {
			quality :		100,	// value between 1 and 100
			widths : [
							320,
							640,
							1280
			]
		},





		/**
		 * Checks for a valid array, and that there are items in the array.
		 *
		 * @private
		 * @param   {object}          obj       The object to check
		 * @return  {boolean}         Whether it is a valid array with items.
		 */
		isValidArray = function(obj) {
			return (obj.isArray() && obj.length > 0);
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
				if (!!(width || 0).toString().match(pxRegExp) {
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
			if (error.message.indexOf('ENOENT') > -1) {
				grunt.log.error(error.message);
				grunt.fail.warn('\nPlease ensure ImageMagick is installed correctly.');
			} else {
				grunt.fail.warn(error.message);
			}
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
		 * Outputs the result of the tally.
		 *
		 * @private
		 * @param   {number}          count     The file count.
		 * @param   {string}          name      Name of the image.
		 */
		outputResult = function(count, name) {
			if (count) {
				grunt.log.writeln('Resized ' + count.toString().cyan + ' ' +
				grunt.util.pluralize(count, 'file/files') + ' for ' + name);
			}
		},


		/**
		 * Process the image
		 *
		 * @private
		 * @param   {srcPath}         count     The source path
		 * @param   {string}          dstPath   The destination path
		 * @param   {Object}          dstPath   Size options
		 * @param   {number}          tally     The file count
		 * @param   {Object}          callback  Callback function
		 */
		processImage = function(srcPath, dstPath, sizeOptions, tally, callback) {
			// determine the image type by looking at the file extension
			// TODO: do this better, maybe with something like <https://github.com/mscdex/mmmagic>
			var extName = path.extname(dstPath).toLowerCase();

			// if it’s an SVG, generate a PNG using PhantomJS
			if (extName === '.svg') {

				// make the destination file is a PNG
				dstPath = dstPath.replace(/\.svg$/i, '-w' + sizeOptions.width + '.png');
				extName = '.png';

				var spawn = grunt.util.spawn({
						cmd :	phantomjs.path,
						args :	[
								path.resolve(__dirname, 'lib/svg2png.js'),
								srcPath,
								dstPath,
								sizeOptions.width
						]
					}
				);

				spawn.stdout.on('data', function(buffer) {
					try {
						var result = JSON.parse(buffer.toString());
						if (result.status) {
							grunt.verbose.ok('Resized image: ' + srcPath + ' resized to ' + sizeOptions.width + 'px wide, saved to ' + dstPath);
							tally[sizeOptions.id]++;
							return callback();
						}
					} catch (error) {
						handleImageErrors(error);
					}
				});


			// all other images get loaded into ImageMagick
			} else {
				var image = im(srcPath);

				// get properties about the image
				image.identify(function(err, data) {

					// bail if there’s an error
					if (error) {
						handleImageErrors(error);
					}

					// bail if it’s an animated GIF
					if (isAnimatedGif(data, dstPath)) {
						return callback();
					}

					// process the image
					image
						// set the image filter
						.filter(sizeOptions.filter);

						// set the quality
						.quality(sizeOptions.quality)

						// resize
						.resize(sizeOptions.width)

						// no transparency
						.transparent('none')

						// set bit depth to same as original image
						.bitdepth(data['depth'])

						// strip metadata
						.strip();

					// get the extension
					var extName = path.extname(dstPath).toLowerCase();

					// write the final file
					image.write(dstPath, function (error) {
						// bail if there’s an error
						if (error) {
							handleImageErrors(error);
							return callback();
						}

						// output info about the saved image
						grunt.verbose.ok('Resized image: ' + srcPath + ' resized to ' + sizeOptions.width + 'px wide, saved to ' + dstPath);
						tally[sizeOptions.id]++;
						return callback();
					});
				});
			}
		},


		/**
		 * Gets the destination path
		 *
		 * @private
		 * @param   {string}          srcPath   The source path
		 * @param   {string}          filename  Image Filename
		 * @param   {object}          sizeOptions
		 * @param   {string}          customDest
		 * @param   {string}          origCwd
		 * @return                    The complete path and filename
		 */
		getDestination = function(srcPath, dstPath, sizeOptions, customDest, origCwd) {
			var baseName =	'',
				dirName =	'',
				extName =	'';

			extName = path.extname(dstPath);
			baseName = path.basename(srcPath, extName); // filename without extension
			dirName = path.dirname(dstPath);

			checkDirectoryExists(path.join(dirName));

			return path.join(dirName, baseName + '-w' + sizeOptions.width + extName);
		};





	// let's get this party started
	grunt.registerMultiTask('respimg', 'Automatically resizes image assets.', function() {
		var done =		this.async(),
			i =			0,
			series =	[],
			options =	this.options(DEFAULT_OPTIONS), // Merge task-specific and/or target-specific options with these defaults.
			tally =		{},
			task =		this;

		// make sure valid sizes have been defined
		if (!isValidArray(options.widths)) {
			return grunt.fail.fatal('No widths have been defined.');
		}

		// for each output width, do some things…
		options.widths.forEach(function(width) {
			// combine the existing options with the width
			sizeOptions.width = width;

			// make sure the width is valid
			if (!isValidWidth(sizeOptions.width)) {
				return grunt.log.warn('Width is invalid (' + sizeOptions.width + '). Make sure it’s an integer.');
			}

			// make sure quality is valid
			if (!isValidQuality(sizeOptions.quality)) {
				return grunt.log.warn('Quality is invalid (' + sizeOptions.quality + '). Make sure it’s a value between 0 and 100.');
			}

			// set an ID and use it for the tally
			sizeOptions.id = i;
			i++;
			tally[sizeOptions.id] = 0;

			// make sure there are valid images to resize
			if (task.files.length === 0) {
				return grunt.log.warn('Unable to compile; no valid source files were found.');
			}

			// iterate over all specified file groups
			task.files.forEach(function(f) {
				// make sure we have a valid target and source
				checkForValidTarget(f);
				checkForSingleSource(f);

				// set the source and destination
				var srcPath =	f.src[0],
					dstPath =	getDestination(srcPath, f.dest, sizeOptions, f.custom_dest, f.orig.cwd);

				// process the image
				series.push(function(callback) {
					return processImage(srcPath, dstPath, sizeOptions, tally, callback);
				}
			});

			// output the result
			series.push(function(callback) {
				outputResult(tally[sizeOptions.id], sizeOptions.name);
				return callback();
			});
		});

		async.series(series, done);
	});
};
