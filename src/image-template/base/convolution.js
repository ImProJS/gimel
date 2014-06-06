gimel.ImageTemplate.module('convolution').addExtension(function(AbstractImage, datatype, channels) {
    /**
     * Convolve the image with the given kernel
     * @param {IntMask} kernel mask (image with one channel)
     * @param {boolean} normalize 
     * @return {AbstractImage} convolved image
     * @todo handle the sides
     */
    AbstractImage.prototype.convolve = function(kernel, normalize) {
        console.assert(kernel.CHANNELS === 1, 'AbstractImage::convolute: Mask must have just one channel');
        console.assert(kernel.width === kernel.height, 'AbstractImage::convolute: Mask must be square');
        
        var convolvedImage = this.clone();
        var destData = convolvedImage.data;
        var srcData = this.data;
        
        for (var v = 0, vv = kernel.height; v < vv; ++v) {
            for (var u = 0, uu = kernel.width; u < uu; ++u) {
                var muv = kernel.data[v*kernel.width + u];
                var uu2 = kernel.origin;
                var vv2 = kernel.origin;
                var cc = this.channels;
                var offset = (u - uu2)*this.dx + (v - vv2)*this.dy;
                for (var y = vv2,
                        yy2 = this.height - vv2,
                        xx2 = this.width - uu2,
                        yy = this.height,
                        xx = this.width; y < yy2; ++y) {
                    var t0 = y*xx;
                    for (var x = uu2; x < xx2; ++x) {
                        var t = (t0 + x)*cc;
                        destData[t] += srcData[t + offset]*muv;
                        destData[t + 1] += srcData[t + offset + 1]*muv;
                        destData[t + 2] += srcData[t + offset + 2]*muv;
                    }
                }
            }
        }
        
        if (normalize) {
            var maskSum = 0;
            for (var t = 0, tt = kernel.length; t < tt; ++t) {
                maskSum += kernel.data[t];
            }
            
            if (maskSum !== 0) {
                for (var t = 0, tt = this.length, c = channels; t < tt; t += c) {
                    destData[t] /= maskSum;
                    destData[t + 1] /= maskSum;
                    destData[t + 2] /= maskSum;
                }
            }
        }

        return convolvedImage;
    };
});