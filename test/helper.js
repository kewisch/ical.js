(function() {

  var isNode = typeof(window) === 'undefined';

  if (!isNode) {
    window.navigator;
  }

  // lazy defined navigator causes global leak warnings...

  testSupport = {
    isNode: (typeof(window) === 'undefined'),
    isKarma: (typeof(window) !== 'undefined' && typeof window.__karma__ !== 'undefined')
  };

  function loadChai(chai) {
    chai.config.includeStack = true;
    assert = chai.assert;
    assert.hasProperties = function chai_hasProperties(given, props, msg) {
      msg = (typeof(msg) === 'undefined') ? '' : msg + ': ';

      if (props instanceof Array) {
        props.forEach(function(prop) {
          assert.ok(
            (prop in given),
            msg + 'given should have "' + prop + '" property'
          );
        });
      } else {
        for (var key in props) {
          assert.deepEqual(
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
    loadChai(require('chai'));
  } else if (window.chai) {
    loadChai(window.chai);
  } else {
    require('/node_modules/chai/chai.js', function() {
      loadChai(window.chai);
    });
  }

  /* cross require */
  testSupport.requireICAL = function() {
    var files = [
      'helpers',
      'recur_expansion',
      'event',
      'component_parser',
      'design',
      'parse',
      'stringify',
      'component',
      'property',
      'utc_offset',
      'binary',
      'period',
      'duration',
      'timezone',
      'timezone_service',
      'time',
      'vcard_time',
      'recur',
      'recur_iterator'
    ];

    files.forEach(function(file) {
      testSupport.require('/lib/ical/' + file + '.js');
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
    if (!(/\.js$/.test(file))) {
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
   * Registers a timezones for a given suite of tests.
   * Uses suiteSetup to stage and will use suiteTeardown
   * to purge all timezones for clean tests...
   *
   */
  testSupport.useTimezones = function(zones) {
    suiteTeardown(function() {
      // to ensure clean tests
      ICAL.TimezoneService.reset();
    });

    Array.prototype.slice.call(arguments).forEach(function(zone) {
      suiteSetup(function(done) {
        testSupport.registerTimezone(zone, done);
      });
    });
  };

  /**
   * @param {String} path relative to root (/) of project.
   * @param {Function} callback [err, contents].
   */
  testSupport.load = function(path, callback) {
    if (testSupport.isNode) {
      var root = __dirname + '/../';
      require('fs').readFile(root + path, 'utf8', function(err, contents) {
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
    testSupport.require('/node_modules/benchmark/benchmark.js');
    testSupport.require('/test/support/performance.js');

    // Load it here so its pre-loaded in all suite blocks...
    testSupport.requireICAL();
  }

}());
