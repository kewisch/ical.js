---
title: helpers
kind: module
longname: ICAL.module:helpers
description: Helper functions used in various places within ical.js
---

# helpers

<SourceLink href="/source/helpers-js/#L17" label="helpers.js:17" />

Helper functions used in various places within ical.js

---

## Static Methods

<MemberHeading id="updatetimezones" depth="3" name="updateTimezones" sig="updateTimezones(vcal: ICAL.Component): ICAL.Component" />

<MemberMeta badges="static" sourceHref="/source/helpers-js/#L26" sourceLabel="helpers.js:26" />

Compiles a list of all referenced TZIDs in all subcomponents and removes any extra VTIMEZONE subcomponents. In addition, if any TZIDs are referenced by a component, but a VTIMEZONE does not exist, an attempt will be made to generate a VTIMEZONE using ICAL.TimezoneService.

**Parameters**

- `vcal` ([ICAL.Component](/ical#component)) — The top-level VCALENDAR component.

**Returns**

- [`ICAL.Component`](/ical#component) — The ICAL.Component that was passed in.

<MemberHeading id="isstrictlynan" depth="3" name="isStrictlyNaN" sig="isStrictlyNaN(number: Number): Boolean" />

<MemberMeta badges="static" sourceHref="/source/helpers-js/#L80" sourceLabel="helpers.js:80" />

Checks if the given type is of the number type and also NaN.

**Parameters**

- `number` (Number) — The number to check

**Returns**

- `Boolean` — True, if the number is strictly NaN

<MemberHeading id="strictparseint" depth="3" name="strictParseInt" sig="strictParseInt(string: String): Number" />

<MemberMeta badges="static" sourceHref="/source/helpers-js/#L91" sourceLabel="helpers.js:91" />

Parses a string value that is expected to be an integer, when the valid is not an integer throws a decoration error.

**Parameters**

- `string` (String) — Raw string input

**Returns**

- `Number` — Parsed integer

<MemberHeading id="formatclasstype" depth="3" name="formatClassType" sig="formatClassType(data: Object, type: Object): ?" />

<MemberMeta badges="static" sourceHref="/source/helpers-js/#L123" sourceLabel="helpers.js:123" />

Creates or returns a class instance of a given type with the initialization data if the data is not already an instance of the given type.

**Parameters**

- `data` (Object) — object initialization data
- `type` (Object) — object type (like ICAL.Time)

**Returns**

- `?` — An instance of the found type.

**Example**

```js
var time = new ICAL.Time(...);
var result = ICAL.helpers.formatClassType(time, ICAL.Time);

(result instanceof ICAL.Time)
// => true

result = ICAL.helpers.formatClassType({}, ICAL.Time);
(result isntanceof ICAL.Time)
// => true
```

<MemberHeading
  id="unescapedindexof"
  depth="3"
  name="unescapedIndexOf"
  sig="unescapedIndexOf(
	buffer: String,
	search: String,
	pos: Number,
): Number"
/>

<MemberMeta badges="static" sourceHref="/source/helpers-js/#L143" sourceLabel="helpers.js:143" />

Identical to indexOf but will only match values when they are not preceded by a backslash character.

**Parameters**

- `buffer` (String) — String to search
- `search` (String) — Value to look for
- `pos` (Number) — Start position

**Returns**

- `Number` — The position, or -1 if not found

<MemberHeading
  id="binsearchinsert"
  depth="3"
  name="binsearchInsert"
  sig="binsearchInsert(
	list: Array,
	seekVal: ?,
	cmpfunc: function,
): Number"
/>

<MemberMeta badges="static" sourceHref="/source/helpers-js/#L163" sourceLabel="helpers.js:163" />

Find the index for insertion using binary search.

**Parameters**

- `list` (Array) — The list to search
- `seekVal` (?) — The value to insert
- `cmpfunc` (function) — The comparison func, that can compare two seekVals

**Returns**

- `Number` — The insert position

<MemberHeading id="clone" depth="3" name="clone" sig="clone(aSrc: *, aDeep?: Boolean): *" />

<MemberMeta badges="static" sourceHref="/source/helpers-js/#L198" sourceLabel="helpers.js:198" />

Clone the passed object or primitive. By default a shallow clone will be executed.

**Parameters**

- `aSrc` (\*) — The thing to clone
- `aDeep` (Boolean, optional) — If true, a deep clone will be performed

**Returns**

- `*` — The copy of the thing

<MemberHeading id="foldline" depth="3" name="foldline" sig="foldline(aLine: String): String" />

<MemberMeta badges="static" sourceHref="/source/helpers-js/#L235" sourceLabel="helpers.js:235" />

Performs iCalendar line folding. A line ending character is inserted and the next line begins with a whitespace.

**Parameters**

- `aLine` (String) — The line to fold

**Returns**

- `String` — The folded line

**Example**

```js
SUMMARY:This line will be fold
 ed right in the middle of a word.
```

<MemberHeading id="pad2" depth="3" name="pad2" sig="pad2(data: String | Number): String" />

<MemberMeta badges="static" sourceHref="/source/helpers-js/#L269" sourceLabel="helpers.js:269" />

Pads the given string or number with zeros so it will have at least two characters.

**Parameters**

- `data` (String | Number) — The string or number to pad

**Returns**

- `String` — The number padded as a string

<MemberHeading id="trunc" depth="3" name="trunc" sig="trunc(number: Number): Number" />

<MemberMeta badges="static" sourceHref="/source/helpers-js/#L296" sourceLabel="helpers.js:296" />

Truncates the given number, correctly handling negative numbers.

**Parameters**

- `number` (Number) — The number to truncate

**Returns**

- `Number` — The truncated number

<MemberHeading id="extend" depth="3" name="extend" sig="extend(source: Object, target: Object): Object" />

<MemberMeta badges="static" sourceHref="/source/helpers-js/#L314" sourceLabel="helpers.js:314" />

Poor-man's cross-browser object extension. Doesn't support all the features, but enough for our usage. Note that the target's properties are not overwritten with the source properties.

**Parameters**

- `source` (Object) — The object to extend
- `target` (Object) — The object to extend with

**Returns**

- `Object` — Returns the target.

**Example**

```js
var child = ICAL.helpers.extend(parent, {
  "bar": 123
});
```
