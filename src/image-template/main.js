gimel.defineModule('imageTemplate', [], function(moduleContent, extensions) {
    moduleContent.dataTypes = {
                               Uint8ClampedT: Uint8ClampedArray, // native default data type of canvas
                               Uint8T: Uint8Array,
                               Uint32T: Uint32Array,
                               Int8T: Int8Array,
                               Int32T: Int32Array,
                               Float32T: Float32Array,
                               Float64T: Float64Array
    };

    moduleContent.structures = [];

    var ImageTemplate = function(ArrayContructor, channels) {
        /**
         * Constructs Image with specified width, height, channels and data.
         * @constructor
         * @param {integer} width
         * @param {integer} height
         * @param {TypedArray} data
         */
        var GimelImage = function GimelImage(width, height, data) {
            this.width = width;
            this.height = height;
            this.data = new ArrayContructor(width*height*channels);
            if (data !== undefined) {
                this.data.set(data);
            }
            this.dx = channels;
            this.dy = width*channels;
            this.length = width*height*channels;
        };

        moduleContent.structures.push(GimelImage);
        gimel[type + channels + 'ChImage'] = GimelImage;
    };

    moduleContent.extend = function(extension) {
        for (var i = 0, ii = moduleContent.structures.length; i < ii; ++i) {
            extension(moduleContent.structures[i]);
        }
    };

    for (var type in moduleContent.dataTypes) {
        ImageTemplate(moduleContent.dataTypes[type], 1);
        ImageTemplate(moduleContent.dataTypes[type], 4);
    }

    return false;
});