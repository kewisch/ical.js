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
      var lib = require(__dirname + '/../../' + file);
      if (typeof(callback) !== 'undefined') {
        callback(lib);
      }
    } else {
      window.require(file, callback);
    }
  }

  //chai has no backtraces in ff
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
            msg + ' property equality for (' + key  + ') '
          );
        }
      }
    }
  }

  function requireChai(file, callback) {
    var path;
    if (testSupport.isNode) {
      setupChai(require('chai'));
    } else {
      require('/test-agent/chai.js', function() {
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
      var root = __dirname + '/../../';
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
      }
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
    testSupport.require('/test/mocha/support/' + lib);
  }

  testSupport.require('/test/mocha/support/benchmark.js');

  // Load it here so its pre-loaded in all suite blocks...
  testSupport.requireICAL();
}());
