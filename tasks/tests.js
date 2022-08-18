'use strict';

module.exports = function(grunt) {
  grunt.registerTask('performance-update', function(version) {
    function copyMaster(callback) {
      grunt.util.spawn({
        cmd: 'git',
        args: ['show', 'main:build/ical.js']
      }, function(error, result, code) {
        grunt.file.write(filepath, header + result.stdout + footer);
        callback();
      });
    }

    var filepath = 'build/benchmark/ical_' + version + '.js';
    var header = "var ICAL_" + version + " = (function() { var ICAL = {};\n" +
                 "if (typeof global !== 'undefined') global.ICAL_" + version + " = ICAL;\n";
    var footer = "\nreturn ICAL; }());";

    if (!version) {
      grunt.fail.fatal('Need to specify build version name or "upstream" as parameter');
    } else if (version == "upstream") {
      var done = this.async();
      grunt.util.spawn({
        cmd: 'git',
        args: ['diff', '--shortstat'],
      }, function(error, result, code) {
        if (result.stdout.length) {
          grunt.log.ok('There are git changes, also comparing against main branch');
          copyMaster(done);
        } else {
          grunt.util.spawn({
            cmd: 'git',
            args: ['symbolic-ref', 'HEAD']
          }, function(error, result, code) {
            var branch = result.stdout.replace('refs/heads/', '');
            if (branch == 'main') {
              grunt.log.ok('No git changes, not comparing against main branch');
              grunt.file.delete(filepath);
              done();
            } else {
              grunt.log.ok('Not on main, also comparing against main branch');
              copyMaster(done);
            }
          });
        }
      });
    } else {
      grunt.file.copy('build/ical.js', filepath, {
        process: function(contents) {
          return header + contents + footer;
        }
      });
      grunt.log.ok('Successfully created ' + filepath);
    }
  });

  grunt.registerTask('test-node', function(arg) {
    if (!arg || arg == 'performance') {
      grunt.task.run('performance-update:upstream');
    }

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
    } else if (arg) {
      grunt.task.run('mochacli:' + arg);
    } else {
      grunt.task.run('mochacli:performance');
      grunt.task.run('mochacli:acceptance');
      grunt.task.run('mochacli:unit');
    }
  });
};
