gimel.module('imageTemplate').extend(function(moduleContent) {
    moduleContent.extend(function(GimelImage, dataType, channels) {
        if (channels === 4) {
            /**
             * The mono-channel version of this GimelImage class (same data type)
             */
            GimelImage.prototype.T_1CH_IMAGE = gimel[dataType + '1ChImage'];
        } else if (channels === 1) {
            /**
             * The 4-channel version of this GimelImage class (same data type)
             */
            GimelImage.prototype.T_4CH_IMAGE = gimel[dataType + '4ChImage'];
        }

        /**
         * Make an exact copy of an image
         * @return {GimelImage} this the new image
         */
        GimelImage.prototype.clone = function() {
            return new GimelImage(this.width, this.height, this.data);
        };

        /**
         * Gives a new image with the same structure (width, height, channels)
         * @return {GimelImage} this the new image
         */
        GimelImage.prototype.cloneStructure = function() {
            return new GimelImage(this.width, this.height);
        };

        /**
         * Copy image data from a (different) typed image
         * @param {GimelImage} image the given image
         * @return {GimelImage} this image
         */
        GimelImage.prototype.from = function(image) {
            var dataSrc = image.data;
            var dataDest = this.data;
            for (var t = 0, tt = image.length; t < tt; ++t) {
                dataDest[t] = dataSrc[t];
            }
            return this;
        };

        /**
         * Copy image data from a same typed image
         * @param {GimelImage} image the given image
         * @return {GimelImage} this image
         */
        GimelImage.prototype.set = function(image) {
            this.data.set(image.data);
            return this;
        };

        if (channels === 1) {
            /**
             * Fill in a channel with a value
             * @param {number} value the value to set to pixels
             * @return {GimelImage} this image
             */
            GimelImage.prototype.fill = function(value) {
                var dataDest = this.data;
                for (var t = 0, tt = this.length; t < tt; ++t) {
                    dataDest[t] = value;
                }
                return this;
            };
        } else if (channels === 4) {
            /**
             * Fill in an image with channel values
             * @param {number} ch0 the first channel value
             * @param {number} ch1 the second channel value
             * @param {number} ch2 the third channel value
             * @param {number} ch3 the fourth channel value
             * @return {GimelImage} this image
             */
            GimelImage.prototype.fill = function(ch0, ch1, ch2, ch3) {
                var dataDest = this.data;
                for (var t = 0, tt = this.length; t < tt; t += 4) {
                    dataDest[t] = ch0;
                    dataDest[t + 1] = ch1;
                    dataDest[t + 2] = ch2;
                    dataDest[t + 3] = ch3;
                }
                return this;
            };

            /**
             * Fill in a channel with a value
             * @param {integer} channel the channel index
             * @param {number} value the value to set to channel
             * @return {GimelImage} this image
             */
            GimelImage.prototype.fillChannel = function(channel, value) {
                var dataDest = this.data;
                for (var t = 0, tt = this.length; t < tt; t += 4) {
                    dataDest[t + channel] = value;
                }
                return this;
            };

            /**
             * Paste an image on another one
             * @param {GimelImage} image the image to paste
             * @param {integer} x the x-position of the pasted image
             * @param {integer} y the y-position of the pasted image
             * @return {GimelImage} this image
             */
            GimelImage.prototype.paste = function(image, x, y) {
                var destWidth = this.width, srcWidth = image.width,
                dataSrc = image.data, dataDest = this.data;
                var channels = this.CHANNELS;
                for (var ySrc = 0, yy = image.height; y < yy; ++y) {
                    var tmpDest = (y + ySrc)*destWidth,
                        tmpSrc = ySrc*srcWidth;
                    for (var xSrc = 0, xx = image.width; x < xx; ++x) {
                        dataDest[(tmpDest + (x + xSrc))*channels] = dataSrc[(tmpSrc + xSrc)*channels];
                    }
                }

                return this;
            };

            /**
             * Paste an image on another one with a mask
             * @param {GimelImage} image the image to paste
             * @param {integer} x the x-position of the pasted image
             * @param {integer} y the y-position of the pasted image
             * @param {GimelImage} mask a 1-channel-image corresponding to the mask
             * @return {GimelImage} this image
             */
            GimelImage.prototype.pasteWithMask = function(image, x, y, mask) {
                var destWidth = this.width, srcWidth = image.width,
                dataSrc = image.data, dataDest = this.data;
                var channels = this.CHANNELS;
                for (var ySrc = 0, yy = image.height; y < yy; ++y) {
                    var tmpDest = (y + ySrc)*destWidth,
                        tmpSrc = ySrc*srcWidth;
                    for (var xSrc = 0, xx = image.width; x < xx; ++x) {
                        tmpSrc = (tmpSrc + xSrc)*channels;
                        dataDest[(tmpDest + (x + xSrc))*channels] = dataSrc[tmpSrc]*mask[tmpSrc];
                    }
                }

                return this;
            };
        }

    });
});

