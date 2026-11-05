---
title: UtcOffset
kind: class
longname: ICAL.UtcOffset
description: This class represents the &quot;utc-offset&quot; value type, with various calculation and manipulation methods.
---

# UtcOffset

<SourceLink href="/source/utc-offset-js/#L18" label="utc_offset.js:18" />

This class represents the "utc-offset" value type, with various calculation and manipulation methods.

---

## Constructor

<Signature code="new UtcOffset(aData: Object): UtcOffset" />

Creates a new ICAL.UtcOffset instance.

**Parameters**

- `aData` (Object) — An object with members of the utc offset
  - `aData.hours` (Number, optional) — The hours for the utc offset
  - `aData.minutes` (Number, optional) — The minutes in the utc offset
  - `aData.factor` (Number, optional) — The factor for the utc-offset, either -1 or 1

---

## Instance Methods

<MemberHeading id="clone" depth="3" name="clone" sig="clone(): ICAL.UtcOffset" />

<MemberMeta sourceHref="/source/utc-offset-js/#L92" sourceLabel="utc_offset.js:92" />

Returns a clone of the utc offset object.

**Returns**

- [`ICAL.UtcOffset`](/ical#utcoffset) — The cloned object

<MemberHeading id="fromdata" depth="3" name="fromData" sig="fromData(aData: Object)" />

<MemberMeta sourceHref="/source/utc-offset-js/#L104" sourceLabel="utc_offset.js:104" />

Sets up the current instance using members from the passed data object.

**Parameters**

- `aData` (Object) — An object with members of the utc offset
  - `aData.hours` (Number, optional) — The hours for the utc offset
  - `aData.minutes` (Number, optional) — The minutes in the utc offset
  - `aData.factor` (Number, optional) — The factor for the utc-offset, either -1 or 1

<MemberHeading id="fromseconds" depth="3" name="fromSeconds" sig="fromSeconds(aSeconds: Number)" />

<MemberMeta sourceHref="/source/utc-offset-js/#L120" sourceLabel="utc_offset.js:120" />

Sets up the current instance from the given seconds value. The seconds value is truncated to the minute. Offsets are wrapped when the world ends, the hour after UTC+14:00 is UTC-12:00.

**Parameters**

- `aSeconds` (Number) — The seconds to convert into an offset

<MemberHeading id="toseconds" depth="3" name="toSeconds" sig="toSeconds(): Number" />

<MemberMeta sourceHref="/source/utc-offset-js/#L136" sourceLabel="utc_offset.js:136" />

Convert the current offset to a value in seconds

**Returns**

- `Number` — The offset in seconds

<MemberHeading id="compare" depth="3" name="compare" sig="compare(other: ICAL.UtcOffset): Number" />

<MemberMeta sourceHref="/source/utc-offset-js/#L146" sourceLabel="utc_offset.js:146" />

Compare this utc offset with another one.

**Parameters**

- `other` ([ICAL.UtcOffset](/ical#utcoffset)) — The other offset to compare with

**Returns**

- `Number` — -1, 0 or 1 for less/equal/greater

<MemberHeading id="toicalstring" depth="3" name="toICALString" sig="toICALString(): String" />

<MemberMeta sourceHref="/source/utc-offset-js/#L175" sourceLabel="utc_offset.js:175" />

The iCalendar string representation of this utc-offset.

**Returns**

- `String`

<MemberHeading id="tostring" depth="3" name="toString" sig="toString(): String" />

<MemberMeta sourceHref="/source/utc-offset-js/#L183" sourceLabel="utc_offset.js:183" />

The string representation of this utc-offset.

**Returns**

- `String`

## Static Methods

<MemberHeading id="fromstring" depth="3" name="fromString" sig="fromString(aString: String): ICAL.Duration" />

<MemberMeta badges="static" sourceHref="/source/utc-offset-js/#L25" sourceLabel="utc_offset.js:25" />

Creates a new [ICAL.UtcOffset](/ical#utcoffset) instance from the passed string.

**Parameters**

- `aString` (String) — The string to parse

**Returns**

- [`ICAL.Duration`](/ical#duration) — The created utc-offset instance

<MemberHeading id="fromseconds" depth="3" name="fromSeconds" sig="fromSeconds(aSeconds: Number)" />

<MemberMeta badges="static" sourceHref="/source/utc-offset-js/#L42" sourceLabel="utc_offset.js:42" />

Creates a new [ICAL.UtcOffset](/ical#utcoffset) instance from the passed seconds value.

**Parameters**

- `aSeconds` (Number) — The number of seconds to convert

## Instance Fields

<MemberHeading id="hours" depth="3" name="hours" sig="hours: Number" />

<MemberMeta sourceHref="/source/utc-offset-js/#L64" sourceLabel="utc_offset.js:64" />

The hours in the utc-offset

<MemberHeading id="minutes" depth="3" name="minutes" sig="minutes: Number" />

<MemberMeta sourceHref="/source/utc-offset-js/#L70" sourceLabel="utc_offset.js:70" />

The minutes in the utc-offset

<MemberHeading id="factor" depth="3" name="factor" sig="factor: Number" />

<MemberMeta sourceHref="/source/utc-offset-js/#L77" sourceLabel="utc_offset.js:77" />

The sign of the utc offset, 1 for positive offset, -1 for negative offsets.

## Other

<MemberHeading id="icaltype" depth="3" name="icaltype" sig="icaltype: String" />

<MemberMeta sourceHref="/source/utc-offset-js/#L85" sourceLabel="utc_offset.js:85" />

The type name, to be used in the jCal object.

**Default:** `"utc-offset"`
