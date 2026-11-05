---
title: parserState
kind: typedef
longname: ICAL.parse.parserState
description: The state for parsing content lines from an iCalendar/vCard string.
---

# parserState

<SourceLink href="/source/types-js/#L69" label="types.js:69" />

**Modifiers:** `private`

The state for parsing content lines from an iCalendar/vCard string.

**Properties**

- `designSet` ([ICAL.design.designSet](/ical/design/designset)) — The design set to use for parsing
- `stack` (Array.\<[Component](/ical#component)>) — The stack of components being processed
- `component` ([ICAL.Component](/ical#component)) — The currently active component

**Type**

`Object`
