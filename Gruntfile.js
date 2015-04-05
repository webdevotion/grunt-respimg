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
 * @version 0.1.0
 */

 'use strict';

 module.exports = function(grunt) {
 	grunt.initConfig({
		respimg: {
			default: {
				files: [{
					expand: true,
					cwd: 'test/assets/',
					src: ['raster/**.{jpg,gif,png,svg}'],
					dest: 'test/generated/default/'
				},{
					expand: true,
					cwd: 'test/assets/',
					src: ['svg/**.{jpg,gif,png,svg}'],
					dest: 'test/generated/default/'
				}]
			}
		},

		// Unit tests.
		nodeunit: {
			tests: ['test/**/*_test.js']
		}
	});

	// Actually load this plugin's task(s).
	grunt.loadTasks('tasks');

	grunt.registerTask('default', ['test']);
	grunt.registerTask('test', ['respimg', 'nodeunit']);

	grunt.loadNpmTasks('grunt-contrib-nodeunit');
};
