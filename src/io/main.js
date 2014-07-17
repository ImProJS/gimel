gimel.defineModule('io', ['imageTemplate'], function(moduleContent, extensions) {
    gimel.CanvasImage = function CanvasImage(width, height, canvasDomElement) {
        if (canvasDomElement === undefined) {
            canvasDomElement = document.createElement('canvas');
            canvasDomElement.width = width;
            canvasDomElement.height = height;
        }
    
        var context = canvasDomElement.getContext('2d');
        var canvasData = context.getImageData(0, 0, canvasDomElement.width, canvasDomElement.height);
        gimel.Uint8ClampedT4ChImage.call(this,
                                         canvasDomElement.width, canvasDomElement.height, canvasData.data, true
        );
        this.canvasContext = context;
        this.canvasData = canvasData;
        this.canvasDomElement = canvasDomElement;
    };

    gimel.utils.setToInherit(gimel.CanvasImage, gimel.Uint8ClampedT4ChImage);

    /**
     * Paint an image on a canvas DOM Element
     * @param {HTMLCanvasElement} canvasDomElement the canvas DOM Element
     */
    gimel.CanvasImage.prototype.updateCanvasData = function() {
        this.canvasContext.putImageData(this.canvasData, 0, 0);
    };

    /**
     * Paint an image on a canvas DOM Element
     * @param {HTMLCanvasElement} canvasDomElement the canvas DOM Element
     */
    gimel.CanvasImage.prototype.updateFromCanvas = function() {
        this.canvasData = this.canvasContext.getImageData(0, 0, this.width, this.height);
        this.data = this.canvasData.data;
    };

    /**
     * Paint an image on a canvas DOM Element
     * @param {HTMLCanvasElement} canvasDomElement the canvas DOM Element
     */
    gimel.CanvasImage.prototype.paintOnCanvas = function(canvas) {
        var context = canvas.getContext('2d');
        this.canvasData.data.set(this.data);
        context.putImageData(this.canvasData, 0, 0);
    };

    /**
     * Create a Gimel image from a canvas DOM Element
     * @param {HTMLCanvasElement} canvasDomElement the canvas DOM Element
     * @return {GimelImage} the Gimel image
     */
    moduleContent.imageFromDomCanvas = function(canvasDomElement) {
        return new gimel.CanvasImage(canvasDomElement.width, canvasDomElement.height, canvasDomElement);
    };

    /**
     * Creates a Gimel image from a DOM image Element
     * @param {Image} imageDomElement the image DOM Element
     * @return {GimelImage} the Gimel image
     */
    moduleContent.imageFromDomImage = function(imageDomElement) {
        var canvasDomElement = document.createElement('canvas');
        canvasDomElement.width = imageDomElement.width;
        canvasDomElement.height = imageDomElement.height;
        var context = canvasDomElement.getContext('2d');
        context.drawImage(imageDomElement, 0, 0);
        return moduleContent.imageFromDomCanvas(canvasDomElement);
    };

    /**
     * Open an image at the given path as a Gimel image
     * @param {String} path the image path
     * @param {fucntion} callback the function to call when the image is opened
     */
    moduleContent.imageFromFile = function(path, callback) {
        var domElementImage = new window.Image();
        domElementImage.addEventListener('load', function() {
            var htmlImage = moduleContent.imageFromDomImage(domElementImage);
            callback(htmlImage);
        }, false);
        domElementImage.src = path;
    };

    /**
     * Create an URL of the Gimel image to use is as src attribute in a DOM image
     * @param {GimelImage} image the Gimel image
     * @return {string} the URL
     */
    moduleContent.imageToDataURL = function(image) {
        var canvasImage;
        if (!(image instanceof gimel.CanvasImage)) {
            canvasImage = new gimel.CanvasImage(image.width, image.height);
            if ((image instanceof gimel.Uint8ClampedT4ChImage) || (image instanceof gimel.Uint8T4ChImage)) {
                canvasImage.set(image); 
            } else {
                canvasImage.from(image);
            }
        } else {
            canvasImage = image;
        }
        canvasImage.updateCanvasData();
        return canvasImage.canvasDomElement.toDataURL('image/png');
    };

    /**
     * Creates a DOM image Element from a Gimel image
     * @param {GimelImage} image the Gimel image
     * @return {Image} the DOM image Element
     */
    moduleContent.imageToDomImage = function(image) {
        var imageDomElement = new window.Image();
        imageDomElement.src = moduleContent.imageToDataURL(image);
        return imageDomElement;
    };


    return false;
});