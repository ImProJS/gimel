module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                banner: '\'use strict\';\n\n',
                separator: '\n\n'
            },
            dist: {
                src: ['src/*.js', 'src/**/*.js'],
                dest: '<%= pkg.name %>.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    '<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
                }
            }
        },
        jshint: {
            files: ['Gruntfile.js', 'src/*.js', 'src/**/*.js', 'test/**/*.js'],
            options: {
                undef: true,
                unused: 'vars',
                latedef: true,
                eqeqeq: true,
                quotmark: 'single',
                nonbsp: true,
                predef: ['gimel'],
                globals: {
                    window: true,
                    console: true,
                    module: true,
                    document: true,
                    gimel: true,
                }
            }
        },
        removeLoggingCalls: {
            files: ['<%= pkg.name %>.js'],
            options: {
                methods: ['assert', 'log', 'info', 'warn'], 
                strategy: function(statement) {
			return 'null /* ' + statement + ' */';
		    }
            }
        },
        jsdoc: {
            dist : {
                src: ['src/*.js', 'src/**/*.js'], 
                dest: 'doc',
                lenient: true
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-remove-logging-calls');
    grunt.loadNpmTasks('grunt-jsdoc');

    grunt.registerTask('build', ['jshint', 'concat', 'removeLoggingCalls', 'uglify', 'jsdoc']);
};