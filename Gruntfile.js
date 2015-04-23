'use strict';

var util = require('util');
var fs = require('fs');
var exec = require('sync-exec');
var path = require('path');
var Agent = require('test-agent'),
    AgentServer = Agent.server,
    WebsocketServer = Agent.WebsocketServer,
    StaticServer = require('node-static').Server;

var OLSON_DB_REMOTE = 'http://www.iana.org/time-zones/repository/releases/tzdata%s.tar.gz';
var TZURL_DIR = process.env.TZURL_DIR || path.join(__dirname, 'tools', 'tzurl')
var OLSON_DIR = process.env.OLSON_DIR || path.join(TZURL_DIR, 'olson');

module.exports = function(grunt) {
  var libinfo = {
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
  };
  libinfo.absfiles = libinfo.files.map(function(f) { return path.join(libinfo.cwd, f); });

  var reporter = grunt.option('reporter') || 'spec';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    libinfo: libinfo,

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
        reporter: reporter
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
    }
  });

  grunt.registerTask('test-node', 'internal', function(arg) {
    if (grunt.option('debug')) {
      var done = this.async();
      var open = require('biased-opener');
      open('http://127.0.0.1:8080/debug?port=5858', {
          preferredBrowsers : ['chrome', 'chromium', 'opera']
        }, function(err, okMsg) {
          if (err) {
             // unable to launch one of preferred browsers for some reason
             console.log(err.message);
             console.log('Please open the URL manually in Chrome/Chromium/Opera or similar browser');
          }
          done();
      });
      grunt.task.run('concurrent:' + (arg || "all"));
    } else {
      grunt.task.run('mochacli' + (arg ? ":" + arg : ""));
    }
  });

  grunt.registerTask('test-browser', 'Test browser agent', function() {
    var done = this.async();
    var Client = require('test-agent/lib/node/client');

    var client = new Client({ retry: true });
    var port = grunt.option('port') || 8789;
    client.url = 'ws://localhost:' + port;
    client.use(AgentServer.MochaTestEvents, {
      reporterClass: require('mocha').reporters[reporter]
    });

    client.on('open', function(socket) {
      var file = grunt.option('test');
      var files = file ? [file] : [];
      client.mirrorServerEvents(['set test envs', 'error', 'test data', 'coverage data'], true);
      client.send('queue tests', {files: files});
    });

    client.on('test runner end', function(runner){
      var reporter = runner.getMochaReporter();
      client.send('close');
      done(reporter.failures == 0);
    });

    client.start();
  });

  grunt.registerTask('run-test-server', 'Start browser test server', function() {
    var done = this.async();

    var server = new WebsocketServer();
    var path = process.env.PWD;
    var port = grunt.option('port') || 8789;

    var staticMiddleware = new StaticServer(path, { cache: 0 });
    var httpServer = require('http').createServer(function (request, response) {
      staticMiddleware.serve(request, response);
    });
    httpServer.listen(port);
    grunt.log.ok("HTTP Server running on port: %s, serving: %s", port, path);
    server.attach(httpServer);

    server.expose('test-agent-server.js', function onExpose(){
      server.use(AgentServer.Responder).
             use(AgentServer.Broadcast).
             use(AgentServer.MochaTestEvents).
             use(AgentServer.BlanketCoverEvents).
             use(AgentServer.QueueTests).
             use(AgentServer.StartCoverages).
             use(AgentServer.EventMirror).
             use(AgentServer.Watcher);

      server.use(AgentServer.RunnerGrowl);
    });
    require('open')('http://localhost:' + port + '/test-agent/');
  });

  grunt.registerTask('test-agent-config', 'Create configuration for test-agent', function() {
    var files = grunt.file.expand('test/**/*_test.js');
    var jsonData = {
      tests: files.map(function(f) { return "/" + f; })
    };
    grunt.file.write(path.join('test-agent', 'config.json'),
                     JSON.stringify(jsonData));
  });

  grunt.registerTask('timezones', 'Get Olson timezone data', function() {
    var olsonversion = grunt.option('olsondb');
    if (!olsonversion) {
      olsonversion = (new Date()).getFullYear() + "a";
      grunt.fail.warn('Need to specify --olsondb=<version>, e.g. ' + olsonversion);
      return;
    }

    if (grunt.file.isDir(TZURL_DIR)) {
      grunt.log.ok('Using existing tzurl installation');
    } else {
      grunt.log.ok('Retrieving tzurl from svn');
      exec('svn export -r40 http://tzurl.googlecode.com/svn/trunk/ ' + TZURL_DIR);
    }

    if (grunt.file.isDir(OLSON_DIR)) {
      grunt.log.ok('Using olson database from ' + OLSON_DIR);
    } else {
      var url = util.format(OLSON_DB_REMOTE, olsonversion);
      grunt.log.ok('Downloading ' + url);
      grunt.file.mkdir(OLSON_DIR);
      exec('wget ' + url + ' -O - | tar xz -C ' + OLSON_DIR);
    }

    grunt.log.ok('Building tzurl tool');
    exec('make -C "' + TZURL_DIR + '" OLSON_DIR="' + OLSON_DIR + '"');

    grunt.log.ok('Running vzic');
    exec(path.join(TZURL_DIR, 'vzic'));
  });

  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-coveralls');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-node-inspector');

  grunt.registerTask('default', ['package']);
  grunt.registerTask('package', ['concat']);
  grunt.registerTask('coverage', 'mocha_istanbul');
  grunt.registerTask('test-server', ['test-agent-config', 'run-test-server']);
  grunt.registerTask('test', ['test-browser', 'test-node']);
  grunt.registerTask('test-ci', ['test-node', 'coverage', 'coveralls']);
  grunt.registerTask('dev', ['package', 'test-agent-config']);
};
