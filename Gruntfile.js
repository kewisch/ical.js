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
        'helpers.js', 'design.js', 'stringify.js', 'parse.js', 'component.js',
        'property.js', 'utc_offset.js', 'binary.js', 'period.js', 'duration.js',
        'timezone.js', 'timezone_service.js', 'time.js', 'vcard_time.js',
        'recur.js', 'recur_iterator.js', 'recur_expansion.js', 'event.js',
        'component_parser.js'
      ],
      test: {
        head: ['test/helper.js'],
        unit: ['test/*_test.js'],
        acceptance: ['test/acceptance/*_test.js'],
        performance: ['test/performance/*_test.js']
      },
      validator: {
        dev: 'https://rawgit.com/mozilla-comm/ical.js/master/build/ical.js',
        prod: 'https://cdn.rawgit.com/mozilla-comm/ical.js/<%= travis.commit %>/build/ical.js',
        dest: 'validator.html'
      }
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
          'build/ical.js',
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
      }
    },
    release: {
      options: {
        tagName: 'v<%=version%>',
        tagMessage: 'v<%=version%>',
        additionalFiles: ['bower.json'],
        github: {
          repo: 'mozilla-comm/ical.js',
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
          name: 'Travis CI',
          email: 'builds@travis-ci.org'
        },
        repo: 'git@github.com:mozilla-comm/ical.js.git',
        message: 'Update API documentation and validator for <%= travis.commit %>'
      },
      src: ['<%= libinfo.doc %>/**', '<%= libinfo.validator.dest %>']
    },

    umd: {
      dist: {
        options: {
          src: 'build/ical.js',
          //dest: 'build/ical.js',
          // optional, a template from templates subdir
          // can be specified by name (e.g. 'umd'); if missing, the templates/umd.hbs
          // file will be used from [libumd](https://github.com/bebraw/libumd)
          //template: 'path/to/template.hbs',
          objectToExport: 'ICAL',
          amdModuleId: 'ICAL',
          globalAlias: 'ICAL'
        }
      }
    }
  });

  grunt.config.set('libinfo.absfiles', grunt.config.get('libinfo.files').map(function(f) {
    return path.join(grunt.config.get('libinfo.cwd'), f);
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
  grunt.loadNpmTasks('grunt-umd');
  grunt.loadNpmTasks('gruntify-eslint');

  loadOptionalTask('grunt-node-inspector');

  grunt.loadTasks('tasks');

  grunt.registerTask('default', ['package']);
  grunt.registerTask('package', ['concat:dist', 'umd:dist', 'uglify']);
  grunt.registerTask('coverage', 'mocha_istanbul');
  grunt.registerTask('linters', ['eslint', 'check-browser-build']);
  grunt.registerTask('test-browser', ['karma:unit', 'karma:acceptance']);
  grunt.registerTask('test', ['test-browser', 'test-node']);

  grunt.registerTask('ghpages-ci', ['jsdoc', 'concat:validator', 'run-on-master-leader:run-with-env:GITHUB_SSH_KEY:gh-pages']);
  grunt.registerTask('unit-ci', ['test-node:unit', 'test-node:acceptance', 'run-on-master-leader:karma:ci']);
  grunt.registerTask('coverage-ci', ['coverage', 'coveralls']);
  grunt.registerTask('test-ci', ['check-browser-build', 'linters', 'unit-ci', 'coverage-ci', 'ghpages-ci']);

  // Additional tasks:
  //   - tests.js: check-browser-build, performance-update, test-node
  //   - timezones.js: timezones
};
