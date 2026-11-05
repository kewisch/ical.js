---
title: Period
kind: class
longname: ICAL.Period
description: This class represents the &quot;period&quot; value type, with various calculation and manipulation methods.
---

# Period

<SourceLink href="/source/period-js/#L26" label="period.js:26" />

This class represents the "period" value type, with various calculation and manipulation methods.

---

## Constructor

<Signature code="new Period(aData: Object): Period" />

Creates a new ICAL.Period instance. The passed data object cannot contain both and end date and a duration.

**Parameters**

- `aData` (Object) — An object with members of the period
  - `aData.start` ([ICAL.Time](/ical#time), optional) — The start of the period
  - `aData.end` ([ICAL.Time](/ical#time), optional) — The end of the period
  - `aData.duration` ([ICAL.Duration](/ical#duration), optional) — The duration of the period

---

## Instance Methods

<MemberHeading id="clone" depth="3" name="clone" sig="clone(): ICAL.Period" />

<MemberMeta sourceHref="/source/period-js/#L182" sourceLabel="period.js:182" />

Returns a clone of the duration object.

**Returns**

- [`ICAL.Period`](/ical#period) — The cloned object

<MemberHeading id="getduration" depth="3" name="getDuration" sig="getDuration(): ICAL.Duration" />

<MemberMeta sourceHref="/source/period-js/#L196" sourceLabel="period.js:196" />

Calculates the duration of the period, either directly or by subtracting start from end date.

**Returns**

- [`ICAL.Duration`](/ical#duration) — The calculated duration

<MemberHeading id="getend" depth="3" name="getEnd" sig="getEnd(): ICAL.Time" />

<MemberMeta sourceHref="/source/period-js/#L210" sourceLabel="period.js:210" />

Calculates the end date of the period, either directly or by adding duration to start date.

**Returns**

- [`ICAL.Time`](/ical#time) — The calculated end date

<MemberHeading id="compare" depth="3" name="compare" sig="compare(dt: ICAL.Time | ICAL.Period)" />

<MemberMeta sourceHref="/source/period-js/#L228" sourceLabel="period.js:228" />

Compare this period with a date or other period. To maintain the logic where a.compare(b) returns 1 when a > b, this function will return 1 when the period is after the date, 0 when the date is within the period, and -1 when the period is before the date. When comparing two periods, as soon as they overlap in any way this will return 0.

**Parameters**

- `dt` ([ICAL.Time](/ical#time) | [ICAL.Period](/ical#period)) — The date or other period to compare with

<MemberHeading id="tostring" depth="3" name="toString" sig="toString(): String" />

<MemberMeta sourceHref="/source/period-js/#L242" sourceLabel="period.js:242" />

The string representation of this period.

**Returns**

- `String`

<MemberHeading id="tojson" depth="3" name="toJSON" sig="toJSON(): Object" />

<MemberMeta sourceHref="/source/period-js/#L250" sourceLabel="period.js:250" />

The jCal representation of this period type.

**Returns**

- `Object`

<MemberHeading id="toicalstring" depth="3" name="toICALString" sig="toICALString(): String" />

<MemberMeta sourceHref="/source/period-js/#L258" sourceLabel="period.js:258" />

The iCalendar string representation of this period.

**Returns**

- `String`

## Static Methods

<MemberHeading id="fromstring" depth="3" name="fromString" sig="fromString(str: String, prop: ICAL.Property): ICAL.Period" />

<MemberMeta badges="static" sourceHref="/source/period-js/#L34" sourceLabel="period.js:34" />

Creates a new [ICAL.Period](/ical#period) instance from the passed string.

**Parameters**

- `str` (String) — The string to parse
- `prop` ([ICAL.Property](/ical#property)) — The property this period will be on

**Returns**

- [`ICAL.Period`](/ical#period) — The created period instance

<MemberHeading id="fromdata" depth="3" name="fromData" sig="fromData(aData: Object): ICAL.Period" />

<MemberMeta badges="static" sourceHref="/source/period-js/#L68" sourceLabel="period.js:68" />

Creates a new [ICAL.Period](/ical#period) instance from the given data object. The passed data object cannot contain both and end date and a duration.

**Parameters**

- `aData` (Object) — An object with members of the period
  - `aData.start` ([ICAL.Time](/ical#time), optional) — The start of the period
  - `aData.end` ([ICAL.Time](/ical#time), optional) — The end of the period
  - `aData.duration` ([ICAL.Duration](/ical#duration), optional) — The duration of the period

**Returns**

- [`ICAL.Period`](/ical#period) — The period instance

<MemberHeading
  id="fromjson"
  depth="3"
  name="fromJSON"
  sig="fromJSON(
	aData: jCalComponent,
	aProp: ICAL.Property,
	aLenient: Boolean,
): ICAL.Period"
/>

<MemberMeta badges="static" sourceHref="/source/period-js/#L82" sourceLabel="period.js:82" />

Returns a new period instance from the given jCal data array. The first member is always the start date string, the second member is either a duration or end date string.

**Parameters**

- `aData` ([jCalComponent](/jcalcomponent)) — The jCal data array
- `aProp` ([ICAL.Property](/ical#property)) — The property this jCal data is on
- `aLenient` (Boolean) — If true, data value can be both date and date-time

**Returns**

- [`ICAL.Period`](/ical#period) — The period instance

## Instance Fields

<MemberHeading id="start" depth="3" name="start" sig="start: ICAL.Time" />

<MemberMeta sourceHref="/source/period-js/#L147" sourceLabel="period.js:147" />

The start of the period

<MemberHeading id="end" depth="3" name="end" sig="end: ICAL.Time" />

<MemberMeta sourceHref="/source/period-js/#L153" sourceLabel="period.js:153" />

The end of the period

<MemberHeading id="duration" depth="3" name="duration" sig="duration: ICAL.Duration" />

<MemberMeta sourceHref="/source/period-js/#L159" sourceLabel="period.js:159" />

The duration of the period

## Other

<MemberHeading id="icalclass" depth="3" name="icalclass" sig="icalclass: String" />

<MemberMeta sourceHref="/source/period-js/#L167" sourceLabel="period.js:167" />

The class identifier.

**Default:** `"icalperiod"`

<MemberHeading id="icaltype" depth="3" name="icaltype" sig="icaltype: String" />

<MemberMeta sourceHref="/source/period-js/#L175" sourceLabel="period.js:175" />

The type name, to be used in the jCal object.

**Default:** `"period"`
