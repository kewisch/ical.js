ICAL.RecurExpansion = (function() {
  function compareTime(a, b) {
    return a.compare(b);
  }

  function isRecurringComponent(comp) {
    return comp.hasProperty('RDATE') ||
           comp.hasProperty('RRULE') ||
           comp.hasProperty('RECURRENCE-ID');
  }

  function propertyValue(prop) {
    return prop.data.value[0];
  }

  function RecurExpansion(component, startDate) {
    this.component = component;
    this.currentTime = startDate.clone();
    this._ensureRules();
  }

  RecurExpansion.prototype = {
    rules: null,

    _ruleIterators: null,

    _ruleDates: null,
    _exDates: null,
    _ruleDateInc: 0,
    _exDateInc: 0,

    currentTime: null,

    _extractDates: function(property) {
      var result = [];
      var props = this.component.getAllProperties(property);
      var len = props.length;
      var i = 0;
      var prop;

      var idx;

      for (; i < len; i++) {
        prop = propertyValue(props[i]);

        idx = ICAL.helpers.binsearchInsert(
          result,
          prop,
          compareTime
        );

        // ordered insert
        result.splice(idx, 0, prop);
      }

      return result;
    },

    _ensureRules: function() {
      if (!this._rules && this.component.hasProperty('RRULE')) {
        var rules = this.component.getAllProperties('RRULE');
        var i = 0;
        var len = rules.length;
        this._rules = [];

        this._ruleIterators = [];

        var rule;

        for (; i < len; i++) {
          rule = propertyValue(rules[i]);
          rule = this._rules.push(new ICAL.icalrecur(rule));
        }
      }

      if (!this._ruleDates && this.component.hasProperty('RDATE')) {
        this._ruleDates = this._extractDates('RDATE');
        this._ruleDateInc = ICAL.helpers.binsearchInsert(
          this._ruleDates,
          this.currentTime,
          compareTime
        );

        this.ruleDay = this._ruleDates[this._ruleDateInc];
      }

      if (!this._exDates && this.component.hasProperty('EXDATE')) {
        this._exDates = this._extractDates('EXDATE');
        // if we have a .currentTime day we increment the index to beyond it.
        this._exDateInc = ICAL.helpers.binsearchInsert(
          this._exDates,
          this.currentTime,
          compareTime
        );

        this.exDate = this._exDates[this._exDateInc];
      }
    },

    _nextExDay: function() {
      this.exDate = this._exDates[++this._exDateInc];
    },

    _nextRuleDay: function() {
      this.ruleDay = this._ruleDates[++this._ruleDateInc];
    },

    next: function() {
      var iter;
      var ruleOfDay;
      var next;
      var compare;

      var maxTries = 500;
      var currentTry = 0;

      while (true) {
        if (currentTry++ > maxTries) {
          throw new Error(
            'max tries have occured, rule may be impossible to forfill.'
          );
        }

        next = this.ruleDay;
        iter = this._nextRecurrenceIter(this.currentTime);

        // no more matches
        // because we increment the rule day or rule
        // _after_ we choose a value this should be
        // the only spot where we need to worry about the
        // end of events.
        if (!next && !iter) {
          break;
        }

        // no next rule day or recurrence rule is first.
        if (!next || next.compare(iter.last) > 0) {
          // must be cloned, recur will reuse the time element.
          next = iter.last.clone();
          // move to next so we can continue
          iter.next();
        }

        // if the ruleDay is still next increment it.
        if (this.ruleDay === next) {
          this._nextRuleDay();
        }

        this.currentTime = next;

        // check the negative rules
        if (this.exDate) {
          compare = this.exDate.compare(this.currentTime);

          if (compare < 0) {
            this._nextExDay();
          }

          // if the current rule is excluded skip it.
          if (compare === 0) {
            this._nextExDay();
            continue;
          }
        }

        //XXX: The spec states that after we resolve the final
        //     list of dates we execute EXDATE this seems somewhat counter
        //     intuitive to what I have seen most servers do so for now
        //     I exclude based on the original date not the one that may
        //     have been modified by the exception.
        return this.currentTime;
      }
    },

    /**
     * Find and return the recurrence rule with the most
     * recent event and return it.
     *
     * @param {ICAL.icaltime} start start time.
     * @return {Object} iterator.
     */
    _nextRecurrenceIter: function(start) {
      var iters = this._ruleIterators;

      if (this._rules.length === 0)
        return null;

      // if current list of iterations is out of date.
      if (iters.length !== this._rules.length) {
        // start from missing one
        var iterIdx = iters.length;
        var iterLen = this._rules.length;

        // add them to list in order of rules
        // XXX: this will break horribly if rules
        // are removed and _ruleIterators are not.
        for (; iterIdx < iterLen; iterIdx++) {
          iters[iterIdx] = this._rules[iterIdx].iterator(start);
          // after building the rule we must call the initial .next
          // here so the iterator is ready and will respond correctly
          // the next time we call its .next method.
          iters[iterIdx].next();
        }
      }

      var len = iters.length;
      var iter;
      var iterTime;
      var iterIdx = 0;
      var chosenIter;

      // loop through each iterator
      for (; iterIdx < len; iterIdx++) {
        iter = iters[iterIdx];
        iterTime = iter.last;

        // find the most recent possible choice
        if (!chosenIter || chosenIter.last.compare(iterTime) > 0) {
          // that iterator is saved
          chosenIter = iter;
        }
      }

      // the chosen iterator is returned but not mutated
      // this iterator contains the most recent event.
      return chosenIter;
    }

  };

  return RecurExpansion;

}());
