/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

(typeof(ICAL) === 'undefined')? ICAL = {} : '';

ICAL.design = (function() {
  'use strict';

  var ICAL_NEWLINE = /\\\\|\\;|\\,|\\[Nn]/g;

  function DecorationError() {
    Error.apply(this, arguments);
  }

  DecorationError.prototype = {
    __proto__: Error.prototype
  };

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
   * Changes the format of the UNTIl part in the RECUR
   * value type. When no UNTIL part is found the original
   * is returned untouched.
   *
   * @param {String} type toICAL or fromICAL.
   * @param {String} aValue the value to check.
   * @return {String} upgraded/original value.
   */
  function recurReplaceUntil(aType, aValue) {
    var idx = aValue.indexOf('UNTIL=');
    if (idx === -1) {
      return aValue;
    }

    idx += 6;

    // everything before the value
    var begin = aValue.substr(0, idx);

    // everything after the value
    var end;

    // current until value
    var until;

    // end of value could be -1 meaning this is the last param.
    var endValueIdx = aValue.indexOf(';', idx);

    if (endValueIdx === -1) {
      end = '';
      until = aValue.substr(idx);
    } else {
      end = aValue.substr(endValueIdx);
      until = aValue.substr(idx, endValueIdx - idx);
    }

    if (until.length > 10) {
      until = design.value['date-time'][aType](until);
    } else {
      until = design.value.date[aType](until);
    }

    return begin + until + end;
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
          return ICAL.Binary.fromString(aString);
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
        decorate: function(aValue, aProp) {
          return ICAL.Time.fromDateString(aValue, aProp);
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
          var result = aValue.substr(0, 4) + '-' +
                       aValue.substr(4, 2) + '-' +
                       aValue.substr(6, 2);

          if (aValue[8] === 'Z') {
            result += 'Z';
          }

          return result;
        },

        toICAL: function(aValue) {
          // from: 2012-09-01
          // to: 20120901

          if (aValue.length > 11) {
            //TODO: serialize warning?
            return aValue;
          }

          var result = aValue.substr(0, 4) +
                       aValue.substr(5, 2) +
                       aValue.substr(8, 2);

          if (aValue[10] === 'Z') {
            result += 'Z';
          }

          return result;
        }
      },
      "date-time": {
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

        decorate: function(aValue, aProp) {
          return ICAL.Time.fromDateTimeString(aValue, aProp);
        },

        undecorate: function(aValue) {
          return aValue.toString();
        }
      },
      duration: {
        decorate: function(aValue) {
          return ICAL.Duration.fromString(aValue);
        },
        undecorate: function(aValue) {
          return aValue.toString();
        }
      },
      float: {
        matches: /^[+-]?\d+\.\d+$/,
        decorate: function(aValue) {
          return ICAL.Value.fromString(aValue, "float");
        },

        fromICAL: function(aValue) {
          var parsed = parseFloat(aValue);
          if (ICAL.helpers.isStrictlyNaN(parsed)) {
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
          if (ICAL.helpers.isStrictlyNaN(parsed)) {
            return 0;
          }
          return parsed;
        },

        toICAL: function(aValue) {
          return String(aValue);
        }
      },
      period: {

        fromICAL: function(string) {
          var parts = string.split('/');
          var result = design.value['date-time'].fromICAL(parts[0]) + '/';

          if (ICAL.Duration.isValueString(parts[1])) {
            result += parts[1];
          } else {
            result += design.value['date-time'].fromICAL(parts[1]);
          }

          return result;
        },

        toICAL: function(string) {
          var parts = string.split('/');
          var result = design.value['date-time'].toICAL(parts[0]) + '/';

          if (ICAL.Duration.isValueString(parts[1])) {
            result += parts[1];
          } else {
            result += design.value['date-time'].toICAL(parts[1]);
          }

          return result;
        },

        decorate: function(aValue, aProp) {
          return ICAL.Period.fromString(aValue, aProp);
        },

        undecorate: function(aValue) {
          return aValue.toString();
        }
      },
      recur: {
        fromICAL: recurReplaceUntil.bind(this, 'fromICAL'),
        toICAL: recurReplaceUntil.bind(this, 'toICAL'),

        decorate: function decorate(aValue) {
          return ICAL.Recur.fromString(aValue);
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
        toICAL: function(aValue) {
          if (aValue.length < 7) {
            // no seconds
            // -0500
            return aValue.substr(0, 3) +
                   aValue.substr(4, 2);
          } else {
            // seconds
            // -050000
            return aValue.substr(0, 3) +
                   aValue.substr(4, 2) +
                   aValue.substr(7, 2);
          }
        },

        fromICAL: function(aValue) {
          if (aValue.length < 6) {
            // no seconds
            // -05:00
            return aValue.substr(0, 3) + ':' +
                   aValue.substr(3, 2);
          } else {
            // seconds
            // -05:00:00
            return aValue.substr(0, 3) + ':' +
                   aValue.substr(3, 2) + ':' +
                   aValue.substr(5, 2);
          }
        },

        decorate: function(aValue) {
          return ICAL.UtcOffset.fromString(aValue);
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
        multiValue: ',',
        detectType: function(string) {
          if (string.indexOf('/') !== -1) {
            return 'period';
          }
          return (string.indexOf('T') === -1) ? 'date' : 'date-time';
        }
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
