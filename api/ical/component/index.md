---
title: Component
kind: class
longname: ICAL.Component
description: Wraps a jCal component, adding convenience methods to add, remove and update subcomponents and properties.
---

# Component

<SourceLink href="/source/component-js/#L54" label="component.js:54" />

Wraps a jCal component, adding convenience methods to add, remove and update subcomponents and properties.

---

## Constructor

<Signature
  code="new Component(
	jCal: Array | String,
	parent?: ICAL.Component,
): Component"
/>

Creates a new Component instance.

**Parameters**

- `jCal` (Array | String) — Raw jCal component data OR name of new component
- `parent` ([ICAL.Component](/ical#component), optional) — Parent component to associate

---

## Instance Methods

<MemberHeading id="getfirstsubcomponent" depth="3" name="getFirstSubcomponent" sig="getFirstSubcomponent(name?: String): ICAL.Component" />

<MemberMeta sourceHref="/source/component-js/#L207" sourceLabel="component.js:207" />

Finds first sub component, optionally filtered by name.

**Parameters**

- `name` (String, optional) — Optional name to filter by

**Returns**

- [`ICAL.Component`](/ical#component) — The found subcomponent

<MemberHeading id="getallsubcomponents" depth="3" name="getAllSubcomponents" sig="getAllSubcomponents(name?: String): Array.<Component>" />

<MemberMeta sourceHref="/source/component-js/#L234" sourceLabel="component.js:234" />

Finds all sub components, optionally filtering by name.

**Parameters**

- `name` (String, optional) — Optional name to filter by

**Returns**

- `Array.<`[`Component`](/ical#component)`>` — The found sub components

<MemberHeading id="hasproperty" depth="3" name="hasProperty" sig="hasProperty(name: String): Boolean" />

<MemberMeta sourceHref="/source/component-js/#L268" sourceLabel="component.js:268" />

Returns true when a named property exists.

**Parameters**

- `name` (String) — The property name

**Returns**

- `Boolean` — True, when property is found

<MemberHeading id="getfirstproperty" depth="3" name="getFirstProperty" sig="getFirstProperty(name?: String): ICAL.Property" />

<MemberMeta sourceHref="/source/component-js/#L289" sourceLabel="component.js:289" />

Finds the first property, optionally with the given name.

**Parameters**

- `name` (String, optional) — Lowercase property name

**Returns**

- [`ICAL.Property`](/ical#property) — The found property

<MemberHeading
  id="getfirstpropertyvalue"
  depth="3"
  name="getFirstPropertyValue"
  sig="getFirstPropertyValue(
	name?: String,
): ICAL.Binary | ICAL.Duration | ICAL.Period | ICAL.Recur | ICAL.Time | ICAL.UtcOffset | Geo | string | null"
/>

<MemberMeta sourceHref="/source/component-js/#L316" sourceLabel="component.js:316" />

Returns first property's value, if available.

**Parameters**

- `name` (String, optional) — Lowercase property name

**Returns**

- [`ICAL.Binary`](/ical#binary)`  |  `[`ICAL.Duration`](/ical#duration)`  |  `[`ICAL.Period`](/ical#period)`  |  `[`ICAL.Recur`](/ical#recur)`  |  `[`ICAL.Time`](/ical#time)`  |  `[`ICAL.UtcOffset`](/ical#utcoffset)`  |  `[`Geo`](/geo)` | string | null` — The found property value.

<MemberHeading id="getallproperties" depth="3" name="getAllProperties" sig="getAllProperties(name?: String): Array.<Property>" />

<MemberMeta sourceHref="/source/component-js/#L331" sourceLabel="component.js:331" />

Get all properties in the component, optionally filtered by name.

**Parameters**

- `name` (String, optional) — Lowercase property name

**Returns**

- `Array.<`[`Property`](/ical#property)`>` — List of properties

<MemberHeading id="addsubcomponent" depth="3" name="addSubcomponent" sig="addSubcomponent(component: ICAL.Component): ICAL.Component" />

<MemberMeta sourceHref="/source/component-js/#L432" sourceLabel="component.js:432" />

Adds a single sub component.

**Parameters**

- `component` ([ICAL.Component](/ical#component)) — The component to add

**Returns**

- [`ICAL.Component`](/ical#component) — The passed in component

<MemberHeading id="removesubcomponent" depth="3" name="removeSubcomponent" sig="removeSubcomponent(nameOrComp: ICAL.Component | String): Boolean" />

<MemberMeta sourceHref="/source/component-js/#L456" sourceLabel="component.js:456" />

Removes a single component by name or the instance of a specific component.

**Parameters**

- `nameOrComp` ([ICAL.Component](/ical#component) | String) — Name of component, or component

**Returns**

- `Boolean` — True when comp is removed

<MemberHeading id="removeallsubcomponents" depth="3" name="removeAllSubcomponents" sig="removeAllSubcomponents(name?: String)" />

<MemberMeta sourceHref="/source/component-js/#L470" sourceLabel="component.js:470" />

Removes all components or (if given) all components by a particular name.

**Parameters**

- `name` (String, optional) — Lowercase component name

<MemberHeading id="addproperty" depth="3" name="addProperty" sig="addProperty(property: ICAL.Property): ICAL.Property" />

<MemberMeta sourceHref="/source/component-js/#L482" sourceLabel="component.js:482" />

Adds an [ICAL.Property](/ical#property) to the component.

**Parameters**

- `property` ([ICAL.Property](/ical#property)) — The property to add

**Returns**

- [`ICAL.Property`](/ical#property) — The passed in property

<MemberHeading
  id="addpropertywithvalue"
  depth="3"
  name="addPropertyWithValue"
  sig="addPropertyWithValue(
	name: String,
	value: String | Number | Object,
): ICAL.Property"
/>

<MemberMeta sourceHref="/source/component-js/#L510" sourceLabel="component.js:510" />

Helper method to add a property with a value to the component.

**Parameters**

- `name` (String) — Property name to add
- `value` (String | Number | Object) — Property value

**Returns**

- [`ICAL.Property`](/ical#property) — The created property

<MemberHeading
  id="updatepropertywithvalue"
  depth="3"
  name="updatePropertyWithValue"
  sig="updatePropertyWithValue(
	name: String,
	value: String | Number | Object,
): ICAL.Property"
/>

<MemberMeta sourceHref="/source/component-js/#L528" sourceLabel="component.js:528" />

Helper method that will update or create a property of the given name and sets its value. If multiple properties with the given name exist, only the first is updated.

**Parameters**

- `name` (String) — Property name to update
- `value` (String | Number | Object) — Property value

**Returns**

- [`ICAL.Property`](/ical#property) — The created property

<MemberHeading id="removeproperty" depth="3" name="removeProperty" sig="removeProperty(nameOrProp: String | ICAL.Property): Boolean" />

<MemberMeta sourceHref="/source/component-js/#L547" sourceLabel="component.js:547" />

Removes a single property by name or the instance of the specific property.

**Parameters**

- `nameOrProp` (String | [ICAL.Property](/ical#property)) — Property name or instance to remove

**Returns**

- `Boolean` — True, when deleted

<MemberHeading id="removeallproperties" depth="3" name="removeAllProperties" sig="removeAllProperties(name?: String): Boolean" />

<MemberMeta sourceHref="/source/component-js/#L562" sourceLabel="component.js:562" />

Removes all properties associated with this component, optionally filtered by name.

**Parameters**

- `name` (String, optional) — Lowercase property name

**Returns**

- `Boolean` — True, when deleted

<MemberHeading id="tojson" depth="3" name="toJSON" sig="toJSON(): Object" />

<MemberMeta sourceHref="/source/component-js/#L573" sourceLabel="component.js:573" />

Returns the Object representation of this component. The returned object is a live jCal object and should be cloned if modified.

**Returns**

- `Object`

<MemberHeading id="tostring" depth="3" name="toString" sig="toString(): String" />

<MemberMeta sourceHref="/source/component-js/#L581" sourceLabel="component.js:581" />

The string representation of this component.

**Returns**

- `String`

<MemberHeading id="gettimezonebyid" depth="3" name="getTimeZoneByID" sig="getTimeZoneByID(tzid: String): ICAL.Timezone" />

<MemberMeta sourceHref="/source/component-js/#L595" sourceLabel="component.js:595" />

Retrieve a time zone definition from the component tree, if any is present. If the tree contains no time zone definitions or the TZID cannot be matched, returns null.

**Parameters**

- `tzid` (String) — The ID of the time zone to retrieve

**Returns**

- [`ICAL.Timezone`](/ical#timezone) — The time zone corresponding to the ID, or null

## Static Methods

<MemberHeading id="fromstring" depth="3" name="fromString" sig="fromString(str: String)" />

<MemberMeta badges="static" sourceHref="/source/component-js/#L60" sourceLabel="component.js:60" />

Create an [ICAL.Component](/ical#component) by parsing the passed iCalendar string.

**Parameters**

- `str` (String) — The iCalendar string to parse

## Instance Fields

<MemberHeading id="name" depth="3" name="name" sig="name: String" />

<MemberMeta sourceHref="/source/component-js/#L131" sourceLabel="component.js:131" />

The name of this component
