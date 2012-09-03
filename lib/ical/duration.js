/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

"use strict";

(typeof(ICAL) === 'undefined')? ICAL = {} : '';
(function() {
  ICAL.icalduration = function icalduration(data) {
    this.wrappedJSObject = this;
    this.fromData(data);
  };

  ICAL.icalduration.prototype = {

    weeks: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isNegative: false,
    icalclass: "icalduration",
    icaltype: "DURATION",

    clone: function clone() {
      return ICAL.icalduration.fromData(this);
    },

    toSeconds: function toSeconds() {
      var seconds = this.seconds + 60 * this.minutes + 3600 * this.hours +
                    86400 * this.days + 7 * 86400 * this.weeks;
      return (this.isNegative ? -seconds : seconds);
    },

    fromSeconds: function fromSeconds(aSeconds) {
      var secs = Math.abs(aSeconds);

      this.isNegative = (aSeconds < 0);
      this.days = ICAL.helpers.trunc(secs / 86400);

      // If we have a flat number of weeks, use them.
      if (this.days % 7 == 0) {
        this.weeks = this.days / 7;
        this.days = 0;
      } else {
        this.weeks = 0;
      }

      secs -= (this.days + 7 * this.weeks) * 86400;

      this.hours = ICAL.helpers.trunc(secs / 3600);
      secs -= this.hours * 3600;

      this.minutes = ICAL.helpers.trunc(secs / 60);
      secs -= this.minutes * 60;

      this.seconds = secs;
      return this;
    },

    fromData: function fromData(aData) {
      var propsToCopy = ["weeks", "days", "hours",
                         "minutes", "seconds", "isNegative"];
      for (var key in propsToCopy) {
        var prop = propsToCopy[key];
        if (aData && prop in aData) {
          this[prop] = aData[prop];
        } else {
          this[prop] = 0;
        }
      }

      if (aData && "factor" in aData) {
        this.isNegative = (aData.factor == "-1");
      }
    },

    reset: function reset() {
      this.isNegative = false;
      this.weeks = 0;
      this.days = 0;
      this.hours = 0;
      this.minutes = 0;
      this.seconds = 0;
    },

    compare: function compare(aOther) {
      var thisSeconds = this.toSeconds();
      var otherSeconds = aOther.toSeconds();
      return (thisSeconds > otherSeconds) - (thisSeconds < otherSeconds);
    },

    normalize: function normalize() {
      this.fromSeconds(this.toSeconds());
      return this;
    },

    toString: function toString() {
      if (this.toSeconds() == 0) {
        return "PT0S";
      } else {
        var str = "";
        if (this.isNegative) str += "-";
        str += "P";
        if (this.weeks) str += this.weeks + "W";
        if (this.days) str += this.days + "D";

        if (this.hours || this.minutes || this.seconds) {
          str += "T";
          if (this.hours) str += this.hours + "H";
          if (this.minutes) str += this.minutes + "M";
          if (this.seconds) str += this.seconds + "S";
        }
        return str;
      }
    }
  };

  ICAL.icalduration.fromSeconds = function icalduration_from_seconds(aSeconds) {
    return (new ICAL.icalduration()).fromSeconds();
  };

  ICAL.icalduration.fromString = function icalduration_from_string(aStr) {
    var data = ICAL.icalparser.parseValue(aStr, "DURATION");
    return ICAL.icalduration.fromData(data);
  };

  ICAL.icalduration.fromData = function icalduration_from_data(aData) {
    return new ICAL.icalduration(aData);
  };
})();
