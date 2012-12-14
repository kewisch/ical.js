/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

"use strict";

(typeof(ICAL) === 'undefined')? ICAL = {} : '';
(function() {
  ICAL.Period = function icalperiod(aData) {
    this.wrappedJSObject = this;

    if ('start' in aData) {
      if (!(aData.start instanceof ICAL.Time)) {
        throw new TypeError('.start must be an instance of ICAL.Time');
      }
      this.start = aData.start;
    }

    if ('end' in aData) {
      if (!(aData.end instanceof ICAL.Time)) {
        throw new TypeError('.end must be an instance of ICAL.Time');
      }
      this.end = aData.end;
    }

    if ('duration' in aData) {
      if (!(aData.duration instanceof ICAL.Duration)) {
        throw new TypeError('.start must be an instance of ICAL.Duration');
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

    getDuration: function duration() {
      if (this.duration) {
        return this.duration;
      } else {
        return this.end.subtractDate(this.start);
      }
    },

    toString: function toString() {
      return this.start + "/" + (this.end || this.duration);
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

})();
