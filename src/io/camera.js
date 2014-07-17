gimel.module('io').extend(function(moduleContent) {
    window.requestAnimationFrame =
        window.requestAnimationFrame || 
        window.webkitRequestAnimationFrame || 
        window.mozRequestAnimationFrame || 
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame || null;

    window.navigator.getUserMedia =
        window.navigator.getUserMedia ||
        window.navigator.mozGetUserMedia ||
        window.navigator.webkitGetUserMedia ||
        window.navigator.msGetUserMedia || null;

    /**
     * Open an image at the given path as a Gimel image
     * @param {String} path the image path
     * @param {fucntion} callback the function to call when the image is opened
     */
    moduleContent.imageFromCamera = function(path, width, height, callback) {
        var domElementImage = new window.Image();
        domElementImage.addEventListener('load', function() {
            var htmlImage = moduleContent.imageFromDomImage(domElementImage);
            callback(htmlImage);
        }, false);
        domElementImage.src = path;
    };

    /**
     * Open an image at the given path as a Gimel image
     * @param {String} path the image path
     * @param {fucntion} callback the function to call when the image is opened
     */
    moduleContent.imageStreamFromCamera = function(width, height, callback, canvas, videoElement, fps) {
        var delay = fps === undefined ? 33 : window.Math.round(1000/fps);
        if (window.navigator.getUserMedia !== null) {
            videoElement = videoElement === undefined ? document.createElement('video') : videoElement;
            window.navigator.getUserMedia({ video: true }, function(stream) {
                videoElement.src = window.URL.createObjectURL(stream);
                videoElement.play();
            }, function(error) {
                console.error(error);
            });
            videoElement.addEventListener('play', function() {
                var imageStream = new gimel.CanvasImage(width, height, canvas);
                window.setInterval(function() {
                    imageStream.canvasContext.drawImage(videoElement, 0, 0, width, height);
                    callback(imageStream);
                }, delay);
            }, false);
        }
    };
});