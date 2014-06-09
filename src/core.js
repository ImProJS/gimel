var gimel = (function() {
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
})();