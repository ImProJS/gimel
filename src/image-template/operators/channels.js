gimel.module('imageTemplate').extend(function(moduleContent) {
    gimel.imageTemplate.extend(function(GimelImage) {
        /**
         * Apply the matrix to each pixel vector (r, g, b)
         * @param {GimelImage} matrix the transformation matrix
         * @return {GimelImage} this image
         */
        GimelImage.prototype.transformChannels = function(matrix) {
            var matrixData = matrix.data;
            var data = this.data;
            for (var t = 0, tt = this.length; t < tt; t += 4) {
                var r = data[t];
                var g = data[t + 1];
                var b = data[t + 2];
                data[t] = matrixData[0]*r + matrixData[1]*g + matrixData[2]*b; 
                data[t + 1] = matrixData[3]*r + matrixData[4]*g + matrixData[5]*b; 
                data[t + 2] = matrixData[6]*r + matrixData[7]*g + matrixData[8]*b; 
            }
            return this;
        };

        /**
         * Create an single-channel image form an image channel
         * @param {GimelImage} matrix the transformation matrix
         * @return {GimelImage} this image
         */
        GimelImage.prototype.getChannel = function(channelIndex) {
            var image = new GimelImage.T1ChImage(this.width, this.height);
            var thisData = this.data;
            var imageData = image.data;
            for (var t = 0, u = 0, tt = this.length; t < tt; t += 4, ++u) {
                imageData[u] = thisData[t + channelIndex];
            }
            return this;
        };
    });
});