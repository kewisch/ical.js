'use strict';

var path = require('path');

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    libinfo: {
      cwd: 'lib/ical',
      files: [
        'helpers.js', 'design.js', 'stringify.js', 'parse.js', 'component.js',
        'property.js', 'utc_offset.js', 'binary.js', 'period.js', 'duration.js',
        'timezone.js', 'timezone_service.js', 'time.js', 'recur.js',
        'recur_iterator.js', 'recur_expansion.js', 'event.js',
        'component_parser.js'
      ],
      test: {
        head: ['test/helper.js'],
        unit: ['test/*_test.js'],
        acceptance: ['test/acceptance/*_test.js'],
        performance: ['test/performance/*_test.js']
      }
    },

    concat: {
      options: {
        separator: '',
        process: function(src, filepath) {
          return src.replace('"use strict";', '');
        }
      },

      dist: {
        src: ['<%= libinfo.absfiles %>'],
        dest: 'build/ical.js'
      }
    },

    mocha_istanbul: {
      coverage: {
        src: ['<%= libinfo.test.head %>', '<%= libinfo.test.unit %>', '<%= libinfo.test.acceptance %>'],
        options: {
          root: './lib/ical/',
          mochaOptions: ['--ui', 'tdd']
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
      test: {}
    },

    concurrent: {
      all: ['mochacli', 'node-inspector'],
      unit: ['mochacli:unit', 'node-inspector'],
      acceptance: ['mochacli:acceptance', 'node-inspector'],
      single: ['mochacli:single', 'node-inspector'],
    },

    mochacli: {
      options: {
        ui: 'tdd',
        'debug-brk': grunt.option('debug'),
        reporter: grunt.option('reporter') || 'spec'
      },
      performance: {
        src: ['<%= libinfo.test.head %>', '<%= libinfo.test.performance %>']
      },
      acceptance: {
        src: ['<%= libinfo.test.head %>', '<%= libinfo.test.acceptance %>']
      },
      unit: {
        src: ['<%= libinfo.test.head %>', '<%= libinfo.test.unit %>']
      },
      single: {
        src: ['<%= libinfo.test.head %>', grunt.option('test')]
      }
    },

    jshint: {
      options: {
        jshintrc: true
      },
      lib: {
        src: ['<%= libinfo.absfiles %>']
      }
    },
    gjslint: {
      options: {
        flags: ['--flagfile .gjslintrc'],
      },
      lib: {
        src: ['<%= libinfo.absfiles %>']
      }
    }
  });

  grunt.config.set('libinfo.absfiles', grunt.config.get('libinfo.files').map(function(f) {
    return path.join(grunt.config.get('libinfo.cwd'), f);
  }));

  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-coveralls');
  grunt.loadNpmTasks('grunt-gjslint');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-node-inspector');

  grunt.loadTasks('tasks');

  grunt.registerTask('default', ['package']);
  grunt.registerTask('package', ['concat']);
  grunt.registerTask('coverage', 'mocha_istanbul');
  grunt.registerTask('linters', ['jshint', 'gjslint']);
  grunt.registerTask('test-server', ['test-agent-config', 'run-test-server']);
  grunt.registerTask('test', ['test-browser', 'test-node']);
  grunt.registerTask('test-ci', ['linters', 'test-node:unit', 'test-node:acceptance', 'coverage', 'coveralls']);
  // Additional tasks:
  //   - tests.js: performance-update, test-node, test-browser,
  //   - timezones.js: timezones

};
