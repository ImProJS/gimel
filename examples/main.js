
gimel.ImageTemplate.extend(function(AbstractImage, dataType, channels) {
	AbstractImage.prototype.example = function() {
		var destData = this.data;
		var channels = this.CHANNELS;
		
		for (var y = 0, yy = imageView.height, xx = imageView.width; y < yy; ++y) {
			for (var x = 0; x < xx; ++x) {
				var t = (y*xx + x)*channels;
				
				destData[t] = 0;
				destData[t + 1] = 0;
				destData[t + 2] = 0;
				destData[t + 3] = 0;
			}
		}
		return this;
	}
	
});

gimel.init();


gimel.HTMLImage.openImage('img/sample.png', function(image) {
	var img32 = gimel.Abstract4ChInt32Image.convert(image);
	var mask = new gimel.IntMask(3, [-1, -2, -1,
	                                 -2,  13, -2,
	                                 -1, -2, -1 ]);
	var colorMask = new gimel.FloatMask(3, [1/3, 1/3, 1/3,
	                                        1/3, 1/3, 1/3,
	                                        1/3, 1/3, 1/3]);

	var convolvedImg = img32.convolve(mask, true).transformChannels(colorMask);

	var convolved8Img = gimel.Abstract4ChUint8ClampedImage.convert(convolvedImg);
	image.set(convolved8Img);

	var canvas = document.getElementById('canvasView');
	image.putImage(canvas, 0, 0);
	console.log(image.toString());
});