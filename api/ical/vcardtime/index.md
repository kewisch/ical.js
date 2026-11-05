---
title: VCardTime
kind: class
longname: ICAL.VCardTime
description: Describes a vCard time, which has slight differences to the ICAL.Time. Properties can be null if not specified, for example for dates with reduced accuracy or truncation. Note that currently not all methods are correctly re-implemented for VCardTime. For example, comparison will have undefined results when some members are null. Also, normalization is not yet implemented for this class!
---

# VCardTime

**Extends:&#x20;**[`ICAL.Time`](/ical#time)

<SourceLink href="/source/vcard-time-js/#L26" label="vcard_time.js:26" />

Describes a vCard time, which has slight differences to the ICAL.Time. Properties can be null if not specified, for example for dates with reduced accuracy or truncation.

Note that currently not all methods are correctly re-implemented for VCardTime. For example, comparison will have undefined results when some members are null.

Also, normalization is not yet implemented for this class!

---

## Constructor

<Signature
  code="new VCardTime(
	data: Object,
	zone: ICAL.Timezone | ICAL.UtcOffset,
	icaltype: String,
): VCardTime"
/>

Creates a new ICAL.VCardTime instance.

**Parameters**

- `data` (Object) — The data for the time instance
  - `data.year` (Number, optional) — The year for this date
  - `data.month` (Number, optional) — The month for this date
  - `data.day` (Number, optional) — The day for this date
  - `data.hour` (Number, optional) — The hour for this date
  - `data.minute` (Number, optional) — The minute for this date
  - `data.second` (Number, optional) — The second for this date
- `zone` ([ICAL.Timezone](/ical#timezone) | [ICAL.UtcOffset](/ical#utcoffset)) — The timezone to use
- `icaltype` (String) — The type for this date/time object

---

## Instance Methods

<MemberHeading id="clone" depth="3" name="clone" sig="clone(): ICAL.VCardTime" />

<MemberMeta sourceHref="/source/vcard-time-js/#L111" sourceLabel="vcard_time.js:111" />

**Overrides:&#x20;**`ICAL.Time#clone`

Returns a clone of the vcard date/time object.

**Returns**

- [`ICAL.VCardTime`](/ical#vcardtime) — The cloned object

<MemberHeading id="utcoffset" depth="3" name="utcOffset" sig="utcOffset()" />

<MemberMeta sourceHref="/source/vcard-time-js/#L122" sourceLabel="vcard_time.js:122" />

<MemberHeading id="toicalstring" depth="3" name="toICALString" sig="toICALString(): String" />

<MemberMeta sourceHref="/source/vcard-time-js/#L135" sourceLabel="vcard_time.js:135" />

**Overrides:&#x20;**`ICAL.Time#toICALString`

Returns an RFC 6350 compliant representation of this object.

**Returns**

- `String` — vcard date/time string

<MemberHeading id="tostring" depth="3" name="toString" sig="toString(): String" />

<MemberMeta sourceHref="/source/vcard-time-js/#L144" sourceLabel="vcard_time.js:144" />

**Overrides:&#x20;**`ICAL.Time#toString`

The string representation of this date/time, in jCard form (including : and - separators).

**Returns**

- `String`

<MemberHeading id="reset" depth="3" name="reset" sig="reset()" />

<MemberMeta sourceHref="/source/time-js/#L575" sourceLabel="time.js:575" />

_Inherited from `ICAL.Time#reset`_

**Overrides:&#x20;**`ICAL.Time#reset`

Reset the time instance to epoch time

<MemberHeading
  id="resetto"
  depth="3"
  name="resetTo"
  sig="resetTo(
	year: Number,
	month: Number,
	day: Number,
	hour: Number,
	minute: Number,
	second: Number,
	timezone: ICAL.Timezone,
)"
/>

<MemberMeta sourceHref="/source/time-js/#L591" sourceLabel="time.js:591" />

_Inherited from `ICAL.Time#resetTo`_

**Overrides:&#x20;**`ICAL.Time#resetTo`

Reset the time instance to the given date/time values.

**Parameters**

- `year` (Number) — The year to set
- `month` (Number) — The month to set
- `day` (Number) — The day to set
- `hour` (Number) — The hour to set
- `minute` (Number) — The minute to set
- `second` (Number) — The second to set
- `timezone` ([ICAL.Timezone](/ical#timezone)) — The timezone to set

<MemberHeading id="fromjsdate" depth="3" name="fromJSDate" sig="fromJSDate(aDate: Date, useUTC?: Boolean)" />

<MemberMeta sourceHref="/source/time-js/#L609" sourceLabel="time.js:609" />

_Inherited from `ICAL.Time#fromJSDate`_

**Overrides:&#x20;**`ICAL.Time#fromJSDate`

Set up the current instance from the Javascript date value.

**Parameters**

- `aDate` (Date) — The Javascript Date to read, or null to reset
- `useUTC` (Boolean, optional, default: false) — If true, the UTC values of the date will be used

<MemberHeading id="dayofweek" depth="3" name="dayOfWeek" sig="dayOfWeek(aWeekStart?: ICAL.Time.weekDay): ICAL.Time.weekDay" />

<MemberMeta sourceHref="/source/time-js/#L686" sourceLabel="time.js:686" />

_Inherited from `ICAL.Time#dayOfWeek`_

**Overrides:&#x20;**`ICAL.Time#dayOfWeek`

Calculate the day of week.

**Parameters**

- `aWeekStart` ([ICAL.Time.weekDay](/ical/time#weekday), optional) — The week start weekday, defaults to SUNDAY

**Returns**

- [`ICAL.Time.weekDay`](/ical/time#weekday)

<MemberHeading id="dayofyear" depth="3" name="dayOfYear" sig="dayOfYear(): Number" />

<MemberMeta sourceHref="/source/time-js/#L716" sourceLabel="time.js:716" />

_Inherited from `ICAL.Time#dayOfYear`_

**Overrides:&#x20;**`ICAL.Time#dayOfYear`

Calculate the day of year.

**Returns**

- `Number`

<MemberHeading id="startofweek" depth="3" name="startOfWeek" sig="startOfWeek(aWeekStart?: ICAL.Time.weekDay): ICAL.Time" />

<MemberMeta sourceHref="/source/time-js/#L731" sourceLabel="time.js:731" />

_Inherited from `ICAL.Time#startOfWeek`_

**Overrides:&#x20;**`ICAL.Time#startOfWeek`

Returns a copy of the current date/time, rewound to the start of the week. The resulting ICAL.Time instance is of icaltype date, even if this is a date-time.

**Parameters**

- `aWeekStart` ([ICAL.Time.weekDay](/ical/time#weekday), optional) — The week start weekday, defaults to SUNDAY

**Returns**

- [`ICAL.Time`](/ical#time) — The start of the week (cloned)

<MemberHeading id="endofweek" depth="3" name="endOfWeek" sig="endOfWeek(aWeekStart?: ICAL.Time.weekDay): ICAL.Time" />

<MemberMeta sourceHref="/source/time-js/#L751" sourceLabel="time.js:751" />

_Inherited from `ICAL.Time#endOfWeek`_

**Overrides:&#x20;**`ICAL.Time#endOfWeek`

Returns a copy of the current date/time, shifted to the end of the week. The resulting ICAL.Time instance is of icaltype date, even if this is a date-time.

**Parameters**

- `aWeekStart` ([ICAL.Time.weekDay](/ical/time#weekday), optional) — The week start weekday, defaults to SUNDAY

**Returns**

- [`ICAL.Time`](/ical#time) — The end of the week (cloned)

<MemberHeading id="startofmonth" depth="3" name="startOfMonth" sig="startOfMonth(): ICAL.Time" />

<MemberMeta sourceHref="/source/time-js/#L769" sourceLabel="time.js:769" />

_Inherited from `ICAL.Time#startOfMonth`_

**Overrides:&#x20;**`ICAL.Time#startOfMonth`

Returns a copy of the current date/time, rewound to the start of the month. The resulting ICAL.Time instance is of icaltype date, even if this is a date-time.

**Returns**

- [`ICAL.Time`](/ical#time) — The start of the month (cloned)

<MemberHeading id="endofmonth" depth="3" name="endOfMonth" sig="endOfMonth(): ICAL.Time" />

<MemberMeta sourceHref="/source/time-js/#L786" sourceLabel="time.js:786" />

_Inherited from `ICAL.Time#endOfMonth`_

**Overrides:&#x20;**`ICAL.Time#endOfMonth`

Returns a copy of the current date/time, shifted to the end of the month. The resulting ICAL.Time instance is of icaltype date, even if this is a date-time.

**Returns**

- [`ICAL.Time`](/ical#time) — The end of the month (cloned)

<MemberHeading id="startofyear" depth="3" name="startOfYear" sig="startOfYear(): ICAL.Time" />

<MemberMeta sourceHref="/source/time-js/#L803" sourceLabel="time.js:803" />

_Inherited from `ICAL.Time#startOfYear`_

**Overrides:&#x20;**`ICAL.Time#startOfYear`

Returns a copy of the current date/time, rewound to the start of the year. The resulting ICAL.Time instance is of icaltype date, even if this is a date-time.

**Returns**

- [`ICAL.Time`](/ical#time) — The start of the year (cloned)

<MemberHeading id="endofyear" depth="3" name="endOfYear" sig="endOfYear(): ICAL.Time" />

<MemberMeta sourceHref="/source/time-js/#L821" sourceLabel="time.js:821" />

_Inherited from `ICAL.Time#endOfYear`_

**Overrides:&#x20;**`ICAL.Time#endOfYear`

Returns a copy of the current date/time, shifted to the end of the year. The resulting ICAL.Time instance is of icaltype date, even if this is a date-time.

**Returns**

- [`ICAL.Time`](/ical#time) — The end of the year (cloned)

<MemberHeading id="startdoyweek" depth="3" name="startDoyWeek" sig="startDoyWeek(aFirstDayOfWeek?: ICAL.Time.weekDay): Number" />

<MemberMeta sourceHref="/source/time-js/#L840" sourceLabel="time.js:840" />

_Inherited from `ICAL.Time#startDoyWeek`_

**Overrides:&#x20;**`ICAL.Time#startDoyWeek`

First calculates the start of the week, then returns the day of year for this date. If the day falls into the previous year, the day is zero or negative.

**Parameters**

- `aFirstDayOfWeek` ([ICAL.Time.weekDay](/ical/time#weekday), optional) — The week start weekday, defaults to SUNDAY

**Returns**

- `Number` — The calculated day of year

<MemberHeading id="getdominicalletter" depth="3" name="getDominicalLetter" sig="getDominicalLetter(yr: Number): String" />

<MemberMeta sourceHref="/source/time-js/#L854" sourceLabel="time.js:854" />

_Inherited from `ICAL.Time#getDominicalLetter`_

**Overrides:&#x20;**`ICAL.Time#getDominicalLetter`

Get the dominical letter for the current year. Letters range from A - G for common years, and AG to GF for leap years.

**Parameters**

- `yr` (Number) — The year to retrieve the letter for

**Returns**

- `String` — The dominical letter.

<MemberHeading id="nthweekday" depth="3" name="nthWeekDay" sig="nthWeekDay(aDayOfWeek: Number, aPos: Number): Number" />

<MemberMeta sourceHref="/source/time-js/#L872" sourceLabel="time.js:872" />

_Inherited from `ICAL.Time#nthWeekDay`_

**Overrides:&#x20;**`ICAL.Time#nthWeekDay`

Finds the nthWeekDay relative to the current month (not day). The returned value is a day relative the month that this month belongs to so 1 would indicate the first of the month and 40 would indicate a day in the following month.

**Parameters**

- `aDayOfWeek` (Number) — Day of the week see the day name constants
- `aPos` (Number) — Nth occurrence of a given week day values of 1 and 0 both indicate the first weekday of that type. aPos may be either positive or negative

**Returns**

- `Number` — numeric value indicating a day relative to the current month of this time object

<MemberHeading
  id="isnthweekday"
  depth="3"
  name="isNthWeekDay"
  sig="isNthWeekDay(
	aDayOfWeek: ICAL.Time.weekDay,
	aPos: Number,
): Boolean"
/>

<MemberMeta sourceHref="/source/time-js/#L954" sourceLabel="time.js:954" />

_Inherited from `ICAL.Time#isNthWeekDay`_

**Overrides:&#x20;**`ICAL.Time#isNthWeekDay`

Checks if current time is the nth weekday, relative to the current month. Will always return false when rule resolves outside of current month.

**Parameters**

- `aDayOfWeek` ([ICAL.Time.weekDay](/ical/time#weekday)) — Day of week to check
- `aPos` (Number) — Relative position

**Returns**

- `Boolean` — True, if it is the nth weekday

<MemberHeading id="weeknumber" depth="3" name="weekNumber" sig="weekNumber(aWeekStart: ICAL.Time.weekDay): Number" />

<MemberMeta sourceHref="/source/time-js/#L985" sourceLabel="time.js:985" />

_Inherited from `ICAL.Time#weekNumber`_

**Overrides:&#x20;**`ICAL.Time#weekNumber`

Calculates the ISO 8601 week number. The first week of a year is the week that contains the first Thursday. The year can have 53 weeks, if January 1st is a Friday.

Note there are regions where the first week of the year is the one that starts on January 1st, which may offset the week number. Also, if a different week start is specified, this will also affect the week number.

**Parameters**

- `aWeekStart` ([ICAL.Time.weekDay](/ical/time#weekday)) — The weekday the week starts with

**Returns**

- `Number` — The ISO week number

* **See:**
  - Time.weekOneStarts

<MemberHeading id="addduration" depth="3" name="addDuration" sig="addDuration(aDuration: ICAL.Duration)" />

<MemberMeta sourceHref="/source/time-js/#L1023" sourceLabel="time.js:1023" />

_Inherited from `ICAL.Time#addDuration`_

**Overrides:&#x20;**`ICAL.Time#addDuration`

Adds the duration to the current time. The instance is modified in place.

**Parameters**

- `aDuration` ([ICAL.Duration](/ical#duration)) — The duration to add

<MemberHeading id="subtractdate" depth="3" name="subtractDate" sig="subtractDate(aDate: ICAL.Time): ICAL.Duration" />

<MemberMeta sourceHref="/source/time-js/#L1057" sourceLabel="time.js:1057" />

_Inherited from `ICAL.Time#subtractDate`_

**Overrides:&#x20;**`ICAL.Time#subtractDate`

Subtract the date details (_excluding_ timezone). Useful for finding the relative difference between two time objects excluding their timezone differences.

**Parameters**

- `aDate` ([ICAL.Time](/ical#time)) — The date to subtract

**Returns**

- [`ICAL.Duration`](/ical#duration) — The difference as a duration

<MemberHeading id="subtractdatetz" depth="3" name="subtractDateTz" sig="subtractDateTz(aDate: ICAL.Time): ICAL.Duration" />

<MemberMeta sourceHref="/source/time-js/#L1069" sourceLabel="time.js:1069" />

_Inherited from `ICAL.Time#subtractDateTz`_

**Overrides:&#x20;**`ICAL.Time#subtractDateTz`

Subtract the date details, taking timezones into account.

**Parameters**

- `aDate` ([ICAL.Time](/ical#time)) — The date to subtract

**Returns**

- [`ICAL.Duration`](/ical#duration) — The difference in duration

<MemberHeading id="compare" depth="3" name="compare" sig="compare(aOther: ICAL.Time | ICAL.Period): Number" />

<MemberMeta sourceHref="/source/time-js/#L1081" sourceLabel="time.js:1081" />

_Inherited from `ICAL.Time#compare`_

**Overrides:&#x20;**`ICAL.Time#compare`

Compares the ICAL.Time instance with another one, or a period.

**Parameters**

- `aOther` ([ICAL.Time](/ical#time) | [ICAL.Period](/ical#period)) — The instance to compare with

**Returns**

- `Number` — -1, 0 or 1 for less/equal/greater

<MemberHeading id="comparedateonlytz" depth="3" name="compareDateOnlyTz" sig="compareDateOnlyTz(other: ICAL.Time, tz: ICAL.Timezone): Number" />

<MemberMeta sourceHref="/source/time-js/#L1101" sourceLabel="time.js:1101" />

_Inherited from `ICAL.Time#compareDateOnlyTz`_

**Overrides:&#x20;**`ICAL.Time#compareDateOnlyTz`

Compares only the date part of this instance with another one.

**Parameters**

- `other` ([ICAL.Time](/ical#time)) — The instance to compare with
- `tz` ([ICAL.Timezone](/ical#timezone)) — The timezone to compare in

**Returns**

- `Number` — -1, 0 or 1 for less/equal/greater

<MemberHeading id="converttozone" depth="3" name="convertToZone" sig="convertToZone(zone: ICAL.Timezone): ICAL.Time" />

<MemberMeta sourceHref="/source/time-js/#L1120" sourceLabel="time.js:1120" />

_Inherited from `ICAL.Time#convertToZone`_

**Overrides:&#x20;**`ICAL.Time#convertToZone`

Convert the instance into another timezone. The returned ICAL.Time instance is always a copy.

**Parameters**

- `zone` ([ICAL.Timezone](/ical#timezone)) — The zone to convert to

**Returns**

- [`ICAL.Time`](/ical#time) — The copy, converted to the zone

<MemberHeading id="utcoffset" depth="3" name="utcOffset" sig="utcOffset(): Number" />

<MemberMeta sourceHref="/source/time-js/#L1138" sourceLabel="time.js:1138" />

_Inherited from `ICAL.Time#utcOffset`_

**Overrides:&#x20;**`ICAL.Time#utcOffset`

Calculates the UTC offset of the current date/time in the timezone it is in.

**Returns**

- `Number` — UTC offset in seconds

<MemberHeading id="tojsdate" depth="3" name="toJSDate" sig="toJSDate(): Date" />

<MemberMeta sourceHref="/source/time-js/#L1189" sourceLabel="time.js:1189" />

_Inherited from `ICAL.Time#toJSDate`_

**Overrides:&#x20;**`ICAL.Time#toJSDate`

Converts the current instance to a Javascript date

**Returns**

- `Date`

<MemberHeading
  id="adjust"
  depth="3"
  name="adjust"
  sig="adjust(
	aExtraDays: Number,
	aExtraHours: Number,
	aExtraMinutes: Number,
	aExtraSeconds: Number,
	aTime?: Number,
)"
/>

<MemberMeta sourceHref="/source/time-js/#L1223" sourceLabel="time.js:1223" />

_Inherited from `ICAL.Time#adjust`_

**Overrides:&#x20;**`ICAL.Time#adjust`

Adjust the date/time by the given offset

**Parameters**

- `aExtraDays` (Number) — The extra amount of days
- `aExtraHours` (Number) — The extra amount of hours
- `aExtraMinutes` (Number) — The extra amount of minutes
- `aExtraSeconds` (Number) — The extra amount of seconds
- `aTime` (Number, optional) — The time to adjust, defaults to the current instance.

<MemberHeading id="fromunixtime" depth="3" name="fromUnixTime" sig="fromUnixTime(seconds: Number)" />

<MemberMeta sourceHref="/source/time-js/#L1315" sourceLabel="time.js:1315" />

_Inherited from `ICAL.Time#fromUnixTime`_

**Overrides:&#x20;**`ICAL.Time#fromUnixTime`

Sets up the current instance from unix time, the number of seconds since January 1st, 1970.

**Parameters**

- `seconds` (Number) — The seconds to set up with

<MemberHeading id="tounixtime" depth="3" name="toUnixTime" sig="toUnixTime(): Number" />

<MemberMeta sourceHref="/source/time-js/#L1342" sourceLabel="time.js:1342" />

_Inherited from `ICAL.Time#toUnixTime`_

**Overrides:&#x20;**`ICAL.Time#toUnixTime`

Converts the current instance to seconds since January 1st 1970.

**Returns**

- `Number` — Seconds since 1970

<MemberHeading id="tojson" depth="3" name="toJSON" sig="toJSON(): Object" />

<MemberMeta sourceHref="/source/time-js/#L1378" sourceLabel="time.js:1378" />

_Inherited from `ICAL.Time#toJSON`_

**Overrides:&#x20;**`ICAL.Time#toJSON`

Converts time to into Object which can be serialized then re-created using the constructor.

**Returns**

- `Object`

**Example**

```js
// toJSON will automatically be called
var json = JSON.stringify(mytime);

var deserialized = JSON.parse(json);

var time = new ICAL.Time(deserialized);
```

<MemberHeading id="utcoffset" depth="3" name="utcOffset" sig="utcOffset(): Number" />

<MemberMeta sourceHref="/source/time-js/#L1138" sourceLabel="time.js:1138" />

_Inherited from `ICAL.Time#utcOffset`_

**Overrides:&#x20;**`ICAL.Time#utcOffset`

Calculates the UTC offset of the current date/time in the timezone it is in.

**Returns**

- `Number` — UTC offset in seconds

<MemberHeading id="fromdata" depth="3" name="fromData" sig="fromData(aData: ICAL.Time.timeInit, aZone?: ICAL.Timezone)" />

<MemberMeta sourceHref="/source/time-js/#L641" sourceLabel="time.js:641" />

_Inherited from `ICAL.Time`_

Sets up the current instance using members from the passed data object.

**Parameters**

- `aData` ([ICAL.Time.timeInit](/ical/time#timeinit)) — Time initialization
- `aZone` ([ICAL.Timezone](/ical#timezone), optional) — Timezone this position occurs in

## Static Methods

<MemberHeading
  id="fromdateandortimestring"
  depth="3"
  name="fromDateAndOrTimeString"
  sig="fromDateAndOrTimeString(
	aValue: String,
	aIcalType: String,
): ICAL.VCardTime"
/>

<MemberMeta badges="static" sourceHref="/source/vcard-time-js/#L34" sourceLabel="vcard_time.js:34" />

Returns a new ICAL.VCardTime instance from a date and/or time string.

**Parameters**

- `aValue` (String) — The string to create from
- `aIcalType` (String) — The type for this instance, e.g. date-and-or-time

**Returns**

- [`ICAL.VCardTime`](/ical#vcardtime) — The date/time instance

<MemberHeading id="daysinmonth" depth="3" name="daysInMonth" sig="daysInMonth(month: Number, year: Number): Number" />

<MemberMeta badges="static" sourceHref="/source/time-js/#L60" sourceLabel="time.js:60" />

_Inherited from `ICAL.Time`_

Returns the days in the given month

**Parameters**

- `month` (Number) — The month to check
- `year` (Number) — The year to check

**Returns**

- `Number` — The number of days in the month

<MemberHeading id="isleapyear" depth="3" name="isLeapYear" sig="isLeapYear(year: Number): Boolean" />

<MemberMeta badges="static" sourceHref="/source/time-js/#L81" sourceLabel="time.js:81" />

_Inherited from `ICAL.Time`_

Checks if the year is a leap year

**Parameters**

- `year` (Number) — The year to check

**Returns**

- `Boolean` — True, if the year is a leap year

<MemberHeading id="fromdayofyear" depth="3" name="fromDayOfYear" sig="fromDayOfYear(aDayOfYear: Number, aYear: Number): ICAL.Time" />

<MemberMeta badges="static" sourceHref="/source/time-js/#L97" sourceLabel="time.js:97" />

_Inherited from `ICAL.Time`_

Create a new ICAL.Time from the day of year and year. The date is returned in floating timezone.

**Parameters**

- `aDayOfYear` (Number) — The day of year
- `aYear` (Number) — The year to create the instance in

**Returns**

- [`ICAL.Time`](/ical#time) — The created instance with the calculated date

<MemberHeading id="fromstringv2" depth="3" name="fromStringv2" sig="fromStringv2(str: String): ICAL.Time" />

<MemberMeta badges="static,deprecated" sourceHref="/source/time-js/#L138" sourceLabel="time.js:138" />

_Inherited from `ICAL.Time`_

Returns a new ICAL.Time instance from a date string, e.g 2015-01-02.

<Callout type="error">
  &#x20;Use [ICAL.Time.fromDateString](/ical/time#fromdatestring) instead
</Callout>

**Parameters**

- `str` (String) — The string to create from

**Returns**

- [`ICAL.Time`](/ical#time) — The date/time instance

<MemberHeading id="fromdatestring" depth="3" name="fromDateString" sig="fromDateString(aValue: String): ICAL.Time" />

<MemberMeta badges="static" sourceHref="/source/time-js/#L153" sourceLabel="time.js:153" />

_Inherited from `ICAL.Time`_

Returns a new ICAL.Time instance from a date string, e.g 2015-01-02.

**Parameters**

- `aValue` (String) — The string to create from

**Returns**

- [`ICAL.Time`](/ical#time) — The date/time instance

<MemberHeading
  id="fromdatetimestring"
  depth="3"
  name="fromDateTimeString"
  sig="fromDateTimeString(
	aValue: String,
	prop?: ICAL.Property,
): ICAL.Time"
/>

<MemberMeta badges="static" sourceHref="/source/time-js/#L177" sourceLabel="time.js:177" />

_Inherited from `ICAL.Time`_

Returns a new ICAL.Time instance from a date-time string, e.g 2015-01-02T03:04:05. If a property is specified, the timezone is set up from the property's TZID parameter.

**Parameters**

- `aValue` (String) — The string to create from
- `prop` ([ICAL.Property](/ical#property), optional) — The property the date belongs to

**Returns**

- [`ICAL.Time`](/ical#time) — The date/time instance

<MemberHeading id="fromstring" depth="3" name="fromString" sig="fromString(aValue: String, prop?: ICAL.Property): ICAL.Time" />

<MemberMeta badges="static" sourceHref="/source/time-js/#L233" sourceLabel="time.js:233" />

_Inherited from `ICAL.Time`_

Returns a new ICAL.Time instance from a date or date-time string,

**Parameters**

- `aValue` (String) — The string to create from
- `prop` ([ICAL.Property](/ical#property), optional) — The property the date belongs to

**Returns**

- [`ICAL.Time`](/ical#time) — The date/time instance

<MemberHeading id="fromjsdate" depth="3" name="fromJSDate" sig="fromJSDate(aDate: Date, useUTC?: Boolean)" />

<MemberMeta badges="static" sourceHref="/source/time-js/#L247" sourceLabel="time.js:247" />

_Inherited from `ICAL.Time`_

Creates a new ICAL.Time instance from the given Javascript Date.

**Parameters**

- `aDate` (Date) — The Javascript Date to read, or null to reset
- `useUTC` (Boolean, optional, default: false) — If true, the UTC values of the date will be used

<MemberHeading id="now" depth="3" name="now" sig="now(): ICAL.Time" />

<MemberMeta badges="static" sourceHref="/source/time-js/#L270" sourceLabel="time.js:270" />

_Inherited from `ICAL.Time`_

Creates a new ICAL.Time instance from the current moment. The instance is “floating” - has no timezone relation. To create an instance considering the time zone, call ICAL.Time.fromJSDate(new Date(), true)

**Returns**

- [`ICAL.Time`](/ical#time)

<MemberHeading
  id="weekonestarts"
  depth="3"
  name="weekOneStarts"
  sig="weekOneStarts(
	aYear: Number,
	aWeekStart?: ICAL.Time.weekDay,
): ICAL.Time"
/>

<MemberMeta badges="static" sourceHref="/source/time-js/#L282" sourceLabel="time.js:282" />

_Inherited from `ICAL.Time`_

Returns the date on which ISO week number 1 starts.

**Parameters**

- `aYear` (Number) — The year to search in
- `aWeekStart` ([ICAL.Time.weekDay](/ical/time#weekday), optional) — The week start weekday, used for calculation.

**Returns**

- [`ICAL.Time`](/ical#time) — The date on which week number 1 starts

* **See:**
  - Time#weekNumber

<MemberHeading id="getdominicalletter" depth="3" name="getDominicalLetter" sig="getDominicalLetter(yr: Number): String" />

<MemberMeta badges="static" sourceHref="/source/time-js/#L311" sourceLabel="time.js:311" />

_Inherited from `ICAL.Time`_

Get the dominical letter for the given year. Letters range from A - G for common years, and AG to GF for leap years.

**Parameters**

- `yr` (Number) — The year to retrieve the letter for

**Returns**

- `String` — The dominical letter.

## Instance Fields

<MemberHeading id="icaltype" depth="3" name="icaltype" sig="icaltype: String" />

<MemberMeta sourceHref="/source/vcard-time-js/#L102" sourceLabel="vcard_time.js:102" />

**Overrides:&#x20;**`ICAL.Time#icaltype`

The type name, to be used in the jCal object.

**Default:** `"date-and-or-time"`

<MemberHeading id="fromdata" depth="3" name="fromData" sig="fromData" />

<MemberMeta sourceHref="/source/time-js/#L258" sourceLabel="time.js:258" />

_Inherited from `ICAL.Time#fromData`_

**Overrides:&#x20;**`ICAL.Time#fromData`

Creates a new ICAL.Time instance from the the passed data object.

**Parameters**

- `aData` ([ICAL.Time.timeInit](/ical/time#timeinit)) — Time initialization
- `aZone` ([ICAL.Timezone](/ical#timezone), optional) — Timezone this position occurs in

<MemberHeading id="daysinyearpassedmonth" depth="3" name="daysInYearPassedMonth" sig="daysInYearPassedMonth: Array.<Array.<Number>>" />

<MemberMeta sourceHref="/source/time-js/#L360" sourceLabel="time.js:360" />

_Inherited from `ICAL.Time#daysInYearPassedMonth`_

**Overrides:&#x20;**`ICAL.Time#daysInYearPassedMonth`

The days that have passed in the year after a given month. The array has two members, one being an array of passed days for non-leap years, the other analog for leap years.

**Example**

```js
var isLeapYear = ICAL.Time.isLeapYear(year);
var passedDays = ICAL.Time.daysInYearPassedMonth[isLeapYear][month];
```

<MemberHeading id="zone" depth="3" name="zone" sig="zone: ICAL.Timezone" />

<MemberMeta sourceHref="/source/time-js/#L430" sourceLabel="time.js:430" />

_Inherited from `ICAL.Time#zone`_

**Overrides:&#x20;**`ICAL.Time#zone`

The timezone for this time.

<MemberHeading id="year" depth="3" name="year" sig="year: Number" />

<MemberMeta sourceHref="/source/time-js/#L446" sourceLabel="time.js:446" />

_Inherited from `ICAL.Time#year`_

**Overrides:&#x20;**`ICAL.Time#year`

The year of this date.

<MemberHeading id="month" depth="3" name="month" sig="month: Number" />

<MemberMeta sourceHref="/source/time-js/#L458" sourceLabel="time.js:458" />

_Inherited from `ICAL.Time#month`_

**Overrides:&#x20;**`ICAL.Time#month`

The month of this date.

<MemberHeading id="day" depth="3" name="day" sig="day: Number" />

<MemberMeta sourceHref="/source/time-js/#L470" sourceLabel="time.js:470" />

_Inherited from `ICAL.Time#day`_

**Overrides:&#x20;**`ICAL.Time#day`

The day of this date.

<MemberHeading id="hour" depth="3" name="hour" sig="hour: Number" />

<MemberMeta sourceHref="/source/time-js/#L482" sourceLabel="time.js:482" />

_Inherited from `ICAL.Time#hour`_

**Overrides:&#x20;**`ICAL.Time#hour`

The hour of this date-time.

<MemberHeading id="minute" depth="3" name="minute" sig="minute: Number" />

<MemberMeta sourceHref="/source/time-js/#L494" sourceLabel="time.js:494" />

_Inherited from `ICAL.Time#minute`_

**Overrides:&#x20;**`ICAL.Time#minute`

The minute of this date-time.

<MemberHeading id="second" depth="3" name="second" sig="second: Number" />

<MemberMeta sourceHref="/source/time-js/#L506" sourceLabel="time.js:506" />

_Inherited from `ICAL.Time#second`_

**Overrides:&#x20;**`ICAL.Time#second`

The second of this date-time.

<MemberHeading id="isdate" depth="3" name="isDate" sig="isDate: Boolean" />

<MemberMeta sourceHref="/source/time-js/#L518" sourceLabel="time.js:518" />

_Inherited from `ICAL.Time#isDate`_

**Overrides:&#x20;**`ICAL.Time#isDate`

If true, the instance represents a date (as opposed to a date-time)

## Other

<MemberHeading id="icalclass" depth="3" name="icalclass" sig="icalclass: String" />

<MemberMeta sourceHref="/source/vcard-time-js/#L95" sourceLabel="vcard_time.js:95" />

**Overrides:&#x20;**`ICAL.Time#icalclass`

The class identifier.

**Default:** `"vcardtime"`

<MemberHeading id="epochtime" depth="3" name="epochTime" sig="epochTime: ICAL.Time" />

<MemberMeta sourceHref="/source/time-js/#L329" sourceLabel="time.js:329" />

_Inherited from `ICAL.Time#epochTime`_

**Overrides:&#x20;**`ICAL.Time#epochTime`

January 1st, 1970 as an ICAL.Time.

<MemberHeading id="defaultweekstart" depth="3" name="DEFAULT_WEEK_START" sig="DEFAULT_WEEK_START" />

<MemberMeta sourceHref="/source/time-js/#L378" sourceLabel="time.js:378" />

_Inherited from `ICAL.Time#DEFAULT_WEEK_START`_

**Overrides:&#x20;**`ICAL.Time#DEFAULT_WEEK_START`

The default weekday for the WKST part.

**Default:** `ICAL.Time.MONDAY`

<MemberHeading id="weekday" depth="3" name="weekDay" sig="weekDay: Number" />

<MemberMeta badges="static" sourceHref="/source/types-js/#L25" sourceLabel="types.js:25" />

_Inherited from `ICAL.Time`_

The weekday, 1 = SUNDAY, 7 = SATURDAY. Access via ICAL.Time.MONDAY, ICAL.Time.TUESDAY, ...

<MemberHeading id="timeinit" depth="3" name="timeInit" sig="timeInit: Object" />

<MemberMeta badges="static" sourceHref="/source/types-js/#L40" sourceLabel="types.js:40" />

_Inherited from `ICAL.Time`_

Time initialization

**Properties**

- `year` (Number, optional) — The year for this date
- `month` (Number, optional) — The month for this date
- `day` (Number, optional) — The day for this date
- `hour` (Number, optional) — The hour for this date
- `minute` (Number, optional) — The minute for this date
- `second` (Number, optional) — The second for this date
- `isDate` (Boolean, optional) — If true, the instance represents a date (as opposed to a date-time)
- `timezone` (String, optional) — Timezone id if zone is unknown \[internal]
- `zone` ([ICAL.Timezone](/ical#timezone), optional) — Resolved timezone object \[internal]
