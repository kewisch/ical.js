/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

(typeof(ICAL) === 'undefined')? ICAL = {} : '';

/**
 * Design data used by the parser to decide if data is semantically correct
 */
ICAL.designv2 = {
  param: {
    // Although the syntax is DQUOTE uri DQUOTE, I don't think we should
    // enfoce anything aside from it being a valid content line.
    // "ALTREP": { ... },

    // CN just wants a param-value
    // "CN": { ... }

    "CUTYPE": {
      values: ["INDIVIDUAL", "GROUP", "RESOURCE", "ROOM", "UNKNOWN"],
      allowXName: true,
      allowIanaToken: true
    },

    "DELEGATED-FROM": {
      valueType: "CAL-ADDRESS",
      multiValue: true
    },
    "DELEGATED-TO": {
      valueType: "CAL-ADDRESS",
      multiValue: true
    },
    // "DIR": { ... }, // See ALTREP
    "ENCODING": {
      values: ["8BIT", "BASE64"]
    },
    // "FMTTYPE": { ... }, // See ALTREP
    "FBTYPE": {
      values: ["FREE", "BUSY", "BUSY-UNAVAILABLE", "BUSY-TENTATIVE"],
      allowXName: true,
      allowIanaToken: true
    },
    // "LANGUAGE": { ... }, // See ALTREP
    "MEMBER": {
      valueType: "CAL-ADDRESS",
      multiValue: true
    },
    "PARTSTAT": {
      // TODO These values are actually different per-component
      values: ["NEEDS-ACTION", "ACCEPTED", "DECLINED", "TENTATIVE",
               "DELEGATED", "COMPLETED", "IN-PROCESS"],
      allowXName: true,
      allowIanaToken: true
    },
    "RANGE": {
      values: ["THISANDFUTURE"]
    },
    "RELATED": {
      values: ["START", "END"]
    },
    "RELTYPE": {
      values: ["PARENT", "CHILD", "SIBLING"],
      allowXName: true,
      allowIanaToken: true
    },
    "ROLE": {
      values: ["REQ-PARTICIPANT", "CHAIR",
               "OPT-PARTICIPANT", "NON-PARTICIPANT"],
      allowXName: true,
      allowIanaToken: true
    },
    "RSVP": {
      valueType: "BOOLEAN"
    },
    "SENT-BY": {
      valueType: "CAL-ADDRESS"
    },
    "TZID": {
      matches: /^\//
    },
    "VALUE": {
      values: ["BINARY", "BOOLEAN", "CAL-ADDRESS", "DATE", "DATE-TIME",
               "DURATION", "FLOAT", "INTEGER", "PERIOD", "RECUR", "TEXT",
               "TIME", "URI", "UTC-OFFSET"],
      allowXName: true,
      allowIanaToken: true
    }
  },

  // When adding a value here, be sure to add it to the parameter types!
  value: {

    "BINARY": {
      matches: /^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/,
      requireParam: {
        "ENCODING": "BASE64"
      },
      decorate: function(aString) {
        return ICAL.icalbinary.fromString(aString);
      }
    },
    "BOOLEAN": {
      values: ["TRUE", "FALSE"],
      decorate: function(aValue) {
        return ICAL.icalvalue.fromString(aValue, "BOOLEAN");
      }
    },
    "CAL-ADDRESS": {
      // needs to be an uri
    },
    "DATE": {
      validate: function(aValue) {
        var state = {
          buffer: aValue
        };
        var data = ICAL.icalparser.parseDate(state);
        ICAL.icalparser.expectEnd(state, "Junk at end of DATE value");
        return data;
      },
      decorate: function(aValue) {
        return ICAL.icaltime.fromString(aValue);
      }
    },
    "DATE-TIME": {
      validate: function(aValue) {
        var state = {
          buffer: aValue
        };
        var data = ICAL.icalparser.parseDateTime(state);
        ICAL.icalparser.expectEnd(state, "Junk at end of DATE-TIME value");
        return data;
      },

      decorate: function(aValue) {
        return ICAL.icaltime.fromString(aValue);
      }
    },
    "DURATION": {
      validate: function(aValue) {
        var state = {
          buffer: aValue
        };
        var data = ICAL.icalparser.parseDuration(state);
        ICAL.icalparser.expectEnd(state, "Junk at end of DURATION value");
        return data;
      },
      decorate: function(aValue) {
        return ICAL.icalduration.fromString(aValue);
      }
    },
    "FLOAT": {
      matches: /^[+-]?\d+\.\d+$/,
      decorate: function(aValue) {
        return ICAL.icalvalue.fromString(aValue, "FLOAT");
      }
    },
    "INTEGER": {
      matches: /^[+-]?\d+$/,
      decorate: function(aValue) {
        return ICAL.icalvalue.fromString(aValue, "INTEGER");
      }
    },
    "PERIOD": {
      validate: function(aValue) {
        var state = {
          buffer: aValue
        };
        var data = ICAL.icalparser.parsePeriod(state);
        ICAL.icalparser.expectEnd(state, "Junk at end of PERIOD value");
        return data;
      },

      decorate: function(aValue) {
        return ICAL.icalperiod.fromString(aValue);
      }
    },
    "RECUR": {
      validate: function(aValue) {
        var state = {
          buffer: aValue
        };
        var data = ICAL.icalparser.parseRecur(state);
        ICAL.icalparser.expectEnd(state, "Junk at end of RECUR value");
        return data;
      },

      decorate: function decorate(aValue) {
        return ICAL.icalrecur.fromString(aValue);
      }
    },

    "TEXT": {
      matches: /.*/,
      decorate: function(aValue) {
        return ICAL.icalvalue.fromString(aValue, "TEXT");
      },
      unescape: function(aValue, aName) {
        return aValue.replace(/\\\\|\\;|\\,|\\[Nn]/g, function(str) {
          switch (str) {
          case "\\\\":
            return "\\";
          case "\\;":
            return ";";
          case "\\,":
            return ",";
          case "\\n":
          case "\\N":
            return "\n";
          default:
            return str;
          }
        });
      },

      escape: function escape(aValue, aName) {
        return aValue.replace(/\\|;|,|\n/g, function(str) {
          switch (str) {
          case "\\":
            return "\\\\";
          case ";":
            return "\\;";
          case ",":
            return "\\,";
          case "\n":
            return "\\n";
          default:
            return str;
          }
        });
      }
    },

    "TIME": {
      validate: function(aValue) {
        var state = {
          buffer: aValue
        };
        var data = ICAL.icalparser.parseTime(state);
        ICAL.icalparser.expectEnd(state, "Junk at end of TIME value");
        return data;
      }
    },

    "URI": {
      // TODO
      /* ... */
    },

    "UTC-OFFSET": {
      validate: function(aValue) {
        var state = {
          buffer: aValue
        };
        var data = ICAL.icalparser.parseUtcOffset(state);
        ICAL.icalparser.expectEnd(state, "Junk at end of UTC-OFFSET value");
        return data;
      },

      decorate: function(aValue) {
        return ICAL.icalutcoffset.fromString(aValue);
      }
    }
  },

  property: {
    decorate: function decorate(aData, aParent) {
      return new ICAL.icalproperty(aData, aParent);
    },
    "attach": {
      defaultType: "uri"
    },
    "attendee": {
      defaultType: "cal-address"
    },
    "categories": {
      defaultType: "text",
      multiValue: true
    },
    "completed": {
      defaultType: "date-time"
    },
    "created": {
      defaultType: "date-time"
    },
    "dtend": {
      defaultType: "date-time",
      allowedTypes: ["date-time", "date"]
    },
    "dtstamp": {
      defaultType: "date-time"
    },
    "dtstart": {
      defaultType: "date-time",
      allowedTypes: ["date-time", "date"]
    },
    "due": {
      defaultType: "date-time",
      allowedTypes: ["date-time", "date"]
    },
    "duration": {
      defaultType: "duration"
    },
    "exdate": {
      defaultType: "date-time",
      allowedTypes: ["date-time", "date"]
    },
    "exrule": {
      defaultType: "recur"
    },
    "freebusy": {
      defaultType: "period",
      multiValue: true
    },
    "geo": {
      defaultType: "float",
      structuredValue: true
    },
    /* TODO exactly 2 values */"last-modified": {
      defaultType: "date-time"
    },
    "organizer": {
      defaultType: "cal-address"
    },
    "percent-complete": {
      defaultType: "integer"
    },
    "repeat": {
      defaultType: "integer"
    },
    "rdate": {
      defaultType: "date-time",
      allowedTypes: ["date-time", "date", "period"]
    },
    "recurrence-id": {
      defaultType: "date-time",
      allowedTypes: ["date-time", "date"]
    },
    "resources": {
      defaultType: "text",
      multiValue: true
    },
    "request-status": {
      defaultType: "text",
      structuredValue: true
    },
    "priority": {
      defaultType: "integer"
    },
    "rrule": {
      defaultType: "recur"
    },
    "sequence": {
      defaultType: "integer"
    },
    "trigger": {
      defaultType: "duration",
      allowedTypes: ["duration", "date-time"]
    },
    "tzoffsetfrom": {
      defaultType: "utc-offset"
    },
    "tzoffsetto": {
      defaultType: "utc-offset"
    },
    "tzurl": {
      defaultType: "uri"
    },
    "url": {
      defaultType: "uri"
    }
  },

  component: {
    decorate: function decorate(aData, aParent) {
      return new ICAL.icalcomponent(aData, aParent);
    },
    "VEVENT": {}
  }
};

