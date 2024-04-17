/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch */

let crossGlobal = typeof(window) === 'undefined' ? global : window;
let testSupport = crossGlobal.testSupport = {
  isNode: (typeof(global) !== 'undefined'),
  isKarma: (typeof(window) !== 'undefined' && typeof window.__karma__ !== 'undefined')
};

if (testSupport.isKarma) {
  // Need to do this before the first await, browser/karma won't wait on top level await
  window.__karma__.loaded = function() {};
}

/* eslint-disable no-var, no-redeclare */
if (testSupport.isNode) {
  var ICAL = (await import("../../lib/ical/module.js")).default;
  var chai = await import("chai");
  var Benchmark = (await import("benchmark")).default;
  var { URL } = await import("url");
  var { readFile, readdir } = (await import('fs/promises'));
} else {
  var ICAL = (await import("/base/lib/ical/module.js")).default;
  var chai = window.chai;
}
/* eslint-enable no-var, no-redeclare*/

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
    for (let key in props) {
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
 * @param {String} zoneName like "America/Los_Angeles".
 */
testSupport.registerTimezone = async function(zoneName) {
  function register(icsData) {
    let parsed = ICAL.parse(icsData);
    let calendar = new ICAL.Component(parsed);
    let vtimezone = calendar.getFirstSubcomponent('vtimezone');

    ICAL.TimezoneService.register(vtimezone);
  }

  if (!this._timezones) {
    this._timezones = Object.create(null);
  }

  let ics = this._timezones[zoneName];

  if (ics) {
    return register(ics);
  } else {
    let path = 'samples/timezones/' + zoneName + '.ics';
    let data = await testSupport.load(path);
    let zone = register(data);
    this._timezones[zone] = data;
    return zone;
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

  suiteSetup(async function() {
    // By default, Z/UTC/GMT are already registered
    if (ICAL.TimezoneService.count > 3) {
      throw new Error("Can only register zones once");
    }

    await Promise.all(allZones.map(zone => testSupport.registerTimezone(zone)));
  });
};

/**
 * @param {String} path relative to root (/) of project.
 */
testSupport.load = async function(path) {
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

let icalPerf = {};
function perfTestDefine(scope, done) {
  this.timeout(0);
  let benchSuite = new Benchmark.Suite();
  let currentTest = this.test;
  benchSuite.add("latest", scope.bind(this));
  Object.entries(icalPerf).forEach(([key, ical]) => {
    benchSuite.add(key, () => {
      let lastGlobal = crossGlobal.ICAL;
      crossGlobal.ICAL = ical;
      scope.call(this);
      crossGlobal.ICAL = lastGlobal;
    });
  });

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
      if (Object.hasOwn(window.__karma__.files, file)) {
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
  async beforeAll() {
    let benchmark = new URL('../../tools/benchmark', import.meta.url).pathname;
    let files = await readdir(benchmark);
    for (let file of files) {
      let match = file.match(/^ical_(\w+).c?js$/);
      if (match) {
        try {
          let module = await import("../../tools/benchmark/" + file);
          if (module.default) {
            icalPerf[match[1]] = module.default;
          } else {
            console.error(`Error loading tools/benchmark/${file}, skipping for performance tests: Missing default export`);
          }
        } catch (e) {
          console.error(`Error loading tools/benchmark/${file}, skipping for performance tests: ${e}`);
        }
      }
    }
  }
};
