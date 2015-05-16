/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2015 */

var fs = require('fs');
var spawn = require('child_process').spawn;

var diff = require('difflet')({ indent: true, comments: true });
var Tester = require('./lib/ICALTester');
var ICAL = require('../..');

function setupHandlers(binPath) {
  Tester.addHandler("icaljs", function(rule, dtstart, max, callback) {
    var iter = rule.iterator(dtstart);
    var occ = 0;
    var start = new Date();

    var results = [];
    (function loop() {
      var next, diff;

      if (++occ > max) {
        return callback(results);
      }

      try {
        next = iter.next();
      } catch (e) {
        return callback(e.message || e);
      }

      if (next) {
        results.push(next.toICALString());
      } else {
        return callback(results);
      }

      diff = (new Date() - start) / 1000;
      if (diff > Tester.MAX_EXECUTION_TIME) {
        return callback("Maximum execution time exceeded");
      }

      setImmediate(loop);
    })();
  });

  Tester.addHandler("other", function(rule, dtstart, max, callback) {
    var results = [];
    var ptimer = null;
    var recur = spawn(binPath, [rule.toString(), dtstart.toICALString(), max]);

    recur.stdout.on('data', function(data) {
      Array.prototype.push.apply(results, data.toString().split("\n").slice(0, -1));
    });

    recur.on('close', function(code) {
      if (ptimer) {
        clearTimeout(ptimer);
      }

      if (code === null) {
        callback("Maximum execution time exceeded");
      } else if (code !== 0) {
        callback("Execution error: " + code);
      } else {
        callback(null, results);
      }
    });

    ptimer = setTimeout(function() {
      ptimer = null;
      recur.kill();
    }, Tester.MAX_EXECUTION_TIME);
  });
}

function usage(message) {
  if (message) {
    console.log("Error: " + message);
  }
  console.log("Usage: ICALTester rules.json /path/to/binary");
  process.exit(1);
}

function main() {
  if (process.argv.length < 4) {
    usage();
  }

  var rulesFile = fs.statSync(process.argv[2]) && process.argv[2];
  var binPath = fs.statSync(process.argv[3]) && process.argv[3];
  var ruleData = JSON.parse(fs.readFileSync(rulesFile));

  var dtstart = ICAL.Time.fromString("2014-11-11T08:00:00");
  var max = 10;

  setupHandlers(binPath);

  Tester.run(ruleData, dtstart, max, function(err, results) {
    console.log(diff.compare(results.other, results.icaljs));
  });
}

main();
