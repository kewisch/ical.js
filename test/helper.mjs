import ICAL from "../lib/ical/module.mjs";
import chai from "chai";
import { URL } from 'url';
import fs from "fs";

/* eslint-env browser, node, mocha */

global.ICAL = ICAL;

(function() {

  var isNode = typeof(window) === 'undefined';

  if (!isNode) {
    window.navigator; // eslint-disable-line no-unused-expressions
  }

  // lazy defined navigator causes global leak warnings...

  let testSupport = global.testSupport = {
    isNode: (typeof(window) === 'undefined'),
    isKarma: (typeof(window) !== 'undefined' && typeof window.__karma__ !== 'undefined')
  };

  function loadChai(chai) {
    chai.config.includeStack = true;
    global.assert = chai.assert;
    global.assert.hasProperties = function chai_hasProperties(given, props, msg) {
      msg = (typeof(msg) === 'undefined') ? '' : msg + ': ';

      if (props instanceof Array) {
        props.forEach(function(prop) {
          global.assert.ok(
            (prop in given),
            msg + 'given should have "' + prop + '" property'
          );
        });
      } else {
        for (var key in props) {
          global.assert.deepEqual(
            given[key],
            props[key],
            msg + ' property equality for (' + key + ') '
          );
        }
      }
    };
  }

  // Load chai, and the extra libs we include
  if (testSupport.isNode) {
    loadChai(chai);
  } else if (window.chai) {
    loadChai(window.chai);
  } else {
    require('/node_modules/chai/chai.js', function() {
      loadChai(window.chai);
    });
  }

  /* cross require */
  testSupport.requireICAL = function() {
    let crossGlobal = typeof global == "undefined" ? window : global;

    testSupport.require('/lib/ical/module.mjs', (lib) => {
      crossGlobal.ICAL = lib;
    });
  };

  /**
   * Requires a benchmark build.
   *
   * @param {String} version of the build (see build/benchmark/*)
   * @param {Function} optional callback called on completion
   */
  testSupport.requireBenchmarkBuild = function(version, callback) {
    testSupport.require('/build/benchmark/ical_' + version + '.js', callback);
  };

  testSupport.require = function cross_require(file, callback) {
    if (!(/\.m?js$/.test(file))) {
      file += '.js';
    }

    if (testSupport.isNode) {
      var lib = require(__dirname + '/../' + file);
      if (typeof(callback) !== 'undefined') {
        callback(lib);
      }
    } else {
      window.require(file, callback);
    }
  };

  /**
   * Registers a given timezone from samples with the timezone service.
   *
   * @param {String} zone like "America/Los_Angeles".
   * @param {Function} callback fired when load/register is complete.
   */
  testSupport.registerTimezone = function(zone, callback) {
    if (!this._timezones) {
      this._timezones = Object.create(null);
    }

    var ics = this._timezones[zone];

    function register(ics) {
      var parsed = ICAL.parse(ics);
      var calendar = new ICAL.Component(parsed);
      var vtimezone = calendar.getFirstSubcomponent('vtimezone');

      var zone = new ICAL.Timezone(vtimezone);

      ICAL.TimezoneService.register(vtimezone);
    }

    if (ics) {
      setTimeout(function() {
        callback(null, register(ics));
      }, 0);
    } else {
      var path = 'samples/timezones/' + zone + '.ics';
      testSupport.load(path, function(err, data) {
        if (err) {
          callback(err);
        }
        var zone = register(data);
        this._timezones[zone] = data;

        callback(null, register(data));
      }.bind(this));
    }
  };

  /**
   * Registers a timezones for a given suite of tests. Uses suiteSetup to stage
   * and will use suiteTeardown to purge all timezones for clean tests...
   *
   * Please note that you should only call this once per suite, otherwise the
   * teardown function will reset the service while the parent suite will still
   * need them.
   */
  testSupport.useTimezones = function(zones) {
    let allZones = Array.prototype.slice.call(arguments);

    suiteTeardown(function() {
      // to ensure clean tests
      ICAL.TimezoneService.reset();
    });

    suiteSetup(function(done) {
      function zoneDone() {
        if (--remaining == 0) {
          done();
        }
      }

      // By default, Z/UTC/GMT are already registered
      if (ICAL.TimezoneService.count > 3) {
        throw new Error("Can only register zones once");
      }

      var remaining = allZones.length;
      allZones.forEach(function(zone) {
        testSupport.registerTimezone(zone, zoneDone);
      });
    });
  };

  /**
   * @param {String} path relative to root (/) of project.
   * @param {Function} callback [err, contents].
   */
  testSupport.load = function(path, callback) {
    if (testSupport.isNode) {
      let root = new URL('../' + path, import.meta.url).pathname;
      fs.readFile(root, 'utf8', function(err, contents) {
        callback(err, contents);
      });
    } else {
      var path = '/' + path;
      if (testSupport.isKarma) {
        path = '/base/' + path.replace(/^\//, '');
      }
      var xhr = new XMLHttpRequest();
      xhr.open('GET', path, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status !== 200) {
            callback(new Error('file not found or other error', xhr));
          } else {
            callback(null, xhr.responseText);
          }
        }
      };
      xhr.send(null);
    }
  };

  testSupport.defineSample = function(file, cb) {
    suiteSetup(function(done) {
      testSupport.load('samples/' + file, function(err, data) {
        if (err) {
          done(err);
        }
        cb(data);
        done();
      });
    });
  };

  testSupport.lib = function(lib, callback) {
     testSupport.require('/lib/ical/' + lib, callback);
  };

  testSupport.helper = function(lib) {
    testSupport.require('/test/support/' + lib);
  };

  if (!testSupport.isKarma) {
    //testSupport.require('/node_modules/benchmark/benchmark.js');
    //testSupport.require('/test/support/performance.js');

    // Load it here so its pre-loaded in all suite blocks...
    //testSupport.requireICAL();
  }

})();
