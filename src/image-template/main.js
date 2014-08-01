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

    var MaskTemplate = function() {
        /**
         * Constructs binary Mask with specified width, height.
         * @class BinaryMask
         * @constructor
         * @param {integer} width
         * @param {integer} height
         * @param {(integer|boolean)} [defaultValue=0x00] - 0,0x00,false OR 1,0x01,255,0xff,true
         */
        var BinaryMask = function(width, height, defaultValue) {
            this.width = width;
            this.height = height;
            defaultValue = (defaultValue? 0xff : 0x00);

            this.data = new moduleContent.dataTypes.Uint8T(width*height);
            if (defaultValue) {
               for (var i = 0, ii = width*height; i < ii; ++i) {
                   this.data[i] = defaultValue;
               }
            }
        };

        moduleContent.structures.push(BinaryMask);
        gimel.BinaryMask = BinaryMask;
        gimel.utils.setToInherit(gimel.BinaryMask, gimel.Uint8T1ChImage);
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
   MaskTemplate();

    return false;
});