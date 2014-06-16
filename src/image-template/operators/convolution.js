gimel.module('imageTemplate').extend(function(moduleContent) {
    gimel.imageTemplate.extend(function(GimelImage, dataType, channels) {
        /**
         * Convolve the image with the given kernel
         * @param {IntMask} kernel mask (image with one channel)
         * @param {boolean} normalize 
         * @return {GimelImage} convolved image
         * @todo handle the sides
         */
        GimelImage.prototype.convolve = function(kernel, normalize) {
            console.assert(kernel.CHANNELS === 1, 'AbstractImage::convolve: Mask must have just one channel');
            console.assert(kernel.width === kernel.height, 'AbstractImage::convolve: Mask must be square');

            var convolvedImage = this.cloneStructure();
            var destData = convolvedImage.data;
            var srcData = this.data;
            var t = 0, tt = 0, tSrc = 0;

            var uu = kernel.width;
            var vv = kernel.height;
            var uu2 = kernel.width >> 1;
            var vv2 = kernel.height >> 1;

            var dx = this.dx;
            var dy = this.dy;
            var xx = this.width;
            var yy = this.height;
            var xx2 = xx - uu2;
            var yy2 = yy - vv2;

            var srcX, srcY;
            var u, v, x, y;
            var muv, offset;

            for (v = 0; v < vv; ++v) {
                for (u = 0; u < uu; ++u) {
                    muv = kernel.data[v*kernel.width + u];
                    // Top strip
                    for (y = 0; y < vv2; ++y) {
                        for (x = 0; x < xx2; ++x) {
                            srcX = x + u - uu2;
                            srcY = y + v - vv2;
                            tSrc = x*dx + y*dy;
                            t = (srcX < 0 ? 1 - srcX : srcX)*dx + (srcY < 0 ? 1 - srcY : srcY)*dy;
                            destData[tSrc] += srcData[t]*muv;
                            destData[tSrc + 1] += srcData[t + 1]*muv;
                            destData[tSrc + 2] += srcData[t + 2]*muv;
                        }
                    }

                    // Bottom strip
                    for (y = yy2; y < yy; ++y) {
                        for (x = 0; x < xx2; ++x) {
                            srcX = x + u - uu2;
                            srcY = y + v - vv2;
                            tSrc = x*dx + y*dy;
                            t = (srcX < 0 ? 1 - srcX : srcX)*dx + (srcY < yy ? srcY : 2*yy - srcY - 1)*dy;
                            destData[tSrc] += srcData[t]*muv;
                            destData[tSrc + 1] += srcData[t + 1]*muv;
                            destData[tSrc + 2] += srcData[t + 2]*muv;
                        }
                    }

                    // Left strip
                    for (y = vv2; y < yy2; ++y) {
                        for (x = 0; x < uu2; ++x) {
                            srcX = x + u - uu2;
                            srcY = y + v - vv2;
                            tSrc = x*dx + y*dy;
                            t = (srcX < 0 ? 1 - srcX : srcX)*dx + (srcY < 0 ? 1 - srcY : srcY)*dy;
                            destData[tSrc] += srcData[t]*muv;
                            destData[tSrc + 1] += srcData[t + 1]*muv;
                            destData[tSrc + 2] += srcData[t + 2]*muv;
                        }
                    }

                    // Right strip
                    for (y = 0; y < yy2; ++y) {
                        for (x = xx2; x < xx; ++x) {
                            srcX = x + u - uu2;
                            srcY = y + v - vv2;
                            tSrc = x*dx + y*dy;
                            t = (srcX < xx ? srcX : 2*xx - srcX - 1)*dx + (srcY < 0 ? 1 - srcY : srcY)*dy;
                            destData[tSrc] += srcData[t]*muv;
                            destData[tSrc + 1] += srcData[t + 1]*muv;
                            destData[tSrc + 2] += srcData[t + 2]*muv;
                        }
                    }

                    // Bottom right corner
                    for (y = yy2; y < yy; ++y) {
                        for (x = xx2; x < xx; ++x) {
                            srcX = x + u - uu2;
                            srcY = y + v - vv2;
                            tSrc = x*dx + y*dy;
                            t = (srcX < xx ? srcX : 2*xx - srcX - 1)*dx + (srcY < yy ? srcY : 2*yy - srcY - 1)*dy;
                            destData[tSrc] += srcData[t]*muv;
                            destData[tSrc + 1] += srcData[t + 1]*muv;
                            destData[tSrc + 2] += srcData[t + 2]*muv;
                        }
                    }
                }
            }

            // Center
            for (v = 0; v < vv; ++v) {
                for (u = 0; u < uu; ++u) {
                    muv = kernel.data[v*kernel.width + u];
                    offset = (u - uu2)*dx + (v - vv2)*dy;
                    for (y = vv2; y < yy2; ++y) {
                        var t0 = y*xx;
                        for (x = uu2; x < xx2; ++x) {
                            t = (t0 + x)*4;
                            destData[t] += srcData[t + offset]*muv;
                            destData[t + 1] += srcData[t + offset + 1]*muv;
                            destData[t + 2] += srcData[t + offset + 2]*muv;
                        }
                    }
                }
            }

            if (normalize) {
                var maskSum = 0;
                for (t = 0, tt = kernel.length; t < tt; ++t) {
                    maskSum += kernel.data[t];
                }

                if (maskSum !== 0) {
                    for (t = 0, tt = this.length; t < tt; t += 4) {
                        destData[t] /= maskSum;
                        destData[t + 1] /= maskSum;
                        destData[t + 2] /= maskSum;
                    }
                }
            }

            return convolvedImage;
        };

        /**
         * Compute image gradient using convolution
         * @return {GimelImage} Gradient image (new)
         * @todo kernel type according to image type (int or float)
         */
        GimelImage.prototype.gradient = function() {
            var kernel = new gimel.Int8T1ChImage(3, 3, [ 0, -1,  0,
                                                        -1,  0, +1,
                                                         0, +1,  0]);
            return this.convolve(kernel, false);
        };

        /**
         * Convolve image with gaussian kernel (blur)
         * Gaussian function: e^(-pi((x/radius)^2+(y/radius)^2)) 
         $ =approx (1 - (3(x/radius)^2 - 2(x/radius)^3)) * (1 - (3(y/radius)^2 - 2(y/radius)^3))
         * @return {GimelImage} convolved image (new)
         * @todo kernel type according to image type (int or float)
         */
        GimelImage.prototype.gaussian = function(size) {
            console.assert(size & 1,  'AbstractImage::gaussian: Size has to be odd');
            console.assert(size >= 3, 'AbstractImage::gaussian: Size has to be at least 3');
            var kernel;
            switch (size) {
            case 3: kernel = new gimel.Float32T1ChImage(3, 3, [0.25, 0.50, 0.25,
                                                               0.50, 1.00, 0.50,
                                                               0.25, 0.50, 0.25]);
              break;
            case 5: kernel = new gimel.Float32T1ChImage(5, 5, [0.07, 0.19, 0.26, 0.19, 0.07,
                                                               0.19, 0.55, 0.74, 0.55, 0.19,
                                                               0.26, 0.74, 1.00, 0.74, 0.26,
                                                               0.19, 0.55, 0.74, 0.55, 0.19,
                                                               0.07, 0.19, 0.26, 0.19, 0.07]);
              break;
            case 7: kernel = new gimel.Float32T1ChImage(7, 7, [0.02, 0.08, 0.13, 0.16, 0.13, 0.08, 0.02,
                                                               0.08, 0.25, 0.42, 0.50, 0.42, 0.25, 0.08,
                                                               0.13, 0.42, 0.71, 0.84, 0.71, 0.42, 0.13,
                                                               0.16, 0.50, 0.84, 1.00, 0.84, 0.50, 0.16,
                                                               0.13, 0.42, 0.71, 0.84, 0.71, 0.42, 0.13,
                                                               0.08, 0.25, 0.42, 0.50, 0.42, 0.25, 0.08,
                                                               0.02, 0.08, 0.13, 0.16, 0.13, 0.08, 0.02]);
              break;
            default: 
              var size2inf = (size - 1) >> 1;
              var size2sup = (size + 1) >> 1;
              var data = [];
              for (var i = 1, ii = size2sup; i < ii; i++) {
                var iValue = (1.00 - (i*i*(3.00*size2sup - 2.00*i))/(size2sup*size2sup*size2sup));//Math.exp(-Math.PI*i*i/((size2+1)*size2+1))
                for (var j = 0, jj = size2sup; j < jj; j++) {
                  var value = iValue*(1.00 - (j*j*(3.00*size2sup - 2.00*j))/(size2sup*size2sup*size2sup));
                  data[size*(size2inf + j) + size2inf + i] = value;
                  data[size*(size2inf - j) + size2inf - i] = value;
                  data[size*(size2inf + i) + size2inf - j] = value;
                  data[size*(size2inf - i) + size2inf + j] = value;
                }
              }
              data[(size+1)*size2inf] = 1.00;
              kernel = new gimel.Float32T1ChImage(size, size, data);
            }
            return this.convolve(kernel, true);
        };
    });

    return false;
});
