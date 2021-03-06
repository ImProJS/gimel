gimel.defineModule('imageTemplate', [], function(moduleContent, extensions) {
    moduleContent.dataTypes = {
                               Uint8ClampedT: window.Uint8ClampedArray, // native default data type of canvas
                               Uint8T: window.Uint8Array,
                               Uint32T: window.Uint32Array,
                               Int8T: window.Int8Array,
                               Int32T: window.Int32Array,
                               Float32T: window.Float32Array,
                               Float64T: window.Float64Array
    };

    moduleContent.structures = [];

    var ImageTemplate = function(ArrayContructor, channels) {
        /**
         * Constructs Image with specified width, height, channels and data.
         * @class GimelImage
         * @constructor
         * @param {integer} width
         * @param {integer} height
         * @param {TypedArray} data
         */
        var GimelImage = function GimelImage(width, height, data, sharedData) {
            sharedData = sharedData !== undefined && sharedData;
            this.width = width;
            this.height = height;
            if (sharedData) {
                this.data = data;
            } else {
                this.data = new ArrayContructor(width*height*channels);
                if (data !== undefined) {
                    this.data.set(data);
                }    
            }
            this.dx = channels;
            this.dy = width*channels;
            this.length = width*height*channels;
        };

        GimelImage.prototype.DATA_TYPE = type;
        GimelImage.prototype.CHANNELS = channels;

        moduleContent.structures.push(GimelImage);
        gimel[type + channels + 'ChImage'] = GimelImage;
    };

    /**
     * Extends the ImageTemplate, ie all the GimelImage with own data type
     * @param {function} extension the function which shall extend the GimelImage classes
     */
    moduleContent.extend = function(extension) {
        for (var i = 0, ii = moduleContent.structures.length; i < ii; ++i) {
            extension(moduleContent.structures[i],
                      moduleContent.structures[i].prototype.DATA_TYPE,
                      moduleContent.structures[i].prototype.CHANNELS);
        }
    };

    for (var type in moduleContent.dataTypes) {
        ImageTemplate(moduleContent.dataTypes[type], 1);
        ImageTemplate(moduleContent.dataTypes[type], 4);
    }

    return false;
});