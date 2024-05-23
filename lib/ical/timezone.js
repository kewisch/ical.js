/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch */

import Time from "./time.js";
import Component from "./component.js";
import ICALParse from "./parse.js";
import { clone, binsearchInsert } from "./helpers.js";

const OPTIONS = ["tzid", "location", "tznames", "latitude", "longitude"];

/**
 * Timezone representation.
 *
 * @example
 * var vcalendar;
 * var timezoneComp = vcalendar.getFirstSubcomponent('vtimezone');
 * var tzid = timezoneComp.getFirstPropertyValue('tzid');
 *
 * var timezone = new ICAL.Timezone({
 *   component: timezoneComp,
 *   tzid
 * });
 *
 * @memberof ICAL
 */
class Timezone {
  static _compare_change_fn(a, b) {
    if (a.year < b.year) return -1;
    else if (a.year > b.year) return 1;

    if (a.month < b.month) return -1;
    else if (a.month > b.month) return 1;

    if (a.day < b.day) return -1;
    else if (a.day > b.day) return 1;

    if (a.hour < b.hour) return -1;
    else if (a.hour > b.hour) return 1;

    if (a.minute < b.minute) return -1;
    else if (a.minute > b.minute) return 1;

    if (a.second < b.second) return -1;
    else if (a.second > b.second) return 1;

    return 0;
  }

  /**
   * Convert the date/time from one zone to the next.
   *
   * @param {Time} tt                  The time to convert
   * @param {Timezone} from_zone       The source zone to convert from
   * @param {Timezone} to_zone         The target zone to convert to
   * @return {Time}                    The converted date/time object
   */
  static convert_time(tt, from_zone, to_zone) {
    if (tt.isDate ||
        from_zone.tzid == to_zone.tzid ||
        from_zone == Timezone.localTimezone ||
        to_zone == Timezone.localTimezone) {
      tt.zone = to_zone;
      return tt;
    }

    let utcOffset = from_zone.utcOffset(tt);
    tt.adjust(0, 0, 0, - utcOffset);

    utcOffset = to_zone.utcOffset(tt);
    tt.adjust(0, 0, 0, utcOffset);

    return null;
  }

  /**
   * Creates a new ICAL.Timezone instance from the passed data object.
   *
   * @param {Component|Object} aData options for class
   * @param {String|Component} aData.component
   *        If aData is a simple object, then this member can be set to either a
   *        string containing the component data, or an already parsed
   *        ICAL.Component
   * @param {String} aData.tzid      The timezone identifier
   * @param {String} aData.location  The timezone locationw
   * @param {String} aData.tznames   An alternative string representation of the
   *                                  timezone
   * @param {Number} aData.latitude  The latitude of the timezone
   * @param {Number} aData.longitude The longitude of the timezone
   */
  static fromData(aData) {
    let tt = new Timezone();
    return tt.fromData(aData);
  }

  /**
   * The instance describing the UTC timezone
   * @type {Timezone}
   * @constant
   * @instance
   */
  static #utcTimezone = null;
  static get utcTimezone() {
    if (!this.#utcTimezone) {
      this.#utcTimezone = Timezone.fromData({
        tzid: "UTC"
      });
    }
    return this.#utcTimezone;
  }

  /**
   * The instance describing the local timezone
   * @type {Timezone}
   * @constant
   * @instance
   */
  static #localTimezone = null;
  static get localTimezone() {
    if (!this.#localTimezone) {
      this.#localTimezone = Timezone.fromData({
        tzid: "floating"
      });
    }
    return this.#localTimezone;
  }

  /**
   * Adjust a timezone change object.
   * @private
   * @param {Object} change     The timezone change object
   * @param {Number} days       The extra amount of days
   * @param {Number} hours      The extra amount of hours
   * @param {Number} minutes    The extra amount of minutes
   * @param {Number} seconds    The extra amount of seconds
   */
  static adjust_change(change, days, hours, minutes, seconds) {
    return Time.prototype.adjust.call(
      change,
      days,
      hours,
      minutes,
      seconds,
      change
    );
  }

  static _minimumExpansionYear = -1;
  static EXTRA_COVERAGE = 5;

  /**
   * Creates a new ICAL.Timezone instance, by passing in a tzid and component.
   *
   * @param {Component|Object} data options for class
   * @param {String|Component} data.component
   *        If data is a simple object, then this member can be set to either a
   *        string containing the component data, or an already parsed
   *        ICAL.Component
   * @param {String} data.tzid      The timezone identifier
   * @param {String} data.location  The timezone locationw
   * @param {String} data.tznames   An alternative string representation of the
   *                                  timezone
   * @param {Number} data.latitude  The latitude of the timezone
   * @param {Number} data.longitude The longitude of the timezone
   */
  constructor(data) {
    this.wrappedJSObject = this;
    this.fromData(data);
  }


  /**
   * Timezone identifier
   * @type {String}
   */
  tzid = "";

  /**
   * Timezone location
   * @type {String}
   */
  location = "";

  /**
   * Alternative timezone name, for the string representation
   * @type {String}
   */
  tznames = "";

  /**
   * The primary latitude for the timezone.
   * @type {Number}
   */
  latitude = 0.0;

  /**
   * The primary longitude for the timezone.
   * @type {Number}
   */
  longitude = 0.0;

  /**
   * The vtimezone component for this timezone.
   * @type {Component}
   */
  component = null;

  /**
   * The year this timezone has been expanded to. All timezone transition
   * dates until this year are known and can be used for calculation
   *
   * @private
   * @type {Number}
   */
  expandedUntilYear = 0;

  /**
   * The class identifier.
   * @constant
   * @type {String}
   * @default "icaltimezone"
   */
  icalclass = "icaltimezone";

  /**
   * Sets up the current instance using members from the passed data object.
   *
   * @param {Component|Object} aData options for class
   * @param {String|Component} aData.component
   *        If aData is a simple object, then this member can be set to either a
   *        string containing the component data, or an already parsed
   *        ICAL.Component
   * @param {String} aData.tzid      The timezone identifier
   * @param {String} aData.location  The timezone locationw
   * @param {String} aData.tznames   An alternative string representation of the
   *                                  timezone
   * @param {Number} aData.latitude  The latitude of the timezone
   * @param {Number} aData.longitude The longitude of the timezone
   */
  fromData(aData) {
    this.expandedUntilYear = 0;
    this.changes = [];

    if (aData instanceof Component) {
      // Either a component is passed directly
      this.component = aData;
    } else {
      // Otherwise the component may be in the data object
      if (aData && "component" in aData) {
        if (typeof aData.component == "string") {
          // If a string was passed, parse it as a component
          let jCal = ICALParse(aData.component);
          this.component = new Component(jCal);
        } else if (aData.component instanceof Component) {
          // If it was a component already, then just set it
          this.component = aData.component;
        } else {
          // Otherwise just null out the component
          this.component = null;
        }
      }

      // Copy remaining passed properties
      for (let prop of OPTIONS) {
        if (aData && prop in aData) {
          this[prop] = aData[prop];
        }
      }
    }

    // If we have a component but no TZID, attempt to get it from the
    // component's properties.
    if (this.component instanceof Component && !this.tzid) {
      this.tzid = this.component.getFirstPropertyValue('tzid');
    }

    return this;
  }

  /**
   * Finds the utcOffset the given time would occur in this timezone.
   *
   * @param {Time} tt         The time to check for
   * @return {Number}         utc offset in seconds
   */
  utcOffset(tt) {
    if (this == Timezone.utcTimezone || this == Timezone.localTimezone) {
      return 0;
    }

    this._ensureCoverage(tt.year);

    if (!this.changes.length) {
      return 0;
    }

    let tt_change = {
      year: tt.year,
      month: tt.month,
      day: tt.day,
      hour: tt.hour,
      minute: tt.minute,
      second: tt.second
    };

    let change_num = this._findNearbyChange(tt_change);
    let change_num_to_use = -1;
    let step = 1;

    // TODO: replace with bin search?
    for (;;) {
      let change = clone(this.changes[change_num], true);
      if (change.utcOffset < change.prevUtcOffset) {
        Timezone.adjust_change(change, 0, 0, 0, change.utcOffset);
      } else {
        Timezone.adjust_change(change, 0, 0, 0,
                                        change.prevUtcOffset);
      }

      let cmp = Timezone._compare_change_fn(tt_change, change);

      if (cmp >= 0) {
        change_num_to_use = change_num;
      } else {
        step = -1;
      }

      if (step == -1 && change_num_to_use != -1) {
        break;
      }

      change_num += step;

      if (change_num < 0) {
        return 0;
      }

      if (change_num >= this.changes.length) {
        break;
      }
    }

    let zone_change = this.changes[change_num_to_use];
    let utcOffset_change = zone_change.utcOffset - zone_change.prevUtcOffset;

    if (utcOffset_change < 0 && change_num_to_use > 0) {
      let tmp_change = clone(zone_change, true);
      Timezone.adjust_change(tmp_change, 0, 0, 0, tmp_change.prevUtcOffset);

      if (Timezone._compare_change_fn(tt_change, tmp_change) < 0) {
        let prev_zone_change = this.changes[change_num_to_use - 1];

        let want_daylight = false; // TODO

        if (zone_change.is_daylight != want_daylight &&
            prev_zone_change.is_daylight == want_daylight) {
          zone_change = prev_zone_change;
        }
      }
    }

    // TODO return is_daylight?
    return zone_change.utcOffset;
  }

  _findNearbyChange(change) {
    // find the closest match
    let idx = binsearchInsert(
      this.changes,
      change,
      Timezone._compare_change_fn
    );

    if (idx >= this.changes.length) {
      return this.changes.length - 1;
    }

    return idx;
  }

  _ensureCoverage(aYear) {
    if (Timezone._minimumExpansionYear == -1) {
      let today = Time.now();
      Timezone._minimumExpansionYear = today.year;
    }

    let changesEndYear = aYear;
    if (changesEndYear < Timezone._minimumExpansionYear) {
      changesEndYear = Timezone._minimumExpansionYear;
    }

    changesEndYear += Timezone.EXTRA_COVERAGE;

    if (!this.changes.length || this.expandedUntilYear < aYear) {
      let subcomps = this.component.getAllSubcomponents();
      let compLen = subcomps.length;
      let compIdx = 0;

      for (; compIdx < compLen; compIdx++) {
        this._expandComponent(
          subcomps[compIdx], changesEndYear, this.changes
        );
      }

      this.changes.sort(Timezone._compare_change_fn);
      this.expandedUntilYear = changesEndYear;
    }
  }

  _expandComponent(aComponent, aYear, changes) {
    if (!aComponent.hasProperty("dtstart") ||
        !aComponent.hasProperty("tzoffsetto") ||
        !aComponent.hasProperty("tzoffsetfrom")) {
      return null;
    }

    let dtstart = aComponent.getFirstProperty("dtstart").getFirstValue();
    let change;

    function convert_tzoffset(offset) {
      return offset.factor * (offset.hours * 3600 + offset.minutes * 60);
    }

    function init_changes() {
      let changebase = {};
      changebase.is_daylight = (aComponent.name == "daylight");
      changebase.utcOffset = convert_tzoffset(
        aComponent.getFirstProperty("tzoffsetto").getFirstValue()
      );

      changebase.prevUtcOffset = convert_tzoffset(
        aComponent.getFirstProperty("tzoffsetfrom").getFirstValue()
      );

      return changebase;
    }

    if (!aComponent.hasProperty("rrule") && !aComponent.hasProperty("rdate")) {
      change = init_changes();
      change.year = dtstart.year;
      change.month = dtstart.month;
      change.day = dtstart.day;
      change.hour = dtstart.hour;
      change.minute = dtstart.minute;
      change.second = dtstart.second;

      Timezone.adjust_change(change, 0, 0, 0, -change.prevUtcOffset);
      changes.push(change);
    } else {
      let props = aComponent.getAllProperties("rdate");
      for (let rdate of props) {
        let time = rdate.getFirstValue();
        change = init_changes();

        change.year = time.year;
        change.month = time.month;
        change.day = time.day;

        if (time.isDate) {
          change.hour = dtstart.hour;
          change.minute = dtstart.minute;
          change.second = dtstart.second;

          if (dtstart.zone != Timezone.utcTimezone) {
            Timezone.adjust_change(change, 0, 0, 0, -change.prevUtcOffset);
          }
        } else {
          change.hour = time.hour;
          change.minute = time.minute;
          change.second = time.second;

          if (time.zone != Timezone.utcTimezone) {
            Timezone.adjust_change(change, 0, 0, 0, -change.prevUtcOffset);
          }
        }

        changes.push(change);
      }

      let rrule = aComponent.getFirstProperty("rrule");

      if (rrule) {
        rrule = rrule.getFirstValue();
        change = init_changes();

        if (rrule.until && rrule.until.zone == Timezone.utcTimezone) {
          rrule.until.adjust(0, 0, 0, change.prevUtcOffset);
          rrule.until.zone = Timezone.localTimezone;
        }

        let iterator = rrule.iterator(dtstart);

        let occ;
        while ((occ = iterator.next())) {
          change = init_changes();
          if (occ.year > aYear || !occ) {
            break;
          }

          change.year = occ.year;
          change.month = occ.month;
          change.day = occ.day;
          change.hour = occ.hour;
          change.minute = occ.minute;
          change.second = occ.second;
          change.isDate = occ.isDate;

          Timezone.adjust_change(change, 0, 0, 0, -change.prevUtcOffset);
          changes.push(change);
        }
      }
    }

    return changes;
  }

  /**
   * The string representation of this timezone.
   * @return {String}
   */
  toString() {
    return (this.tznames ? this.tznames : this.tzid);
  }
}
export default Timezone;
