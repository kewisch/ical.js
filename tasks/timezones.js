'use strict';

var util = require('util');
var path = require('path');
var which = require('which');
var child_process = require('child_process');

var TZDB_DB_REMOTE = 'https://data.iana.org/time-zones/releases/tzdata%s.tar.gz';
var TZDB_VERSION_REMOTE = 'https://www.iana.org/time-zones';
var VZIC_REMOTE = "https://github.com/libical/vzic/archive/refs/heads/master.tar.gz";
var VZIC_EXEC = process.env.VZIC || which.sync('vzic', { nothrow: true });
var VZIC_DIR = process.env.VZIC_DIR || path.join(__dirname, '..', 'tools', 'vzic')
var TZDB_DIR = process.env.TZDB_DIR || path.join(__dirname, '..', 'tools', 'tzdb');
var TZDB_DIR_OUT = process.env.TZDB_DIR_OUT || path.join(TZDB_DIR, 'vzic-out');
var ICALJS_ZONES =  process.env.VZIC_DIR ||  path.join(__dirname, '..', 'build', 'timezones.js');

module.exports = function(grunt) {
  function processZone(zoneFile) {
    // Smaller
    let contents = grunt.file.read(zoneFile, { encoding: "utf-8" });
    let lines = contents.split("\r\n");
    let vtimezone = lines.slice(lines.indexOf("BEGIN:VTIMEZONE") + 1, lines.indexOf("END:VTIMEZONE")).join("\r\n");
    return `  register(${JSON.stringify(vtimezone)});`;
  }

  function generateZonesFile(tzdbDir, tzdbVersion) {
    let lines = [
      `(function() {`,
      `  function register(tzdata) { ICAL.TimezoneService.register(ICAL.Component.fromString("BEGIN:VTIMEZONE\\r\\n" + tzdata + "END:VTIMEZONE")) };`,
      `  ICAL.TimezoneService.IANA_TZDB_VERSION = "${tzdbVersion}";`
    ];

    let contents = grunt.file.read(path.join(tzdbDir, "zones.tab"), { encoding: "utf-8" });
    for (let line of contents.split("\n")) {
      let parts = line.split(" ");
      if (parts.length == 3 && parts[2].length) {
        lines.push(processZone(path.join(tzdbDir, parts[2] + ".ics")));
      } else if (parts.length == 1 && parts[0].length) {
        lines.push(processZone(path.join(tzdbDir, parts[0] + ".ics")));
      }
    }

    lines.push("})();");

    return lines.join("\n");
  }

  grunt.registerTask('tzdata', 'Get Olson timezone data', function() {
    var tzdbversion = grunt.option('tzdb');
    if (!tzdbversion) {
      let page = child_process.execSync(`wget ${TZDB_VERSION_REMOTE} -O -`, { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf-8' });
      let versionRE = page.match(/version">([0-9a-z]*)<\/span>/);
      if (!versionRE) {
        grunt.fail.error('Could not detect latest timezone database version');
        return;
      }
      tzdbversion = versionRE[1];
      grunt.log.ok('Latest tzdb version is ' + tzdbversion);
    }

    if (grunt.file.isDir(TZDB_DIR)) {
      grunt.log.ok('Using tzdb database from ' + TZDB_DIR);
      let existingVersion = grunt.file.read(path.join(TZDB_DIR, "version"), { encoding: "utf-8" }).trim();
      if (existingVersion != tzdbversion) {
        grunt.log.ok(`Existing version ${existingVersion} is outdated, upgrading to ${tzdbversion}`);
        grunt.file.delete(TZDB_DIR);
      }
    }

    if (!grunt.file.isDir(TZDB_DIR)) {
      let url = util.format(TZDB_DB_REMOTE, tzdbversion);
      grunt.log.ok('Downloading ' + url);
      grunt.file.mkdir(TZDB_DIR);
      child_process.execSync(`wget ${url} -O - | tar xz`, { cwd: TZDB_DIR });
    }

    if (!VZIC_EXEC) {
      if (grunt.file.isFile(path.join(VZIC_DIR, "vzic"))) {
        grunt.log.ok('Using existing vzic installation from ' + VZIC_DIR);
      } else {
        grunt.log.ok('Retrieving vzic from github');
        grunt.file.mkdir(VZIC_DIR);
        child_process.execSync(`wget ${VZIC_REMOTE} -O - | tar xz --strip-components=1`, { cwd: VZIC_DIR });

        grunt.log.ok('Building vzic tool');
        child_process.execSync(
          `make TZID_PREFIX="" OLSON_DIR="${TZDB_DIR}"`,
          { cwd: VZIC_DIR }
        );
      }

      VZIC_EXEC = path.join(VZIC_DIR, "vzic");
    }

    if (grunt.file.isDir(TZDB_DIR_OUT)) {
      grunt.log.ok("Using existing vzic data from " + TZDB_DIR_OUT);
    } else {
      grunt.log.ok('Running vzic');
      child_process.execSync(VZIC_EXEC + ` --olson-dir ${TZDB_DIR} --output-dir ${TZDB_DIR_OUT}`);
    }

    grunt.log.ok("Writing zones file " + ICALJS_ZONES);
    grunt.file.write(ICALJS_ZONES, generateZonesFile(TZDB_DIR_OUT, tzdbversion), { encoding: "utf-8" });
  });
};
