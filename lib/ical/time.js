/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

"use strict";

(typeof(ICAL) === 'undefined')? ICAL = {} : '';
(function() {
  ICAL.icaltime = function icaltime(data) {
    this.wrappedJSObject = this;
    this.fromData(data);
  };

  ICAL.icaltime.prototype = {

    year: 0,
    month: 1,
    day: 1,

    hour: 0,
    minute: 0,
    second: 0,

    isDate: false,
    zone: null,

    auto_normalize: false,
    icalclass: "icaltime",
    icaltype: "DATE-TIME",

    clone: function icaltime_clone() {
      return new ICAL.icaltime(this);
    },

    reset: function icaltime_reset() {
      this.fromData(ICAL.icaltime.epoch_time);
      this.zone = ICAL.icaltimezone.utc_timezone;
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
        data = ICAL.icalparser.parseValue(str, "DATE");
        data.isDate = true;
      } catch (e) {
        data = ICAL.icalparser.parseValue(str, "DATE-TIME");
        data.isDate = false;
      }
      return this.fromData(data);
    },

    fromJSDate: function icaltime_fromJSDate(aDate, useUTC) {
      if (!aDate) {
        this.reset();
      } else {
        if (useUTC) {
          this.zone = ICAL.icaltimezone.utc_timezone;
          this.year = aDate.getUTCFullYear();
          this.month = aDate.getUTCMonth() + 1;
          this.day = aDate.getUTCDate();
          this.hour = aDate.getUTCHours();
          this.minute = aDate.getUTCMinutes();
          this.second = aDate.getUTCSeconds();
        } else {
          this.zone = ICAL.icaltimezone.local_timezone;
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

    fromData: function fromData(aData) {
      // TODO given we're switching formats, this may not be needed
      var old_auto_normalize = this.auto_normalize;
      this.auto_normalize = false;

      var propsToCopy = {
        year: 0,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0
      };
      for (var key in propsToCopy) {
        if (aData && key in aData) {
          this[key] = aData[key];
        } else {
          this[key] = propsToCopy[key];
        }
      }
      if (aData && !("isDate" in aData)) {
        this.isDate = !("hour" in aData);
      } else if (aData && ("isDate" in aData)) {
        this.isDate = aData.isDate;
      }

      if (aData && "timezone" in aData) {
        var timezone = aData.timezone;

        //TODO: replace with timezone service
        switch (timezone) {
          case 'Z':
          case ICAL.icaltimezone.utc_timezone.tzid:
            this.zone = ICAL.icaltimezone.utc_timezone;
            break;
          case ICAL.icaltimezone.local_timezone.tzid:
            this.zone = ICAL.icaltimezone.local_timezone;
            break;
        }
      }

      if (aData && "zone" in aData) {
        this.zone = aData.zone;
      }

      if (!this.zone) {
        this.zone = ICAL.icaltimezone.local_timezone;
      }

      if (aData && "auto_normalize" in aData) {
        this.auto_normalize = aData.auto_normalize;
      } else {
        this.auto_normalize = old_auto_normalize;
      }
      if (this.auto_normalize) {
        this.normalize();
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
      var is_leap = (ICAL.icaltime.is_leap_year(this.year) ? 1 : 0);
      var diypm = ICAL.icaltime._days_in_year_passed_month;
      return diypm[is_leap][this.month - 1] + this.day;
    },

    startOfWeek: function startOfWeek() {
      var result = this.clone();
      result.day -= this.dayOfWeek() - 1;
      return result.normalize();
    },

    end_of_week: function end_of_week() {
      var result = this.clone();
      result.day += 7 - this.dayOfWeek();
      return result.normalize();
    },

    start_of_month: function start_of_month() {
      var result = this.clone();
      result.day = 1;
      result.isDate = true;
      result.hour = 0;
      result.minute = 0;
      result.second = 0;
      return result;
    },

    end_of_month: function end_of_month() {
      var result = this.clone();
      result.day = ICAL.icaltime.daysInMonth(result.month, result.year);
      result.isDate = true;
      result.hour = 0;
      result.minute = 0;
      result.second = 0;
      return result;
    },

    start_of_year: function start_of_year() {
      var result = this.clone();
      result.day = 1;
      result.month = 1;
      result.isDate = true;
      result.hour = 0;
      result.minute = 0;
      result.second = 0;
      return result;
    },

    end_of_year: function end_of_year() {
      var result = this.clone();
      result.day = 31;
      result.month = 12;
      result.isDate = true;
      result.hour = 0;
      result.minute = 0;
      result.second = 0;
      return result;
    },

    start_doy_week: function start_doy_week(aFirstDayOfWeek) {
      var firstDow = aFirstDayOfWeek || ICAL.icaltime.SUNDAY;
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
      var daysInMonth = ICAL.icaltime.daysInMonth(this.month, this.year);
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

    week_number: function week_number(aWeekStart) {
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
        week1 = ICAL.icaltime.week_one_starts(isoyear + 1, aWeekStart);
        if (dt.compare(week1) < 0) {
          week1 = ICAL.icaltime.week_one_starts(isoyear, aWeekStart);
        } else {
          isoyear++;
        }
      } else {
        week1 = ICAL.icaltime.week_one_starts(isoyear, aWeekStart);
        if (dt.compare(week1) < 0) {
          week1 = ICAL.icaltime.week_one_starts(--isoyear, aWeekStart);
        }
      }

      var daysBetween = (dt.subtractDate(week1).toSeconds() / 86400);
      return ICAL.helpers.trunc(daysBetween / 7) + 1;
    },

    addDuration: function icaltime_add(aDuration) {
      var mult = (aDuration.isNegative ? -1 : 1);

      this.second += mult * aDuration.seconds;
      this.minute += mult * aDuration.minutes;
      this.hour += mult * aDuration.hours;
      this.day += mult * aDuration.days;
      this.day += mult * 7 * aDuration.weeks;

      this.normalize();
    },

    subtractDate: function icaltime_subtract(aDate) {
      function leap_years_until(aYear) {
        return ICAL.helpers.trunc(aYear / 4) -
               ICAL.helpers.trunc(aYear / 100) +
               ICAL.helpers.trunc(aYear / 400);
      }

      function leap_years_between(aStart, aEnd) {
        if (aStart >= aEnd) {
          return 0;
        } else {
          return leap_years_until(aEnd - 1) - leap_years_until(aStart);
        }
      }
      var dur = new ICAL.icalduration();

      dur.seconds = this.second - aDate.second;
      dur.minutes = this.minute - aDate.minute;
      dur.hours = this.hour - aDate.hour;

      if (this.year == aDate.year) {
        var this_doy = this.dayOfYear();
        var that_doy = aDate.dayOfYear();
        dur.days = this_doy - that_doy;
      } else if (this.year < aDate.year) {
        var days_left_thisyear = 365 +
          (ICAL.icaltime.is_leap_year(this.year) ? 1 : 0) -
          this.dayOfYear();

        dur.days -= days_left_thisyear + aDate.dayOfYear();
        dur.days -= leap_years_between(this.year + 1, aDate.year);
        dur.days -= 365 * (aDate.year - this.year - 1);
      } else {
        var days_left_thatyear = 365 +
          (ICAL.icaltime.is_leap_year(aDate.year) ? 1 : 0) -
          aDate.dayOfYear();

        dur.days += days_left_thatyear + this.dayOfYear();
        dur.days += leap_years_between(aDate.year + 1, this.year);
        dur.days += 365 * (this.year - aDate.year - 1);
      }

      return dur.normalize();
    },

    compare: function icaltime_compare(other) {
      function cmp(attr) {
        return ICAL.icaltime._cmp_attr(a, b, attr);
      }

      if (!other) return 0;

      if (this.isDate || other.isDate) {
        return this.compare_date_only_tz(other, this.zone);
      }

      var target_zone;
      if (this.zone == ICAL.icaltimezone.local_timezone ||
          other.zone == ICAL.icaltimezone.local_timezone) {
        target_zone = ICAL.icaltimezone.local_timezone;
      } else {
        target_zone = ICAL.icaltimezone.utc_timezone;
      }

      var a = this.convert_to_zone(target_zone);
      var b = other.convert_to_zone(target_zone);
      var rc = 0;

      if ((rc = cmp("year")) != 0) return rc;
      if ((rc = cmp("month")) != 0) return rc;
      if ((rc = cmp("day")) != 0) return rc;

      if (a.isDate && b.isDate) {
        // If both are dates, we are done
        return 0;
      } else if (b.isDate) {
        // If b is a date, then a is greater
        return 1;
      } else if (a.isDate) {
        // If a is a date, then b is greater
        return -1;
      }

      if ((rc = cmp("hour")) != 0) return rc;
      if ((rc = cmp("minute")) != 0) return rc;
      if ((rc = cmp("second")) != 0) return rc;

      // Now rc is 0 and the dates are equal
      return rc;
    },

    compare_date_only_tz: function icaltime_compare_date_only_tz(other, tz) {
      function cmp(attr) {
        return ICAL.icaltime._cmp_attr(a, b, attr);
      }
      var a = this.convert_to_zone(tz);
      var b = other.convert_to_zone(tz);
      var rc = 0;

      if ((rc = cmp("year")) != 0) return rc;
      if ((rc = cmp("month")) != 0) return rc;
      if ((rc = cmp("day")) != 0) return rc;

      return rc;
    },

    convert_to_zone: function convert_to_zone(zone) {
      var copy = this.clone();
      var zone_equals = (this.zone.tzid == zone.tzid);

      if (!this.isDate && !zone_equals) {
        ICAL.icaltimezone.convert_time(copy, this.zone, zone);
      }

      copy.zone = zone;
      return copy;
    },

    utc_offset: function utc_offset() {
      if (this.zone == ICAL.icaltimezone.local_timezone ||
          this.zone == ICAL.icaltimezone.utc_timezone) {
        return 0;
      } else {
        return this.zone.utc_offset(this);
      }
    },

    toString: function toString() {
        return ("0000" + this.year).substr(-4) +
               ("00" + this.month).substr(-2) +
               ("00" + this.day).substr(-2) +
               (this.isDate ? "" :
                 "T" +
                 ("00" + this.hour).substr(-2) +
                 ("00" + this.minute).substr(-2) +
                 ("00" + this.second).substr(-2) +
                 (this.zone && this.zone.tzid == "UTC" ? "Z" : "")
               );
    },

    toJSDate: function toJSDate() {
      if (this.zone == ICAL.icaltimezone.local_timezone) {
        if (this.isDate) {
          return new Date(this.year, this.month - 1, this.day);
        } else {
          return new Date(this.year, this.month - 1, this.day,
                          this.hour, this.minute, this.second, 0);
        }
      } else {
        var utcDate = this.convert_to_zone(ICAL.icaltimezone.utc_timezone);
        if (this.isDate) {
          return Date.UTC(this.year, this.month - 1, this.day);
        } else {
          return Date.UTC(this.year, this.month - 1, this.day,
                          this.hour, this.minute, this.second, 0);
        }
      }
    },

    normalize: function icaltime_normalize() {
      if (this.isDate) {
        this.hour = 0;
        this.minute = 0;
        this.second = 0;
      }
      this.icaltype = (this.isDate ? "DATE" : "DATE-TIME");

      this.adjust(0, 0, 0, 0);
      return this;
    },

    adjust: function icaltime_adjust(aExtraDays, aExtraHours,
                                     aExtraMinutes, aExtraSeconds) {
      var second, minute, hour, day;
      var minutes_overflow, hours_overflow, days_overflow = 0,
        years_overflow = 0;
      var daysInMonth;

      if (!this.isDate) {
        second = this.second + aExtraSeconds;
        this.second = second % 60;
        minutes_overflow = ICAL.helpers.trunc(second / 60);
        if (this.second < 0) {
          this.second += 60;
          minutes_overflow--;
        }

        minute = this.minute + aExtraMinutes + minutes_overflow;
        this.minute = minute % 60;
        hours_overflow = ICAL.helpers.trunc(minute / 60);
        if (this.minute < 0) {
          this.minute += 60;
          hours_overflow--;
        }

        hour = this.hour + aExtraHours + hours_overflow;
        this.hour = hour % 24;
        days_overflow = ICAL.helpers.trunc(hour / 24);
        if (this.hour < 0) {
          this.hour += 24;
          days_overflow--;
        }
      }

      // Adjust month and year first, because we need to know what month the day
      // is in before adjusting it.
      if (this.month > 12) {
        years_overflow = ICAL.helpers.trunc((this.month - 1) / 12);
      } else if (this.month < 1) {
        years_overflow = ICAL.helpers.trunc(this.month / 12) - 1;
      }

      this.year += years_overflow;
      this.month -= 12 * years_overflow;

      // Now take care of the days (and adjust month if needed)
      day = this.day + aExtraDays + days_overflow;
      if (day > 0) {
        for (;;) {
          var daysInMonth = ICAL.icaltime.daysInMonth(this.month, this.year);
          if (day <= daysInMonth) {
            break;
          }

          this.month++;
          if (this.month > 12) {
            this.year++;
            this.month = 1;
          }

          day -= daysInMonth;
        }
      } else {
        while (day <= 0) {
          if (this.month == 1) {
            this.year--;
            this.month = 12;
          } else {
            this.month--;
          }

          day += ICAL.icaltime.daysInMonth(this.month, this.year);
        }
      }

      this.day = day;
      return this;
    },

    fromUnixTime: function fromUnixTime(seconds) {
      var epoch = ICAL.icaltime.epoch_time.clone();
      epoch.adjust(0, 0, 0, seconds);
      this.fromData(epoch);
      this.zone = ICAL.icaltimezone.utc_timezone;
    },

    toUnixTime: function toUnixTime() {
      var dur = this.subtractDate(ICAL.icaltime.epoch_time);
      return dur.toSeconds();
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
     *    var time = new ICAL.icaltime(deserialized);
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
    function addAutoNormalizeAttribute(attr, mattr) {
      ICAL.icaltime.prototype[mattr] = ICAL.icaltime.prototype[attr];

      Object.defineProperty(ICAL.icaltime.prototype, attr, {
        get: function() {
          return this[mattr];
        },
        set: function(val) {
          this[mattr] = val;
          if (this.auto_normalize) {
            var old_normalize = this.auto_normalize;
            this.auto_normalize = false;
            this.normalize();
            this.auto_normalize = old_normalize;
          }
          return val;
        }
      });

    }

    if ("defineProperty" in Object) {
      addAutoNormalizeAttribute("year", "mYear");
      addAutoNormalizeAttribute("month", "mMonth");
      addAutoNormalizeAttribute("day", "mDay");
      addAutoNormalizeAttribute("hour", "mHour");
      addAutoNormalizeAttribute("minute", "mMinute");
      addAutoNormalizeAttribute("second", "mSecond");
      addAutoNormalizeAttribute("isDate", "mIsDate");

      ICAL.icaltime.prototype.auto_normalize = true;
    }
  })();

  ICAL.icaltime.daysInMonth = function icaltime_daysInMonth(month, year) {
    var _daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var days = 30;

    if (month < 1 || month > 12) return days;

    days = _daysInMonth[month];

    if (month == 2) {
      days += ICAL.icaltime.is_leap_year(year);
    }

    return days;
  };

  ICAL.icaltime.is_leap_year = function icaltime_is_leap_year(year) {
    if (year <= 1752) {
      return ((year % 4) == 0);
    } else {
      return (((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0));
    }
  };

  ICAL.icaltime.fromDayOfYear = function icaltime_fromDayOfYear(aDayOfYear, aYear) {
    var year = aYear;
    var doy = aDayOfYear;
    var tt = new ICAL.icaltime();
    tt.auto_normalize = false;
    var is_leap = (ICAL.icaltime.is_leap_year(year) ? 1 : 0);

    if (doy < 1) {
      year--;
      is_leap = (ICAL.icaltime.is_leap_year(year) ? 1 : 0);
      doy += ICAL.icaltime._days_in_year_passed_month[is_leap][12];
    } else if (doy > ICAL.icaltime._days_in_year_passed_month[is_leap][12]) {
      is_leap = (ICAL.icaltime.is_leap_year(year) ? 1 : 0);
      doy -= ICAL.icaltime._days_in_year_passed_month[is_leap][12];
      year++;
    }

    tt.year = year;
    tt.isDate = true;

    for (var month = 11; month >= 0; month--) {
      if (doy > ICAL.icaltime._days_in_year_passed_month[is_leap][month]) {
        tt.month = month + 1;
        tt.day = doy - ICAL.icaltime._days_in_year_passed_month[is_leap][month];
        break;
      }
    }

    tt.auto_normalize = true;
    return tt;
  };

  ICAL.icaltime.fromString = function fromString(str) {
    var tt = new ICAL.icaltime();
    return tt.fromString(str);
  };

  ICAL.icaltime.fromJSDate = function fromJSDate(aDate, useUTC) {
    var tt = new ICAL.icaltime();
    return tt.fromJSDate(aDate, useUTC);
  };

  ICAL.icaltime.fromData = function fromData(aData) {
    var t = new ICAL.icaltime();
    return t.fromData(aData);
  };

  ICAL.icaltime.now = function icaltime_now() {
    return ICAL.icaltime.fromJSDate(new Date(), false);
  };

  ICAL.icaltime.week_one_starts = function week_one_starts(aYear, aWeekStart) {
    var t = ICAL.icaltime.fromData({
      year: aYear,
      month: 1,
      day: 4,
      isDate: true
    });

    var fourth_dow = t.dayOfWeek();
    t.day += (1 - fourth_dow) + ((aWeekStart || ICAL.icaltime.SUNDAY) - 1);
    return t;
  };

  ICAL.icaltime.epoch_time = ICAL.icaltime.fromData({
    year: 1970,
    month: 1,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
    isDate: false,
    timezone: "Z"
  });

  ICAL.icaltime._cmp_attr = function _cmp_attr(a, b, attr) {
    if (a[attr] > b[attr]) return 1;
    if (a[attr] < b[attr]) return -1;
    return 0;
  };

  ICAL.icaltime._days_in_year_passed_month = [
    [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365],
    [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366]
  ];

  ICAL.icaltime.SUNDAY = 1;
  ICAL.icaltime.MONDAY = 2;
  ICAL.icaltime.TUESDAY = 3;
  ICAL.icaltime.WEDNESDAY = 4;
  ICAL.icaltime.THURSDAY = 5;
  ICAL.icaltime.FRIDAY = 6;
  ICAL.icaltime.SATURDAY = 7;
})();
