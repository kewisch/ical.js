ICAL.RecurExpansion = (function() {
  function formatTime(item) {
    return ICAL.helpers.formatClassType(item, ICAL.icaltime);
  }

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

  /**
   * Primary class for expanding recurring rules.
   * Can take multiple RRULEs, RDATEs, EXDATE(s)
   * and iterate (in order) over each next occurrence.
   *
   * Once initialized this class can also be serialized
   * saved and continue iteration from the last point.
   *
   * NOTE: it is intended that this class is to be used
   *       with ICAL.Event which handles recurrence exceptions.
   *
   * Options:
   *  - startDate: (ICAL.icaltime) start time of event (required)
   *  - component: (ICAL.icalcomponent) component (required unless resuming)
   *
   * Examples:
   *
   *    // assuming event is a parsed ical component
   *    var event;
   *
   *    var expand = new ICAL.RecurExpansion({
   *      component: event,
   *      start: event.getFirstPropertyValue('DTSTART')
   *    });
   *
   *    // remember there are infinite rules
   *    // so its a good idea to limit the scope
   *    // of the iterations then resume later on.
   *
   *    // next is always an ICAL.icaltime or null
   *    var next;
   *
   *    while(someCondition && (next = expand.next())) {
   *      // do something with next
   *    }
   *
   *    // save instance for later
   *    var json = JSON.stringify(expand);
   *
   *    //...
   *
   *    // NOTE: if the component's properties have
   *    //       changed you will need to rebuild the
   *    //       class and start over. This only works
   *    //       when the component's recurrence info is the same.
   *    var expand = new ICAL.RecurExpansion(JSON.parse(json));
   *
   *
   * @param {Object} options see options block.
   */
  function RecurExpansion(options) {
    this.fromData(options);
  }

  RecurExpansion.prototype = {
    /**
     * Array of RRULE iterators.
     *
     * @type Array[ICAL.icalrecur_iterator]
     * @private
     */
    ruleIterators: null,

    /**
     * Array of RDATE instances.
     *
     * @type Array[ICAL.icaltime]
     * @private
     */
    ruleDates: null,

    /**
     * Array of EXDATE instances.
     *
     * @type Array[ICAL.icaltime]
     * @private
     */
    exDates: null,

    /**
     * Current position in ruleDates array.
     * @type Numeric
     * @private
     */
    ruleDateInc: 0,

    /**
     * Current position in exDates array
     * @type Numeric
     * @private
     */
    exDateInc: 0,

    /**
     * Current negative date.
     *
     * @type ICAL.icaltime
     * @private
     */
    exDate: null,

    /**
     * Current additional date.
     *
     * @type ICAL.icaltime
     * @private
     */
    ruleDate: null,

    /**
     * Start date of recurring rules.
     *
     * @type ICAL.icaltime
     */
    dtstart: null,

    /**
     * Last expanded time
     *
     * @type ICAL.icaltime
     */
    last: null,

    fromData: function(options) {
      var start = ICAL.helpers.formatClassType(options.dtstart, ICAL.icaltime);

      if (!start) {
        throw new Error('.dtstart (ICAL.icaltime) must be given');
      } else {
        this.dtstart = start;
      }

      if (options.component) {
        this._init(options.component);
      } else {
        this.last = formatTime(options.last);

        this.ruleIterators = options.ruleIterators.map(function(item) {
          return ICAL.helpers.formatClassType(item, ICAL.icalrecur_iterator);
        });

        this.ruleDates = options.ruleDates.map(formatTime);
        this.exDates = options.exDates.map(formatTime);
        this.ruleDateInc = options.ruleDateInc;
        this.exDateInc = options.exDateInc;

        this.exDate = this.exDates[this.exDateInc];
        this.ruleDate = this.ruleDates[this.ruleDateInc];
      }
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

        next = this.ruleDate;
        iter = this._nextRecurrenceIter(this.last);

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

        // if the ruleDate is still next increment it.
        if (this.ruleDate === next) {
          this._nextRuleDay();
        }

        this.last = next;

        // check the negative rules
        if (this.exDate) {
          compare = this.exDate.compare(this.last);

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
        return this.last;
      }
    },

    /**
     * Converts object into a serialize-able format.
     */
    toJSON: function() {
      function toJSON(item) {
        return item.toJSON();
      }

      var result = Object.create(null);
      result.ruleIterators = this.ruleIterators.map(toJSON);
      result.ruleDates = this.ruleDates.map(toJSON);
      result.exDates = this.exDates.map(toJSON);
      result.ruleDateInc = this.ruleDateInc;
      result.exDateInc = this.exDateInc;
      result.last = this.last.toJSON();
      result.dtstart = this.dtstart.toJSON();

      return result;
    },


    _extractDates: function(component, property) {
      var result = [];
      var props = component.getAllProperties(property);
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

    _init: function(component) {
      this.ruleIterators = [];

      this.last = this.dtstart.clone();

      if (component.hasProperty('RRULE')) {
        var rules = component.getAllProperties('RRULE');
        var i = 0;
        var len = rules.length;

        var rule;
        var iter;

        for (; i < len; i++) {
          rule = propertyValue(rules[i]);
          rule = new ICAL.icalrecur(rule);
          iter = rule.iterator(this.last);
          this.ruleIterators.push(iter);

          // increment to the next occurrence so future
          // calls to next return times beyond the initial iteration.
          // XXX: I find this suspicious might be a bug?
          iter.next();
        }
      }

      if (component.hasProperty('RDATE')) {
        this.ruleDates = this._extractDates(component, 'RDATE');
        this.ruleDateInc = ICAL.helpers.binsearchInsert(
          this.ruleDates,
          this.last,
          compareTime
        );

        this.ruleDate = this.ruleDates[this.ruleDateInc];
      }

      if (component.hasProperty('EXDATE')) {
        this.exDates = this._extractDates(component, 'EXDATE');
        // if we have a .last day we increment the index to beyond it.
        this.exDateInc = ICAL.helpers.binsearchInsert(
          this.exDates,
          this.last,
          compareTime
        );

        this.exDate = this.exDates[this.exDateInc];
      }
    },

    _nextExDay: function() {
      this.exDate = this.exDates[++this.exDateInc];
    },

    _nextRuleDay: function() {
      this.ruleDate = this.ruleDates[++this.ruleDateInc];
    },

    /**
     * Find and return the recurrence rule with the most
     * recent event and return it.
     *
     * @return {Object} iterator.
     */
    _nextRecurrenceIter: function() {
      var iters = this.ruleIterators;

      if (iters.length === 0) {
        return null;
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
