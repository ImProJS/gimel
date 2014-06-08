// How to define a module

gimel.defineModule('example', // name
                   ['imageTemplate'], // dependencies
                   function(moduleContent, extensions) { // definition
    
    // My module will provide some filters. A night filter for instance.
    moduleContent.nightFilter = function(image) {
        var workingImage = new gimel.Uint32T4ChImage(image.width, image.height);
        
        workingImage.from(image);
        workingImage.square();
        workingImage.normalize(0, 65025, 0, 255);

        image.from(workingImage);
        return image;
    };
    
    // I want this filter to be available on any images
    gimel.imageTemplate.extend(function(GimelImage) { // extend the template
        GimelImage.prototype.night = function() {
            return gimel.example.nightFilter(this);
        };
        
        
    });
});

gimel.init();

var canvasElement = document.getElementById('view');
gimel.io.imageFromFile('samples/sample1.png', function(image) {
    canvasElement.width = image.width;
    canvasElement.height = image.height;

    image.night();
    
    image.paintOnCanvas(canvasElement);
});


/*
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
});*/