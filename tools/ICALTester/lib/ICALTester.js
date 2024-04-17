/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2015 */


/**
 * ICALTester Module
 * @module ICALTester
 */

import ICAL from "../../../lib/ical/module.js";
import async from "async";

function range(min, max, nozero) {
  let res = [];
  for (let i = min; i <= max; i++) {
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
  let vals = list.slice();
  let res = [];

  while (count--) {
    res.push(vals.splice(randInt(0, vals.length), 1)[0]);
  }
  return res;
}

function randValues(designdata) {
  let count = randInt(1, designdata.length);
  return randList(designdata, count);
}

function sortByday(aRules, aWeekStart) {
  let thisobj = {
    ruleDayOfWeek: ICAL.RecurIterator.prototype.ruleDayOfWeek,
    sort_byday_rules: ICAL.RecurIterator.prototype.sort_byday_rules,
    rule: { wkst: "MO" }
  };

  return thisobj.sort_byday_rules(aRules, aWeekStart || ICAL.Time.MONDAY);
}

function sortNumeric(a, b) {
  return a - b;
}

function substitute(rules) {
  return rules.map(function(r) {
    for (let key in r) {
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
  let res = {};
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
  let runner = (CONCURRENCY == 1 ? async.series : async.parallel);
  let boundAsyncHandler = {};
  let rules = substitute(ruleData);
  Object.keys(asyncHandler).forEach(function(k) {
    boundAsyncHandler[k] = runHandler.bind(null, asyncHandler[k], rules, dtstart, max);
  });
  runner(boundAsyncHandler, callback);
}

let CONCURRENCY = 2;
let MAX_EXECUTION_TIME = 1000;
let asyncHandler = {};

let day_names = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
let freq_values = ['SECONDLY', 'MINUTELY', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
let design = {
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

let generators = {
  byday: function(rule) {
    let designdata = design.BYDAY[rule.freq];

    let daycount = randInt(1, designdata[1].length);
    let days = randList(designdata[1], daycount);
    let prefix = randList(designdata[0], daycount);

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
export default {
  /**
   * The number of concurrent threads to use
   * @type {Number}
   */
  get CONCURRENCY() { return CONCURRENCY; },
  set CONCURRENCY(v) { CONCURRENCY = v; },

  /**
   * The maximum execution time
   * @type {Number}
   */
  get MAX_EXECUTION_TIME() { return MAX_EXECUTION_TIME; },
  set MAX_EXECUTION_TIME(v) { MAX_EXECUTION_TIME = v; },

  generators: generators,
  addHandler: addHandler,
  run: run
};
