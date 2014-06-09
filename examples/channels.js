gimel.init();

var canvasElement = document.getElementById('view');
gimel.io.imageFromFile('samples/sample3.png', function(image) {

    // The channel transformation matrix
    var chTransformMatrix = new gimel.Float32T1ChImage(3, 3, [0,   0, 0,
                                                              0,   1, 0,
                                                              0.7, 0, 0.2]);
  
    image.transformChannels(chTransformMatrix);
    
    // Paint the result on the canvas
    canvasElement.width = image.width;
    canvasElement.height = image.height;
    image.paintOnCanvas(canvasElement);
});