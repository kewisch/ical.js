---
title: ComponentParser
kind: class
longname: ICAL.ComponentParser
description: The ComponentParser is used to process a String or jCal Object, firing callbacks for various found components, as well as completion.
---

# ComponentParser

<SourceLink href="/source/component-parser-js/#L38" label="component_parser.js:38" />

The ComponentParser is used to process a String or jCal Object, firing callbacks for various found components, as well as completion.

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

---

## Constructor

<Signature code="new ComponentParser(options?: Object): ComponentParser" />

Creates a new ICAL.ComponentParser instance.

**Parameters**

- `options` (Object, optional) — Component parser options
  - `options.parseEvent` (Boolean) — Whether events should be parsed
  - `options.parseTimezeone` (Boolean) — Whether timezones should be parsed

---

## Instance Methods

<MemberHeading id="process" depth="3" name="process" sig="process(ical: ICAL.Component | String | Object)" />

<MemberMeta sourceHref="/source/component-parser-js/#L112" sourceLabel="component_parser.js:112" />

Process a string or parse ical object. This function itself will return nothing but will start the parsing process.

Events must be registered prior to calling this method.

**Parameters**

- `ical` ([ICAL.Component](/ical#component) | String | Object) — The component to process, either in its final form, as a jCal Object, or string representation

## Instance Fields

<MemberHeading id="parseevent" depth="3" name="parseEvent" sig="parseEvent: Boolean" />

<MemberMeta sourceHref="/source/component-parser-js/#L61" sourceLabel="component_parser.js:61" />

When true, parse events

<MemberHeading id="parsetimezone" depth="3" name="parseTimezone" sig="parseTimezone: Boolean" />

<MemberMeta sourceHref="/source/component-parser-js/#L68" sourceLabel="component_parser.js:68" />

When true, parse timezones

## Other

<MemberHeading id="oncomplete" depth="3" name="oncomplete" sig="oncomplete" />

<MemberMeta sourceHref="/source/component-parser-js/#L77" sourceLabel="component_parser.js:77" />

Fired when parsing is complete

<MemberHeading id="onerror" depth="3" name="onerror" sig="onerror" />

<MemberMeta sourceHref="/source/component-parser-js/#L85" sourceLabel="component_parser.js:85" />

Fired if an error occurs during parsing.

**Parameters**

- `err` (Error) — details of error

<MemberHeading id="ontimezone" depth="3" name="ontimezone" sig="ontimezone" />

<MemberMeta sourceHref="/source/component-parser-js/#L93" sourceLabel="component_parser.js:93" />

Fired when a top level component (VTIMEZONE) is found

**Parameters**

- `component` ([ICAL.Timezone](/ical#timezone)) — Timezone object

<MemberHeading id="onevent" depth="3" name="onevent" sig="onevent" />

<MemberMeta sourceHref="/source/component-parser-js/#L101" sourceLabel="component_parser.js:101" />

Fired when a top level component (VEVENT) is found.

**Parameters**

- `component` ([ICAL.Event](/ical#event)) — Top level component
