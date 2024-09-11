/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch */

import { binsearchInsert } from "./helpers.js";
import Component from "./component.js";
import Property from "./property.js";
import Timezone from "./timezone.js";
// needed for typescript type resolution
// eslint-disable-next-line no-unused-vars
import Time from "./time.js";
// eslint-disable-next-line no-unused-vars
import Duration from "./duration.js";
import RecurExpansion from "./recur_expansion.js";

/**
 * This lets typescript resolve our custom types in the
 * generated d.ts files (jsdoc typedefs are converted to typescript types).
 * Ignore prevents the typedefs from being documented more than once.
 * @ignore
 * @typedef {import("./types.js").frequencyValues} frequencyValues
 * Imports the 'frequencyValues' type from the "types.js" module
 * @typedef {import("./types.js").occurrenceDetails} occurrenceDetails
 * Imports the 'occurrenceDetails' type from the "types.js" module
 */

/**
 * ICAL.js is organized into multiple layers. The bottom layer is a raw jCal
 * object, followed by the component/property layer. The highest level is the
 * event representation, which this class is part of. See the
 * {@tutorial layers} guide for more details.
 *
 * @memberof ICAL
 */
class Event {
  /**
   * Creates a new ICAL.Event instance.
   *
   * @param {Component=} component              The ICAL.Component to base this event on
   * @param {Object} [options]                  Options for this event
   * @param {Boolean=} options.strictExceptions  When true, will verify exceptions are related by
   *                                              their UUID
   * @param {Array<Component|Event>=} options.exceptions
   *          Exceptions to this event, either as components or events. If not
   *            specified exceptions will automatically be set in relation of
   *            component's parent
   */
  constructor(component, options) {
    if (!(component instanceof Component)) {
      options = component;
      component = null;
    }

    if (component) {
      this.component = component;
    } else {
      this.component = new Component('vevent');
    }

    this._rangeExceptionCache = Object.create(null);
    this.exceptions = Object.create(null);
    this.rangeExceptions = [];

    if (options && options.strictExceptions) {
      this.strictExceptions = options.strictExceptions;
    }

    if (options && options.exceptions) {
      options.exceptions.forEach(this.relateException, this);
    } else if (this.component.parent && !this.isRecurrenceException()) {
      this.component.parent.getAllSubcomponents('vevent').forEach(function(event) {
        if (event.hasProperty('recurrence-id')) {
          this.relateException(event);
        }
      }, this);
    }
  }


  static THISANDFUTURE = 'THISANDFUTURE';

  /**
   * List of related event exceptions.
   *
   * @type {Event[]}
   */
  exceptions = null;

  /**
   * When true, will verify exceptions are related by their UUID.
   *
   * @type {Boolean}
   */
  strictExceptions = false;

  /**
   * Relates a given event exception to this object.  If the given component
   * does not share the UID of this event it cannot be related and will throw
   * an exception.
   *
   * If this component is an exception it cannot have other exceptions
   * related to it.
   *
   * @param {Component|Event} obj       Component or event
   */
  relateException(obj) {
    if (this.isRecurrenceException()) {
      throw new Error('cannot relate exception to exceptions');
    }

    if (obj instanceof Component) {
      obj = new Event(obj);
    }

    if (this.strictExceptions && obj.uid !== this.uid) {
      throw new Error('attempted to relate unrelated exception');
    }

    let id = obj.recurrenceId.toString();

    // we don't sort or manage exceptions directly
    // here the recurrence expander handles that.
    this.exceptions[id] = obj;

    // index RANGE=THISANDFUTURE exceptions so we can
    // look them up later in getOccurrenceDetails.
    if (obj.modifiesFuture()) {
      let item = [
        obj.recurrenceId.toUnixTime(), id
      ];

      // we keep them sorted so we can find the nearest
      // value later on...
      let idx = binsearchInsert(
        this.rangeExceptions,
        item,
        compareRangeException
      );

      this.rangeExceptions.splice(idx, 0, item);
    }
  }

  /**
   * Checks if this record is an exception and has the RANGE=THISANDFUTURE
   * value.
   *
   * @return {Boolean}        True, when exception is within range
   */
  modifiesFuture() {
    if (!this.component.hasProperty('recurrence-id')) {
      return false;
    }

    let range = this.component.getFirstProperty('recurrence-id').getParameter('range');
    return range === Event.THISANDFUTURE;
  }

  /**
   * Finds the range exception nearest to the given date.
   *
   * @param {Time} time   usually an occurrence time of an event
   * @return {?Event}     the related event/exception or null
   */
  findRangeException(time) {
    if (!this.rangeExceptions.length) {
      return null;
    }

    let utc = time.toUnixTime();
    let idx = binsearchInsert(
      this.rangeExceptions,
      [utc],
      compareRangeException
    );

    idx -= 1;

    // occurs before
    if (idx < 0) {
      return null;
    }

    let rangeItem = this.rangeExceptions[idx];

    /* c8 ignore next 4 */
    if (utc < rangeItem[0]) {
      // sanity check only
      return null;
    }

    return rangeItem[1];
  }

  /**
   * Returns the occurrence details based on its start time.  If the
   * occurrence has an exception will return the details for that exception.
   *
   * NOTE: this method is intend to be used in conjunction
   *       with the {@link ICAL.Event#iterator iterator} method.
   *
   * @param {Time} occurrence               time occurrence
   * @return {occurrenceDetails}            Information about the occurrence
   */
  getOccurrenceDetails(occurrence) {
    let id = occurrence.toString();
    let utcId = occurrence.convertToZone(Timezone.utcTimezone).toString();
    let item;
    let result = {
      //XXX: Clone?
      recurrenceId: occurrence
    };

    if (id in this.exceptions) {
      item = result.item = this.exceptions[id];
      result.startDate = item.startDate;
      result.endDate = item.endDate;
      result.item = item;
    } else if (utcId in this.exceptions) {
      item = this.exceptions[utcId];
      result.startDate = item.startDate;
      result.endDate = item.endDate;
      result.item = item;
    } else {
      // range exceptions (RANGE=THISANDFUTURE) have a
      // lower priority then direct exceptions but
      // must be accounted for first. Their item is
      // always the first exception with the range prop.
      let rangeExceptionId = this.findRangeException(
        occurrence
      );
      let end;

      if (rangeExceptionId) {
        let exception = this.exceptions[rangeExceptionId];

        // range exception must modify standard time
        // by the difference (if any) in start/end times.
        result.item = exception;

        let startDiff = this._rangeExceptionCache[rangeExceptionId];

        if (!startDiff) {
          let original = exception.recurrenceId.clone();
          let newStart = exception.startDate.clone();

          // zones must be same otherwise subtract may be incorrect.
          original.zone = newStart.zone;
          startDiff = newStart.subtractDate(original);

          this._rangeExceptionCache[rangeExceptionId] = startDiff;
        }

        let start = occurrence.clone();
        start.zone = exception.startDate.zone;
        start.addDuration(startDiff);

        end = start.clone();
        end.addDuration(exception.duration);

        result.startDate = start;
        result.endDate = end;
      } else {
        // no range exception standard expansion
        end = occurrence.clone();
        end.addDuration(this.duration);

        result.endDate = end;
        result.startDate = occurrence;
        result.item = this;
      }
    }

    return result;
  }

  /**
   * Builds a recur expansion instance for a specific point in time (defaults
   * to startDate).
   *
   * @param {Time=} startTime     Starting point for expansion
   * @return {RecurExpansion}    Expansion object
   */
  iterator(startTime) {
    return new RecurExpansion({
      component: this.component,
      dtstart: startTime || this.startDate
    });
  }

  /**
   * Checks if the event is recurring
   *
   * @return {Boolean}        True, if event is recurring
   */
  isRecurring() {
    let comp = this.component;
    return comp.hasProperty('rrule') || comp.hasProperty('rdate');
  }

  /**
   * Checks if the event describes a recurrence exception. See
   * {@tutorial terminology} for details.
   *
   * @return {Boolean}    True, if the event describes a recurrence exception
   */
  isRecurrenceException() {
    return this.component.hasProperty('recurrence-id');
  }

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
   * @return {Object.<frequencyValues, Boolean>}
   *          Object of recurrence flags
   */
  getRecurrenceTypes() {
    let rules = this.component.getAllProperties('rrule');
    let i = 0;
    let len = rules.length;
    let result = Object.create(null);

    for (; i < len; i++) {
      let value = rules[i].getFirstValue();
      result[value.freq] = true;
    }

    return result;
  }

  /**
   * The uid of this event
   * @type {String}
   */
  get uid() {
    return this._firstProp('uid');
  }

  set uid(value) {
    this._setProp('uid', value);
  }

  /**
   * The start date
   * @type {Time}
   */
  get startDate() {
    return this._firstProp('dtstart');
  }

  set startDate(value) {
    this._setTime('dtstart', value);
  }

  /**
   * The end date. This can be the result directly from the property, or the
   * end date calculated from start date and duration. Setting the property
   * will remove any duration properties.
   * @type {Time}
   */
  get endDate() {
    let endDate = this._firstProp('dtend');
    if (!endDate) {
        let duration = this._firstProp('duration');
        endDate = this.startDate.clone();
        if (duration) {
            endDate.addDuration(duration);
        } else if (endDate.isDate) {
            endDate.day += 1;
        }
    }
    return endDate;
  }

  set endDate(value) {
    if (this.component.hasProperty('duration')) {
      this.component.removeProperty('duration');
    }
    this._setTime('dtend', value);
  }

  /**
   * The duration. This can be the result directly from the property, or the
   * duration calculated from start date and end date. Setting the property
   * will remove any `dtend` properties.
   * @type {Duration}
   */
  get duration() {
    let duration = this._firstProp('duration');
    if (!duration) {
      return this.endDate.subtractDateTz(this.startDate);
    }
    return duration;
  }

  set duration(value) {
    if (this.component.hasProperty('dtend')) {
      this.component.removeProperty('dtend');
    }

    this._setProp('duration', value);
  }

  /**
   * The location of the event.
   * @type {String}
   */
  get location() {
    return this._firstProp('location');
  }

  set location(value) {
    this._setProp('location', value);
  }

  /**
   * The attendees in the event
   * @type {Property[]}
   */
  get attendees() {
    //XXX: This is way lame we should have a better
    //     data structure for this later.
    return this.component.getAllProperties('attendee');
  }

  /**
   * The event summary
   * @type {String}
   */
  get summary() {
    return this._firstProp('summary');
  }

  set summary(value) {
    this._setProp('summary', value);
  }

  /**
   * The event description.
   * @type {String}
   */
  get description() {
    return this._firstProp('description');
  }

  set description(value) {
    this._setProp('description', value);
  }

  /**
   * The event color from [rfc7986](https://datatracker.ietf.org/doc/html/rfc7986)
   * @type {String}
   */
  get color() {
    return this._firstProp('color');
  }

  set color(value) {
    this._setProp('color', value);
  }

  /**
   * The organizer value as an uri. In most cases this is a mailto: uri, but
   * it can also be something else, like urn:uuid:...
   * @type {String}
   */
  get organizer() {
    return this._firstProp('organizer');
  }

  set organizer(value) {
    this._setProp('organizer', value);
  }

  /**
   * The sequence value for this event. Used for scheduling
   * see {@tutorial terminology}.
   * @type {Number}
   */
  get sequence() {
    return this._firstProp('sequence');
  }

  set sequence(value) {
    this._setProp('sequence', value);
  }

  /**
   * The recurrence id for this event. See {@tutorial terminology} for details.
   * @type {Time}
   */
  get recurrenceId() {
    return this._firstProp('recurrence-id');
  }

  set recurrenceId(value) {
    this._setTime('recurrence-id', value);
  }

  /**
   * Set/update a time property's value.
   * This will also update the TZID of the property.
   *
   * TODO: this method handles the case where we are switching
   * from a known timezone to an implied timezone (one without TZID).
   * This does _not_ handle the case of moving between a known
   *  (by TimezoneService) timezone to an unknown timezone...
   *
   * We will not add/remove/update the VTIMEZONE subcomponents
   *  leading to invalid ICAL data...
   * @private
   * @param {String} propName     The property name
   * @param {Time} time           The time to set
   */
  _setTime(propName, time) {
    let prop = this.component.getFirstProperty(propName);

    if (!prop) {
      prop = new Property(propName);
      this.component.addProperty(prop);
    }

    // utc and local don't get a tzid
    if (
      time.zone === Timezone.localTimezone ||
      time.zone === Timezone.utcTimezone
    ) {
      // remove the tzid
      prop.removeParameter('tzid');
    } else {
      prop.setParameter('tzid', time.zone.tzid);
    }

    prop.setValue(time);
  }

  _setProp(name, value) {
    this.component.updatePropertyWithValue(name, value);
  }

  _firstProp(name) {
    return this.component.getFirstPropertyValue(name);
  }

  /**
   * The string representation of this event.
   * @return {String}
   */
  toString() {
    return this.component.toString();
  }
}
export default Event;

function compareRangeException(a, b) {
  if (a[0] > b[0]) return 1;
  if (b[0] > a[0]) return -1;
  return 0;
}
