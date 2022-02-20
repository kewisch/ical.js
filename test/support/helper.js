/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch */

/* eslint-env browser, node, mocha */

let crossGlobal = typeof(window) === 'undefined' ? global : window;
let testSupport = crossGlobal.testSupport = {
  isNode: (typeof(global) !== 'undefined'),
  isKarma: (typeof(window) !== 'undefined' && typeof window.__karma__ !== 'undefined')
};

if (testSupport.isKarma) {
  // Need to do this before the first await, browser/karma won't wait on top level await
  window.__karma__.loaded = function() {};
}

if (testSupport.isNode) {
  var ICAL = (await import("../../lib/ical/module.js")).default;
  var chai = (await import("chai")).default;
  var Benchmark = (await import("benchmark")).default;
  var { URL } = await import("url");
  var { readFile } = (await import('fs/promises'));
} else {
  var ICAL = (await import("/base/lib/ical/module.js")).default;
  var chai = window.chai;
}

crossGlobal.ICAL = ICAL;
chai.config.includeStack = true;
crossGlobal.assert = chai.assert;
crossGlobal.assert.hasProperties = function chai_hasProperties(given, props, msg) {
  msg = (typeof(msg) === 'undefined') ? '' : msg + ': ';

  if (props instanceof Array) {
    props.forEach(function(prop) {
      crossGlobal.assert.ok(
        (prop in given),
        msg + 'given should have "' + prop + '" property'
      );
    });
  } else {
    for (var key in props) {
      crossGlobal.assert.deepEqual(
        given[key],
        props[key],
        msg + ' property equality for (' + key + ') '
      );
    }
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
    testSupport.load(path).then((data) => {
      var zone = register(data);
      this._timezones[zone] = data;

      callback(null, register(data));
    }, callback);
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
testSupport.load = async function(path, callback) {
  if (testSupport.isNode) {
    let root = new URL('../../' + path, import.meta.url).pathname;
    return readFile(root, 'utf8');
  } else {
    let response = await fetch("/base/" + path);
    if (response.status == 200) {
      let text = await response.text();
      return text;
    } else {
      let err = new Error('file not found or other error', response);
      throw err;
    }
  }
};

testSupport.loadSample = async function(file) {
  return testSupport.load('samples/' + file);
};

let icalPrevious, icalUpstream;
function perfTestDefine(scope, done) {
  this.timeout(0);
  let benchSuite = new Benchmark.Suite();
  let currentTest = this.test;
  benchSuite.add("latest", scope.bind(this));
  if (icalPrevious) {
    benchSuite.add("previous", () => {
      let lastGlobal = crossGlobal.ICAL;
      crossGlobal.ICAL = icalPrevious;
      scope.call(this);
      crossGlobal.ICAL = lastGlobal;
    });
  }
  if (icalUpstream) {
    benchSuite.add("upstream", () => {
      let lastGlobal = crossGlobal.ICAL;
      crossGlobal.ICAL = icalUpstream;
      scope.call(this);
      crossGlobal.ICAL = lastGlobal;
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

crossGlobal.perfTest = function(name, scope) {
  test(name, function(done) {
    perfTestDefine.call(this, scope, done);
  });
};
crossGlobal.perfTest.only = function(name, scope) {
  test.only(name, function(done) {
    perfTestDefine.call(this, scope, done);
  });
};
crossGlobal.perfTest.skip = function(name, scope) {
  test.skip(name, function(done) {
    perfTestDefine.call(this, scope, done);
  });
};

if (!testSupport.isNode) {
  console.log("KARMA");
  try {
    for (let file in window.__karma__.files) {
      if (window.__karma__.files.hasOwnProperty(file)) {
        if (/_test\.js$/.test(file)) {
          await import(file);
        }
      }
    }

    window.__karma__.start();
  } catch (e) {
    window.__karma__.error(e.toString());
  }
}

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
