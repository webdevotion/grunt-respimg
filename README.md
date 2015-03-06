# grunt-respimg

**A responsive image workflow for optimizing and resizing your images.**

This plugin will:

* Efficiently resize PNGs, JPEGs, and non-animated GIFs to widths that you specify
* Rasterize SVGs to PNGs at widths that you specify
* Optimize all your input and output images (PNGs, JPEGs, GIFs, and SVGs)

The output images should be visually indistinguishable from those output by Photoshop’s *Save for web…*, but with smaller average file sizes.

This plugin is heavily indebted to (and has portions borrowed liberally from):

* [grunt-responsive-images](https://github.com/andismith/grunt-responsive-images),
* [grunt-svg2png](https://github.com/dbushell/grunt-svg2png),
* [grunt-imageoptim](https://github.com/JamieMason/grunt-imageoptim), and
* [grunt-svgmin](https://github.com/sindresorhus/grunt-svgmin)


## Getting Started

This plugin requires Grunt `~0.4.5`

If you haven’t used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you’re familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-respimg --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-respimg');
```

For image optimization, you’ll need to install [ImageOptim](https://imageoptim.com/).

## The “respimg” task

### Overview

In your project’s Gruntfile, add a section named `respimg` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  respimg: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists go here.
    },
  },
});
```

### Options you should care about

The only option you should really care about setting is `widths`:

#### options.widths

Type: `int[]`  
Default value: `[ 320, 640, 1280 ]`  

The widths that images should be resized to.

### Options you probably don’t need to care about

For the most part, you should probably use the default options. They are designed to produce images that are generally visually indistinguishable from Photoshop’s *Save for web…*, but at a smaller file size.

#### options.alpha

Type: `String` or `null`  
Possible values: `null`, `Activate`, `Associate`, `Background`, `Copy`, `Deactivate`, `Disassociate`, `Extract`, `Off`, `On`, `Opaque`, `Remove`, `Set`, `Shape`, `Transparent`  
Default value: `null`  
No-optim default value: `Background`

> Gives control of the alpha/matte channel of an image.  
> – [ImageMagick: Command-line Options (alpha)](http://www.imagemagick.org/script/command-line-options.php#alpha)

#### options.background

Type: `String` or `null`  
Possible values: `null` or an [ImageMagick-compatible color](http://www.imagemagick.org/script/color.php)  
Default value: `null`  
No-optim default value: `Black`

> Set the background color.  
> – [ImageMagick: Command-line Options (background)](http://www.imagemagick.org/script/command-line-options.php#background)

#### options.colorspace

Type: `String` or `null`  
Possible values: `null`, `CMY`, `CMYK`, `Gray`, `HCL`, `HCLp`, `HSB`, `HSI`, `HSL`, `HSV`, `HWB`, `Lab`, `LCHab`, `LCHuv`, `LMS`, `Log`, `Luv`, `OHTA`, `Rec601YCbCr`, `Rec709YCbCr`, `RGB`, `scRGB`, `sRGB`, `Transparent`, `xyY`, `XYZ`, `YCbCr`, `YCC`, `YDbDr`, `YIQ`, `YPbPr`, `YUV`   
Default value: `null`  
No-optim default value: `sRGB`

> Set the image colorspace.  
> – [ImageMagick: Command-line Options (colorspace)](http://www.imagemagick.org/script/command-line-options.php#colorspace)

#### options.dither

Type: `String` or `null`  
Possible values: `null`, `FloydSteinberg`, `None`, `plus`, `Riemersma`   
Default value: `None`  

> Apply a Riemersma or Floyd-Steinberg error diffusion dither to images when general color reduction is applied via an option, or automagically when saving to specific formats.  
> – [ImageMagick: Command-line Options (dither)](http://www.imagemagick.org/script/command-line-options.php#dither)

#### options.filter

Type: `String` or `null`  
Possible values: `null`, `Bartlett`, `Bessel`, `Blackman`, `Bohman`, `Box`, `Catrom`, `Cosine`, `Cubic`, `Gaussian`, `Hamming`, `Hann`, `Hanning`, `Hermite`, `Jinc`, `Kaiser`, `Lagrange`, `Lanczos`, `Lanczos2`, `Lanczos2Sharp`, `LanczosRadius`, `LanczosSharp`, `Mitchell`, `Parzen`, `Point`, `Quadratic`, `Robidoux`, `RobidouxSharp`, `Sinc`, `SincFast`, `Spline`, `Triangle`, `Welch`, `Welsh`   
Default value: `Triangle`  

> Use this *type* of filter when resizing or distorting an image.  
> – [ImageMagick: Command-line Options (filter)](http://www.imagemagick.org/script/command-line-options.php#filter)

#### options.filterSupport

Type: `float` or `null`  
Default value: `2`  

> Set the filter support radius. Defines how large the filter should be and thus directly defines how slow the filtered resampling process is. All filters have a default ‘prefered’ support size. Some filters like `Lagrange` and windowed filters adjust themselves depending on this value. With simple filters this value either does nothing (but slow the resampling), or will clip the filter function in a detrimental way.  
> – [ImageMagick: Command-line Options (filter)](http://www.imagemagick.org/script/command-line-options.php#filter)

#### options.interlace

Type: `String` or `null`  
Possible values: `null`, `GIF`, `JPEG`, `line`, `none`, `partition`, `plane`, `PNG`   
Default value: `Triangle`  

> the type of interlacing scheme.  
> – [ImageMagick: Command-line Options (interlace)](http://www.imagemagick.org/script/command-line-options.php#interlace)

#### options.jpegFancyUpsampling

Type: `String` or `null`  
Possible values: `null`, `off`, `on`   
Default value: `null`  
No-optim default value: `off`

[ImageMagick: Command-line Options (define)](http://www.imagemagick.org/script/command-line-options.php#define)

#### options.optimize

Type: `object`  

##### options.optimize.svg

Type: `boolean`  
Default value: `true`  

Whether to optimize SVG files.

##### options.optimize.rasterInput

Type: `boolean`  
Default value: `true`  

Whether to optimize input raster images (e.g. PNGs, JPEGs, GIFs).

##### options.optimize.rasterOutput

Type: `boolean`  
Default value: `true`  

Whether to optimize output/resized raster images (e.g. PNGs, JPEGs, GIFs).

#### options.pngCompressionFilter

Type: `int` or `null`  
Possible values: `null`, `0`–`9`   
Default value: `null`  
No-optim default value: `5`

> valid values are 0 through 9. 0-4 are the corresponding PNG filters, 5 means adaptive filtering except for images with a colormap, 6 means adaptive filtering for all images, 7 means MNG "loco" compression, 8 means Z_RLE strategy with adaptive filtering, and 9 means Z_RLE strategy with no filtering.  
> – [ImageMagick: Command-line Options (define)](http://www.imagemagick.org/script/command-line-options.php#define)

#### options.pngCompressionLevel

Type: `int` or `null`  
Possible values: `null`, `0`–`9`   
Default value: `null`  
No-optim default value: `9`

> valid values are 0 through 9, with 0 providing the least but fastest compression and 9 usually providing the best and always the slowest.  
> – [ImageMagick: Command-line Options (define)](http://www.imagemagick.org/script/command-line-options.php#define)

#### options.pngCompressionStrategy

Type: `int` or `null`  
Possible values: `null`, `0`–`9`   
Default value: `null`  
No-optim default value: `1`

> valid values are 0 through 4, meaning default, filtered, huffman_only, rle, and fixed ZLIB compression strategy. If you are using an old zlib that does not support Z_RLE (before 1.2.0) or Z_FIXED (before 1.2.2.2), values 3 and 4, respectively, will use the zlib default strategy instead.  
> – [ImageMagick: Command-line Options (define)](http://www.imagemagick.org/script/command-line-options.php#define)

#### options.pngExcludeChunk

Type: `String` or `null`  
Possible values: `null`, `all`, `date`, `none`, or the name(s) of chunk(s) to be excluded   
Default value: `null`  
No-optim default value: `all`

> ancillary chunks to be excluded from … PNG output.
> 
> The *value* can be the name of a PNG chunk-type such as *bKGD*, a comma-separated list of chunk-names (which can include the word *date*, the word *all*, or the word *none*). Although PNG chunk-names are case-dependent, you can use all lowercase names if you prefer.
> 
> – [ImageMagick: Command-line Options (define)](http://www.imagemagick.org/script/command-line-options.php#define)

#### options.pngPreserveColormap

Type: `Boolean` or `null`  
Default value: `true`  

> Use the existing image->colormap. Normally the PNG encoder will try to optimize the palette, eliminating unused entries and putting the transparent colors first. If this flag is set, that behavior is suppressed.  
> – [ImageMagick: Command-line Options (define)](http://www.imagemagick.org/script/command-line-options.php#define)

#### options.posterize

Type: `int` or `null`  
Default value: `136`  

> reduce the image to a limited number of color levels per channel.  
> – [ImageMagick: Command-line Options (posterize)](http://www.imagemagick.org/script/command-line-options.php#posterize)

#### options.quality

Type: `int` or `null`  
Possible values: `null`, `0`–`100`   
Default value: `82`  

> JPEG/MIFF/PNG compression level.  
> – [ImageMagick: Command-line Options (quality)](http://www.imagemagick.org/script/command-line-options.php#quality)

#### options.resizeFunction

Type: `String` or `null`  
Possible values: `null`, `adaptive`, `distort`, `geometry`, `interpolative`, `liquid`, `resize`, `sample`, `scale`, `thumbnail`   
Default value: `thumbnail`  

* > **-adaptive-resize** … Resize the image using data-dependent triangulation.  
> – [ImageMagick: Command-line Options (adaptive-resize)](http://www.imagemagick.org/script/command-line-options.php#adaptive-resize)
* > **-distort** … distort an image  
> – [ImageMagick: Command-line Options (distort)](http://www.imagemagick.org/script/command-line-options.php#distort)
* > **-geometry** … Set the preferred size and location of the image.  
> – [ImageMagick: Command-line Options (geometry)](http://www.imagemagick.org/script/command-line-options.php#geometry)
* > **-interpolative-resize** … The "`-interpolative-resize`" operator is practically identical to the previous Adaptive Resize operator. However this operator will use the current "`-interpolate`" setting rather than a fixed 'Mesh' interpolation method.  
> – [Resize or Scaling -- IM v6 Examples (Interpolative Resize)](http://www.imagemagick.org/Usage/resize/#interpolative-resize)
* > **-liquid-rescale** … rescale image with seam-carving.  
> – [ImageMagick: Command-line Options (liquid-rescale)](http://www.imagemagick.org/script/command-line-options.php#liquid-rescale*)
* > **-resize** … Resize an image.  
> – [ImageMagick: Command-line Options (resize)](http://www.imagemagick.org/script/command-line-options.php#resize)
* > **-sample** … minify / magnify the image with pixel subsampling and pixel replication, respectively.  
> – [ImageMagick: Command-line Options (sample)](http://www.imagemagick.org/script/command-line-options.php#sample)
* > **-scale** … minify / magnify the image with pixel block averaging and pixel replication, respectively.  
> – [ImageMagick: Command-line Options (scale)](http://www.imagemagick.org/script/command-line-options.php#scale)
* > **-thumbnail** … Create a thumbnail of the image.  
> – [ImageMagick: Command-line Options (thumbnail)](http://www.imagemagick.org/script/command-line-options.php#thumbnail)

#### options.strip

Type: `Boolean` or `null`  
Default value: `null`  
No-optim default value: `true`

> strip the image of any profiles or comments.  
> – [ImageMagick: Command-line Options (strip)](http://www.imagemagick.org/script/command-line-options.php#strip)

#### options.svgoPlugins

Type: `Object[]`  
Default value: `[ { removeUnknownsAndDefaults : false } ]`  

> …to customize SVG optimisation, you can disable/enable any SVGO plugins listed at the [SVGO repository](https://github.com/svg/svgo/tree/master/plugins).
> 
> To disable plugins with the Gruntfile.js, look for the plugin name at the [SVGO repository](https://github.com/svg/svgo/tree/master/plugins) and copy the plugin name (minus the file extension). Then set its value in the JSON to false in comma-separated objects.
>   
> – [grunt-svgmin readme.md](https://github.com/sindresorhus/grunt-svgmin/blob/master/readme.md)

#### options.unsharp

Type: `object`  

> sharpen the image with an unsharp mask operator.  
> – [ImageMagick: Command-line Options (unsharp)](http://www.imagemagick.org/script/command-line-options.php#unsharp)

##### options.unsharp.radius

Type: `float` or `null`  
Default value: `0.25`  

> The radius of the Gaussian, in pixels,  not counting the center   
> – [ImageMagick: Command-line Options (unsharp)](http://www.imagemagick.org/script/command-line-options.php#unsharp)

##### options.unsharp.sigma

Type: `float` or `null`  
Default value: `0.25`  

> The standard deviation of the Gaussian, in pixels   
> – [ImageMagick: Command-line Options (unsharp)](http://www.imagemagick.org/script/command-line-options.php#unsharp)

##### options.unsharp.gain

Type: `float` or `null`  
Default value: `9`  

> The fraction of the difference between the original and the blur image that is added back into the original   
> – [ImageMagick: Command-line Options (unsharp)](http://www.imagemagick.org/script/command-line-options.php#unsharp)

##### options.unsharp.threshold

Type: `float` or `null`  
Default value: `0.045`  
No-optim default value: `0.065`

> The threshold, as a fraction of *QuantumRange*, needed to apply the difference amount   
> – [ImageMagick: Command-line Options (unsharp)](http://www.imagemagick.org/script/command-line-options.php#unsharp)

### Usage Examples

#### Default Options

In this example, the default options are used to do resize images to 320px, 640px, and 1280px wide.

```js
grunt.initConfig({
	respimg: {
		default: {
			files: [{
				expand: true,
				cwd: 'src/img/',
				src: ['**.{gif,jpg,png,svg}'],
				dest: 'build/img/'
			}]
		}
	},
});
```

If `src/img/` contained four files — `testGif.gif`, `testJpeg.jpg`, `testPng.png`, and `testSvg.svg` — then `build/img/` would end up with 13 files:

1. `testGif-w320.gif`
2. `testGif-w640.gif`
3. `testGif-w1280.gif`
4. `testJpeg-w320.jpg`
5. `testJpeg-w640.jpg`
6. `testJpeg-w1280.jpg`
7. `testPng-w320.png`
8. `testPng-w640.png`
9. `testPng-w1280.png`
10. `testSvg.svg` (this is an *optimized* version of the original `testSvg.svg`)
11. `testSvg-w320.png`
12. `testSvg-w640.png`
13. `testSvg-w1280.png`

#### Custom widths

You probably don’t really want to use the default widths. You should widths that make sense for your project.

```js
grunt.initConfig({
	respimg: {
		default: {
			options: {
				widths: [
					200,
					400
				]
			},
			files: [{
				expand: true,
				cwd: 'src/img/',
				src: ['**.{gif,jpg,png,svg}'],
				dest: 'build/img/'
			}]
		}
	},
});
```

If `src/img/` contained four files — `testGif.gif`, `testJpeg.jpg`, `testPng.png`, and `testSvg.svg` — then `build/img/` would end up with 9 files:

1. `testGif-w200.gif`
2. `testGif-w400.gif`
3. `testJpeg-w200.jpg`
4. `testJpeg-w400.jpg`
5. `testPng-w200.png`
6. `testPng-w400.png`
7. `testSvg.svg` (this is an *optimized* version of the original `testSvg.svg`)
8. `testSvg-w200.png`
9. `testSvg-w400.png`

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

### 0.1.0

* README changes
* Publish with npm

### 0.0.1

* Initial testing release. Probably filled with with bugs.

### 0.0.0

* Super basic pre-0.0.1 release. Sorta working, most options ignored.

