gimel.init();

gimel.io.imageFromFile('samples/sample2.png', function(image) {

    var workingImage = new gimel.Float32T4ChImage(image.width, image.height);
    workingImage.from(image);

    workingImage = workingImage.gradient();

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