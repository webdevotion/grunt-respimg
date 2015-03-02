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
 *		<https://github.com/JamieMason/grunt-imageoptim>
 *
 * @author David Newton (http://twitter.com/newtron)
 * @version 0.0.0
 */

var fs =    require('fs'),
	file =  phantom.args[0],
	dest =	phantom.args[1],
	width = phantom.args[2],

	page,
	svgdata,
	img,
	html,

	process = function() {
		// open a new web page
		page = require('webpage').create();

		// read the SVG data from the SVG file
		svgdata = fs.read(file) || '';

		// create an image element with the SVG data
		img = window.document.createElement('img');
		img.src = 'data:image/svg+xml;utf8,' + svgdata;

		// set the image width to our output width
		// height *should* adjust automatically to maintain aspect ratio
		img.setAttribute('width', parseFloat(width));
		img.style.cssText = 'display: block; width: ' + width + 'px; height: auto';

		// set the viewport to the size of the image
		page.viewportSize = {
			width: width,
			height: img.height
		};

		// open a page containing the image we just created
		html = 'data:text/html,<!DOCTYPE html><title>svg!</title><body style="padding:0;margin:0">' + img.outerHTML + '</body></html>';
		page.open(html, function(status) {
			// render the page to a PNG
			page.render(dest);

			// done!
			phantom.exit(0);
			return;
		});
	};

process();
