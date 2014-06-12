gimel.init();

gimel.io.imageFromFile('samples/sample4.png', function(image) {

    var workingImage = new gimel.Float32T4ChImage(image.width, image.height);
    workingImage.from(image);

    var chTransformMatrix = new gimel.Float32T1ChImage(3, 3, [0.5, 0.5, 0.5,
                                                              50/255, 70/255, 70/255,
                                                              0, 0, 0]);
  
    workingImage.transformChannels(chTransformMatrix);
    
    var kernel = new gimel.Float32T1ChImage(3, 3, [-1/2, -1, -1/2,
                                                   -1,    12, -1,
                                                   -1/2, -1, -1/2]);
    workingImage = workingImage.convolve(kernel, true);

    image.from(workingImage);
    image.fillChannel(3, 255);
    
    var resultImage = document.getElementById('resultImage');
    resultImage.src = gimel.io.imageToDataURL(image);
    $(function() {
        $('#container').beforeAfter({
            imagePath:'assets/',
            animateIntro : true,
            introDelay : 0,
            introDuration : 500,
            showFullLinks : false});
    });
});