---
title: Property
kind: class
longname: ICAL.Property
description: Provides a layer on top of the raw jCal object for manipulating a single property, with its parameters and value.
---

# Property

<SourceLink href="/source/property-js/#L54" label="property.js:54" />

Provides a layer on top of the raw jCal object for manipulating a single property, with its parameters and value.

---

## Constructor

<Signature
  code="new Property(
	jCal: Array | String,
	parent?: ICAL.Component,
): Property"
/>

Creates a new ICAL.Property instance.

It is important to note that mutations done in the wrapper directly mutate the jCal object used to initialize.

Can also be used to create new properties by passing the name of the property (as a String).

**Parameters**

- `jCal` (Array | String) — Raw jCal representation OR the new name of the property
- `parent` ([ICAL.Component](/ical#component), optional) — Parent component

---

## Instance Methods

<MemberHeading id="getparameter" depth="3" name="getParameter" sig="getParameter(name: String): Array | String" />

<MemberMeta sourceHref="/source/property-js/#L242" sourceLabel="property.js:242" />

Gets a parameter on the property.

**Parameters**

- `name` (String) — Parameter name (lowercase)

**Returns**

- `Array | String` — Parameter value

<MemberHeading id="getfirstparameter" depth="3" name="getFirstParameter" sig="getFirstParameter(name: String): String" />

<MemberMeta sourceHref="/source/property-js/#L256" sourceLabel="property.js:256" />

Gets first parameter on the property.

**Parameters**

- `name` (String) — Parameter name (lowercase)

**Returns**

- `String` — Parameter value

<MemberHeading id="setparameter" depth="3" name="setParameter" sig="setParameter(name: String, value: Array | String)" />

<MemberMeta sourceHref="/source/property-js/#L272" sourceLabel="property.js:272" />

Sets a parameter on the property.

**Parameters**

- `name` (String) — The parameter name
- `value` (Array | String) — The parameter value

<MemberHeading id="removeparameter" depth="3" name="removeParameter" sig="removeParameter(name: String)" />

<MemberMeta sourceHref="/source/property-js/#L287" sourceLabel="property.js:287" />

Removes a parameter

**Parameters**

- `name` (String) — The parameter name

<MemberHeading id="getdefaulttype" depth="3" name="getDefaultType" sig="getDefaultType(): String" />

<MemberMeta sourceHref="/source/property-js/#L296" sourceLabel="property.js:296" />

Get the default type based on this property's name.

**Returns**

- `String` — The default type for this property

<MemberHeading id="resettype" depth="3" name="resetType" sig="resetType(type: String)" />

<MemberMeta sourceHref="/source/property-js/#L315" sourceLabel="property.js:315" />

Sets type of property and clears out any existing values of the current type.

**Parameters**

- `type` (String) — New iCAL type (see design.\*.values)

<MemberHeading
  id="getfirstvalue"
  depth="3"
  name="getFirstValue"
  sig="getFirstValue(
): ICAL.Binary | ICAL.Duration | ICAL.Period | ICAL.Recur | ICAL.Time | ICAL.UtcOffset | Geo | string | null"
/>

<MemberMeta sourceHref="/source/property-js/#L327" sourceLabel="property.js:327" />

Finds the first property value.

**Returns**

- [`ICAL.Binary`](/ical#binary)`  |  `[`ICAL.Duration`](/ical#duration)`  |  `[`ICAL.Period`](/ical#period)`  |  `[`ICAL.Recur`](/ical#recur)`  |  `[`ICAL.Time`](/ical#time)`  |  `[`ICAL.UtcOffset`](/ical#utcoffset)`  |  `[`Geo`](/geo)` | string | null` — First property value

<MemberHeading id="getvalues" depth="3" name="getValues" sig="getValues(): Array" />

<MemberMeta sourceHref="/source/property-js/#L338" sourceLabel="property.js:338" />

Gets all values on the property.

NOTE: this creates an array during each call.

**Returns**

- `Array` — List of values

<MemberHeading id="removeallvalues" depth="3" name="removeAllValues" sig="removeAllValues()" />

<MemberMeta sourceHref="/source/property-js/#L359" sourceLabel="property.js:359" />

Removes all values from this property

<MemberHeading id="setvalues" depth="3" name="setValues" sig="setValues(values: Array)" />

<MemberMeta sourceHref="/source/property-js/#L372" sourceLabel="property.js:372" />

Sets the values of the property. Will overwrite the existing values. This can only be used for multi-value properties.

**Parameters**

- `values` (Array) — An array of values

<MemberHeading id="setvalue" depth="3" name="setValue" sig="setValue(value: String | Object)" />

<MemberMeta sourceHref="/source/property-js/#L407" sourceLabel="property.js:407" />

Sets the current value of the property. If this is a multi-value property, all other values will be removed.

**Parameters**

- `value` (String | Object) — New property value.

<MemberHeading id="tojson" depth="3" name="toJSON" sig="toJSON(): Object" />

<MemberMeta sourceHref="/source/property-js/#L425" sourceLabel="property.js:425" />

Returns the Object representation of this component. The returned object is a live jCal object and should be cloned if modified.

**Returns**

- `Object`

<MemberHeading id="toicalstring" depth="3" name="toICALString" sig="toICALString(): String" />

<MemberMeta sourceHref="/source/property-js/#L433" sourceLabel="property.js:433" />

The string representation of this component.

**Returns**

- `String`

## Static Methods

<MemberHeading
  id="fromstring"
  depth="3"
  name="fromString"
  sig="fromString(
	str: String,
	designSet?: ICAL.design.designSet,
): ICAL.Property"
/>

<MemberMeta badges="static" sourceHref="/source/property-js/#L62" sourceLabel="property.js:62" />

Create an [ICAL.Property](/ical#property) by parsing the passed iCalendar string.

**Parameters**

- `str` (String) — The iCalendar string to parse
- `designSet` ([ICAL.design.designSet](/ical/design/designset), optional) — The design data to use for this property

**Returns**

- [`ICAL.Property`](/ical#property) — The created iCalendar property

## Instance Fields

<MemberHeading id="type" depth="3" name="type" sig="type: String" />

<MemberMeta sourceHref="/source/property-js/#L94" sourceLabel="property.js:94" />

The value type for this property

<MemberHeading id="name" depth="3" name="name" sig="name: String" />

<MemberMeta sourceHref="/source/property-js/#L102" sourceLabel="property.js:102" />

The name of this property, in lowercase.

<MemberHeading id="parent" depth="3" name="parent" sig="parent: ICAL.Component" />

<MemberMeta sourceHref="/source/property-js/#L110" sourceLabel="property.js:110" />

The parent component for this property.
