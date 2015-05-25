'use strict';

var spawn = require('child_process').spawn;

module.exports = function(grunt) {

  grunt.registerTask('push-api-doc', function() {
    var branch = grunt.config.get('travis.branch');
    var secure = grunt.config.get('travis.secure');
    var pr = grunt.config.get('travis.pullrequest');
    var leader = grunt.config.get('travis.leader');
    var sshkey = process.env.GITHUB_SSH_KEY;

    if (branch != 'master' || pr || !secure || !leader) {
      grunt.log.ok('Skipping doc upload, not leading master branch build');
      return;
    }

    if (!sshkey) {
      grunt.fail.warn('Skipping doc upload, no credentials available');
      return;
    }

    grunt.task.run('gh-pages');
  });
};
