/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch */

import { isStrictlyNaN, trunc } from "./helpers.js";

const DURATION_LETTERS = /([PDWHMTS]{1,1})/;
const DATA_PROPS_TO_COPY = ["weeks", "days", "hours", "minutes", "seconds", "isNegative"];

/**
 * This class represents the "duration" value type, with various calculation
 * and manipulation methods.
 *
 * @memberof ICAL
 */
class Duration {
  /**
   * Returns a new ICAL.Duration instance from the passed seconds value.
   *
   * @param {Number} aSeconds       The seconds to create the instance from
   * @return {Duration}             The newly created duration instance
   */
  static fromSeconds(aSeconds) {
    return (new Duration()).fromSeconds(aSeconds);
  }

  /**
   * Checks if the given string is an iCalendar duration value.
   *
   * @param {String} value      The raw ical value
   * @return {Boolean}          True, if the given value is of the
   *                              duration ical type
   */
  static isValueString(string) {
    return (string[0] === 'P' || string[1] === 'P');
  }

  /**
   * Creates a new {@link ICAL.Duration} instance from the passed string.
   *
   * @param {String} aStr       The string to parse
   * @return {Duration}         The created duration instance
   */
  static fromString(aStr) {
    let pos = 0;
    let dict = Object.create(null);
    let chunks = 0;

    while ((pos = aStr.search(DURATION_LETTERS)) !== -1) {
      let type = aStr[pos];
      let numeric = aStr.slice(0, Math.max(0, pos));
      aStr = aStr.slice(pos + 1);

      chunks += parseDurationChunk(type, numeric, dict);
    }

    if (chunks < 2) {
      // There must be at least a chunk with "P" and some unit chunk
      throw new Error(
        'invalid duration value: Not enough duration components in "' + aStr + '"'
      );
    }

    return new Duration(dict);
  }

  /**
   * Creates a new ICAL.Duration instance from the given data object.
   *
   * @param {Object} aData                An object with members of the duration
   * @param {Number=} aData.weeks         Duration in weeks
   * @param {Number=} aData.days          Duration in days
   * @param {Number=} aData.hours         Duration in hours
   * @param {Number=} aData.minutes       Duration in minutes
   * @param {Number=} aData.seconds       Duration in seconds
   * @param {Boolean=} aData.isNegative   If true, the duration is negative
   * @return {Duration}                   The createad duration instance
   */
  static fromData(aData) {
    return new Duration(aData);
  }

  /**
   * Creates a new ICAL.Duration instance.
   *
   * @param {Object} data                 An object with members of the duration
   * @param {Number=} data.weeks          Duration in weeks
   * @param {Number=} data.days           Duration in days
   * @param {Number=} data.hours          Duration in hours
   * @param {Number=} data.minutes        Duration in minutes
   * @param {Number=} data.seconds        Duration in seconds
   * @param {Boolean=} data.isNegative    If true, the duration is negative
   */
  constructor(data) {
    this.wrappedJSObject = this;
    this.fromData(data);
  }

  /**
   * The weeks in this duration
   * @type {Number}
   * @default 0
   */
  weeks = 0;

  /**
   * The days in this duration
   * @type {Number}
   * @default 0
   */
  days = 0;

  /**
   * The days in this duration
   * @type {Number}
   * @default 0
   */
  hours = 0;

  /**
   * The minutes in this duration
   * @type {Number}
   * @default 0
   */
  minutes = 0;

  /**
   * The seconds in this duration
   * @type {Number}
   * @default 0
   */
  seconds = 0;

  /**
   * The seconds in this duration
   * @type {Boolean}
   * @default false
   */
  isNegative = false;

  /**
   * The class identifier.
   * @constant
   * @type {String}
   * @default "icalduration"
   */
  icalclass = "icalduration";

  /**
   * The type name, to be used in the jCal object.
   * @constant
   * @type {String}
   * @default "duration"
   */
  icaltype = "duration";

  /**
   * Returns a clone of the duration object.
   *
   * @return {Duration}      The cloned object
   */
  clone() {
    return Duration.fromData(this);
  }

  /**
   * The duration value expressed as a number of seconds.
   *
   * @return {Number}             The duration value in seconds
   */
  toSeconds() {
    let seconds = this.seconds + 60 * this.minutes + 3600 * this.hours +
                  86400 * this.days + 7 * 86400 * this.weeks;
    return (this.isNegative ? -seconds : seconds);
  }

  /**
   * Reads the passed seconds value into this duration object. Afterwards,
   * members like {@link ICAL.Duration#days days} and {@link ICAL.Duration#weeks weeks} will be set up
   * accordingly.
   *
   * @param {Number} aSeconds     The duration value in seconds
   * @return {Duration}           Returns this instance
   */
  fromSeconds(aSeconds) {
    let secs = Math.abs(aSeconds);

    this.isNegative = (aSeconds < 0);
    this.days = trunc(secs / 86400);

    // If we have a flat number of weeks, use them.
    if (this.days % 7 == 0) {
      this.weeks = this.days / 7;
      this.days = 0;
    } else {
      this.weeks = 0;
    }

    secs -= (this.days + 7 * this.weeks) * 86400;

    this.hours = trunc(secs / 3600);
    secs -= this.hours * 3600;

    this.minutes = trunc(secs / 60);
    secs -= this.minutes * 60;

    this.seconds = secs;
    return this;
  }

  /**
   * Sets up the current instance using members from the passed data object.
   *
   * @param {Object} aData                An object with members of the duration
   * @param {Number=} aData.weeks         Duration in weeks
   * @param {Number=} aData.days          Duration in days
   * @param {Number=} aData.hours         Duration in hours
   * @param {Number=} aData.minutes       Duration in minutes
   * @param {Number=} aData.seconds       Duration in seconds
   * @param {Boolean=} aData.isNegative   If true, the duration is negative
   */
  fromData(aData) {
    for (let prop of DATA_PROPS_TO_COPY) {
      if (aData && prop in aData) {
        this[prop] = aData[prop];
      } else {
        this[prop] = 0;
      }
    }
  }

  /**
   * Resets the duration instance to the default values, i.e. PT0S
   */
  reset() {
    this.isNegative = false;
    this.weeks = 0;
    this.days = 0;
    this.hours = 0;
    this.minutes = 0;
    this.seconds = 0;
  }

  /**
   * Compares the duration instance with another one.
   *
   * @param {Duration} aOther             The instance to compare with
   * @return {Number}                     -1, 0 or 1 for less/equal/greater
   */
  compare(aOther) {
    let thisSeconds = this.toSeconds();
    let otherSeconds = aOther.toSeconds();
    return (thisSeconds > otherSeconds) - (thisSeconds < otherSeconds);
  }

  /**
   * Normalizes the duration instance. For example, a duration with a value
   * of 61 seconds will be normalized to 1 minute and 1 second.
   */
  normalize() {
    this.fromSeconds(this.toSeconds());
  }

  /**
   * The string representation of this duration.
   * @return {String}
   */
  toString() {
    if (this.toSeconds() == 0) {
      return "PT0S";
    } else {
      let str = "";
      if (this.isNegative) str += "-";
      str += "P";
      let hasWeeks = false;
      if (this.weeks) {
        if (this.days || this.hours || this.minutes || this.seconds) {
          str += (this.weeks * 7 + this.days) + "D";
        } else {
          str += (this.weeks + "W");
          hasWeeks = true;
        }
      } else if (this.days) {
        str += (this.days + "D");
      }

      if (!hasWeeks) {
        if (this.hours || this.minutes || this.seconds) {
          str += "T";
          if (this.hours) {
            str += this.hours + "H";
          }

          if (this.minutes) {
            str += this.minutes + "M";
          }

          if (this.seconds) {
            str += this.seconds + "S";
          }
        }
      }

      return str;
    }
  }

  /**
   * The iCalendar string representation of this duration.
   * @return {String}
   */
  toICALString() {
    return this.toString();
  }
}
export default Duration;

/**
 * Internal helper function to handle a chunk of a duration.
 *
 * @private
 * @param {String} letter type of duration chunk
 * @param {String} number numeric value or -/+
 * @param {Object} dict target to assign values to
 */
function parseDurationChunk(letter, number, object) {
  let type;
  switch (letter) {
    case 'P':
      if (number && number === '-') {
        object.isNegative = true;
      } else {
        object.isNegative = false;
      }
      // period
      break;
    case 'D':
      type = 'days';
      break;
    case 'W':
      type = 'weeks';
      break;
    case 'H':
      type = 'hours';
      break;
    case 'M':
      type = 'minutes';
      break;
    case 'S':
      type = 'seconds';
      break;
    default:
      // Not a valid chunk
      return 0;
  }

  if (type) {
    if (!number && number !== 0) {
      throw new Error(
        'invalid duration value: Missing number before "' + letter + '"'
      );
    }
    let num = parseInt(number, 10);
    if (isStrictlyNaN(num)) {
      throw new Error(
        'invalid duration value: Invalid number "' + number + '" before "' + letter + '"'
      );
    }
    object[type] = num;
  }

  return 1;
}
