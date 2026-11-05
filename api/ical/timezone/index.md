---
title: Timezone
kind: class
longname: ICAL.Timezone
description: Timezone representation.
---

# Timezone

<SourceLink href="/source/timezone-js/#L28" label="timezone.js:28" />

Timezone representation.

**Example**

```js
var vcalendar;
var timezoneComp = vcalendar.getFirstSubcomponent('vtimezone');
var tzid = timezoneComp.getFirstPropertyValue('tzid');

var timezone = new ICAL.Timezone({
  component: timezoneComp,
  tzid
});
```

---

## Constructor

<Signature code="new Timezone(data: ICAL.Component | Object): Timezone" />

Creates a new ICAL.Timezone instance, by passing in a tzid and component.

**Parameters**

- `data` ([ICAL.Component](/ical#component) | Object) — options for class
  - `data.component` (String | [ICAL.Component](/ical#component)) — If data is a simple object, then this member can be set to either a string containing the component data, or an already parsed ICAL.Component
  - `data.tzid` (String) — The timezone identifier
  - `data.location` (String) — The timezone locationw
  - `data.tznames` (String) — An alternative string representation of the timezone
  - `data.latitude` (Number) — The latitude of the timezone
  - `data.longitude` (Number) — The longitude of the timezone

---

## Instance Methods

<MemberHeading id="fromdata" depth="3" name="fromData" sig="fromData(aData: ICAL.Component | Object)" />

<MemberMeta sourceHref="/source/timezone-js/#L244" sourceLabel="timezone.js:244" />

Sets up the current instance using members from the passed data object.

**Parameters**

- `aData` ([ICAL.Component](/ical#component) | Object) — options for class
  - `aData.component` (String | [ICAL.Component](/ical#component)) — If aData is a simple object, then this member can be set to either a string containing the component data, or an already parsed ICAL.Component
  - `aData.tzid` (String) — The timezone identifier
  - `aData.location` (String) — The timezone locationw
  - `aData.tznames` (String) — An alternative string representation of the timezone
  - `aData.latitude` (Number) — The latitude of the timezone
  - `aData.longitude` (Number) — The longitude of the timezone

<MemberHeading id="utcoffset" depth="3" name="utcOffset" sig="utcOffset(tt: ICAL.Time): Number" />

<MemberMeta sourceHref="/source/timezone-js/#L290" sourceLabel="timezone.js:290" />

Finds the utcOffset the given time would occur in this timezone.

**Parameters**

- `tt` ([ICAL.Time](/ical#time)) — The time to check for

**Returns**

- `Number` — utc offset in seconds

<MemberHeading id="tostring" depth="3" name="toString" sig="toString(): String" />

<MemberMeta sourceHref="/source/timezone-js/#L604" sourceLabel="timezone.js:604" />

The string representation of this timezone.

**Returns**

- `String`

## Static Methods

<MemberHeading
  id="converttime"
  depth="3"
  name="convert_time"
  sig="convert_time(
	tt: ICAL.Time,
	from_zone: ICAL.Timezone,
	to_zone: ICAL.Timezone,
): ICAL.Time"
/>

<MemberMeta badges="static" sourceHref="/source/timezone-js/#L59" sourceLabel="timezone.js:59" />

Convert the date/time from one zone to the next.

**Parameters**

- `tt` ([ICAL.Time](/ical#time)) — The time to convert
- `from_zone` ([ICAL.Timezone](/ical#timezone)) — The source zone to convert from
- `to_zone` ([ICAL.Timezone](/ical#timezone)) — The target zone to convert to

**Returns**

- [`ICAL.Time`](/ical#time) — The converted date/time object

<MemberHeading id="fromdata" depth="3" name="fromData" sig="fromData(aData: ICAL.Component | Object)" />

<MemberMeta badges="static" sourceHref="/source/timezone-js/#L94" sourceLabel="timezone.js:94" />

Creates a new ICAL.Timezone instance from the passed data object.

**Parameters**

- `aData` ([ICAL.Component](/ical#component) | Object) — options for class
  - `aData.component` (String | [ICAL.Component](/ical#component)) — If aData is a simple object, then this member can be set to either a string containing the component data, or an already parsed ICAL.Component
  - `aData.tzid` (String) — The timezone identifier
  - `aData.location` (String) — The timezone locationw
  - `aData.tznames` (String) — An alternative string representation of the timezone
  - `aData.latitude` (Number) — The latitude of the timezone
  - `aData.longitude` (Number) — The longitude of the timezone

## Instance Fields

<MemberHeading id="tzid" depth="3" name="tzid" sig="tzid: String" />

<MemberMeta sourceHref="/source/timezone-js/#L180" sourceLabel="timezone.js:180" />

Timezone identifier

<MemberHeading id="location" depth="3" name="location" sig="location: String" />

<MemberMeta sourceHref="/source/timezone-js/#L186" sourceLabel="timezone.js:186" />

Timezone location

<MemberHeading id="tznames" depth="3" name="tznames" sig="tznames: String" />

<MemberMeta sourceHref="/source/timezone-js/#L192" sourceLabel="timezone.js:192" />

Alternative timezone name, for the string representation

<MemberHeading id="latitude" depth="3" name="latitude" sig="latitude: Number" />

<MemberMeta sourceHref="/source/timezone-js/#L198" sourceLabel="timezone.js:198" />

The primary latitude for the timezone.

<MemberHeading id="longitude" depth="3" name="longitude" sig="longitude: Number" />

<MemberMeta sourceHref="/source/timezone-js/#L204" sourceLabel="timezone.js:204" />

The primary longitude for the timezone.

<MemberHeading id="component" depth="3" name="component" sig="component: ICAL.Component" />

<MemberMeta sourceHref="/source/timezone-js/#L210" sourceLabel="timezone.js:210" />

The vtimezone component for this timezone.

## Other

<MemberHeading id="icalclass" depth="3" name="icalclass" sig="icalclass: String" />

<MemberMeta sourceHref="/source/timezone-js/#L227" sourceLabel="timezone.js:227" />

The class identifier.

**Default:** `"icaltimezone"`
