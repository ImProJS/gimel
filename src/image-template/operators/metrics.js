gimel.module('imageTemplate').extend(function(moduleContent) {
    gimel.imageTemplate.extend(function(GimelImage, dataType, channels) {
        if (channels === 1) {
            if (dataType === 'Float32T' || dataType === 'Float64T') {
                /**
                 * Returns the sum of all pixel values
                 * (Kahan algorithm since we work on floating point data)
                 * @return {number[]} the average value
                 */
                GimelImage.prototype.sum = function() {
                    var data = this.data;
                    var sum = 0;
                    var delta = 0;
                    var tmp = 0;
                    var compensedValue = 0;
                    for (var i = 0, ii = this.length; i < ii; ++i) {
                        compensedValue = data[i] - delta;
                        tmp = sum + compensedValue;
                        delta = tmp - sum;
                        delta -= compensedValue;
                        sum = tmp[i];
                    }
                    return sum;
                };
            } else {
                /**
                 * Returns the sum of all pixel values
                 * @return {number[]} the average value
                 */
                GimelImage.prototype.sum = function() {
                    var data = this.data;
                    var sum = 0;
                    for (var i = 0, ii = this.length; i < ii; ++i) {
                        sum += data[i];
                    }
                    return sum;
                };
            }

            /**
             * Returns the Average pixel value
             * @return {number[]} the average value
             */
            GimelImage.prototype.mean = function() {
                return this.sum()/this.length;
            };

            /**
             * Returns the Median pixel value
             * @return {number[]} the average value
             */
            GimelImage.prototype.median = function() {
                // TODO
            };

            /**
             * Returns the Variance
             * @return {number[]} the average value
             */
            GimelImage.prototype.variance = function() {
                var data = this.data;
                var variance = 0;
                var delta = 0;
                var tmp = 0;
                var compensedValue = 0;
                var mean = this.mean();
                for (var i = 0, ii = this.length; i < ii; ++i) {
                    tmp = data[i] - mean;
                    tmp *= tmp;
                    compensedValue = tmp - delta;
                    tmp = variance + compensedValue;
                    delta = tmp - variance;
                    delta -= compensedValue;
                    variance = tmp;
                }
                return variance/this.length;
            };

            /**
             * Returns the Mean Squared Error
             * @return {number[]} the average value
             */
            GimelImage.prototype.meanSquaredError = function() {
                // TODO
            };

        } else if (channels === 4) {
            if (dataType === 'Float32T' || dataType === 'Float64T') {
                /**
                 * Returns the sum of all pixel values
                 * (Kahan algorithm since we work on floating point data)
                 * @return {number[]} the average value
                 */
                GimelImage.prototype.sum = function() {
                    var data = this.data;
                    var sum = new Float64Array(4);
                    var delta = new Float64Array(4);
                    var tmp = new Float64Array(4);
                    var compensedValue = new Float64Array(4);
                    for (var i = 0, ii = this.length; i < ii; i += 4) {
                        compensedValue[0] = data[i] - delta[0];
                        tmp[0] = sum[0] + compensedValue[0];
                        delta[0] = tmp[0] - sum[0];
                        delta[0] -= compensedValue[0];
                        sum[0] = tmp[0];

                        compensedValue[1] = data[i + 1] - delta[1];
                        tmp[1] = sum[1] + compensedValue[1];
                        delta[1] = tmp[1] - sum[1];
                        delta[1] -= compensedValue[1];
                        sum[1] = tmp[1];

                        compensedValue[2] = data[i + 2] - delta[2];
                        tmp[2] = sum[2] + compensedValue[2];
                        delta[2] = tmp[2] - sum[2];
                        delta[2] -= compensedValue[2];
                        sum[2] = tmp[2];
                    }
                    return sum;
                };
            } else {
                /**
                 * Returns the sum of all pixel values
                 * @return {number[]} the average value
                 */
                GimelImage.prototype.sum = function() {
                    var data = this.data;
                    var sum;

                    sum = [0, 0, 0];
                    for (var i = 0, ii = this.length; i < ii; i += 4) {
                        sum[0] += data[i];
                        sum[1] += data[i + 1];
                        sum[2] += data[i + 2];
                    }
                    return sum;
                };
            }


            /**
             * Returns the Average pixel value
             * @return {number[]} the average value
             */
            GimelImage.prototype.mean = function() {
                var sum = this.sum();
                return [sum[0]/this.length, sum[1]/this.length, sum[2]/this.length];
            };

            /**
             * Returns the Median pixel value
             * @return {number[]} the average value
             */
            GimelImage.prototype.median = function() {
                // TODO
            };

            /**
             * Returns the Variance (Kahan compensed sum algorithm) 
             * @return {number[]} the average value
             */
            GimelImage.prototype.variance = function() {
                var data = this.data;
                var variance = new Float64Array(4);
                var delta = new Float64Array(4);
                var tmp = new Float64Array(4);
                var compensedValue = new Float64Array(4);
                var mean = this.mean();
                for (var i = 0, ii = this.length; i < ii; i += 4) {
                    tmp[0] = data[i] - mean[0];
                    tmp[0] *= tmp[0];
                    compensedValue[0] = tmp[0] - delta[0];
                    tmp[0] = variance[0] + compensedValue[0];
                    delta[0] = tmp[0] - variance[0];
                    delta[0] -= compensedValue[0];
                    variance[0] = tmp[0];

                    tmp[1] = data[i + 1] - mean[1];
                    tmp[1] *= tmp[1];
                    compensedValue[1] = tmp[1] - delta[1];
                    tmp[1] = variance[1] + compensedValue[1];
                    delta[1] = tmp[1] - variance[1];
                    delta[1] -= compensedValue[1];
                    variance[1] = tmp[1];

                    tmp[2] = data[i + 2] - mean[2];
                    tmp[2] *= tmp[2];
                    compensedValue[2] = tmp[2] - delta[2];
                    tmp[2] = variance[2] + compensedValue[2];
                    delta[2] = tmp[2] - variance[2];
                    delta[2] -= compensedValue[2];
                    variance[2] = tmp[2];
                }
                return [variance[0]/this.length, variance[1]/this.length, variance[2]/this.length];
            };

            /**
             * Returns the Mean Squared Error
             * @return {number[]} the average value
             */
            GimelImage.prototype.meanSquaredError = function() {
                // TODO
            };
        }
    });
});