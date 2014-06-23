gimel.module('imageTemplate').extend(function(moduleContent) {
    gimel.imageTemplate.extend(function(GimelImage, dataType, channels) {
    if (channels === 1) {
        /**
         * Compute the sum of two images (each pixel value)
         * @param {GimelImage} image the given image
         * @return {GimelImage} this image
         */
        GimelImage.prototype.add = function(image) {
            var thisData = this.data;
            var srcData = image.data;

            for (var t = 0, tt = image.length; t < tt; ++t) {
                thisData[t] += srcData[t];
            }
            return this;
        };

        /**
         * Compute the difference of two images (each pixel value)
         * @param {GimelImage} image the given image
         * @return {GimelImage} this image
         */
        GimelImage.prototype.subtract = function(image) {
            var thisData = this.data;
            var srcData = image.data;

            for (var t = 0, tt = image.length; t < tt; ++t) {
                thisData[t] -= srcData[t];
            }
            return this;
        };

        /**
         * Compute the multiplication of two images (each pixel value)
         * @param {GimelImage} image the given image
         * @return {GimelImage} this image
         */
        GimelImage.prototype.multiply = function(image) {
            var thisData = this.data;
            var srcData = image.data;

            for (var t = 0, tt = image.length; t < tt; ++t) {
                thisData[t] *= srcData[t];
            }
            return this;
        };

        /**
         * Compute the difference of two images (each pixel value)
         * @param {GimelImage} image the given image
         * @return {GimelImage} this image
         */
        GimelImage.prototype.divide = function(image) {
            var thisData = this.data;
            var srcData = image.data;

            for (var t = 0, tt = image.length; t < tt; ++t) {
                thisData[t] /= srcData[t];
            }
            return this;
        };

        /**
         * Compute the square of each pixel value
         * @return {GimelImage} this image
         */
        GimelImage.prototype.square = function() {
            var thisData = this.data;

            for (var t = 0, tt = this.length; t < tt; ++t) {
                thisData[t] *= thisData[t];
            }
            return this;
        };

        /**
         * Compute the square root of each pixel value
         * @return {GimelImage} this image
         */
        GimelImage.prototype.sqrt = function() {
            var thisData = this.data;
            var sqrt = Math.sqrt;

            for (var t = 0, tt = this.length; t < tt; ++t) {
                thisData[t] = sqrt(thisData[t]);
            }
            return this;
        };

        /**
         * Normalize the image values from [srcMin, srcMax] to [destMin, destMax]
         * @return {GimelImage} this image
         */
        GimelImage.prototype.normalize = function(srcMin, srcMax, destMin, destMax) {
            var thisData = this.data;
            var alpha = (destMax - destMin)/(srcMax - srcMin);

            for (var t = 0, tt = this.length; t < tt; ++t) {
                thisData[t] = (thisData[t] - srcMin)*alpha + destMin;
            }
            return this;
        };


        /**
         * Min operator between two images (each pixel value)
         * @param {GimelImage} image the given image
         * @return {GimelImage} this image
         */
        GimelImage.prototype.min = function(image) {
            var thisData = this.data;
            var srcData = image.data;

            for (var t = 0, tt = image.length; t < tt; ++t) {
                thisData[t] = srcData[t] < thisData[t] ? srcData[t] : thisData[t];
            }
            return this;
        };

        /**
         * Max operator between two images (each pixel value)
         * @param {GimelImage} image the given image
         * @return {GimelImage} this image
         */
        GimelImage.prototype.max = function(image) {
            var thisData = this.data;
            var srcData = image.data;

            for (var t = 0, tt = image.length; t < tt; ++t) {
                thisData[t] = srcData[t] > thisData[t] ? srcData[t] : thisData[t];
            }
            return this;
        };
    } else if (channels === 4) {
            /**
             * Compute the sum of two images (each pixel value)
             * @param {GimelImage} image the given image
             * @return {GimelImage} this image
             */
            GimelImage.prototype.add = function(image) {
                var thisData = this.data;
                var srcData = image.data;

                for (var t = 0, tt = image.length; t < tt; t += 4) {
                    thisData[t] += srcData[t];
                    thisData[t + 1] += srcData[t + 1];
                    thisData[t + 2] += srcData[t + 2];
                }
                return this;
            };

            /**
             * Compute the difference of two images (each pixel value)
             * @param {GimelImage} image the given image
             * @return {GimelImage} this image
             */
            GimelImage.prototype.subtract = function(image) {
                var thisData = this.data;
                var srcData = image.data;

                for (var t = 0, tt = image.length; t < tt; t += 4) {
                    thisData[t] -= srcData[t];
                    thisData[t + 1] -= srcData[t + 1];
                    thisData[t + 2] -= srcData[t + 2];
                }
                return this;
            };

            /**
             * Compute the multiplication of two images (each pixel value)
             * @param {GimelImage} image the given image
             * @return {GimelImage} this image
             */
            GimelImage.prototype.multiply = function(image) {
                var thisData = this.data;
                var srcData = image.data;

                for (var t = 0, tt = image.length; t < tt; t += 4) {
                    thisData[t] *= srcData[t];
                    thisData[t + 1] *= srcData[t + 1];
                    thisData[t + 2] *= srcData[t + 2];
                }
                return this;
            };

            /**
             * Compute the difference of two images (each pixel value)
             * @param {GimelImage} image the given image
             * @return {GimelImage} this image
             */
            GimelImage.prototype.divide = function(image) {
                var thisData = this.data;
                var srcData = image.data;

                for (var t = 0, tt = image.length; t < tt; t += 4) {
                    thisData[t] /= srcData[t];
                    thisData[t + 1] /= srcData[t + 1];
                    thisData[t + 2] /= srcData[t + 2];
                }
                return this;
            };

            /**
             * Compute the square of each pixel value
             * @return {GimelImage} this image
             */
            GimelImage.prototype.square = function() {
                var thisData = this.data;

                for (var t = 0, tt = this.length; t < tt; t += 4) {
                    thisData[t] *= thisData[t];
                    thisData[t + 1] *= thisData[t + 1];
                    thisData[t + 2] *= thisData[t + 2];
                }
                return this;
            };

            /**
             * Compute the square root of each pixel value
             * @return {GimelImage} this image
             */
            GimelImage.prototype.sqrt = function() {
                var thisData = this.data;
                var sqrt = Math.sqrt;

                for (var t = 0, tt = this.length; t < tt; t += 4) {
                    thisData[t] = sqrt(thisData[t]);
                    thisData[t + 1] = sqrt(thisData[t + 1]);
                    thisData[t + 2] = sqrt(thisData[t + 2]);
                }
                return this;
            };

            /**
             * Normalize the image values from [srcMin, srcMax] to [destMin, destMax]
             * @return {GimelImage} this image
             */
            GimelImage.prototype.normalize = function(srcMin, srcMax, destMin, destMax) {
                var thisData = this.data;
                var alpha = (destMax - destMin)/(srcMax - srcMin);

                for (var t = 0, tt = this.length; t < tt; t += 4) {
                    thisData[t] = (thisData[t] - srcMin)*alpha + destMin;
                    thisData[t + 1] = (thisData[t + 1] - srcMin)*alpha + destMin;
                    thisData[t + 2] = (thisData[t + 2] - srcMin)*alpha + destMin;
                }
                return this;
            };


            /**
             * Min operator between two images (each pixel value)
             * @param {GimelImage} image the given image
             * @return {GimelImage} this image
             */
            GimelImage.prototype.min = function(image) {
                var thisData = this.data;
                var srcData = image.data;

                for (var t = 0, tt = image.length; t < tt; t += 4) {
                    thisData[t] = srcData[t] < thisData[t] ? srcData[t] : thisData[t];
                    thisData[t + 1] = srcData[t + 1] < thisData[t + 1] ? srcData[t + 1] : thisData[t + 1];
                    thisData[t + 2] = srcData[t + 2] < thisData[t + 2] ? srcData[t + 2] : thisData[t + 2];
                }
                return this;
            };

            /**
             * Max operator between two images (each pixel value)
             * @param {GimelImage} image the given image
             * @return {GimelImage} this image
             */
            GimelImage.prototype.max = function(image) {
                var thisData = this.data;
                var srcData = image.data;

                for (var t = 0, tt = image.length; t < tt; t += 4) {
                    thisData[t] = srcData[t] > thisData[t] ? srcData[t] : thisData[t];
                    thisData[t + 1] = srcData[t + 1] > thisData[t + 1] ? srcData[t + 1] : thisData[t + 1];
                    thisData[t + 2] = srcData[t + 2] > thisData[t + 2] ? srcData[t + 2] : thisData[t + 2];
                }
                return this;
            };
        }
        
    });

    return false;
});