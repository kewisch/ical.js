---
title: Duration
kind: class
longname: ICAL.Duration
description: This class represents the &quot;duration&quot; value type, with various calculation and manipulation methods.
---

# Duration

<SourceLink href="/source/duration-js/#L17" label="duration.js:17" />

This class represents the "duration" value type, with various calculation and manipulation methods.

---

## Constructor

<Signature code="new Duration(data: Object): Duration" />

Creates a new ICAL.Duration instance.

**Parameters**

- `data` (Object) — An object with members of the duration
  - `data.weeks` (Number, optional) — Duration in weeks
  - `data.days` (Number, optional) — Duration in days
  - `data.hours` (Number, optional) — Duration in hours
  - `data.minutes` (Number, optional) — Duration in minutes
  - `data.seconds` (Number, optional) — Duration in seconds
  - `data.isNegative` (Boolean, optional) — If true, the duration is negative

---

## Instance Methods

<MemberHeading id="clone" depth="3" name="clone" sig="clone(): ICAL.Duration" />

<MemberMeta sourceHref="/source/duration-js/#L163" sourceLabel="duration.js:163" />

Returns a clone of the duration object.

**Returns**

- [`ICAL.Duration`](/ical#duration) — The cloned object

<MemberHeading id="toseconds" depth="3" name="toSeconds" sig="toSeconds(): Number" />

<MemberMeta sourceHref="/source/duration-js/#L172" sourceLabel="duration.js:172" />

The duration value expressed as a number of seconds.

**Returns**

- `Number` — The duration value in seconds

<MemberHeading id="fromseconds" depth="3" name="fromSeconds" sig="fromSeconds(aSeconds: Number): ICAL.Duration" />

<MemberMeta sourceHref="/source/duration-js/#L186" sourceLabel="duration.js:186" />

Reads the passed seconds value into this duration object. Afterwards, members like [days](/ical/duration#days) and [weeks](/ical/duration#weeks) will be set up accordingly.

**Parameters**

- `aSeconds` (Number) — The duration value in seconds

**Returns**

- [`ICAL.Duration`](/ical#duration) — Returns this instance

<MemberHeading id="fromdata" depth="3" name="fromData" sig="fromData(aData: Object)" />

<MemberMeta sourceHref="/source/duration-js/#L223" sourceLabel="duration.js:223" />

Sets up the current instance using members from the passed data object.

**Parameters**

- `aData` (Object) — An object with members of the duration
  - `aData.weeks` (Number, optional) — Duration in weeks
  - `aData.days` (Number, optional) — Duration in days
  - `aData.hours` (Number, optional) — Duration in hours
  - `aData.minutes` (Number, optional) — Duration in minutes
  - `aData.seconds` (Number, optional) — Duration in seconds
  - `aData.isNegative` (Boolean, optional) — If true, the duration is negative

<MemberHeading id="reset" depth="3" name="reset" sig="reset()" />

<MemberMeta sourceHref="/source/duration-js/#L236" sourceLabel="duration.js:236" />

Resets the duration instance to the default values, i.e. PT0S

<MemberHeading id="compare" depth="3" name="compare" sig="compare(aOther: ICAL.Duration): Number" />

<MemberMeta sourceHref="/source/duration-js/#L251" sourceLabel="duration.js:251" />

Compares the duration instance with another one.

**Parameters**

- `aOther` ([ICAL.Duration](/ical#duration)) — The instance to compare with

**Returns**

- `Number` — -1, 0 or 1 for less/equal/greater

<MemberHeading id="normalize" depth="3" name="normalize" sig="normalize()" />

<MemberMeta sourceHref="/source/duration-js/#L261" sourceLabel="duration.js:261" />

Normalizes the duration instance. For example, a duration with a value of 61 seconds will be normalized to 1 minute and 1 second.

<MemberHeading id="tostring" depth="3" name="toString" sig="toString(): String" />

<MemberMeta sourceHref="/source/duration-js/#L269" sourceLabel="duration.js:269" />

The string representation of this duration.

**Returns**

- `String`

<MemberHeading id="toicalstring" depth="3" name="toICALString" sig="toICALString(): String" />

<MemberMeta sourceHref="/source/duration-js/#L313" sourceLabel="duration.js:313" />

The iCalendar string representation of this duration.

**Returns**

- `String`

## Static Methods

<MemberHeading id="fromseconds" depth="3" name="fromSeconds" sig="fromSeconds(aSeconds: Number): ICAL.Duration" />

<MemberMeta badges="static" sourceHref="/source/duration-js/#L24" sourceLabel="duration.js:24" />

Returns a new ICAL.Duration instance from the passed seconds value.

**Parameters**

- `aSeconds` (Number) — The seconds to create the instance from

**Returns**

- [`ICAL.Duration`](/ical#duration) — The newly created duration instance

<MemberHeading id="isvaluestring" depth="3" name="isValueString" sig="isValueString(value: String): Boolean" />

<MemberMeta badges="static" sourceHref="/source/duration-js/#L35" sourceLabel="duration.js:35" />

Checks if the given string is an iCalendar duration value.

**Parameters**

- `value` (String) — The raw ical value

**Returns**

- `Boolean` — True, if the given value is of the duration ical type

<MemberHeading id="fromstring" depth="3" name="fromString" sig="fromString(aStr: String): ICAL.Duration" />

<MemberMeta badges="static" sourceHref="/source/duration-js/#L45" sourceLabel="duration.js:45" />

Creates a new [ICAL.Duration](/ical#duration) instance from the passed string.

**Parameters**

- `aStr` (String) — The string to parse

**Returns**

- [`ICAL.Duration`](/ical#duration) — The created duration instance

<MemberHeading id="fromdata" depth="3" name="fromData" sig="fromData(aData: Object): ICAL.Duration" />

<MemberMeta badges="static" sourceHref="/source/duration-js/#L80" sourceLabel="duration.js:80" />

Creates a new ICAL.Duration instance from the given data object.

**Parameters**

- `aData` (Object) — An object with members of the duration
  - `aData.weeks` (Number, optional) — Duration in weeks
  - `aData.days` (Number, optional) — Duration in days
  - `aData.hours` (Number, optional) — Duration in hours
  - `aData.minutes` (Number, optional) — Duration in minutes
  - `aData.seconds` (Number, optional) — Duration in seconds
  - `aData.isNegative` (Boolean, optional) — If true, the duration is negative

**Returns**

- [`ICAL.Duration`](/ical#duration) — The createad duration instance

## Instance Fields

<MemberHeading id="weeks" depth="3" name="weeks" sig="weeks: Number" />

<MemberMeta sourceHref="/source/duration-js/#L105" sourceLabel="duration.js:105" />

The weeks in this duration

**Default:** `0`

<MemberHeading id="days" depth="3" name="days" sig="days: Number" />

<MemberMeta sourceHref="/source/duration-js/#L112" sourceLabel="duration.js:112" />

The days in this duration

**Default:** `0`

<MemberHeading id="hours" depth="3" name="hours" sig="hours: Number" />

<MemberMeta sourceHref="/source/duration-js/#L119" sourceLabel="duration.js:119" />

The days in this duration

**Default:** `0`

<MemberHeading id="minutes" depth="3" name="minutes" sig="minutes: Number" />

<MemberMeta sourceHref="/source/duration-js/#L126" sourceLabel="duration.js:126" />

The minutes in this duration

**Default:** `0`

<MemberHeading id="seconds" depth="3" name="seconds" sig="seconds: Number" />

<MemberMeta sourceHref="/source/duration-js/#L133" sourceLabel="duration.js:133" />

The seconds in this duration

**Default:** `0`

<MemberHeading id="isnegative" depth="3" name="isNegative" sig="isNegative: Boolean" />

<MemberMeta sourceHref="/source/duration-js/#L140" sourceLabel="duration.js:140" />

The seconds in this duration

**Default:** `false`

## Other

<MemberHeading id="icalclass" depth="3" name="icalclass" sig="icalclass: String" />

<MemberMeta sourceHref="/source/duration-js/#L148" sourceLabel="duration.js:148" />

The class identifier.

**Default:** `"icalduration"`

<MemberHeading id="icaltype" depth="3" name="icaltype" sig="icaltype: String" />

<MemberMeta sourceHref="/source/duration-js/#L156" sourceLabel="duration.js:156" />

The type name, to be used in the jCal object.

**Default:** `"duration"`
