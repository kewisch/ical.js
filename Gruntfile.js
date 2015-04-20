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
    files:[
      'helpers.js', 'design.js', 'stringify.js', 'parse.js', 'component.js',
      'property.js', 'utc_offset.js', 'binary.js', 'period.js', 'duration.js',
      'timezone.js', 'timezone_service.js', 'time.js', 'recur.js',
      'recur_iterator.js', 'recur_expansion.js', 'event.js',
      'component_parser.js'
    ]
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

    mochacli: {
      options: {
        ui: 'tdd',
        'debug-brk': grunt.option('debug'),
        inspector: grunt.option('inspector'),
        reporter: reporter
      },
      performance: {
        src: ['test/helper.js', 'test/performance/*_test.js']
      },
      acceptance: {
        src: ['test/helper.js', 'test/acceptance/*_test.js']
      },
      unit: {
        src: ['test/helper.js', 'test/*_test.js']
      }
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

  grunt.registerTask('test-server', 'Start browser test server', function() {
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

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-mocha-cli');

  grunt.registerTask('default', 'package');
  grunt.registerTask('package', ['concat']);
  grunt.registerTask('test', ['test-browser', 'test-node']);
  grunt.registerTask('test-node', ['mochacli']);
  grunt.registerTask('dev', ['package', 'test-agent-config']);
};
