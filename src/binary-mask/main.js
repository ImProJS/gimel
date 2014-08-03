gimel.defineModule('binaryMask', ['imageTemplate'], function(moduleContent, extensions) {
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

        this.data = new window.Uint8Array(width*height);
        if (defaultValue) {
           for (var i = 0, ii = width*height; i < ii; ++i) {
               this.data[i] = defaultValue;
           }
        }
    };

    gimel.BinaryMask = BinaryMask;

    return false;
});