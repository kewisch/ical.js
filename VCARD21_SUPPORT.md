# vCard 2.1 Support

This document describes the current state of vCard 2.1 support in ical.js based on [RFC 2426 Section 5: Differences From vCard v2.1](https://datatracker.ietf.org/doc/html/rfc2426#section-5).

## Fully Supported Features

The following vCard 2.1 features are fully supported:

### ✅ Basic Parsing
- **VERSION 2.1 detection**: Automatically switches to vCard 2.1 parser when `VERSION:2.1` is encountered
- **Required types**: FN, N, and VERSION types are properly recognized

### ✅ Text Escaping (Difference #2, #3)
- **Newline handling**: `\n` or `\N` in vCard 2.1 remains as literal `\n` in the parsed output (not converted to actual newline)
- **Comma escaping**: `\,` is properly unescaped to `,`
- **Semicolon escaping**: `\;` is properly unescaped to `;`
- **Backslash escaping**: `\\` is properly unescaped to `\`

### ✅ Property Support
All standard vCard 2.1 properties are supported:
- Identification: FN, N, NICKNAME, PHOTO, BDAY
- Delivery addressing: ADR, LABEL
- Telecommunications: TEL, EMAIL, MAILER
- Geographical: TZ, GEO
- Organizational: TITLE, ROLE, LOGO, AGENT, ORG
- Explanatory: CATEGORIES, NOTE, PRODID, REV, SORT-STRING, SOUND, UID, URL
- Security: CLASS, KEY

### ✅ Structured Values
- Semicolon-separated structured values (N, ADR, ORG, GEO)
- No comma-separated multi-values (vCard 2.1 doesn't use commas as separators)

### ✅ Binary Encoding (Difference #11)
- BASE64 and B encoding for inline binary data (PHOTO, LOGO, SOUND, KEY)
- Proper handling of folded binary content

### ✅ Parameter Support
- TYPE parameter with or without `TYPE=` prefix: `TEL;WORK;VOICE` or `TEL;TYPE=WORK;TYPE=VOICE`
- Bare TYPE parameters (vCard 2.1 style): automatically normalized to TYPE= format
- ENCODING parameter: `ENCODING=BASE64`, `ENCODING=B`
- VALUE parameter for type specification
- CHARSET parameter (parsed but not actively used for character set conversion)

## Limited/Unsupported Features

The following vCard 2.1 features have limited or no support:

### ⚠️ QUOTED-PRINTABLE Encoding (Difference #1)
**Status**: Not implemented

vCard 2.1 supports QUOTED-PRINTABLE encoding for text values with special characters:
```
NOTE;ENCODING=QUOTED-PRINTABLE:This has speci=E4l ch=E4racters
```

**Reason**: This encoding was eliminated in vCard 3.0 in favor of BASE64/B encoding only. Implementing QUOTED-PRINTABLE would require a complete decoder that handles soft line breaks (`=` at end of line) and hex-encoded characters (`=XX`).

**Workaround**: Use BASE64 encoding or plain text values instead.


### ⚠️ CHARSET Parameter Character Set Conversion (Difference #7)
**Status**: Parsed but not actively converted

The CHARSET parameter is recognized and stored in the parsed output:
```
FN;CHARSET=ISO-8859-1:Test Name
```

However, automatic character set conversion from ISO-8859-1, Windows-1252, etc. to UTF-8 is not performed. The text values are stored as-is from the input.

**Reason**: Character set conversion requires additional dependencies and is complex to implement correctly.

**Workaround**: Ensure vCard files are already in UTF-8 encoding before parsing, or perform character set conversion before passing data to the parser.

## Comparison with vCard 3.0

| Feature | vCard 2.1 | vCard 3.0 | ical.js Support |
|---------|-----------|-----------|-----------------|
| VERSION value | "2.1" | "3.0" | ✅ Both |
| QUOTED-PRINTABLE encoding | ✅ Supported | ❌ Removed | ❌ Not supported |
| BASE64/B encoding | ✅ Supported | ✅ Required | ✅ Fully supported |
| Newline in text | Literal `\n` | Actual newline | ✅ Correct for both |
| Comma escaping | Required | Required | ✅ Fully supported |
| Semicolon escaping | Required | Required | ✅ Fully supported |
| Bare TYPE parameters | ✅ Allowed | ❌ Requires `TYPE=` | ✅ Fully supported |
| CHARSET parameter | ✅ Supported | ❌ Removed | ⚠️ Parsed only |
| Multi-value properties | No commas | Commas allowed | ✅ Correct for both |

## Testing

Test files are provided in `test/parser/` to verify vCard 2.1 support:

- `vcard21.vcf` - Basic vCard 2.1 test with common properties
- `vcard21_newline.vcf` - Tests newline handling (`\n` remains literal)
- `vcard21_escaping.vcf` - Tests comma, semicolon, and backslash escaping
- `vcard21_charset.vcf` - Tests CHARSET parameter parsing (⚠️ limited support)
- `vcard21_encoding.vcf` - Tests QUOTED-PRINTABLE encoding (⚠️ not supported)
- `vcard21_type_params.vcf` - Tests bare TYPE parameters (✅ fully supported)
- `vcard21_comprehensive.vcf` - Comprehensive test of all properties

## Recommendations

For maximum compatibility:

1. **Bare TYPE parameters are fully supported** - both formats work:
   ```
   TEL;WORK;VOICE:+1-555-1234             ✅ Works (vCard 2.1 style)
   TEL;TYPE=WORK;TYPE=VOICE:+1-555-1234   ✅ Works (vCard 3.0 style)
   ```

2. **Use BASE64 encoding** instead of QUOTED-PRINTABLE:
   ```
   PHOTO;ENCODING=BASE64;TYPE=JPEG:...    ✅ Works
   PHOTO;ENCODING=QUOTED-PRINTABLE:...    ❌ Won't parse
   ```

3. **Ensure UTF-8 encoding** or convert before parsing if using CHARSET parameter

4. **Test with your specific vCard 2.1 files** to ensure compatibility

## Future Enhancements

Potential future improvements:

1. Implement QUOTED-PRINTABLE decoder for full vCard 2.1 compatibility
2. Implement character set conversion for CHARSET parameter
3. Add more comprehensive error messages for unsupported features

## References

- [RFC 2426: vCard MIME Directory Profile](https://datatracker.ietf.org/doc/html/rfc2426) - vCard 3.0 specification
- [vCard 2.1 Specification](http://www.imc.org/pdi/vcard-21.txt) - Original vCard 2.1 specification
- [RFC 2426 Section 5](https://datatracker.ietf.org/doc/html/rfc2426#section-5) - Differences from vCard 2.1
