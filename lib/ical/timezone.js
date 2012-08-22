/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

(typeof(ICAL) === 'undefined')? ICAL = {} : '';
(function() {
  ICAL.icaltimezone = function icaltimezone(data) {
    this.wrappedJSObject = this;
    this.fromData(data);
  };

  ICAL.icaltimezone.prototype = {

    tzid: "",
    location: "",
    tznames: "",

    latitude: 0.0,
    longitude: 0.0,

    component: null,

    expand_end_year: 0,
    expand_start_year: 0,

    changes: null,
    icalclass: "icaltimezone",

    fromData: function fromData(aData) {
      var propsToCopy = ["tzid", "location", "tznames",
                         "latitude", "longitude"];
      for (var key in propsToCopy) {
        var prop = propsToCopy[key];
        if (aData && prop in aData) {
          this[prop] = aData[prop];
        } else {
          this[prop] = 0;
        }
      }

      this.expand_end_year = 0;
      this.expand_start_year = 0;
      if (aData && "component" in aData) {
        if (typeof aData.component == "string") {
          this.component = this.componentFromString(aData.component);
        } else {
          this.component = ICAL.helpers.clone(aData.component, true);
        }
      } else {
        this.component = null;
      }
      return this;
    },

    componentFromString: function componentFromString(str) {
      this.component = ICAL.toJSON(str, true);
      return this.component;
    },

    utc_offset: function utc_offset(tt) {
      if (this == ICAL.icaltimezone.utc_timezone || this == ICAL.icaltimezone.local_timezone) {
        return 0;
      }

      this.ensure_coverage(tt.year);

      if (!this.changes || this.changes.length == 0) {
        return 0;
      }

      var tt_change = {
        year: tt.year,
        month: tt.month,
        day: tt.day,
        hour: tt.hour,
        minute: tt.minute,
        second: tt.second
      };

      var change_num = this.find_nearby_change(tt_change);
      var change_num_to_use = -1;
      var step = 1;

      for (;;) {
        var change = ICAL.helpers.clone(this.changes[change_num], true);
        if (change.utc_offset < change.prev_utc_offset) {
          ICAL.helpers.dumpn("Adjusting " + change.utc_offset);
          ICAL.icaltimezone.adjust_change(change, 0, 0, 0, change.utc_offset);
        } else {
          ICAL.helpers.dumpn("Adjusting prev " + change.prev_utc_offset);
          ICAL.icaltimezone.adjust_change(change, 0, 0, 0,
                                          change.prev_utc_offset);
        }

        var cmp = ICAL.icaltimezone._compare_change_fn(tt_change, change);
        ICAL.helpers.dumpn("Compare" + cmp + " / " + change.toString());

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

      var zone_change = this.changes[change_num_to_use];
      var utc_offset_change = zone_change.utc_offset - zone_change.prev_utc_offset;

      if (utc_offset_change < 0 && change_num_to_use > 0) {
        var tmp_change = ICAL.helpers.clone(zone_change, true);
        ICAL.icaltimezone.adjust_change(tmp_change, 0, 0, 0,
                                        tmp_change.prev_utc_offset);

        if (ICAL.icaltimezone._compare_change_fn(tt_change, tmp_change) < 0) {
          var prev_zone_change = this.changes[change_num_to_use - 1];

          var want_daylight = false; // TODO

          if (zone_change.is_daylight != want_daylight &&
              prev_zone_change.is_daylight == want_daylight) {
            zone_change = prev_zone_change;
          }
        }
      }

      // TODO return is_daylight?
      return zone_change.utc_offset;
    },

    find_nearby_change: function icaltimezone_find_nearby_change(change) {
      var lower = 0,
        middle = 0;
      var upper = this.changes.length;

      while (lower < upper) {
        middle = ICAL.helpers.trunc(lower + upper / 2);
        var zone_change = this.changes[middle];
        var cmp = ICAL.icaltimezone._compare_change_fn(change, zone_change);
        if (cmp == 0) {
          break;
        } else if (cmp > 0) {
          upper = middle;
        } else {
          lower = middle;
        }
      }

      return middle;
    },

    ensure_coverage: function ensure_coverage(aYear) {
      if (ICAL.icaltimezone._minimum_expansion_year == -1) {
        var today = ICAL.icaltime.now();
        ICAL.icaltimezone._minimum_expansion_year = today.year;
      }

      var changes_end_year = aYear;
      if (changes_end_year < ICAL.icaltimezone._minimum_expansion_year) {
        changes_end_year = ICAL.icaltimezone._minimum_expansion_year;
      }

      changes_end_year += ICAL.icaltimezone.EXTRA_COVERAGE;

      if (changes_end_year > ICAL.icaltimezone.MAX_YEAR) {
        changes_end_year = ICAL.icaltimezone.MAX_YEAR;
      }

      if (!this.changes || this.expand_end_year < aYear) {
        this.expand_changes(changes_end_year);
      }
    },

    expand_changes: function expand_changes(aYear) {
      var changes = [];
      if (this.component) {
        // HACK checking for component only needed for floating
        // tz, which is not in core libical.
        var subcomps = this.component.getAllSubcomponents();
        for (var compkey in subcomps) {
          this.expand_vtimezone(subcomps[compkey], aYear, changes);
        }

        this.changes = changes.concat(this.changes || []);
        this.changes.sort(ICAL.icaltimezone._compare_change_fn);
      }

      this.change_end_year = aYear;
    },

    expand_vtimezone: function expand_vtimezone(aComponent, aYear, changes) {
      if (!aComponent.hasProperty("DTSTART") ||
          !aComponent.hasProperty("TZOFFSETTO") ||
          !aComponent.hasProperty("TZOFFSETFROM")) {
        return null;
      }

      var dtstart = aComponent.getFirstProperty("DTSTART").getFirstValue();

      function convert_tzoffset(offset) {
        return offset.factor * (offset.hours * 3600 + offset.minutes * 60);
      }

      function init_changes() {
        var changebase = {};
        changebase.is_daylight = (aComponent.name == "DAYLIGHT");
        changebase.utc_offset = convert_tzoffset(aComponent.getFirstProperty("TZOFFSETTO").data);
        changebase.prev_utc_offset = convert_tzoffset(aComponent.getFirstProperty("TZOFFSETFROM").data);
        return changebase;
      }

      if (!aComponent.hasProperty("RRULE") && !aComponent.hasProperty("RDATE")) {
        var change = init_changes();
        change.year = dtstart.year;
        change.month = dtstart.month;
        change.day = dtstart.day;
        change.hour = dtstart.hour;
        change.minute = dtstart.minute;
        change.second = dtstart.second;

        ICAL.icaltimezone.adjust_change(change, 0, 0, 0,
                                        -change.prev_utc_offset);
        changes.push(change);
      } else {
        var props = aComponent.getAllProperties("RDATE");
        for (var rdatekey in props) {
          var rdate = props[rdatekey];
          var change = init_changes();
          change.year = rdate.time.year;
          change.month = rdate.time.month;
          change.day = rdate.time.day;

          if (rdate.time.isDate) {
            change.hour = dtstart.hour;
            change.minute = dtstart.minute;
            change.second = dtstart.second;
          } else {
            change.hour = rdate.time.hour;
            change.minute = rdate.time.minute;
            change.second = rdate.time.second;

            if (rdate.time.zone == ICAL.icaltimezone.utc_timezone) {
              ICAL.icaltimezone.adjust_change(change, 0, 0, 0,
                                              -change.prev_utc_offset);
            }
          }

          changes.push(change);
        }

        var rrule = aComponent.getFirstProperty("RRULE").getFirstValue();
        // TODO multiple rrules?

        var change = init_changes();

        if (rrule.until && rrule.until.zone == ICAL.icaltimezone.utc_timezone) {
          rrule.until.adjust(0, 0, 0, change.prev_utc_offset);
          rrule.until.zone = ICAL.icaltimezone.local_timezone;
        }

        var iterator = rrule.iterator(dtstart);

        var occ;
        while ((occ = iterator.next())) {
          var change = init_changes();
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

          ICAL.icaltimezone.adjust_change(change, 0, 0, 0,
                                          -change.prev_utc_offset);
          changes.push(change);
        }
      }

      return changes;
    },

    toString: function toString() {
      return (this.tznames ? this.tznames : this.tzid);
    }

  };

  ICAL.icaltimezone._compare_change_fn = function icaltimezone_compare_change_fn(a, b) {
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
  };

  ICAL.icaltimezone.convert_time = function icaltimezone_convert_time(tt, from_zone, to_zone) {
    if (tt.isDate ||
        from_zone.tzid == to_zone.tzid ||
        from_zone == ICAL.icaltimezone.local_timezone ||
        to_zone == ICAL.icaltimezone.local_timezone) {
      tt.zone = to_zone;
      return tt;
    }

    var utc_offset = from_zone.utc_offset(tt);
    tt.adjust(0, 0, 0, - utc_offset);

    utc_offset = to_zone.utc_offset(tt);
    tt.adjust(0, 0, 0, utc_offset);

    return null;
  };

  ICAL.icaltimezone.fromData = function icaltimezone_fromData(aData) {
    var tt = new ICAL.icaltimezone();
    return tt.fromData(aData);
  };

  ICAL.icaltimezone.utc_timezone = ICAL.icaltimezone.fromData({
    tzid: "UTC"
  });
  ICAL.icaltimezone.local_timezone = ICAL.icaltimezone.fromData({
    tzid: "floating"
  });

  ICAL.icaltimezone.adjust_change = function icaltimezone_adjust_change(change, days, hours, minutes, seconds) {
    return ICAL.icaltime.prototype.adjust.call(change, days, hours, minutes, seconds);
  };

  ICAL.icaltimezone._minimum_expansion_year = -1;
  ICAL.icaltimezone.MAX_YEAR = 2035; // TODO this is because of time_t, which we don't need. Still usefull?
  ICAL.icaltimezone.EXTRA_COVERAGE = 5;
})();
