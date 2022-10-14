'use strict';

var path = require('path');

module.exports = function(grunt) {
  function loadOptionalTask(name) {
    var root = path.resolve('node_modules');
    var tasksdir = path.join(root, name, 'tasks');
    if (grunt.file.exists(tasksdir)) {
      grunt.loadNpmTasks(name);
    }
  }

  var pkg = grunt.file.readJSON('package.json');
  grunt.initConfig({
    pkg: pkg,
    libinfo: {
      cwd: 'lib/ical',
      doc: 'api',
      files: [
        'module.js', 'helpers.js', 'design.js', 'stringify.js', 'parse.js', 'component.js',
        'property.js', 'utc_offset.js', 'binary.js', 'period.js', 'duration.js', 'timezone.js',
        'timezone_service.js', 'time.js', 'vcard_time.js', 'recur.js', 'recur_iterator.js',
        'recur_expansion.js', 'event.js', 'component_parser.js'
      ],
      test: {
        head: ['test/helper.mjs'],
        unit: ['test/*_test.js'],
        acceptance: ['test/acceptance/*_test.js'],
        performance: ['test/performance/*_test.js']
      },
      validator: {
        dev: 'https://unpkg.com/ical.js', // main builds don't currently have ical.js committed. See #405
        prod: 'https://unpkg.com/ical.js@<%= pkg.version %>/build/ical.js',
        dest: 'validator.html'
      }
    },
    github: {
      actor: process.env.GITHUB_ACTOR,
      sha: process.env.GITHUB_SHA,
      token: process.env.GITHUB_TOKEN
    },

    concat: {
      options: {
        separator: ''
      },

      dist: {
        options: {
          process: function(src, filepath) {
            return src.replace('"use strict";', '');
          }
        },
        src: ['<%= libinfo.absfiles %>'],
        dest: 'build/ical.js'
      },
      zones: {
        src: ['build/ical.js', 'build/timezones.js'],
        dest: 'build/ical.timezones.js'
      },

      validator: {
        options: {
          process: function(src, filepath) {
            return src.replace(grunt.config('libinfo.validator.dev'), grunt.config('libinfo.validator.prod'));
          }
        },
        src: ['sandbox/validator.html'],
        dest: '<%= libinfo.validator.dest %>'
      }
    },

    mocha_istanbul: {
      coverage: {
        src: ['<%= libinfo.test.unit %>', '<%= libinfo.test.acceptance %>'],
        options: {
          root: './lib/ical/',
          require: ['<%= libinfo.test.head %>'],
          reporter: 'dot',
          ui: 'tdd'
        }
      }
    },

    coveralls: {
      options: {
        force: true
      },
      unit: {
        src: './coverage/lcov.info'
      }
    },

    'node-inspector': {
      test: {
        hidden: ['node_modules']
      }
    },

    concurrent: {
      all: ['mochacli:performance', 'mochacli:acceptance', 'mochacli:unit', 'node-inspector'],
      unit: ['mochacli:unit', 'node-inspector'],
      acceptance: ['mochacli:acceptance', 'node-inspector'],
      single: ['mochacli:single', 'node-inspector']
    },

    eslint: {
      src: ['<%= libinfo.absfiles %>']
    },

    mochacli: {
      options: {
        ui: 'tdd',
        require: ['<%= libinfo.test.head %>'],
        'debug-brk': grunt.option('debug'),
        reporter: grunt.option('reporter') || 'spec'
      },
      performance: {
        src: ['<%= libinfo.test.performance %>']
      },
      acceptance: {
        src: ['<%= libinfo.test.acceptance %>']
      },
      unit: {
        src: ['<%= libinfo.test.unit %>']
      },
      single: {
        src: [grunt.option('test')]
      }
    },

    karma: {
      options: {
        singleRun: true,
        hostname: grunt.option('remote') ? '0.0.0.0' : 'localhost',
        port: 9876,
        colors: true,
        basePath: '',
        logLevel: grunt.option('verbose') ? 'DEBUG' : 'INFO',
        autoWatch: false,
        captureTimeout: 240000,
        browserNoActivityTimeout: 120000,
        frameworks: ['mocha', 'chai'],
        client: {
          mocha: {
            ui: 'tdd'
          }
        },
        files: [
          { pattern: 'samples/**/*.ics', included: false },
          { pattern: 'test/parser/*', included: false },
          '<%= libinfo.relfiles %>',
          '<%= libinfo.test.head %>'
        ]
      },
      ci: {
        exitOnFailure: false,
        customLaunchers: pkg.saucelabs,
        browsers: Object.keys(pkg.saucelabs),
        reporters: ['saucelabs', 'spec'],
        sauceLabs: {
          testName: 'ICAL.js',
          startConnect: true
        },

        files: {
          src: ['<%= libinfo.test.unit %>']
        }
      },
      single: {
        singleRun: !grunt.option('debug'),
        reporters: ['spec'],
        files: {
          src: [grunt.option('test')]
        }
      },
      unit: {
        singleRun: !grunt.option('debug'),
        reporters: ['spec'],
        files: {
          src: ['<%= libinfo.test.unit %>']
        }
      },
      acceptance: {
        singleRun: !grunt.option('debug'),
        reporters: ['spec'],
        files: {
          src: ['<%= libinfo.test.acceptance %>']
        }
      }
    },

    uglify: {
      options: {
        sourceMap: true,
        compress: {},
        mangle: {
          reserved: ['ICAL']
        }
      },
      dist: {
        files: {
          'build/ical.min.js': ['build/ical.js']
        }
      },
      zones: {
        files: {
          'build/ical.timezones.min.js': ['build/ical.timezones.js']
        }
      }
    },
    release: {
      options: {
        tagName: 'v<%=version%>',
        tagMessage: 'v<%=version%>',
        additionalFiles: ['bower.json'],
        github: {
          repo: 'kewisch/ical.js',
          accessTokenVar: 'GITHUB_TOKEN'
        }
      }
    },
    jsdoc: {
      dist: {
        src: ['<%= libinfo.absfiles %>', 'README.md'],
        options: {
          destination: '<%= libinfo.doc %>',
          template: './node_modules/minami/',
          private: false
        }
      }
    },

    'gh-pages': {
      options: {
        clone: 'ghpages-stage',
        only: '<%= libinfo.doc %>',
        user: {
          name: '<%= github.actor %>',
          email: '<%= github.actor %>@users.noreply.github.com'
        },
        repo: 'https://x-access-token:<%= github.token %>@github.com/kewisch/ical.js.git',
        message: 'Update API documentation and validator for <%= github.sha %>'
      },
      src: ['<%= libinfo.doc %>/**', '<%= libinfo.validator.dest %>']
    }
  });

  grunt.config.set('libinfo.absfiles', grunt.config.get('libinfo.files').map(function(f) {
    return path.join(grunt.config.get('libinfo.cwd'), f);
  }));
  grunt.config.set('libinfo.relfiles', grunt.config.get('libinfo.files').map(function(f) {
    return path.join("lib", "ical", f);
  }));

  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-coveralls');
  grunt.loadNpmTasks('grunt-gh-pages');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-release');
  grunt.loadNpmTasks('gruntify-eslint');

  loadOptionalTask('grunt-node-inspector');

  grunt.loadTasks('tasks');

  grunt.registerTask('default', ['package']); // You need to run package-zones on your own
  grunt.registerTask('package', ['concat:dist', 'uglify:dist']);
  grunt.registerTask('package-zones', ['package', 'tzdata', 'concat:zones', 'uglify:zones']);

  grunt.registerTask('coverage', 'mocha_istanbul');
  grunt.registerTask('linters', ['eslint']);
  grunt.registerTask('test-browser', ['karma:unit', 'karma:acceptance']);
  grunt.registerTask('test', ['test-browser', 'test-node']);

  grunt.registerTask('ghpages-prepare', ['jsdoc', 'concat:validator']);
  grunt.registerTask('ghpages-push', ['gh-pages']);
  grunt.registerTask('unit-node-ci', ['test-node:unit', 'test-node:acceptance']);
  grunt.registerTask('unit-browser-ci', ['karma:ci']);
  grunt.registerTask('coverage-ci', ['coverage', 'coveralls']);
  grunt.registerTask('test-ci', ['linters', 'unit-ci', 'coverage-ci', 'ghpages-ci']);

  // Additional tasks:
  //   - tests.js: performance-update, test-node
};
