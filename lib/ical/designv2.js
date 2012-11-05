/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

(typeof(ICAL) === 'undefined')? ICAL = {} : '';

ICAL.designv2 = (function() {

  const NEWLINE_fromICAL = /\\\\|\\;|\\,|\\[Nn]/g;

  function isReallyNaN(number) {
    return typeof(number) === 'number' && isNaN(number);
  }

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
      default:
        return string;
    }
  }

  function replaceNewline(value) {
    // avoid regex when possible.
    if (value.indexOf('\\') === -1) {
      return value;
    }

    return value.replace(NEWLINE_fromICAL, replaceNewlineReplace);
  }

  /**
   * Design data used by the parser to decide if data is semantically correct
   */
  var design = {
    param: {
      // Although the syntax is DQUOTE uri DQUOTE, I don't think we should
      // enfoce anything aside from it being a valid content line.
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
        multiValue: ","
      },
      "delegated-to": {
        valueType: "cal-address",
        multiValue: ","
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
        multiValue: ","
      },
      "partstat": {
        // TODO These values are actually different per-component
        values: ["NEEDS-ACTION", "ACCEPTED", "DECLINED", "TENTATIVE",
                 "DELEGATED", "COMPLETED", "IN-PROCESS"],
        allowXName: true,
        allowIanaToken: true
      },
      "range": {
        values: ["THISLANDFUTURE"]
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
        valueType: "boolean"
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
    },

    // When adding a value here, be sure to add it to the parameter types!
    value: {

      "binary": {
        matches: /^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/,
        requireParam: {
          "encoding": "base64"
        },
        decorate: function(aString) {
          return ICAL.icalbinary.fromString(aString);
        }
      },
      "boolean": {
        values: ["TRUE", "FALSE"],
        decorate: function(aValue) {
          return ICAL.icalvalue.fromString(aValue, "boolean");
        },
        fromICAL: function(aValue) {
          switch(aValue) {
            case 'TRUE':
              return true;
            case 'FALSE':
              return false;
            default:
              //TODO: parser warning
              return false;
          }
        }
      },
      "cal-address": {
        // needs to be an uri
      },
      "date": {
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
        },

        fromICAL: function(aValue) {
          var year = aValue.substr(0, 4);
          var month = aValue.substr(4, 2);
          var day = aValue.substr(6, 2);

          var result = year + '-' +
                       month + '-' +
                       day;

          return result;
        },
      },

      "date-time": {
        validate: function(aValue) {
          var state = {
            buffer: aValue
          };
          var data = ICAL.icalparser.parseDateTime(state);
          ICAL.icalparser.expectEnd(state, "Junk at end of DATE-TIME value");
          return data;
        },

        fromICAL: function(aValue) {
          var year = aValue.substr(0, 4);
          var month = aValue.substr(4, 2);
          var day = aValue.substr(6, 2);
          var hour = aValue.substr(9, 2);
          var min = aValue.substr(11, 2);
          var sec = aValue.substr(13, 2);

          var result = year + '-' +
                       month + '-' +
                       day + 'T' +
                       hour + ':' +
                       min + ':' +
                       sec;

          if (aValue[15] === 'Z') {
            result += 'Z'
          }

          return result;
        },

        decorate: function(aValue) {
          return ICAL.icaltime.fromString(aValue);
        }
      },
      "duration": {
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
      "float": {
        matches: /^[+-]?\d+\.\d+$/,
        decorate: function(aValue) {
          return ICAL.icalvalue.fromString(aValue, "float");
        },

        fromICAL: function(aValue) {
          var parsed = parseFloat(aValue);
          if (isReallyNaN(parsed)) {
            // TODO: parser warning
            return aValue
          }
          return parsed;
        },
      },
      "integer": {
        matches: /^[+-]?\d+$/,
        decorate: function(aValue) {
          return ICAL.icalvalue.fromString(aValue, "integer");
        },

        fromICAL: function(aValue) {
          var parsed = parseInt(aValue);
          if (isReallyNaN(parsed)) {
            // TODO: parser warning
            return aValue
          }
          return parsed;
        },

      },
      "period": {
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
      "recur": {
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

      "text": {
        matches: /.*/,

        decorate: function(aValue) {
          return ICAL.icalvalue.fromString(aValue, "text");
        },

        fromICAL: function(aValue, aName) {
          return replaceNewline(aValue);
        },

        toICAL: function escape(aValue, aName) {
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

      "time": {
        validate: function(aValue) {
          var state = {
            buffer: aValue
          };
          var data = ICAL.icalparser.parseTime(state);
          ICAL.icalparser.expectEnd(state, "Junk at end of TIME value");
          return data;
        },

        fromICAL: function(aValue) {
          if (aValue.length < 6) {
            // TODO: parser exception?
            return aValue;
          }

          // HH::MM::SSZ?
          var result = aValue.substr(0, 2) + ':' +
                       aValue.substr(2, 2) + ':' +
                       aValue.substr(4, 2);

          if (aValue[6] === 'Z') {
            result += 'Z';
          }

          return result;
        }
      },

      "uri": {
        // TODO
        /* ... */
      },

      "utc-offset": {
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
        multiValue: ","
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
        multiValue: ","
      },
      "geo": {
        defaultType: "float",
        multiValue: ";"
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
        multiValue: ","
      },
      "request-status": {
        defaultType: "text",
        multiValue: ";"
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
      "vevent": {}
    }

  };

  return design;

}());
