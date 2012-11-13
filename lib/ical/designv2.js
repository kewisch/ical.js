/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

(typeof(ICAL) === 'undefined')? ICAL = {} : '';

ICAL.designv2 = (function() {
  'use strict';

  var ICAL_NEWLINE = /\\\\|\\;|\\,|\\[Nn]/g;

  function DecorationError() {
    Error.apply(this, arguments);
  }

  DecorationError.prototype = {
    __proto__: Error.prototype
  };

  function isStrictlyNaN(number) {
    return typeof(number) === 'number' && isNaN(number);
  }

  /**
   * Parses a string value that is expected to be an
   * integer, when the valid is not an integer throws
   * a decoration error.
   *
   * @param {String} string raw input.
   * @return {Number} integer.
   */
  function strictParseInt(string) {
    var result = parseInt(string, 10);

    if (isStrictlyNaN(result)) {
      throw new DecorationError(
        'Could not extract integer from "' + string + '"'
      );
    }

    return result;
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

    return value.replace(ICAL_NEWLINE, replaceNewlineReplace);
  }

  /**
   * Design data used by the parser to decide if data is semantically correct
   */
  var design = {
    DecorationError: DecorationError,

    defaultType: 'text',

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
        decorate: function(aString) {
          return ICAL.icalbinary.fromString(aString);
        },

        undecorate: function(aBinary) {
          return aBinary.toString();
        }
      },
      "boolean": {
        values: ["TRUE", "FALSE"],

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
        },

        toICAL: function(aValue) {
          if (aValue) {
            return 'TRUE';
          }
          return 'FALSE';
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
          var data = ICAL.DecorationParser.parseDate(state);
          ICAL.DecorationParser.expectEnd(state, "Junk at end of DATE value");
          return data;
        },

        decorate: function(aValue) {
          // YYYY-MM-DD
          // 2012-10-10
          return new ICAL.icaltime({
            year: strictParseInt(aValue.substr(0, 4)),
            month: strictParseInt(aValue.substr(5, 2)),
            day: strictParseInt(aValue.substr(8, 2)),
            isDate: true
          });
        },

        /**
         * undecorates a time object.
         */
        undecorate: function(aValue) {
          // 2012-10-10
          return aValue.year + '-' +
                 ICAL.helpers.pad2(aValue.month) + '-' +
                 ICAL.helpers.pad2(aValue.day);
        },

        fromICAL: function(aValue) {
          // from: 20120901
          // to: 2012-09-01
          var result = aValue.substr(0, 4) + '-' +
                       aValue.substr(4, 2) + '-' +
                       aValue.substr(6, 2);

          return result;
        },

        toICAL: function(aValue) {
          // from: 2012-09-01
          // to: 20120901

          if (aValue.length !== 10) {
            //TODO: serialize warning?
            return aValue;
          }

          return aValue.substr(0, 4) +
                 aValue.substr(5, 2) +
                 aValue.substr(8, 2);
        }
      },
      "date-time": {
        validate: function(aValue) {
          var state = {
            buffer: aValue
          };
          var data = ICAL.DecorationParser.parseDateTime(state);
          ICAL.DecorationParser.expectEnd(state, "Junk at end of DATE-TIME value");
          return data;
        },

        fromICAL: function(aValue) {
          // from: 20120901T130000
          // to: 2012-09-01T13:00:00
          var result = aValue.substr(0, 4) + '-' +
                       aValue.substr(4, 2) + '-' +
                       aValue.substr(6, 2) + 'T' +
                       aValue.substr(9, 2) + ':' +
                       aValue.substr(11, 2) + ':' +
                       aValue.substr(13, 2);

          if (aValue[15] === 'Z') {
            result += 'Z'
          }

          return result;
        },

        toICAL: function(aValue) {
          // from: 2012-09-01T13:00:00
          // to: 20120901T130000

          if (aValue.length < 19) {
            // TODO: error
            return aValue;
          }

          var result = aValue.substr(0, 4) +
                       aValue.substr(5, 2) +
                       // grab the (DDTHH) segment
                       aValue.substr(8, 5) +
                       // MM
                       aValue.substr(14, 2) +
                       // SS
                       aValue.substr(17, 2);

          if (aValue[19] === 'Z') {
            result += 'Z';
          }

          return result;
        },

        decorate: function(aValue) {
          if (aValue.length < 19) {
            throw new DecorationError(
              'invalid date-time value: "' + aValue + '"'
            );
          }

          // 2012-10-10T10:10:10(Z)?
          var time = new ICAL.icaltime({
            year: strictParseInt(aValue.substr(0, 4)),
            month: strictParseInt(aValue.substr(5, 2)),
            day: strictParseInt(aValue.substr(8, 2)),
            hour: strictParseInt(aValue.substr(11, 2)),
            minute: strictParseInt(aValue.substr(14, 2)),
            second: strictParseInt(aValue.substr(17, 2))
          });

          if (aValue[19] === 'Z') {
            time.zone = ICAL.icaltimezone.utc_timezone;
          }

          return time;
        },

        undecorate: function(aValue) {
          var result = aValue.year + '-' +
                      ICAL.helpers.pad2(aValue.month) + '-' +
                      ICAL.helpers.pad2(aValue.day) + 'T' +
                      ICAL.helpers.pad2(aValue.hour) + ':' +
                      ICAL.helpers.pad2(aValue.minute) + ':' +
                      ICAL.helpers.pad2(aValue.second);

          if (aValue.zone === ICAL.icaltimezone.utc_timezone) {
            result += 'Z';
          }

          return result;
        }
      },
      duration: {
        decorate: function(aValue) {
          return ICAL.icalduration.fromString(aValue);
        },
        undecorate: function(aValue) {
          return aValue.toString();
        }
      },
      float: {
        matches: /^[+-]?\d+\.\d+$/,
        decorate: function(aValue) {
          return ICAL.icalvalue.fromString(aValue, "float");
        },

        fromICAL: function(aValue) {
          var parsed = parseFloat(aValue);
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
          var parsed = parseInt(aValue);
          if (isStrictlyNaN(parsed)) {
            return 0;
          }
          return parsed;
        },

        toICAL: function(aValue) {
          return String(aValue);
        }
      },
      period: {
        validate: function(aValue) {
          var state = {
            buffer: aValue
          };
          var data = ICAL.DecorationParser.parsePeriod(state);
          ICAL.DecorationParser.expectEnd(state, "Junk at end of PERIOD value");
          return data;
        },

        decorate: function(aValue) {
          return ICAL.icalperiod.fromString(aValue);
        },

        undecorate: function(aValue) {
          return aValue.toString();
        }
      },
      recur: {
        validate: function(aValue) {
          var state = {
            buffer: aValue
          };
          var data = ICAL.DecorationParser.parseRecur(state);
          ICAL.DecorationParser.expectEnd(state, "Junk at end of RECUR value");
          return data;
        },

        decorate: function decorate(aValue) {
          return ICAL.icalrecur.fromString(aValue);
        },

        undecorate: function(aRecur) {
          return aRecur.toString();
        }
      },

      text: {
        matches: /.*/,

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

      time: {
        validate: function(aValue) {
          var state = {
            buffer: aValue
          };
          var data = ICAL.DecorationParser.parseTime(state);
          ICAL.DecorationParser.expectEnd(state, "Junk at end of TIME value");
          return data;
        },

        fromICAL: function(aValue) {
          // from: MMHHSS(Z)?
          // to: HH:MM:SS(Z)?
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
        },

        toICAL: function(aValue) {
          // from: HH:MM:SS(Z)?
          // to: MMHHSS(Z)?
          if (aValue.length < 8) {
            //TODO: error
            return aValue;
          }

          var result = aValue.substr(0, 2) +
                       aValue.substr(3, 2) +
                       aValue.substr(6, 2);

          if (aValue[8] === 'Z') {
            result += 'Z';
          }

          return result;
        }
      },

      uri: {
        // TODO
        /* ... */
      },

      "utc-offset": {
        validate: function(aValue) {
          var state = {
            buffer: aValue
          };
          var data = ICAL.DecorationParser.parseUtcOffset(state);
          ICAL.DecorationParser.expectEnd(state, "Junk at end of UTC-OFFSET value");
          return data;
        },

        decorate: function(aValue) {
          return ICAL.icalutcoffset.fromString(aValue);
        },

        undecorate: function(aValue) {
          return aValue.toString();
        }
      }
    },

    property: {
      decorate: function decorate(aData, aParent) {
        return new ICAL.Property(aData, aParent);
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
        allowedTypes: ["date-time", "date"],
        multiValue: ','
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
        allowedTypes: ["date-time", "date", "period"],
        multiValue: ','
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
        return new ICAL.Component(aData, aParent);
      },
      "vevent": {}
    }

  };

  return design;
}());
