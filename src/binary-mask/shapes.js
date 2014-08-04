gimel.module('binaryMask').extend(function(moduleContent) {
		/**
     * Draw a disk on the mask
     * @param {integer} centerX - x-value of the center
     * @param {integer} centerY - y-value of the center
     * @param {integer} radius - disk radius
     * @return {BinaryMask} this mask
     */
		gimel.BinaryMask.prototype.drawDisk = function(centerX, centerY, radius) {
				var data = this.data;

			  var squareRadius = radius*radius;

        for (var y = 0, xx = this.width, yy = this.height; y < yy; y++) {
            var yDist = (centerY - y)*(centerY - y);
        		if (yDist < squareRadius) {
		            var yOffset = y*xx;
		            for (var x = 0;  x < xx; x++) {
		                if (yDist + (centerX - x)*(centerX - x) < squareRadius) {
		                    data[yOffset + x] = 0xff;
		                }
		            }
	          }
        }

        return this;
		};

		/**
     * Draw a circle on the mask
     * @param {integer} centerX - x-value of the center
     * @param {integer} centerY - y-value of the center
     * @param {integer} radius - disk radius
     * @param {integer} [strokeWidth=1] - stroke width; stroke is centered at radius distance of the center
     * @return {BinaryMask} this mask
     */
		gimel.BinaryMask.prototype.drawCircle = function(centerX, centerY, radius, strokeWidth) {
				var data = this.data;

				strokeWidth = strokeWidth || 1;
			  var squareInnerRadius = (radius - strokeWidth/2)*(radius - strokeWidth/2);
			  var squareOuterRadius = (radius + strokeWidth/2)*(radius + strokeWidth/2);

        for (var y = 0, xx = this.width, yy = this.height; y < yy; y++) {
            var yDist = (centerY - y)*(centerY - y);
        		if (yDist < squareOuterRadius) {
		            var yOffset = y*xx;
		            for (var x = 0;  x < xx; x++) {
		            		var squarePointRadius = yDist + (centerX - x)*(centerX - x);
		                if (squarePointRadius < squareOuterRadius && squarePointRadius >= squareInnerRadius) {
		                    data[yOffset + x] = 0xff;
		                }
		            }
	          }
        }

        return this;
		};

		/**
     * Draw a rectangle on the mask
     * @param {integer} x1 - x-value of the top left corner
     * @param {integer} y1 - y-value of the top left corner
     * @param {integer} x2 - x-value of the bottom right corner
     * @param {integer} y2 - y-value of the bottom right corner
     * @return {BinaryMask} this mask
     */
		gimel.BinaryMask.prototype.drawRectangle = function(x1, y1, x2, y2) {
				var data = this.data;

			  for (var y = 0, xx = this.width, yy = this.height; y < yy; y++) {
			  		if (y > y1 && y < y2) {
		            var yOffset = y*xx;
		            for (var x = 0;  x < xx; x++) {
		                if (x > x1 && x < x2) {
		                    data[yOffset + x] = 0xff;
		                }
		            }
	          }
        }

        return this;
		};

		/**
     * Draw a polygon on the mask. Algorithm by Darel Rex Finley.
     * @param {Point[]} vertices - polygon vertices (point: object with x and y properties)
     * @return {BinaryMask} this mask
     */
		gimel.BinaryMask.prototype.drawPolygon = function(vertices) {
				var data = this.data;

			  for (var y = 0, yy = this.height; y < yy; y++) {
		        var yOffset = y*this.width;
			  		var xCrossings = [];

						for (var v1 = vertices.length - 1, v2 = 0, vv = vertices.length; v2 < vv; v1 = v2++) {
								if ((vertices[v1].y < y && vertices[v2].y >= y) || (vertices[v2].y < y && vertices[v1].y >= y)) {
										xCrossings.push(Math.round(vertices[v1].x + (y - vertices[v1].y)/(vertices[v2].y - vertices[v1].y)*(vertices[v2].x - vertices[v1].x)));
								}
						}
						xCrossings.sort();

						for (var c = 0, cc = xCrossings.length - 1; c < cc; c += 2) {
								for (var x = xCrossings[c], xx = xCrossings[c + 1] + 1; x < xx; ++x) {
										data[yOffset + x] = 0xff;
								}
						}
        }

        return this;
		};
});