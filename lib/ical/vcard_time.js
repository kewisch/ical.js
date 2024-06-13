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
 * @extends {ICAL.Time}
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
    function part(v, s, e) {
      return v ? strictParseInt(v.slice(s, s + e)) : null;
    }
    let parts = aValue.split('T');
    let dt = parts[0], tmz = parts[1];
    let splitzone = tmz ? design.vcard.value.time._splitZone(tmz) : [];
    let zone = splitzone[0], tm = splitzone[1];

    let dtlen = dt ? dt.length : 0;
    let tmlen = tm ? tm.length : 0;

    let hasDashDate = dt && dt[0] == '-' && dt[1] == '-';
    let hasDashTime = tm && tm[0] == '-';

    let o = {
      year: hasDashDate ? null : part(dt, 0, 4),
      month: hasDashDate && (dtlen == 4 || dtlen == 7) ? part(dt, 2, 2) : dtlen == 7 ? part(dt, 5, 2) : dtlen == 10 ? part(dt, 5, 2) : null,
      day: dtlen == 5 ? part(dt, 3, 2) : dtlen == 7 && hasDashDate ? part(dt, 5, 2) : dtlen == 10 ? part(dt, 8, 2) : null,

      hour: hasDashTime ? null : part(tm, 0, 2),
      minute: hasDashTime && tmlen == 3 ? part(tm, 1, 2) : tmlen > 4 ? hasDashTime ? part(tm, 1, 2) : part(tm, 3, 2) : null,
      second: tmlen == 4 ? part(tm, 2, 2) : tmlen == 6 ? part(tm, 4, 2) : tmlen == 8 ? part(tm, 6, 2) : null
    };

    if (zone == 'Z') {
      zone = Timezone.utcTimezone;
    } else if (zone && zone[3] == ':') {
      zone = UtcOffset.fromString(zone);
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
    this.icaltype = icaltype || "date-and-or-time";
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
  icaltype = "date-and-or-time";

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
