ICAL.Event = (function() {

  function compareRangeException(a, b) {
    if (a[0] > b[0]) return 1;
    if (b[0] > a[0]) return -1;
    return 0;
  }

  function Event(component, options) {
    if (!(component instanceof ICAL.Component)) {
      options = component;
      component = null;
    }

    if (component) {
      this.component = component;
    } else {
      this.component = new ICAL.Component('vevent');
    }

    this._rangeExceptionCache = Object.create(null);
    this.exceptions = Object.create(null);
    this.rangeExceptions = [];

    if (options && options.strictExceptions) {
      this.strictExceptions = options.strictExceptions;
    }

    if (options && options.exceptions) {
      options.exceptions.forEach(this.relateException, this);
    }
  }

  Event.prototype = {

    THISANDFUTURE: 'THISANDFUTURE',

    /**
     * List of related event exceptions.
     *
     * @type Array[ICAL.Event]
     */
    exceptions: null,

    /**
     * When true will verify exceptions are related by their UUID.
     *
     * @type {Boolean}
     */
    strictExceptions: false,

    /**
     * Relates a given event exception to this object.
     * If the given component does not share the UID of
     * this event it cannot be related and will throw an
     * exception.
     *
     * If this component is an exception it cannot have other
     * exceptions related to it.
     *
     * @param {ICAL.Component|ICAL.Event} obj component or event.
     */
    relateException: function(obj) {
      if (this.isRecurrenceException()) {
        throw new Error('cannot relate exception to exceptions');
      }

      if (obj instanceof ICAL.Component) {
        obj = new ICAL.Event(obj);
      }

      if (this.strictExceptions && obj.uid !== this.uid) {
        throw new Error('attempted to relate unrelated exception');
      }

      var id = obj.recurrenceId.toString();

      // we don't sort or manage exceptions directly
      // here the recurrence expander handles that.
      this.exceptions[id] = obj;

      // index RANGE=THISANDFUTURE exceptions so we can
      // look them up later in getOccurrenceDetails.
      if (obj.modifiesFuture()) {
        var item = [
          obj.recurrenceId.toUnixTime(), id
        ];

        // we keep them sorted so we can find the nearest
        // value later on...
        var idx = ICAL.helpers.binsearchInsert(
          this.rangeExceptions,
          item,
          compareRangeException
        );

        this.rangeExceptions.splice(idx, 0, item);
      }
    },

    /**
     * If this record is an exception and has the RANGE=THISANDFUTURE value.
     *
     * @return {Boolean} true when is exception with range.
     */
    modifiesFuture: function() {
      var range = this.component.getFirstPropertyValue('range');
      return range === this.THISANDFUTURE;
    },

    /**
     * Finds the range exception nearest to the given date.
     *
     * @param {ICAL.Time} time usually an occurrence time of an event.
     * @return {ICAL.Event|Null} the related event/exception or null.
     */
    findRangeException: function(time) {
      if (!this.rangeExceptions.length) {
        return null;
      }

      var utc = time.toUnixTime();
      var idx = ICAL.helpers.binsearchInsert(
        this.rangeExceptions,
        [utc],
        compareRangeException
      );

      idx -= 1;

      // occurs before
      if (idx < 0) {
        return null;
      }

      var rangeItem = this.rangeExceptions[idx];

      // sanity check
      if (utc < rangeItem[0]) {
        return null;
      }

      return rangeItem[1];
    },

    /**
     * Returns the occurrence details based on its start time.
     * If the occurrence has an exception will return the details
     * for that exception.
     *
     * NOTE: this method is intend to be used in conjunction
     *       with the #iterator method.
     *
     * @param {ICAL.Time} occurrence time occurrence.
     */
    getOccurrenceDetails: function(occurrence) {
      var id = occurrence.toString();
      var utcId = occurrence.convertToZone(ICAL.Timezone.utcTimezone).toString();
      var result = {
        //XXX: Clone?
        recurrenceId: occurrence
      };

      if (id in this.exceptions) {
        var item = result.item = this.exceptions[id];
        result.startDate = item.startDate;
        result.endDate = item.endDate;
        result.item = item;
      } else if (utcId in this.exceptions) {
        var item = this.exceptions[utcId];
        result.startDate = item.startDate;
        result.endDate = item.endDate;
        result.item = item;
      } else {
        // range exceptions (RANGE=THISANDFUTURE) have a
        // lower priority then direct exceptions but
        // must be accounted for first. Their item is
        // always the first exception with the range prop.
        var rangeExceptionId = this.findRangeException(
          occurrence
        );

        if (rangeExceptionId) {
          var exception = this.exceptions[rangeExceptionId];

          // range exception must modify standard time
          // by the difference (if any) in start/end times.
          result.item = exception;

          var startDiff = this._rangeExceptionCache[rangeExceptionId];

          if (!startDiff) {
            var original = exception.recurrenceId.clone();
            var newStart = exception.startDate.clone();

            // zones must be same otherwise subtract may be incorrect.
            original.zone = newStart.zone;
            var startDiff = newStart.subtractDate(original);

            this._rangeExceptionCache[rangeExceptionId] = startDiff;
          }

          var start = occurrence.clone();
          start.zone = exception.startDate.zone;
          start.addDuration(startDiff);

          var end = start.clone();
          end.addDuration(exception.duration);

          result.startDate = start;
          result.endDate = end;
        } else {
          // no range exception standard expansion
          var end = occurrence.clone();
          end.addDuration(this.duration);

          result.endDate = end;
          result.startDate = occurrence;
          result.item = this;
        }
      }

      return result;
    },

    /**
     * Builds a recur expansion instance for a specific
     * point in time (defaults to startDate).
     *
     * @return {ICAL.RecurExpansion} expander object.
     */
    iterator: function(startTime) {
      return new ICAL.RecurExpansion({
        component: this.component,
        dtstart: startTime || this.startDate
      });
    },

    isRecurring: function() {
      var comp = this.component;
      return comp.hasProperty('rrule') || comp.hasProperty('rdate');
    },

    isRecurrenceException: function() {
      return this.component.hasProperty('recurrence-id');
    },

    /**
     * Returns the types of recurrences this event may have.
     *
     * Returned as an object with the following possible keys:
     *
     *    - YEARLY
     *    - MONTHLY
     *    - WEEKLY
     *    - DAILY
     *    - MINUTELY
     *    - SECONDLY
     *
     * @return {Object} object of recurrence flags.
     */
    getRecurrenceTypes: function() {
      var rules = this.component.getAllProperties('rrule');
      var i = 0;
      var len = rules.length;
      var result = Object.create(null);

      for (; i < len; i++) {
        var value = rules[i].getFirstValue();
        result[value.freq] = true;
      }

      return result;
    },

    get uid() {
      return this._firstProp('uid');
    },

    set uid(value) {
      this._setProp('uid', value);
    },

    get startDate() {
      return this._firstProp('dtstart');
    },

    set startDate(value) {
      this._setTime('dtstart', value);
    },

    get endDate() {
      return this._firstProp('dtend');
    },

    set endDate(value) {
      this._setTime('dtend', value);
    },

    get duration() {
      return this.endDate.subtractDate(this.startDate);
    },

    get location() {
      return this._firstProp('location');
    },

    set location(value) {
      return this._setProp('location', value);
    },

    get attendees() {
      //XXX: This is way lame we should have a better
      //     data structure for this later.
      return this.component.getAllProperties('attendee');
    },

    get summary() {
      return this._firstProp('summary');
    },

    set summary(value) {
      this._setProp('summary', value);
    },

    get description() {
      return this._firstProp('description');
    },

    set description(value) {
      this._setProp('description', value);
    },

    get organizer() {
      return this._firstProp('organizer');
    },

    set organizer(value) {
      this._setProp('organizer', value);
    },

    get sequence() {
      return this._firstProp('sequence');
    },

    set sequence(value) {
      this._setProp('sequence', value);
    },

    get recurrenceId() {
      return this._firstProp('recurrence-id');
    },

    set recurrenceId(value) {
      this._setProp('recurrence-id', value);
    },

    /**
     * set/update a time property's value.
     * This will also update the TZID of the property.
     *
     * TODO: this method handles the case where we are switching
     * from a known timezone to an implied timezone (one without TZID).
     * This does _not_ handle the case of moving between a known
     *  (by TimezoneService) timezone to an unknown timezone...
     *
     * We will not add/remove/update the VTIMEZONE subcomponents
     *  leading to invalid ICAL data...
     */
    _setTime: function(propName, time) {
      var prop = this.component.getFirstProperty(propName);

      if (!prop) {
        prop = new ICAL.Property(propName);
        this.component.addProperty(prop);
      }

      // utc and local don't get a tzid
      if (
        time.zone === ICAL.Timezone.localTimezone ||
        time.zone === ICAL.Timezone.utcTimezone
      ) {
        // remove the tzid
        prop.removeParameter('tzid');
      } else {
        prop.setParameter('tzid', time.zone.tzid);
      }

      prop.setValue(time);
    },

    _setProp: function(name, value) {
      this.component.updatePropertyWithValue(name, value);
    },

    _firstProp: function(name) {
      return this.component.getFirstPropertyValue(name);
    },

    toString: function() {
      return this.component.toString();
    }

  };

  return Event;

}());
