/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch */

import { isStrictlyNaN, extend } from "./helpers.js";
import UtcOffset from "./utc_offset.js";
import VCardTime from "./vcard_time.js";
import Recur from "./recur.js";
import Period from "./period.js";
import Duration from "./duration.js";
import Time from "./time.js";
import Binary from "./binary.js";

/**
 * This lets typescript resolve our custom types in the
 * generated d.ts files (jsdoc typedefs are converted to typescript types).
 * Ignore prevents the typedefs from being documented more than once.
 * @ignore
 * @typedef {import("./types.js").designSet} designSet
 * Imports the 'designSet' type from the "types.js" module
 */

/** @module ICAL.design */

const FROM_ICAL_NEWLINE = /\\\\|\\;|\\,|\\[Nn]/g;
const TO_ICAL_NEWLINE = /\\|;|,|\n/g;
const FROM_VCARD_NEWLINE = /\\\\|\\,|\\[Nn]/g;
const TO_VCARD_NEWLINE = /\\|,|\n/g;

function createTextType(fromNewline, toNewline) {
  let result = {
    matches: /.*/,

    fromICAL: function(aValue, structuredEscape) {
      return replaceNewline(aValue, fromNewline, structuredEscape);
    },

    toICAL: function(aValue, structuredEscape) {
      let regEx = toNewline;
      if (structuredEscape)
         regEx = new RegExp(regEx.source + '|' + structuredEscape, regEx.flags);
      return aValue.replace(regEx, function(str) {
        switch (str) {
        case "\\":
          return "\\\\";
        case ";":
          return "\\;";
        case ",":
          return "\\,";
        case "\n":
          return "\\n";
        /* c8 ignore next 2 */
        default:
          return str;
        }
      });
    }
  };
  return result;
}

// default types used multiple times
const DEFAULT_TYPE_TEXT = { defaultType: "text" };
const DEFAULT_TYPE_TEXT_MULTI = { defaultType: "text", multiValue: "," };
const DEFAULT_TYPE_TEXT_STRUCTURED = { defaultType: "text", structuredValue: ";" };
const DEFAULT_TYPE_INTEGER = { defaultType: "integer" };
const DEFAULT_TYPE_DATETIME_DATE = { defaultType: "date-time", allowedTypes: ["date-time", "date"] };
const DEFAULT_TYPE_DATETIME = { defaultType: "date-time" };
const DEFAULT_TYPE_URI = { defaultType: "uri" };
const DEFAULT_TYPE_UTCOFFSET = { defaultType: "utc-offset" };
const DEFAULT_TYPE_RECUR = { defaultType: "recur" };
const DEFAULT_TYPE_DATE_ANDOR_TIME = { defaultType: "date-and-or-time", allowedTypes: ["date-time", "date", "text"] };

function replaceNewlineReplace(string) {
  switch (string) {
    case "\\\\":
      return "\\";
    case "\\;":
      return ";";
    case "\\,":
      return ",";
    case "\\n":
    case "\\N":
      return "\n";
    /* c8 ignore next 2 */
    default:
      return string;
  }
}

function replaceNewline(value, newline, structuredEscape) {
  // avoid regex when possible.
  if (value.indexOf('\\') === -1) {
    return value;
  }
  if (structuredEscape)
     newline = new RegExp(newline.source + '|\\\\' + structuredEscape, newline.flags);
  return value.replace(newline, replaceNewlineReplace);
}

let commonProperties = {
  "categories": DEFAULT_TYPE_TEXT_MULTI,
  "url": DEFAULT_TYPE_URI,
  "version": DEFAULT_TYPE_TEXT,
  "uid": DEFAULT_TYPE_TEXT
};

let commonValues = {
  "boolean": {
    values: ["TRUE", "FALSE"],

    fromICAL: function(aValue) {
      switch (aValue) {
        case 'TRUE':
          return true;
        case 'FALSE':
          return false;
        default:
          //TODO: parser warning
          return false;
      }
    },

    toICAL: function(aValue) {
      if (aValue) {
        return 'TRUE';
      }
      return 'FALSE';
    }

  },
  float: {
    matches: /^[+-]?\d+\.\d+$/,

    fromICAL: function(aValue) {
      let parsed = parseFloat(aValue);
      if (isStrictlyNaN(parsed)) {
        // TODO: parser warning
        return 0.0;
      }
      return parsed;
    },

    toICAL: function(aValue) {
      return String(aValue);
    }
  },
  integer: {
    fromICAL: function(aValue) {
      let parsed = parseInt(aValue);
      if (isStrictlyNaN(parsed)) {
        return 0;
      }
      return parsed;
    },

    toICAL: function(aValue) {
      return String(aValue);
    }
  },
  "utc-offset": {
    toICAL: function(aValue) {
      if (aValue.length < 7) {
        // no seconds
        // -0500
        return aValue.slice(0, 3) +
               aValue.slice(4, 6);
      } else {
        // seconds
        // -050000
        return aValue.slice(0, 3) +
               aValue.slice(4, 6) +
               aValue.slice(7, 9);
      }
    },

    fromICAL: function(aValue) {
      if (aValue.length < 6) {
        // no seconds
        // -05:00
        return aValue.slice(0, 3) + ':' +
               aValue.slice(3, 5);
      } else {
        // seconds
        // -05:00:00
        return aValue.slice(0, 3) + ':' +
               aValue.slice(3, 5) + ':' +
               aValue.slice(5, 7);
      }
    },

    decorate: function(aValue) {
      return UtcOffset.fromString(aValue);
    },

    undecorate: function(aValue) {
      return aValue.toString();
    }
  }
};

let icalParams = {
  // Although the syntax is DQUOTE uri DQUOTE, I don't think we should
  // enforce anything aside from it being a valid content line.
  //
  // At least some params require - if multi values are used - DQUOTEs
  // for each of its values - e.g. delegated-from="uri1","uri2"
  // To indicate this, I introduced the new k/v pair
  // multiValueSeparateDQuote: true
  //
  // "ALTREP": { ... },

  // CN just wants a param-value
  // "CN": { ... }

  "cutype": {
    values: ["INDIVIDUAL", "GROUP", "RESOURCE", "ROOM", "UNKNOWN"],
    allowXName: true,
    allowIanaToken: true
  },

  "delegated-from": {
    valueType: "cal-address",
    multiValue: ",",
    multiValueSeparateDQuote: true
  },
  "delegated-to": {
    valueType: "cal-address",
    multiValue: ",",
    multiValueSeparateDQuote: true
  },
  // "DIR": { ... }, // See ALTREP
  "encoding": {
    values: ["8BIT", "BASE64"]
  },
  // "FMTTYPE": { ... }, // See ALTREP
  "fbtype": {
    values: ["FREE", "BUSY", "BUSY-UNAVAILABLE", "BUSY-TENTATIVE"],
    allowXName: true,
    allowIanaToken: true
  },
  // "LANGUAGE": { ... }, // See ALTREP
  "member": {
    valueType: "cal-address",
    multiValue: ",",
    multiValueSeparateDQuote: true
  },
  "partstat": {
    // TODO These values are actually different per-component
    values: ["NEEDS-ACTION", "ACCEPTED", "DECLINED", "TENTATIVE",
             "DELEGATED", "COMPLETED", "IN-PROCESS"],
    allowXName: true,
    allowIanaToken: true
  },
  "range": {
    values: ["THISANDFUTURE"]
  },
  "related": {
    values: ["START", "END"]
  },
  "reltype": {
    values: ["PARENT", "CHILD", "SIBLING"],
    allowXName: true,
    allowIanaToken: true
  },
  "role": {
    values: ["REQ-PARTICIPANT", "CHAIR",
             "OPT-PARTICIPANT", "NON-PARTICIPANT"],
    allowXName: true,
    allowIanaToken: true
  },
  "rsvp": {
    values: ["TRUE", "FALSE"]
  },
  "sent-by": {
    valueType: "cal-address"
  },
  "tzid": {
    matches: /^\//
  },
  "value": {
    // since the value here is a 'type' lowercase is used.
    values: ["binary", "boolean", "cal-address", "date", "date-time",
             "duration", "float", "integer", "period", "recur", "text",
             "time", "uri", "utc-offset"],
    allowXName: true,
    allowIanaToken: true
  }
};

// When adding a value here, be sure to add it to the parameter types!
const icalValues = extend(commonValues, {
  text: createTextType(FROM_ICAL_NEWLINE, TO_ICAL_NEWLINE),

  uri: {
    // TODO
    /* ... */
  },

  "binary": {
    decorate: function(aString) {
      return Binary.fromString(aString);
    },

    undecorate: function(aBinary) {
      return aBinary.toString();
    }
  },
  "cal-address": {
    // needs to be an uri
  },
  "date": {
    decorate: function(aValue, aProp) {
      if (design.strict) {
        return Time.fromDateString(aValue, aProp);
      } else {
        return Time.fromString(aValue, aProp);
      }
    },

    /**
     * undecorates a time object.
     */
    undecorate: function(aValue) {
      return aValue.toString();
    },

    fromICAL: function(aValue) {
      // from: 20120901
      // to: 2012-09-01
      if (!design.strict && aValue.length >= 15) {
        // This is probably a date-time, e.g. 20120901T130000Z
        return icalValues["date-time"].fromICAL(aValue);
      } else {
        return aValue.slice(0, 4) + '-' +
               aValue.slice(4, 6) + '-' +
               aValue.slice(6, 8);
      }
    },

    toICAL: function(aValue) {
      // from: 2012-09-01
      // to: 20120901
      let len = aValue.length;

      if (len == 10) {
        return aValue.slice(0, 4) +
               aValue.slice(5, 7) +
               aValue.slice(8, 10);
      } else if (len >= 19) {
        return icalValues["date-time"].toICAL(aValue);
      } else {
        //TODO: serialize warning?
        return aValue;
      }

    }
  },
  "date-time": {
    fromICAL: function(aValue) {
      // from: 20120901T130000
      // to: 2012-09-01T13:00:00
      if (!design.strict && aValue.length == 8) {
        // This is probably a date, e.g. 20120901
        return icalValues.date.fromICAL(aValue);
      } else {
        let result = aValue.slice(0, 4) + '-' +
                     aValue.slice(4, 6) + '-' +
                     aValue.slice(6, 8) + 'T' +
                     aValue.slice(9, 11) + ':' +
                     aValue.slice(11, 13) + ':' +
                     aValue.slice(13, 15);

        if (aValue[15] && aValue[15] === 'Z') {
          result += 'Z';
        }

        return result;
      }
    },

    toICAL: function(aValue) {
      // from: 2012-09-01T13:00:00
      // to: 20120901T130000
      let len = aValue.length;

      if (len == 10 && !design.strict) {
        return icalValues.date.toICAL(aValue);
      } else if (len >= 19) {
        let result = aValue.slice(0, 4) +
                     aValue.slice(5, 7) +
                     // grab the (DDTHH) segment
                     aValue.slice(8, 13) +
                     // MM
                     aValue.slice(14, 16) +
                     // SS
                     aValue.slice(17, 19);

        if (aValue[19] && aValue[19] === 'Z') {
          result += 'Z';
        }
        return result;
      } else {
        // TODO: error
        return aValue;
      }
    },

    decorate: function(aValue, aProp) {
      if (design.strict) {
        return Time.fromDateTimeString(aValue, aProp);
      } else {
        return Time.fromString(aValue, aProp);
      }
    },

    undecorate: function(aValue) {
      return aValue.toString();
    }
  },
  duration: {
    decorate: function(aValue) {
      return Duration.fromString(aValue);
    },
    undecorate: function(aValue) {
      return aValue.toString();
    }
  },
  period: {
    fromICAL: function(string) {
      let parts = string.split('/');
      parts[0] = icalValues['date-time'].fromICAL(parts[0]);

      if (!Duration.isValueString(parts[1])) {
        parts[1] = icalValues['date-time'].fromICAL(parts[1]);
      }

      return parts;
    },

    toICAL: function(parts) {
      parts = parts.slice();
      if (!design.strict && parts[0].length == 10) {
        parts[0] = icalValues.date.toICAL(parts[0]);
      } else {
        parts[0] = icalValues['date-time'].toICAL(parts[0]);
      }

      if (!Duration.isValueString(parts[1])) {
        if (!design.strict && parts[1].length == 10) {
          parts[1] = icalValues.date.toICAL(parts[1]);
        } else {
          parts[1] = icalValues['date-time'].toICAL(parts[1]);
        }
      }

      return parts.join("/");
    },

    decorate: function(aValue, aProp) {
      return Period.fromJSON(aValue, aProp, !design.strict);
    },

    undecorate: function(aValue) {
      return aValue.toJSON();
    }
  },
  recur: {
    fromICAL: function(string) {
      return Recur._stringToData(string, true);
    },

    toICAL: function(data) {
      let str = "";
      for (let [k, val] of Object.entries(data)) {
        if (k == "until") {
          if (val.length > 10) {
            val = icalValues['date-time'].toICAL(val);
          } else {
            val = icalValues.date.toICAL(val);
          }
        } else if (k == "wkst") {
          if (typeof val === 'number') {
            val = Recur.numericDayToIcalDay(val);
          }
        } else if (Array.isArray(val)) {
          val = val.join(",");
        }
        str += k.toUpperCase() + "=" + val + ";";
      }
      return str.slice(0, Math.max(0, str.length - 1));
    },

    decorate: function decorate(aValue) {
      return Recur.fromData(aValue);
    },

    undecorate: function(aRecur) {
      return aRecur.toJSON();
    }
  },

  time: {
    fromICAL: function(aValue) {
      // from: MMHHSS(Z)?
      // to: HH:MM:SS(Z)?
      if (aValue.length < 6) {
        // TODO: parser exception?
        return aValue;
      }

      // HH::MM::SSZ?
      let result = aValue.slice(0, 2) + ':' +
                   aValue.slice(2, 4) + ':' +
                   aValue.slice(4, 6);

      if (aValue[6] === 'Z') {
        result += 'Z';
      }

      return result;
    },

    toICAL: function(aValue) {
      // from: HH:MM:SS(Z)?
      // to: MMHHSS(Z)?
      if (aValue.length < 8) {
        //TODO: error
        return aValue;
      }

      let result = aValue.slice(0, 2) +
                   aValue.slice(3, 5) +
                   aValue.slice(6, 8);

      if (aValue[8] === 'Z') {
        result += 'Z';
      }

      return result;
    }
  }
});

let icalProperties = extend(commonProperties, {

  "action": DEFAULT_TYPE_TEXT,
  "attach": { defaultType: "uri" },
  "attendee": { defaultType: "cal-address" },
  "calscale": DEFAULT_TYPE_TEXT,
  "class": DEFAULT_TYPE_TEXT,
  "comment": DEFAULT_TYPE_TEXT,
  "completed": DEFAULT_TYPE_DATETIME,
  "contact": DEFAULT_TYPE_TEXT,
  "created": DEFAULT_TYPE_DATETIME,
  "description": DEFAULT_TYPE_TEXT,
  "dtend": DEFAULT_TYPE_DATETIME_DATE,
  "dtstamp": DEFAULT_TYPE_DATETIME,
  "dtstart": DEFAULT_TYPE_DATETIME_DATE,
  "due": DEFAULT_TYPE_DATETIME_DATE,
  "duration": { defaultType: "duration" },
  "exdate": {
    defaultType: "date-time",
    allowedTypes: ["date-time", "date"],
    multiValue: ','
  },
  "exrule": DEFAULT_TYPE_RECUR,
  "freebusy": { defaultType: "period", multiValue: "," },
  "geo": { defaultType: "float", structuredValue: ";" },
  "last-modified": DEFAULT_TYPE_DATETIME,
  "location": DEFAULT_TYPE_TEXT,
  "method": DEFAULT_TYPE_TEXT,
  "organizer": { defaultType: "cal-address" },
  "percent-complete": DEFAULT_TYPE_INTEGER,
  "priority": DEFAULT_TYPE_INTEGER,
  "prodid": DEFAULT_TYPE_TEXT,
  "related-to": DEFAULT_TYPE_TEXT,
  "repeat": DEFAULT_TYPE_INTEGER,
  "rdate": {
    defaultType: "date-time",
    allowedTypes: ["date-time", "date", "period"],
    multiValue: ',',
    detectType: function(string) {
      if (string.indexOf('/') !== -1) {
        return 'period';
      }
      return (string.indexOf('T') === -1) ? 'date' : 'date-time';
    }
  },
  "recurrence-id": DEFAULT_TYPE_DATETIME_DATE,
  "resources": DEFAULT_TYPE_TEXT_MULTI,
  "request-status": DEFAULT_TYPE_TEXT_STRUCTURED,
  "rrule": DEFAULT_TYPE_RECUR,
  "sequence": DEFAULT_TYPE_INTEGER,
  "status": DEFAULT_TYPE_TEXT,
  "summary": DEFAULT_TYPE_TEXT,
  "transp": DEFAULT_TYPE_TEXT,
  "trigger": { defaultType: "duration", allowedTypes: ["duration", "date-time"] },
  "tzoffsetfrom": DEFAULT_TYPE_UTCOFFSET,
  "tzoffsetto": DEFAULT_TYPE_UTCOFFSET,
  "tzurl": DEFAULT_TYPE_URI,
  "tzid": DEFAULT_TYPE_TEXT,
  "tzname": DEFAULT_TYPE_TEXT
});

// When adding a value here, be sure to add it to the parameter types!
const vcardValues = extend(commonValues, {
  text: createTextType(FROM_VCARD_NEWLINE, TO_VCARD_NEWLINE),
  uri: createTextType(FROM_VCARD_NEWLINE, TO_VCARD_NEWLINE),

  date: {
    decorate: function(aValue) {
      return VCardTime.fromDateAndOrTimeString(aValue, "date");
    },
    undecorate: function(aValue) {
      return aValue.toString();
    },
    fromICAL: function(aValue) {
      if (aValue.length == 8) {
        return icalValues.date.fromICAL(aValue);
      } else if (aValue[0] == '-' && aValue.length == 6) {
        return aValue.slice(0, 4) + '-' + aValue.slice(4);
      } else {
        return aValue;
      }
    },
    toICAL: function(aValue) {
      if (aValue.length == 10) {
        return icalValues.date.toICAL(aValue);
      } else if (aValue[0] == '-' && aValue.length == 7) {
        return aValue.slice(0, 4) + aValue.slice(5);
      } else {
        return aValue;
      }
    }
  },

  time: {
    decorate: function(aValue) {
      return VCardTime.fromDateAndOrTimeString("T" + aValue, "time");
    },
    undecorate: function(aValue) {
      return aValue.toString();
    },
    fromICAL: function(aValue) {
      let splitzone = vcardValues.time._splitZone(aValue, true);
      let zone = splitzone[0], value = splitzone[1];

      //console.log("SPLIT: ",splitzone);

      if (value.length == 6) {
        value = value.slice(0, 2) + ':' +
                value.slice(2, 4) + ':' +
                value.slice(4, 6);
      } else if (value.length == 4 && value[0] != '-') {
        value = value.slice(0, 2) + ':' + value.slice(2, 4);
      } else if (value.length == 5) {
        value = value.slice(0, 3) + ':' + value.slice(3, 5);
      }

      if (zone.length == 5 && (zone[0] == '-' || zone[0] == '+')) {
        zone = zone.slice(0, 3) + ':' + zone.slice(3);
      }

      return value + zone;
    },

    toICAL: function(aValue) {
      let splitzone = vcardValues.time._splitZone(aValue);
      let zone = splitzone[0], value = splitzone[1];

      if (value.length == 8) {
        value = value.slice(0, 2) +
                value.slice(3, 5) +
                value.slice(6, 8);
      } else if (value.length == 5 && value[0] != '-') {
        value = value.slice(0, 2) + value.slice(3, 5);
      } else if (value.length == 6) {
        value = value.slice(0, 3) + value.slice(4, 6);
      }

      if (zone.length == 6 && (zone[0] == '-' || zone[0] == '+')) {
        zone = zone.slice(0, 3) + zone.slice(4);
      }

      return value + zone;
    },

    _splitZone: function(aValue, isFromIcal) {
      let lastChar = aValue.length - 1;
      let signChar = aValue.length - (isFromIcal ? 5 : 6);
      let sign = aValue[signChar];
      let zone, value;

      if (aValue[lastChar] == 'Z') {
        zone = aValue[lastChar];
        value = aValue.slice(0, Math.max(0, lastChar));
      } else if (aValue.length > 6 && (sign == '-' || sign == '+')) {
        zone = aValue.slice(signChar);
        value = aValue.slice(0, Math.max(0, signChar));
      } else {
        zone = "";
        value = aValue;
      }

      return [zone, value];
    }
  },

  "date-time": {
    decorate: function(aValue) {
      return VCardTime.fromDateAndOrTimeString(aValue, "date-time");
    },

    undecorate: function(aValue) {
      return aValue.toString();
    },

    fromICAL: function(aValue) {
      return vcardValues['date-and-or-time'].fromICAL(aValue);
    },

    toICAL: function(aValue) {
      return vcardValues['date-and-or-time'].toICAL(aValue);
    }
  },

  "date-and-or-time": {
    decorate: function(aValue) {
      return VCardTime.fromDateAndOrTimeString(aValue, "date-and-or-time");
    },

    undecorate: function(aValue) {
      return aValue.toString();
    },

    fromICAL: function(aValue) {
      let parts = aValue.split('T');
      return (parts[0] ? vcardValues.date.fromICAL(parts[0]) : '') +
             (parts[1] ? 'T' + vcardValues.time.fromICAL(parts[1]) : '');
    },

    toICAL: function(aValue) {
      let parts = aValue.split('T');
      return vcardValues.date.toICAL(parts[0]) +
             (parts[1] ? 'T' + vcardValues.time.toICAL(parts[1]) : '');

    }
  },
  timestamp: icalValues['date-time'],
  "language-tag": {
    matches: /^[a-zA-Z0-9-]+$/ // Could go with a more strict regex here
  },
  "phone-number": {
    fromICAL: function(aValue) {
      return Array.from(aValue).filter(function(c) {
          return c === '\\' ? undefined : c;
        }).join('');
    },
    toICAL: function(aValue) {
      return Array.from(aValue).map(function(c) {
        return c === ',' || c === ";" ? '\\' + c : c;
      }).join('');
    }
  }
});

let vcardParams = {
  "type": {
    valueType: "text",
    multiValue: ","
  },
  "value": {
    // since the value here is a 'type' lowercase is used.
    values: ["text", "uri", "date", "time", "date-time", "date-and-or-time",
             "timestamp", "boolean", "integer", "float", "utc-offset",
             "language-tag"],
    allowXName: true,
    allowIanaToken: true
  }
};

let vcardProperties = extend(commonProperties, {
  "adr": { defaultType: "text", structuredValue: ";", multiValue: "," },
  "anniversary": DEFAULT_TYPE_DATE_ANDOR_TIME,
  "bday": DEFAULT_TYPE_DATE_ANDOR_TIME,
  "caladruri": DEFAULT_TYPE_URI,
  "caluri": DEFAULT_TYPE_URI,
  "clientpidmap": DEFAULT_TYPE_TEXT_STRUCTURED,
  "email": DEFAULT_TYPE_TEXT,
  "fburl": DEFAULT_TYPE_URI,
  "fn": DEFAULT_TYPE_TEXT,
  "gender": DEFAULT_TYPE_TEXT_STRUCTURED,
  "geo": DEFAULT_TYPE_URI,
  "impp": DEFAULT_TYPE_URI,
  "key": DEFAULT_TYPE_URI,
  "kind": DEFAULT_TYPE_TEXT,
  "lang": { defaultType: "language-tag" },
  "logo": DEFAULT_TYPE_URI,
  "member": DEFAULT_TYPE_URI,
  "n": { defaultType: "text", structuredValue: ";", multiValue: "," },
  "nickname": DEFAULT_TYPE_TEXT_MULTI,
  "note": DEFAULT_TYPE_TEXT,
  "org": { defaultType: "text", structuredValue: ";" },
  "photo": DEFAULT_TYPE_URI,
  "related": DEFAULT_TYPE_URI,
  "rev": { defaultType: "timestamp" },
  "role": DEFAULT_TYPE_TEXT,
  "sound": DEFAULT_TYPE_URI,
  "source": DEFAULT_TYPE_URI,
  "tel": { defaultType: "uri", allowedTypes: ["uri", "text"] },
  "title": DEFAULT_TYPE_TEXT,
  "tz": { defaultType: "text", allowedTypes: ["text", "utc-offset", "uri"] },
  "xml": DEFAULT_TYPE_TEXT
});

let vcard3Values = extend(commonValues, {
  binary: icalValues.binary,
  date: vcardValues.date,
  "date-time": vcardValues["date-time"],
  "phone-number": vcardValues["phone-number"],
  uri: icalValues.uri,
  text: icalValues.text,
  time: icalValues.time,
  vcard: icalValues.text,
  "utc-offset": {
    toICAL: function(aValue) {
      return aValue.slice(0, 7);
    },

    fromICAL: function(aValue) {
      return aValue.slice(0, 7);
    },

    decorate: function(aValue) {
      return UtcOffset.fromString(aValue);
    },

    undecorate: function(aValue) {
      return aValue.toString();
    }
  }
});

let vcard3Params = {
  "type": {
    valueType: "text",
    multiValue: ","
  },
  "value": {
    // since the value here is a 'type' lowercase is used.
    values: ["text", "uri", "date", "date-time", "phone-number", "time",
             "boolean", "integer", "float", "utc-offset", "vcard", "binary"],
    allowXName: true,
    allowIanaToken: true
  }
};

let vcard3Properties = extend(commonProperties, {
  fn: DEFAULT_TYPE_TEXT,
  n: { defaultType: "text", structuredValue: ";", multiValue: "," },
  nickname: DEFAULT_TYPE_TEXT_MULTI,
  photo: { defaultType: "binary", allowedTypes: ["binary", "uri"] },
  bday: {
    defaultType: "date-time",
    allowedTypes: ["date-time", "date"],
    detectType: function(string) {
      return (string.indexOf('T') === -1) ? 'date' : 'date-time';
    }
  },

  adr: { defaultType: "text", structuredValue: ";", multiValue: "," },
  label: DEFAULT_TYPE_TEXT,

  tel: { defaultType: "phone-number" },
  email: DEFAULT_TYPE_TEXT,
  mailer: DEFAULT_TYPE_TEXT,

  tz: { defaultType: "utc-offset", allowedTypes: ["utc-offset", "text"] },
  geo: { defaultType: "float", structuredValue: ";" },

  title: DEFAULT_TYPE_TEXT,
  role: DEFAULT_TYPE_TEXT,
  logo: { defaultType: "binary", allowedTypes: ["binary", "uri"] },
  agent: { defaultType: "vcard", allowedTypes: ["vcard", "text", "uri"] },
  org: DEFAULT_TYPE_TEXT_STRUCTURED,

  note: DEFAULT_TYPE_TEXT_MULTI,
  prodid: DEFAULT_TYPE_TEXT,
  rev: {
    defaultType: "date-time",
    allowedTypes: ["date-time", "date"],
    detectType: function(string) {
      return (string.indexOf('T') === -1) ? 'date' : 'date-time';
    }
  },
  "sort-string": DEFAULT_TYPE_TEXT,
  sound: { defaultType: "binary", allowedTypes: ["binary", "uri"] },

  class: DEFAULT_TYPE_TEXT,
  key: { defaultType: "binary", allowedTypes: ["binary", "text"] }
});

/**
 * iCalendar design set
 * @type {designSet}
 */
let icalSet = {
  name: "ical",
  value: icalValues,
  param: icalParams,
  property: icalProperties,
  propertyGroups: false
};

/**
 * vCard 4.0 design set
 * @type {designSet}
 */
let vcardSet = {
  name: "vcard4",
  value: vcardValues,
  param: vcardParams,
  property: vcardProperties,
  propertyGroups: true
};

/**
 * vCard 3.0 design set
 * @type {designSet}
 */
let vcard3Set = {
  name: "vcard3",
  value: vcard3Values,
  param: vcard3Params,
  property: vcard3Properties,
  propertyGroups: true
};

/**
 * The design data, used by the parser to determine types for properties and
 * other metadata needed to produce correct jCard/jCal data.
 *
 * @alias ICAL.design
 * @exports module:ICAL.design
 */
const design = {
  /**
   * Can be set to false to make the parser more lenient.
   */
  strict: true,

  /**
   * The default set for new properties and components if none is specified.
   * @type {designSet}
   */
  defaultSet: icalSet,

  /**
   * The default type for unknown properties
   * @type {String}
   */
  defaultType: 'unknown',

  /**
   * Holds the design set for known top-level components
   *
   * @type {Object}
   * @property {designSet} vcard       vCard VCARD
   * @property {designSet} vevent      iCalendar VEVENT
   * @property {designSet} vtodo       iCalendar VTODO
   * @property {designSet} vjournal    iCalendar VJOURNAL
   * @property {designSet} valarm      iCalendar VALARM
   * @property {designSet} vtimezone   iCalendar VTIMEZONE
   * @property {designSet} daylight    iCalendar DAYLIGHT
   * @property {designSet} standard    iCalendar STANDARD
   *
   * @example
   * let propertyName = 'fn';
   * let componentDesign = ICAL.design.components.vcard;
   * let propertyDetails = componentDesign.property[propertyName];
   * if (propertyDetails.defaultType == 'text') {
   *   // Yep, sure is...
   * }
   */
  components: {
    vcard: vcardSet,
    vcard3: vcard3Set,
    vevent: icalSet,
    vtodo: icalSet,
    vjournal: icalSet,
    valarm: icalSet,
    vtimezone: icalSet,
    daylight: icalSet,
    standard: icalSet
  },


  /**
   * The design set for iCalendar (rfc5545/rfc7265) components.
   * @type {designSet}
   */
  icalendar: icalSet,

  /**
   * The design set for vCard (rfc6350/rfc7095) components.
   * @type {designSet}
   */
  vcard: vcardSet,

  /**
   * The design set for vCard (rfc2425/rfc2426/rfc7095) components.
   * @type {designSet}
   */
  vcard3: vcard3Set,

  /**
   * Gets the design set for the given component name.
   *
   * @param {String} componentName        The name of the component
   * @return {designSet}      The design set for the component
   */
  getDesignSet: function(componentName) {
    let isInDesign = componentName && componentName in design.components;
    return isInDesign ? design.components[componentName] : design.defaultSet;
  }
};
export default design;
