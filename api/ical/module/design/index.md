---
title: design
kind: module
longname: ICAL.module:design
description: The design data, used by the parser to determine types for properties and other metadata needed to produce correct jCard/jCal data.
---

# design

<SourceLink href="/source/design-js/#L986" label="design.js:986" />

The design data, used by the parser to determine types for properties and other metadata needed to produce correct jCard/jCal data.

**Alias:** `ICAL.design`

---

## Static Methods

<MemberHeading
  id="getdesignset"
  depth="3"
  name="getDesignSet"
  sig="getDesignSet(
	componentName: String,
): module:ICAL~ICAL.design.designSet"
/>

<MemberMeta badges="static" sourceHref="/source/design-js/#L1062" sourceLabel="design.js:1062" />

Gets the design set for the given component name.

**Parameters**

- `componentName` (String) — The name of the component

**Returns**

- `module:ICAL~ICAL.design.designSet` — The design set for the component

## Instance Fields

<MemberHeading id="icalset" depth="3" name="icalSet" sig="icalSet: module:ICAL~ICAL.design.designSet" />

<MemberMeta sourceHref="/source/design-js/#L947" sourceLabel="design.js:947" />

iCalendar design set

<MemberHeading id="vcardset" depth="3" name="vcardSet" sig="vcardSet: module:ICAL~ICAL.design.designSet" />

<MemberMeta sourceHref="/source/design-js/#L959" sourceLabel="design.js:959" />

vCard 4.0 design set

<MemberHeading id="vcard3set" depth="3" name="vcard3Set" sig="vcard3Set: module:ICAL~ICAL.design.designSet" />

<MemberMeta sourceHref="/source/design-js/#L971" sourceLabel="design.js:971" />

vCard 3.0 design set

## Static Fields

<MemberHeading id="strict" depth="3" name="strict" sig="strict" />

<MemberMeta badges="static" sourceHref="/source/design-js/#L990" sourceLabel="design.js:990" />

Can be set to false to make the parser more lenient.

<MemberHeading id="defaultset" depth="3" name="defaultSet" sig="defaultSet: module:ICAL~ICAL.design.designSet" />

<MemberMeta badges="static" sourceHref="/source/design-js/#L996" sourceLabel="design.js:996" />

The default set for new properties and components if none is specified.

<MemberHeading id="defaulttype" depth="3" name="defaultType" sig="defaultType: String" />

<MemberMeta badges="static" sourceHref="/source/design-js/#L1002" sourceLabel="design.js:1002" />

The default type for unknown properties

<MemberHeading id="components" depth="3" name="components" sig="components: Object" />

<MemberMeta badges="static" sourceHref="/source/design-js/#L1025" sourceLabel="design.js:1025" />

Holds the design set for known top-level components

**Properties**

- `vcard` (module:ICAL\~ICAL.design.designSet) — vCard VCARD
- `vevent` (module:ICAL\~ICAL.design.designSet) — iCalendar VEVENT
- `vtodo` (module:ICAL\~ICAL.design.designSet) — iCalendar VTODO
- `vjournal` (module:ICAL\~ICAL.design.designSet) — iCalendar VJOURNAL
- `valarm` (module:ICAL\~ICAL.design.designSet) — iCalendar VALARM
- `vtimezone` (module:ICAL\~ICAL.design.designSet) — iCalendar VTIMEZONE
- `daylight` (module:ICAL\~ICAL.design.designSet) — iCalendar DAYLIGHT
- `standard` (module:ICAL\~ICAL.design.designSet) — iCalendar STANDARD

**Example**

```js
let propertyName = 'fn';
let componentDesign = ICAL.design.components.vcard;
let propertyDetails = componentDesign.property[propertyName];
if (propertyDetails.defaultType == 'text') {
  // Yep, sure is...
}
```

<MemberHeading id="icalendar" depth="3" name="icalendar" sig="icalendar: module:ICAL~ICAL.design.designSet" />

<MemberMeta badges="static" sourceHref="/source/design-js/#L1042" sourceLabel="design.js:1042" />

The design set for iCalendar (rfc5545/rfc7265) components.

<MemberHeading id="vcard" depth="3" name="vcard" sig="vcard: module:ICAL~ICAL.design.designSet" />

<MemberMeta badges="static" sourceHref="/source/design-js/#L1048" sourceLabel="design.js:1048" />

The design set for vCard (rfc6350/rfc7095) components.

<MemberHeading id="vcard3" depth="3" name="vcard3" sig="vcard3: module:ICAL~ICAL.design.designSet" />

<MemberMeta badges="static" sourceHref="/source/design-js/#L1054" sourceLabel="design.js:1054" />

The design set for vCard (rfc2425/rfc2426/rfc7095) components.
