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
					dest: 'tmp/'
				},{
					expand: true,
					cwd: 'test/assets/',
					src: ['svg/**.{jpg,gif,png,svg}'],
					dest: 'tmp/'
				}]
			},
			nooptim: {
				options: {
					optimize: {
						svg:			false,
						rasterInput:	false,
						rasterOutput:	false
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
			},
			svgoPlugins: {
				options: {
					optimize: {
						svg:			true,
						rasterInput:	false,
						rasterOutput:	false
					},

					svgoPlugins: [
						{ cleanupAttrs:						false },
						{ cleanupEnableBackground:			false },
						{ cleanupIDs:						false },
						{ cleanupListOfValues:				false },
						{ cleanupNumericValues:				false },
						{ collapseGroups:					false },
						{ convertColors:					false },
						{ convertPathData:					false },
						{ convertShapeToPath:				false },
						{ convertStyleToAttrs:				false },
						{ convertTransform:					false },
						{ mergePaths:						false },
						{ moveElemsAttrsToGroup:			false },
						{ moveGroupAttrsToElems:			false },
						{ removeComments:					false },
						{ removeDesc:						false },
						{ removeDoctype:					false },
						{ removeEditorsNSData:				false },
						{ removeEmptyAttrs:					false },
						{ removeEmptyContainers:			false },
						{ removeEmptyText:					false },
						{ removeHiddenElems:				false },
						{ removeMetadata:					false },
						{ removeNonInheritableGroupAttrs:	false },
						{ removeRasterImages:				false },
						{ removeTitle:						false },
						{ removeUnknownsAndDefaults:		false },
						{ removeUnusedNS:					false },
						{ removeUselessStrokeAndFill:		false },
						{ removeViewBox:					false },
						{ removeXMLProcInst:				false },
						{ sortAttrs:						false },
						{ transformsWithOnePath:			false }
					]
				},
				files: [{
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
