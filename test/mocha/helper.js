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
      'serializer',
      'parser',
      'design',
      'component',
      'property',
      'value',
      'period',
      'duration',
      'timezone',
      'time',
      'recur',
      'ical'
    ];

    files.forEach(function(file) {
      testSupport.require('/lib/ical/' + file + '.js');
    });
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

  testSupport.loadSample = function(file, cb) {
    if (testSupport.isNode) {
      var root = __dirname + '/../../samples/';
      require('fs').readFile(root + file, 'utf8', function(err, contents) {
        cb(err, contents);
      });
    } else {
      var xhr = new XMLHttpRequest();
      console.log(file);
      xhr.open('GET', '/samples/' + file, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status !== 200) {
            cb(new Error('file not found or other error', xhr));
          } else {
            cb(null, xhr.responseText);
          }
        }
      }
      xhr.send(null);
    }
  };

  testSupport.defineSample = function(file, cb) {
    suiteSetup(function(done) {
      testSupport.loadSample(file, function(err, data) {
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

  // Load it here so its pre-loaded in all suite blocks...
  testSupport.requireICAL();
}());
