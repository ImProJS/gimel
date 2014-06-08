'use strict';
var gimel = (function(rootScope) {
    var Gimel = function Gimel() {
        this.utils = {
                      /**
                       * Set that Child class extends Parent class
                       * @param {function} Child the child class
                       * @param {function} Parent the parent class
                       * @return {function} the child class
                       */
                      setInheritance: function(Child, Parent) {
                          Child.Parent = Parent;
                          Child.prototype = Object.create(Parent.prototype);
                          Child.prototype.constructor = Child;
                          return Child;
                      }
        };

        this.modules = {};

        var GimelModule = function GimelModule(name, dependencies, initializer) {
            this.name = name;
            this.dependencies = dependencies;
            this.initializer = initializer === undefined ? function() {} : initializer;
            this.extensions = [];
            this.autoDefined = false;
        };

        /**
         * Add an extension to a module 
         * @param {function} extention the extension function
         */
        GimelModule.prototype.extend = function(extension) {
            this.extensions.push(extension);
        };

        /**
         * Tests if some module dependencies are unknown
         * @param {Object<GimelModules>} the defined modules
         * @return {boolean} true if some mudules depend each other
         */
        var modulesDependenciesUnknown = function(modules) {
            var moduleName;
            var unknownModules = [];

            for (moduleName in modules) {
                var dependencies = modules[moduleName].dependencies;
                for (var i = 0, ii = dependencies.length; i < ii; ++i) {
                    if (!(modules[dependencies[i]] instanceof GimelModule)) {
                        unknownModules.push(dependencies[i]);
                    }
                }
            }
            return unknownModules;
        };

        /**
         * Tests if the modules dependencies contains cycles (graph cycle detection algorithm)
         * @param {Object<GimelModules>} the defined modules
         * @return {boolean} true if some mudules depend each other
         */
        var modulesContainCycles = function(modules) {
            var moduleName;
            var colors = {};
            var nodeNumber = 0;
            var nodeQueue = [];

            for (moduleName in modules) {
                colors[moduleName] = 0;
            }

            for (moduleName in modules) {
                var dependencies = modules[moduleName].dependencies;
                for (var i = 0, ii = dependencies.length; i < ii; ++i) {
                    ++colors[dependencies[i]];
                }
            }

            for (moduleName in modules) {
                if (colors[moduleName] === 0) {
                    nodeQueue.push(moduleName);
                    ++nodeNumber;
                }
            }

            while (nodeQueue.length !== 0) {
                moduleName = nodeQueue.shift();
                var dependencies = modules[moduleName].dependencies;
                for (var i = 0, ii = dependencies.length; i < ii; ++i) {
                    if (--colors[dependencies[i]] === 0) {
                        nodeQueue.push(dependencies[i]);
                        ++nodeNumber;
                    }
                }
            }
            return Object.keys(modules).length !== nodeNumber;
        };

        /**
         * Creates a new gimel module
         * @param {string} name the module name
         * @param {array<string>} dependencies the names of required modules to define this one
         * @param {function} initializer the module definition function
         */
        var createModule = function(name, dependencies, initializer) {
            initializer = typeof initializer !== 'function' ? function() {} : initializer;

            var moduleNameRegExp = new RegExp('^[a-zA-Z][a-zA-Z0-9_]*$');
            if (moduleNameRegExp.exec(name) === null) {
                // We want the module to be alpha-numerical to access its content with gimel.myModule
                console.error('Gimel::defineModule: the module name "' + name + '" must be alphanumeric and not begin with a digit');
            } else if (this[name] !== undefined) {
                // Every Gimel object properties are reserved
                console.error('Gimel::defineModule: the module name "' + name + '" is reserved');
            } else {
                this.modules[name] = new GimelModule(name, dependencies, initializer);
                return this.modules[name];
            }
        };

        /**
         * Defines a new gimel module
         * @param {string} name the module name
         * @param {array<string>} dependencies the names of required modules to define this one
         * @param {function} initializer the module definition function
         */
        this.defineModule = function(name, dependencies, initializer) {
            var module = this.modules[name];
            if (module instanceof GimelModule) {
                if (module.autoDefined) {
                    // The module is auto-defined: it has been called and eventually defined
                    module.dependencies = dependencies;
                    module.initializer = initializer;
                    module.autoDefined = false;
                    return module;
                } else {
                    console.error('Gimel::defineModule: the module ' + name + ' is already defined');
                }
            } else {
                return createModule.call(this, name, dependencies, initializer);
            }
            return null;
        };

        /**
         * Get an ImageTemplate module
         * @param {string} name the module name
         * @param {array<string>} dependencies the names of required modules to define this one
         * @param {function} initializer the module definition function
         */
        this.module = function(name) {
            var module = this.modules[name];
            // If the module does not exist we create an autoDefined module
            // to handle the case where the module is declared after in the code
            if (!(module instanceof GimelModule)) {
                module = createModule.call(this, name, []);
                module.autoDefined = true;
            }
            return module;
        };

        /**
         * Sorts the module to initialize the dependencies before each module
         * @param {array<GimelModule>} the modules in the right order
         */
        var buildInitWorkflow = function() {
            var unknownDependencies = modulesDependenciesUnknown(this.modules);
            var scheduledModules = [];

            if (unknownDependencies.length > 0) { // Do we have unknown modules in dependencies ?
                for (var i = 0, ii = unknownDependencies.length; i < ii; ++i) {
                    console.error('Gimel::init: module "' + unknownDependencies[i] + '" is unknown');
                }
            } else if (modulesContainCycles(this.modules)) { // Do we have cycles in dependencies ?
                console.error('Gimel::init: module dependencies contain cycles');
            } else {
                // Fill in modulesToSchedule with all the module we have to schedule
                var modulesToSchedule = [];
                var modulesUnresolvedDependencies = {};
                for (var name in this.modules) {
                    modulesToSchedule.push(this.modules[name]);
                    var dependencies = this.modules[name].dependencies;
                    modulesUnresolvedDependencies[name] = dependencies.slice(0, dependencies.length);
                }

                while (modulesToSchedule.length !== 0) {
                    // Move the modules with resolved dependencies (module.modulesUnresolvedDependencies === [])
                    var tmpModules = [];
                    for (var i = 0; i < modulesToSchedule.length; ++i) {
                        var unresolvedDependencies = modulesUnresolvedDependencies[modulesToSchedule[i].name];
                        if (unresolvedDependencies.length === 0) {
                            tmpModules.push(modulesToSchedule.splice(i--, 1)[0]);
                            // We do i-- because the splice remove element i so the next element is at index i now
                        }
                    }
                    // Mark this modules as resolved in the other module dependencies
                    for (var i = 0, ii = modulesToSchedule.length; i < ii; ++i) {
                        var unresolvedDependencies = modulesUnresolvedDependencies[modulesToSchedule[i].name];
                        for (var j = 0, jj = tmpModules.length; j < jj; ++j) {
                            var index = unresolvedDependencies.indexOf(tmpModules[j].name);
                            if (index > -1) {
                                unresolvedDependencies.splice(index, 1);
                            }
                        }
                    }
                    // Push the modules with no more unresolved dependencies
                    scheduledModules = scheduledModules.concat(tmpModules);
                }
            }
            return scheduledModules;
        };

        /**
         * Initialize Gimel library
         */
        this.init = function() {
            var scheduledModules = buildInitWorkflow.call(this);

            for (var i = 0, ii = scheduledModules.length; i < ii; ++i) {
                var module = scheduledModules[i];
                if (module.autoDefined) {
                    // The module has not been declared with definedModule(..., [...], ...)
                    console.warn('ImageTemplate: module ' + module.name + ' does not have explicit definition');
                }
                this[module.name] = {};
                if (!module.initializer(this[module.name], module.extensions)) { // If module.initializer() returns true it shall manage its own extensions
                    for (var j = 0, jj = module.extensions.length; j < jj; ++j) {
                        module.extensions[j](this[module.name]);
                    }
                }
            }

        };
    };

    return new Gimel();
})(this);

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

gimel.module('imageTemplate').extend(function(moduleContent) {
    gimel.imageTemplate.extend(function(GimelImage) {
        /**
         * Compute the sum of two images (each pixel value)
         * @param {GimelImage} image the given image
         * @return {GimelImage} this image
         */
        GimelImage.prototype.add = function(image) {
            var thisData = this.data;
            var srcData = image.data;

            for (var t = 0, tt = image.length; t < tt; t += 4) {
                thisData[t] += srcData[t];
                thisData[t + 1] += srcData[t + 1];
                thisData[t + 2] += srcData[t + 2];
            }
            return this;
        };

        /**
         * Compute the difference of two images (each pixel value)
         * @param {GimelImage} image the given image
         * @return {GimelImage} this image
         */
        GimelImage.prototype.subtract = function(image) {
            var thisData = this.data;
            var srcData = image.data;

            for (var t = 0, tt = image.length; t < tt; t += 4) {
                thisData[t] -= srcData[t];
                thisData[t + 1] -= srcData[t + 1];
                thisData[t + 2] -= srcData[t + 2];
            }
            return this;
        };

        /**
         * Compute the difference of two images (each pixel value)
         * @param {GimelImage} image the given image
         * @return {GimelImage} this image
         */
        GimelImage.prototype.divide = function(image) {
            var thisData = this.data;
            var srcData = image.data;

            for (var t = 0, tt = image.length; t < tt; t += 4) {
                thisData[t] /= srcData[t];
                thisData[t + 1] /= srcData[t + 1];
                thisData[t + 2] /= srcData[t + 2];
            }
            return this;
        };

        /**
         * Compute the square of each pixel value
         * @return {GimelImage} this image
         */
        GimelImage.prototype.square = function() {
            var thisData = this.data;
            var sqrt = Math.sqrt;

            for (var t = 0, tt = this.length; t < tt; t += 4) {
                thisData[t] = thisData[t]*thisData[t];
                thisData[t + 1] = thisData[t + 1]*thisData[t + 1];
                thisData[t + 2] = thisData[t + 2]*thisData[t + 2];
            }
            return this;
        };

        /**
         * Compute the square root of each pixel value
         * @return {GimelImage} this image
         */
        GimelImage.prototype.sqrt = function() {
            var thisData = this.data;
            var sqrt = Math.sqrt;

            for (var t = 0, tt = this.length; t < tt; t += 4) {
                thisData[t] = sqrt(thisData[t]);
                thisData[t + 1] = sqrt(thisData[t + 1]);
                thisData[t + 2] = sqrt(thisData[t + 2]);
            }
            return this;
        };

        /**
         * Normalize the image values from [srcMin, srcMax] to [destMin, destMax]
         * @return {GimelImage} this image
         */
        GimelImage.prototype.normalize = function(srcMin, srcMax, destMin, destMax) {
            var thisData = this.data;
            var alpha = (destMax - destMin)/(srcMax - srcMin)

            for (var t = 0, tt = this.length; t < tt; t += 4) {
                thisData[t] = (thisData[t] - srcMin)*alpha + destMin;
                thisData[t + 1] = (thisData[t + 1] - srcMin)*alpha + destMin;
                thisData[t + 2] = (thisData[t + 2] - srcMin)*alpha + destMin;
            }
            return this;
        };


        /**
         * Min operator between two images (each pixel value)
         * @param {GimelImage} image the given image
         * @return {GimelImage} this image
         */
        GimelImage.prototype.min = function(image) {
            var thisData = this.data;
            var srcData = image.data;

            for (var t = 0, tt = image.length; t < tt; t += 4) {
                thisData[t] = srcData[t] < thisData[t] ? srcData[t] : thisData[t];
                thisData[t] = srcData[t + 1] < thisData[t + 1] ? srcData[t + 1] : thisData[t + 1];
                thisData[t] = srcData[t + 2] < thisData[t + 2] ? srcData[t + 2] : thisData[t + 2];
            }
            return this;
        };

        /**
         * Max operator between two images (each pixel value)
         * @param {GimelImage} image the given image
         * @return {GimelImage} this image
         */
        GimelImage.prototype.max = function(image) {
            var thisData = this.data;
            var srcData = image.data;

            for (var t = 0, tt = image.length; t < tt; t += 4) {
                thisData[t] = srcData[t] > thisData[t] ? srcData[t] : thisData[t];
                thisData[t] = srcData[t + 1] > thisData[t + 1] ? srcData[t + 1] : thisData[t + 1];
                thisData[t] = srcData[t + 2] > thisData[t + 2] ? srcData[t + 2] : thisData[t + 2];
            }
            return this;
        };
    });

    return false;
});

gimel.module('imageTemplate').extend(function(moduleContent) {
    gimel.imageTemplate.extend(function(GimelImage) {
        /**
         * Apply the matrix to each pixel vector (r, g, b)
         * @param {GimelImage} matrix the transformation matrix
         * @return {GimelImage} this image
         */
        GimelImage.prototype.transformChannels = function(matrix) {
            var matrixData = matrix.data;
            var data = this.data;
            for (var t = 0, tt = this.length; t < tt; t += 4) {
                var r = data[t];
                var g = data[t + 1];
                var b = data[t + 2];
                data[t] = matrixData[0]*r + matrixData[1]*g + matrixData[2]*b; 
                data[t + 1] = matrixData[3]*r + matrixData[4]*g + matrixData[5]*b; 
                data[t + 2] = matrixData[6]*r + matrixData[7]*g + matrixData[8]*b; 
            }
            return this;
        };
    });

    return false;
});

gimel.module('imageTemplate').extend(function(moduleContent) {
    moduleContent.extend(function(GimelImage) {
        /**
         * Make an exact copy of an image
         * @return {GimelImage} this the new image
         */
        GimelImage.prototype.clone = function() {
            return new GimelImage(this.width, this.height, this.data);
        };

        /**
         * Copy image data from a (different) typed image
         * @param {GimelImage} image the given image
         * @return {GimelImage} this image
         */
        GimelImage.prototype.from = function(image) {
            var convertedImage = new GimelImage(image.width, image.height);
            var dataSrc = image.data;
            var dataDest = this.data;
            for (var t = 0, tt = image.length; t < tt; ++t) {
                dataDest[t] = dataSrc[t];
            }
            return this;
        };

        /**
         * Copy image data from a same typed image
         * @param {GimelImage} image the given image
         * @return {GimelImage} this image
         */
        GimelImage.prototype.set = function(image) {
            this.data.set(image.data);
            return this;
        };
    });
});



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