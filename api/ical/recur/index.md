---
title: Recur
kind: class
longname: ICAL.Recur
description: This class represents the &quot;recur&quot; value type, used for example by RRULE. It provides methods to calculate occurrences among others.
---

# Recur

<SourceLink href="/source/recur-js/#L46" label="recur.js:46" />

This class represents the "recur" value type, used for example by RRULE. It provides methods to calculate occurrences among others.

---

## Constructor

<Signature code="new Recur(data: Object): Recur" />

Create a new instance of the Recur class.

**Parameters**

- `data` (Object) — An object with members of the recurrence
  - `data.freq` ([ICAL.Recur.frequencyValues](/ical/recur#frequencyvalues), optional) — The frequency value
  - `data.interval` (Number, optional) — The INTERVAL value
  - `data.wkst` ([ICAL.Time.weekDay](/ical/time#weekday), optional) — The week start value
  - `data.until` ([ICAL.Time](/ical#time), optional) — The end of the recurrence set
  - `data.count` (Number, optional) — The number of occurrences
  - `data.bysecond` (Array.\<Number>, optional) — The seconds for the BYSECOND part
  - `data.byminute` (Array.\<Number>, optional) — The minutes for the BYMINUTE part
  - `data.byhour` (Array.\<Number>, optional) — The hours for the BYHOUR part
  - `data.byday` (Array.\<String>, optional) — The BYDAY values
  - `data.bymonthday` (Array.\<Number>, optional) — The days for the BYMONTHDAY part
  - `data.byyearday` (Array.\<Number>, optional) — The days for the BYYEARDAY part
  - `data.byweekno` (Array.\<Number>, optional) — The weeks for the BYWEEKNO part
  - `data.bymonth` (Array.\<Number>, optional) — The month for the BYMONTH part
  - `data.bysetpos` (Array.\<Number>, optional) — The positionals for the BYSETPOS part

---

## Instance Methods

<MemberHeading id="iterator" depth="3" name="iterator" sig="iterator(aStart: ICAL.Time): ICAL.RecurIterator" />

<MemberMeta sourceHref="/source/recur-js/#L280" sourceLabel="recur.js:280" />

Create a new iterator for this recurrence rule. The passed start date must be the start date of the event, not the start of the range to search in.

**Parameters**

- `aStart` ([ICAL.Time](/ical#time)) — The item's start date

**Returns**

- [`ICAL.RecurIterator`](/ical#recuriterator) — The recurrence iterator

**Example**

```js
let recur = comp.getFirstPropertyValue('rrule');
let dtstart = comp.getFirstPropertyValue('dtstart');
let iter = recur.iterator(dtstart);
for (let next = iter.next(); next; next = iter.next()) {
  if (next.compare(rangeStart) < 0) {
    continue;
  }
  console.log(next.toString());
}
```

<MemberHeading id="clone" depth="3" name="clone" sig="clone(): ICAL.Recur" />

<MemberMeta sourceHref="/source/recur-js/#L292" sourceLabel="recur.js:292" />

Returns a clone of the recurrence object.

**Returns**

- [`ICAL.Recur`](/ical#recur) — The cloned object

<MemberHeading id="isfinite" depth="3" name="isFinite" sig="isFinite(): Boolean" />

<MemberMeta sourceHref="/source/recur-js/#L301" sourceLabel="recur.js:301" />

Checks if the current rule is finite, i.e. has a count or until part.

**Returns**

- `Boolean` — True, if the rule is finite

<MemberHeading id="isbycount" depth="3" name="isByCount" sig="isByCount(): Boolean" />

<MemberMeta sourceHref="/source/recur-js/#L311" sourceLabel="recur.js:311" />

Checks if the current rule has a count part, and not limited by an until part.

**Returns**

- `Boolean` — True, if the rule is by count

<MemberHeading id="addcomponent" depth="3" name="addComponent" sig="addComponent(aType: String, aValue: Array | String)" />

<MemberMeta sourceHref="/source/recur-js/#L323" sourceLabel="recur.js:323" />

Adds a component (part) to the recurrence rule. This is not a component in the sense of [ICAL.Component](/ical#component), but a part of the recurrence rule, i.e. BYMONTH.

**Parameters**

- `aType` (String) — The name of the component part
- `aValue` (Array | String) — The component value

<MemberHeading id="setcomponent" depth="3" name="setComponent" sig="setComponent(aType: String, aValues: Array)" />

<MemberMeta sourceHref="/source/recur-js/#L338" sourceLabel="recur.js:338" />

Sets the component value for the given by-part.

**Parameters**

- `aType` (String) — The component part name
- `aValues` (Array) — The component values

<MemberHeading id="getcomponent" depth="3" name="getComponent" sig="getComponent(aType: String): Array" />

<MemberMeta sourceHref="/source/recur-js/#L348" sourceLabel="recur.js:348" />

Gets (a copy) of the requested component value.

**Parameters**

- `aType` (String) — The component part name

**Returns**

- `Array` — The component part value

<MemberHeading
  id="getnextoccurrence"
  depth="3"
  name="getNextOccurrence"
  sig="getNextOccurrence(
	aStartTime: ICAL.Time,
	aRecurrenceId: ICAL.Time,
): ICAL.Time"
/>

<MemberMeta sourceHref="/source/recur-js/#L367" sourceLabel="recur.js:367" />

Retrieves the next occurrence after the given recurrence id. See the guide on {@tutorial terminology} for more details.

NOTE: Currently, this method iterates all occurrences from the start date. It should not be called in a loop for performance reasons. If you would like to get more than one occurrence, you can iterate the occurrences manually, see the example on the [iterator](/ical/recur#iterator) method.

**Parameters**

- `aStartTime` ([ICAL.Time](/ical#time)) — The start of the event series
- `aRecurrenceId` ([ICAL.Time](/ical#time)) — The date of the last occurrence

**Returns**

- [`ICAL.Time`](/ical#time) — The next occurrence after

<MemberHeading id="fromdata" depth="3" name="fromData" sig="fromData(data: Object)" />

<MemberMeta sourceHref="/source/recur-js/#L401" sourceLabel="recur.js:401" />

Sets up the current instance using members from the passed data object.

**Parameters**

- `data` (Object) — An object with members of the recurrence
  - `data.freq` ([ICAL.Recur.frequencyValues](/ical/recur#frequencyvalues), optional) — The frequency value
  - `data.interval` (Number, optional) — The INTERVAL value
  - `data.wkst` ([ICAL.Time.weekDay](/ical/time#weekday), optional) — The week start value
  - `data.until` ([ICAL.Time](/ical#time), optional) — The end of the recurrence set
  - `data.count` (Number, optional) — The number of occurrences
  - `data.bysecond` (Array.\<Number>, optional) — The seconds for the BYSECOND part
  - `data.byminute` (Array.\<Number>, optional) — The minutes for the BYMINUTE part
  - `data.byhour` (Array.\<Number>, optional) — The hours for the BYHOUR part
  - `data.byday` (Array.\<String>, optional) — The BYDAY values
  - `data.bymonthday` (Array.\<Number>, optional) — The days for the BYMONTHDAY part
  - `data.byyearday` (Array.\<Number>, optional) — The days for the BYYEARDAY part
  - `data.byweekno` (Array.\<Number>, optional) — The weeks for the BYWEEKNO part
  - `data.bymonth` (Array.\<Number>, optional) — The month for the BYMONTH part
  - `data.bysetpos` (Array.\<Number>, optional) — The positionals for the BYSETPOS part

<MemberHeading id="tojson" depth="3" name="toJSON" sig="toJSON(): Object" />

<MemberMeta sourceHref="/source/recur-js/#L433" sourceLabel="recur.js:433" />

The jCal representation of this recurrence type.

**Returns**

- `Object`

<MemberHeading id="tostring" depth="3" name="toString" sig="toString(): String" />

<MemberMeta sourceHref="/source/recur-js/#L466" sourceLabel="recur.js:466" />

The string representation of this recurrence rule.

**Returns**

- `String`

## Static Methods

<MemberHeading id="fromstring" depth="3" name="fromString" sig="fromString(string: String): ICAL.Recur" />

<MemberMeta badges="static" sourceHref="/source/recur-js/#L53" sourceLabel="recur.js:53" />

Creates a new [ICAL.Recur](/ical#recur) instance from the passed string.

**Parameters**

- `string` (String) — The string to parse

**Returns**

- [`ICAL.Recur`](/ical#recur) — The created recurrence instance

<MemberHeading id="fromdata" depth="3" name="fromData" sig="fromData(aData: Object)" />

<MemberMeta badges="static" sourceHref="/source/recur-js/#L78" sourceLabel="recur.js:78" />

Creates a new [ICAL.Recur](/ical#recur) instance using members from the passed data object.

**Parameters**

- `aData` (Object) — An object with members of the recurrence
  - `aData.freq` ([ICAL.Recur.frequencyValues](/ical/recur#frequencyvalues), optional) — The frequency value
  - `aData.interval` (Number, optional) — The INTERVAL value
  - `aData.wkst` ([ICAL.Time.weekDay](/ical/time#weekday), optional) — The week start value
  - `aData.until` ([ICAL.Time](/ical#time), optional) — The end of the recurrence set
  - `aData.count` (Number, optional) — The number of occurrences
  - `aData.bysecond` (Array.\<Number>, optional) — The seconds for the BYSECOND part
  - `aData.byminute` (Array.\<Number>, optional) — The minutes for the BYMINUTE part
  - `aData.byhour` (Array.\<Number>, optional) — The hours for the BYHOUR part
  - `aData.byday` (Array.\<String>, optional) — The BYDAY values
  - `aData.bymonthday` (Array.\<Number>, optional) — The days for the BYMONTHDAY part
  - `aData.byyearday` (Array.\<Number>, optional) — The days for the BYYEARDAY part
  - `aData.byweekno` (Array.\<Number>, optional) — The weeks for the BYWEEKNO part
  - `aData.bymonth` (Array.\<Number>, optional) — The month for the BYMONTH part
  - `aData.bysetpos` (Array.\<Number>, optional) — The positionals for the BYSETPOS part

<MemberHeading
  id="icaldaytonumericday"
  depth="3"
  name="icalDayToNumericDay"
  sig="icalDayToNumericDay(
	string: String,
	aWeekStart?: ICAL.Time.weekDay,
): Number"
/>

<MemberMeta badges="static" sourceHref="/source/recur-js/#L137" sourceLabel="recur.js:137" />

Convert an ical representation of a day (SU, MO, etc..) into a numeric value of that day.

**Parameters**

- `string` (String) — The iCalendar day name
- `aWeekStart` ([ICAL.Time.weekDay](/ical/time#weekday), optional) — The week start weekday, defaults to SUNDAY

**Returns**

- `Number` — Numeric value of given day

<MemberHeading
  id="numericdaytoicalday"
  depth="3"
  name="numericDayToIcalDay"
  sig="numericDayToIcalDay(
	num: Number,
	aWeekStart?: ICAL.Time.weekDay,
): String"
/>

<MemberMeta badges="static" sourceHref="/source/recur-js/#L152" sourceLabel="recur.js:152" />

Convert a numeric day value into its ical representation (SU, MO, etc..)

**Parameters**

- `num` (Number) — Numeric value of given day
- `aWeekStart` ([ICAL.Time.weekDay](/ical/time#weekday), optional) — The week start weekday, defaults to SUNDAY

**Returns**

- `String` — The ICAL day value, e.g SU,MO,...

## Instance Fields

<MemberHeading id="parts" depth="3" name="parts" sig="parts: ICAL.Recur.byParts" />

<MemberMeta sourceHref="/source/recur-js/#L211" sourceLabel="recur.js:211" />

An object holding the BY-parts of the recurrence rule

<MemberHeading id="interval" depth="3" name="interval" sig="interval: Number" />

<MemberMeta sourceHref="/source/recur-js/#L217" sourceLabel="recur.js:217" />

The interval value for the recurrence rule.

<MemberHeading id="wkst" depth="3" name="wkst" sig="wkst: ICAL.Time.weekDay" />

<MemberMeta sourceHref="/source/recur-js/#L225" sourceLabel="recur.js:225" />

The week start day

**Default:** `ICAL.Time.MONDAY`

<MemberHeading id="until" depth="3" name="until" sig="until: ICAL.Time" />

<MemberMeta sourceHref="/source/recur-js/#L231" sourceLabel="recur.js:231" />

The end of the recurrence

<MemberHeading id="count" depth="3" name="count" sig="count: Number" />

<MemberMeta sourceHref="/source/recur-js/#L237" sourceLabel="recur.js:237" />

The maximum number of occurrences

<MemberHeading id="freq" depth="3" name="freq" sig="freq: ICAL.Recur.frequencyValues" />

<MemberMeta sourceHref="/source/recur-js/#L243" sourceLabel="recur.js:243" />

The frequency value.

## Other

<MemberHeading id="byparts" depth="3" name="byParts" sig="byParts: Object" />

<MemberMeta badges="static" sourceHref="/source/recur-js/#L207" sourceLabel="recur.js:207" />

An object holding the BY-parts of the recurrence rule

**Properties**

- `BYSECOND` (Array.\<Number>, optional) — The seconds for the BYSECOND part
- `BYMINUTE` (Array.\<Number>, optional) — The minutes for the BYMINUTE part
- `BYHOUR` (Array.\<Number>, optional) — The hours for the BYHOUR part
- `BYDAY` (Array.\<String>, optional) — The BYDAY values
- `BYMONTHDAY` (Array.\<Number>, optional) — The days for the BYMONTHDAY part
- `BYYEARDAY` (Array.\<Number>, optional) — The days for the BYYEARDAY part
- `BYWEEKNO` (Array.\<Number>, optional) — The weeks for the BYWEEKNO part
- `BYMONTH` (Array.\<Number>, optional) — The month for the BYMONTH part
- `BYSETPOS` (Array.\<Number>, optional) — The positionals for the BYSETPOS part

<MemberHeading id="icalclass" depth="3" name="icalclass" sig="icalclass: String" />

<MemberMeta sourceHref="/source/recur-js/#L251" sourceLabel="recur.js:251" />

The class identifier.

**Default:** `"icalrecur"`

<MemberHeading id="icaltype" depth="3" name="icaltype" sig="icaltype: String" />

<MemberMeta sourceHref="/source/recur-js/#L259" sourceLabel="recur.js:259" />

The type name, to be used in the jCal object.

**Default:** `"recur"`

<MemberHeading id="frequencyvalues" depth="3" name="frequencyValues" sig="frequencyValues: String" />

<MemberMeta badges="static" sourceHref="/source/types-js/#L48" sourceLabel="types.js:48" />

Possible frequency values for the FREQ part (YEARLY, MONTHLY, WEEKLY, DAILY, HOURLY, MINUTELY, SECONDLY)
