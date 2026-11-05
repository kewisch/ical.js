---
title: Event
kind: class
longname: ICAL.Event
description: ICAL.js is organized into multiple layers. The bottom layer is a raw jCal object, followed by the component/property layer. The highest level is the event representation, which this class is part of. See the {@tutorial layers} guide for more details.
---

# Event

<SourceLink href="/source/event-js/#L36" label="event.js:36" />

ICAL.js is organized into multiple layers. The bottom layer is a raw jCal object, followed by the component/property layer. The highest level is the event representation, which this class is part of. See the {@tutorial layers} guide for more details.

---

## Constructor

<Signature code="new Event(component?: ICAL.Component, options?: Object): Event" />

Creates a new ICAL.Event instance.

**Parameters**

- `component` ([ICAL.Component](/ical#component), optional) — The ICAL.Component to base this event on
- `options` (Object, optional) — Options for this event
  - `options.strictExceptions` (Boolean, optional) — When true, will verify exceptions are related by their UUID
  - `options.exceptions` (Array.\<([Component](/ical#component)|[Event](/ical#event))>, optional) — Exceptions to this event, either as components or events. If not specified exceptions will automatically be set in relation of component's parent

---

## Instance Methods

<MemberHeading id="relateexception" depth="3" name="relateException" sig="relateException(obj: ICAL.Component | ICAL.Event)" />

<MemberMeta sourceHref="/source/event-js/#L107" sourceLabel="event.js:107" />

Relates a given event exception to this object. If the given component does not share the UID of this event it cannot be related and will throw an exception.

If this component is an exception it cannot have other exceptions related to it.

**Parameters**

- `obj` ([ICAL.Component](/ical#component) | [ICAL.Event](/ical#event)) — Component or event

<MemberHeading id="modifiesfuture" depth="3" name="modifiesFuture" sig="modifiesFuture(): Boolean" />

<MemberMeta sourceHref="/source/event-js/#L151" sourceLabel="event.js:151" />

Checks if this record is an exception and has the RANGE=THISANDFUTURE value.

**Returns**

- `Boolean` — True, when exception is within range

<MemberHeading id="findrangeexception" depth="3" name="findRangeException" sig="findRangeException(time: ICAL.Time): ICAL.Event" />

<MemberMeta sourceHref="/source/event-js/#L166" sourceLabel="event.js:166" />

Finds the range exception nearest to the given date.

**Parameters**

- `time` ([ICAL.Time](/ical#time)) — usually an occurrence time of an event

**Returns**

- [`ICAL.Event`](/ical#event) — the related event/exception or null

<MemberHeading
  id="getoccurrencedetails"
  depth="3"
  name="getOccurrenceDetails"
  sig="getOccurrenceDetails(
	occurrence: ICAL.Time,
): ICAL.Event.occurrenceDetails"
/>

<MemberMeta sourceHref="/source/event-js/#L206" sourceLabel="event.js:206" />

Returns the occurrence details based on its start time. If the occurrence has an exception will return the details for that exception.

NOTE: this method is intend to be used in conjunction with the [iterator](/ical/event#iterator) method.

**Parameters**

- `occurrence` ([ICAL.Time](/ical#time)) — time occurrence

**Returns**

- [`ICAL.Event.occurrenceDetails`](/ical/event#occurrencedetails) — Information about the occurrence

<MemberHeading id="iterator" depth="3" name="iterator" sig="iterator(startTime?: ICAL.Time): ICAL.RecurExpansion" />

<MemberMeta sourceHref="/source/event-js/#L285" sourceLabel="event.js:285" />

Builds a recur expansion instance for a specific point in time (defaults to startDate).

**Parameters**

- `startTime` ([ICAL.Time](/ical#time), optional) — Starting point for expansion

**Returns**

- [`ICAL.RecurExpansion`](/ical#recurexpansion) — Expansion object

<MemberHeading id="isrecurring" depth="3" name="isRecurring" sig="isRecurring(): Boolean" />

<MemberMeta sourceHref="/source/event-js/#L297" sourceLabel="event.js:297" />

Checks if the event is recurring

**Returns**

- `Boolean` — True, if event is recurring

<MemberHeading id="isrecurrenceexception" depth="3" name="isRecurrenceException" sig="isRecurrenceException(): Boolean" />

<MemberMeta sourceHref="/source/event-js/#L308" sourceLabel="event.js:308" />

Checks if the event describes a recurrence exception. See {@tutorial terminology} for details.

**Returns**

- `Boolean` — True, if the event describes a recurrence exception

<MemberHeading
  id="getrecurrencetypes"
  depth="3"
  name="getRecurrenceTypes"
  sig="getRecurrenceTypes(
): Object.<ICAL.Recur.frequencyValues, Boolean>"
/>

<MemberMeta sourceHref="/source/event-js/#L327" sourceLabel="event.js:327" />

Returns the types of recurrences this event may have.

Returned as an object with the following possible keys:

- YEARLY
- MONTHLY
- WEEKLY
- DAILY
- MINUTELY
- SECONDLY

**Returns**

- `Object.<`[`ICAL.Recur.frequencyValues`](/ical/recur#frequencyvalues)`, Boolean>` — Object of recurrence flags

<MemberHeading id="tostring" depth="3" name="toString" sig="toString(): String" />

<MemberMeta sourceHref="/source/event-js/#L559" sourceLabel="event.js:559" />

The string representation of this event.

**Returns**

- `String`

## Instance Fields

<MemberHeading id="exceptions" depth="3" name="exceptions" sig="exceptions: Array.<Event>" />

<MemberMeta sourceHref="/source/event-js/#L88" sourceLabel="event.js:88" />

List of related event exceptions.

<MemberHeading id="strictexceptions" depth="3" name="strictExceptions" sig="strictExceptions: Boolean" />

<MemberMeta sourceHref="/source/event-js/#L95" sourceLabel="event.js:95" />

When true, will verify exceptions are related by their UUID.

<MemberHeading id="uid" depth="3" name="uid" sig="uid: String" />

<MemberMeta sourceHref="/source/event-js/#L345" sourceLabel="event.js:345" />

The uid of this event

<MemberHeading id="startdate" depth="3" name="startDate" sig="startDate: ICAL.Time" />

<MemberMeta sourceHref="/source/event-js/#L357" sourceLabel="event.js:357" />

The start date

<MemberHeading id="enddate" depth="3" name="endDate" sig="endDate: ICAL.Time" />

<MemberMeta sourceHref="/source/event-js/#L371" sourceLabel="event.js:371" />

The end date. This can be the result directly from the property, or the end date calculated from start date and duration. Setting the property will remove any duration properties.

<MemberHeading id="duration" depth="3" name="duration" sig="duration: ICAL.Duration" />

<MemberMeta sourceHref="/source/event-js/#L398" sourceLabel="event.js:398" />

The duration. This can be the result directly from the property, or the duration calculated from start date and end date. Setting the property will remove any `dtend` properties.

<MemberHeading id="location" depth="3" name="location" sig="location: String" />

<MemberMeta sourceHref="/source/event-js/#L418" sourceLabel="event.js:418" />

The location of the event.

<MemberHeading id="attendees" depth="3" name="attendees" sig="attendees: Array.<Property>" />

<MemberMeta sourceHref="/source/event-js/#L430" sourceLabel="event.js:430" />

The attendees in the event

<MemberHeading id="summary" depth="3" name="summary" sig="summary: String" />

<MemberMeta sourceHref="/source/event-js/#L440" sourceLabel="event.js:440" />

The event summary

<MemberHeading id="description" depth="3" name="description" sig="description: String" />

<MemberMeta sourceHref="/source/event-js/#L452" sourceLabel="event.js:452" />

The event description.

<MemberHeading id="color" depth="3" name="color" sig="color: String" />

<MemberMeta sourceHref="/source/event-js/#L464" sourceLabel="event.js:464" />

The event color from [rfc7986](https://datatracker.ietf.org/doc/html/rfc7986)

<MemberHeading id="organizer" depth="3" name="organizer" sig="organizer: String" />

<MemberMeta sourceHref="/source/event-js/#L477" sourceLabel="event.js:477" />

The organizer value as an uri. In most cases this is a mailto: uri, but it can also be something else, like urn:uuid:...

<MemberHeading id="sequence" depth="3" name="sequence" sig="sequence: Number" />

<MemberMeta sourceHref="/source/event-js/#L490" sourceLabel="event.js:490" />

The sequence value for this event. Used for scheduling see {@tutorial terminology}.

<MemberHeading id="recurrenceid" depth="3" name="recurrenceId" sig="recurrenceId: ICAL.Time" />

<MemberMeta sourceHref="/source/event-js/#L502" sourceLabel="event.js:502" />

The recurrence id for this event. See {@tutorial terminology} for details.

## Other

<MemberHeading id="occurrencedetails" depth="3" name="occurrenceDetails" sig="occurrenceDetails: Object" />

<MemberMeta badges="static" sourceHref="/source/types-js/#L58" sourceLabel="types.js:58" />

This object is returned by [getOccurrenceDetails](/ical/event#getoccurrencedetails)

**Properties**

- `recurrenceId` ([ICAL.Time](/ical#time)) — The passed in recurrence id
- `item` ([ICAL.Event](/ical#event)) — The occurrence
- `startDate` ([ICAL.Time](/ical#time)) — The start of the occurrence
- `endDate` ([ICAL.Time](/ical#time)) — The end of the occurrence
