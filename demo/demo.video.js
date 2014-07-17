gimel.init();

var canvas = document.getElementById('view');

var workingImage = new gimel.Int32T4ChImage(800, 600);

gimel.io.imageStreamFromCamera(800, 600, function(imageStream) {
    imageStream.updateFromCanvas();
    workingImage.set(imageStream);
    workingImage.sobel();
    imageStream.set(workingImage);
    imageStream.fillChannel(3, 255);
    imageStream.updateCanvasData();
}, canvas);