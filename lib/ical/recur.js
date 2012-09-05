/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

"use strict";

(typeof(ICAL) === 'undefined')? ICAL = {} : '';
(function() {
  ICAL.icalrecur = function icalrecur(data) {
    this.wrappedJSObject = this;
    this.parts = {};
    this.fromData(data);
  };

  ICAL.icalrecur.prototype = {

    parts: null,

    interval: 1,
    wkst: ICAL.icaltime.MONDAY,
    until: null,
    count: null,
    freq: null,
    icalclass: "icalrecur",
    icaltype: "RECUR",

    iterator: function(aStart) {
      return new icalrecur_iterator(this, aStart);
    },

    clone: function clone() {
      return ICAL.icalrecur.fromData(this);
      //return ICAL.icalrecur.fromIcalProperty(this.toIcalProperty());
    },

    is_finite: function isfinite() {
      return (this.count || this.until);
    },

    is_by_count: function isbycount() {
      return (this.count && !this.until);
    },

    addComponent: function addPart(aType, aValue) {
      if (!(aType in this.parts)) {
        this.parts[aType] = [aValue];
      } else {
        this.parts[aType].push(aValue);
      }
    },

    setComponent: function setComponent(aType, aValues) {
      this.parts[aType] = aValues;
    },

    getComponent: function getComponent(aType, aCount) {
      var ucName = aType.toUpperCase();
      var components = (ucName in this.parts ? this.parts[ucName] : []);

      if (aCount) aCount.value = components.length;
      return components;
    },

    getNextOccurrence: function getNextOccurrence(aStartTime, aRecurrenceId) {
      ICAL.helpers.dumpn("GNO: " + aRecurrenceId + " / " + aStartTime);
      var iter = this.iterator(aStartTime);
      var next, cdt;

      do {
        next = iter.next();
        ICAL.helpers.dumpn("Checking " + next + " <= " + aRecurrenceId);
      } while (next && next.compare(aRecurrenceId) <= 0);

      if (next && aRecurrenceId.zone) {
        next.zone = aRecurrenceId.zone;
      }

      return next;
    },

    fromData: function fromData(aData) {
      var propsToCopy = ["freq", "count", "wkst", "interval"];
      for (var key in propsToCopy) {
        var prop = propsToCopy[key];
        if (aData && prop.toUpperCase() in aData) {
          this[prop] = aData[prop.toUpperCase()];
          // TODO casing sucks, fix the parser!
        } else if (aData && prop in aData) {
          this[prop] = aData[prop];
          // TODO casing sucks, fix the parser!
        }
      }

      if (aData && "until" in aData && aData.until) {
        this.until = aData.until.clone();
      }

      var partsToCopy = ["BYSECOND", "BYMINUTE", "BYHOUR", "BYDAY",
                         "BYMONTHDAY", "BYYEARDAY", "BYWEEKNO",
                         "BYMONTH", "BYSETPOS"];
      this.parts = {};
      if (aData) {
        for (var key in partsToCopy) {
          var prop = partsToCopy[key];
          if (prop in aData) {
            this.parts[prop] = aData[prop];
            // TODO casing sucks, fix the parser!
          }
        }
        // TODO oh god, make it go away!
        if (aData.parts) {
          for (var key in partsToCopy) {
            var prop = partsToCopy[key];
            if (prop in aData.parts) {
              this.parts[prop] = aData.parts[prop];
              // TODO casing sucks, fix the parser!
            }
          }
        }
      }
      return this;
    },

    toString: function icalrecur_toString() {
      // TODO retain order
      var str = "FREQ=" + this.freq;
      if (this.count) {
        str += ";COUNT=" + this.count;
      }
      if (this.interval != 1) {
        str += ";INTERVAL=" + this.interval;
      }
      for (var k in this.parts) {
        str += ";" + k + "=" + this.parts[k];
      }
      return str;
    },

    toIcalProperty: function toIcalProperty() {
      try {
        var valueData = {
          name: this.isNegative ? "EXRULE" : "RRULE",
          type: "RECUR",
          value: [this.toString()]
          // TODO more props?
        };
        return ICAL.icalproperty.fromData(valueData);
      } catch (e) {
        ICAL.helpers.dumpn("EICALPROP: " + this.toString() + "//" + e);
        ICAL.helpers.dumpn(e.stack);
        return null;
      }
    },
    fromIcalProperty: function fromIcalProperty(aProp) {
      var propval = aProp.getFirstValue();
      this.fromData(propval);
      this.parts = ICAL.helpers.clone(propval.parts, true);
      if (aProp.name == "EXRULE") {
        this.isNegative = true;
      } else if (aProp.name == "RRULE") {
        this.isNegative = false;
      } else {
        throw new Error("Invalid Property " + aProp.name + " passed");
      }
    }
  };

  ICAL.icalrecur.fromData = function icalrecur_fromData(data) {
    return (new ICAL.icalrecur(data));
  }

  ICAL.icalrecur.fromString = function icalrecur_fromString(str) {
    var data = ICAL.icalparser.parseValue(str, "RECUR");
    return ICAL.icalrecur.fromData(data);
  };

  ICAL.icalrecur.fromIcalProperty = function icalrecur_fromIcalProperty(prop) {
    var recur = new ICAL.icalrecur();
    recur.fromIcalProperty(prop);
    return recur;
  };

  function icalrecur_iterator(aRule, aStart) {
    this.rule = aRule;
    this.dtstart = aStart;
    this.by_data = ICAL.helpers.clone(aRule.parts, true);
    this.days = [];
    this.init();
  }

  icalrecur_iterator.prototype = {

    rule: null,
    dtstart: null,
    last: null,
    occurrence_number: 0,
    by_indices: null,
    by_data: null,

    days: null,
    days_index: 0,

    init: function icalrecur_iterator_init() {
      this.last = this.dtstart.clone();
      var parts = this.by_data;

      this.by_indices = {
        "BYSECOND": 0,
        "BYMINUTE": 0,
        "BYHOUR": 0,
        "BYDAY": 0,
        "BYMONTH": 0,
        "BYWEEKNO": 0,
        "BYMONTHDAY": 0
      };

      if ("BYDAY" in parts) {
        // libical does this earlier when the rule is loaded, but we postpone to
        // now so we can preserve the original order.
        this.sort_byday_rules(parts.BYDAY, this.rule.wkst);
      }

      // If the BYYEARDAY appares, no other date rule part may appear
      if ("BYYEARDAY" in parts) {
        if ("BYMONTH" in parts || "BYWEEKNO" in parts ||
            "BYMONTHDAY" in parts || "BYDAY" in parts) {
          throw new Error("Invalid BYYEARDAY rule");
        }
      }

      // BYWEEKNO and BYMONTHDAY rule parts may not both appear
      if ("BYWEEKNO" in parts && "BYMONTHDAY" in parts) {
        throw new Error("BYWEEKNO does not fit to BYMONTHDAY");
      }

      // For MONTHLY recurrences (FREQ=MONTHLY) neither BYYEARDAY nor
      // BYWEEKNO may appear.
      if (this.rule.freq == "MONTHLY" &&
          ("BYYEARDAY" in parts || "BYWEEKNO" in parts)) {
        throw new Error("For MONTHLY recurrences neither BYYEARDAY nor BYWEEKNO may appear");
      }

      // For WEEKLY recurrences (FREQ=WEEKLY) neither BYMONTHDAY nor
      // BYYEARDAY may appear.
      if (this.rule.freq == "WEEKLY" &&
          ("BYYEARDAY" in parts || "BYMONTHDAY" in parts)) {
        throw new Error("For WEEKLY recurrences neither BYMONTHDAY nor BYYEARDAY may appear");
      }

      // BYYEARDAY may only appear in YEARLY rules
      if (this.rule.freq != "YEARLY" && "BYYEARDAY" in parts) {
        throw new Error("BYYEARDAY may only appear in YEARLY rules");
      }

      this.last.second = this.setup_defaults("BYSECOND", "SECONDLY", this.dtstart.second);
      this.last.minute = this.setup_defaults("BYMINUTE", "MINUTELY", this.dtstart.minute);
      this.last.hour = this.setup_defaults("BYHOUR", "HOURLY", this.dtstart.hour);
      this.last.day = this.setup_defaults("BYMONTHDAY", "DAILY", this.dtstart.day);
      this.last.month = this.setup_defaults("BYMONTH", "MONTHLY", this.dtstart.month);

      if (this.rule.freq == "WEEKLY") {
        if ("BYDAY" in parts) {
          var parts = this.rule_day_of_week(parts.BYDAY[0]);
          var pos = parts[0];
          var rule_dow = parts[1];
          var dow = rule_dow - this.last.day_of_week();
          if ((this.last.day_of_week() < rule_dow && dow >= 0) || dow < 0) {
            // Initial time is after first day of BYDAY data
            this.last.day += dow;
            this.last.normalize();
          }
        } else {
          var wkMap = icalrecur_iterator._wkdayMap[this.dtstart.day_of_week()];
          parts.BYDAY = [wkMap];
        }
      }

      if (this.rule.freq == "YEARLY") {
        for (;;) {
          this.expand_year_days(this.last.year);
          if (this.days.length > 0) {
            break;
          }
          this.increment_year(this.rule.interval);
        }

        var next = ICAL.icaltime.from_day_of_year(this.days[0], this.last.year);

        this.last.day = next.day;
        this.last.month = next.month;
      }

      if (this.rule.freq == "MONTHLY" && this.has_by_data("BYDAY")) {
        var coded_day = this.by_data.BYDAY[this.by_indices.BYDAY];
        var parts = this.rule_day_of_week(coded_day);
        var pos = parts[0];
        var dow = parts[1];

        var days_in_month = ICAL.icaltime.days_in_month(this.last.month, this.last.year);
        var poscount = 0;

        if (pos >= 0) {
          for (this.last.day = 1; this.last.day <= days_in_month; this.last.day++) {
            if (this.last.day_of_week() == dow) {
              if (++poscount == pos || pos == 0) {
                break;
              }
            }
          }
        } else {
          pos = -pos;
          for (this.last.day = days_in_month; this.last.day != 0; this.last.day--) {
            if (this.last.day_of_week() == dow) {
              if (++poscount == pos) {
                break;
              }
            }
          }
        }

        if (this.last.day > days_in_month || this.last.day == 0) {
          throw new Error("Malformed values in BYDAY part");
        }

      } else if (this.has_by_data("BYMONTHDAY")) {
        if (this.last.day < 0) {
          var days_in_month = ICAL.icaltime.days_in_month(this.last.month, this.last.year);
          this.last.day = days_in_month + this.last.day + 1;
        }

        this.last.normalize();
      }
    },

    next: function icalrecur_iterator_next() {
      var before = (this.last ? this.last.clone() : null);

      if ((this.rule.count && this.occurrence_number >= this.rule.count) ||
          (this.rule.until && this.last.compare(this.rule.until) > 0)) {
        return null;
      }

      if (this.occurrence_number == 0 && this.last.compare(this.dtstart) >= 0) {
        // First of all, give the instance that was initialized
        this.occurrence_number++;
        return this.last;
      }

      do {
        var valid = 1;

        switch (this.rule.freq) {
        case "SECONDLY":
          this.next_second();
          break;
        case "MINUTELY":
          this.next_minute();
          break;
        case "HOURLY":
          this.next_hour();
          break;
        case "DAILY":
          this.next_day();
          break;

        case "WEEKLY":
          this.next_week();
          break;
        case "MONTHLY":
          valid = this.next_month();
          break;
        case "YEARLY":
          this.next_year();
          break;

        default:
          return null;
        }
      } while (!this.check_contracting_rules() ||
               this.last.compare(this.dtstart) < 0 ||
               !valid);

      // TODO is this valid?
      if (this.last.compare(before) == 0) {
        throw new Error("Same occurrence found twice, protecting " +
                        "you from death by recursion");
      }

      if (this.rule.until && this.last.compare(this.rule.until) > 0) {
        return null;
      } else {
        this.occurrence_number++;
        return this.last;
      }
    },

    next_second: function next_second() {
      return this.next_generic("BYSECOND", "SECONDLY", "second", "minute");
    },

    increment_second: function increment_second(inc) {
      return this.increment_generic(inc, "second", 60, "minute");
    },

    next_minute: function next_minute() {
      return this.next_generic("BYMINUTE", "MINUTELY",
                               "minute", "hour", "next_second");
    },

    increment_minute: function increment_minute(inc) {
      return this.increment_generic(inc, "minute", 60, "hour");
    },

    next_hour: function next_hour() {
      return this.next_generic("BYHOUR", "HOURLY", "hour",
                               "monthday", "next_minute");
    },

    increment_hour: function increment_hour(inc) {
      this.increment_generic(inc, "hour", 24, "monthday");
    },

    next_day: function next_day() {
      var has_by_day = ("BYDAY" in this.by_data);
      var this_freq = (this.rule.freq == "DAILY");

      if (this.next_hour() == 0) {
        return 0;
      }

      if (this_freq) {
        this.increment_monthday(this.rule.interval);
      } else {
        this.increment_monthday(1);
      }

      return 0;
    },

    next_week: function next_week() {
      var end_of_data = 0;

      if (this.next_weekday_by_week() == 0) {
        return end_of_data;
      }

      if (this.has_by_data("BYWEEKNO")) {
        var idx = ++this.by_indices.BYWEEKNO;

        if (this.by_indices.BYWEEKNO == this.by_data.BYWEEKNO.length) {
          this.by_indices.BYWEEKNO = 0;
          end_of_data = 1;
        }

        // HACK should be first month of the year
        this.last.month = 1;
        this.last.day = 1;

        var week_no = this.by_data.BYWEEKNO[this.by_indices.BYWEEKNO];

        this.last.day += 7 * week_no;
        this.last.normalize();

        if (end_of_data) {
          this.increment_year(1);
        }
      } else {
        // Jump to the next week
        this.increment_monthday(7 * this.rule.interval);
      }

      return end_of_data;
    },

    next_month: function next_month() {
      var this_freq = (this.rule.freq == "MONTHLY");
      var data_valid = 1;

      if (this.next_hour() == 0) {
        return data_valid;
      }

      if (this.has_by_data("BYDAY") && this.has_by_data("BYMONTHDAY")) {
        var days_in_month = ICAL.icaltime.days_in_month(this.last.month, this.last.year);
        var notFound = true;
        var day;

        for (day = last.day + 1; notFound && day <= days_in_month; day++) {
          for (var dayIdx = 0; dayIdx < this.by_data.BYDAY.length; dayIdx++) {
            for (var mdIdx = 0; mdIdx < this.by_data.BYMONTHDAY.length; mdIdx++) {
              var parts = this.rule_day_of_week(this.by_data.BYDAY[dayIdx]);
              var pos = parts[0];
              var dow = parts[1];
              var mday = this.by_data.BYMONTHDAY[mdIdx];

              this.last.day = day;
              var this_dow = this.last.day_of_week();

              if ((pos == 0 && dow == this_dow && mday == day) ||
                  (this.last.nth_weekday(dow, pos))) {
                notFound = false;
              }
            }
          }
        }
        if (day > days_in_month) {
          this.last.day = 1;
          this.increment_month();
          this.last.day--;
          data_valid = 0;
        }

      } else if (this.has_by_data("BYDAY")) {
        var days_in_month = ICAL.icaltime.days_in_month(this.last.month, this.last.year);
        var setpos = 0;

        if (this.has_by_data("BYSETPOS")) {
          var lastday = this.last.day;
          for (var day = 1; day <= days_in_month; day++) {
            this.last.day = day;
            if (this.is_day_in_byday(this.last) && day <= last_day) {
              setpos++;
            }
          }
          this.last.day = last_day;
        }

        for (var day = this.last.day + 1; day <= days_in_month; day++) {
          this.last.day = day;

          if (this.is_day_in_byday(this.last)) {
            if (!this.has_by_data("BYSETPOS") ||
                this.check_set_position(++setpos) ||
                this.check_set_position(setpos - this.by_data.BYSETPOS.length - 1)) {
              found = 1;
              break;
            }
          }
        }

        data_valid = found;

        if (day > days_in_month) {
          this.last.day = 1;
          this.increment_month();

          if (this.is_day_in_byday(this.last)) {
            if (!this.has_by_data("BYSETPOS") || this.check_set_position(1)) {
              data_valid = 1;
            }
          } else {
            data_valid = 0;
          }
        }
      } else if (this.has_by_data("BYMONTHDAY")) {
        this.by_indices.BYMONTHDAY++;

        if (this.by_indices.BYMONTHDAY >= this.by_data.BYMONTHDAY.length) {
          this.by_indices.BYMONTHDAY = 0;
          this.increment_month();
        }

        var days_in_month = ICAL.icaltime.days_in_month(this.last.month, this.last.year);

        var day = this.by_data.BYMONTHDAY[this.by_indices.BYMONTHDAY];

        if (day < 0) {
          day = days_in_month + day + 1;
        }

        if (day > days_in_month) {
          this.last.day = 1;
          data_valid = this.is_day_in_byday(this.last);
        }

        this.last.day = day;
      } else {
        this.last.day = this.by_data.BYMONTHDAY[0];
        this.increment_month();
        var days_in_month = ICAL.icaltime.days_in_month(this.last.month, this.last.year);
        this.last.day = Math.min(this.last.day, days_in_month);
      }

      return data_valid;
    },

    next_weekday_by_week: function next_weekday_by_week() {
      var end_of_data = 0;

      if (this.next_hour() == 0) {
        return end_of_data;
      }

      if (!this.has_by_data("BYDAY")) {
        return 1;
      }

      for (;;) {
        var tt = new ICAL.icaltime();
        tt.auto_normalize = false;
        this.by_indices.BYDAY++;

        if (this.by_indices.BYDAY == this.by_data.BYDAY.length) {
          this.by_indices.BYDAY = 0;
          end_of_data = 1;
        }

        var coded_day = this.by_data.BYDAY[this.by_indices.BYDAY];
        var parts = this.rule_day_of_week(coded_day);
        var dow = parts[1];

        dow -= this.rule.wkst;
        if (dow < 0) {
          dow += 7;
        }

        tt.year = this.last.year;
        tt.month = this.last.month;
        tt.day = this.last.day;

        var start_of_week = tt.start_doy_week(this.rule.wkst);

        if (dow + start_of_week < 1) {
          // The selected date is in the previous year
          if (!end_of_data) {
            continue;
          }
        }

        var next = ICAL.icaltime.from_day_of_year(start_of_week + dow,
                                                  this.last.year);

        this.last.day = next.day;
        this.last.month = next.month;
        this.last.year = next.year;

        return end_of_data;
      }
    },

    next_year: function next_year() {

      if (this.next_hour() == 0) {
        return 0;
      }

      if (++this.days_index == this.days.length) {
        this.days_index = 0;
        do {
          this.increment_year(this.rule.interval);
          this.expand_year_days(this.last.year);
        } while (this.days.length == 0);
      }

      var next = ICAL.icaltime.from_day_of_year(this.days[this.days_index],
                                                this.last.year);

      this.last.day = next.day;
      this.last.month = next.month;

      return 1;
    },

    rule_day_of_week: function rule_day_of_week(dow) {
      var dowMap = {
        SU: 1,
        MO: 2,
        TU: 3,
        WE: 4,
        TH: 5,
        FR: 6,
        SA: 7
      };
      var matches = dow.match(/([+-]?[0-9])?(MO|TU|WE|TH|FR|SA|SU)/);
      if (matches) {
        return [parseInt(matches[1] || 0, 10), dowMap[matches[2]]] || 0;
      } else {
        return [0, 0];
      }
    },

    next_generic: function next_generic(aRuleType, aInterval, aDateAttr,
                                        aFollowingAttr, aPreviousIncr) {
      var has_by_rule = (aRuleType in this.by_data);
      var this_freq = (this.rule.freq == aInterval);
      var end_of_data = 0;

      if (aPreviousIncr && this[aPreviousIncr]() == 0) {
        return end_of_data;
      }

      if (has_by_rule) {
        this.by_indices[aRuleType]++;
        var idx = this.by_indices[aRuleType];
        var dta = this.by_data[aRuleType];

        if (this.by_indices[aRuleType] == dta.length) {
          this.by_indices[aRuleType] = 0;
          end_of_data = 1;
        }
        this.last[aDateAttr] = dta[this.by_indices[aRuleType]];
      } else if (this_freq) {
        this["increment_" + aDateAttr](this.rule.interval);
      }

      if (has_by_rule && end_of_data && this_freq) {
        this["increment_" + aFollowingAttr](1);
      }

      return end_of_data;
    },

    increment_monthday: function increment_monthday(inc) {
      for (var i = 0; i < inc; i++) {
        var days_in_month = ICAL.icaltime.days_in_month(this.last.month, this.last.year);
        this.last.day++;

        if (this.last.day > days_in_month) {
          this.last.day -= days_in_month;
          this.increment_month();
        }
      }
    },

    increment_month: function increment_month() {
      if (this.has_by_data("BYMONTH")) {
        this.by_indices.BYMONTH++;

        if (this.by_indices.BYMONTH == this.by_data.BYMONTH.length) {
          this.by_indices.BYMONTH = 0;
          this.increment_year(1);
        }

        this.last.month = this.by_data.BYMONTH[this.by_indices.BYMONTH];
      } else {
        var inc;
        if (this.rule.freq == "MONTHLY") {
          this.last.month += this.rule.interval;
        } else {
          this.last.month++;
        }

        this.last.month--;
        var years = ICAL.helpers.trunc(this.last.month / 12);
        this.last.month %= 12;
        this.last.month++;

        if (years != 0) {
          this.increment_year(years);
        }
      }
    },

    increment_year: function increment_year(inc) {
      this.last.year += inc;
    },

    increment_generic: function increment_generic(inc, aDateAttr,
                                                  aFactor, aNextIncrement) {
      this.last[aDateAttr] += inc;
      var nextunit = ICAL.helpers.trunc(this.last[aDateAttr] / aFactor);
      this.last[aDateAttr] %= aFactor;
      if (nextunit != 0) {
        this["increment_" + aNextIncrement](nextunit);
      }
    },

    has_by_data: function has_by_data(aRuleType) {
      return (aRuleType in this.rule.parts);
    },

    expand_year_days: function expand_year_days(aYear) {
      var t = new ICAL.icaltime();
      this.days = [];

      // We need our own copy with a few keys set
      var parts = {};
      var rules = ["BYDAY", "BYWEEKNO", "BYMONTHDAY", "BYMONTH", "BYYEARDAY"];
      for (var p in rules) {
        var part = rules[p];
        if (part in this.rule.parts) {
          parts[part] = this.rule.parts[part];
        }
      }

      if ("BYMONTH" in parts && "BYWEEKNO" in parts) {
        var valid = 1;
        var validWeeks = {};
        t.year = aYear;
        t.isDate = true;

        for (var monthIdx = 0; monthIdx < this.by_data.BYMONTH.length; monthIdx++) {
          var month = this.by_data.BYMONTH[monthIdx];
          t.month = month;
          t.day = 1;
          var first_week = t.week_number(this.rule.wkst);
          t.day = ICAL.icaltime.days_in_month(month, aYear);
          var last_week = t.week_number(this.rule.wkst);
          for (monthIdx = first_week; monthIdx < last_week; monthIdx++) {
            validWeeks[monthIdx] = 1;
          }
        }

        for (var weekIdx = 0; weekIdx < this.by_data.BYWEEKNO.length && valid; weekIdx++) {
          var weekno = this.by_data.BYWEEKNO[weekIdx];
          if (weekno < 52) {
            valid &= validWeeks[weekIdx];
          } else {
            valid = 0;
          }
        }

        if (valid) {
          delete parts.BYMONTH;
        } else {
          delete parts.BYWEEKNO;
        }
      }

      var partCount = Object.keys(parts).length;

      if (partCount == 0) {
        var t = this.dtstart.clone();
        t.year = this.last.year;
        this.days.push(t.day_of_year());
      } else if (partCount == 1 && "BYMONTH" in parts) {
        for (var monthkey in this.by_data.BYMONTH) {
          var t2 = this.dtstart.clone();
          t2.year = aYear;
          t2.month = this.by_data.BYMONTH[monthkey];
          t2.isDate = true;
          this.days.push(t2.day_of_year());
        }
      } else if (partCount == 1 && "BYMONTHDAY" in parts) {
        for (var monthdaykey in this.by_data.BYMONTHDAY) {
          var t2 = this.dtstart.clone();
          t2.day = this.by_data.BYMONTHDAY[monthdaykey];
          t2.year = aYear;
          t2.isDate = true;
          this.days.push(t2.day_of_year());
        }
      } else if (partCount == 2 &&
                 "BYMONTHDAY" in parts &&
                 "BYMONTH" in parts) {
        for (var monthkey in this.by_data.BYMONTH) {
          for (var monthdaykey in this.by_data.BYMONTHDAY) {
            t.day = this.by_data.BYMONTHDAY[monthdaykey];
            t.month = this.by_data.BYMONTH[monthkey];
            t.year = aYear;
            t.isDate = true;

            this.days.push(t.day_of_year());
          }
        }
      } else if (partCount == 1 && "BYWEEKNO" in parts) {
        // TODO unimplemented in libical
      } else if (partCount == 2 &&
                 "BYWEEKNO" in parts &&
                 "BYMONTHDAY" in parts) {
        // TODO unimplemented in libical
      } else if (partCount == 1 && "BYDAY" in parts) {
        this.days = this.days.concat(this.expand_by_day(aYear));
      } else if (partCount == 2 && "BYDAY" in parts && "BYMONTH" in parts) {
        for (var monthkey in this.by_data.BYMONTH) {
          var days_in_month = ICAL.icaltime.days_in_month(month, aYear);

          t.year = aYear;
          t.month = this.by_data.BYMONTH[monthkey];
          t.day = 1;
          t.isDate = true;

          var first_dow = t.day_of_week();
          var doy_offset = t.day_of_year() - 1;

          t.day = days_in_month;
          var last_dow = t.day_of_week();

          if (this.has_by_data("BYSETPOS")) {
            var set_pos_counter = 0;
            var by_month_day = [];
            for (var day = 1; day <= days_in_month; day++) {
              t.day = day;
              if (this.is_day_in_byday(t)) {
                by_month_day.push(day);
              }
            }

            for (var spIndex = 0; spIndex < by_month_day.length; spIndex++) {
              if (this.check_set_position(spIndex + 1) ||
                  this.check_set_position(spIndex - by_month_day.length)) {
                this.days.push(doy_offset + by_month_day[spIndex]);
              }
            }
          } else {
            for (var daycodedkey in this.by_data.BYDAY) {
              var coded_day = this.by_data.BYDAY[daycodedkey];
              var parts = this.rule_day_of_week(coded_day);
              var dow = parts[0];
              var pos = parts[1];

              var first_matching_day = ((dow + 7 - first_dow) % 7) + 1;
              var last_matching_day = days_in_month - ((last_dow + 7 - dow) % 7);

              if (pos == 0) {
                for (var day = first_matching_day; day <= days_in_month; day += 7) {
                  this.days.push(doy_offset + day);
                }
              } else if (pos > 0) {
                month_day = first_matching_day + (pos - 1) * 7;

                if (month_day <= days_in_month) {
                  this.days.push(doy_offset + month_day);
                }
              } else {
                month_day = last_matching_day + (pos + 1) * 7;

                if (month_day > 0) {
                  this.days.push(doy_offset + month_day);
                }
              }
            }
          }
        }
      } else if (partCount == 2 && "BYDAY" in parts && "BYMONTHDAY" in parts) {
        var expandedDays = this.expand_by_day(aYear);

        for (var daykey in expandedDays) {
          var day = expandedDays[daykey];
          var tt = ICAL.icaltime.from_day_of_year(day, aYear);
          if (this.by_data.BYMONTHDAY.indexOf(tt.day) >= 0) {
            this.days.push(day);
          }
        }
      } else if (partCount == 3 &&
                 "BYDAY" in parts &&
                 "BYMONTHDAY" in parts &&
                 "BYMONTH" in parts) {
        var expandedDays = this.expand_by_day(aYear);

        for (var daykey in expandedDays) {
          var day = expandedDays[daykey];
          var tt = ICAL.icaltime.from_day_of_year(day, aYear);

          if (this.by_data.BYMONTH.indexOf(tt.month) >= 0 &&
              this.by_data.BYMONTHDAY.indexOf(tt.day) >= 0) {
            this.days.push(day);
          }
        }
      } else if (partCount == 2 && "BYDAY" in parts && "BYWEEKNO" in parts) {
        var expandedDays = this.expand_by_day(aYear);

        for (var daykey in expandedDays) {
          var day = expandedDays[daykey];
          var tt = ICAL.icaltime.from_day_of_year(day, aYear);
          var weekno = tt.week_number(this.rule.wkst);

          if (this.by_data.BYWEEKNO.indexOf(weekno)) {
            this.days.push(day);
          }
        }
      } else if (partCount == 3 &&
                 "BYDAY" in parts &&
                 "BYWEEKNO" in parts &&
                 "BYMONTHDAY" in parts) {
        // TODO unimplemted in libical
      } else if (partCount == 1 && "BYYEARDAY" in parts) {
        this.days = this.days.concat(this.by_data.BYYEARDAY);
      } else {
        this.days = [];
      }
      return 0;
    },

    expand_by_day: function expand_by_day(aYear) {

      var days_list = [];
      var tmp = this.last.clone();

      tmp.year = aYear;
      tmp.month = 1;
      tmp.day = 1;
      tmp.isDate = true;

      var start_dow = tmp.day_of_week();

      tmp.month = 12;
      tmp.day = 31;
      tmp.isDate = true;

      var end_dow = tmp.day_of_week();
      var end_year_day = tmp.day_of_year();

      for (var daykey in this.by_data.BYDAY) {
        var day = this.by_data.BYDAY[daykey];
        var parts = this.rule_day_of_week(day);
        var pos = parts[0];
        var dow = parts[1];

        if (pos == 0) {
          var tmp_start_doy = ((dow + 7 - start_dow) % 7) + 1;

          for (var doy = tmp_start_doy; doy <= end_year_day; doy += 7) {
            days_list.push(doy);
          }

        } else if (pos > 0) {
          var first;
          if (dow >= start_dow) {
            first = dow - start_dow + 1;
          } else {
            first = dow - start_dow + 8;
          }

          days_list.push(first + (pos - 1) * 7);
        } else {
          var last;
          pos = -pos;

          if (dow <= end_dow) {
            last = end_year_day - end_dow + dow;
          } else {
            last = end_year_day - end_dow + dow - 7;
          }

          days_list.push(last - (pos - 1) * 7);
        }
      }
      return days_list;
    },

    is_day_in_byday: function is_day_in_byday(tt) {
      for (var daykey in this.by_data.BYDAY) {
        var day = this.by_data.BYDAY[daykey];
        var parts = this.rule_day_of_week(day);
        var pos = parts[0];
        var dow = parts[1];
        var this_dow = tt.day_of_week();

        if ((pos == 0 && dow == this_dow) ||
            (tt.nth_weekday(dow, pos) == tt.day)) {
          return 1;
        }
      }

      return 0;
    },

    check_set_position: function check_set_position(aPos) {
      return ("BYSETPOS" in this.by_data &&
              this.by_data.BYSETPOS.indexOf(aPos));
    },

    sort_byday_rules: function icalrecur_sort_byday_rules(aRules, aWeekStart) {
      for (var i = 0; i < aRules.length; i++) {
        for (var j = 0; j < i; j++) {
          var one = this.rule_day_of_week(aRules[j])[1];
          var two = this.rule_day_of_week(aRules[i])[1];
          one -= aWeekStart;
          two -= aWeekStart;
          if (one < 0) one += 7;
          if (two < 0) two += 7;

          if (one > two) {
            var tmp = aRules[i];
            aRules[i] = aRules[j];
            aRules[j] = tmp;
          }
        }
      }
    },

    check_contract_restriction: function check_contract_restriction(aRuleType, v) {
      var indexMapValue = icalrecur_iterator._indexMap[aRuleType];
      var ruleMapValue = icalrecur_iterator._expandMap[this.rule.freq][indexMapValue];
      var pass = false;

      if (aRuleType in this.by_data &&
          ruleMapValue == icalrecur_iterator.CONTRACT) {
        for (var bydatakey in this.by_data[aRuleType]) {
          if (this.by_data[aRuleType][bydatakey] == v) {
            pass = true;
            break;
          }
        }
      } else {
        // Not a contracting byrule or has no data, test passes
        pass = true;
      }
      return pass;
    },

    check_contracting_rules: function check_contracting_rules() {
      var dow = this.last.day_of_week();
      var weekNo = this.last.week_number(this.rule.wkst);
      var doy = this.last.day_of_year();

      return (this.check_contract_restriction("BYSECOND", this.last.second) &&
              this.check_contract_restriction("BYMINUTE", this.last.minute) &&
              this.check_contract_restriction("BYHOUR", this.last.hour) &&
              this.check_contract_restriction("BYDAY", dow) &&
              this.check_contract_restriction("BYWEEKNO", weekNo) &&
              this.check_contract_restriction("BYMONTHDAY", this.last.day) &&
              this.check_contract_restriction("BYMONTH", this.last.month) &&
              this.check_contract_restriction("BYYEARDAY", doy));
    },

    setup_defaults: function setup_defaults(aRuleType, req, deftime) {
      var indexMapValue = icalrecur_iterator._indexMap[aRuleType];
      var ruleMapValue = icalrecur_iterator._expandMap[this.rule.freq][indexMapValue];

      if (ruleMapValue != icalrecur_iterator.CONTRACT) {
        if (!(aRuleType in this.by_data)) {
          this.by_data[aRuleType] = [deftime];
        }
        if (this.rule.freq != req) {
          return this.by_data[aRuleType][0];
        }
      }
      return deftime;
    }
  };

  icalrecur_iterator._wkdayMap = ["", "SU", "MO", "TU", "WE", "TH", "FR", "SA"];

  icalrecur_iterator._indexMap = {
    "BYSECOND": 0,
    "BYMINUTE": 1,
    "BYHOUR": 2,
    "BYDAY": 3,
    "BYMONTHDAY": 4,
    "BYYEARDAY": 5,
    "BYWEEKNO": 6,
    "BYMONTH": 7,
    "BYSETPOS": 8
  };

  icalrecur_iterator._expandMap = {
    "SECONDLY": [1, 1, 1, 1, 1, 1, 1, 1],
    "MINUTELY": [2, 1, 1, 1, 1, 1, 1, 1],
    "HOURLY": [2, 2, 1, 1, 1, 1, 1, 1],
    "DAILY": [2, 2, 2, 1, 1, 1, 1, 1],
    "WEEKLY": [2, 2, 2, 2, 3, 3, 1, 1],
    "MONTHLY": [2, 2, 2, 2, 2, 3, 3, 1],
    "YEARLY": [2, 2, 2, 2, 2, 2, 2, 2]
  };
  icalrecur_iterator.UNKNOWN = 0;
  icalrecur_iterator.CONTRACT = 1;
  icalrecur_iterator.EXPAND = 2;
  icalrecur_iterator.ILLEGAL = 3;
})();
