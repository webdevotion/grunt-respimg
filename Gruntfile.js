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
 	grunt.initConfig({
		respimg: {
			target: {
				options: {
					optimize: {
						svg:			true,
						rasterInput:	true,
						rasterOutput:	true
					}
				},
				files: [{
					expand: true,
					cwd: 'test/assets/',
					src: ['raster/**.{jpg,gif,png,svg}'],
					dest: 'tmp/'
				},{
					expand: true,
					cwd: 'test/assets/',
					src: ['svg/**.{jpg,gif,png,svg}'],
					dest: 'tmp/'
				}]
			}
		}
	});

	// Actually load this plugin's task(s).
	grunt.loadTasks('tasks');

	// Whenever the "test" task is run, first clean the "tmp" dir, then run this
	// plugin's task(s), then test the result.
	grunt.registerTask('test', ['respimg']);

	// By default, lint and run all tests.
	grunt.registerTask('default', []);
};
