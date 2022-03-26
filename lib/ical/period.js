/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch */

import Time from "./time.js";
import Duration from "./duration.js";

/**
 * This class represents the "period" value type, with various calculation and manipulation methods.
 *
 * @class
 * @alias ICAL.Period
 */
class Period {
  /**
   * Creates a new {@link ICAL.Period} instance from the passed string.
   *
   * @param {String} str            The string to parse
   * @param {ICAL.Property} prop    The property this period will be on
   * @return {ICAL.Period}          The created period instance
   */
  static fromString(str, prop) {
    let parts = str.split('/');

    if (parts.length !== 2) {
      throw new Error(
        'Invalid string value: "' + str + '" must contain a "/" char.'
      );
    }

    let options = {
      start: Time.fromDateTimeString(parts[0], prop)
    };

    let end = parts[1];

    if (Duration.isValueString(end)) {
      options.duration = Duration.fromString(end);
    } else {
      options.end = Time.fromDateTimeString(end, prop);
    }

    return new Period(options);
  }

  /**
   * Creates a new {@link ICAL.Period} instance from the given data object.
   * The passed data object cannot contain both and end date and a duration.
   *
   * @param {Object} aData                  An object with members of the period
   * @param {ICAL.Time=} aData.start        The start of the period
   * @param {ICAL.Time=} aData.end          The end of the period
   * @param {ICAL.Duration=} aData.duration The duration of the period
   * @return {ICAL.Period}                  The period instance
   */
  static fromData(aData) {
    return new Period(aData);
  }

  /**
   * Returns a new period instance from the given jCal data array. The first
   * member is always the start date string, the second member is either a
   * duration or end date string.
   *
   * @param {Array<String,String>} aData    The jCal data array
   * @param {ICAL.Property} aProp           The property this jCal data is on
   * @param {Boolean} aLenient              If true, data value can be both date and date-time
   * @return {ICAL.Period}                  The period instance
   */
  static fromJSON(aData, aProp, aLenient) {
    function fromDateOrDateTimeString(aValue, dateProp) {
      if (aLenient) {
        return Time.fromString(aValue, dateProp);
      } else {
        return Time.fromDateTimeString(aValue, dateProp);
      }
    }

    if (Duration.isValueString(aData[1])) {
      return Period.fromData({
        start: fromDateOrDateTimeString(aData[0], aProp),
        duration: Duration.fromString(aData[1])
      });
    } else {
      return Period.fromData({
        start: fromDateOrDateTimeString(aData[0], aProp),
        end: fromDateOrDateTimeString(aData[1], aProp)
      });
    }
  }

  /**
   * Creates a new ICAL.Period instance. The passed data object cannot contain both and end date and
   * a duration.
   *
   * @param {Object} aData                  An object with members of the period
   * @param {ICAL.Time=} aData.start        The start of the period
   * @param {ICAL.Time=} aData.end          The end of the period
   * @param {ICAL.Duration=} aData.duration The duration of the period
   */
  constructor(aData) {
    this.wrappedJSObject = this;

    if (aData && 'start' in aData) {
      if (aData.start && !(aData.start instanceof Time)) {
        throw new TypeError('.start must be an instance of ICAL.Time');
      }
      this.start = aData.start;
    }

    if (aData && aData.end && aData.duration) {
      throw new Error('cannot accept both end and duration');
    }

    if (aData && 'end' in aData) {
      if (aData.end && !(aData.end instanceof Time)) {
        throw new TypeError('.end must be an instance of ICAL.Time');
      }
      this.end = aData.end;
    }

    if (aData && 'duration' in aData) {
      if (aData.duration && !(aData.duration instanceof Duration)) {
        throw new TypeError('.duration must be an instance of ICAL.Duration');
      }
      this.duration = aData.duration;
    }
  }


  /**
   * The start of the period
   * @type {ICAL.Time}
   */
  start = null;

  /**
   * The end of the period
   * @type {ICAL.Time}
   */
  end = null;

  /**
   * The duration of the period
   * @type {ICAL.Duration}
   */
  duration = null;

  /**
   * The class identifier.
   * @constant
   * @type {String}
   * @default "icalperiod"
   */
  icalclass = "icalperiod";

  /**
   * The type name, to be used in the jCal object.
   * @constant
   * @type {String}
   * @default "period"
   */
  icaltype = "period";

  /**
   * Returns a clone of the duration object.
   *
   * @return {ICAL.Period}      The cloned object
   */
  clone() {
    return Period.fromData({
      start: this.start ? this.start.clone() : null,
      end: this.end ? this.end.clone() : null,
      duration: this.duration ? this.duration.clone() : null
    });
  }

  /**
   * Calculates the duration of the period, either directly or by subtracting
   * start from end date.
   *
   * @return {ICAL.Duration}      The calculated duration
   */
  getDuration() {
    if (this.duration) {
      return this.duration;
    } else {
      return this.end.subtractDate(this.start);
    }
  }

  /**
   * Calculates the end date of the period, either directly or by adding
   * duration to start date.
   *
   * @return {ICAL.Time}          The calculated end date
   */
  getEnd() {
    if (this.end) {
      return this.end;
    } else {
      let end = this.start.clone();
      end.addDuration(this.duration);
      return end;
    }
  }

  /**
   * The string representation of this period.
   * @return {String}
   */
  toString() {
    return this.start + "/" + (this.end || this.duration);
  }

  /**
   * The jCal representation of this period type.
   * @return {Object}
   */
  toJSON() {
    return [this.start.toString(), (this.end || this.duration).toString()];
  }

  /**
   * The iCalendar string representation of this period.
   * @return {String}
   */
  toICALString() {
    return this.start.toICALString() + "/" +
           (this.end || this.duration).toICALString();
  }
}
export default Period;
