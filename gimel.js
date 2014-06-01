var gimel = (function(scope) {
	'use strict';

	var Utils = {
			/**
			 * Extends Parent
			 * @param {function} Child the child class
			 * @param {function} Parent the parent class
			 * @return {function} the child class
			 */
			extend: function(Child, Parent) {
				Child.prototype = Object.create(Parent.prototype);
				Child.prototype.constructor = Child;
				return Child;
			}
	};

	var ImageDataTypes = {
			Uint8Clamped: Uint8ClampedArray, // native default data type of canvas
			Uint8: Uint8Array,
			Uint32: Uint32Array,
			Int8: Int8Array,
			Int32: Int32Array,
			Float32: Float32Array,
			Float64: Float64Array
	};

	var Channels = {
			Simple: 1,
			Multiple: 4
	}
	
	var ColorSpaces = {
			RGB: 1,
			HSV: 2,
			HSL: 3,
			CMY: 4,
			XYZ: 5
	};
	
	/**
	 * Construct AbstractImage class with specified dataType and channels number.
	 * @param {function} dataType
	 * @param {integer} height
	 * @return {function}
	 */
	var ImageTemplate = function ImageTemplate(dataType, channels) {
		dataType = dataType === undefined ? ImageDataTypes.Uint8Clamped : dataType;
		channels = channels === undefined ? Channels.Multiple : channels;
		
		console.assert(
				channels === Channels.Simple || channels === Channels.Multiple,
		        'ImageTemplate: channels param must be Channels.Simple or Channels.Multiple.');
		
		/**
		 * Constructs Image with specified width, height, channels and data.
		 * @constructor
		 * @param {integer} width
		 * @param {integer} height
		 * @param {TypedArray} data
		 */
		var AbstractImage = function AbstractImage(width, height, data) {
			this.width = width;
			this.height = height;
			this.data = new dataType(width*height*channels);
			if (data !== undefined) {
				this.data.set(data);
			}
			this.dx = channels;
			this.dy = width*channels;
			this.length = width*height*channels;
		};

		/**
		 * Get image clone
		 * @return {AbstractImage}
		 */
		AbstractImage.prototype.clone = function() {
			return new AbstractImage(this.width, this.height, this.data);
		};

		/**
		 * Creates a new image from an different typed image
		 * @param {intAbstractImageeger} image the given image
		 * @return {AbstractImage} data
		 */
		AbstractImage.convert = function(image) {
			var convertedImage = new AbstractImage(image.width, image.height);
			var dataSrc = image.data;
			var dataDest = convertedImage.data;
			for (var t = 0, tt = image.length; t < tt; ++t) {
				dataDest[t] = dataSrc[t];
			}
			return convertedImage;
		};
		
		AbstractImage.prototype.CHANNELS = channels;
		AbstractImage.prototype.BYTE_DEPTH = dataType.BYTES_PER_ELEMENT*8;
		AbstractImage.prototype.MAX_BYTE_VALUE = 1 << AbstractImage.prototype.BYTE_DEPTH - 1;
		AbstractImage.prototype.MIN_BYTE_VALUE = 0;

		if (channels === Channels.Simple) {
			/**
			 * Get image value at (x, y)
			 * @param {integer} x
			 * @param {integer} y
			 * @return {number} value at (x, y)
			 */
			AbstractImage.prototype.at = function(x, y) {
				return this.data[y*this.width + x];
			};
			
			/**
			 * Normalize image between minValue and maxValue.
			 * @constructor
			 * @param {number} minValue
			 * @param {number} maxValue
			 * @return {AbstractImage} 
			 */
			AbstractImage.prototype.normalize = function(minValue, maxValue) {
				var data = this.data;
				var delta = maxValue - minValue;
				var DELTA = this.MAX_BYTE_VALUE;

				for (var t = 0, tt = this.length; t < tt; ++t) {
					data[t] = (data[t]*delta)/DELTA + minValue;
				}
				return this;
			};
		} else if (channels === Channels.Multiple) {
			/**
			 * Get image value at (x, y, c)
			 * @param {integer} x
			 * @param {integer} y
			 * @param {integer} c
			 * @return {number} value at (x, y, c)
			 */
			AbstractImage.prototype.at = function(x, y, c) {
				return this.data[(y*this.width + x)*channels + c];
			};

			/**
			 * Normalize image between minValue and maxValue.
			 * @param {number} minValue
			 * @param {number} maxValue
			 * @return {AbstractImage} 
			 */
			AbstractImage.prototype.normalize = function(minValue, maxValue) {
				var data = this.data;
				var delta = maxValue - minValue;
				var DELTA = this.MAX_BYTE_VALUE;

				for (var t = 0, tt = this.length, c = channels; t < tt; t += c) {
					data[t] = (data[t]*delta)/DELTA + minValue;
					data[t + 1] = (data[t + 1]*delta)/DELTA + minValue;
					data[t + 2] = (data[t + 2]*delta)/DELTA + minValue;
				}
				return this;
			};
			
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
						var cc = this.CHANNELS;
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

			/**
			 * Normalize image between minValue and maxValue.
			 * @constructor
			 * @param {AbstractImage} convolution mask (image with one channel)
			 * @return {AbstractImage} convolved image
			 */
			AbstractImage.prototype.transformChannels = function(matrix) {
				var maskData = matrix.data;
				var data = this.data;
				for (var t = 0, tt = this.length, c = channels; t < tt; t += c) {
					var r = data[t];
					var g = data[t + 1];
					var b = data[t + 2];
					data[t] = maskData[0]*r + maskData[1]*g + maskData[2]*b; 
					data[t + 1] = maskData[3]*r + maskData[4]*g + maskData[5]*b; 
					data[t + 2] = maskData[6]*r + maskData[7]*g + maskData[8]*b; 
				}
				return this;
			};
			
			AbstractImage.prototype.pastePatch = function(imageView, x, y) {
				var destData = this.data;
				var srcData = imageView.image.data;
				var x00 = x;
				var x01 = imageView.x;
				var y00 = y;
				var y01 = imageView.y;
				var width0 = this.width;
				var width1 = imageView.image.width;
				var channels = this.CHANNELS;
				
				for (var y = 0, yy = imageView.height, xx = imageView.width; y < yy; ++y) {
					for (var x = 0; x < xx; ++x) {
						var t0 = ((y00 + y)*width0 + (x00 + x))*channels;
						var t1 = ((y01 + y)*width1 + (x01 + x))*channels;
						destData[t0] = srcData[t1];
						destData[t0 + 1] = srcData[t1 + 1];
						destData[t0 + 2] = srcData[t1 + 2];
						destData[t0 + 3] = srcData[t1 + 3];
					}
				}
				return this;
			};

			AbstractImage.prototype.pastePatchWithMask = function(imageView, x, y, mask) {
				var destData = this.data;
				var srcData = imageView.image.data;
				var maskData = mask.data;
				var x00 = x;
				var x01 = imageView.x;
				var y00 = y;
				var y01 = imageView.y;
				var width0 = this.width;
				var width1 = imageView.image.width;
				var channels = this.CHANNELS;
				
				for (var y = 0, yy = imageView.height, xx = imageView.width; y < yy; ++y) {
					for (var x = 0; x < xx; ++x) {
						var alpha = maskData[y*xx + x];
						var t0 = ((y00 + y)*width0 + (x00 + x))*channels;
						var t1 = ((y01 + y)*width1 + (x01 + x))*channels;
						destData[t0] = destData[t0]*(1 - alpha) + srcData[t1]*alpha;
						destData[t0 + 1] = destData[t0 + 1]*(1 - alpha) + srcData[t1 + 1]*alpha;
						destData[t0 + 2] = destData[t0 + 2]*(1 - alpha) + srcData[t1 + 2]*alpha;
						destData[t0 + 3] = 255;
					}
				}
				return this;
			};

			AbstractImage.prototype.getImageView = function(x, y, width, height) {
				return new AbstractImage.ImageView(this, x, y, width, height);
			};
			
			
		}

		AbstractImage.ImageView = function(image, x, y, width, height) {
			this.image = image;
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
			this.dx = this.image.dx;
			this.dy = this.image.dy;
			this.start = (image.width*y + x)*this.CHANNELS;
			this.end = ((image.width*(y + height - 1) + (x + width -1)) + 1)*this.CHANNELS;;
		};
		
		AbstractImage.ImageView.prototype.CHANNELS = AbstractImage.prototype.CHANNELS; 
		
		if (channels === Channels.Simple) {
		} else if (channels === Channels.Multiple) {
			AbstractImage.ImageView.prototype.squareNorm = function(imageView) {
				console.assert(imageView.width === this.width, 'AbstractImage.ImageView::squareNorm: ImageView must have the same dimentions');
				console.assert(imageView.height === this.height, 'AbstractImage.ImageView::squareNorm: ImageView must have the same dimentions');
				var norm = 0;
				var data0 = this.image.data;
				var data1 = imageView.image.data;
				var x00 = this.x;
				var x01 = imageView.x;
				var y00 = this.y;
				var y01 = imageView.y;
				var width0 = this.image.width;
				var width1 = imageView.image.width;
				var channels = this.CHANNELS;

				for (var y = 0, yy = this.height; y < yy; ++y) {
					for (var x = 0, xx = this.width; x < xx; ++x) {
						var t0 = ((y00 + y)*width0 + (x00 + x))*channels;
						var t1 = ((y01 + y)*width1 + (x01 + x))*channels;
						var tmp = data0[t0] - data1[t1];
						norm += tmp*tmp;
						tmp = data0[t0 + 1] - data1[t1 + 1];
						norm += tmp*tmp;
						tmp = data0[t0 + 2] - data1[t1 + 2];
						norm += tmp*tmp;
					}
					
				}
				return norm;
			};
			
			AbstractImage.ImageView.prototype.squareNormWithMask = function(imageView, mask) {
				console.assert(imageView.width === this.width, 'AbstractImage.ImageView::squareNorm: ImageView must have the same dimentions');
				console.assert(imageView.height === this.height, 'AbstractImage.ImageView::squareNorm: ImageView must have the same dimentions');
				var norm = 0;
				var data0 = this.image.data;
				var data1 = imageView.image.data;
				var maskData = mask.data;
				var x00 = this.x;
				var x01 = imageView.x;
				var y00 = this.y;
				var y01 = imageView.y;
				var width0 = this.image.width;
				var width1 = imageView.image.width;
				var channels = this.CHANNELS;
				
				for (var y = 0, yy = this.height, xx = this.width; y < yy; ++y) {
					for (var x = 0; x < xx; ++x) {
						var alpha = maskData[y*xx + x];
						var t0 = ((y00 + y)*width0 + (x00 + x))*channels;
						var t1 = ((y01 + y)*width1 + (x01 + x))*channels;
						var tmp = data0[t0] - data1[t1];
						norm += tmp*tmp*alpha;
						tmp = data0[t0 + 1] - data1[t1 + 1];
						norm += tmp*tmp*alpha;
						tmp = data0[t0 + 2] - data1[t1 + 2];
						norm += tmp*tmp*alpha;
					}
					
				}
				return norm;
			};

		}

		return AbstractImage;
	};
	
	var Abstract1ChUint8ClampedImage = ImageTemplate(ImageDataTypes.Uint8Clamped, Channels.Simple);
	var Abstract1ChUint8Image = ImageTemplate(ImageDataTypes.Uint8, Channels.Simple);
	var Abstract1ChUint32Image = ImageTemplate(ImageDataTypes.Uint32, Channels.Simple);
	var Abstract1ChInt8Image = ImageTemplate(ImageDataTypes.Int8, Channels.Simple);
	var Abstract1ChInt32Image = ImageTemplate(ImageDataTypes.Int32, Channels.Simple);
	var Abstract1ChFloat32Image = ImageTemplate(ImageDataTypes.Float32, Channels.Simple);
	var Abstract1ChFloat64Image = ImageTemplate(ImageDataTypes.Float64, Channels.Simple);
	var Abstract4ChUint8ClampedImage = ImageTemplate(ImageDataTypes.Uint8Clamped, Channels.Multiple);
	var Abstract4ChUint8Image = ImageTemplate(ImageDataTypes.Uint8, Channels.Multiple);
	var Abstract4ChUint32Image = ImageTemplate(ImageDataTypes.Uint32, Channels.Multiple);
	var Abstract4ChInt8Image = ImageTemplate(ImageDataTypes.Int8, Channels.Multiple);
	var Abstract4ChInt32Image = ImageTemplate(ImageDataTypes.Int32, Channels.Multiple);
	var Abstract4ChFloat32Image = ImageTemplate(ImageDataTypes.Float32, Channels.Multiple);
	var Abstract4ChFloat64Image = ImageTemplate(ImageDataTypes.Float64, Channels.Multiple);
	
	var HTMLImage = Utils.extend(
			function HTMLImage(imageElement) {
				this.canvas = document.createElement('canvas');
				this.canvas.width = imageElement.width;
				this.canvas.height = imageElement.height;
				var context = this.canvas.getContext('2d');
				context.drawImage(imageElement, 0, 0);
				this.HTMLImageData = context.getImageData(0, 0, imageElement.width, imageElement.height);
				Abstract4ChUint8ClampedImage.call(
						this,
						imageElement.width, imageElement.height, this.HTMLImageData.data
				);
			}, Abstract4ChUint8ClampedImage
	);
	
	HTMLImage.prototype.putImage = function(canvas) {
		var context = canvas.getContext('2d');
		this.HTMLImageData.data.set(this.data);
		context.putImageData(this.HTMLImageData, 0, 0);
	};
	
	HTMLImage.prototype.set = function(image) {
		console.assert(image.width === this.width, 'HTMLImage::set: images must have the same dimentions');
		console.assert(image.height === this.height, 'HTMLImage::set: images must have the same dimentions');
		console.assert(image.CHANNELS === this.CHANNELS, 'HTMLImage::set: images must have the same depth');
		
		this.data.set(image.data);
		return this;
	};
	
	var IntMask = Utils.extend(
			function IntMask(size, data) {
				Abstract1ChInt32Image.call(
						this,
						size, size, data
				);
				this.origin = size >> 1;
			}, Abstract1ChInt32Image
	);
	
	var FloatMask = Utils.extend(
			function FloatMask(size, data) {
				Abstract1ChFloat32Image.call(
						this,
						size, size, data
				);
			}, Abstract1ChFloat32Image
	);
	
	
	return {
		Utils: Utils,
		ImageDataTypes: ImageDataTypes,
		ImageTemplate: ImageTemplate,
		HTMLImage: HTMLImage,
		Abstract1ChUint8ClampedImage: Abstract1ChUint8ClampedImage,
		Abstract1ChUint8Image: Abstract1ChUint8Image,
		Abstract1ChUint32Image: Abstract1ChUint32Image,
		Abstract1ChInt8Image: Abstract1ChInt8Image,
		Abstract1ChInt32Image: Abstract1ChInt32Image,
		Abstract1ChFloat32Image: Abstract1ChFloat32Image,
		Abstract1ChFloat64Image: Abstract1ChFloat64Image,
		Abstract4ChUint8ClampedImage: Abstract4ChUint8ClampedImage,
		Abstract4ChUint8Image: Abstract4ChUint8Image,
		Abstract4ChUint32Image: Abstract4ChUint32Image,
		Abstract4ChInt8Image: Abstract4ChInt8Image,
		Abstract4ChInt32Image: Abstract4ChInt32Image,
		Abstract4ChFloat32Image: Abstract4ChFloat32Image,
		Abstract4ChFloat64Image: Abstract4ChFloat64Image,
		IntMask: IntMask,
		FloatMask: FloatMask
	};
})(this);