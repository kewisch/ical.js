/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2015 */


ICAL.UtcOffset = (function() {

  function UtcOffset(aData) {
    this.fromData(aData);
  }

  UtcOffset.prototype = {

    hours: 0,
    minutes: 0,
    factor: 1,

    icaltype: "utc-offset",

    /**
     * Internal uses to indicate that a change has been made and the next read
     * operation must attempt to normalize the value
     *
     * @type {Boolean}
     * @private
     */
    _pendingNormalization: false,

    clone: function() {
      return ICAL.UtcOffset.fromSeconds(this.toSeconds());
    },

    fromData: function(aData) {
      if (aData) {
        for (var key in aData) {
          this[key] = aData[key];
        }
      }
      this._normalize();
    },

    fromSeconds: function(aSeconds) {
      var secs = Math.abs(aSeconds);

      this.factor = aSeconds < 0 ? -1 : 1;
      this.hours = ICAL.helpers.trunc(secs / 3600);

      secs -= (this.hours * 3600);
      this.minutes = ICAL.helpers.trunc(secs / 60);
      return this;
    },

    toSeconds: function() {
      return this.factor * (60 * this.minutes + 3600 * this.hours);
    },

    compare: function icaltime_compare(other) {
      var a = this.toSeconds();
      var b = other.toSeconds();
      return (a > b) - (b > a);
    },

    _normalize: function() {
      // Range: 97200 seconds (with 1 hour inbetween)
      var secs = this.toSeconds();
      var factor = this.factor;
      while (secs < -43200) { // = UTC-12:00
        secs += 97200;
      }
      while (secs > 50400) { // = UTC+14:00
        secs -= 97200;
      }

      this.fromSeconds(secs);

      // Avoid changing the factor when on zero seconds
      if (secs == 0) {
        this.factor = factor;
      }
    },

    toICALString: function() {
      return ICAL.design.icalendar.value['utc-offset'].toICAL(this.toString());
    },

    toString: function toString() {
      return (this.factor == 1 ? "+" : "-") +
              ICAL.helpers.pad2(this.hours) + ':' +
              ICAL.helpers.pad2(this.minutes);
    }
  };

  UtcOffset.fromString = function(aString) {
    // -05:00
    var options = {};
    //TODO: support seconds per rfc5545 ?
    options.factor = (aString[0] === '+') ? 1 : -1;
    options.hours = ICAL.helpers.strictParseInt(aString.substr(1, 2));
    options.minutes = ICAL.helpers.strictParseInt(aString.substr(4, 2));

    return new ICAL.UtcOffset(options);
  };

  UtcOffset.fromSeconds = function(aSeconds) {
    var instance = new UtcOffset();
    instance.fromSeconds(aSeconds);
    return instance;
  };

  return UtcOffset;

}());
