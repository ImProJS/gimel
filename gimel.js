'use strict';
var gimel = (function(rootScope) {
    var utils = {
            /**
             * Extends Parent class
             * @param {function} Child the child class
             * @param {function} Parent the parent class
             * @return {function} the child class
             */
            extend: function(Child, Parent) {
                Child.Parent = Parent;
                Child.prototype = Object.create(Parent.prototype);
                Child.prototype.constructor = Child;
                return Child;
            }
    };

    /**
     * Typed array types (constructors)
     */
    var dataTypes = {
            Uint8Clamped: Uint8ClampedArray, // native default data type of canvas
            Uint8: Uint8Array,
            Uint32: Uint32Array,
            Int8: Int8Array,
            Int32: Int32Array,
            Float32: Float32Array,
            Float64: Float64Array
    };

    /**
     * Constructs Image with specified width, height and data.
     * @param {function} dataType the constructor of data typed array
     * @param {integer} channels the number of channels
     * @return {AbstractImage} the data-typed generated class
     */
    var ImageTemplate = function ImageTemplate(dataType, channels) {
        /**
         * Constructs Image with specified width, height and data.
         * @constructor
         * @param {integer} width
         * @param {integer} height
         * @param {TypedArray} data
         */
        var AbstractImage = function AbstractImage(width, height, data) {
            this.width = width;
            this.height = height;
            this.data = new dataType(width*height*channels);
            if (data !== undefined) {
                this.data.set(data);
            }
            this.dx = channels;
            this.dy = width*channels;
            this.length = width*height*channels;
        };

        AbstractImage.prototype.channels = channels;

        /**
         * Get image clone
         * @return {AbstractImage}
         */
        AbstractImage.prototype.clone = function() {
            return new AbstractImage(this.width, this.height, this.data);
        };

        for (var i = 0, ii = ImageTemplate.scheduledModules.length; i < ii; ++i) {
            var module = ImageTemplate.scheduledModules[i];
            if (module.autoDefined) {
                // no declaration like: gimel.ImageTemplate.defineModule('...' [...], ...)
                console.warn('ImageTemplate: module ' + module.name + ' does not have explicit definition');
            }
            module.definition(AbstractImage, dataType, channels);
            for (var j = 0, jj = module.extensions.length; j < jj; ++j) {
                module.extensions[j](AbstractImage, dataType, channels);
            }
        }
    };

    /**
     * The template modules
     */
    ImageTemplate.modules = {};

    /**
     * The template modules
     */
    ImageTemplate.scheduledModules = [];

    var image = {};

    ImageTemplate.init = function() {
        var unknownDependencies = this.modulesDependenciesUnknown();
        if (unknownDependencies.length > 0) {
            // Do we have unknown modules in dependencies ?
            for (var i = 0, ii = unknownDependencies.length; i < ii; ++i) {
                console.error('ImageTemplate::init: module "' + unknownDependencies[i] + '" is unknown');
            }


        } else if (this.modulesContainCycles()) {
            // Do we have cycles in dependencies ?
            console.error('ImageTemplate::init: module dependencies contain cycles');
        } else {
            // Fill in modulesToSchedule with all the module we have to schedule
            var modulesToSchedule = [];
            for (var attribute in ImageTemplate.modules) {
                modulesToSchedule.push(ImageTemplate.modules[attribute]);
            }

            while (modulesToSchedule.length !== 0) {
                // Move the modules with resolved dependencies (module.unresolvedDependencies === [])
                var tmpModules = [];
                for (var i = 0; i < modulesToSchedule.length; ++i) {
                    if (modulesToSchedule[i].unresolvedDependencies.length === 0) {
                        tmpModules.push(modulesToSchedule.splice(i--, 1)[0]);
                        // We do i-- because the splice remove element i so the next element is at index i now
                    }
                }
                // Mark this modules as resolved in the other module dependencies
                for (var i = 0, ii = modulesToSchedule.length; i < ii; ++i) {
                    for (var j = 0, jj = tmpModules.length; j < jj; ++j) {
                        var index = modulesToSchedule[i].unresolvedDependencies.indexOf(tmpModules[j].name);
                        if (index > -1) {
                            modulesToSchedule[i].unresolvedDependencies.splice(index, 1);
                        }
                    }
                }
                ImageTemplate.scheduledModules = ImageTemplate.scheduledModules.concat(tmpModules);
            }
            
            for (var type in dataTypes) {
                image[type + '' + channels + 'ChImage'] = ImageTemplate(dataTypes[type], 1);
                image[type + '' + channels + 'ChImage'] = ImageTemplate(dataTypes[type], 4);
            }
        }
    };


    /**
     * Tests if some module dependencies are unknown
     * @return {boolean} true if some mudules depend each other
     */
    ImageTemplate.modulesDependenciesUnknown = function() {
        var moduleName;
        var unknownModules = [];

        for (moduleName in ImageTemplate.modules) {
            var dependencies = ImageTemplate.modules[moduleName].dependencies;
            for (var i = 0, ii = dependencies.length; i < ii; ++i) {
                if (!(ImageTemplate.modules[dependencies[i]] instanceof ImageTemplateModule)) {
                    unknownModules.push(dependencies[i]);
                }
            }
        }
        return unknownModules;
    };

    /**
     * Tests if the modules dependencies contains cycles (graph cycle detection algorithm)
     * @return {boolean} true if some mudules depend each other
     */
    ImageTemplate.modulesContainCycles = function() {
        var moduleName;
        var colors = {};
        var nodeNumber = 0;
        var nodeQueue = [];

        for (moduleName in ImageTemplate.modules) {
            colors[moduleName] = 0;
        }

        for (moduleName in ImageTemplate.modules) {
            var dependencies = ImageTemplate.modules[moduleName].dependencies;
            for (var i = 0, ii = dependencies.length; i < ii; ++i) {
                ++colors[dependencies[i]];
            }
        }

        for (moduleName in ImageTemplate.modules) {
            if (colors[moduleName] === 0) {
                nodeQueue.push(moduleName);
                ++nodeNumber;
            }
        }

        while (nodeQueue.length !== 0) {
            moduleName = nodeQueue.shift();
            var dependencies = ImageTemplate.modules[moduleName].dependencies;
            for (var i = 0, ii = dependencies.length; i < ii; ++i) {
                if (--colors[dependencies[i]] === 0) {
                    nodeQueue.push(dependencies[i]);
                    ++nodeNumber;
                }
            }
        }
        return Object.keys(ImageTemplate.modules).length !== nodeNumber;
    };

    /**
     * Constructs an ImageTemplate module to enrich AbstractImage class 
     * @constructor
     * @param {integer} width
     * @param {integer} height
     * @param {TypedArray} data
     */
    var ImageTemplateModule = function ImageTemplateModule(name, dependencies, definition) {
        /**
         * @todo test if name is alphanumeric, if dependencies is an array, if definition is a function
         */
        this.name = name;
        this.dependencies = dependencies;
        this.unresolvedDependencies = dependencies.slice(0, dependencies.length);
        this.definition = definition;
        this.extensions = [];
        this.autoDefined = false;
    };

    /**
     * Add an extension to a module 
     * @param {function} extention the extension function
     */
    ImageTemplateModule.prototype.addExtension = function(extension) {
        this.extensions.push(extension);
    };

    /**
     * Defines a new ImageTemplate module
     * @param {string} name the module name
     * @param {array<string>} dependencies the names of required modules to define this one
     * @param {function} initializer the module definition function
     */
    ImageTemplate.defineModule = function(name, dependencies, initializer) {
        initializer = typeof initializer !== 'function' ? function() {} : initializer;
        var module = ImageTemplate.modules[name];
        if ((module instanceof ImageTemplateModule) && module.autoDefined) {
            module.dependencies = dependencies;
            module.dependencies = initializer;
        }
        ImageTemplate.modules[name] = new ImageTemplateModule(name, dependencies, initializer);
        return ImageTemplate.modules[name];
    };

    /**
     * Get an ImageTemplate module
     * @param {string} name the module name
     * @param {array<string>} dependencies the names of required modules to define this one
     * @param {function} initializer the module definition function
     */
    ImageTemplate.module = function(name) {
        var module = ImageTemplate.modules[name];
        if (!(module instanceof ImageTemplateModule)) {
            module = new ImageTemplateModule(name, []);
            module.autoDefined = true;
            ImageTemplate.modules[name] = module;
        }
        return module;
    };

    return {
        utils: utils,
        ImageTemplate: ImageTemplate
    };
})(this);


gimel.ImageTemplate.module('convolution').addExtension(function(AbstractImage, datatype, channels) {
    /**
     * Convolve the image with the given kernel
     * @param {IntMask} kernel mask (image with one channel)
     * @param {boolean} normalize 
     * @return {AbstractImage} convolved image
     * @todo handle the sides
     */
    AbstractImage.prototype.convolve = function(kernel, normalize) {
        console.assert(kernel.CHANNELS === 1, 'AbstractImage::convolute: Mask must have just one channel');
        console.assert(kernel.width === kernel.height, 'AbstractImage::convolute: Mask must be square');
        
        var convolvedImage = this.clone();
        var destData = convolvedImage.data;
        var srcData = this.data;
        
        for (var v = 0, vv = kernel.height; v < vv; ++v) {
            for (var u = 0, uu = kernel.width; u < uu; ++u) {
                var muv = kernel.data[v*kernel.width + u];
                var uu2 = kernel.origin;
                var vv2 = kernel.origin;
                var cc = this.channels;
                var offset = (u - uu2)*this.dx + (v - vv2)*this.dy;
                for (var y = vv2,
                        yy2 = this.height - vv2,
                        xx2 = this.width - uu2,
                        yy = this.height,
                        xx = this.width; y < yy2; ++y) {
                    var t0 = y*xx;
                    for (var x = uu2; x < xx2; ++x) {
                        var t = (t0 + x)*cc;
                        destData[t] += srcData[t + offset]*muv;
                        destData[t + 1] += srcData[t + offset + 1]*muv;
                        destData[t + 2] += srcData[t + offset + 2]*muv;
                    }
                }
            }
        }
        
        if (normalize) {
            var maskSum = 0;
            for (var t = 0, tt = kernel.length; t < tt; ++t) {
                maskSum += kernel.data[t];
            }
            
            if (maskSum !== 0) {
                for (var t = 0, tt = this.length, c = channels; t < tt; t += c) {
                    destData[t] /= maskSum;
                    destData[t + 1] /= maskSum;
                    destData[t + 2] /= maskSum;
                }
            }
        }

        return convolvedImage;
    };
});

gimel.ImageTemplate.defineModule('convolution', []);
gimel.ImageTemplate.defineModule('image-view', []);
