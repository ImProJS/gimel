gimel.init();
var workingImage = null;
gimel.io.imageFromFile('samples/sample2.png', function(image) {

    workingImage = new gimel.Float32T4ChImage(image.width, image.height);
    workingImage.from(image);

    var t0 = 0.0, t1 = 0.0;
    for (var i = 0; i < 40; ++i) {
        t0 = window.performance.now();
        workingImage = workingImage.gaussian(7);
        r1 = 
    }

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