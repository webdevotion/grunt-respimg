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
 * @version 1.0.0
 */

var fs =    require('fs'),
	file =  phantom.args[0],
	dest =	phantom.args[1],
	width = phantom.args[2],

	page,
	svgdata,
	img,
	html,
	svg,
	frag,

	process = function() {
		// open a new web page
		page = require('webpage').create();

		// read the SVG data from the SVG file
		svgdata = fs.read(file) || '';

		// load the SVG into a div so we can measure it’s native width and height
		frag = window.document.createElement('div');
		frag.innerHTML = svgdata;
		svg = frag.querySelector('svg');
		svgWidth = svg.getAttribute('width') || '1';
		svgWidth = parseFloat(svgWidth.replace('px', ''));
		svgHeight = svg.getAttribute('height') || '1';
		svgHeight = parseFloat(svgHeight.replace('px', ''));

		// use the target width and the native SVG measurements to calculate a new height
		width = parseFloat(width);
		height = parseFloat(svgHeight * width / svgWidth);

		// create an image element with the SVG data
		img = window.document.createElement('img');
		img.src = 'data:image/svg+xml;utf8,' + svgdata;

		// set the image width and height to our output width and newly calculated height
		img.setAttribute('width', parseFloat(width));
		img.setAttribute('height', parseFloat(height));
		img.style.cssText = 'display: block; width: ' + width + 'px; height: ' + height + 'px';

		// set the viewport to the size of the image
		page.viewportSize = {
			width: width,
			height: height
		};

		// open a page containing the image we just created
		html = 'data:text/html,<!DOCTYPE html><title>svg!</title><body style="padding:0;margin:0">' + img.outerHTML + '</body>';
		page.open(html, function(status) {
			// render the page to a PNG
			page.render(dest);

			// done!
			console.log(JSON.stringify({"status": status}));
			phantom.exit(0);
			return;
		});
	};

process();
