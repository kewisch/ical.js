/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

"use strict";

(typeof(ICAL) === 'undefined')? ICAL = {} : '';
(function() {
  ICAL.Period = function icalperiod(aData) {
    this.wrappedJSObject = this;

    if (aData && 'start' in aData) {
      if (aData.start && !(aData.start instanceof ICAL.Time)) {
        throw new TypeError('.start must be an instance of ICAL.Time');
      }
      this.start = aData.start;
    }

    if (aData && aData.end && aData.duration) {
      throw new Error('cannot accept both end and duration');
    }

    if (aData && 'end' in aData) {
      if (aData.end && !(aData.end instanceof ICAL.Time)) {
        throw new TypeError('.end must be an instance of ICAL.Time');
      }
      this.end = aData.end;
    }

    if (aData && 'duration' in aData) {
      if (aData.duration && !(aData.duration instanceof ICAL.Duration)) {
        throw new TypeError('.duration must be an instance of ICAL.Duration');
      }
      this.duration = aData.duration;
    }
  };

  ICAL.Period.prototype = {

    start: null,
    end: null,
    duration: null,
    icalclass: "icalperiod",
    icaltype: "period",

    clone: function() {
      return ICAL.Period.fromData({
        start: this.start ? this.start.clone() : null,
        end: this.end ? this.end.clone() : null,
        duration: this.duration ? this.duration.clone() : null
      });
    },

    getDuration: function duration() {
      if (this.duration) {
        return this.duration;
      } else {
        return this.end.subtractDate(this.start);
      }
    },

    getEnd: function() {
      if (this.end) {
        return this.end;
      } else {
        var end = this.start.clone();
        end.addDuration(this.duration);
        return end;
      }
    },

    toString: function toString() {
      return this.start + "/" + (this.end || this.duration);
    },

    toJSON: function() {
      return [this.start.toString(), (this.end || this.duration).toString()];
    },

    toICALString: function() {
      return this.start.toICALString() + "/" +
             (this.end || this.duration).toICALString();
    }
  };

  ICAL.Period.fromString = function fromString(str, prop) {
    var parts = str.split('/');

    if (parts.length !== 2) {
      throw new Error(
        'Invalid string value: "' + str + '" must contain a "/" char.'
      );
    }

    var options = {
      start: ICAL.Time.fromDateTimeString(parts[0], prop)
    };

    var end = parts[1];

    if (ICAL.Duration.isValueString(end)) {
      options.duration = ICAL.Duration.fromString(end);
    } else {
      options.end = ICAL.Time.fromDateTimeString(end, prop);
    }

    return new ICAL.Period(options);
  };

  ICAL.Period.fromData = function fromData(aData) {
    return new ICAL.Period(aData);
  };

  ICAL.Period.fromJSON = function(aData, aProp) {
    if (ICAL.Duration.isValueString(aData[1])) {
      return ICAL.Period.fromData({
        start: ICAL.Time.fromDateTimeString(aData[0], aProp),
        duration: ICAL.Duration.fromString(aData[1])
      });
    } else {
      return ICAL.Period.fromData({
        start: ICAL.Time.fromDateTimeString(aData[0], aProp),
        end: ICAL.Time.fromDateTimeString(aData[1], aProp)
      });
    }
  };
})();
