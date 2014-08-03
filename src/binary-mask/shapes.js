gimel.module('binaryMask').extend(function(moduleContent) {
		/**
     * Draw a disk on the mask
     * @param {integer} centerX - x-value of the center
     * @param {integer} centerY - y-value of the center
     * @param {integer} radius - disk radius
     * @return {BinaryMask} this mask
     */
		gimel.BinaryMask.prototype.drawDisk = function(centerX, centerY, radius) {
			  var squareRadius = radius*radius;

        for (var y = 0, xx = this.width, yy = this.height; y < yy; y++) {
            var yOffset = y*xx;
            var yDist = (centerY - y)*(centerY - y);
            for (var x = 0;  x < xx; x++) {
                if (yDist + (centerX - x)*(centerX - x) < squareRadius) {
                    this.data[yOffset + x] = 0xff;
                }
            }
        }

        return this;
		};
});