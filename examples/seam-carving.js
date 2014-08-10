gimel.init();

var canvasElement = document.getElementById('view');
gimel.io.imageFromFile('samples/sample1.png', function(image) {
    var luminance = new gimel.Uint8T1ChImage(image.width, image.height);
    var imageData = image.data, luminanceData = luminance.data;

    for (var i = 0, ii = image.length; i < ii; i += 4) {
        luminanceData[i >> 2] = (imageData[i] + 2*imageData[i + 1] + imageData[i + 2]) >> 2;
    }
    
    var remove1seam = function(j) {
        luminance = luminance.removeVerticalSeam(luminance.findVerticalSeam(luminance.buildGradientEnergyMap()));
        image.width = luminance.width, image.height = luminance.height, image.length = luminance.length << 2, image.data.length = luminance.length << 2;
        luminanceData = luminance.data;
        for (var i = 0, ii = image.length; i < ii; i += 4) {
            imageData[i] = imageData[i + 1] = imageData[i + 2] = luminanceData[i >> 2];
            imageData[i + 3] = 0xff;
        }
        image.data = imageData.subarray(0, i);
        canvasElement.width = image.width;
        canvasElement.height = image.height;
        image.canvasData = canvasElement.getContext('2d').createImageData(luminance.width, luminance.height);
        image.paintOnCanvas(canvasElement);
    }

    var removed = 200;
    for (var j = 0, jj = removed; j < jj; ++j) {
        setTimeout(function() { remove1seam(j); }, 0); 
    }/*
    var energy = luminance.buildGradientEnergyMap();
    var seam = luminance.findVerticalSeam(energy);
    energy = energy.normalize(0, energy.max, 0x00, 0xff);

    luminanceData = luminance.data;

    for (y = 0, yOffset = 0, yy = luminance.height, xx = luminance.width; y < yy; ++y, yOffset += xx) {
        luminanceData[yOffset + seam[y]] = 0xff;
    }

    for (var y = 0, xx = image.width, yOldOffset = 0, yNewOffset = 0, yy = image.height; y < yy; ++y, yOldOffset += xx, yNewOffset += xx - removed) {
        for (var x = 0; x < xx - removed; ++x) {
            var imageIndex = ((yOldOffset + x) << 2);
            var luminanceValue = luminanceData[yNewOffset + x];
            imageData[imageIndex + 0] = luminanceValue;
            imageData[imageIndex + 1] = luminanceValue;
            imageData[imageIndex + 2] = luminanceValue;
        }
        for (; x < xx; ++x) {
            var imageIndex = ((yOldOffset + x) << 2);
            imageData[imageIndex + 0] = 0xff;
            imageData[imageIndex + 1] = 0x00;
            imageData[imageIndex + 2] = 0x00;
        }
    }
    
    // Paint the result on the canvas
    canvasElement.width = image.width;
    canvasElement.height = image.height;
    image.paintOnCanvas(canvasElement);
    */
});