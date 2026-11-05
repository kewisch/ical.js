---
title: RecurIterator
kind: class
longname: ICAL.RecurIterator
description: An iterator for a single recurrence rule. This class usually doesn't have to be instanciated directly, the convenience method {@link ICAL.Recur#iterator} can be used.
---

# RecurIterator

<SourceLink href="/source/recur-iterator-js/#L26" label="recur_iterator.js:26" />

An iterator for a single recurrence rule. This class usually doesn't have to be instanciated directly, the convenience method [ICAL.Recur#iterator](/ical/recur#iterator) can be used.

---

## Constructor

<Signature code="new RecurIterator(options: Object): RecurIterator" />

Creates a new ICAL.RecurIterator instance. The options object may contain additional members when resuming iteration from a previous run.

**Parameters**

- `options` (Object) — The iterator options
  - `options.rule` ([ICAL.Recur](/ical#recur)) — The rule to iterate.
  - `options.dtstart` ([ICAL.Time](/ical#time)) — The start date of the event.
  - `options.initialized` (Boolean, optional) — When true, assume that options are from a previously constructed iterator. Initialization will not be repeated.

---

## Instance Methods

<MemberHeading id="fromdata" depth="3" name="fromData" sig="fromData(options: Object)" />

<MemberMeta sourceHref="/source/recur-iterator-js/#L147" sourceLabel="recur_iterator.js:147" />

Initialize the recurrence iterator from the passed data object. This method is usually not called directly, you can initialize the iterator through the constructor.

**Parameters**

- `options` (Object) — The iterator options
  - `options.rule` ([ICAL.Recur](/ical#recur)) — The rule to iterate.
  - `options.dtstart` ([ICAL.Time](/ical#time)) — The start date of the event.
  - `options.initialized` (Boolean, optional) — When true, assume that options are from a previously constructed iterator. Initialization will not be repeated.

<MemberHeading id="next" depth="3" name="next" sig="next(): ICAL.Time" />

<MemberMeta sourceHref="/source/recur-iterator-js/#L386" sourceLabel="recur_iterator.js:386" />

Retrieve the next occurrence from the iterator.

**Returns**

- [`ICAL.Time`](/ical#time)

<MemberHeading id="ruledayofweek" depth="3" name="ruleDayOfWeek" sig="ruleDayOfWeek(dow, aWeekStart?: ICAL.Time.weekDay)" />

<MemberMeta sourceHref="/source/recur-iterator-js/#L951" sourceLabel="recur_iterator.js:951" />

**Parameters**

- `dow` — (eg: '1TU', '-1MO')
- `aWeekStart` ([ICAL.Time.weekDay](/ical/time#weekday), optional) — The week start weekday

**Returns**

- \[pos, numericDow] (eg: \[1, 3]) numericDow is relative to aWeekStart

<MemberHeading id="tojson" depth="3" name="toJSON" sig="toJSON(): Object" />

<MemberMeta sourceHref="/source/recur-iterator-js/#L1476" sourceLabel="recur_iterator.js:1476" />

Convert iterator into a serialize-able object. Will preserve current iteration sequence to ensure the seamless continuation of the recurrence rule.

**Returns**

- `Object`

## Instance Fields

<MemberHeading id="completed" depth="3" name="completed" sig="completed: Boolean" />

<MemberMeta sourceHref="/source/recur-iterator-js/#L73" sourceLabel="recur_iterator.js:73" />

True when iteration is finished.

<MemberHeading id="rule" depth="3" name="rule" sig="rule: ICAL.Recur" />

<MemberMeta sourceHref="/source/recur-iterator-js/#L79" sourceLabel="recur_iterator.js:79" />

The rule that is being iterated

<MemberHeading id="dtstart" depth="3" name="dtstart" sig="dtstart: ICAL.Time" />

<MemberMeta sourceHref="/source/recur-iterator-js/#L85" sourceLabel="recur_iterator.js:85" />

The start date of the event being iterated.

<MemberHeading id="last" depth="3" name="last" sig="last: ICAL.Time" />

<MemberMeta sourceHref="/source/recur-iterator-js/#L92" sourceLabel="recur_iterator.js:92" />

The last occurrence that was returned from the `RecurIterator#next` method.

<MemberHeading id="occurrencenumber" depth="3" name="occurrence_number" sig="occurrence_number: Number" />

<MemberMeta sourceHref="/source/recur-iterator-js/#L98" sourceLabel="recur_iterator.js:98" />

The sequence number from the occurrence
