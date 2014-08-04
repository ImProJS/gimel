'use strict';

this.gimel = (function() {
    var Gimel = function Gimel() {
        this.utils = {
                      /**
                       * Set that Child class extends Parent class
                       * @param {function} Child the child class
                       * @param {function} Parent the parent class
                       * @return {function} the child class
                       */
                      setToInherit: function(Child, Parent) {
                          Child.Parent = Parent;
                          Child.prototype = Object.create(Parent.prototype);
                          Child.prototype.constructor = Child;
                          return Child;
                      }
        };

        this.modules = {};

        /**
         * The Module container class
         * @class GimelModule
         */
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
         * @param {Object} the defined modules
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
         * @param {Object} the defined modules
         * @return {boolean} true if some mudules depend each other
         */
        var modulesContainCycles = function(modules) {
            var moduleName = '';
            var colors = {};
            var nodeNumber = 0;
            var nodeQueue = [];
            var dependencies = [];
            var i = 0, ii = 0;
            
            for (moduleName in modules) {
                colors[moduleName] = 0;
            }

            for (moduleName in modules) {
                dependencies = modules[moduleName].dependencies;
                for (i = 0, ii = dependencies.length; i < ii; ++i) {
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
                dependencies = modules[moduleName].dependencies;
                for (i = 0, ii = dependencies.length; i < ii; ++i) {
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
         * @param {string[]} dependencies the names of required modules to define this one
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
         * @param {string[]} dependencies the names of required modules to define this one
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
         * @param {string[]} dependencies the names of required modules to define this one
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
         * @param {GimelModule[]} the modules in the right order
         */
        var buildInitWorkflow = function() {
            var unknownDependencies = modulesDependenciesUnknown(this.modules);
            var scheduledModules = [];
            var i = 0, ii = 0;
            var unresolvedDependencies = [];

            if (unknownDependencies.length > 0) { // Do we have unknown modules in dependencies ?
                for (i = 0, ii = unknownDependencies.length; i < ii; ++i) {
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
                    for (i = 0; i < modulesToSchedule.length; ++i) {
                        unresolvedDependencies = modulesUnresolvedDependencies[modulesToSchedule[i].name];
                        if (unresolvedDependencies.length === 0) {
                            tmpModules.push(modulesToSchedule.splice(i--, 1)[0]);
                            // We do i-- because the splice remove element i so the next element is at index i now
                        }
                    }
                    // Mark this modules as resolved in the other module dependencies
                    for (i = 0, ii = modulesToSchedule.length; i < ii; ++i) {
                        unresolvedDependencies = modulesUnresolvedDependencies[modulesToSchedule[i].name];
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
                    null /* console.warn('ImageTemplate: module ' + module.name + ' does not have explicit definition') */;
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
})();

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
        this.length = width*height;
        defaultValue = (defaultValue? 0xff : 0x00);

        this.data = new window.Uint8Array(width*height);
        if (defaultValue) {
           for (var i = 0, ii = this.length; i < ii; ++i) {
               this.data[i] = defaultValue;
           }
        }
    };

    gimel.BinaryMask = BinaryMask;

    return false;
});



gimel.module('binaryMask').extend(function(moduleContent) {
		// BASIC LOGICAL OPERATORS: NOT, AND, OR, XOR

		/**
     * Logical NOT operation. Set operation: complement
     * @param {BinaryMask} mask - the given mask
     * @param {BinaryMask} dest - mask on which the result is written (mask, this...). If undefined, create a new mask
     * @return {BinaryMask} dest mask
     */
		var NOT = function(mask, dest) {
				dest = dest || new gimel.BinaryMask(mask.width, mask.height);

				var maskData = mask.data;
				var destData = dest.data;

				for (var t = 0, tt = mask.length; t < tt; ++t) {
	    			destData[t] = (maskData[t])? 0x00 : 0xff;
	    	}

	    	return dest;
		};

		/**
     * Logical AND operation. Set operation: intersection
     * @param {BinaryMask} mask1 - the first mask
     * @param {BinaryMask} mask2 - the second mask
     * @param {BinaryMask} dest - mask on which the result is written (mask1, mask2, this...). If undefined, create a new mask
     * @return {BinaryMask} dest mask
     */
		var AND = function(mask1, mask2, dest) {
				dest = dest || new gimel.BinaryMask(mask1.width, mask1.height);

				var mask1Data = mask1.data;
				var mask2Data = mask2.data;
				var destData = dest.data;

				for (var t = 0, tt = mask1.length; t < tt; ++t) {
	    			destData[t] = (mask1Data[t] & mask2Data[t])? 0xff : 0x00;
	    	}

	    	return dest;
		};

		/**
     * Logical OR operation. Set operation: union
     * @param {BinaryMask} mask1 - the first mask
     * @param {BinaryMask} mask2 - the second mask
     * @param {BinaryMask} dest - mask on which the result is written (mask1, mask2, this...). If undefined, create a new mask
     * @return {BinaryMask} dest mask
     */
		var OR = function(mask1, mask2, dest) {
				dest = dest || new gimel.BinaryMask(mask1.width, mask1.height);

				var mask1Data = mask1.data;
				var mask2Data = mask2.data;
				var destData = dest.data;

				for (var t = 0, tt = mask1.length; t < tt; ++t) {
	    			destData[t] = (mask1Data[t] | mask2Data[t])? 0xff : 0x00;
	    	}

	    	return dest;
		};

		/**
     * Logical XOR operation. Set operation: symmetric difference
     * @param {BinaryMask} mask1 - the first mask
     * @param {BinaryMask} mask2 - the second mask
     * @param {BinaryMask} dest - mask on which the result is written (mask1, mask2, this...). If undefined, create a new mask
     * @return {BinaryMask} dest mask
     */
		var XOR = function(mask1, mask2, dest) {
				dest = dest || new gimel.BinaryMask(mask1.width, mask1.height);

				var mask1Data = mask1.data;
				var mask2Data = mask2.data;
				var destData = dest.data;

				for (var t = 0, tt = mask1.length; t < tt; ++t) {
	    			destData[t] = (mask1Data[t] ^ mask2Data[t])? 0xff : 0x00;
	    	}

	    	return dest;
		};

		// Class methods: result on a new mask
		gimel.BinaryMask.not           = function(mask)         { return NOT(mask);         };
		gimel.BinaryMask.and           = function(mask1, mask2) { return AND(mask1, mask2); };
		gimel.BinaryMask.or            = function(mask1, mask2) { return  OR(mask1, mask2); };
		gimel.BinaryMask.xor           = function(mask1, mask2) { return XOR(mask1, mask2); };
		gimel.BinaryMask.complement    = function(mask)         { return NOT(mask);         };
		gimel.BinaryMask.intersection  = function(mask1, mask2) { return AND(mask1, mask2); };
		gimel.BinaryMask.union         = function(mask1, mask2) { return  OR(mask1, mask2); };
		gimel.BinaryMask.symDifference = function(mask1, mask2) { return XOR(mask1, mask2); };
		// Object methods: result on caller mask
    gimel.BinaryMask.prototype.not           = function()     { return NOT(this,       this); };
    gimel.BinaryMask.prototype.and           = function(mask) { return AND(this, mask, this); };
    gimel.BinaryMask.prototype.or            = function(mask) { return  OR(this, mask, this); };
    gimel.BinaryMask.prototype.xor           = function(mask) { return XOR(this, mask, this); };
    gimel.BinaryMask.prototype.complement    = function()     { return NOT(this,       this); };
    gimel.BinaryMask.prototype.intersection  = function(mask) { return AND(this, mask, this); };
    gimel.BinaryMask.prototype.union         = function(mask) { return  OR(this, mask, this); };
    gimel.BinaryMask.prototype.symDifference = function(mask) { return XOR(this, mask, this); };



    // ADVANCED OPERATORS: difference, ...

    /**
     * Logical A AND NOT B operation. Set operation: difference
     * @param {BinaryMask} mask1 - the first mask
     * @param {BinaryMask} mask2 - the second mask
     * @param {BinaryMask} dest - mask on which the result is written (mask1, mask2, this...). If undefined, create a new mask
     * @return {BinaryMask} dest mask
     */
    var difference = function(mask1, mask2, dest) {
				dest = dest || new gimel.BinaryMask(mask1.width, mask1.height);

				var mask1Data = mask1.data;
				var mask2Data = mask2.data;
				var destData = dest.data;

				for (var t = 0, tt = mask1.length; t < tt; ++t) {
	    			destData[t] = (mask1Data[t] & !mask2Data[t])? 0xff : 0x00;
	    	}

	    	return dest;
    };

		// Class methods: result on a new mask
		gimel.BinaryMask.difference = function(mask1, mask2) { return difference(mask1, mask2); };
		// Object methods: result on caller mask
    gimel.BinaryMask.prototype.difference = function(mask) { return difference(this, mask, this); };

});


gimel.module('binaryMask').extend(function(moduleContent) {
		/**
     * Draw a disk on the mask
     * @param {integer} centerX - x-value of the center
     * @param {integer} centerY - y-value of the center
     * @param {integer} radius - disk radius
     * @return {BinaryMask} this mask
     */
		gimel.BinaryMask.prototype.drawDisk = function(centerX, centerY, radius) {
				var data = this.data;

			  var squareRadius = radius*radius;

        for (var y = 0, xx = this.width, yy = this.height; y < yy; y++) {
            var yDist = (centerY - y)*(centerY - y);
        		if (yDist < squareRadius) {
		            var yOffset = y*xx;
		            for (var x = 0;  x < xx; x++) {
		                if (yDist + (centerX - x)*(centerX - x) < squareRadius) {
		                    data[yOffset + x] = 0xff;
		                }
		            }
	          }
        }

        return this;
		};

		/**
     * Draw a circle on the mask
     * @param {integer} centerX - x-value of the center
     * @param {integer} centerY - y-value of the center
     * @param {integer} radius - disk radius
     * @param {integer} [strokeWidth=1] - stroke width; stroke is centered at radius distance of the center
     * @return {BinaryMask} this mask
     */
		gimel.BinaryMask.prototype.drawCircle = function(centerX, centerY, radius, strokeWidth) {
				var data = this.data;

				strokeWidth = strokeWidth || 1;
			  var squareInnerRadius = (radius - strokeWidth/2)*(radius - strokeWidth/2);
			  var squareOuterRadius = (radius + strokeWidth/2)*(radius + strokeWidth/2);

        for (var y = 0, xx = this.width, yy = this.height; y < yy; y++) {
            var yDist = (centerY - y)*(centerY - y);
        		if (yDist < squareOuterRadius) {
		            var yOffset = y*xx;
		            for (var x = 0;  x < xx; x++) {
		            		var squarePointRadius = yDist + (centerX - x)*(centerX - x);
		                if (squarePointRadius < squareOuterRadius && squarePointRadius >= squareInnerRadius) {
		                    data[yOffset + x] = 0xff;
		                }
		            }
	          }
        }

        return this;
		};

		/**
     * Draw a rectangle on the mask
     * @param {integer} x1 - x-value of the top left corner
     * @param {integer} y1 - y-value of the top left corner
     * @param {integer} x2 - x-value of the bottom right corner
     * @param {integer} y2 - y-value of the bottom right corner
     * @return {BinaryMask} this mask
     */
		gimel.BinaryMask.prototype.drawRectangle = function(x1, y1, x2, y2) {
				var data = this.data;

			  for (var y = 0, xx = this.width, yy = this.height; y < yy; y++) {
			  		if (y > y1 && y < y2) {
		            var yOffset = y*xx;
		            for (var x = 0;  x < xx; x++) {
		                if (x > x1 && x < x2) {
		                    data[yOffset + x] = 0xff;
		                }
		            }
	          }
        }

        return this;
		};

		/**
     * Draw a polygon on the mask. Algorithm by Darel Rex Finley.
     * @param {Point[]} vertices - polygon vertices (point: object with x and y properties)
     * @return {BinaryMask} this mask
     */
		gimel.BinaryMask.prototype.drawPolygon = function(vertices) {
				var data = this.data;

			  for (var y = 0, yy = this.height; y < yy; y++) {
		        var yOffset = y*this.width;
			  		var xCrossings = [];

						for (var v1 = vertices.length - 1, v2 = 0, vv = vertices.length; v2 < vv; v1 = v2++) {
								if ((vertices[v1].y < y && vertices[v2].y >= y) || (vertices[v2].y < y && vertices[v1].y >= y)) {
										xCrossings.push(Math.round(vertices[v1].x + (y - vertices[v1].y)/(vertices[v2].y - vertices[v1].y)*(vertices[v2].x - vertices[v1].x)));
								}
						}
						xCrossings.sort();

						for (var c = 0, cc = xCrossings.length - 1; c < cc; c += 2) {
								for (var x = xCrossings[c], xx = xCrossings[c + 1] + 1; x < xx; ++x) {
										data[yOffset + x] = 0xff;
								}
						}
        }

        return this;
		};
});

gimel.module('imageTemplate').extend(function(moduleContent) {
	gimel.imageTemplate.extend(function(GimelImage, dataType, channels) {
		/*var energyFunction;
		var energyMap;*/

		GimelImage.prototype.retarget = function(width, height, protectMask, removeMask) {
			var retargeted = this.clone();

			var xDiff = width  - this.width;
			var yDiff = height - this.height;

			var xyOperationMask = 0x00;
			xyOperationMask += (xDiff > 0)? 0x08 : ((xDiff < 0)? 0x04 : 0x00) + (yDiff > 0)? 0x02 : ((yDiff < 0)? 0x01 : 0x00);
			/*
			switch (xyOperationMask) {
			case 0x00: // xDiff=0, yDiff=0: no operation at all; abort
				break;
			case 0x01: // xDiff=0, yDiff<0: y image reducing
			  while (yDiff < 0) {
			  	retargeted = removeVerticalSeam(retargeted, findVerticalSeam(retargeted, protectMask, removeMask));
			  	yDiff++;
			  }
				break; 
			case 0x02: // xDiff=0, yDiff>0: y image enlarging
				var halfWidth = (this.width >> 1);
				while (yDiff > halfWidth) {
					var duplicateSeamMask = new gimel.BinaryMask(retargeted.width, retargeted.height, false); 
					for (var i = 0, ii = yDiff; i < ii; i++) {
						// Mask: object method (maskObject.logicalOR...) modifies the object of the method. 
						// Static method (gimel.BinaryMask.LogicalOR...) doesn't.
						var seam = findVerticalSeam(retargeted, gimel.BinaryMask.LogicalOR(protectMask, duplicateSeamMask), removeMask);
						retargeted = duplicateVerticalSeam(retargeted, seam);
						duplicateSeamMask = duplicateVerticalSeam(duplicateSeamMask.logicalOR(seamAsMask(seam), seam);

						// develop mask support (binary, 8bits, ...). 
						// Use a mask to store chosen and duplicate seams, and combine it to the protectmask in order to avoid a pixel to be duplicate twice
						// Mask: logical OR, AND, NOT, XOR, NOR, NAND
					}
				}
				break;
			case 0x04: // xDiff<0, yDiff=0: x image reducing
			  while (xDiff < 0) {
			  	retargeted = removeHorizontalSeam(retargeted, findHorizontalSeam(retargeted, protectMask, removeMask));
			  	xDiff++;
			  }
				break;
			case 0x05: // xDiff<0, yDiff<0: x image reducing  and y image reducing
				while (xDiff < 0 || yDiff < 0) {
					var horizontalSeam = findHorizontalSeam(retargeted, protectMask, removeMask);
					var   verticalSeam = finVerticalSeam(retargeted, protectMask, removeMask);

					if (horizontalSeam.energy < verticalSeam.energy) {
						retargeted = removeHorizontalSeam(retargeted, horizontalSeam);
						xDiff++;
					} else {
						retargeted = removeVerticalSeam(retargeted, verticalSeam);
						yDiff++;
					}
				}
				break;
			case 0x06: // xDiff<0, yDiff>0: x image reducing  and y image enlarging
				break;
			case 0x08: // xDiff>0, yDiff=0: x image enlarging
				break;
			case 0x09: // xDiff>0, yDiff<0: x image enlarging and y image reducing
			case 0x0A: // xDiff>0, yDiff>0: x image enlarging and y image enlarging
			}*/
			return retargeted;
			/*
			if (xDiff > 0 && yDiff > 0) {
				removeSeam((xDiff > yDiff)
			}

			while (xDiff < 0 && yDiff < 0) {
				var seams {
					X: findSeam(directions.X),
					Y: findSeam(directions.Y)
				};

				// If xDiff != 0 and yDiff != 0, we choose the direction where the seam has the minimum energy 
				var direction = (seams.Y.energy < seams.X.energy)? directions.Y : directions.X;
				
				retargeted = removeSeam(retargeted, seams[direction]);
				diffs[direction]++;
			};*/
			/*
		  var: resized = clone(image)
		  
		  if (diff < 0):
		    while (diff > 0): 
		      var: seam = findSeam(resized)
		      var: resized = removeSeam(resized, seam)
		  
		  else:
		    if (diff > image.width/2):
		      image = resizeImage(image, image.width/2)
		      diff = diff - image.width/2
		    
		    var: seams = new Array(diff)
		    for (var: i in 0..diff-1):
		      var: seam = findSeam(resized)
		      var: resized = removeSeam(resized, seam)
		      seams[i] = seam
		   
		    var: resized = clone(image)
		    for (var: seam in seams):
		      var: resized = duplicateSeam(resized, seam)
		   
		  return: resized
			*/
		};

		GimelImage.prototype.findSeam = function() {/*
			// Energy map: first line
			for (var x = 0; x < this.width; x++) {
				energyMap.data[x] = energyFunction(this, x, 0);
			}*/

			/*
			var: mask = new Image(image.width, image.height)

		  var: y = 0
		  for (var: x in 0..image.width-1):
		    mask(x, y) = energy(image, x, y)

		  for (var: y in 1..image.height-1):
		    for (var: x in 0..image.width-1):
		      mask(x, y) = energy(image, x, y) 
		                 + min(mask(x-1, y-1), mask(x, y-1), mask(x+1, y-1))
		  
		  var: seam = new Array(image.height)
		  var: y = image.height-1
		  seam[y] = 0
		  for (var: x in 1..image.width-1):
		    if (mask(x, y) < mask(energy(seam[y], y):
		      seam[y] = x
		  
		  for (var: y in image.height-2..0):
		    x = seam[y+1]
		    seam[y] = x
		    if (mask(x-1, y) < mask(seam[y], y): 
		      seam[y] = x-1
		    if (mask(x+1, y) < mask(seam[y], y): 
		      seam[y] = x+1
		  
		  return: seam
		  */
		};
	});

	return false;
});


gimel.module('imageTemplate').extend(function(moduleContent) {
    gimel.imageTemplate.extend(function(GimelImage, dataType, channels) {
        GimelImage.ImageView = function ImageView(image, x, y, width, height) {
            this.image = image;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.dx = image.dx;
            this.dy = image.dy;
        };

        GimelImage.ImageView.prototype.CHANNELS = GimelImage.prototype.CHANNELS;
        GimelImage.ImageView.prototype.DATA_TYPE = GimelImage.prototype.DATA_TYPE;

        GimelImage.prototype.getImageView = function(x, y, width, height) {
            return new GimelImage.ImageView(this, x, y, width, height);
        };

        GimelImage.ImageView.prototype.getImageView = function(x, y, width, height) {
            return new GimelImage.ImageView(this.image, this.x + x, this.y + y, width, height);
        };
    });
});

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

gimel.module('imageTemplate').extend(function(moduleContent) {
    gimel.imageTemplate.extend(function(GimelImage, dataType, channels) {
    if (channels === 1) {
        /**
         * Compute the sum of two images (each pixel value)
         * @param {GimelImage} image the given image
         * @return {GimelImage} this image
         */
        GimelImage.prototype.add = function(image) {
            var thisData = this.data;
            var srcData = image.data;

            for (var t = 0, tt = image.length; t < tt; ++t) {
                thisData[t] += srcData[t];
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

            for (var t = 0, tt = image.length; t < tt; ++t) {
                thisData[t] -= srcData[t];
            }
            return this;
        };

        /**
         * Compute the multiplication of two images (each pixel value)
         * @param {GimelImage} image the given image
         * @return {GimelImage} this image
         */
        GimelImage.prototype.multiply = function(image) {
            var thisData = this.data;
            var srcData = image.data;

            for (var t = 0, tt = image.length; t < tt; ++t) {
                thisData[t] *= srcData[t];
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

            for (var t = 0, tt = image.length; t < tt; ++t) {
                thisData[t] /= srcData[t];
            }
            return this;
        };

        /**
         * Compute the square of each pixel value
         * @return {GimelImage} this image
         */
        GimelImage.prototype.square = function() {
            var thisData = this.data;

            for (var t = 0, tt = this.length; t < tt; ++t) {
                thisData[t] *= thisData[t];
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

            for (var t = 0, tt = this.length; t < tt; ++t) {
                thisData[t] = sqrt(thisData[t]);
            }
            return this;
        };

        /**
         * Normalize the image values from [srcMin, srcMax] to [destMin, destMax]
         * @return {GimelImage} this image
         */
        GimelImage.prototype.normalize = function(srcMin, srcMax, destMin, destMax) {
            var thisData = this.data;
            var alpha = (destMax - destMin)/(srcMax - srcMin);

            for (var t = 0, tt = this.length; t < tt; ++t) {
                thisData[t] = (thisData[t] - srcMin)*alpha + destMin;
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

            for (var t = 0, tt = image.length; t < tt; ++t) {
                thisData[t] = srcData[t] < thisData[t] ? srcData[t] : thisData[t];
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

            for (var t = 0, tt = image.length; t < tt; ++t) {
                thisData[t] = srcData[t] > thisData[t] ? srcData[t] : thisData[t];
            }
            return this;
        };
    } else if (channels === 4) {
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
             * Compute the multiplication of two images (each pixel value)
             * @param {GimelImage} image the given image
             * @return {GimelImage} this image
             */
            GimelImage.prototype.multiply = function(image) {
                var thisData = this.data;
                var srcData = image.data;

                for (var t = 0, tt = image.length; t < tt; t += 4) {
                    thisData[t] *= srcData[t];
                    thisData[t + 1] *= srcData[t + 1];
                    thisData[t + 2] *= srcData[t + 2];
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

                for (var t = 0, tt = this.length; t < tt; t += 4) {
                    thisData[t] *= thisData[t];
                    thisData[t + 1] *= thisData[t + 1];
                    thisData[t + 2] *= thisData[t + 2];
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
                var alpha = (destMax - destMin)/(srcMax - srcMin);

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
                    thisData[t + 1] = srcData[t + 1] < thisData[t + 1] ? srcData[t + 1] : thisData[t + 1];
                    thisData[t + 2] = srcData[t + 2] < thisData[t + 2] ? srcData[t + 2] : thisData[t + 2];
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
                    thisData[t + 1] = srcData[t + 1] > thisData[t + 1] ? srcData[t + 1] : thisData[t + 1];
                    thisData[t + 2] = srcData[t + 2] > thisData[t + 2] ? srcData[t + 2] : thisData[t + 2];
                }
                return this;
            };
        }
        
    });

    return false;
});

gimel.module('imageTemplate').extend(function(moduleContent) {
    gimel.imageTemplate.extend(function(GimelImage, dataType, channels) {
        if (channels === 4) {
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

            /**
             * Create an single-channel image from an image channel
             * @param {GimelImage} matrix the transformation matrix
             * @return {GimelImage} this image
             */
            GimelImage.prototype.getChannel = function(channelIndex) {
                var image = new GimelImage.T1ChImage(this.width, this.height);
                var thisData = this.data;
                var imageData = image.data;
                for (var t = 0, u = 0, tt = this.length; t < tt; t += 4, ++u) {
                    imageData[u] = thisData[t + channelIndex];
                }
                return this;
            };
            
            /**
             * Set a channel from a mono-channel image
             * @param {GimelImage} matrix the transformation matrix
             * @return {GimelImage} this image
             */
            GimelImage.prototype.setChannel = function(channelIndex, channelImage) {
                var thisData = this.data;
                var channelData = channelImage.data;
                for (var t = 0, u = 0, tt = this.length; t < tt; t += 4, ++u) {
                    thisData[t + channelIndex] = channelData[u];
                }
                return this;
            };
        }
    });
});

gimel.module('imageTemplate').extend(function(moduleContent) {
    gimel.imageTemplate.extend(function(GimelImage, dataType, channels) {
        /**
         * Convolve the image with the given kernel
         * @param {GimelImage} destImage the destination image
         * @param {IntMask} kernel mask (image with one channel)
         * @param {boolean} normalize 
         * @return {GimelImage} convolved image
         * @todo handle the sides
         */
        GimelImage.prototype.convolveTo = function(destImage, kernel, normalize) {
            if (destImage === this) {
                return this.convolve(kernel, normalize);
            }
                
            void (gimel.debug && null /* console.assert(kernel.CHANNELS === 1, 'AbstractImage::convolve: Mask must have just one channel') */);
            void (gimel.debug && null /* console.assert(kernel.width === kernel.height, 'AbstractImage::convolve: Mask must be square') */);

            var destData = destImage.data;
            var srcData = this.data;
            var t = 0, tt = 0, tSrc = 0;

            var uu = kernel.width;
            var vv = kernel.height;
            var uu2 = kernel.width >> 1;
            var vv2 = kernel.height >> 1;

            var dx = this.dx;
            var dy = this.dy;
            var xx = this.width;
            var yy = this.height;
            var xx2 = xx - uu2;
            var yy2 = yy - vv2;

            var srcX = 0, srcY = 0;
            var u = 0, v = 0, x = 0, y = 0;
            var muv = 0, offset = 0;

            for (v = 0; v < vv; ++v) {
                for (u = 0; u < uu; ++u) {
                    muv = kernel.data[v*kernel.width + u];
                    // Top strip
                    for (y = 0; y < vv2; ++y) {
                        for (x = 0; x < xx2; ++x) {
                            srcX = x + u - uu2;
                            srcY = y + v - vv2;
                            tSrc = x*dx + y*dy;
                            t = (srcX < 0 ? 1 - srcX : srcX)*dx + (srcY < 0 ? 1 - srcY : srcY)*dy;
                            destData[tSrc] += srcData[t]*muv;
                            destData[tSrc + 1] += srcData[t + 1]*muv;
                            destData[tSrc + 2] += srcData[t + 2]*muv;
                            
                        }
                    }

                    // Bottom strip
                    for (y = yy2; y < yy; ++y) {
                        for (x = 0; x < xx2; ++x) {
                            srcX = x + u - uu2;
                            srcY = y + v - vv2;
                            tSrc = x*dx + y*dy;
                            t = (srcX < 0 ? 1 - srcX : srcX)*dx + (srcY < yy ? srcY : 2*yy - srcY - 1)*dy;
                            destData[tSrc] += srcData[t]*muv;
                            destData[tSrc + 1] += srcData[t + 1]*muv;
                            destData[tSrc + 2] += srcData[t + 2]*muv;
                        }
                    }
                    
                    // Left strip
                    for (y = vv2; y < yy2; ++y) {
                        for (x = 0; x < uu2; ++x) {
                            srcX = x + u - uu2;
                            srcY = y + v - vv2;
                            tSrc = x*dx + y*dy;
                            t = (srcX < 0 ? 1 - srcX : srcX)*dx + (srcY < 0 ? 1 - srcY : srcY)*dy;
                            destData[tSrc] += srcData[t]*muv;
                            destData[tSrc + 1] += srcData[t + 1]*muv;
                            destData[tSrc + 2] += srcData[t + 2]*muv;
                        }
                    }
                    
                    // Right strip
                    for (y = 0; y < yy2; ++y) {
                        for (x = xx2; x < xx; ++x) {
                            srcX = x + u - uu2;
                            srcY = y + v - vv2;
                            tSrc = x*dx + y*dy;
                            t = (srcX < xx ? srcX : 2*xx - srcX - 1)*dx + (srcY < 0 ? 1 - srcY : srcY)*dy;
                            destData[tSrc] += srcData[t]*muv;
                            destData[tSrc + 1] += srcData[t + 1]*muv;
                            destData[tSrc + 2] += srcData[t + 2]*muv;
                        }
                    }

                    // Bottom right corner
                    for (y = yy2; y < yy; ++y) {
                        for (x = xx2; x < xx; ++x) {
                            srcX = x + u - uu2;
                            srcY = y + v - vv2;
                            tSrc = x*dx + y*dy;
                            t = (srcX < xx ? srcX : 2*xx - srcX - 1)*dx + (srcY < yy ? srcY : 2*yy - srcY - 1)*dy;
                            destData[tSrc] += srcData[t]*muv;
                            destData[tSrc + 1] += srcData[t + 1]*muv;
                            destData[tSrc + 2] += srcData[t + 2]*muv;
                        }
                    }
                }
            }
            
            // Center
            for (v = 0; v < vv; ++v) {
                for (u = 0; u < uu; ++u) {
                    muv = kernel.data[v*kernel.width + u];
                    offset = (u - uu2)*dx + (v - vv2)*dy;
                    for (y = vv2; y < yy2; ++y) {
                        var t0 = y*xx;
                        for (x = uu2; x < xx2; ++x) {
                            t = (t0 + x)*4;
                            destData[t] += srcData[t + offset]*muv;
                            destData[t + 1] += srcData[t + offset + 1]*muv;
                            destData[t + 2] += srcData[t + offset + 2]*muv;
                        }
                    }
                }
            }

            if (normalize) {
                var maskSum = 0;
                for (t = 0, tt = kernel.length; t < tt; ++t) {
                    maskSum += kernel.data[t];
                }

                if (maskSum !== 0) {
                    for (t = 0, tt = this.length; t < tt; t += 4) {
                        destData[t] /= maskSum;
                        destData[t + 1] /= maskSum;
                        destData[t + 2] /= maskSum;
                    }
                }
            }

            return this;
        };

        /**
         * Convolve the image with the given kernel
         * @param {IntMask} kernel mask (image with one channel)
         * @param {boolean} normalize 
         * @return {GimelImage} convolved image
         * @todo handle the sides
         */
        GimelImage.prototype.convolve = function(kernel, normalize) {
            var destImage = this.cloneStructure();
            this.convolveTo(destImage, kernel, normalize);
            return this.set(destImage);
        };

        /**
         * Compute image gradient using convolution
         * @return {GimelImage} Gradient image (new)
         * @todo kernel type according to image type (int or float)
         */
        GimelImage.prototype.gradientTo = function(destImage) {
            var kernel = new gimel.Int8T1ChImage(3, 3, [ 0, -1,  0,
                                                        -1,  0, +1,
                                                         0, +1,  0]);
            return this.convolveTo(destImage, kernel, false);
        };

        /**
         * Compute image gradient using convolution
         * @return {GimelImage} Gradient image (new)
         * @todo kernel type according to image type (int or float)
         */
        GimelImage.prototype.gradient = function() {
            var kernel = new gimel.Int8T1ChImage(3, 3, [ 0, -1,  0,
                                                         -1,  0, +1,
                                                          0, +1,  0]);
             return this.convolve(kernel, false);
        };

        /**
         * Compute image Sobel filter
         * @return {GimelImage} Gradient image (new)
         * @todo kernel type according to image type (int or float)
         */
        GimelImage.prototype.sobel = function() {
            var dxKernel = new this.T_1CH_IMAGE(3, 3, [-1, 0, 1,
                                                       -2, 0, 2,
                                                       -1, 0, 1]);
            var dyKernel = new this.T_1CH_IMAGE(3, 3, [-1, -2, -1,
                                                        0,  0,  0,
                                                        1,  2,  1]);
            var dxImage = this.cloneStructure();
            var dyImage = this.cloneStructure();
            this.convolveTo(dxImage, dxKernel, false);
            this.convolveTo(dyImage, dyKernel, false);
            dxImage.square();
            dyImage.square();
            this.set(dxImage);
            this.add(dyImage);
            return this.sqrt();
        };

        /**
         * Convolve image with gaussian kernel (blur)
         * Gaussian function: e^(-pi((x/radius)^2+(y/radius)^2)) 
         $ =approx (1 - (3(x/radius)^2 - 2(x/radius)^3)) * (1 - (3(y/radius)^2 - 2(y/radius)^3))
         * @return {GimelImage} convolved image (new)
         * @todo kernel type according to image type (int or float)
         */
        GimelImage.prototype.gaussian = function(size) {
            void (gimel.debug && null /* console.assert(size & 1,  'AbstractImage::gaussian: Size has to be odd') */);
            void (gimel.debug && null /* console.assert(size >= 3, 'AbstractImage::gaussian: Size has to be at least 3') */);
            var kernel;
            switch (size) {
            case 3: kernel = new gimel.Float32T1ChImage(3, 3, [0.25, 0.50, 0.25,
                                                               0.50, 1.00, 0.50,
                                                               0.25, 0.50, 0.25]);
              break;
            case 5: kernel = new gimel.Float32T1ChImage(5, 5, [0.07, 0.19, 0.26, 0.19, 0.07,
                                                               0.19, 0.55, 0.74, 0.55, 0.19,
                                                               0.26, 0.74, 1.00, 0.74, 0.26,
                                                               0.19, 0.55, 0.74, 0.55, 0.19,
                                                               0.07, 0.19, 0.26, 0.19, 0.07]);
              break;
            case 7: kernel = new gimel.Float32T1ChImage(7, 7, [0.02, 0.08, 0.13, 0.16, 0.13, 0.08, 0.02,
                                                               0.08, 0.25, 0.42, 0.50, 0.42, 0.25, 0.08,
                                                               0.13, 0.42, 0.71, 0.84, 0.71, 0.42, 0.13,
                                                               0.16, 0.50, 0.84, 1.00, 0.84, 0.50, 0.16,
                                                               0.13, 0.42, 0.71, 0.84, 0.71, 0.42, 0.13,
                                                               0.08, 0.25, 0.42, 0.50, 0.42, 0.25, 0.08,
                                                               0.02, 0.08, 0.13, 0.16, 0.13, 0.08, 0.02]);
              break;
            default: 
              var size2inf = (size - 1) >> 1;
              var size2sup = (size + 1) >> 1;
              var data = [];
              for (var i = 1, ii = size2sup; i < ii; i++) {
                var iValue = (1.00 - (i*i*(3.00*size2sup - 2.00*i))/(size2sup*size2sup*size2sup));//Math.exp(-Math.PI*i*i/((size2+1)*size2+1))
                for (var j = 0, jj = size2sup; j < jj; j++) {
                  var value = iValue*(1.00 - (j*j*(3.00*size2sup - 2.00*j))/(size2sup*size2sup*size2sup));
                  data[size*(size2inf + j) + size2inf + i] = value;
                  data[size*(size2inf - j) + size2inf - i] = value;
                  data[size*(size2inf + i) + size2inf - j] = value;
                  data[size*(size2inf - i) + size2inf + j] = value;
                }
              }
              data[(size+1)*size2inf] = 1.00;
              kernel = new gimel.Float32T1ChImage(size, size, data);
            }
            return this.convolve(kernel, true);
        };
    });

    return false;
});


gimel.module('imageTemplate').extend(function(moduleContent) {
    gimel.imageTemplate.extend(function(GimelImage, dataType, channels) {

        GimelImage.prototype.haar = function(image) {
            // TODO
        };

        GimelImage.prototype.fft = function(image) {
            // TODO
        };
    });

    return false;
});

gimel.module('imageTemplate').extend(function(moduleContent) {
    gimel.imageTemplate.extend(function(GimelImage, dataType, channels) {
        if (channels === 1) {
            if (dataType === 'Float32T' || dataType === 'Float64T') {
                /**
                 * Returns the sum of all pixel values
                 * (Kahan algorithm since we work on floating point data)
                 * @return {number[]} the average value
                 */
                GimelImage.prototype.sum = function() {
                    var data = this.data;
                    var sum = 0;
                    var delta = 0;
                    var tmp = 0;
                    var compensedValue = 0;
                    for (var i = 0, ii = this.length; i < ii; ++i) {
                        compensedValue = data[i] - delta;
                        tmp = sum + compensedValue;
                        delta = tmp - sum;
                        delta -= compensedValue;
                        sum = tmp[i];
                    }
                    return sum;
                };
            } else {
                /**
                 * Returns the sum of all pixel values
                 * @return {number[]} the average value
                 */
                GimelImage.prototype.sum = function() {
                    var data = this.data;
                    var sum = 0;
                    for (var i = 0, ii = this.length; i < ii; ++i) {
                        sum += data[i];
                    }
                    return sum;
                };
            }

            /**
             * Returns the Average pixel value
             * @return {number[]} the average value
             */
            GimelImage.prototype.mean = function() {
                return this.sum()/this.length;
            };

            /**
             * Returns the Median pixel value
             * @return {number[]} the average value
             */
            GimelImage.prototype.median = function() {
                // TODO
            };

            /**
             * Returns the Variance
             * @return {number[]} the average value
             */
            GimelImage.prototype.variance = function() {
                var data = this.data;
                var variance = 0;
                var delta = 0;
                var tmp = 0;
                var compensedValue = 0;
                var mean = this.mean();
                for (var i = 0, ii = this.length; i < ii; ++i) {
                    tmp = data[i] - mean;
                    tmp *= tmp;
                    compensedValue = tmp - delta;
                    tmp = variance + compensedValue;
                    delta = tmp - variance;
                    delta -= compensedValue;
                    variance = tmp;
                }
                return variance/this.length;
            };

            /**
             * Returns the Mean Squared Error
             * @return {number[]} the average value
             */
            GimelImage.prototype.meanSquaredError = function() {
                // TODO
            };

        } else if (channels === 4) {
            if (dataType === 'Float32T' || dataType === 'Float64T') {
                /**
                 * Returns the sum of all pixel values
                 * (Kahan algorithm since we work on floating point data)
                 * @return {number[]} the average value
                 */
                GimelImage.prototype.sum = function() {
                    var data = this.data;
                    var sum = new window.Float64Array(4);
                    var delta = new window.Float64Array(4);
                    var tmp = new window.Float64Array(4);
                    var compensedValue = new window.Float64Array(4);
                    for (var i = 0, ii = this.length; i < ii; i += 4) {
                        compensedValue[0] = data[i] - delta[0];
                        tmp[0] = sum[0] + compensedValue[0];
                        delta[0] = tmp[0] - sum[0];
                        delta[0] -= compensedValue[0];
                        sum[0] = tmp[0];

                        compensedValue[1] = data[i + 1] - delta[1];
                        tmp[1] = sum[1] + compensedValue[1];
                        delta[1] = tmp[1] - sum[1];
                        delta[1] -= compensedValue[1];
                        sum[1] = tmp[1];

                        compensedValue[2] = data[i + 2] - delta[2];
                        tmp[2] = sum[2] + compensedValue[2];
                        delta[2] = tmp[2] - sum[2];
                        delta[2] -= compensedValue[2];
                        sum[2] = tmp[2];
                    }
                    return sum;
                };
            } else {
                /**
                 * Returns the sum of all pixel values
                 * @return {number[]} the average value
                 */
                GimelImage.prototype.sum = function() {
                    var data = this.data;
                    var sum;

                    sum = [0, 0, 0];
                    for (var i = 0, ii = this.length; i < ii; i += 4) {
                        sum[0] += data[i];
                        sum[1] += data[i + 1];
                        sum[2] += data[i + 2];
                    }
                    return sum;
                };
            }


            /**
             * Returns the Average pixel value
             * @return {number[]} the average value
             */
            GimelImage.prototype.mean = function() {
                var sum = this.sum();
                return [sum[0]/this.length, sum[1]/this.length, sum[2]/this.length];
            };

            /**
             * Returns the Median pixel value
             * @return {number[]} the average value
             */
            GimelImage.prototype.median = function() {
                // TODO
            };

            /**
             * Returns the Variance (Kahan compensed sum algorithm) 
             * @return {number[]} the average value
             */
            GimelImage.prototype.variance = function() {
                var data = this.data;
                var variance = new window.Float64Array(4);
                var delta = new window.Float64Array(4);
                var tmp = new window.Float64Array(4);
                var compensedValue = new window.Float64Array(4);
                var mean = this.mean();
                for (var i = 0, ii = this.length; i < ii; i += 4) {
                    tmp[0] = data[i] - mean[0];
                    tmp[0] *= tmp[0];
                    compensedValue[0] = tmp[0] - delta[0];
                    tmp[0] = variance[0] + compensedValue[0];
                    delta[0] = tmp[0] - variance[0];
                    delta[0] -= compensedValue[0];
                    variance[0] = tmp[0];

                    tmp[1] = data[i + 1] - mean[1];
                    tmp[1] *= tmp[1];
                    compensedValue[1] = tmp[1] - delta[1];
                    tmp[1] = variance[1] + compensedValue[1];
                    delta[1] = tmp[1] - variance[1];
                    delta[1] -= compensedValue[1];
                    variance[1] = tmp[1];

                    tmp[2] = data[i + 2] - mean[2];
                    tmp[2] *= tmp[2];
                    compensedValue[2] = tmp[2] - delta[2];
                    tmp[2] = variance[2] + compensedValue[2];
                    delta[2] = tmp[2] - variance[2];
                    delta[2] -= compensedValue[2];
                    variance[2] = tmp[2];
                }
                return [variance[0]/this.length, variance[1]/this.length, variance[2]/this.length];
            };

            /**
             * Returns the Mean Squared Error
             * @return {number[]} the average value
             */
            GimelImage.prototype.meanSquaredError = function() {
                
                // TODO
            };
        }
    });
});

gimel.module('imageTemplate').extend(function(moduleContent) {
    moduleContent.extend(function(GimelImage, dataType, channels) {
        if (channels === 4) {
            /**
             * The mono-channel version of this GimelImage class (same data type)
             */
            GimelImage.prototype.T_1CH_IMAGE = gimel[dataType + '1ChImage'];
        } else if (channels === 1) {
            /**
             * The 4-channel version of this GimelImage class (same data type)
             */
            GimelImage.prototype.T_4CH_IMAGE = gimel[dataType + '4ChImage'];
        }

        /**
         * Make an exact copy of an image
         * @return {GimelImage} this the new image
         */
        GimelImage.prototype.clone = function() {
            return new GimelImage(this.width, this.height, this.data);
        };

        /**
         * Gives a new image with the same structure (width, height, channels)
         * @return {GimelImage} this the new image
         */
        GimelImage.prototype.cloneStructure = function() {
            return new GimelImage(this.width, this.height);
        };

        /**
         * Copy image data from a (different) typed image
         * @param {GimelImage} image the given image
         * @return {GimelImage} this image
         */
        GimelImage.prototype.from = function(image) {
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

        if (channels === 1) {
            /**
             * Fill in a channel with a value
             * @param {number} value the value to set to pixels
             * @return {GimelImage} this image
             */
            GimelImage.prototype.fill = function(value) {
                var dataDest = this.data;
                for (var t = 0, tt = this.length; t < tt; ++t) {
                    dataDest[t] = value;
                }
                return this;
            };
        } else if (channels === 4) {
            /**
             * Fill in an image with channel values
             * @param {number} ch0 the first channel value
             * @param {number} ch1 the second channel value
             * @param {number} ch2 the third channel value
             * @param {number} ch3 the fourth channel value
             * @return {GimelImage} this image
             */
            GimelImage.prototype.fill = function(ch0, ch1, ch2, ch3) {
                var dataDest = this.data;
                for (var t = 0, tt = this.length; t < tt; t += 4) {
                    dataDest[t] = ch0;
                    dataDest[t + 1] = ch1;
                    dataDest[t + 2] = ch2;
                    dataDest[t + 3] = ch3;
                }
                return this;
            };

            /**
             * Fill in a channel with a value
             * @param {integer} channel the channel index
             * @param {number} value the value to set to channel
             * @return {GimelImage} this image
             */
            GimelImage.prototype.fillChannel = function(channel, value) {
                var dataDest = this.data;
                for (var t = 0, tt = this.length; t < tt; t += 4) {
                    dataDest[t + channel] = value;
                }
                return this;
            };

            /**
             * Paste an image on another one
             * @param {GimelImage} image the image to paste
             * @param {integer} x the x-position of the pasted image
             * @param {integer} y the y-position of the pasted image
             * @return {GimelImage} this image
             */
            GimelImage.prototype.paste = function(image, x, y) {
                var destWidth = this.width, srcWidth = image.width,
                dataSrc = image.data, dataDest = this.data;
                var channels = this.CHANNELS;
                for (var ySrc = 0, yy = image.height; y < yy; ++y) {
                    var tmpDest = (y + ySrc)*destWidth,
                        tmpSrc = ySrc*srcWidth;
                    for (var xSrc = 0, xx = image.width; x < xx; ++x) {
                        dataDest[(tmpDest + (x + xSrc))*channels] = dataSrc[(tmpSrc + xSrc)*channels];
                    }
                }

                return this;
            };

            /**
             * Paste an image on another one with a mask
             * @param {GimelImage} image the image to paste
             * @param {integer} x the x-position of the pasted image
             * @param {integer} y the y-position of the pasted image
             * @param {GimelImage} mask a 1-channel-image corresponding to the mask
             * @return {GimelImage} this image
             */
            GimelImage.prototype.pasteWithMask = function(image, x, y, mask) {
                var destWidth = this.width, srcWidth = image.width,
                dataSrc = image.data, dataDest = this.data;
                var channels = this.CHANNELS;
                for (var ySrc = 0, yy = image.height; y < yy; ++y) {
                    var tmpDest = (y + ySrc)*destWidth,
                        tmpSrc = ySrc*srcWidth;
                    for (var xSrc = 0, xx = image.width; x < xx; ++x) {
                        tmpSrc = (tmpSrc + xSrc)*channels;
                        dataDest[(tmpDest + (x + xSrc))*channels] = dataSrc[tmpSrc]*mask[tmpSrc];
                    }
                }

                return this;
            };
        }

    });
});



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