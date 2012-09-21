ICAL.Event = (function() {

  function Event(component, options) {
    this.component = component;
    this.exceptions = Object.create(null);

    if (options && options.exceptions) {
      options.exceptions.forEach(this.relateException, this);
    }
  }

  Event.prototype = {

    /**
     * List of related event exceptions.
     *
     * @type Array[ICAL.Event]
     */
    exceptions: null,

    /**
     * Relates a given event exception to this object.
     * If the given component does not share the UID of
     * this event it cannot be related and will throw an
     * exception.
     *
     * If this component is an exception it cannot have other
     * exceptions related to it.
     *
     * @param {ICAL.icalcomponent|ICAL.Event} obj component or event.
     */
    relateException: function(obj) {
      if (this.isRecurrenceException()) {
        throw new Error('cannot relate exception to exceptions');
      }

      if (obj instanceof ICAL.icalcomponent) {
        obj = new ICAL.Event(obj);
      }

      if (obj.uid !== this.uid) {
        throw new Error('attempted to relate unrelated exception');
      }

      // we don't sort or manage exceptions directly
      // here the recurrence expander handles that.
      this.exceptions[obj.recurrenceId.toString()] = obj;
    },

    /**
     * Returns the occurrence details based on its start time.
     * If the occurrence has an exception will return the details
     * for that exception.
     *
     * NOTE: this method is intend to be used in conjunction
     *       with the #iterator method.
     *
     * @param {ICAL.icaltime} occurrence time occurrence.
     */
    getOccurrenceDetails: function(occurrence) {
      var id = occurrence.toString();
      var result = {
        //XXX: Clone?
        recurrenceId: occurrence
      };

      if (id in this.exceptions) {
        var item = result.item = this.exceptions[id];
        result.startDate = item.startDate;
        result.endDate = item.endDate;
        result.item = item;
      } else {
        var end = occurrence.clone();
        end.addDuration(this.duration);

        result.endDate = end;
        result.startDate = occurrence;
        result.item = this;
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
      return new ICAL.RecurExpansion(
        this.component, startTime || this.startDate
      );
    },

    isRecurring: function() {
      var comp = this.component;
      return comp.hasProperty('RRULE') || comp.hasProperty('RDATE');
    },

    isRecurrenceException: function() {
      return this.component.hasProperty('RECURRENCE-ID');
    },

    _firstProp: function(name) {
      return this.component.getFirstPropertyValue(name);
    },

    /**
     * Return the first property value.
     * Most useful in cases where no properties
     * are expected and the value will be a text type.
     */
    _firstPropsValue: function(name) {
      var prop = this._firstProp(name);

      if (prop && prop.data && prop.data.value) {
        return prop.data.value[0];
      }

      return null;
    },

    get uid() {
      return this._firstPropsValue('UID');
    },

    get startDate() {
      return this._firstProp('DTSTART');
    },

    get endDate() {
      return this._firstProp('DTEND');
    },

    get duration() {
      // cached because its dynamically calculated
      // and may be frequently used. This could be problematic
      // later if we modify the underlying start/endDate.
      //
      // When do add that functionality it should expire this cache...
      if (!this._duration) {
        this._duration = this.endDate.subtractDate(this.startDate);
      }
      return this._duration;
    },

    get location() {
      return this._firstPropsValue('LOCATION');
    },

    get attendees() {
      //XXX: This is way lame we should have a better
      //     data structure for this later.
      return this.component.getAllProperties('ATTENDEE');
    },

    get summary() {
      return this._firstPropsValue('SUMMARY');
    },

    get description() {
      return this._firstPropsValue('DESCRIPTION');
    },

    get organizer() {
      return this._firstProp('ORGANIZER');
    },

    get recurrenceId() {
      return this._firstProp('RECURRENCE-ID');
    }
  };

  return Event;

}());
