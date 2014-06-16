gimel.init();

var canvasElement = document.getElementById('view');
gimel.io.imageFromFile('samples/sample1.png', function(image) {

    var workingImage = new gimel.Float32T4ChImage(image.width, image.height);
    workingImage.from(image);

    // The convolution kernel : sharpening kernel here (be careful of the type)
    var kernel = new gimel.Float32T1ChImage(3, 3, [-1/2, -1, -1/2,
                                                   -1,    7, -1,
                                                   -1/2, -1, -1/2]);
    var workingImage = workingImage.convolve(kernel, true); // true to normalize

    image.from(workingImage);
    image.fillChannel(3, 255); // because the alpha channel is initialized at 0

    // Paint the result on the canvas
    canvasElement.width = image.width;
    canvasElement.height = image.height;
    image.paintOnCanvas(canvasElement);
});