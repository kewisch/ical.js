/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

"use strict";

(typeof(ICAL) === 'undefined')? ICAL = {} : '';
(function() {
  ICAL.icalperiod = function icalperiod(aData) {
    this.wrappedJSObject = this;
    this.fromData(aData);
  };

  ICAL.icalperiod.prototype = {

    start: null,
    end: null,
    duration: null,
    icalclass: "icalperiod",
    icaltype: "PERIOD",

    getDuration: function duration() {
      if (this.duration) {
        return this.duration;
      } else {
        return this.end.subtractDate(this.start);
      }
    },

    toString: function toString() {
      return this.start + "/" + (this.end || this.duration);
    },

    fromData: function fromData(data) {
      if (data) {
        this.start = ("start" in data ? new ICAL.icaltime(data.start) : null);
        this.end = ("end" in data ? new ICAL.icaltime(data.end) : null);
        this.duration = ("duration" in data ? new ICAL.icalduration(data.duration) : null);
      }
    }
  };

  ICAL.icalperiod.fromString = function fromString(str) {
    var data = ICAL.icalparser.parseValue(str, "PERIOD");
    return ICAL.icalperiod.fromData(data);
  };
  ICAL.icalperiod.fromData = function fromData(aData) {
    return new ICAL.icalperiod(aData);
  };
})();
