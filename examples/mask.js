gimel.init();

var canvasElement = document.getElementById('view');
gimel.io.imageFromFile('samples/sample1.png', function(image) {
    var mask1 = new gimel.BinaryMask(image.width, image.height, 0x00).drawDisk(100, 150,  75);
    var mask2 = new gimel.BinaryMask(image.width, image.height, 0x00).drawDisk(300, 200, 150);

    var mask = mask1.difference(mask2).not();//gimel.BinaryMask.union(mask1, mask2);

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