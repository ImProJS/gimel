gimel.init();

var canvasElement = document.getElementById('view');
gimel.io.imageFromFile('samples/sample1.png', function(image) {
    var mask = new gimel.BinaryMask(image.width, image.height, 0x00);

    function drawCircle(mask, centerX, centerY, radius) {
        for (var y = 0, yy = image.height; y < yy; y++) {
            var yOffset = y*image.width;
            for (var x = 0, xx = image.width;  x < xx; x++) {
                if ((centerY - y)*(centerY - y)+(centerX - x)*(centerX - x) < radius*radius) {
                    mask.data[yOffset + x] = 0xff;
                }
            }
        }
    }

    drawCircle(mask, 100, 150, 75);
    drawCircle(mask, 300, 200, 150);

    for (var i = 0, ii = image.data.length >> 2; i < ii; ++i) {
        image.data[(i << 2) + 0] = mask.data[i];
        image.data[(i << 2) + 1] = mask.data[i];
        image.data[(i << 2) + 2] = mask.data[i];
        image.data[(i << 2) + 3] = 0xff;
    }

    // Paint the result on the canvas
    canvasElement.width = image.width;
    canvasElement.height = image.height;
    image.paintOnCanvas(canvasElement);
});