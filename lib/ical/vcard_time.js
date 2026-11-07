/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch */

import UtcOffset from "./utc_offset.js";
import Time from "./time.js";
import Timezone from "./timezone.js";
import design from "./design.js";
import { pad2, strictParseInt } from "./helpers.js";

/**
 * Describes a vCard time, which has slight differences to the ICAL.Time.
 * Properties can be null if not specified, for example for dates with
 * reduced accuracy or truncation.
 *
 * Note that currently not all methods are correctly re-implemented for
 * VCardTime. For example, comparison will have undefined results when some
 * members are null.
 *
 * Also, normalization is not yet implemented for this class!
 *
 * @memberof ICAL
 * @extends {Time}
 */
class VCardTime extends Time {
  /**
   * Returns a new ICAL.VCardTime instance from a date and/or time string.
   *
   * @param {String} aValue     The string to create from
   * @param {String} aIcalType  The type for this instance, e.g. date-and-or-time
   * @return {VCardTime}        The date/time instance
   */
  static fromDateAndOrTimeString(aValue, aIcalType) {
    function parsePart(value) {
      return value ? strictParseInt(value) : null;
    }

    let [dt, tmz] = aValue.split('T');
    let [zone, tm] = tmz ? design.vcard.value.time._splitZone(tmz) : ["", ""];

    let o = {
      year: null,
      month: null,
      day: null,
      hour: null,
      minute: null,
      second: null
    };

    let dateMatch = dt.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?|(\d{2})(\d{2}))?$/);
    if (dateMatch) {
      o.year = parsePart(dateMatch[1]);
      o.month = parsePart(dateMatch[2] || dateMatch[4]);
      o.day = parsePart(dateMatch[3] || dateMatch[5]);
    } else if ((dateMatch = dt.match(/^--(\d{2})(?:-?(\d{2}))?$/))) {
      o.month = parsePart(dateMatch[1]);
      o.day = parsePart(dateMatch[2]);
    } else if ((dateMatch = dt.match(/^---(\d{2})$/))) {
      o.day = parsePart(dateMatch[1]);
    }

    let timeMatch = tm && tm.match(/^(\d{2})(?::?(\d{2}))?(?::?(\d{2}))?$/);
    if (timeMatch) {
      o.hour = parsePart(timeMatch[1]);
      o.minute = parsePart(timeMatch[2]);
      o.second = parsePart(timeMatch[3]);
    } else if ((timeMatch = tm && tm.match(/^-([0-9]{2})(?::?([0-9]{2}))?$/))) {
      o.minute = parsePart(timeMatch[1]);
      o.second = parsePart(timeMatch[2]);
    } else if ((timeMatch = tm && tm.match(/^--([0-9]{2})$/))) {
      o.second = parsePart(timeMatch[1]);
    }

    if (zone == 'Z') {
      zone = Timezone.utcTimezone;
    } else if (zone) {
      zone = zone.replace(/^([+-]\d{2})(\d{2})$/, "$1:$2");
      if (/^[+-]\d{2}(?::\d{2})?$/.test(zone)) {
        if (zone.length == 3) {
          zone += ":00";
        }
        zone = UtcOffset.fromString(zone);
      } else {
        zone = null;
      }
    } else {
      zone = null;
    }

    return new VCardTime(o, zone, aIcalType);
  }


  /**
   * Creates a new ICAL.VCardTime instance.
   *
   * @param {Object} data                           The data for the time instance
   * @param {Number=} data.year                     The year for this date
   * @param {Number=} data.month                    The month for this date
   * @param {Number=} data.day                      The day for this date
   * @param {Number=} data.hour                     The hour for this date
   * @param {Number=} data.minute                   The minute for this date
   * @param {Number=} data.second                   The second for this date
   * @param {Timezone|UtcOffset} zone               The timezone to use
   * @param {String} icaltype                       The type for this date/time object
   */
  constructor(data, zone, icaltype) {
    super(data, zone);
    this._icaltype = icaltype || "date-and-or-time";
  }

  /**
   * The class identifier.
   * @constant
   * @type {String}
   * @default "vcardtime"
   */
  icalclass = "vcardtime";

  /**
   * The type name, to be used in the jCal object.
   * @type {String}
   * @default "date-and-or-time"
   */
  get icaltype() {
    return this._icaltype;
  }

  /**
   * Returns a clone of the vcard date/time object.
   *
   * @return {VCardTime}     The cloned object
   */
  clone() {
    return new VCardTime(this._time, this.zone, this.icaltype);
  }

  _normalize() {
    return this;
  }

  /**
   * @inheritdoc
   */
  utcOffset() {
    if (this.zone instanceof UtcOffset) {
      return this.zone.toSeconds();
    } else {
      return Time.prototype.utcOffset.apply(this, arguments);
    }
  }

  /**
   * Returns an RFC 6350 compliant representation of this object.
   *
   * @return {String}         vcard date/time string
   */
  toICALString() {
    return design.vcard.value[this.icaltype].toICAL(this.toString());
  }

  /**
   * The string representation of this date/time, in jCard form
   * (including : and - separators).
   * @return {String}
   */
  toString() {
    let y = this.year, m = this.month, d = this.day;
    let h = this.hour, mm = this.minute, s = this.second;

    let hasYear = y !== null, hasMonth = m !== null, hasDay = d !== null;
    let hasHour = h !== null, hasMinute = mm !== null, hasSecond = s !== null;

    let datepart = (hasYear ? pad2(y) + (hasMonth || hasDay ? '-' : '') : (hasMonth || hasDay ? '--' : '')) +
                   (hasMonth ? pad2(m) : '') +
                   (hasDay ? '-' + pad2(d) : '');
    let timepart = (hasHour ? pad2(h) : '-') + (hasHour && hasMinute ? ':' : '') +
                   (hasMinute ? pad2(mm) : '') + (!hasHour && !hasMinute ? '-' : '') +
                   (hasMinute && hasSecond ? ':' : '') +
                   (hasSecond ? pad2(s) : '');

    let zone;
    if (this.zone === Timezone.utcTimezone) {
      zone = 'Z';
    } else if (this.zone instanceof UtcOffset) {
      zone = this.zone.toString();
    } else if (this.zone === Timezone.localTimezone) {
      zone = '';
    } else if (this.zone instanceof Timezone) {
      let offset = UtcOffset.fromSeconds(this.zone.utcOffset(this));
      zone = offset.toString();
    } else {
      zone = '';
    }

    switch (this.icaltype) {
      case "time":
        return timepart + zone;
      case "date-and-or-time":
      case "date-time":
        return datepart + (timepart == '--' ? '' : 'T' + timepart + zone);
      case "date":
        return datepart;
    }
    return null;
  }
}
export default VCardTime;
