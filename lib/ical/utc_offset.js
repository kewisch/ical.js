/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2015 */

import { strictParseInt, trunc, pad2 } from "./helpers.js";
import design from "./design.js";

/**
 * This symbol is further described later on
 * @ignore
 */
export default class UtcOffset {
  /**
   * Creates a new {@link ICAL.UtcOffset} instance from the passed string.
   *
   * @param {String} aString    The string to parse
   * @return {ICAL.Duration}    The created utc-offset instance
   */
  static fromString(aString) {
    // -05:00
    var options = {};
    //TODO: support seconds per rfc5545 ?
    options.factor = (aString[0] === '+') ? 1 : -1;
    options.hours = strictParseInt(aString.substr(1, 2));
    options.minutes = strictParseInt(aString.substr(4, 2));

    return new UtcOffset(options);
  }

  /**
   * Creates a new {@link ICAL.UtcOffset} instance from the passed seconds
   * value.
   *
   * @param {Number} aSeconds       The number of seconds to convert
   */
  static fromSeconds(aSeconds) {
    var instance = new UtcOffset();
    instance.fromSeconds(aSeconds);
    return instance;
  }

  /**
   * @classdesc
   * This class represents the "duration" value type, with various calculation
   * and manipulation methods.
   *
   * @class
   * @alias ICAL.UtcOffset
   * @param {Object} aData          An object with members of the utc offset
   * @param {Number=} aData.hours   The hours for the utc offset
   * @param {Number=} aData.minutes The minutes in the utc offset
   * @param {Number=} aData.factor  The factor for the utc-offset, either -1 or 1
   */
  constructor(aData) {
    this.fromData(aData);
  }

  /**
   * The hours in the utc-offset
   * @type {Number}
   */
  hours = 0;

  /**
   * The minutes in the utc-offset
   * @type {Number}
   */
  minutes = 0;

  /**
   * The sign of the utc offset, 1 for positive offset, -1 for negative
   * offsets.
   * @type {Number}
   */
  factor = 1;

  /**
   * The type name, to be used in the jCal object.
   * @constant
   * @type {String}
   * @default "utc-offset"
   */
  icaltype = "utc-offset";

  /**
   * Returns a clone of the utc offset object.
   *
   * @return {ICAL.UtcOffset}     The cloned object
   */
  clone() {
    return UtcOffset.fromSeconds(this.toSeconds());
  }

  /**
   * Sets up the current instance using members from the passed data object.
   *
   * @param {Object} aData          An object with members of the utc offset
   * @param {Number=} aData.hours   The hours for the utc offset
   * @param {Number=} aData.minutes The minutes in the utc offset
   * @param {Number=} aData.factor  The factor for the utc-offset, either -1 or 1
   */
  fromData(aData) {
    if (aData) {
      for (var key in aData) {
        /* istanbul ignore else */
        if (aData.hasOwnProperty(key)) {
          this[key] = aData[key];
        }
      }
    }
    this._normalize();
  }

  /**
   * Sets up the current instance from the given seconds value. The seconds
   * value is truncated to the minute. Offsets are wrapped when the world
   * ends, the hour after UTC+14:00 is UTC-12:00.
   *
   * @param {Number} aSeconds         The seconds to convert into an offset
   */
  fromSeconds(aSeconds) {
    var secs = Math.abs(aSeconds);

    this.factor = aSeconds < 0 ? -1 : 1;
    this.hours = trunc(secs / 3600);

    secs -= (this.hours * 3600);
    this.minutes = trunc(secs / 60);
    return this;
  }

  /**
   * Convert the current offset to a value in seconds
   *
   * @return {Number}                 The offset in seconds
   */
  toSeconds() {
    return this.factor * (60 * this.minutes + 3600 * this.hours);
  }

  /**
   * Compare this utc offset with another one.
   *
   * @param {ICAL.UtcOffset} other        The other offset to compare with
   * @return {Number}                     -1, 0 or 1 for less/equal/greater
   */
  compare(other) {
    var a = this.toSeconds();
    var b = other.toSeconds();
    return (a > b) - (b > a);
  }

  _normalize() {
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
  }

  /**
   * The iCalendar string representation of this utc-offset.
   * @return {String}
   */
  toICALString() {
    return design.icalendar.value['utc-offset'].toICAL(this.toString());
  }

  /**
   * The string representation of this utc-offset.
   * @return {String}
   */
  toString() {
    return (this.factor == 1 ? "+" : "-") + pad2(this.hours) + ':' + pad2(this.minutes);
  }
}
