/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch */

import { formatClassType, clone, trunc } from "./helpers.js";
import Recur from "./recur.js";
import Time from "./time.js";

/**
 * This lets typescript resolve our custom types in the
 * generated d.ts files (jsdoc typedefs are converted to typescript types).
 * Ignore prevents the typedefs from being documented more than once.
 *
 * @ignore
 * @typedef {import("./types.js").weekDay} weekDay
 * Imports the 'weekDay' type from the "types.js" module
 */

/**
 * An iterator for a single recurrence rule. This class usually doesn't have to be instanciated
 * directly, the convenience method {@link ICAL.Recur#iterator} can be used.
 *
 * @memberof ICAL
 */
class RecurIterator {
  static _indexMap = {
    "BYSECOND": 0,
    "BYMINUTE": 1,
    "BYHOUR": 2,
    "BYDAY": 3,
    "BYMONTHDAY": 4,
    "BYYEARDAY": 5,
    "BYWEEKNO": 6,
    "BYMONTH": 7,
    "BYSETPOS": 8
  };

  static _expandMap = {
    "SECONDLY": [1, 1, 1, 1, 1, 1, 1, 1],
    "MINUTELY": [2, 1, 1, 1, 1, 1, 1, 1],
    "HOURLY": [2, 2, 1, 1, 1, 1, 1, 1],
    "DAILY": [2, 2, 2, 1, 1, 1, 1, 1],
    "WEEKLY": [2, 2, 2, 2, 3, 3, 1, 1],
    "MONTHLY": [2, 2, 2, 2, 2, 3, 3, 1],
    "YEARLY": [2, 2, 2, 2, 2, 2, 2, 2]
  };

  static UNKNOWN = 0;
  static CONTRACT = 1;
  static EXPAND = 2;
  static ILLEGAL = 3;

  /**
   * Creates a new ICAL.RecurIterator instance. The options object may contain additional members
   * when resuming iteration from a previous run.
   *
   * @param {Object} options                The iterator options
   * @param {Recur} options.rule            The rule to iterate.
   * @param {Time} options.dtstart          The start date of the event.
   * @param {Boolean=} options.initialized  When true, assume that options are
   *        from a previously constructed iterator. Initialization will not be
   *        repeated.
   */
  constructor(options) {
    this.fromData(options);
  }

  /**
   * True when iteration is finished.
   * @type {Boolean}
   */
  completed = false;

  /**
   * The rule that is being iterated
   * @type {Recur}
   */
  rule = null;

  /**
   * The start date of the event being iterated.
   * @type {Time}
   */
  dtstart = null;

  /**
   * The last occurrence that was returned from the
   * {@link RecurIterator#next} method.
   * @type {Time}
   */
  last = null;

  /**
   * The sequence number from the occurrence
   * @type {Number}
   */
  occurrence_number = 0;

  /**
   * The indices used for the {@link ICAL.RecurIterator#by_data} object.
   * @type {Object}
   * @private
   */
  by_indices = null;

  /**
   * If true, the iterator has already been initialized
   * @type {Boolean}
   * @private
   */
  initialized = false;

  /**
   * The initializd by-data.
   * @type {Object}
   * @private
   */
  by_data = null;

  /**
   * The expanded yeardays
   * @type {Array}
   * @private
   */
  days = null;

  /**
   * The index in the {@link ICAL.RecurIterator#days} array.
   * @type {Number}
   * @private
   */
  days_index = 0;

  /**
   * Initialize the recurrence iterator from the passed data object. This
   * method is usually not called directly, you can initialize the iterator
   * through the constructor.
   *
   * @param {Object} options                The iterator options
   * @param {Recur} options.rule            The rule to iterate.
   * @param {Time} options.dtstart          The start date of the event.
   * @param {Boolean=} options.initialized  When true, assume that options are
   *        from a previously constructed iterator. Initialization will not be
   *        repeated.
   */
  fromData(options) {
    this.rule = formatClassType(options.rule, Recur);

    if (!this.rule) {
      throw new Error('iterator requires a (ICAL.Recur) rule');
    }

    this.dtstart = formatClassType(options.dtstart, Time);

    if (!this.dtstart) {
      throw new Error('iterator requires a (ICAL.Time) dtstart');
    }

    if (options.by_data) {
      this.by_data = options.by_data;
    } else {
      this.by_data = clone(this.rule.parts, true);
    }

    if (options.occurrence_number)
      this.occurrence_number = options.occurrence_number;

    this.days = options.days || [];
    if (options.last) {
      this.last = formatClassType(options.last, Time);
    }

    this.by_indices = options.by_indices;

    if (!this.by_indices) {
      this.by_indices = {
        "BYSECOND": 0,
        "BYMINUTE": 0,
        "BYHOUR": 0,
        "BYDAY": 0,
        "BYMONTH": 0,
        "BYWEEKNO": 0,
        "BYMONTHDAY": 0
      };
    }

    this.initialized = options.initialized || false;

    if (!this.initialized) {
      try {
        this.init();
      } catch (e) {
        if (e instanceof InvalidRecurrenceRuleError) {
          // Init may error if there are no possible recurrence instances from
          // the rule, but we don't want to bubble this error up. Instead, we
          // create an empty iterator.
          this.completed = true;
        } else {
          // Propagate other errors to consumers.
          throw e;
        }
      }
    }
  }

  /**
   * Initialize the iterator
   * @private
   */
  init() {
    this.initialized = true;
    this.last = this.dtstart.clone();
    let parts = this.by_data;

    if ("BYDAY" in parts) {
      // libical does this earlier when the rule is loaded, but we postpone to
      // now so we can preserve the original order.
      this.sort_byday_rules(parts.BYDAY);
    }

    // The BYYEARDAY may only appear with BYDAY
    if ("BYYEARDAY" in parts) {
      if ("BYMONTH" in parts || "BYWEEKNO" in parts ||
          "BYMONTHDAY" in parts) {
        throw new Error("Invalid BYYEARDAY rule");
      }
    }

    // BYWEEKNO and BYMONTHDAY rule parts may not both appear
    if ("BYWEEKNO" in parts && "BYMONTHDAY" in parts) {
      throw new Error("BYWEEKNO does not fit to BYMONTHDAY");
    }

    // For MONTHLY recurrences (FREQ=MONTHLY) neither BYYEARDAY nor
    // BYWEEKNO may appear.
    if (this.rule.freq == "MONTHLY" &&
        ("BYYEARDAY" in parts || "BYWEEKNO" in parts)) {
      throw new Error("For MONTHLY recurrences neither BYYEARDAY nor BYWEEKNO may appear");
    }

    // For WEEKLY recurrences (FREQ=WEEKLY) neither BYMONTHDAY nor
    // BYYEARDAY may appear.
    if (this.rule.freq == "WEEKLY" &&
        ("BYYEARDAY" in parts || "BYMONTHDAY" in parts)) {
      throw new Error("For WEEKLY recurrences neither BYMONTHDAY nor BYYEARDAY may appear");
    }

    // BYYEARDAY may only appear in YEARLY rules
    if (this.rule.freq != "YEARLY" && "BYYEARDAY" in parts) {
      throw new Error("BYYEARDAY may only appear in YEARLY rules");
    }

    this.last.second = this.setup_defaults("BYSECOND", "SECONDLY", this.dtstart.second);
    this.last.minute = this.setup_defaults("BYMINUTE", "MINUTELY", this.dtstart.minute);
    this.last.hour = this.setup_defaults("BYHOUR", "HOURLY", this.dtstart.hour);
    this.last.day = this.setup_defaults("BYMONTHDAY", "DAILY", this.dtstart.day);
    this.last.month = this.setup_defaults("BYMONTH", "MONTHLY", this.dtstart.month);

    if (this.rule.freq == "WEEKLY") {
      if ("BYDAY" in parts) {
        let [, dow] = this.ruleDayOfWeek(parts.BYDAY[0], this.rule.wkst);
        let wkdy = dow - this.last.dayOfWeek(this.rule.wkst);
        if ((this.last.dayOfWeek(this.rule.wkst) < dow && wkdy >= 0) || wkdy < 0) {
          // Initial time is after first day of BYDAY data
          this.last.day += wkdy;
        }
      } else {
        let dayName = Recur.numericDayToIcalDay(this.dtstart.dayOfWeek());
        parts.BYDAY = [dayName];
      }
    }

    if (this.rule.freq == "YEARLY") {
      // Some yearly recurrence rules may be specific enough to not actually
      // occur on a yearly basis, e.g. the 29th day of February or the fifth
      // Monday of a given month. The standard isn't clear on the intended
      // behavior in these cases, but `libical` at least will iterate until it
      // finds a matching year.
      // CAREFUL: Some rules may specify an occurrence that can never happen,
      // e.g. the first Monday of April so long as it falls on the 15th
      // through the 21st. Detecting these is non-trivial, so ensure that we
      // stop iterating at some point.
      const untilYear = this.rule.until ? this.rule.until.year : 20000;
      while (this.last.year <= untilYear) {
        this.expand_year_days(this.last.year);
        if (this.days.length > 0) {
          break;
        }
        this.increment_year(this.rule.interval);
      }

      if (this.days.length == 0) {
        throw new InvalidRecurrenceRuleError();
      }

      this._nextByYearDay();
    }

    if (this.rule.freq == "MONTHLY") {
      if (this.has_by_data("BYDAY")) {
        let tempLast = null;
        let initLast = this.last.clone();
        let daysInMonth = Time.daysInMonth(this.last.month, this.last.year);

        // Check every weekday in BYDAY with relative dow and pos.
        for (let bydow of this.by_data.BYDAY) {
          this.last = initLast.clone();
          let [pos, dow] = this.ruleDayOfWeek(bydow);
          let dayOfMonth = this.last.nthWeekDay(dow, pos);

          // If |pos| >= 6, the byday is invalid for a monthly rule.
          if (pos >= 6 || pos <= -6) {
            throw new Error("Malformed values in BYDAY part");
          }

          // If a Byday with pos=+/-5 is not in the current month it
          // must be searched in the next months.
          if (dayOfMonth > daysInMonth || dayOfMonth <= 0) {
            // Skip if we have already found a "last" in this month.
            if (tempLast && tempLast.month == initLast.month) {
              continue;
            }
            while (dayOfMonth > daysInMonth || dayOfMonth <= 0) {
              this.increment_month();
              daysInMonth = Time.daysInMonth(this.last.month, this.last.year);
              dayOfMonth = this.last.nthWeekDay(dow, pos);
            }
          }

          this.last.day = dayOfMonth;
          if (!tempLast || this.last.compare(tempLast) < 0) {
            tempLast = this.last.clone();
          }
        }
        this.last = tempLast.clone();

        //XXX: This feels like a hack, but we need to initialize
        //     the BYMONTHDAY case correctly and byDayAndMonthDay handles
        //     this case. It accepts a special flag which will avoid incrementing
        //     the initial value without the flag days that match the start time
        //     would be missed.
        if (this.has_by_data('BYMONTHDAY')) {
          this._byDayAndMonthDay(true);
        }

        if (this.last.day > daysInMonth || this.last.day == 0) {
          throw new Error("Malformed values in BYDAY part");
        }
      } else if (this.has_by_data("BYMONTHDAY")) {
        // Change the day value so that normalisation won't change the month.
        this.last.day = 1;

        // Get a sorted list of days in the starting month that match the rule.
        let normalized = this.normalizeByMonthDayRules(
          this.last.year,
          this.last.month,
          this.rule.parts.BYMONTHDAY
        ).filter(d => d >= this.last.day);

        if (normalized.length) {
          // There's at least one valid day, use it.
          this.last.day = normalized[0];
          this.by_data.BYMONTHDAY = normalized;
        } else {
          // There's no occurrence in this month, find the next valid month.
          // The longest possible sequence of skipped months is February-April-June,
          // so we might need to call next_month up to three times.
          if (!this.next_month() && !this.next_month() && !this.next_month()) {
            throw new Error("No possible occurrences");
          }
        }
      }
    }
  }

  /**
   * Retrieve the next occurrence from the iterator.
   * @return {Time}
   */
  next(again = false) {
    let before = (this.last ? this.last.clone() : null);

    if ((this.rule.count && this.occurrence_number >= this.rule.count) ||
        (this.rule.until && this.last.compare(this.rule.until) > 0)) {
      this.completed = true;
    }

    if (this.completed) {
      return null;
    }

    if (this.occurrence_number == 0 && this.last.compare(this.dtstart) >= 0) {
      // First of all, give the instance that was initialized
      this.occurrence_number++;
      return this.last;
    }

    let valid;
    do {
      valid = 1;

      switch (this.rule.freq) {
      case "SECONDLY":
        this.next_second();
        break;
      case "MINUTELY":
        this.next_minute();
        break;
      case "HOURLY":
        this.next_hour();
        break;
      case "DAILY":
        this.next_day();
        break;
      case "WEEKLY":
        this.next_week();
        break;
      case "MONTHLY":
        valid = this.next_month();
        break;
      case "YEARLY":
        this.next_year();
        break;

      default:
        return null;
      }
    } while (!this.check_contracting_rules() ||
             this.last.compare(this.dtstart) < 0 ||
             !valid);

    if (this.last.compare(before) == 0) {
      if (again) {
        throw new Error("Same occurrence found twice, protecting you from death by recursion");
      }
      this.next(true);
    }

    if (this.rule.until && this.last.compare(this.rule.until) > 0) {
      this.completed = true;
      return null;
    } else {
      this.occurrence_number++;
      return this.last;
    }
  }

  next_second() {
    return this.next_generic("BYSECOND", "SECONDLY", "second", "minute");
  }

  increment_second(inc) {
    return this.increment_generic(inc, "second", 60, "minute");
  }

  next_minute() {
    return this.next_generic("BYMINUTE", "MINUTELY",
                             "minute", "hour", "next_second");
  }

  increment_minute(inc) {
    return this.increment_generic(inc, "minute", 60, "hour");
  }

  next_hour() {
    return this.next_generic("BYHOUR", "HOURLY", "hour",
                             "monthday", "next_minute");
  }

  increment_hour(inc) {
    this.increment_generic(inc, "hour", 24, "monthday");
  }

  next_day() {
    let this_freq = (this.rule.freq == "DAILY");

    if (this.next_hour() == 0) {
      return 0;
    }

    if (this_freq) {
      this.increment_monthday(this.rule.interval);
    } else {
      this.increment_monthday(1);
    }

    return 0;
  }

  next_week() {
    let end_of_data = 0;

    if (this.next_weekday_by_week() == 0) {
      return end_of_data;
    }

    if (this.has_by_data("BYWEEKNO")) {
      this.by_indices.BYWEEKNO++;

      if (this.by_indices.BYWEEKNO == this.by_data.BYWEEKNO.length) {
        this.by_indices.BYWEEKNO = 0;
        end_of_data = 1;
      }

      // HACK should be first month of the year
      this.last.month = 1;
      this.last.day = 1;

      let week_no = this.by_data.BYWEEKNO[this.by_indices.BYWEEKNO];

      this.last.day += 7 * week_no;

      if (end_of_data) {
        this.increment_year(1);
      }
    } else {
      // Jump to the next week
      this.increment_monthday(7 * this.rule.interval);
    }

    return end_of_data;
  }

  /**
   * Normalize each by day rule for a given year/month.
   * Takes into account ordering and negative rules
   *
   * @private
   * @param {Number} year         Current year.
   * @param {Number} month        Current month.
   * @param {Array}  rules        Array of rules.
   *
   * @return {Array} sorted and normalized rules.
   *                 Negative rules will be expanded to their
   *                 correct positive values for easier processing.
   */
  normalizeByMonthDayRules(year, month, rules) {
    let daysInMonth = Time.daysInMonth(month, year);

    // XXX: This is probably bad for performance to allocate
    //      a new array for each month we scan, if possible
    //      we should try to optimize this...
    let newRules = [];

    let ruleIdx = 0;
    let len = rules.length;
    let rule;

    for (; ruleIdx < len; ruleIdx++) {
      rule = parseInt(rules[ruleIdx], 10);
      if (isNaN(rule)) {
        throw new Error('Invalid BYMONTHDAY value');
      }

      // if this rule falls outside of given
      // month discard it.
      if (Math.abs(rule) > daysInMonth) {
        continue;
      }

      // negative case
      if (rule < 0) {
        // we add (not subtract it is a negative number)
        // one from the rule because 1 === last day of month
        rule = daysInMonth + (rule + 1);
      } else if (rule === 0) {
        // skip zero: it is invalid.
        continue;
      }

      // only add unique items...
      if (newRules.indexOf(rule) === -1) {
        newRules.push(rule);
      }

    }

    // unique and sort
    return newRules.sort(function(a, b) { return a - b; });
  }

  /**
   * NOTES:
   * We are given a list of dates in the month (BYMONTHDAY) (23, etc..)
   * Also we are given a list of days (BYDAY) (MO, 2SU, etc..) when
   * both conditions match a given date (this.last.day) iteration stops.
   *
   * @private
   * @param {Boolean=} isInit     When given true will not increment the
   *                                current day (this.last).
   */
  _byDayAndMonthDay(isInit) {
    let byMonthDay; // setup in initMonth
    let byDay = this.by_data.BYDAY;

    let date;
    let dateIdx = 0;
    let dateLen; // setup in initMonth
    let dayLen = byDay.length;

    // we are not valid by default
    let dataIsValid = 0;

    let daysInMonth;
    let self = this;
    // we need a copy of this, because a DateTime gets normalized
    // automatically if the day is out of range. At some points we
    // set the last day to 0 to start counting.
    let lastDay = this.last.day;

    function initMonth() {
      daysInMonth = Time.daysInMonth(
        self.last.month, self.last.year
      );

      byMonthDay = self.normalizeByMonthDayRules(
        self.last.year,
        self.last.month,
        self.by_data.BYMONTHDAY
      );

      dateLen = byMonthDay.length;

      // For the case of more than one occurrence in one month
      // we have to be sure to start searching after the last
      // found date or at the last BYMONTHDAY, unless we are
      // initializing the iterator because in this case we have
      // to consider the last found date too.
      while (byMonthDay[dateIdx] <= lastDay &&
             !(isInit && byMonthDay[dateIdx] == lastDay) &&
             dateIdx < dateLen - 1) {
        dateIdx++;
      }
    }

    function nextMonth() {
      // since the day is incremented at the start
      // of the loop below, we need to start at 0
      lastDay = 0;
      self.increment_month();
      dateIdx = 0;
      initMonth();
    }

    initMonth();

    // should come after initMonth
    if (isInit) {
      lastDay -= 1;
    }

    // Use a counter to avoid an infinite loop with malformed rules.
    // Stop checking after 4 years so we consider also a leap year.
    let monthsCounter = 48;

    while (!dataIsValid && monthsCounter) {
      monthsCounter--;
      // increment the current date. This is really
      // important otherwise we may fall into the infinite
      // loop trap. The initial date takes care of the case
      // where the current date is the date we are looking
      // for.
      date = lastDay + 1;

      if (date > daysInMonth) {
        nextMonth();
        continue;
      }

      // find next date
      let next = byMonthDay[dateIdx++];

      // this logic is dependent on the BYMONTHDAYS
      // being in order (which is done by #normalizeByMonthDayRules)
      if (next >= date) {
        // if the next month day is in the future jump to it.
        lastDay = next;
      } else {
        // in this case the 'next' monthday has past
        // we must move to the month.
        nextMonth();
        continue;
      }

      // Now we can loop through the day rules to see
      // if one matches the current month date.
      for (let dayIdx = 0; dayIdx < dayLen; dayIdx++) {
        let parts = this.ruleDayOfWeek(byDay[dayIdx]);
        let pos = parts[0];
        let dow = parts[1];

        this.last.day = lastDay;
        if (this.last.isNthWeekDay(dow, pos)) {
          // when we find the valid one we can mark
          // the conditions as met and break the loop.
          // (Because we have this condition above
          //  it will also break the parent loop).
          dataIsValid = 1;
          break;
        }
      }

      // It is completely possible that the combination
      // cannot be matched in the current month.
      // When we reach the end of possible combinations
      // in the current month we iterate to the next one.
      // since dateIdx is incremented right after getting
      // "next", we don't need dateLen -1 here.
      if (!dataIsValid && dateIdx === dateLen) {
        nextMonth();
        continue;
      }
    }

    if (monthsCounter <= 0) {
      // Checked 4 years without finding a Byday that matches
      // a Bymonthday. Maybe the rule is not correct.
      throw new Error("Malformed values in BYDAY combined with BYMONTHDAY parts");
    }


    return dataIsValid;
  }

  next_month() {
    let data_valid = 1;

    if (this.next_hour() == 0) {
      return data_valid;
    }

    if (this.has_by_data("BYDAY") && this.has_by_data("BYMONTHDAY")) {
      data_valid = this._byDayAndMonthDay();
    } else if (this.has_by_data("BYDAY")) {
      let daysInMonth = Time.daysInMonth(this.last.month, this.last.year);
      let setpos = 0;
      let setpos_total = 0;

      if (this.has_by_data("BYSETPOS")) {
        let last_day = this.last.day;
        for (let day = 1; day <= daysInMonth; day++) {
          this.last.day = day;
          if (this.is_day_in_byday(this.last)) {
            setpos_total++;
            if (day <= last_day) {
              setpos++;
            }
          }
        }
        this.last.day = last_day;
      }

      data_valid = 0;
      let day;
      for (day = this.last.day + 1; day <= daysInMonth; day++) {
        this.last.day = day;

        if (this.is_day_in_byday(this.last)) {
          if (!this.has_by_data("BYSETPOS") ||
              this.check_set_position(++setpos) ||
              this.check_set_position(setpos - setpos_total - 1)) {

            data_valid = 1;
            break;
          }
        }
      }

      if (day > daysInMonth) {
        this.last.day = 1;
        this.increment_month();

        if (this.is_day_in_byday(this.last)) {
          if (!this.has_by_data("BYSETPOS") || this.check_set_position(1)) {
            data_valid = 1;
          }
        } else {
          data_valid = 0;
        }
      }
    } else if (this.has_by_data("BYMONTHDAY")) {
      this.by_indices.BYMONTHDAY++;

      if (this.by_indices.BYMONTHDAY >= this.by_data.BYMONTHDAY.length) {
        this.by_indices.BYMONTHDAY = 0;
        this.increment_month();
        if (this.by_indices.BYMONTHDAY >= this.by_data.BYMONTHDAY.length) {
          return 0;
        }
      }

      let daysInMonth = Time.daysInMonth(this.last.month, this.last.year);
      let day = this.by_data.BYMONTHDAY[this.by_indices.BYMONTHDAY];

      if (day < 0) {
        day = daysInMonth + day + 1;
      }

      if (day > daysInMonth) {
        this.last.day = 1;
        data_valid = this.is_day_in_byday(this.last);
      } else {
        this.last.day = day;
      }
    } else {
      this.increment_month();
      let daysInMonth = Time.daysInMonth(this.last.month, this.last.year);
      if (this.by_data.BYMONTHDAY[0] > daysInMonth) {
        data_valid = 0;
      } else {
        this.last.day = this.by_data.BYMONTHDAY[0];
      }
    }

    return data_valid;
  }

  next_weekday_by_week() {
    let end_of_data = 0;

    if (this.next_hour() == 0) {
      return end_of_data;
    }

    if (!this.has_by_data("BYDAY")) {
      return 1;
    }

    for (;;) {
      let tt = new Time();
      this.by_indices.BYDAY++;

      if (this.by_indices.BYDAY == Object.keys(this.by_data.BYDAY).length) {
        this.by_indices.BYDAY = 0;
        end_of_data = 1;
      }

      let coded_day = this.by_data.BYDAY[this.by_indices.BYDAY];
      let parts = this.ruleDayOfWeek(coded_day);
      let dow = parts[1];

      dow -= this.rule.wkst;

      if (dow < 0) {
        dow += 7;
      }

      tt.year = this.last.year;
      tt.month = this.last.month;
      tt.day = this.last.day;

      let startOfWeek = tt.startDoyWeek(this.rule.wkst);

      if (dow + startOfWeek < 1) {
        // The selected date is in the previous year
        if (!end_of_data) {
          continue;
        }
      }

      let next = Time.fromDayOfYear(startOfWeek + dow, this.last.year);

      /**
       * The normalization horrors below are due to
       * the fact that when the year/month/day changes
       * it can effect the other operations that come after.
       */
      this.last.year = next.year;
      this.last.month = next.month;
      this.last.day = next.day;

      return end_of_data;
    }
  }

  next_year() {
    if (this.next_hour() == 0) {
      return 0;
    }

    if (++this.days_index == this.days.length) {
      this.days_index = 0;
      do {
        this.increment_year(this.rule.interval);
        if (this.has_by_data("BYMONTHDAY")) {
          this.by_data.BYMONTHDAY = this.normalizeByMonthDayRules(
            this.last.year,
            this.last.month,
            this.rule.parts.BYMONTHDAY
          );
        }
        this.expand_year_days(this.last.year);
      } while (this.days.length == 0);
    }

    this._nextByYearDay();

    return 1;
  }

  _nextByYearDay() {
    let doy = this.days[this.days_index];
    let year = this.last.year;
    if (doy < 1) {
        // Time.fromDayOfYear(doy, year) indexes relative to the
        // start of the given year. That is different from the
        // semantics of BYYEARDAY where negative indexes are an
        // offset from the end of the given year.
        doy += 1;
        year += 1;
    }
    let next = Time.fromDayOfYear(doy, year);
    this.last.day = next.day;
    this.last.month = next.month;
  }

  /**
   * @param dow (eg: '1TU', '-1MO')
   * @param {weekDay=} aWeekStart The week start weekday
   * @return [pos, numericDow] (eg: [1, 3]) numericDow is relative to aWeekStart
   */
  ruleDayOfWeek(dow, aWeekStart) {
    let matches = dow.match(/([+-]?[0-9])?(MO|TU|WE|TH|FR|SA|SU)/);
    if (matches) {
      let pos = parseInt(matches[1] || 0, 10);
      dow = Recur.icalDayToNumericDay(matches[2], aWeekStart);
      return [pos, dow];
    } else {
      return [0, 0];
    }
  }

  next_generic(aRuleType, aInterval, aDateAttr, aFollowingAttr, aPreviousIncr) {
    let has_by_rule = (aRuleType in this.by_data);
    let this_freq = (this.rule.freq == aInterval);
    let end_of_data = 0;

    if (aPreviousIncr && this[aPreviousIncr]() == 0) {
      return end_of_data;
    }

    if (has_by_rule) {
      this.by_indices[aRuleType]++;
      let dta = this.by_data[aRuleType];

      if (this.by_indices[aRuleType] == dta.length) {
        this.by_indices[aRuleType] = 0;
        end_of_data = 1;
      }
      this.last[aDateAttr] = dta[this.by_indices[aRuleType]];
    } else if (this_freq) {
      this["increment_" + aDateAttr](this.rule.interval);
    }

    if (has_by_rule && end_of_data && this_freq) {
      this["increment_" + aFollowingAttr](1);
    }

    return end_of_data;
  }

  increment_monthday(inc) {
    for (let i = 0; i < inc; i++) {
      let daysInMonth = Time.daysInMonth(this.last.month, this.last.year);
      this.last.day++;

      if (this.last.day > daysInMonth) {
        this.last.day -= daysInMonth;
        this.increment_month();
      }
    }
  }

  increment_month() {
    this.last.day = 1;
    if (this.has_by_data("BYMONTH")) {
      this.by_indices.BYMONTH++;

      if (this.by_indices.BYMONTH == this.by_data.BYMONTH.length) {
        this.by_indices.BYMONTH = 0;
        this.increment_year(1);
      }

      this.last.month = this.by_data.BYMONTH[this.by_indices.BYMONTH];
    } else {
      if (this.rule.freq == "MONTHLY") {
        this.last.month += this.rule.interval;
      } else {
        this.last.month++;
      }

      this.last.month--;
      let years = trunc(this.last.month / 12);
      this.last.month %= 12;
      this.last.month++;

      if (years != 0) {
        this.increment_year(years);
      }
    }

    if (this.has_by_data("BYMONTHDAY")) {
      this.by_data.BYMONTHDAY = this.normalizeByMonthDayRules(
        this.last.year,
        this.last.month,
        this.rule.parts.BYMONTHDAY
      );
    }
  }

  increment_year(inc) {
    // Don't jump into the next month if this.last is Feb 29.
    this.last.day = 1;
    this.last.year += inc;
  }

  increment_generic(inc, aDateAttr, aFactor, aNextIncrement) {
    this.last[aDateAttr] += inc;
    let nextunit = trunc(this.last[aDateAttr] / aFactor);
    this.last[aDateAttr] %= aFactor;
    if (nextunit != 0) {
      this["increment_" + aNextIncrement](nextunit);
    }
  }

  has_by_data(aRuleType) {
    return (aRuleType in this.rule.parts);
  }

  expand_year_days(aYear) {
    let t = new Time();
    this.days = [];

    // We need our own copy with a few keys set
    let parts = {};
    let rules = ["BYDAY", "BYWEEKNO", "BYMONTHDAY", "BYMONTH", "BYYEARDAY"];
    for (let part of rules) {
      if (part in this.rule.parts) {
        parts[part] = this.rule.parts[part];
      }
    }

    if ("BYMONTH" in parts && "BYWEEKNO" in parts) {
      let valid = 1;
      let validWeeks = {};
      t.year = aYear;
      t.isDate = true;

      for (let monthIdx = 0; monthIdx < this.by_data.BYMONTH.length; monthIdx++) {
        let month = this.by_data.BYMONTH[monthIdx];
        t.month = month;
        t.day = 1;
        let first_week = t.weekNumber(this.rule.wkst);
        t.day = Time.daysInMonth(month, aYear);
        let last_week = t.weekNumber(this.rule.wkst);
        for (monthIdx = first_week; monthIdx < last_week; monthIdx++) {
          validWeeks[monthIdx] = 1;
        }
      }

      for (let weekIdx = 0; weekIdx < this.by_data.BYWEEKNO.length && valid; weekIdx++) {
        let weekno = this.by_data.BYWEEKNO[weekIdx];
        if (weekno < 52) {
          valid &= validWeeks[weekIdx];
        } else {
          valid = 0;
        }
      }

      if (valid) {
        delete parts.BYMONTH;
      } else {
        delete parts.BYWEEKNO;
      }
    }

    let partCount = Object.keys(parts).length;

    if (partCount == 0) {
      let t1 = this.dtstart.clone();
      t1.year = this.last.year;
      this.days.push(t1.dayOfYear());
    } else if (partCount == 1 && "BYMONTH" in parts) {
      for (let month of this.by_data.BYMONTH) {
        let t2 = this.dtstart.clone();
        t2.year = aYear;
        t2.month = month;
        t2.isDate = true;
        this.days.push(t2.dayOfYear());
      }
    } else if (partCount == 1 && "BYMONTHDAY" in parts) {
      for (let monthday of this.by_data.BYMONTHDAY) {
        let t3 = this.dtstart.clone();
        if (monthday < 0) {
          let daysInMonth = Time.daysInMonth(t3.month, aYear);
          monthday = monthday + daysInMonth + 1;
        }
        t3.day = monthday;
        t3.year = aYear;
        t3.isDate = true;
        this.days.push(t3.dayOfYear());
      }
    } else if (partCount == 2 &&
               "BYMONTHDAY" in parts &&
               "BYMONTH" in parts) {
      for (let month of this.by_data.BYMONTH) {
        let daysInMonth = Time.daysInMonth(month, aYear);
        for (let monthday of this.by_data.BYMONTHDAY) {
          if (monthday < 0) {
            monthday = monthday + daysInMonth + 1;
          }
          t.day = monthday;
          t.month = month;
          t.year = aYear;
          t.isDate = true;

          this.days.push(t.dayOfYear());
        }
      }
    } else if (partCount == 1 && "BYWEEKNO" in parts) {
      // TODO unimplemented in libical
    } else if (partCount == 2 &&
               "BYWEEKNO" in parts &&
               "BYMONTHDAY" in parts) {
      // TODO unimplemented in libical
    } else if (partCount == 1 && "BYDAY" in parts) {
      this.days = this.days.concat(this.expand_by_day(aYear));
    } else if (partCount == 2 && "BYDAY" in parts && "BYMONTH" in parts) {
      for (let month of this.by_data.BYMONTH) {
        let daysInMonth = Time.daysInMonth(month, aYear);

        t.year = aYear;
        t.month = month;
        t.day = 1;
        t.isDate = true;

        let first_dow = t.dayOfWeek();
        let doy_offset = t.dayOfYear() - 1;

        t.day = daysInMonth;
        let last_dow = t.dayOfWeek();

        if (this.has_by_data("BYSETPOS")) {
          let by_month_day = [];
          for (let day = 1; day <= daysInMonth; day++) {
            t.day = day;
            if (this.is_day_in_byday(t)) {
              by_month_day.push(day);
            }
          }

          for (let spIndex = 0; spIndex < by_month_day.length; spIndex++) {
            if (this.check_set_position(spIndex + 1) ||
                this.check_set_position(spIndex - by_month_day.length)) {
              this.days.push(doy_offset + by_month_day[spIndex]);
            }
          }
        } else {
          for (let coded_day of this.by_data.BYDAY) {
            let bydayParts = this.ruleDayOfWeek(coded_day);
            let pos = bydayParts[0];
            let dow = bydayParts[1];
            let month_day;

            let first_matching_day = ((dow + 7 - first_dow) % 7) + 1;
            let last_matching_day = daysInMonth - ((last_dow + 7 - dow) % 7);

            if (pos == 0) {
              for (let day = first_matching_day; day <= daysInMonth; day += 7) {
                this.days.push(doy_offset + day);
              }
            } else if (pos > 0) {
              month_day = first_matching_day + (pos - 1) * 7;

              if (month_day <= daysInMonth) {
                this.days.push(doy_offset + month_day);
              }
            } else {
              month_day = last_matching_day + (pos + 1) * 7;

              if (month_day > 0) {
                this.days.push(doy_offset + month_day);
              }
            }
          }
        }
      }
      // Return dates in order of occurrence (1,2,3,...) instead
      // of by groups of weekdays (1,8,15,...,2,9,16,...).
      this.days.sort(function(a, b) { return a - b; }); // Comparator function allows to sort numbers.
    } else if (partCount == 2 && "BYDAY" in parts && "BYMONTHDAY" in parts) {
      let expandedDays = this.expand_by_day(aYear);

      for (let day of expandedDays) {
        let tt = Time.fromDayOfYear(day, aYear);
        if (this.by_data.BYMONTHDAY.indexOf(tt.day) >= 0) {
          this.days.push(day);
        }
      }
    } else if (partCount == 3 &&
               "BYDAY" in parts &&
               "BYMONTHDAY" in parts &&
               "BYMONTH" in parts) {
      let expandedDays = this.expand_by_day(aYear);

      for (let day of expandedDays) {
        let tt = Time.fromDayOfYear(day, aYear);

        if (this.by_data.BYMONTH.indexOf(tt.month) >= 0 &&
            this.by_data.BYMONTHDAY.indexOf(tt.day) >= 0) {
          this.days.push(day);
        }
      }
    } else if (partCount == 2 && "BYDAY" in parts && "BYWEEKNO" in parts) {
      let expandedDays = this.expand_by_day(aYear);

      for (let day of expandedDays) {
        let tt = Time.fromDayOfYear(day, aYear);
        let weekno = tt.weekNumber(this.rule.wkst);

        if (this.by_data.BYWEEKNO.indexOf(weekno)) {
          this.days.push(day);
        }
      }
    } else if (partCount == 3 &&
               "BYDAY" in parts &&
               "BYWEEKNO" in parts &&
               "BYMONTHDAY" in parts) {
      // TODO unimplemted in libical
    } else if (partCount == 1 && "BYYEARDAY" in parts) {
      this.days = this.days.concat(this.by_data.BYYEARDAY);
    } else if (partCount == 2 && "BYYEARDAY" in parts && "BYDAY" in parts) {
      let daysInYear = Time.isLeapYear(aYear) ? 366 : 365;
      let expandedDays = new Set(this.expand_by_day(aYear));

      for (let doy of this.by_data.BYYEARDAY) {
        if (doy < 0) {
          doy += daysInYear + 1;
        }

        if (expandedDays.has(doy)) {
          this.days.push(doy);
        }
      }
    } else {
      this.days = [];
    }

    let daysInYear = Time.isLeapYear(aYear) ? 366 : 365;
    this.days.sort((a, b) => {
      if (a < 0) a += daysInYear + 1;
      if (b < 0) b += daysInYear + 1;
      return a - b;
    });

    return 0;
  }

  expand_by_day(aYear) {

    let days_list = [];
    let tmp = this.last.clone();

    tmp.year = aYear;
    tmp.month = 1;
    tmp.day = 1;
    tmp.isDate = true;

    let start_dow = tmp.dayOfWeek();

    tmp.month = 12;
    tmp.day = 31;
    tmp.isDate = true;

    let end_dow = tmp.dayOfWeek();
    let end_year_day = tmp.dayOfYear();

    for (let day of this.by_data.BYDAY) {
      let parts = this.ruleDayOfWeek(day);
      let pos = parts[0];
      let dow = parts[1];

      if (pos == 0) {
        let tmp_start_doy = ((dow + 7 - start_dow) % 7) + 1;

        for (let doy = tmp_start_doy; doy <= end_year_day; doy += 7) {
          days_list.push(doy);
        }

      } else if (pos > 0) {
        let first;
        if (dow >= start_dow) {
          first = dow - start_dow + 1;
        } else {
          first = dow - start_dow + 8;
        }

        days_list.push(first + (pos - 1) * 7);
      } else {
        let last;
        pos = -pos;

        if (dow <= end_dow) {
          last = end_year_day - end_dow + dow;
        } else {
          last = end_year_day - end_dow + dow - 7;
        }

        days_list.push(last - (pos - 1) * 7);
      }
    }
    return days_list;
  }

  is_day_in_byday(tt) {
    if (this.by_data.BYDAY) {
      for (let day of this.by_data.BYDAY) {
        let parts = this.ruleDayOfWeek(day);
        let pos = parts[0];
        let dow = parts[1];
        let this_dow = tt.dayOfWeek();

        if ((pos == 0 && dow == this_dow) ||
            (tt.nthWeekDay(dow, pos) == tt.day)) {
          return 1;
        }
      }
    }

    return 0;
  }

  /**
   * Checks if given value is in BYSETPOS.
   *
   * @private
   * @param {Numeric} aPos position to check for.
   * @return {Boolean} false unless BYSETPOS rules exist
   *                   and the given value is present in rules.
   */
  check_set_position(aPos) {
    if (this.has_by_data('BYSETPOS')) {
      let idx = this.by_data.BYSETPOS.indexOf(aPos);
      // negative numbers are not false-y
      return idx !== -1;
    }
    return false;
  }

  sort_byday_rules(aRules) {
    for (let i = 0; i < aRules.length; i++) {
      for (let j = 0; j < i; j++) {
        let one = this.ruleDayOfWeek(aRules[j], this.rule.wkst)[1];
        let two = this.ruleDayOfWeek(aRules[i], this.rule.wkst)[1];

        if (one > two) {
          let tmp = aRules[i];
          aRules[i] = aRules[j];
          aRules[j] = tmp;
        }
      }
    }
  }

  check_contract_restriction(aRuleType, v) {
    let indexMapValue = RecurIterator._indexMap[aRuleType];
    let ruleMapValue = RecurIterator._expandMap[this.rule.freq][indexMapValue];
    let pass = false;

    if (aRuleType in this.by_data &&
        ruleMapValue == RecurIterator.CONTRACT) {

      let ruleType = this.by_data[aRuleType];

      for (let bydata of ruleType) {
        if (bydata == v) {
          pass = true;
          break;
        }
      }
    } else {
      // Not a contracting byrule or has no data, test passes
      pass = true;
    }
    return pass;
  }

  check_contracting_rules() {
    let dow = this.last.dayOfWeek();
    let weekNo = this.last.weekNumber(this.rule.wkst);
    let doy = this.last.dayOfYear();

    return (this.check_contract_restriction("BYSECOND", this.last.second) &&
            this.check_contract_restriction("BYMINUTE", this.last.minute) &&
            this.check_contract_restriction("BYHOUR", this.last.hour) &&
            this.check_contract_restriction("BYDAY", Recur.numericDayToIcalDay(dow)) &&
            this.check_contract_restriction("BYWEEKNO", weekNo) &&
            this.check_contract_restriction("BYMONTHDAY", this.last.day) &&
            this.check_contract_restriction("BYMONTH", this.last.month) &&
            this.check_contract_restriction("BYYEARDAY", doy));
  }

  setup_defaults(aRuleType, req, deftime) {
    let indexMapValue = RecurIterator._indexMap[aRuleType];
    let ruleMapValue = RecurIterator._expandMap[this.rule.freq][indexMapValue];

    if (ruleMapValue != RecurIterator.CONTRACT) {
      if (!(aRuleType in this.by_data)) {
        this.by_data[aRuleType] = [deftime];
      }
      if (this.rule.freq != req) {
        return this.by_data[aRuleType][0];
      }
    }
    return deftime;
  }

  /**
   * Convert iterator into a serialize-able object.  Will preserve current
   * iteration sequence to ensure the seamless continuation of the recurrence
   * rule.
   * @return {Object}
   */
  toJSON() {
    let result = Object.create(null);

    result.initialized = this.initialized;
    result.rule = this.rule.toJSON();
    result.dtstart = this.dtstart.toJSON();
    result.by_data = this.by_data;
    result.days = this.days;
    result.last = this.last.toJSON();
    result.by_indices = this.by_indices;
    result.occurrence_number = this.occurrence_number;

    return result;
  }
}

/**
 * An error indicating that a recurrence rule is invalid and produces no
 * occurrences.
 *
 * @extends {Error}
 * @class
 */
class InvalidRecurrenceRuleError extends Error {
  constructor() {
    super("Recurrence rule has no valid occurrences");
  }
}

export default RecurIterator;
