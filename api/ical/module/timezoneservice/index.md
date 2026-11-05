---
title: TimezoneService
kind: module
longname: ICAL.module:TimezoneService
description: Singleton class to contain timezones. Right now it is all manual registry in the future we may use this class to download timezone information or handle loading pre-expanded timezones.
---

# TimezoneService

<SourceLink href="/source/timezone-service-js/#L22" label="timezone_service.js:22" />

Singleton class to contain timezones. Right now it is all manual registry in the future we may use this class to download timezone information or handle loading pre-expanded timezones.

**Alias:** `ICAL.TimezoneService`

---

## Static Methods

<MemberHeading id="has" depth="3" name="has" sig="has(tzid: String): Boolean" />

<MemberMeta badges="static" sourceHref="/source/timezone-service-js/#L49" sourceLabel="timezone_service.js:49" />

Checks if timezone id has been registered.

**Parameters**

- `tzid` (String) — Timezone identifier (e.g. America/Los_Angeles)

**Returns**

- `Boolean` — False, when not present

<MemberHeading id="get" depth="3" name="get" sig="get(tzid: String): ICAL.Timezone | undefined" />

<MemberMeta badges="static" sourceHref="/source/timezone-service-js/#L63" sourceLabel="timezone_service.js:63" />

Returns a timezone by its tzid if present.

**Parameters**

- `tzid` (String) — Timezone identifier (e.g. America/Los_Angeles)

**Returns**

- [`ICAL.Timezone`](/ical#timezone)` | undefined` — The timezone, or undefined if not found

<MemberHeading
  id="register"
  depth="3"
  name="register"
  sig="register(
	timezone: ICAL.Component | ICAL.Timezone,
	name?: String,
)"
/>

<MemberMeta badges="static" sourceHref="/source/timezone-service-js/#L81" sourceLabel="timezone_service.js:81" />

Registers a timezone object or component.

**Parameters**

- `timezone` ([ICAL.Component](/ical#component) | [ICAL.Timezone](/ical#timezone)) — The initialized zone or vtimezone.
- `name` (String, optional) — The name of the timezone. Defaults to the component's TZID if not passed.

<MemberHeading id="remove" depth="3" name="remove" sig="remove(tzid: String): ICAL.Timezone" />

<MemberMeta badges="static" sourceHref="/source/timezone-service-js/#L120" sourceLabel="timezone_service.js:120" />

Removes a timezone by its tzid from the list.

**Parameters**

- `tzid` (String) — Timezone identifier (e.g. America/Los_Angeles)

**Returns**

- [`ICAL.Timezone`](/ical#timezone) — The removed timezone, or null if not registered
