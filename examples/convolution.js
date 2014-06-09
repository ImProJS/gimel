gimel.init();

var canvasElement = document.getElementById('view');
gimel.io.imageFromFile('samples/sample3.png', function(image) {

    var workingImage = new gimel.Uint32T4ChImage(image.width, image.height);
    workingImage.from(image);

    // The convolution kernel (single channel image)
    var kernel = new gimel.Int32T1ChImage(5, 5, [1,  4,  7,  4, 1,
                                                  4, 16, 26, 16, 4,
                                                  7, 26, 41, 26, 7,
                                                  4, 16, 26, 16, 4,
                                                  1,  4,  7,  4, 1]);
    var workingImage = workingImage.convolve(kernel, true); // true to normalize
    
    image.from(workingImage);
    image.fillChannel(3, 255); // because the alpha channel is initialized at 0

    // Paint the result on the canvas
    canvasElement.width = image.width;
    canvasElement.height = image.height;
    image.paintOnCanvas(canvasElement);
});