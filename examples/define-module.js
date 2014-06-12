/**
 * This example presents how to define a module
 * Here we will create a benchmark module to measure the difference between float and integer arithmetic operations 
 * on GimelImage.
 */
gimel.defineModule('example', // name
                   ['imageTemplate'], // dependencies
                   function(moduleContent, extensions) { // definition

    moduleContent.measureAddition = function(image0, image1, iterations) {
        var t0 = Date.now();
        for (var i = 0; i < iterations; ++i) {
            image0.add(image1);
        }
        var t1 = Date.now();
        return t1 - t0;
    };

    moduleContent.measureFloatPerformances = function(image, iterations) {
        var workingImage = new gimel.Float32T4ChImage(image.width, image.height);
        workingImage.from(image);
        var kernel = new gimel.Float32T1ChImage(3, 3, [0,  1, 0,
                                                       1, -4.1, 1,
                                                       0,  1, 0]);
        var convolvedImage = workingImage.convolve(kernel, false);
        var addTime = moduleContent.measureAddition(workingImage.clone(), convolvedImage, iterations);
        return addTime/iterations;
    };

    moduleContent.measureIntPerformances = function(image, iterations) {
        var workingImage = new gimel.Int32T4ChImage(image.width, image.height);
        workingImage.from(image);

        // The convolution kernel : sharpening here (be careful of the type)
        var kernel = new gimel.Int32T1ChImage(3, 3, [0,  1, 0,
                                                     1, -4, 1,
                                                     0,  1, 0]);
        var convolvedImage = workingImage.convolve(kernel, false);
        var addTime = moduleContent.measureAddition(workingImage.clone(), convolvedImage, iterations);
        return addTime/iterations;
    };
});

gimel.init(); // always define module before gimel.init()

var canvasElement = document.getElementById('view');
gimel.io.imageFromFile('samples/sample1.png', function(image) {
    canvasElement.width = image.width;
    canvasElement.height = image.height;
    image.paintOnCanvas(canvasElement);
    
    // gimel.<module_name>.methodName
    var intAddTime = gimel.example.measureIntPerformances(image, 1000);
    var floatAddTime = gimel.example.measureFloatPerformances(image, 1000);

    alert('Int Addition time(s): ' + intAddTime + '\n' +
          'Float Addition time(s): ' + floatAddTime
    );

});