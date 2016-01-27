module.exports = function(grunt) {
    //config
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                mangle: true,
                beautify: false
            },
            build: {
                src: ['vendor/jquery/dist/jquery.js','vendor/jquery-scrollto/jquery-scrollto.js','assets/javascripts/index.js'],
                dest: 'public/index.min.js'
            }
        },
        jshint: {
            options: {
                curly: false,
                browser: true,
                browserify: true,
                globals: {
                    jQuery: true
                },
                force: true
            },
            all: ['Gruntfile.js', 'assets/javascripts/*.js']
        },
        compass: {
    		dist: {
    			options: {
                    sassDir: 'assets/stylesheets',
                    specify: ['assets/stylesheets/immediate.scss', 'assets/stylesheets/style.scss'],
                    cssDir: 'public',
                    outputStyle: 'compressed',
                    cache: false
                }
      		}
      	},
        copy: {
          main: {
            cwd: 'assets/fonts/',
            src: '**',
            dest: 'public/fonts/',
            expand: true,
            flatten: true,
            filter: 'isFile'
          },
        },
        imagemin: {
            dynamic: {
                options: {
                    optimizationLevel: 7,        // Affects PNGs
                    progressive: true,           // Affects JPGs
                    interlaced: true,            // Affects GIFs
                    svgoPlugins: [{              // Affects SVGs
                        removeViewBox: false
                    }],
                    use: [
                        require('imagemin-pngquant')({
                            quality: "80",
                            speed: 1
                        }),
                        require('imagemin-mozjpeg')({
                            quality: 70,
                            dcScanOpt: 2,
                            arithmetic: true,
                            smooth: 50
                        }),
                        require('imagemin-gifsicle')()
                    ]
                },
                files: [{
                    expand: true,                  // Enable dynamic expansion
                    cwd: 'assets/',                   // Src matches are relative to this path
                    src: ['images/*.{png,jpg,jpeg,gif}'],   // Actual patterns to match
                    dest: 'public/'                  // Destination path prefix
                }]
            }
        },
        watch: {
    			css: {
    				files: 'assets/stylesheets/**/*.scss',
    				tasks: ['compass']
    			},
                js: {
    				files: 'assets/javascripts/**/*.js',
    				tasks: ['jshint', 'uglify']
    			},
                fonts: {
                    files: 'assets/fonts/**/*',
    				tasks: ['fontmin']
                },
                images: {
                    files: 'assets/images/*',
    				tasks: ['imagemin']
                }
    		},
        // exec: {
        //     browserifying: {
        //         cmd: 'echo heyhey'
        //     }
        // }
    });

    // Load tasks
    grunt.loadNpmTasks('grunt-contrib-uglify');
    // grunt.loadNpmTasks('grunt-scss-lint');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
	  grunt.loadNpmTasks('grunt-contrib-watch');
    //grunt.loadNpmTasks('grunt-exec');

    // Set default tasks
    grunt.registerTask('default', ['jshint', 'uglify', 'compass', 'copy', 'imagemin', 'watch']);
};
