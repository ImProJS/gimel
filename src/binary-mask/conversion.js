gimel.module('binaryMask').extend(function(moduleContent) {
		/**
     * Convert a binary mask to an RGBA image, in order to be displayed.
     * @return {GimelImage} image representing the mask
     */
    gimel.BinaryMask.prototype.toUint8T4ChImage = function() { 
    		var image = new gimel.Uint8T4ChImage(this.width, this.height);

    		var maskData  = this.data;
    		var imageData = image.data; 

	    	for (var m = 0, i = 0, mm = this.length; m < mm; ++m) {
		        imageData[i++] = imageData[i++] = imageData[i++] = maskData[m];
		        imageData[i++] = 0xff;
    		}

    		return image;
    };

		/**
     * Convert an RGBA image to a binary mask: clone red channel (0 -> 0x00, 1..255 -> 0xff).
     * For binarization methods, see binarization module.
     * @param {GimelImage} image - image representing the mask
     * @return {BinaryMask} mask read from image
     */
    gimel.BinaryMask.prototype.fromUint8T4ChImage = function(image) { 
    		var maskData  = this.data;
    		var imageData = image.data; 

    		this.width  = image.width;
    		this.height = image.height;
    		this.length = this.width*this.height;

	    	for (var i = 0, m = 0, ii = image.length; i < ii; i += 4, ++m) {
		        maskData[m] = (imageData[i] > 0)? 0xff : 0x00;
    		}

    		return this;
    };

		/**
     * Superimpose the mask on a given image.
     * @param {GimelImage} image - the given image
     * @return {GimelImage} mask read from image
     */
    gimel.BinaryMask.prototype.superimposeOn = function(image, rgbaColor) {
    		var maskData  = this.data;
    		var imageData = image.data; 

    		var opacity = rgbaColor[3];
    		var r = rgbaColor[0]*opacity/0xff;
    		var g = rgbaColor[1]*opacity/0xff;
    		var b = rgbaColor[2]*opacity/0xff;
    		var coefficient = 0xff/(0xff+opacity);

	    	for (var i = 0, m = 0, ii = image.length; i < ii; i += 4, ++m) {
	    			if (maskData[m] > 0) {
	    					imageData[i    ] = Math.round((imageData[i    ] + r)*coefficient);
	    					imageData[i + 1] = Math.round((imageData[i + 1] + g)*coefficient);
	    					imageData[i + 2] = Math.round((imageData[i + 2] + b)*coefficient);
	    			} 
    		}

    		return image;
    };
});