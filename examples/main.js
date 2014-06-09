//How to define a module

gimel.defineModule('example', // name
                   ['imageTemplate'], // dependencies
                   function(moduleContent, extensions) { // definition

    // My module will provide some filters. A night filter for instance.
    moduleContent.nightFilter = function(image) {
        var workingImage = new gimel.Uint32T4ChImage(image.width, image.height);

        workingImage.from(image);
        
        workingImage.square();
        workingImage.normalize(0, 65025, 0, 255);
        
        image.from(workingImage);
        image.fillChannel(3, 255);
        return image;
    };

    // I want this filter to be available on any images
    gimel.imageTemplate.extend(function(GimelImage) { // extend the template
        GimelImage.prototype.night = function() {
            return gimel.example.nightFilter(this);
        };


    });
});

gimel.init();

var canvasElement = document.getElementById('view');
gimel.io.imageFromFile('samples/sample3.png', function(image) {
    canvasElement.width = image.width;
    canvasElement.height = image.height;

    image.night();

    image.paintOnCanvas(canvasElement);
});