/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

"use strict";

(typeof(ICAL) === 'undefined')? ICAL = {} : '';
(function() {

  var DOW_MAP = {
    SU: ICAL.Time.SUNDAY,
    MO: ICAL.Time.MONDAY,
    TU: ICAL.Time.TUESDAY,
    WE: ICAL.Time.WEDNESDAY,
    TH: ICAL.Time.THURSDAY,
    FR: ICAL.Time.FRIDAY,
    SA: ICAL.Time.SATURDAY
  };

  var REVERSE_DOW_MAP = {};

  for (var key in DOW_MAP) {
    REVERSE_DOW_MAP[DOW_MAP[key]] = key;
  }

  ICAL.Recur = function icalrecur(data) {
    this.wrappedJSObject = this;
    this.parts = {};
    this.fromData(data);
  };

  ICAL.Recur.prototype = {

    parts: null,

    interval: 1,
    wkst: ICAL.Time.MONDAY,
    until: null,
    count: null,
    freq: null,
    icalclass: "icalrecur",
    icaltype: "recur",

    iterator: function(aStart) {
      return new ICAL.RecurIterator({
        rule: this,
        dtstart: aStart
      });
    },

    clone: function clone() {
      return ICAL.Recur.fromData(this);
      //return ICAL.Recur.fromIcalProperty(this.toIcalProperty());
    },

    isFinite: function isfinite() {
      return !!(this.count || this.until);
    },

    isByCount: function isbycount() {
      return !!(this.count && !this.until);
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

    toJSON: function() {
      //XXX: extract this list up to proto?
      var propsToCopy = [
        "freq",
        "count",
        "until",
        "wkst",
        "interval",
        "parts"
      ];

      var result = Object.create(null);

      var i = 0;
      var len = propsToCopy.length;
      var prop;

      for (; i < len; i++) {
        var prop = propsToCopy[i];
        result[prop] = this[prop];
      }

      if (result.until instanceof ICAL.Time) {
        result.until = result.until.toJSON();
      }

      return result;
    },

    fromData: function fromData(aData) {
      var propsToCopy = ["freq", "count", "until", "wkst", "interval"];
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

      // wkst is usually in SU, etc.. format we need
      // to convert it from the string
      if (typeof(this.wkst) === 'string') {
        this.wkst = ICAL.Recur.icalDayToNumericDay(this.wkst);
      }

      // Another hack for multiple construction of until value.
      if (this.until) {
        if (this.until instanceof ICAL.Time) {
          this.until = this.until.clone();
        } else {
          this.until = ICAL.Time.fromData(this.until);
        }
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
      if (this.until ){
        str += ';UNTIL=' + this.until.toString();
      }
      if ('wkst' in this && this.wkst !== ICAL.Time.DEFAULT_WEEK_START) {
        str += ';WKST=' + REVERSE_DOW_MAP[this.wkst];
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
        return ICAL.Property.fromData(valueData);
      } catch (e) {
        ICAL.helpers.dumpn("EICALPROP: " + this.toString() + "//" + e);
        ICAL.helpers.dumpn(e.stack);
        return null;
      }

      return null;
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

  ICAL.Recur.fromData = function icalrecur_fromData(data) {
    return (new ICAL.Recur(data));
  }

  ICAL.Recur.fromString = function icalrecur_fromString(str) {
    var data = ICAL.DecorationParser.parseValue(str, "recur");
    return ICAL.Recur.fromData(data);
  };

  ICAL.Recur.fromIcalProperty = function icalrecur_fromIcalProperty(prop) {
    var recur = new ICAL.Recur();
    recur.fromIcalProperty(prop);
    return recur;
  };

  /**
   * Convert an ical representation of a day (SU, MO, etc..)
   * into a numeric value of that day.
   *
   * @param {String} day ical day.
   * @return {Numeric} numeric value of given day.
   */
  ICAL.Recur.icalDayToNumericDay = function toNumericDay(string) {
    //XXX: this is here so we can deal
    //     with possibly invalid string values.

    return DOW_MAP[string];
  };

})();
