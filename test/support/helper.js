import ICAL from "../../lib/ical/module.js";
import chai from "chai";
import { URL } from 'url';
import fs from "fs";
import Benchmark from "benchmark";


/* eslint-env browser, node, mocha */

let icalPrevious, icalUpstream;
global.ICAL = ICAL;

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

let testSupport = global.testSupport = {
  isNode: (typeof(window) === 'undefined'),
  isKarma: (typeof(window) !== 'undefined' && typeof window.__karma__ !== 'undefined')
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
 * and will use suiteTeardown to purge all timezones for clean tests..
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
    let root = new URL('../../' + path, import.meta.url).pathname;
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


function perfTestDefine(scope, done) {
  this.timeout(0);
  let benchSuite = new Benchmark.Suite();
  let currentTest = this.test;
  benchSuite.add("latest", scope.bind(this));
  if (icalPrevious) {
    benchSuite.add("previous", () => {
      let lastGlobal = global.ICAL;
      global.ICAL = icalPrevious;
      scope.call(this);
    });
  }
  if (icalUpstream) {
    benchSuite.add("upstream", () => {
      let lastGlobal = global.ICAL;
      global.ICAL = icalUpstream;
      scope.call(this);
    });
  }

  currentTest._benchCycle = [];

  benchSuite.on('cycle', function(event) {
    currentTest._benchCycle.push(String(event.target));
  });

  benchSuite.on('complete', function(event) {
    currentTest._benchFastest = this.filter('fastest').map('name');
    done(event.target.error);
  });

  benchSuite.run();
}

global.perfTest = function(name, scope) {
  test(name, function(done) {
    perfTestDefine.call(this, scope, done);
  });
};
global.perfTest.only = function(name, scope) {
  test.only(name, function(done) {
    perfTestDefine.call(this, scope, done);
  });
};
global.perfTest.skip = function(name, scope) {
  test.skip(name, function(done) {
    perfTestDefine.call(this, scope, done);
  });
};

export const mochaHooks = {
  beforeAll(done) {
    Promise.allSettled([
      import(`../../build/benchmark/ical_previous.js`).then((module) => {
        icalPrevious = module.default;
      }),
      import(`../../build/benchmark/ical_upstream.js`).then((module) => {
        icalUpstream = module.default;
      }),
    ]).then(() => done());
  }
};
