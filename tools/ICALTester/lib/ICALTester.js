/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2015 */


/**
 * ICALTester Module
 * @module ICALTester
 */

var ICAL = require('../../..');
var async = require('async');

function range(min, max, nozero) {
  var res = [];
  for (var i = min; i <= max; i++) {
    if (i == 0 && nozero) {
      continue;
    }
    res.push(i);
  }
  return res;
}

function withempty(res, empty) {
  return [empty || ""].concat(res);
}

function randInt(min, max) {
  return Math.floor(Math.random() * max) + min;
}

function randList(list, count) {
  var vals = list.slice();
  var res = [];

  while (count--) {
    res.push(vals.splice(randInt(0, vals.length), 1)[0]);
  }
  return res;
}

function randValues(designdata) {
  var count = randInt(1, designdata.length);
  return randList(designdata, count);
}

function sortByday(aRules, aWeekStart) {
  var thisobj = {
    ruleDayOfWeek: ICAL.RecurIterator.prototype.ruleDayOfWeek,
    sort_byday_rules: ICAL.RecurIterator.prototype.sort_byday_rules
  };

  return thisobj.sort_byday_rules(aRules, aWeekStart || ICAL.Time.MONDAY);
}

function sortNumeric(a, b) {
  return a - b;
}

function substitute(rules) {
  return rules.map(function(r) {
    for (var key in r) {
      if (r[key] == "%") {
        r[key] = generators[key](r);
      }
    }
    return ICAL.Recur.fromData(r);
  });
}

function addHandler(name, callback) {
  asyncHandler[name] = callback;
}

function runHandler(handler, rules, dtstart, max, callback) {
  var res = {};
  async.eachLimit(rules, CONCURRENCY, function(rule, eachcb) {
    handler(rule, dtstart, max, function(err, result) {
      res[rule] = err || result;
      eachcb();
    });
  }, function(err) {
    callback(null, res);
  });
}

function run(ruleData, dtstart, max, callback) {
  var runner = (CONCURRENCY == 1 ? async.series : async.parallel);
  var boundAsyncHandler = {};
  var rules = substitute(ruleData);
  Object.keys(asyncHandler).forEach(function(k) {
    boundAsyncHandler[k] = runHandler.bind(null, asyncHandler[k], rules, dtstart, max);
  });
  runner(boundAsyncHandler, callback);
}

var CONCURRENCY = 2;
var MAX_EXECUTION_TIME = 1000;
var asyncHandler = {};

var day_names = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
var freq_values = ['SECONDLY', 'MINUTELY', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
var design = {
  FREQ: freq_values,

  BYSECOND: range(0, 60),
  BYMINUTE: range(0, 59),
  BYHOUR: range(0, 23),

  BYDAY: {
    DAILY: [withempty(range(-5, 5, true)), day_names],
    WEEKLY: [withempty(range(-5, 5, true)), day_names],
    MONTHLY: [withempty(range(-5, 5, true)), day_names],
    YEARLY: [withempty(range(-53, 53, true)), day_names]
  },
  BYMONTHDAY: range(1, 31), /// TOOO -31
  BYYEARDAY: range(-366, 366),

  BYWEEKNO: range(-53, 53),
  BYMONTH: range(1, 12),
  BYSETPOS: range(-366, 366),
  WKST: day_names
};

var generators = {
  byday: function(rule) {
    var designdata = design.BYDAY[rule.freq];

    var daycount = randInt(1, designdata[1].length);
    var days = randList(designdata[1], daycount);
    var prefix = randList(designdata[0], daycount);

    sortByday(days, rule.wkst);

    return days.map(function(day, i) {
      return prefix[i] + day;
    });
  },
  bymonthday: function(rule) {
    return randValues(design.BYMONTHDAY).sort(sortNumeric);
  },
  bymonth: function(rule) {
    return randValues(design.BYMONTH).sort(sortNumeric);
  }
};


/**
 * gjslint complains about missing docs
 * @ignore
 */
module.exports = {
  /**
   * The number of concurrent threads to use
   * @type {Number}
   */
  get CONCURRENCY() { return CONCURRENCY; },
  set CONCURRENCY(v) { return (CONCURRENCY = v); },

  /**
   * The maximum execution time
   * @type {Number}
   */
  get MAX_EXECUTION_TIME() { return MAX_EXECUTION_TIME; },
  set MAX_EXECUTION_TIME(v) { return (MAX_EXECUTION_TIME = v); },

  generators: generators,
  addHandler: addHandler,
  run: run
};
