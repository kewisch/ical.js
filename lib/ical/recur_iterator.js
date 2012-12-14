ICAL.RecurIterator = (function() {

  /**
   * Options:
   *  - rule: (ICAL.Recur) instance
   *  - dtstart: (ICAL.Time) start date of recurrence rule
   *  - initialized: (Boolean) when true will assume options
   *                           are from previously constructed
   *                           iterator and will not re-initialize
   *                           iterator but resume its state from given data.
   *
   *  - by_data: (for iterator de-serialization)
   *  - days: "
   *  - last: "
   *  - by_indices: "
   */
  function icalrecur_iterator(options) {
    this.fromData(options);
  }

  icalrecur_iterator.prototype = {

    /**
     * True when iteration is finished.
     */
    completed: false,

    rule: null,
    dtstart: null,
    last: null,
    occurrence_number: 0,
    by_indices: null,
    initialized: false,
    by_data: null,

    days: null,
    days_index: 0,

    fromData: function(options) {
      this.rule = ICAL.helpers.formatClassType(options.rule, ICAL.Recur);

      if (!this.rule) {
        throw new Error('iterator requires a (ICAL.Recur) rule');
      }

      this.dtstart = ICAL.helpers.formatClassType(options.dtstart, ICAL.Time);

      if (!this.dtstart) {
        throw new Error('iterator requires a (ICAL.Time) dtstart');
      }

      if (options.by_data) {
        this.by_data = options.by_data;
      } else {
        this.by_data = ICAL.helpers.clone(this.rule.parts, true);
      }

      if (options.occurrence_number)
        this.occurrence_number = options.occurrence_number;

      this.days = options.days || [];
      this.last = ICAL.helpers.formatClassType(options.last, ICAL.Time);

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
        this.init();
      }
    },

    init: function icalrecur_iterator_init() {
      this.initialized = true;
      this.last = this.dtstart.clone();
      var parts = this.by_data;

      if ("BYDAY" in parts) {
        // libical does this earlier when the rule is loaded, but we postpone to
        // now so we can preserve the original order.
        this.sort_byday_rules(parts.BYDAY, this.rule.wkst);
      }

      // If the BYYEARDAY appares, no other date rule part may appear
      if ("BYYEARDAY" in parts) {
        if ("BYMONTH" in parts || "BYWEEKNO" in parts ||
            "BYMONTHDAY" in parts || "BYDAY" in parts) {
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
          var parts = this.ruleDayOfWeek(parts.BYDAY[0]);
          var pos = parts[0];
          var rule_dow = parts[1];
          var dow = rule_dow - this.last.dayOfWeek();
          if ((this.last.dayOfWeek() < rule_dow && dow >= 0) || dow < 0) {
            // Initial time is after first day of BYDAY data
            this.last.day += dow;
          }
        } else {
          var wkMap = icalrecur_iterator._wkdayMap[this.dtstart.dayOfWeek()];
          parts.BYDAY = [wkMap];
        }
      }

      if (this.rule.freq == "YEARLY") {
        for (;;) {
          this.expand_year_days(this.last.year);
          if (this.days.length > 0) {
            break;
          }
          this.increment_year(this.rule.interval);
        }

        var next = ICAL.Time.fromDayOfYear(this.days[0], this.last.year);

        this.last.day = next.day;
        this.last.month = next.month;
      }

      if (this.rule.freq == "MONTHLY" && this.has_by_data("BYDAY")) {

        var coded_day = this.by_data.BYDAY[this.by_indices.BYDAY];
        var parts = this.ruleDayOfWeek(coded_day);
        var pos = parts[0];
        var dow = parts[1];

        var daysInMonth = ICAL.Time.daysInMonth(this.last.month, this.last.year);
        var poscount = 0;

        if (pos >= 0) {
          for (this.last.day = 1; this.last.day <= daysInMonth; this.last.day++) {
            if (this.last.dayOfWeek() == dow) {
              if (++poscount == pos || pos == 0) {
                break;
              }
            }
          }
        } else {
          pos = -pos;
          for (this.last.day = daysInMonth; this.last.day != 0; this.last.day--) {
            if (this.last.dayOfWeek() == dow) {
              if (++poscount == pos) {
                break;
              }
            }
          }
        }

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
        if (this.last.day < 0) {
          var daysInMonth = ICAL.Time.daysInMonth(this.last.month, this.last.year);
          this.last.day = daysInMonth + this.last.day + 1;
        }
      }

    },

    next: function icalrecur_iterator_next() {
      var before = (this.last ? this.last.clone() : null);

      if ((this.rule.count && this.occurrence_number >= this.rule.count) ||
          (this.rule.until && this.last.compare(this.rule.until) > 0)) {

        //XXX: right now this is just a flag and has no impact
        //     we can simplify the above case to check for completed later.
        this.completed = true;

        return null;
      }

      if (this.occurrence_number == 0 && this.last.compare(this.dtstart) >= 0) {
        // First of all, give the instance that was initialized
        this.occurrence_number++;
        return this.last;
      }

      do {
        var valid = 1;

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

      // TODO is this valid?
      if (this.last.compare(before) == 0) {
        throw new Error("Same occurrence found twice, protecting " +
                        "you from death by recursion");
      }

      if (this.rule.until && this.last.compare(this.rule.until) > 0) {
        this.completed = true;
        return null;
      } else {
        this.occurrence_number++;
        return this.last;
      }
    },

    next_second: function next_second() {
      return this.next_generic("BYSECOND", "SECONDLY", "second", "minute");
    },

    increment_second: function increment_second(inc) {
      return this.increment_generic(inc, "second", 60, "minute");
    },

    next_minute: function next_minute() {
      return this.next_generic("BYMINUTE", "MINUTELY",
                               "minute", "hour", "next_second");
    },

    increment_minute: function increment_minute(inc) {
      return this.increment_generic(inc, "minute", 60, "hour");
    },

    next_hour: function next_hour() {
      return this.next_generic("BYHOUR", "HOURLY", "hour",
                               "monthday", "next_minute");
    },

    increment_hour: function increment_hour(inc) {
      this.increment_generic(inc, "hour", 24, "monthday");
    },

    next_day: function next_day() {
      var has_by_day = ("BYDAY" in this.by_data);
      var this_freq = (this.rule.freq == "DAILY");

      if (this.next_hour() == 0) {
        return 0;
      }

      if (this_freq) {
        this.increment_monthday(this.rule.interval);
      } else {
        this.increment_monthday(1);
      }

      return 0;
    },

    next_week: function next_week() {
      var end_of_data = 0;

      if (this.next_weekday_by_week() == 0) {
        return end_of_data;
      }

      if (this.has_by_data("BYWEEKNO")) {
        var idx = ++this.by_indices.BYWEEKNO;

        if (this.by_indices.BYWEEKNO == this.by_data.BYWEEKNO.length) {
          this.by_indices.BYWEEKNO = 0;
          end_of_data = 1;
        }

        // HACK should be first month of the year
        this.last.month = 1;
        this.last.day = 1;

        var week_no = this.by_data.BYWEEKNO[this.by_indices.BYWEEKNO];

        this.last.day += 7 * week_no;

        if (end_of_data) {
          this.increment_year(1);
        }
      } else {
        // Jump to the next week
        this.increment_monthday(7 * this.rule.interval);
      }

      return end_of_data;
    },

    /**
     * normalize each by day rule for a given year/month.
     * Takes into account ordering and negative rules
     *
     * @param {Numeric} year current year.
     * @param {Numeric} month current month.
     * @param {Array} rules array of rules.
     *
     * @return {Array} sorted and normalized rules.
     *                 Negative rules will be expanded to their
     *                 correct positive values for easier processing.
     */
    normalizeByMonthDayRules: function(year, month, rules) {
      var daysInMonth = ICAL.Time.daysInMonth(month, year);

      // XXX: This is probably bad for performance to allocate
      //      a new array for each month we scan, if possible
      //      we should try to optimize this...
      var newRules = [];

      var ruleIdx = 0;
      var len = rules.length;
      var rule;

      for (; ruleIdx < len; ruleIdx++) {
        rule = rules[ruleIdx];

        // if this rule falls outside of given
        // month discard it.
        if (Math.abs(rule) > daysInMonth) {
          continue;
        }

        // negative case
        if (rule < 0) {
          // we add (not subtract its a negative number)
          // one from the rule because 1 === last day of month
          rule = daysInMonth + (rule + 1);
        } else if (rule === 0) {
          // skip zero its invalid.
          continue;
        }

        // only add unique items...
        if (newRules.indexOf(rule) === -1) {
          newRules.push(rule);
        }

      }

      // unique and sort
      return newRules.sort();
    },

    /**
     * NOTES:
     * We are given a list of dates in the month (BYMONTHDAY) (23, etc..)
     * Also we are given a list of days (BYDAY) (MO, 2SU, etc..) when
     * both conditions match a given date (this.last.day) iteration stops.
     *
     * @param {Boolean} [isInit] when given true will not
     *                           increment the current day (this.last).
     */
    _byDayAndMonthDay: function(isInit) {
     var byMonthDay; // setup in initMonth
      var byDay = this.by_data.BYDAY;

      var date;
      var dateIdx = 0;
      var dateLen; // setup in initMonth
      var dayIdx = 0;
      var dayLen = byDay.length;

      // we are not valid by default
      var dataIsValid = 0;

      var daysInMonth;
      var self = this;

      function initMonth() {
        daysInMonth = ICAL.Time.daysInMonth(
          self.last.month, self.last.year
        );

        byMonthDay = self.normalizeByMonthDayRules(
          self.last.year,
          self.last.month,
          self.by_data.BYMONTHDAY
        );

        dateLen = byMonthDay.length;
      }

      function nextMonth() {
        self.last.day = 1;
        self.increment_month();
        initMonth();

        dateIdx = 0;
        dayIdx = 0;
      }

      initMonth();

      // should come after initMonth
      if (isInit) {
        this.last.day -= 1;
      }

      while (!dataIsValid) {
        // find next date
        var next = byMonthDay[dateIdx++];

        // increment the current date. This is really
        // important otherwise we may fall into the infinite
        // loop trap. The initial date takes care of the case
        // where the current date is the date we are looking
        // for.
        date = this.last.day + 1;

        if (date > daysInMonth) {
          nextMonth();
          continue;
        }

        // after verify that the next date
        // is in the current month we can increment
        // it permanently.
        this.last.day = date;

        // this logic is dependant on the BYMONTHDAYS
        // being in order (which is done by #normalizeByMonthDayRules)
        if (next >= this.last.day) {
          // if the next month day is in the future jump to it.
          this.last.day = next;
        } else {
          // in this case the 'next' monthday has past
          // we must move to the month.
          nextMonth();
          continue;
        }

        // Now we can loop through the day rules to see
        // if one matches the current month date.
        for (dayIdx = 0; dayIdx < dayLen; dayIdx++) {
          var parts = this.ruleDayOfWeek(byDay[dayIdx]);
          var pos = parts[0];
          var dow = parts[1];

          if (this.last.isNthWeekDay(dow, pos)) {
            // when we find the valid one we can mark
            // the conditions as met and break the loop.
            // (Because we have this condition above
            //  it will also break the parent loop).
            dataIsValid = 1;
            break;
          }
        }

        // Its completely possible that the combination
        // cannot be matched in the current month.
        // When we reach the end of possible combinations
        // in the current month we iterate to the next one.
        if (!dataIsValid && dateIdx === (dateLen - 1)) {
          nextMonth();
          continue;
        }
      }

      return dataIsValid;
    },

    next_month: function next_month() {
      var this_freq = (this.rule.freq == "MONTHLY");
      var data_valid = 1;

      if (this.next_hour() == 0) {
        return data_valid;
      }

      if (this.has_by_data("BYDAY") && this.has_by_data("BYMONTHDAY")) {
        data_valid = this._byDayAndMonthDay();
      } else if (this.has_by_data("BYDAY")) {
        var daysInMonth = ICAL.Time.daysInMonth(this.last.month, this.last.year);
        var setpos = 0;

        if (this.has_by_data("BYSETPOS")) {
          var last_day = this.last.day;
          for (var day = 1; day <= daysInMonth; day++) {
            this.last.day = day;
            if (this.is_day_in_byday(this.last) && day <= last_day) {
              setpos++;
            }
          }
          this.last.day = last_day;
        }

        for (var day = this.last.day + 1; day <= daysInMonth; day++) {
          this.last.day = day;

          if (this.is_day_in_byday(this.last)) {
            if (!this.has_by_data("BYSETPOS") ||
                this.check_set_position(++setpos) ||
                this.check_set_position(setpos - this.by_data.BYSETPOS.length - 1)) {

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
        }

        var daysInMonth = ICAL.Time.daysInMonth(this.last.month, this.last.year);

        var day = this.by_data.BYMONTHDAY[this.by_indices.BYMONTHDAY];

        if (day < 0) {
          day = daysInMonth + day + 1;
        }

        if (day > daysInMonth) {
          this.last.day = 1;
          data_valid = this.is_day_in_byday(this.last);
        }

        this.last.day = day;
      } else {
        this.last.day = this.by_data.BYMONTHDAY[0];
        this.increment_month();
        var daysInMonth = ICAL.Time.daysInMonth(this.last.month, this.last.year);
        this.last.day = Math.min(this.last.day, daysInMonth);
      }

      return data_valid;
    },

    next_weekday_by_week: function next_weekday_by_week() {
      var end_of_data = 0;

      if (this.next_hour() == 0) {
        return end_of_data;
      }

      if (!this.has_by_data("BYDAY")) {
        return 1;
      }

      for (;;) {
        var tt = new ICAL.Time();
        this.by_indices.BYDAY++;

        if (this.by_indices.BYDAY == this.by_data.BYDAY.length) {
          this.by_indices.BYDAY = 0;
          end_of_data = 1;
        }

        var coded_day = this.by_data.BYDAY[this.by_indices.BYDAY];
        var parts = this.ruleDayOfWeek(coded_day);
        var dow = parts[1];

        dow -= this.rule.wkst;

        if (dow < 0) {
          dow += 7;
        }

        tt.year = this.last.year;
        tt.month = this.last.month;
        tt.day = this.last.day;

        var startOfWeek = tt.startDoyWeek(this.rule.wkst);

        if (dow + startOfWeek < 1) {
          // The selected date is in the previous year
          if (!end_of_data) {
            continue;
          }
        }

        var next = ICAL.Time.fromDayOfYear(startOfWeek + dow,
                                                  this.last.year);

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
    },

    next_year: function next_year() {

      if (this.next_hour() == 0) {
        return 0;
      }

      if (++this.days_index == this.days.length) {
        this.days_index = 0;
        do {
          this.increment_year(this.rule.interval);
          this.expand_year_days(this.last.year);
        } while (this.days.length == 0);
      }

      var next = ICAL.Time.fromDayOfYear(this.days[this.days_index],
                                                this.last.year);

      this.last.day = next.day;
      this.last.month = next.month;

      return 1;
    },

    ruleDayOfWeek: function ruleDayOfWeek(dow) {
      var matches = dow.match(/([+-]?[0-9])?(MO|TU|WE|TH|FR|SA|SU)/);
      if (matches) {
        var pos = parseInt(matches[1] || 0, 10);
        dow = ICAL.Recur.icalDayToNumericDay(matches[2]);
        return [pos, dow];
      } else {
        return [0, 0];
      }
    },

    next_generic: function next_generic(aRuleType, aInterval, aDateAttr,
                                        aFollowingAttr, aPreviousIncr) {
      var has_by_rule = (aRuleType in this.by_data);
      var this_freq = (this.rule.freq == aInterval);
      var end_of_data = 0;

      if (aPreviousIncr && this[aPreviousIncr]() == 0) {
        return end_of_data;
      }

      if (has_by_rule) {
        this.by_indices[aRuleType]++;
        var idx = this.by_indices[aRuleType];
        var dta = this.by_data[aRuleType];

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
    },

    increment_monthday: function increment_monthday(inc) {
      for (var i = 0; i < inc; i++) {
        var daysInMonth = ICAL.Time.daysInMonth(this.last.month, this.last.year);
        this.last.day++;

        if (this.last.day > daysInMonth) {
          this.last.day -= daysInMonth;
          this.increment_month();
        }
      }
    },

    increment_month: function increment_month() {
      if (this.has_by_data("BYMONTH")) {
        this.by_indices.BYMONTH++;

        if (this.by_indices.BYMONTH == this.by_data.BYMONTH.length) {
          this.by_indices.BYMONTH = 0;
          this.increment_year(1);
        }

        this.last.month = this.by_data.BYMONTH[this.by_indices.BYMONTH];
      } else {
        var inc;
        if (this.rule.freq == "MONTHLY") {
          this.last.month += this.rule.interval;
        } else {
          this.last.month++;
        }

        this.last.month--;
        var years = ICAL.helpers.trunc(this.last.month / 12);
        this.last.month %= 12;
        this.last.month++;

        if (years != 0) {
          this.increment_year(years);
        }
      }
    },

    increment_year: function increment_year(inc) {
      this.last.year += inc;
    },

    increment_generic: function increment_generic(inc, aDateAttr,
                                                  aFactor, aNextIncrement) {
      this.last[aDateAttr] += inc;
      var nextunit = ICAL.helpers.trunc(this.last[aDateAttr] / aFactor);
      this.last[aDateAttr] %= aFactor;
      if (nextunit != 0) {
        this["increment_" + aNextIncrement](nextunit);
      }
    },

    has_by_data: function has_by_data(aRuleType) {
      return (aRuleType in this.rule.parts);
    },

    expand_year_days: function expand_year_days(aYear) {
      var t = new ICAL.Time();
      this.days = [];

      // We need our own copy with a few keys set
      var parts = {};
      var rules = ["BYDAY", "BYWEEKNO", "BYMONTHDAY", "BYMONTH", "BYYEARDAY"];
      for (var p in rules) {
        var part = rules[p];
        if (part in this.rule.parts) {
          parts[part] = this.rule.parts[part];
        }
      }

      if ("BYMONTH" in parts && "BYWEEKNO" in parts) {
        var valid = 1;
        var validWeeks = {};
        t.year = aYear;
        t.isDate = true;

        for (var monthIdx = 0; monthIdx < this.by_data.BYMONTH.length; monthIdx++) {
          var month = this.by_data.BYMONTH[monthIdx];
          t.month = month;
          t.day = 1;
          var first_week = t.weekNumber(this.rule.wkst);
          t.day = ICAL.Time.daysInMonth(month, aYear);
          var last_week = t.weekNumber(this.rule.wkst);
          for (monthIdx = first_week; monthIdx < last_week; monthIdx++) {
            validWeeks[monthIdx] = 1;
          }
        }

        for (var weekIdx = 0; weekIdx < this.by_data.BYWEEKNO.length && valid; weekIdx++) {
          var weekno = this.by_data.BYWEEKNO[weekIdx];
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

      var partCount = Object.keys(parts).length;

      if (partCount == 0) {
        var t = this.dtstart.clone();
        t.year = this.last.year;
        this.days.push(t.dayOfYear());
      } else if (partCount == 1 && "BYMONTH" in parts) {
        for (var monthkey in this.by_data.BYMONTH) {
          var t2 = this.dtstart.clone();
          t2.year = aYear;
          t2.month = this.by_data.BYMONTH[monthkey];
          t2.isDate = true;
          this.days.push(t2.dayOfYear());
        }
      } else if (partCount == 1 && "BYMONTHDAY" in parts) {
        for (var monthdaykey in this.by_data.BYMONTHDAY) {
          var t2 = this.dtstart.clone();
          t2.day = this.by_data.BYMONTHDAY[monthdaykey];
          t2.year = aYear;
          t2.isDate = true;
          this.days.push(t2.dayOfYear());
        }
      } else if (partCount == 2 &&
                 "BYMONTHDAY" in parts &&
                 "BYMONTH" in parts) {
        for (var monthkey in this.by_data.BYMONTH) {
          for (var monthdaykey in this.by_data.BYMONTHDAY) {
            t.day = this.by_data.BYMONTHDAY[monthdaykey];
            t.month = this.by_data.BYMONTH[monthkey];
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
        for (var monthkey in this.by_data.BYMONTH) {
          month = this.by_data.BYMONTH[monthkey];
          var daysInMonth = ICAL.Time.daysInMonth(month, aYear);

          t.year = aYear;
          t.month = this.by_data.BYMONTH[monthkey];
          t.day = 1;
          t.isDate = true;

          var first_dow = t.dayOfWeek();
          var doy_offset = t.dayOfYear() - 1;

          t.day = daysInMonth;
          var last_dow = t.dayOfWeek();

          if (this.has_by_data("BYSETPOS")) {
            var set_pos_counter = 0;
            var by_month_day = [];
            for (var day = 1; day <= daysInMonth; day++) {
              t.day = day;
              if (this.is_day_in_byday(t)) {
                by_month_day.push(day);
              }
            }

            for (var spIndex = 0; spIndex < by_month_day.length; spIndex++) {
              if (this.check_set_position(spIndex + 1) ||
                  this.check_set_position(spIndex - by_month_day.length)) {
                this.days.push(doy_offset + by_month_day[spIndex]);
              }
            }
          } else {
            for (var daycodedkey in this.by_data.BYDAY) {
              //TODO: This should return dates in order of occurrence
              //      (1,2,3, etc...) instead of by weekday (su, mo, etc..)
              var coded_day = this.by_data.BYDAY[daycodedkey];
              var parts = this.ruleDayOfWeek(coded_day);
              var pos = parts[0];
              var dow = parts[1];
              var month_day;

              var first_matching_day = ((dow + 7 - first_dow) % 7) + 1;
              var last_matching_day = daysInMonth - ((last_dow + 7 - dow) % 7);

              if (pos == 0) {
                for (var day = first_matching_day; day <= daysInMonth; day += 7) {
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
      } else if (partCount == 2 && "BYDAY" in parts && "BYMONTHDAY" in parts) {
        var expandedDays = this.expand_by_day(aYear);

        for (var daykey in expandedDays) {
          var day = expandedDays[daykey];
          var tt = ICAL.Time.fromDayOfYear(day, aYear);
          if (this.by_data.BYMONTHDAY.indexOf(tt.day) >= 0) {
            this.days.push(day);
          }
        }
      } else if (partCount == 3 &&
                 "BYDAY" in parts &&
                 "BYMONTHDAY" in parts &&
                 "BYMONTH" in parts) {
        var expandedDays = this.expand_by_day(aYear);

        for (var daykey in expandedDays) {
          var day = expandedDays[daykey];
          var tt = ICAL.Time.fromDayOfYear(day, aYear);

          if (this.by_data.BYMONTH.indexOf(tt.month) >= 0 &&
              this.by_data.BYMONTHDAY.indexOf(tt.day) >= 0) {
            this.days.push(day);
          }
        }
      } else if (partCount == 2 && "BYDAY" in parts && "BYWEEKNO" in parts) {
        var expandedDays = this.expand_by_day(aYear);

        for (var daykey in expandedDays) {
          var day = expandedDays[daykey];
          var tt = ICAL.Time.fromDayOfYear(day, aYear);
          var weekno = tt.weekNumber(this.rule.wkst);

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
      } else {
        this.days = [];
      }
      return 0;
    },

    expand_by_day: function expand_by_day(aYear) {

      var days_list = [];
      var tmp = this.last.clone();

      tmp.year = aYear;
      tmp.month = 1;
      tmp.day = 1;
      tmp.isDate = true;

      var start_dow = tmp.dayOfWeek();

      tmp.month = 12;
      tmp.day = 31;
      tmp.isDate = true;

      var end_dow = tmp.dayOfWeek();
      var end_year_day = tmp.dayOfYear();

      for (var daykey in this.by_data.BYDAY) {
        var day = this.by_data.BYDAY[daykey];
        var parts = this.ruleDayOfWeek(day);
        var pos = parts[0];
        var dow = parts[1];

        if (pos == 0) {
          var tmp_start_doy = ((dow + 7 - start_dow) % 7) + 1;

          for (var doy = tmp_start_doy; doy <= end_year_day; doy += 7) {
            days_list.push(doy);
          }

        } else if (pos > 0) {
          var first;
          if (dow >= start_dow) {
            first = dow - start_dow + 1;
          } else {
            first = dow - start_dow + 8;
          }

          days_list.push(first + (pos - 1) * 7);
        } else {
          var last;
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
    },

    is_day_in_byday: function is_day_in_byday(tt) {
      for (var daykey in this.by_data.BYDAY) {
        var day = this.by_data.BYDAY[daykey];
        var parts = this.ruleDayOfWeek(day);
        var pos = parts[0];
        var dow = parts[1];
        var this_dow = tt.dayOfWeek();

        if ((pos == 0 && dow == this_dow) ||
            (tt.nthWeekDay(dow, pos) == tt.day)) {
          return 1;
        }
      }

      return 0;
    },

    /**
     * Checks if given value is in BYSETPOS.
     *
     * @param {Numeric} aPos position to check for.
     * @return {Boolean} false unless BYSETPOS rules exist
     *                   and the given value is present in rules.
     */
    check_set_position: function check_set_position(aPos) {
      if (this.has_by_data('BYSETPOS')) {
        var idx = this.by_data.BYSETPOS.indexOf(aPos);
        // negative numbers are not false-y
        return idx !== -1;
      }
      return false;
    },

    sort_byday_rules: function icalrecur_sort_byday_rules(aRules, aWeekStart) {
      for (var i = 0; i < aRules.length; i++) {
        for (var j = 0; j < i; j++) {
          var one = this.ruleDayOfWeek(aRules[j])[1];
          var two = this.ruleDayOfWeek(aRules[i])[1];
          one -= aWeekStart;
          two -= aWeekStart;
          if (one < 0) one += 7;
          if (two < 0) two += 7;

          if (one > two) {
            var tmp = aRules[i];
            aRules[i] = aRules[j];
            aRules[j] = tmp;
          }
        }
      }
    },

    check_contract_restriction: function check_contract_restriction(aRuleType, v) {
      var indexMapValue = icalrecur_iterator._indexMap[aRuleType];
      var ruleMapValue = icalrecur_iterator._expandMap[this.rule.freq][indexMapValue];
      var pass = false;

      if (aRuleType in this.by_data &&
          ruleMapValue == icalrecur_iterator.CONTRACT) {

        var ruleType = this.by_data[aRuleType];

        for (var bydatakey in ruleType) {
          if (ruleType[bydatakey] == v) {
            pass = true;
            break;
          }
        }
      } else {
        // Not a contracting byrule or has no data, test passes
        pass = true;
      }
      return pass;
    },

    check_contracting_rules: function check_contracting_rules() {
      var dow = this.last.dayOfWeek();
      var weekNo = this.last.weekNumber(this.rule.wkst);
      var doy = this.last.dayOfYear();

      return (this.check_contract_restriction("BYSECOND", this.last.second) &&
              this.check_contract_restriction("BYMINUTE", this.last.minute) &&
              this.check_contract_restriction("BYHOUR", this.last.hour) &&
              this.check_contract_restriction("BYDAY", icalrecur_iterator._wkdayMap[dow]) &&
              this.check_contract_restriction("BYWEEKNO", weekNo) &&
              this.check_contract_restriction("BYMONTHDAY", this.last.day) &&
              this.check_contract_restriction("BYMONTH", this.last.month) &&
              this.check_contract_restriction("BYYEARDAY", doy));
    },

    setup_defaults: function setup_defaults(aRuleType, req, deftime) {
      var indexMapValue = icalrecur_iterator._indexMap[aRuleType];
      var ruleMapValue = icalrecur_iterator._expandMap[this.rule.freq][indexMapValue];

      if (ruleMapValue != icalrecur_iterator.CONTRACT) {
        if (!(aRuleType in this.by_data)) {
          this.by_data[aRuleType] = [deftime];
        }
        if (this.rule.freq != req) {
          return this.by_data[aRuleType][0];
        }
      }
      return deftime;
    },

    /**
     * Convert iterator into a serialize-able object.
     * Will preserve current iteration sequence to ensure
     * the seamless continuation of the recurrence rule.
     */
    toJSON: function() {
      var result = Object.create(null);

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

  };

  icalrecur_iterator._wkdayMap = ["", "SU", "MO", "TU", "WE", "TH", "FR", "SA"];

  icalrecur_iterator._indexMap = {
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

  icalrecur_iterator._expandMap = {
    "SECONDLY": [1, 1, 1, 1, 1, 1, 1, 1],
    "MINUTELY": [2, 1, 1, 1, 1, 1, 1, 1],
    "HOURLY": [2, 2, 1, 1, 1, 1, 1, 1],
    "DAILY": [2, 2, 2, 1, 1, 1, 1, 1],
    "WEEKLY": [2, 2, 2, 2, 3, 3, 1, 1],
    "MONTHLY": [2, 2, 2, 2, 2, 3, 3, 1],
    "YEARLY": [2, 2, 2, 2, 2, 2, 2, 2]
  };
  icalrecur_iterator.UNKNOWN = 0;
  icalrecur_iterator.CONTRACT = 1;
  icalrecur_iterator.EXPAND = 2;
  icalrecur_iterator.ILLEGAL = 3;

  return icalrecur_iterator;

}());
