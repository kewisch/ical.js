---
title: Binary
kind: class
longname: ICAL.Binary
description: Represents the BINARY value type, which contains extra methods for encoding and decoding.
---

# Binary

<SourceLink href="/source/binary-js/#L11" label="binary.js:11" />

Represents the BINARY value type, which contains extra methods for encoding and decoding.

---

## Constructor

<Signature code="new Binary(aValue: String): Binary" />

Creates a new ICAL.Binary instance

**Parameters**

- `aValue` (String) — The binary data for this value

---

## Instance Methods

<MemberHeading id="decodevalue" depth="3" name="decodeValue" sig="decodeValue(): String" />

<MemberMeta sourceHref="/source/binary-js/#L43" sourceLabel="binary.js:43" />

Base64 decode the current value

**Returns**

- `String` — The base64-decoded value

<MemberHeading id="setencodedvalue" depth="3" name="setEncodedValue" sig="setEncodedValue(aValue: String)" />

<MemberMeta sourceHref="/source/binary-js/#L53" sourceLabel="binary.js:53" />

Encodes the passed parameter with base64 and sets the internal value to the result.

**Parameters**

- `aValue` (String) — The raw binary value to encode

<MemberHeading id="tostring" depth="3" name="toString" sig="toString(): String" />

<MemberMeta sourceHref="/source/binary-js/#L165" sourceLabel="binary.js:165" />

The string representation of this value

**Returns**

- `String`

## Static Methods

<MemberHeading id="fromstring" depth="3" name="fromString" sig="fromString(aString: String): ICAL.Binary" />

<MemberMeta badges="static" sourceHref="/source/binary-js/#L18" sourceLabel="binary.js:18" />

Creates a binary value from the given string.

**Parameters**

- `aString` (String) — The binary value string

**Returns**

- [`ICAL.Binary`](/ical#binary) — The binary value instance

## Other

<MemberHeading id="icaltype" depth="3" name="icaltype" sig="icaltype" />

<MemberMeta sourceHref="/source/binary-js/#L36" sourceLabel="binary.js:36" />

The type name, to be used in the jCal object.

**Default:** `"binary"`
