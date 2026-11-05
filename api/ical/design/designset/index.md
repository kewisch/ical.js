---
title: designSet
kind: typedef
longname: ICAL.design.designSet
description: A designSet describes value, parameter and property data. It is used by ther parser and stringifier in components and properties to determine they should be represented.
---

# designSet

<SourceLink href="/source/types-js/#L98" label="types.js:98" />

A designSet describes value, parameter and property data. It is used by ther parser and stringifier in components and properties to determine they should be represented.

**Properties**

- `value` (Object) — Definitions for value types, keys are type names
- `param` (Object) — Definitions for params, keys are param names
- `property` (Object) — Definitions for properties, keys are property names
- `propertyGroups` (boolean) — If content lines may include a group name

**Type**

`Object`
