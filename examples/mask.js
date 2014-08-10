gimel.init();

var canvasElement = document.getElementById('view');
gimel.io.imageFromFile('samples/sample1.png', function(image) {
    var mask1 = new gimel.BinaryMask(image.width, image.height, 0x00).drawDisk(100, 150,  75);
    var mask2 = new gimel.BinaryMask(image.width, image.height, 0x00).drawDisk(300, 200, 150);

    var mask = mask1.drawRectangle(350, 180, 480, 280).difference(mask2);
    mask.drawPolygon([{x: 300, y: 220}, {x: 380, y: 250}, {x: 320, y: 160}, {x: 200, y: 240}]);
    mask.drawCircle(300, 200, 130, 1);
    mask.drawCircle(300, 200, 135, 2);
    mask.drawCircle(300, 200, 140, 3);

    //image.data = mask.not().toUint8T4ChImage().data;
    mask.superimposeOn(image, [0xff, 0xff, 0x00, 0xC0]);

    // Paint the result on the canvas
    canvasElement.width = image.width;
    canvasElement.height = image.height;
    image.paintOnCanvas(canvasElement);
});