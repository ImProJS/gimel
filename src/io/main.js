gimel.defineModule('io', ['imageTemplate'], function(moduleContent, extensions) {
    gimel.CanvasImage = function CanvasImage(width, height, canvasDomElement) {
        if (canvasDomElement === undefined) {
            canvasDomElement = document.createElement('canvas');
            canvasDomElement.width = imageDomElement.width;
            canvasDomElement.height = imageDomElement.height;
        }

        var context = canvasDomElement.getContext('2d');
        var canvasData = context.getImageData(0, 0, canvasDomElement.width, canvasDomElement.height);
        gimel.Uint8ClampedT4ChImage.call(this,
                                         canvasDomElement.width, canvasDomElement.height, canvasData.data
        );
        this.canvasData = canvasData;
        this.canvasDomElement = canvasDomElement;
    };
    
    gimel.utils.setInheritance(gimel.CanvasImage, gimel.Uint8ClampedT4ChImage);
    
    gimel.CanvasImage.prototype.paintOnCanvas = function(canvas) {
        var context = canvas.getContext('2d');
        this.canvasData.data.set(this.data);
        context.putImageData(this.canvasData, 0, 0);
    };

    moduleContent.imageFromDomCanvas = function(canvasDomElement) {
        return new gimel.CanvasImage(canvasDomElement.width, canvasDomElement.height, canvasDomElement);
    };

    moduleContent.imageFromDomImage = function(imageDomElement) {
        var canvasDomElement = document.createElement('canvas');
        canvasDomElement.width = imageDomElement.width;
        canvasDomElement.height = imageDomElement.height;
        var context = canvasDomElement.getContext('2d');
        context.drawImage(imageDomElement, 0, 0);
        return moduleContent.imageFromDomCanvas(canvasDomElement);
    };

    moduleContent.imageFromFile = function(path, callback) {
        var domElementImage = new Image();
        domElementImage.addEventListener('load', function() {
            var htmlImage = moduleContent.imageFromDomImage(domElementImage);
            callback(htmlImage);
        }, false);
        domElementImage.src = path;
    };

    moduleContent.imageToDomImage = function(image) {
        if (!(image instanceof gimel.CanvasImage)) {
            var canvasImage = new gimel.CanvasImage(image.width, image.height);
            if ((image instanceof gimel.Uint8ClampedT4ChImage) || (image instanceof gimel.Uint8T4ChImage)) {
                canvasImage.set(image); 
            } else {
                canvasImage.from(image);
            }
        }
        var imageDomElement = new Image();
        imageDomElement.src = image.canvasDomElement.toDataURL("image/png");
        return imageDomElement;
    };

    return false;
});