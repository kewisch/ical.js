---
title: ICAL
kind: namespace
longname: ICAL
description: The main ICAL module. Provides access to everything else.
---

# ICAL

<SourceLink href="/source/module-js/#L34" label="module.js:34" />

The main ICAL module. Provides access to everything else.

**Alias:** `ICAL`

**Properties**

- `design` (ICAL.design)
- `helpers` (ICAL.helpers)

---

## Static Methods

<MemberHeading id="parse" depth="3" name="parse" sig="parse(input: String): Object | Array.<Object>" />

<MemberMeta badges="static" sourceHref="/source/parse-js/#L41" sourceLabel="parse.js:41" />

Parses iCalendar or vCard data into a raw jCal object. Consult documentation on the {@tutorial layers|layers of parsing} for more details.

**Parameters**

- `input` (String) — The string data to parse

**Returns**

- `Object | Array.<Object>` — A single jCal object, or an array thereof

* **TODO:**
  - Fix the API to be more clear on the return type

<MemberHeading id="stringify" depth="3" name="stringify" sig="stringify(jCal: Array): String" />

<MemberMeta badges="static" sourceHref="/source/stringify-js/#L31" sourceLabel="stringify.js:31" />

Convert a full jCal/jCard array into a iCalendar/vCard string.

**Parameters**

- `jCal` (Array) — The jCal/jCard document

**Returns**

- `String` — The stringified iCalendar/vCard document

## Other

<MemberHeading id="binary" depth="3" name="Binary" sig="Binary" />

<MemberMeta badges="static" sourceHref="/source/binary-js/#L11" sourceLabel="binary.js:11" />

Represents the BINARY value type, which contains extra methods for encoding and decoding.

**Parameters**

- `aValue` (String) — The binary data for this value

<MemberHeading id="component" depth="3" name="Component" sig="Component" />

<MemberMeta badges="static" sourceHref="/source/component-js/#L54" sourceLabel="component.js:54" />

Wraps a jCal component, adding convenience methods to add, remove and update subcomponents and properties.

**Parameters**

- `jCal` (Array | String) — Raw jCal component data OR name of new component
- `parent` ([ICAL.Component](/ical#component), optional) — Parent component to associate

<MemberHeading id="componentparser" depth="3" name="ComponentParser" sig="ComponentParser" />

<MemberMeta badges="static" sourceHref="/source/component-parser-js/#L38" sourceLabel="component_parser.js:38" />

The ComponentParser is used to process a String or jCal Object, firing callbacks for various found components, as well as completion.

**Parameters**

- `options` (Object, optional) — Component parser options
  - `options.parseEvent` (Boolean) — Whether events should be parsed
  - `options.parseTimezeone` (Boolean) — Whether timezones should be parsed

**Example**

```js
var options = {
  // when false no events will be emitted for type
  parseEvent: true,
  parseTimezone: true
};

var parser = new ICAL.ComponentParser(options);

parser.onevent(eventComponent) {
  //...
}

// ontimezone, etc...

parser.oncomplete = function() {

};

parser.process(stringOrComponent);
```

<MemberHeading id="design" depth="3" name="design" sig="design" />

<MemberMeta badges="static" sourceHref="/source/design-js/#L986" sourceLabel="design.js:986" />

The design data, used by the parser to determine types for properties and other metadata needed to produce correct jCard/jCal data.

**Alias:** `ICAL.design`

<MemberHeading id="duration" depth="3" name="Duration" sig="Duration" />

<MemberMeta badges="static" sourceHref="/source/duration-js/#L17" sourceLabel="duration.js:17" />

This class represents the "duration" value type, with various calculation and manipulation methods.

**Parameters**

- `data` (Object) — An object with members of the duration
  - `data.weeks` (Number, optional) — Duration in weeks
  - `data.days` (Number, optional) — Duration in days
  - `data.hours` (Number, optional) — Duration in hours
  - `data.minutes` (Number, optional) — Duration in minutes
  - `data.seconds` (Number, optional) — Duration in seconds
  - `data.isNegative` (Boolean, optional) — If true, the duration is negative

<MemberHeading id="event" depth="3" name="Event" sig="Event" />

<MemberMeta badges="static" sourceHref="/source/event-js/#L36" sourceLabel="event.js:36" />

ICAL.js is organized into multiple layers. The bottom layer is a raw jCal object, followed by the component/property layer. The highest level is the event representation, which this class is part of. See the {@tutorial layers} guide for more details.

**Parameters**

- `component` ([ICAL.Component](/ical#component), optional) — The ICAL.Component to base this event on
- `options` (Object, optional) — Options for this event
  - `options.strictExceptions` (Boolean, optional) — When true, will verify exceptions are related by their UUID
  - `options.exceptions` (Array.\<([Component](/ical#component)|[Event](/ical#event))>, optional) — Exceptions to this event, either as components or events. If not specified exceptions will automatically be set in relation of component's parent

<MemberHeading id="helpers" depth="3" name="helpers" sig="helpers" />

<MemberMeta badges="static" sourceHref="/source/helpers-js/#L17" sourceLabel="helpers.js:17" />

Helper functions used in various places within ical.js

<MemberHeading id="period" depth="3" name="Period" sig="Period" />

<MemberMeta badges="static" sourceHref="/source/period-js/#L26" sourceLabel="period.js:26" />

This class represents the "period" value type, with various calculation and manipulation methods.

**Parameters**

- `aData` (Object) — An object with members of the period
  - `aData.start` ([ICAL.Time](/ical#time), optional) — The start of the period
  - `aData.end` ([ICAL.Time](/ical#time), optional) — The end of the period
  - `aData.duration` ([ICAL.Duration](/ical#duration), optional) — The duration of the period

<MemberHeading id="property" depth="3" name="Property" sig="Property" />

<MemberMeta badges="static" sourceHref="/source/property-js/#L54" sourceLabel="property.js:54" />

Provides a layer on top of the raw jCal object for manipulating a single property, with its parameters and value.

**Parameters**

- `jCal` (Array | String) — Raw jCal representation OR the new name of the property
- `parent` ([ICAL.Component](/ical#component), optional) — Parent component

<MemberHeading id="recur" depth="3" name="Recur" sig="Recur" />

<MemberMeta badges="static" sourceHref="/source/recur-js/#L46" sourceLabel="recur.js:46" />

This class represents the "recur" value type, used for example by RRULE. It provides methods to calculate occurrences among others.

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

<MemberHeading id="recurexpansion" depth="3" name="RecurExpansion" sig="RecurExpansion" />

<MemberMeta badges="static" sourceHref="/source/recur-expansion-js/#L53" sourceLabel="recur_expansion.js:53" />

Primary class for expanding recurring rules. Can take multiple rrules, rdates, exdate(s) and iterate (in order) over each next occurrence.

Once initialized this class can also be serialized saved and continue iteration from the last point.

NOTE: it is intended that this class is to be used with [ICAL.Event](/ical#event) which handles recurrence exceptions.

**Parameters**

- `options` (Object) — Recurrence expansion options
  - `options.dtstart` ([ICAL.Time](/ical#time)) — Start time of the event
  - `options.component` ([ICAL.Component](/ical#component), optional) — Component for expansion, required if not resuming.

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

<MemberHeading id="recuriterator" depth="3" name="RecurIterator" sig="RecurIterator" />

<MemberMeta badges="static" sourceHref="/source/recur-iterator-js/#L26" sourceLabel="recur_iterator.js:26" />

An iterator for a single recurrence rule. This class usually doesn't have to be instanciated directly, the convenience method [ICAL.Recur#iterator](/ical/recur#iterator) can be used.

**Parameters**

- `options` (Object) — The iterator options
  - `options.rule` ([ICAL.Recur](/ical#recur)) — The rule to iterate.
  - `options.dtstart` ([ICAL.Time](/ical#time)) — The start date of the event.
  - `options.initialized` (Boolean, optional) — When true, assume that options are from a previously constructed iterator. Initialization will not be repeated.

<MemberHeading id="time" depth="3" name="Time" sig="Time" />

<MemberMeta badges="static" sourceHref="/source/time-js/#L49" sourceLabel="time.js:49" />

iCalendar Time representation (similar to JS Date object). Fully independent of system (OS) timezone / time. Unlike JS Date, the month January is 1, not zero.

**Parameters**

- `data` ([ICAL.Time.timeInit](/ical/time#timeinit)) — Time initialization
- `zone` ([ICAL.Timezone](/ical#timezone)) — timezone this position occurs in

**Example**

```js
var time = new ICAL.Time({
  year: 2012,
  month: 10,
  day: 11
  minute: 0,
  second: 0,
  isDate: false
});
```

<MemberHeading id="timezone" depth="3" name="Timezone" sig="Timezone" />

<MemberMeta badges="static" sourceHref="/source/timezone-js/#L28" sourceLabel="timezone.js:28" />

Timezone representation.

**Parameters**

- `data` ([ICAL.Component](/ical#component) | Object) — options for class
  - `data.component` (String | [ICAL.Component](/ical#component)) — If data is a simple object, then this member can be set to either a string containing the component data, or an already parsed ICAL.Component
  - `data.tzid` (String) — The timezone identifier
  - `data.location` (String) — The timezone locationw
  - `data.tznames` (String) — An alternative string representation of the timezone
  - `data.latitude` (Number) — The latitude of the timezone
  - `data.longitude` (Number) — The longitude of the timezone

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

<MemberHeading id="timezoneservice" depth="3" name="TimezoneService" sig="TimezoneService" />

<MemberMeta badges="static" sourceHref="/source/timezone-service-js/#L22" sourceLabel="timezone_service.js:22" />

Singleton class to contain timezones. Right now it is all manual registry in the future we may use this class to download timezone information or handle loading pre-expanded timezones.

**Alias:** `ICAL.TimezoneService`

<MemberHeading id="utcoffset" depth="3" name="UtcOffset" sig="UtcOffset" />

<MemberMeta badges="static" sourceHref="/source/utc-offset-js/#L18" sourceLabel="utc_offset.js:18" />

This class represents the "utc-offset" value type, with various calculation and manipulation methods.

**Parameters**

- `aData` (Object) — An object with members of the utc offset
  - `aData.hours` (Number, optional) — The hours for the utc offset
  - `aData.minutes` (Number, optional) — The minutes in the utc offset
  - `aData.factor` (Number, optional) — The factor for the utc-offset, either -1 or 1

<MemberHeading id="vcardtime" depth="3" name="VCardTime" sig="VCardTime" />

<MemberMeta badges="static" sourceHref="/source/vcard-time-js/#L26" sourceLabel="vcard_time.js:26" />

**Extends:&#x20;**`ICAL.Time`

Describes a vCard time, which has slight differences to the ICAL.Time. Properties can be null if not specified, for example for dates with reduced accuracy or truncation.

Note that currently not all methods are correctly re-implemented for VCardTime. For example, comparison will have undefined results when some members are null.

Also, normalization is not yet implemented for this class!

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
