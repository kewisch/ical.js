/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

"use strict";

(typeof(ICAL) === 'undefined')? ICAL = {} : '';
(function() {

  /**
   * Time representation (similar to JS Date object).
   * Fully independent of system (OS) timezone / time.
   * Unlike JS Date month start at 1 (Jan) not zero.
   *
   *
   *    var time = new ICAL.Time({
   *      year: 2012,
   *      month: 10,
   *      day: 11
   *      minute: 0,
   *      second: 0,
   *      isDate: false
   *    });
   *
   *
   * @param {Object} data initialization time.
   * @param {ICAL.Timezone} zone timezone this position occurs in.
   */
  ICAL.Time = function icaltime(data, zone) {
    this.wrappedJSObject = this;
    var time = this._time = Object.create(null);

    /* time defaults */
    time.year = 0;
    time.month = 1;
    time.day = 1;
    time.hour = 0;
    time.minute = 0;
    time.second = 0;
    time.isDate = false;

    this.fromData(data, zone);
  };

  ICAL.Time.prototype = {

    icalclass: "icaltime",

    // is read only strictly defined by isDate
    get icaltype() {
      return this.isDate ? 'date' : 'date-time';
    },

    /**
     * @type ICAL.Timezone
     */
    zone: null,

    /**
     * Internal uses to indicate that a change has been
     * made and the next read operation must attempt to
     * normalize the value (for example changing the day to 33).
     *
     * @type Boolean
     * @private
     */
    _pendingNormalization: false,

    clone: function icaltime_clone() {
      return new ICAL.Time(this._time, this.zone);
    },

    reset: function icaltime_reset() {
      this.fromData(ICAL.Time.epochTime);
      this.zone = ICAL.Timezone.utcTimezone;
    },

    resetTo: function icaltime_resetTo(year, month, day,
                                       hour, minute, second, timezone) {
      this.fromData({
        year: year,
        month: month,
        day: day,
        hour: hour,
        minute: minute,
        second: second,
        zone: timezone
      });
    },

    fromString: function icaltime_fromString(str) {
      var data;
      try {
        data = ICAL.DecorationParser.parseValue(str, "date");
        data.isDate = true;
      } catch (e) {
        data = ICAL.DecorationParser.parseValue(str, "date-time");
        data.isDate = false;
      }
      return this.fromData(data);
    },

    fromJSDate: function icaltime_fromJSDate(aDate, useUTC) {
      if (!aDate) {
        this.reset();
      } else {
        if (useUTC) {
          this.zone = ICAL.Timezone.utcTimezone;
          this.year = aDate.getUTCFullYear();
          this.month = aDate.getUTCMonth() + 1;
          this.day = aDate.getUTCDate();
          this.hour = aDate.getUTCHours();
          this.minute = aDate.getUTCMinutes();
          this.second = aDate.getUTCSeconds();
        } else {
          this.zone = ICAL.Timezone.localTimezone;
          this.year = aDate.getFullYear();
          this.month = aDate.getMonth() + 1;
          this.day = aDate.getDate();
          this.hour = aDate.getHours();
          this.minute = aDate.getMinutes();
          this.second = aDate.getSeconds();
        }
      }
      return this;
    },

    fromData: function fromData(aData, aZone) {
      for (var key in aData) {
        // ical type cannot be set
        if (key === 'icaltype') continue;
        this[key] = aData[key];
      }

      if (aZone) {
        this.zone = aZone;
      }

      if (aData && !("isDate" in aData)) {
        this.isDate = !("hour" in aData);
      } else if (aData && ("isDate" in aData)) {
        this.isDate = aData.isDate;
      }

      if (aData && "timezone" in aData) {
        var zone = ICAL.TimezoneService.get(
          aData.timezone
        );

        this.zone = zone || ICAL.Timezone.localTimezone;
      }

      if (aData && "zone" in aData) {
        this.zone = aData.zone;
      }

      if (!this.zone) {
        this.zone = ICAL.Timezone.localTimezone;
      }

      return this;
    },

    dayOfWeek: function icaltime_dayOfWeek() {
      // Using Zeller's algorithm
      var q = this.day;
      var m = this.month + (this.month < 3 ? 12 : 0);
      var Y = this.year - (this.month < 3 ? 1 : 0);

      var h = (q + Y + ICAL.helpers.trunc(((m + 1) * 26) / 10) + ICAL.helpers.trunc(Y / 4));
      if (true /* gregorian */) {
        h += ICAL.helpers.trunc(Y / 100) * 6 + ICAL.helpers.trunc(Y / 400);
      } else {
        h += 5;
      }

      // Normalize to 1 = sunday
      h = ((h + 6) % 7) + 1;
      return h;
    },

    dayOfYear: function icaltime_dayOfYear() {
      var is_leap = (ICAL.Time.is_leap_year(this.year) ? 1 : 0);
      var diypm = ICAL.Time._days_in_year_passed_month;
      return diypm[is_leap][this.month - 1] + this.day;
    },

    startOfWeek: function startOfWeek() {
      var result = this.clone();
      result.day -= this.dayOfWeek() - 1;
      return result;
    },

    endOfWeek: function endOfWeek() {
      var result = this.clone();
      result.day += 7 - this.dayOfWeek();
      return result;
    },

    startOfMonth: function startOfMonth() {
      var result = this.clone();
      result.day = 1;
      result.isDate = true;
      result.hour = 0;
      result.minute = 0;
      result.second = 0;
      return result;
    },

    endOfMonth: function endOfMonth() {
      var result = this.clone();
      result.day = ICAL.Time.daysInMonth(result.month, result.year);
      result.isDate = true;
      result.hour = 0;
      result.minute = 0;
      result.second = 0;
      return result;
    },

    startOfYear: function startOfYear() {
      var result = this.clone();
      result.day = 1;
      result.month = 1;
      result.isDate = true;
      result.hour = 0;
      result.minute = 0;
      result.second = 0;
      return result;
    },

    endOfYear: function endOfYear() {
      var result = this.clone();
      result.day = 31;
      result.month = 12;
      result.isDate = true;
      result.hour = 0;
      result.minute = 0;
      result.second = 0;
      return result;
    },

    startDoyWeek: function startDoyWeek(aFirstDayOfWeek) {
      var firstDow = aFirstDayOfWeek || ICAL.Time.SUNDAY;
      var delta = this.dayOfWeek() - firstDow;
      if (delta < 0) delta += 7;
      return this.dayOfYear() - delta;
    },

    /**
     * Finds the nthWeekDay relative to the current month (not day).
     * The returned value is a day relative the month that this
     * month belongs to so 1 would indicate the first of the month
     * and 40 would indicate a day in the following month.
     *
     * @param {Numeric} aDayOfWeek day of the week see the day name constants.
     * @param {Numeric} aPos nth occurrence of a given week day
     *                       values of 1 and 0 both indicate the first
     *                       weekday of that type. aPos may be either positive
     *                       or negative.
     *
     * @return {Numeric} numeric value indicating a day relative
     *                   to the current month of this time object.
     */
    nthWeekDay: function icaltime_nthWeekDay(aDayOfWeek, aPos) {
      var daysInMonth = ICAL.Time.daysInMonth(this.month, this.year);
      var weekday;
      var pos = aPos;

      var start = 0;

      var otherDay = this.clone();

      if (pos >= 0) {
        otherDay.day = 1;

        // because 0 means no position has been given
        // 1 and 0 indicate the same day.
        if (pos != 0) {
          // remove the extra numeric value
          pos--;
        }

        // set current start offset to current day.
        start = otherDay.day;

        // find the current day of week
        var startDow = otherDay.dayOfWeek();

        // calculate the difference between current
        // day of the week and desired day of the week
        var offset = aDayOfWeek - startDow;


        // if the offset goes into the past
        // week we add 7 so its goes into the next
        // week. We only want to go forward in time here.
        if (offset < 0)
          // this is really important otherwise we would
          // end up with dates from in the past.
          offset += 7;

        // add offset to start so start is the same
        // day of the week as the desired day of week.
        start += offset;

        // because we are going to add (and multiply)
        // the numeric value of the day we subtract it
        // from the start position so not to add it twice.
        start -= aDayOfWeek;

        // set week day
        weekday = aDayOfWeek;
      } else {

        // then we set it to the last day in the current month
        otherDay.day = daysInMonth;

        // find the ends weekday
        var endDow = otherDay.dayOfWeek();

        pos++;

        weekday = (endDow - aDayOfWeek);

        if (weekday < 0) {
          weekday += 7;
        }

        weekday = daysInMonth - weekday;
      }

      weekday += pos * 7;

      return start + weekday;
    },

    /**
     * Checks if current time is the nthWeekDay.
     * Relative to the current month.
     *
     * Will always return false when rule resolves
     * outside of current month.
     *
     * @param {Numeric} aDayOfWeek day of week.
     * @param {Numeric} aPos position.
     * @param {Numeric} aMax maximum valid day.
     */
    isNthWeekDay: function(aDayOfWeek, aPos) {
      var dow = this.dayOfWeek();

      if (aPos === 0 && dow === aDayOfWeek) {
        return true;
      }

      // get pos
      var day = this.nthWeekDay(aDayOfWeek, aPos);

      if (day === this.day) {
        return true;
      }

      return false;
    },

    weekNumber: function weekNumber(aWeekStart) {
      // This function courtesty of Julian Bucknall, published under the MIT license
      // http://www.boyet.com/articles/publishedarticles/calculatingtheisoweeknumb.html
      var doy = this.dayOfYear();
      var dow = this.dayOfWeek();
      var year = this.year;
      var week1;

      var dt = this.clone();
      dt.isDate = true;
      var first_dow = dt.dayOfWeek();
      var isoyear = this.year;

      if (dt.month == 12 && dt.day > 28) {
        week1 = ICAL.Time.weekOneStarts(isoyear + 1, aWeekStart);
        if (dt.compare(week1) < 0) {
          week1 = ICAL.Time.weekOneStarts(isoyear, aWeekStart);
        } else {
          isoyear++;
        }
      } else {
        week1 = ICAL.Time.weekOneStarts(isoyear, aWeekStart);
        if (dt.compare(week1) < 0) {
          week1 = ICAL.Time.weekOneStarts(--isoyear, aWeekStart);
        }
      }

      var daysBetween = (dt.subtractDate(week1).toSeconds() / 86400);
      return ICAL.helpers.trunc(daysBetween / 7) + 1;
    },

    addDuration: function icaltime_add(aDuration) {
      var mult = (aDuration.isNegative ? -1 : 1);

      // because of the duration optimizations it is much
      // more efficient to grab all the values up front
      // then set them directly (which will avoid a normalization call).
      // So we don't actually normalize until we need it.
      var second = this.second;
      var minute = this.minute;
      var hour = this.hour;
      var day = this.day;

      second += mult * aDuration.seconds;
      minute += mult * aDuration.minutes;
      hour += mult * aDuration.hours;
      day += mult * aDuration.days;
      day += mult * 7 * aDuration.weeks;

      this.second = second;
      this.minute = minute;
      this.hour = hour;
      this.day = day;
    },

    /**
     * Subtract the date details (_excluding_ timezone).
     * Useful for finding the relative difference between
     * two time objects excluding their timezone differences.
     *
     * @return {ICAL.Duration} difference in duration.
     */
    subtractDate: function icaltime_subtract(aDate) {
      var unixTime = this.toUnixTime() + this.utcOffset();
      var other = aDate.toUnixTime() + aDate.utcOffset();
      return ICAL.Duration.fromSeconds(unixTime - other);
    },

    /**
     * Subtract the date details, taking timezones into account.
     *
     * @param {ICAL.Time}  The date to subtract.
     * @return {ICAL.Duration}  The difference in duration.
     */
    subtractDateTz: function icaltime_subtract_abs(aDate) {
      var unixTime = this.toUnixTime();
      var other = aDate.toUnixTime();
      return ICAL.Duration.fromSeconds(unixTime - other);
    },

    compare: function icaltime_compare(other) {
      var a = this.toUnixTime();
      var b = other.toUnixTime();

      if (a > b) return 1;
      if (b > a) return -1;
      return 0;
    },

    compareDateOnlyTz: function icaltime_compareDateOnlyTz(other, tz) {
      function cmp(attr) {
        return ICAL.Time._cmp_attr(a, b, attr);
      }
      var a = this.convertToZone(tz);
      var b = other.convertToZone(tz);
      var rc = 0;

      if ((rc = cmp("year")) != 0) return rc;
      if ((rc = cmp("month")) != 0) return rc;
      if ((rc = cmp("day")) != 0) return rc;

      return rc;
    },

    convertToZone: function convertToZone(zone) {
      var copy = this.clone();
      var zone_equals = (this.zone.tzid == zone.tzid);

      if (!this.isDate && !zone_equals) {
        ICAL.Timezone.convert_time(copy, this.zone, zone);
      }

      copy.zone = zone;
      return copy;
    },

    utcOffset: function utc_offset() {
      if (this.zone == ICAL.Timezone.localTimezone ||
          this.zone == ICAL.Timezone.utcTimezone) {
        return 0;
      } else {
        return this.zone.utcOffset(this);
      }
    },

    /**
     * Returns an RFC 5455 compliant ical representation of this object.
     *
     * @return {String} ical date/date-time.
     */
    toICALString: function() {
      var string = this.toString();

      if (string.length > 10) {
        return ICAL.design.value['date-time'].toICAL(string);
      } else {
        return ICAL.design.value.date.toICAL(string);
      }
    },

    toString: function toString() {
      var result = this.year + '-' +
                   ICAL.helpers.pad2(this.month) + '-' +
                   ICAL.helpers.pad2(this.day);

      if (!this.isDate) {
          result += 'T' + ICAL.helpers.pad2(this.hour) + ':' +
                    ICAL.helpers.pad2(this.minute) + ':' +
                    ICAL.helpers.pad2(this.second);

        if (this.zone === ICAL.Timezone.utcTimezone) {
          result += 'Z';
        }
      }

      return result;
    },

    toJSDate: function toJSDate() {
      if (this.zone == ICAL.Timezone.localTimezone) {
        if (this.isDate) {
          return new Date(this.year, this.month - 1, this.day);
        } else {
          return new Date(this.year, this.month - 1, this.day,
                          this.hour, this.minute, this.second, 0);
        }
      } else {
        return new Date(this.toUnixTime() * 1000);
      }
    },

    _normalize: function icaltime_normalize() {
      var isDate = this._time.isDate;
      if (this._time.isDate) {
        this._time.hour = 0;
        this._time.minute = 0;
        this._time.second = 0;
      }
      this.adjust(0, 0, 0, 0);

      return this;
    },

    adjust: function icaltime_adjust(aExtraDays, aExtraHours,
                                     aExtraMinutes, aExtraSeconds, aTime) {

      var minutesOverflow, hoursOverflow,
          daysOverflow = 0, yearsOverflow = 0;

      var second, minute, hour, day;
      var daysInMonth;

      var time = aTime || this._time;

      if (!time.isDate) {
        second = time.second + aExtraSeconds;
        time.second = second % 60;
        minutesOverflow = ICAL.helpers.trunc(second / 60);
        if (time.second < 0) {
          time.second += 60;
          minutesOverflow--;
        }

        minute = time.minute + aExtraMinutes + minutesOverflow;
        time.minute = minute % 60;
        hoursOverflow = ICAL.helpers.trunc(minute / 60);
        if (time.minute < 0) {
          time.minute += 60;
          hoursOverflow--;
        }

        hour = time.hour + aExtraHours + hoursOverflow;

        time.hour = hour % 24;
        daysOverflow = ICAL.helpers.trunc(hour / 24);
        if (time.hour < 0) {
          time.hour += 24;
          daysOverflow--;
        }
      }


      // Adjust month and year first, because we need to know what month the day
      // is in before adjusting it.
      if (time.month > 12) {
        yearsOverflow = ICAL.helpers.trunc((time.month - 1) / 12);
      } else if (time.month < 1) {
        yearsOverflow = ICAL.helpers.trunc(time.month / 12) - 1;
      }

      time.year += yearsOverflow;
      time.month -= 12 * yearsOverflow;

      // Now take care of the days (and adjust month if needed)
      day = time.day + aExtraDays + daysOverflow;

      if (day > 0) {
        for (;;) {
          var daysInMonth = ICAL.Time.daysInMonth(time.month, time.year);
          if (day <= daysInMonth) {
            break;
          }

          time.month++;
          if (time.month > 12) {
            time.year++;
            time.month = 1;
          }

          day -= daysInMonth;
        }
      } else {
        while (day <= 0) {
          if (time.month == 1) {
            time.year--;
            time.month = 12;
          } else {
            time.month--;
          }

          day += ICAL.Time.daysInMonth(time.month, time.year);
        }
      }

      time.day = day;
      return this;
    },

    fromUnixTime: function fromUnixTime(seconds) {
      this.zone = ICAL.Timezone.utcTimezone;
      var epoch = ICAL.Time.epochTime.clone();
      epoch.adjust(0, 0, 0, seconds);

      this.year = epoch.year;
      this.month = epoch.month;
      this.day = epoch.day;
      this.hour = epoch.hour;
      this.minute = epoch.minute;
      this.second = epoch.second;
    },

    toUnixTime: function toUnixTime() {
      var offset = this.utcOffset();

      // we use the offset trick to ensure
      // that we are getting the actual UTC time
      var ms = Date.UTC(
        this.year,
        this.month - 1,
        this.day,
        this.hour,
        this.minute,
        this.second - offset
      );

      // seconds
      return ms / 1000;
    },

    /**
     * Converts time to into Object
     * which can be serialized then re-created
     * using the constructor.
     *
     * Example:
     *
     *    // toJSON will automatically be called
     *    var json = JSON.stringify(mytime);
     *
     *    var deserialized = JSON.parse(json);
     *
     *    var time = new ICAL.Time(deserialized);
     *
     */
    toJSON: function() {
      var copy = [
        'year',
        'month',
        'day',
        'hour',
        'minute',
        'second',
        'isDate'
      ];

      var result = Object.create(null);

      var i = 0;
      var len = copy.length;
      var prop;

      for (; i < len; i++) {
        prop = copy[i];
        result[prop] = this[prop];
      }

      if (this.zone) {
        result.timezone = this.zone.tzid;
      }

      return result;
    }

  };

  (function setupNormalizeAttributes() {
    // This needs to run before any instances are created!
    function defineAttr(attr) {
      Object.defineProperty(ICAL.Time.prototype, attr, {
        get: function getTimeAttr() {
          if (this._pendingNormalization) {
            this._normalize();
            this._pendingNormalization = false;
          }

          return this._time[attr];
        },
        set: function setTimeAttr(val) {
          this._pendingNormalization = true;
          this._time[attr] = val;

          return val;
        }
      });

    }

    if ("defineProperty" in Object) {
      defineAttr("year");
      defineAttr("month");
      defineAttr("day");
      defineAttr("hour");
      defineAttr("minute");
      defineAttr("second");
      defineAttr("isDate");
    }
  })();

  ICAL.Time.daysInMonth = function icaltime_daysInMonth(month, year) {
    var _daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var days = 30;

    if (month < 1 || month > 12) return days;

    days = _daysInMonth[month];

    if (month == 2) {
      days += ICAL.Time.is_leap_year(year);
    }

    return days;
  };

  ICAL.Time.is_leap_year = function icaltime_is_leap_year(year) {
    if (year <= 1752) {
      return ((year % 4) == 0);
    } else {
      return (((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0));
    }
  };

  ICAL.Time.fromDayOfYear = function icaltime_fromDayOfYear(aDayOfYear, aYear) {
    var year = aYear;
    var doy = aDayOfYear;
    var tt = new ICAL.Time();
    tt.auto_normalize = false;
    var is_leap = (ICAL.Time.is_leap_year(year) ? 1 : 0);

    if (doy < 1) {
      year--;
      is_leap = (ICAL.Time.is_leap_year(year) ? 1 : 0);
      doy += ICAL.Time._days_in_year_passed_month[is_leap][12];
    } else if (doy > ICAL.Time._days_in_year_passed_month[is_leap][12]) {
      is_leap = (ICAL.Time.is_leap_year(year) ? 1 : 0);
      doy -= ICAL.Time._days_in_year_passed_month[is_leap][12];
      year++;
    }

    tt.year = year;
    tt.isDate = true;

    for (var month = 11; month >= 0; month--) {
      if (doy > ICAL.Time._days_in_year_passed_month[is_leap][month]) {
        tt.month = month + 1;
        tt.day = doy - ICAL.Time._days_in_year_passed_month[is_leap][month];
        break;
      }
    }

    tt.auto_normalize = true;
    return tt;
  };

  ICAL.Time.fromStringv2 = function fromString(str) {
    return new ICAL.Time({
      year: parseInt(str.substr(0, 4), 10),
      month: parseInt(str.substr(5, 2), 10),
      day: parseInt(str.substr(8, 2), 10),
      isDate: true
    });
  };

  ICAL.Time.fromDateString = function(aValue, aProp) {
    // Dates should have no timezone.
    // Google likes to sometimes specify Z on dates
    // we specifically ignore that to avoid issues.

    // YYYY-MM-DD
    // 2012-10-10
    return new ICAL.Time({
      year: ICAL.helpers.strictParseInt(aValue.substr(0, 4)),
      month: ICAL.helpers.strictParseInt(aValue.substr(5, 2)),
      day: ICAL.helpers.strictParseInt(aValue.substr(8, 2)),
      isDate: true
    });
  };

  ICAL.Time.fromDateTimeString = function(aValue, prop) {
    if (aValue.length < 19) {
      throw new Error(
        'invalid date-time value: "' + aValue + '"'
      );
    }

    var zone;

    if (aValue[19] === 'Z') {
      zone = 'Z';
    } else if (prop) {
      zone = prop.getParameter('tzid');
    }

    // 2012-10-10T10:10:10(Z)?
    var time = new ICAL.Time({
      year: ICAL.helpers.strictParseInt(aValue.substr(0, 4)),
      month: ICAL.helpers.strictParseInt(aValue.substr(5, 2)),
      day: ICAL.helpers.strictParseInt(aValue.substr(8, 2)),
      hour: ICAL.helpers.strictParseInt(aValue.substr(11, 2)),
      minute: ICAL.helpers.strictParseInt(aValue.substr(14, 2)),
      second: ICAL.helpers.strictParseInt(aValue.substr(17, 2)),
      timezone: zone
    });

    return time;
  };

  ICAL.Time.fromString = function fromString(aValue) {
    if (aValue.length > 10) {
      return ICAL.Time.fromDateTimeString(aValue);
    } else {
      return ICAL.Time.fromDateString(aValue);
    }
  };

  ICAL.Time.fromJSDate = function fromJSDate(aDate, useUTC) {
    var tt = new ICAL.Time();
    return tt.fromJSDate(aDate, useUTC);
  };

  ICAL.Time.fromData = function fromData(aData) {
    var t = new ICAL.Time();
    return t.fromData(aData);
  };

  ICAL.Time.now = function icaltime_now() {
    return ICAL.Time.fromJSDate(new Date(), false);
  };

  ICAL.Time.weekOneStarts = function weekOneStarts(aYear, aWeekStart) {
    var t = ICAL.Time.fromData({
      year: aYear,
      month: 1,
      day: 4,
      isDate: true
    });

    var fourth_dow = t.dayOfWeek();
    t.day += (1 - fourth_dow) + ((aWeekStart || ICAL.Time.SUNDAY) - 1);
    return t;
  };

  ICAL.Time.epochTime = ICAL.Time.fromData({
    year: 1970,
    month: 1,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
    isDate: false,
    timezone: "Z"
  });

  ICAL.Time._cmp_attr = function _cmp_attr(a, b, attr) {
    if (a[attr] > b[attr]) return 1;
    if (a[attr] < b[attr]) return -1;
    return 0;
  };

  ICAL.Time._days_in_year_passed_month = [
    [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365],
    [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366]
  ];


  ICAL.Time.SUNDAY = 1;
  ICAL.Time.MONDAY = 2;
  ICAL.Time.TUESDAY = 3;
  ICAL.Time.WEDNESDAY = 4;
  ICAL.Time.THURSDAY = 5;
  ICAL.Time.FRIDAY = 6;
  ICAL.Time.SATURDAY = 7;

  ICAL.Time.DEFAULT_WEEK_START = ICAL.Time.MONDAY;
})();
