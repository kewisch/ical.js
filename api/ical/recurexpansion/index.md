---
title: RecurExpansion
kind: class
longname: ICAL.RecurExpansion
description: "Primary class for expanding recurring rules. Can take multiple rrules, rdates, exdate(s) and iterate (in order) over each next occurrence. Once initialized this class can also be serialized saved and continue iteration from the last point. NOTE: it is intended that this class is to be used with {@link ICAL.Event} which handles recurrence exceptions."
---

# RecurExpansion

<SourceLink href="/source/recur-expansion-js/#L53" label="recur_expansion.js:53" />

Primary class for expanding recurring rules. Can take multiple rrules, rdates, exdate(s) and iterate (in order) over each next occurrence.

Once initialized this class can also be serialized saved and continue iteration from the last point.

NOTE: it is intended that this class is to be used with [ICAL.Event](/ical#event) which handles recurrence exceptions.

**Example**

```js
// assuming event is a parsed ical component
var event;

var expand = new ICAL.RecurExpansion({
  component: event,
  dtstart: event.getFirstPropertyValue('dtstart')
});

// remember there are infinite rules so it is a good idea to limit the scope of the iterations
// then resume later on.

// next is always an ICAL.Time or null
var next;

while (someCondition && (next = expand.next())) {
  // do something with next
}

// save instance for later
var json = JSON.stringify(expand);

//...

// NOTE: if the component's properties have changed you will need to rebuild the class and start
// over. This only works when the component's recurrence info is the same.
var expand = new ICAL.RecurExpansion(JSON.parse(json));
```

---

## Constructor

<Signature code="new RecurExpansion(options: Object): RecurExpansion" />

Creates a new ICAL.RecurExpansion instance.

The options object can be filled with the specified initial values. It can also contain additional members, as a result of serializing a previous expansion state, as shown in the example.

**Parameters**

- `options` (Object) — Recurrence expansion options
  - `options.dtstart` ([ICAL.Time](/ical#time)) — Start time of the event
  - `options.component` ([ICAL.Component](/ical#component), optional) — Component for expansion, required if not resuming.

---

## Instance Methods

<MemberHeading id="fromdata" depth="3" name="fromData" sig="fromData(options: Object)" />

<MemberMeta sourceHref="/source/recur-expansion-js/#L160" sourceLabel="recur_expansion.js:160" />

Initialize the recurrence expansion from the data object. The options object may also contain additional members, see the [constructor](/ical#recurexpansion) for more details.

**Parameters**

- `options` (Object) — Recurrence expansion options
  - `options.dtstart` ([ICAL.Time](/ical#time)) — Start time of the event
  - `options.component` ([ICAL.Component](/ical#component), optional) — Component for expansion, required if not resuming.

<MemberHeading id="next" depth="3" name="next" sig="next(): ICAL.Time | null" />

<MemberMeta sourceHref="/source/recur-expansion-js/#L219" sourceLabel="recur_expansion.js:219" />

Retrieve the next occurrence in the series.

**Returns**

- [`ICAL.Time`](/ical#time)` | null` — The next occurrence, or null once the series is exhausted.

<MemberHeading id="tojson" depth="3" name="toJSON" sig="toJSON(): Object" />

<MemberMeta sourceHref="/source/recur-expansion-js/#L296" sourceLabel="recur_expansion.js:296" />

Converts object into a serialize-able format. This format can be passed back into the expansion to resume iteration.

**Returns**

- `Object`

## Instance Fields

<MemberHeading id="complete" depth="3" name="complete" sig="complete: Boolean" />

<MemberMeta sourceHref="/source/recur-expansion-js/#L78" sourceLabel="recur_expansion.js:78" />

True when iteration is fully completed.

<MemberHeading id="dtstart" depth="3" name="dtstart" sig="dtstart: ICAL.Time" />

<MemberMeta sourceHref="/source/recur-expansion-js/#L139" sourceLabel="recur_expansion.js:139" />

Start date of recurring rules.

<MemberHeading id="last" depth="3" name="last" sig="last: ICAL.Time" />

<MemberMeta sourceHref="/source/recur-expansion-js/#L146" sourceLabel="recur_expansion.js:146" />

Last expanded time
