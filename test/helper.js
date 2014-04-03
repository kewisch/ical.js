(function() {

  var isNode = typeof(window) === 'undefined';

  if (!isNode) {
    window.navigator;
  }

  // lazy defined navigator causes global leak warnings...

  var requireBak;
  var specialRequires = {
    'chai': requireChai
  };

  testSupport = {
    isNode: (typeof(window) === 'undefined')
  };

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
   * @param {String} number or version of the build (see build/benchmark/.
   */
  testSupport.requireBenchmarkBuild = function(number) {
    var path = '/build/benchmark/ical_' + number + '.js';
    testSupport.require(path);
  };

  testSupport.require = function cross_require(file, callback) {
    if (file in specialRequires) {
      return specialRequires[file](file, callback);
    }

    if (!(/\.js$/.test(file))) {
      file += '.js';
    }

    if (typeof(window) === 'undefined') {
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

  //'chai has no backtraces in ff
  //this patch will change the error
  //class used to provide real .stack.
  function setupChai(chai) {
    function chaiAssert(expr, msg, negateMsg, expected, actual) {
      actual = actual || this.obj;
      var msg = (this.negate ? negateMsg : msg),
          ok = this.negate ? !expr : expr;

      if (!ok) {
        throw new Error(
          // include custom message if available
          this.msg ? this.msg + ': ' + msg : msg
        );
      }
    }
    chai.Assertion.prototype.assert = chaiAssert;
    chai.Assertion.includeStack = true;


    assert = chai.assert;

    // XXX: this is a lame way to do this
    // in reality we need to fix the above upstream
    // and leverage new chai 1x methods

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

  function requireChai(file, callback) {
    var path;
    if (testSupport.isNode) {
      setupChai(require('chai'));
    } else {
      require('/node_modules/chai/chai.js', function() {
        setupChai(chai);
      });
    }
  }

  testSupport.require('chai');


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
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/' + path, true);
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

  testSupport.require('/node_modules/benchmark/benchmark.js');

  testSupport.requireBenchmarkBuild('previous');
  testSupport.require('/test/support/performance.js');

  // Load it here so its pre-loaded in all suite blocks...
  testSupport.requireICAL();
}());
