/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

(typeof(ICAL) === 'undefined')? ICAL = {} : '';

ICAL.design = (function() {
  'use strict';

  var ICAL_NEWLINE = /\\\\|\\;|\\,|\\[Nn]/g;

  // default types used multiple times
  var DEFAULT_TYPE_TEXT  = { defaultType: "text" };
  var DEFAULT_TYPE_TEXT_MULTI = { defaultType: "text", multiValue: "," };
  var DEFAULT_TYPE_INTEGER = { defaultType: "integer" };
  var DEFAULT_TYPE_DATETIME_DATE = { defaultType: "date-time", allowedTypes: ["date-time", "date"] };
  var DEFAULT_TYPE_DATETIME = { defaultType: "date-time" };
  var DEFAULT_TYPE_URI = { defaultType: "uri" };
  var DEFAULT_TYPE_UTCOFFSET = { defaultType: "utc-offset" };
  var DEFAULT_TYPE_RECUR = { defaultType: "recur" };

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
   * Design data used by the parser to decide if data is semantically correct
   */
  var design = {
    DecorationError: DecorationError,

    registerProperty: function(propName, data) {
      if (propName in design.property) {
        throw new Error("Property '" + propName + "' already registered");
      } else {
        design.property[propName] = data;
      }
    },

    registerParameter: function(paramName, data) {
      if (paramName in design.param) {
        throw new Error("Property '" + paramName + "' already registered");
      } else {
        design.param[paramName] = data;
      }
    },

    registerValue: function(valueName, data) {
      if (valueName in design.value) {
        throw new Error("Value '" + valueName + "' already registered");
      } else {
        design.value[valueName] = data;
        design.param.value.values.push(valueName);
      }
    },

    defaultType: 'unknown',

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
          parts[0] = design.value['date-time'].fromICAL(parts[0]);

          if (!ICAL.Duration.isValueString(parts[1])) {
            parts[1] = design.value['date-time'].fromICAL(parts[1]);
          }

          return parts;
        },

        toICAL: function(parts) {
          parts[0] = design.value['date-time'].toICAL(parts[0]);

          if (!ICAL.Duration.isValueString(parts[1])) {
            parts[1] = design.value['date-time'].toICAL(parts[1]);
          }

          return parts.join("/");
        },

        decorate: function(aValue, aProp) {
          return ICAL.Period.fromJSON(aValue, aProp);
        },

        undecorate: function(aValue) {
          return aValue.toJSON();
        }
      },
      recur: {
        fromICAL: function(string) {
          return ICAL.Recur._stringToData(string, true);
        },

        toICAL: function(data) {
          var str = "";
          for (var k in data) {
            var val = data[k]
            if (k == "until") {
              if (val.length > 10) {
                val = design.value['date-time'].toICAL(val);
              } else {
                val = design.value['date'].toICAL(val);
              }
            } else if (k == "wkst") {
              val = ICAL.Recur.numericDayToIcalDay(val);
            } else if (ICAL.helpers.isArray(val)) {
              val = val.join(",");
            }
            str += k.toUpperCase() + "=" + val + ";";
          }
          return str.substr(0, str.length - 1);
        },

        decorate: function decorate(aValue) {
          return ICAL.Recur.fromData(aValue);
        },

        undecorate: function(aRecur) {
          return aRecur.toJSON();
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

      "action": DEFAULT_TYPE_TEXT,
      "attach": { defaultType: "uri" },
      "attendee": { defaultType: "cal-address" },
      "categories": DEFAULT_TYPE_TEXT_MULTI,
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
      "request-status": { defaultType: "text", structuredValue: ";" },
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
      "tzname": DEFAULT_TYPE_TEXT,
      "uid": DEFAULT_TYPE_TEXT,
      "url": DEFAULT_TYPE_URI,
      "version": DEFAULT_TYPE_TEXT
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
