/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

if (typeof(ICAL) === 'undefined')
  (typeof(window) !== 'undefined') ? this.ICAL = {} : ICAL = {};

ICAL.foldLength = 75;
ICAL.newLineChar = '\r\n';

/**
 * Helper functions used in various places within ical.js
 */
ICAL.helpers = {
  initState: function initState(aLine, aLineNr) {
    return {
      buffer: aLine,
      line: aLine,
      lineNr: aLineNr,
      character: 0,
      currentData: null,
      parentData: []
    };
  },

  initComponentData: function initComponentData(aName) {
    return {
      name: aName,
      type: "COMPONENT",
      value: []
    };
  },

  /**
   * Creates or returns a class instance
   * of a given type with the initialization
   * data if the data is not already an instance
   * of the given type.
   *
   *
   * Example:
   *
   *    var time = new ICAL.icaltime(...);
   *    var result = ICAL.helpers.formatClassType(time, ICAL.icaltime);
   *
   *    (result instanceof ICAL.icaltime)
   *    // => true
   *
   *    result = ICAL.helpers.formatClassType({}, ICAL.icaltime);
   *    (result isntanceof ICAL.icaltime)
   *    // => true
   *
   *
   * @param {Object} data object initialization data.
   * @param {Object} type object type (like ICAL.icaltime).
   */
  formatClassType: function formatClassType(data, type) {
    if (typeof(data) === 'undefined')
      return undefined;

    if (data instanceof type) {
      return data;
    }
    return new type(data);
  },

  /**
   * Identical to index of but will only match values
   * when they are not preceded by a backslash char \\\
   *
   * @param {String} buffer string value.
   * @param {String} search value.
   * @param {Numeric} pos start position.
   */
  unescapedIndexOf: function(buffer, search, pos) {
    while ((pos = buffer.indexOf(search, pos)) !== -1) {
      if (pos > 0 && buffer[pos - 1] === '\\') {
        pos += 1;
      } else {
        return pos;
      }
    }
    return -1;
  },

  binsearchInsert: function(list, seekVal, cmpfunc) {
    if (!list.length)
      return 0;

    var low = 0, high = list.length - 1,
        mid, cmpval;

    while (low <= high) {
      mid = low + Math.floor((high - low) / 2);
      cmpval = cmpfunc(seekVal, list[mid]);

      if (cmpval < 0)
        high = mid - 1;
      else if (cmpval > 0)
        low = mid + 1;
      else
        break;
    }

    if (cmpval < 0)
      return mid; // insertion is displacing, so use mid outright.
    else if (cmpval > 0)
      return mid + 1;
    else
      return mid;
  },

  dumpn: function() {
    if (!ICAL.debug) {
      return null;
    }

    if (typeof (console) !== 'undefined' && 'log' in console) {
      ICAL.helpers.dumpn = function consoleDumpn(input) {
        return console.log(input);
      }
    } else {
      ICAL.helpers.dumpn = function geckoDumpn(input) {
        dump(input + '\n');
      }
    }

    return ICAL.helpers.dumpn(arguments[0]);
  },

  mixin: function(obj, data) {
    if (data) {
      for (var k in data) {
        obj[k] = data[k];
      }
    }
    return obj;
  },

  isArray: function(o) {
    return o && (o instanceof Array || typeof o == "array");
  },

  clone: function(aSrc, aDeep) {
    if (!aSrc || typeof aSrc != "object") {
      return aSrc;
    } else if (aSrc instanceof Date) {
      return new Date(aSrc.getTime());
    } else if ("clone" in aSrc) {
      return aSrc.clone();
    } else if (ICAL.helpers.isArray(aSrc)) {
      var result = [];
      for (var i = 0; i < aSrc.length; i++) {
        result.push(aDeep ? ICAL.helpers.clone(aSrc[i], true) : aSrc[i]);
      }
      return result;
    } else {
      var result = {};
      for (var name in aSrc) {
        if (aSrc.hasOwnProperty(name)) {
          this.dumpn("Cloning " + name + "\n");
          if (aDeep) {
            result[name] = ICAL.helpers.clone(aSrc[name], true);
          } else {
            result[name] = aSrc[name];
          }
        }
      }
      return result;
    }
  },

  unfoldline: function unfoldline(aState) {
    // Section 3.1
    // if the line ends with a CRLF
    // and the next line starts with a LINEAR WHITESPACE (space, htab, ...)

    // then remove the CRLF and the whitespace to unsplit the line
    var moreLines = true;
    var line = "";

    while (moreLines) {
      moreLines = false;
      var pos = aState.buffer.search(/\r?\n/);
      if (pos > -1) {
        var len = (aState.buffer[pos] == "\r" ? 2 : 1);
        var nextChar = aState.buffer.substr(pos + len, 1);
        if (nextChar.match(/^[ \t]$/)) {
          moreLines = true;
          line += aState.buffer.substr(0, pos);
          aState.buffer = aState.buffer.substr(pos + len + 1);
        } else {
          // We're at the end of the line, copy the found chunk
          line += aState.buffer.substr(0, pos);
          aState.buffer = aState.buffer.substr(pos + len);
        }
      } else {
        line += aState.buffer;
        aState.buffer = "";
      }
    }
    return line;
  },

  foldline: function foldline(aLine) {
    var result = "";
    var line = aLine || "";

    while (line.length) {
      result += ICAL.newLineChar + " " + line.substr(0, ICAL.foldLength);
      line = line.substr(ICAL.foldLength);
    }
    return result.substr(ICAL.newLineChar.length + 1);
  },

  ensureKeyExists: function(obj, key, defvalue) {
    if (!(key in obj)) {
      obj[key] = defvalue;
    }
  },

  hasKey: function(obj, key) {
    return (obj && key in obj && obj[key]);
  },

  pad2: function pad(data) {
    if (typeof(data) !== 'string') {
      data = String(data);
    }

    var len = data.length;

    switch (len) {
      case 0:
        return '00';
      case 1:
        return '0' + data;
      default:
        return data;
    }
  },

  trunc: function trunc(number) {
    return (number < 0 ? Math.ceil(number) : Math.floor(number));
  }
};
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
ICAL.stringify = (function() {
  'use strict';

  var LINE_ENDING = '\r\n';
  var DEFAULT_TYPE = 'text';

  var design = ICAL.design;
  var helpers = ICAL.helpers;

  /**
   * Convert a full jCal Array into a ical document.
   *
   * @param {Array} jCal document.
   * @return {String} ical document.
   */
  function stringify(jCal) {
    if (!jCal[0] || jCal[0] !== 'icalendar') {
      throw new Error('must provide full jCal document');
    }

    // 1 because we skip the initial element.
    var i = 1;
    var len = jCal.length;
    var result = '';

    for (; i < len; i++) {
      result += stringify.component(jCal[i]) + LINE_ENDING;
    }

    return result;
  }

  /**
   * Converts an jCal component array into a ICAL string.
   * Recursive will resolve sub-components.
   *
   * Exact component/property order is not saved all
   * properties will come before subcomponents.
   *
   * @param {Array} component jCal fragment of a component.
   */
  stringify.component = function(component) {
    var name = component[0].toUpperCase();
    var result = 'BEGIN:' + name + LINE_ENDING;

    var props = component[1];
    var propIdx = 0;
    var propLen = props.length;

    for (; propIdx < propLen; propIdx++) {
      result += stringify.property(props[propIdx]) + LINE_ENDING;
    }

    var comps = component[2];
    var compIdx = 0;
    var compLen = comps.length;

    for (; compIdx < compLen; compIdx++) {
      result += stringify.component(comps[compIdx]) + LINE_ENDING;
    }

    result += 'END:' + name;
    return result;
  }

  /**
   * Converts a single property to a ICAL string.
   *
   * @param {Array} property jCal property.
   */
  stringify.property = function(property) {
    var name = property[0].toUpperCase();
    var jsName = property[0];
    var params = property[1];

    var line = name;

    var paramName;
    for (paramName in params) {
      if (params.hasOwnProperty(paramName)) {
        line += ';' + paramName.toUpperCase();
        line += '=' + stringify.propertyValue(params[paramName]);
      }
    }

    // there is no value so return.
    if (property.length === 3) {
      // if no params where inserted and no value
      // we given we must add a blank value.
      if (!paramName) {
        line += ':';
      }
      return line;
    }

    var valueType = property[2];

    var propDetails;
    var multiValue = false;
    var isDefault = false;

    if (jsName in design.property) {
      propDetails = design.property[jsName];

      if ('multiValue' in propDetails) {
        multiValue = propDetails.multiValue;
      }

      if ('defaultType' in propDetails) {
        if (valueType === propDetails.defaultType) {
          isDefault = true;
        }
      } else {
        if (valueType === DEFAULT_TYPE) {
          isDefault = true;
        }
      }
    } else {
      if (valueType === DEFAULT_TYPE) {
        isDefault = true;
      }
    }

    // push the VALUE property if type is not the default
    // for the current property.
    if (!isDefault) {
      // value will never contain ;/:/, so we don't escape it here.
      line += ';VALUE=' + valueType.toUpperCase();
    }

    line += ':';

    if (multiValue) {
      line += stringify.multiValue(
        property.slice(3), multiValue, valueType
      );
    } else {
      line += stringify.value(property[3], valueType);
    }

    return ICAL.helpers.foldline(line);
  }

  /**
   * Handles escaping of property values that may contain:
   *
   *    COLON (:), SEMICOLON (;), or COMMA (,)
   *
   * If any of the above are present the result is wrapped
   * in double quotes.
   *
   * @param {String} value raw value.
   * @return {String} given or escaped value when needed.
   */
  stringify.propertyValue = function(value) {

    if ((helpers.unescapedIndexOf(value, ',') === -1) &&
        (helpers.unescapedIndexOf(value, ':') === -1) &&
        (helpers.unescapedIndexOf(value, ';') === -1)) {

      return value;
    }

    return '"' + value + '"';
  }

  /**
   * Converts an array of ical values into a single
   * string based on a type and a delimiter value (like ",").
   *
   * @param {Array} values list of values to convert.
   * @param {String} delim used to join the values usually (",", ";", ":").
   * @param {String} type lowecase ical value type
   *  (like boolean, date-time, etc..).
   *
   * @return {String} ical string for value.
   */
  stringify.multiValue = function(values, delim, type) {
    var result = '';
    var len = values.length;
    var i = 0;

    for (; i < len; i++) {
      result += stringify.value(values[i], type);
      if (i !== (len - 1)) {
        result += delim;
      }
    }

    return result;
  }

  /**
   * Processes a single ical value runs the associated "toICAL"
   * method from the design value type if available to convert
   * the value.
   *
   * @param {String|Numeric} value some formatted value.
   * @param {String} type lowecase ical value type
   *  (like boolean, date-time, etc..).
   * @return {String} ical value for single value.
   */
  stringify.value = function(value, type) {
    if (type in design.value && 'toICAL' in design.value[type]) {
      return design.value[type].toICAL(value);
    }
    return value;
  }

  return stringify;

}());

ICAL.parse = (function() {
  'use strict';

  var CHAR = /[^ \t]/;
  var MULTIVALUE_DELIMITER = ',';
  var VALUE_DELIMITER = ':';
  var PARAM_DELIMITER = ';';
  var PARAM_NAME_DELIMITER = '=';
  var DEFAULT_TYPE = 'text';

  var design = ICAL.design;
  var helpers = ICAL.helpers;

  function ParserError(message) {
    Error.apply(this, arguments);
  }

  ParserError.prototype = {
    __proto__: Error.prototype
  };

  function parser(input) {
    var state = {};
    var root = state.component = [
      'icalendar'
    ];

    state.stack = [root];

    parser._eachLine(input, function(err, line) {
      parser._handleContentLine(line, state);
    });


    // when there are still items on the stack
    // throw a fatal error, a component was not closed
    // correctly in that case.
    if (state.stack.length > 1) {
      throw new ParserError(
        'invalid ical body, a began started but did not end'
      );
    }

    state = null;

    return root;
  }

  // classes & constants
  parser.ParserError = ParserError;

  parser._formatName = function(name) {
    return name.toLowerCase();
  }

  parser._handleContentLine = function(line, state) {
    // break up the parts of the line
    var valuePos = line.indexOf(VALUE_DELIMITER);
    var paramPos = line.indexOf(PARAM_DELIMITER);

    var nextPos = 0;
    // name of property or begin/end
    var name;
    var value;
    var params;

    /**
     * Different property cases
     *
     *
     * 1. RRULE:FREQ=foo
     *    // FREQ= is not a param but the value
     *
     * 2. ATTENDEE;ROLE=REQ-PARTICIPANT;
     *    // ROLE= is a param because : has not happened yet
     */

    if ((paramPos !== -1 && valuePos !== -1)) {
      // when the parameter delimiter is after the
      // value delimiter then its not a parameter.
      if (paramPos > valuePos) {
        paramPos = -1;
      }
    }

    if (paramPos !== -1) {
      // when there are parameters (ATTENDEE;RSVP=TRUE;)
      name = parser._formatName(line.substr(0, paramPos));
      params = parser._parseParameters(line, paramPos);
      if (valuePos !== -1) {
        value = line.substr(valuePos + 1);
      }
    } else if (valuePos !== -1) {
      // without parmeters (BEGIN:VCAENDAR, CLASS:PUBLIC)
      name = parser._formatName(line.substr(0, valuePos));
      value = line.substr(valuePos + 1);

      if (name === 'begin') {
        var newComponent = [parser._formatName(value), [], []];
        if (state.stack.length === 1) {
          state.component.push(newComponent);
        } else {
          state.component[2].push(newComponent);
        }
        state.stack.push(state.component);
        state.component = newComponent;
        return;
      }

      if (name === 'end') {
        state.component = state.stack.pop();
        return;
      }
    } else {
      /**
       * Invalid line.
       * The rational to throw an error is we will
       * never be certain that the rest of the file
       * is sane and its unlikely that we can serialize
       * the result correctly either.
       */
      throw new ParserError(
        'invalid line (no token ";" or ":") "' + line + '"'
      );
    }

    var valueType;
    var multiValue = false;
    var propertyDetails;

    if (name in design.property) {
      propertyDetails = design.property[name];

      if ('multiValue' in propertyDetails) {
        multiValue = propertyDetails.multiValue;
      }
    }

    // at this point params is mandatory per jcal spec
    params = params || {};

    // attempt to determine value
    if (!('value' in params)) {
      if (propertyDetails) {
        valueType = propertyDetails.defaultType;
      } else {
        valueType = DEFAULT_TYPE;
      }
    } else {
      // possible to avoid this?
      valueType = params.value.toLowerCase();
      delete params.value;
    }

    /**
     * Note on `var result` juggling:
     *
     * I observed that building the array in pieces has adverse
     * effects on performance, so where possible we inline the creation.
     * Its a little ugly but resulted in ~2000 additional ops/sec.
     */

    if (value) {
      if (multiValue) {
        var result = [name, params, valueType];
        parser._parseMultiValue(value, multiValue, valueType, result);
      } else {
        value = parser._parseValue(value, valueType);
        var result = [name, params, valueType, value];
      }
    } else {
      var result = [name, params, valueType];
    }

    state.component[1].push(result);
  };

  /**
   * @param {String} value original value.
   * @param {String} type type of value.
   * @return {Object} varies on type.
   */
  parser._parseValue = function(value, type) {
    if (type in design.value && 'fromICAL' in design.value[type]) {
      return design.value[type].fromICAL(value);
    }
    return value;
  };

  /**
   * Parse parameters from a string to object.
   *
   * @param {String} line a single unfolded line.
   * @param {Numeric} start position to start looking for properties.
   * @param {Numeric} maxPos position at which values start.
   * @return {Object} key/value pairs.
   */
  parser._parseParameters = function(line, start) {
    var lastParam = start;
    var pos = 0;
    var delim = PARAM_NAME_DELIMITER;
    var result = {};

    // find the next '=' sign
    // use lastParam and pos to find name
    // check if " is used if so get value from "->"
    // then increment pos to find next ;

    while ((pos !== false) &&
           (pos = helpers.unescapedIndexOf(line, delim, pos + 1)) !== -1) {

      var name = line.substr(lastParam + 1, pos - lastParam - 1);

      var nextChar = line[pos + 1];
      var substrOffset = -2;

      if (nextChar === '"') {
        var valuePos = pos + 2;
        pos = helpers.unescapedIndexOf(line, '"', valuePos);
        var value = line.substr(valuePos, pos - valuePos);
        lastParam = helpers.unescapedIndexOf(line, PARAM_DELIMITER, pos);
      } else {
        var valuePos = pos + 1;
        substrOffset = -1;

        // move to next ";"
        var nextPos = helpers.unescapedIndexOf(line, PARAM_DELIMITER, valuePos);

        if (nextPos === -1) {
          // when there is no ";" attempt to locate ":"
          nextPos = helpers.unescapedIndexOf(line, VALUE_DELIMITER, valuePos);
          // no more tokens end of the line use .length
          if (nextPos === -1) {
            nextPos = line.length;
            // because we are at the end we don't need to trim
            // the found value of substr offset is zero
            substrOffset = 0;
          } else {
            // next token is the beginning of the value
            // so we must stop looking for the '=' token.
            pos = false;
          }
        } else {
          lastParam = nextPos;
        }

        var value = line.substr(valuePos, nextPos - valuePos);
      }

      var type = DEFAULT_TYPE;

      if (name in design.param && design.param[name].valueType) {
        type = design.param[name].valueType;
      }

      result[parser._formatName(name)] = parser._parseValue(value, type);
    }

    return result;
  }

  /**
   * Parse a multi value string
   */
  parser._parseMultiValue = function(buffer, delim, type, result) {
    var pos = 0;
    var lastPos = 0;

    // split each piece
    while ((pos = helpers.unescapedIndexOf(buffer, delim, lastPos)) !== -1) {
      var value = buffer.substr(lastPos, pos - lastPos);
      result.push(parser._parseValue(value, type));
      lastPos = pos + 1;
    }

    // on the last piece take the rest of string
    result.push(
      parser._parseValue(buffer.substr(lastPos), type)
    );

    return result;
  }

  parser._eachLine = function(buffer, callback) {
    var len = buffer.length;
    var lastPos = buffer.search(CHAR);
    var pos = lastPos;
    var line;
    var firstChar;

    var newlineOffset;

    do {
      pos = buffer.indexOf('\n', lastPos) + 1;

      if (buffer[pos - 2] === '\r') {
        newlineOffset = 2;
      } else {
        newlineOffset = 1;
      }

      if (pos === 0) {
        pos = len;
        newlineOffset = 0;
      }

      firstChar = buffer[lastPos];

      if (firstChar === ' ' || firstChar === '\t') {
        // add to line
        line += buffer.substr(
          lastPos + 1,
          pos - lastPos - (newlineOffset + 1)
        );
      } else {
        if (line)
          callback(null, line);
        // push line
        line = buffer.substr(
          lastPos,
          pos - lastPos - newlineOffset
        );
      }

      lastPos = pos;
    } while (pos !== len);

    // extra ending line
    line = line.trim();

    if (line.length)
      callback(null, line);
  }

  return parser;

}());
/* This Source Code Form is subject to the terms of the Mozilla Public
          console.log()
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

(typeof(ICAL) === 'undefined')? ICAL = {} : '';
(function() {

  /**
   * home of the original parser, we have re-purposed most
   * of the decoration parsing here in the icaltype classes (like period).
   * Eventually we need to to through each of these and make sure
   * they are as efficient as possible. Most of these are very complete
   * and validate input but are slow due to their heavy use of RegExp.
   */

  function ParserError(aState, aMessage) {
    this.mState = aState;
    this.name = "ParserError";
    if (aState) {
      var lineNrData = ("lineNr" in aState ? aState.lineNr + ":" : "") +
                       ("character" in aState && !isNaN(aState.character) ?
                         aState.character + ":" :
                         "");

      var message = lineNrData + aMessage;
      if ("buffer" in aState) {
        if (aState.buffer) {
          message += " before '" + aState.buffer + "'";
        } else {
          message += " at end of line";
        }
      }
      if ("line" in aState) {
        message += " in '" + aState.line + "'";
      }
      this.message = message;
    } else {
      this.message = aMessage;
    }

    // create stack
    try {
      throw new Error();
    } catch (e) {
      var split = e.stack.split('\n');
      split.shift();
      this.stack = split.join('\n');
    }
  }

  ParserError.prototype = {
    __proto__: Error.prototype,
    constructor: ParserError
  };

  var parser = {
    Error: ParserError
  };

  ICAL.DecorationParser = parser;

  parser.validateValue = function validateValue(aLineData, aValueType,
                                                aValue, aCheckParams) {
    var propertyData = ICAL.design.property[aLineData.name];
    var valueData = ICAL.design.value[aValueType];

    // TODO either make validators just consume the value, then check for end
    // here (possibly requires returning remainder or renaming buffer<->value
    // in the states) validators don't really need the whole linedata

    if (!aValue.match) {
      ICAL.helpers.dumpn("MAAA: " + aValue + " ? " + aValue.toString());
    }

    if (valueData.matches) {
      // Test against regex
      if (!aValue.match(valueData.matches)) {
        throw new ParserError(aLineData, "Value '" + aValue + "' for " +
                              aLineData.name + " is not " + aValueType);
      }
    } else if ("validate" in valueData) {
      // Validator throws an error itself if needed
      var objData = valueData.validate(aValue);

      // Merge in extra value data, if it exists
      ICAL.helpers.mixin(aLineData, objData);
    } else if ("values" in valueData) {
      // Fixed list of values
      if (valueData.values.indexOf(aValue) < 0) {
        throw new ParserError(aLineData, "Value for " + aLineData.name +
                              " is not a " + aValueType);
      }
    }

    if (aCheckParams && "requireParam" in valueData) {
      var reqParam = valueData.requireParam;
      for (var param in reqParam) {
        if (!("parameters" in aLineData) ||
            !(param in aLineData.parameters) ||
            aLineData.parameters[param] != reqParam[param]) {

          throw new ParserError(aLineData, "Value requires " + param + "=" +
                                valueData.requireParam[param]);
        }
      }
    }

    return aLineData;
  };

  parser.parseValue = function parseValue(aStr, aType) {
    var lineData = {
      value: [aStr]
    };
    return parser.validateValue(lineData, aType, aStr, false);
  };

  parser.parseDateOrDateTime = function parseDateOrDateTime(aState) {
    var data = parser.parseDate(aState);

    if (parser.expectOptionalRE(aState, /^T/)) {
      // This has a time component, parse it
      var time = parser.parseTime(aState);

      if (parser.expectOptionalRE(aState, /^Z/)) {
        data.timezone = "Z";
      }
      ICAL.helpers.mixin(data, time);
    }
    return data;
  };

  parser.parseDateTime = function parseDateTime(aState) {
    var data = parser.parseDate(aState);
    parser.expectRE(aState, /^T/, "Expected 'T'");

    var time = parser.parseTime(aState);

    if (parser.expectOptionalRE(aState, /^Z/)) {
      data.timezone = "Z";
    }

    ICAL.helpers.mixin(data, time);
    return data;
  };

  parser.parseDate = function parseDate(aState) {
    var dateRE = /^((\d{4})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01]))/;
    var match = parser.expectRE(aState, dateRE, "Expected YYYYMMDD Date");
    return {
      year: parseInt(match[2], 10),
      month: parseInt(match[3], 10),
      day: parseInt(match[4], 10)
    };
    // TODO timezone?
  };

  parser.parseTime = function parseTime(aState) {
    var timeRE = /^(([01][0-9]|2[0-3])([0-5][0-9])([0-5][0-9]|60))/;
    var match = parser.expectRE(aState, timeRE, "Expected HHMMSS Time");
    return {
      hour: parseInt(match[2], 10),
      minute: parseInt(match[3], 10),
      second: parseInt(match[4], 10)
    };
  };

  parser.parseDuration = function parseDuration(aState) {
    var error = "Expected Duration Value";

    function parseDurSecond(aState) {
      var secMatch = parser.expectRE(aState, /^((\d+)S)/, "Expected Seconds");
      return {
        seconds: parseInt(secMatch[2], 10)
      };
    }

    function parseDurMinute(aState) {
      var data = {};
      var minutes = parser.expectRE(aState, /^((\d+)M)/, "Expected Minutes");
      try {
        data = parseDurSecond(aState);
      } catch (e) {
        // seconds are optional, its ok
        if (!(e instanceof ParserError)) {
          throw e;
        }
      }
      data.minutes = parseInt(minutes[2], 10);
      return data;
    }

    function parseDurHour(aState) {
      var data = {};
      var hours = parser.expectRE(aState, /^((\d+)H)/, "Expected Hours");
      try {
        data = parseDurMinute(aState);
      } catch (e) {
        // seconds are optional, its ok
        if (!(e instanceof ParserError)) {
          throw e;
        }
      }

      data.hours = parseInt(hours[2], 10);
      return data;
    }

    function parseDurWeek(aState) {
      return {
        weeks: parseInt(parser.expectRE(aState, /^((\d+)W)/, "Expected Weeks")[2], 10)
      };
    }

    function parseDurTime(aState) {
      parser.expectRE(aState, /^T/, "Expected Time Value");
      return parser.parseAlternative(aState, parseDurHour,
                                     parseDurMinute, parseDurSecond);
    }

    function parseDurDate(aState) {
      var days = parser.expectRE(aState, /^((\d+)D)/, "Expected Days");
      var data;

      try {
        data = parseDurTime(aState);
      } catch (e) {
        // Its ok if this fails
        if (!(e instanceof ParserError)) {
          throw e;
        }
      }

      if (data) {
        data.days = parseInt(days[2], 10);
      } else {
        data = {
          days: parseInt(days[2], 10)
        };
      }
      return data;
    }

    var factor = parser.expectRE(aState, /^([+-]?P)/, error);

    var durData = parser.parseAlternative(aState, parseDurDate,
                                          parseDurTime, parseDurWeek);
    parser.expectEnd(aState, "Junk at end of DURATION value");

    durData.factor = (factor[1] == "-P" ? -1 : 1);
    return durData;
  };

  parser.parsePeriod = function parsePeriod(aState) {
    var dtime = parser.parseDateTime(aState);
    parser.expectRE(aState, /\//, "Expected '/'");

    var dtdur = parser.parseAlternative(aState, parser.parseDateTime,
                                        parser.parseDuration);
    var data = {
      start: dtime
    };
    if ("factor" in dtdur) {
      data.duration = dtdur;
    } else {
      data.end = dtdur;
    }
    return data;
  },

  parser.parseRecur = function parseRecur(aState) {
    // TODO this function is quite cludgy, maybe it should be done differently
    function parseFreq(aState) {
      parser.expectRE(aState, /^FREQ=/, "Expected Frequency");
      var ruleRE = /^(SECONDLY|MINUTELY|HOURLY|DAILY|WEEKLY|MONTHLY|YEARLY)/;
      var match = parser.expectRE(aState, ruleRE, "Exepected Frequency Value");
      return {
        "FREQ": match[1]
      };
    }

    function parseUntil(aState) {
      parser.expectRE(aState, /^UNTIL=/, "Expected Frequency");
      var untilDate = parser.parseDateOrDateTime(aState);
      return {
        "UNTIL": untilDate
      };
    }

    function parseCount(aState) {
      parser.expectRE(aState, /^COUNT=/, "Expected Count");
      var match = parser.expectRE(aState, /^(\d+)/, "Expected Digit(s)");
      return {
        "COUNT": parseInt(match[1], 10)
      };
    }

    function parseInterval(aState) {
      parser.expectRE(aState, /^INTERVAL=/, "Expected Interval");
      var match = parser.expectRE(aState, /^(\d+)/, "Expected Digit(s)");
      return {
        "INTERVAL": parseInt(match[1], 10)
      };
    }

    function parseBySecond(aState) {
      function parseSecond(aState) {
        var secondRE = /^(60|[1-5][0-9]|[0-9])/;
        var value = parser.expectRE(aState, secondRE, "Expected Second")[1];
        return parseInt(value, 10);
      }
      parser.expectRE(aState, /^BYSECOND=/, "Expected BYSECOND");
      var seconds = parser.parseList(aState, parseSecond, ",");
      return {
        "BYSECOND": seconds
      };
    }

    function parseByMinute(aState) {
      function parseMinute(aState) {
        var minuteRE = /^([1-5][0-9]|[0-9])/;
        var value = parser.expectRE(aState, minuteRE, "Expected Minute")[1];
        return parseInt(value, 10);
      }
      parser.expectRE(aState, /^BYMINUTE=/, "Expected BYMINUTE");
      var minutes = parser.parseList(aState, parseMinute, ",");
      return {
        "BYMINUTE": minutes
      };
    }

    function parseByHour(aState) {
      function parseHour(aState) {
        var hourRE = /^(2[0-3]|1[0-9]|[0-9])/;
        var value = parser.expectRE(aState, hourRE, "Expected Hour")[1];
        return parseInt(value, 10);
      }
      parser.expectRE(aState, /^BYHOUR=/, "Expected BYHOUR");
      var hours = parser.parseList(aState, parseHour, ",");
      return {
        "BYHOUR": hours
      };
    }

    function parseByDay(aState) {
      function parseWkDayNum(aState) {
        var value = "";
        var match = parser.expectOptionalRE(aState, /^([+-])/);
        if (match) {
          value += match[1];
        }

        match = parser.expectOptionalRE(aState, /^(5[0-3]|[1-4][0-9]|[1-9])/);
        if (match) {
          value += match[1];
        }

        var wkDayRE = /^(SU|MO|TU|WE|TH|FR|SA)/;
        match = parser.expectRE(aState, wkDayRE, "Expected Week Ordinals");
        value += match[1];
        return value;
      }
      parser.expectRE(aState, /^BYDAY=/, "Expected BYDAY Rule");
      var wkdays = parser.parseList(aState, parseWkDayNum, ",");
      return {
        "BYDAY": wkdays
      };
    }

    function parseByMonthDay(aState) {
      function parseMoDayNum(aState) {
        var value = "";
        var match = parser.expectOptionalRE(aState, /^([+-])/);
        if (match) {
          value += match[1];
        }

        match = parser.expectRE(aState, /^(3[01]|[12][0-9]|[1-9])/);
        value += match[1];
        return parseInt(value, 10);
      }
      parser.expectRE(aState, /^BYMONTHDAY=/, "Expected BYMONTHDAY Rule");
      var modays = parser.parseList(aState, parseMoDayNum, ",");
      return {
        "BYMONTHDAY": modays
      };
    }

    function parseByYearDay(aState) {
      function parseYearDayNum(aState) {
        var value = "";
        var match = parser.expectOptionalRE(aState, /^([+-])/);
        if (match) {
          value += match[1];
        }

        var yrDayRE = /^(36[0-6]|3[0-5][0-9]|[12][0-9][0-9]|[1-9][0-9]|[1-9])/;
        match = parser.expectRE(aState, yrDayRE);
        value += match[1];
        return parseInt(value, 10);
      }
      parser.expectRE(aState, /^BYYEARDAY=/, "Expected BYYEARDAY Rule");
      var yrdays = parser.parseList(aState, parseYearDayNum, ",");
      return {
        "BYYEARDAY": yrdays
      };
    }

    function parseByWeekNo(aState) {
      function parseWeekNum(aState) {
        var value = "";
        var match = parser.expectOptionalRE(aState, /^([+-])/);
        if (match) {
          value += match[1];
        }

        match = parser.expectRE(aState, /^(5[0-3]|[1-4][0-9]|[1-9])/);
        value += match[1];
        return parseInt(value, 10);
      }
      parser.expectRE(aState, /^BYWEEKNO=/, "Expected BYWEEKNO Rule");
      var weeknos = parser.parseList(aState, parseWeekNum, ",");
      return {
        "BYWEEKNO": weeknos
      };
    }

    function parseByMonth(aState) {
      function parseMonthNum(aState) {
        var moNumRE = /^(1[012]|[1-9])/;
        var match = parser.expectRE(aState, moNumRE, "Expected Month number");
        return parseInt(match[1], 10);
      }
      parser.expectRE(aState, /^BYMONTH=/, "Expected BYMONTH Rule");
      var monums = parser.parseList(aState, parseMonthNum, ",");
      return {
        "BYMONTH": monums
      };
    }

    function parseBySetPos(aState) {
      function parseSpList(aState) {
        var spRE = /^(36[0-6]|3[0-5][0-9]|[12][0-9][0-9]|[1-9][0-9]|[1-9])/;
        var value = parser.expectRE(aState, spRE)[1];

        return parseInt(value, 10);
      }
      parser.expectRE(aState, /^BYSETPOS=/, "Expected BYSETPOS Rule");
      var spnums = parser.parseList(aState, parseSpList, ",");
      return {
        "BYSETPOS": spnums
      };
    }

    function parseWkst(aState) {
      parser.expectRE(aState, /^WKST=/, "Expected WKST");
      var wkstRE = /^(SU|MO|TU|WE|TH|FR|SA)/;
      var match = parser.expectRE(aState, wkstRE, "Expected Weekday Name");
      return {
        "WKST": match[1]
      };
    }

    function parseRulePart(aState) {
      return parser.parseAlternative(aState,
      parseFreq, parseUntil, parseCount, parseInterval,
      parseBySecond, parseByMinute, parseByHour, parseByDay,
      parseByMonthDay, parseByYearDay, parseByWeekNo,
      parseByMonth, parseBySetPos, parseWkst);
    }

    // One or more rule parts
    var value = parser.parseList(aState, parseRulePart, ";");
    var data = {};
    for (var key in value) {
      ICAL.helpers.mixin(data, value[key]);
    }

    // Make sure there's no junk at the end
    parser.expectEnd(aState, "Junk at end of RECUR value");
    return data;
  };

  parser.parseUtcOffset = function parseUtcOffset(aState) {
    var utcRE = /^(([+-])([01][0-9]|2[0-3])([0-5][0-9])([0-5][0-9])?)$/;
    var match = parser.expectRE(aState, utcRE, "Expected valid utc offset");
    return {
      factor: (match[2] == "-" ? -1 : 1),
      hours: parseInt(match[3], 10),
      minutes: parseInt(match[4], 10)
    };
  };

  parser.parseAlternative = function parseAlternative(aState /*, parserFunc, ... */) {
    var tokens = null;
    var args = Array.prototype.slice.call(arguments);
    var parser;
    args.shift();
    var errors = [];

    while (!tokens && (parser = args.shift())) {
      try {
        tokens = parser(aState);
      } catch (e) {
        if (e instanceof ParserError) {
          errors.push(e);
          tokens = null;
        } else {
          throw e;
        }
      }
    }

    if (!tokens) {
      var message = errors.join("\nOR ") || "No Tokens found";
      throw new ParserError(aState, message);
    }

    return tokens;
  },

  parser.parseList = function parseList(aState, aElementFunc, aSeparator) {
    var listvals = [];

    listvals.push(aElementFunc(aState));
    var re = new RegExp("^" + aSeparator + "");
    while (parser.expectOptionalRE(aState, re)) {
      listvals.push(aElementFunc(aState));
    }
    return listvals;
  };

  parser.expectOptionalRE = function expectOptionalRE(aState, aRegex) {
    var match = aState.buffer.match(aRegex);
    if (match) {
      var count = ("1" in match ? match[1].length : match[0].length);
      aState.buffer = aState.buffer.substr(count);
      aState.character += count;
    }
    return match;
  };

  parser.expectRE = function expectRE(aState, aRegex, aErrorMessage) {
    var match = parser.expectOptionalRE(aState, aRegex);
    if (!match) {
      throw new ParserError(aState, aErrorMessage);
    }
    return match;
  };

  parser.expectEnd = function expectEnd(aState, aErrorMessage) {
    if (aState.buffer.length > 0) {
      throw new ParserError(aState, aErrorMessage);
    }
  }
})();
ICAL.Component = (function() {
  'use strict';

  var PROPERTY_INDEX = 1;
  var COMPONENT_INDEX = 2;
  var NAME_INDEX = 0;

  /**
   * Create a wrapper for a jCal component.
   *
   * @param {Array|String} jCal
   *  raw jCal component data OR name of new component.
   * @param {ICAL.Component} parent parent component to associate.
   */
  function Component(jCal, parent) {
    if (typeof(jCal) === 'string') {
      // jCal spec (name, properties, components)
      jCal = [jCal, [], []];
    }

    // mostly for legacy reasons.
    this.jCal = jCal;

    if (parent) {
      this.parent = parent;
    }
  }

  Component.prototype = {

    get name() {
      return this.jCal[NAME_INDEX];
    },

    _hydrateComponent: function(index) {
      if (!this._components) {
        this._components = [];
      }

      if (this._components[index]) {
        return this._components[index];
      }

      var comp = new Component(
        this.jCal[COMPONENT_INDEX][index],
        this
      );

      return this._components[index] = comp;
    },

    _hydrateProperty: function(index) {
      if (!this._properties) {
        this._properties = [];
      }

      if (this._properties[index]) {
        return this._properties[index];
      }

      var prop = new ICAL.Property(
        this.jCal[PROPERTY_INDEX][index],
        this
      );

      return this._properties[index] = prop;
    },

    /**
     * Finds first sub component, optionally filtered by name.
     *
     * @method getFirstSubcomponent
     * @param {String} [name] optional name to filter by.
     */
    getFirstSubcomponent: function(name) {
      if (name) {
        var i = 0;
        var comps = this.jCal[COMPONENT_INDEX];
        var len = comps.length;

        for (; i < len; i++) {
          if (comps[i][NAME_INDEX] === name) {
            var result = this._hydrateComponent(i);
            return result;
          }
        }
      } else {
        if (this.jCal[COMPONENT_INDEX].length) {
          return this._hydrateComponent(0);
        }
      }

      // ensure we return a value (strict mode)
      return null;
    },

    /**
     * Finds all sub components, optionally filtering by name.
     *
     * @method getAllSubcomponents
     * @param {String} [name] optional name to filter by.
     */
    getAllSubcomponents: function(name) {
      var jCalLen = this.jCal[COMPONENT_INDEX].length;

      if (name) {
        var comps = this.jCal[COMPONENT_INDEX];
        var result = [];
        var i = 0;

        for (; i < jCalLen; i++) {
          if (name === comps[i][NAME_INDEX]) {
            result.push(
              this._hydrateComponent(i)
            );
          }
        }
        return result;
      } else {
        if (!this._components ||
            (this._components.length !== jCalLen)) {
          var i = 0;
          for (; i < jCalLen; i++) {
            this._hydrateComponent(i);
          }
        }

        return this._components;
      }
    },

    /**
     * Returns true when a named property exists.
     *
     * @param {String} name property name.
     * @return {Boolean} true when property is found.
     */
    hasProperty: function(name) {
      var props = this.jCal[PROPERTY_INDEX];
      var len = props.length;

      var i = 0;
      for (; i < len; i++) {
        // 0 is property name
        if (props[i][NAME_INDEX] === name) {
          return true;
        }
      }

      return false;
    },

    /**
     * Finds first property.
     *
     * @param {String} [name] lowercase name of property.
     * @return {ICAL.Property} found property.
     */
    getFirstProperty: function(name) {
      if (name) {
        var i = 0;
        var props = this.jCal[PROPERTY_INDEX];
        var len = props.length;

        for (; i < len; i++) {
          if (props[i][NAME_INDEX] === name) {
            var result = this._hydrateProperty(i);
            return result;
          }
        }
      } else {
        if (this.jCal[PROPERTY_INDEX].length) {
          return this._hydrateProperty(0);
        }
      }

      return null;
    },

    /**
     * Returns first properties value if available.
     *
     * @param {String} [name] (lowecase) property name.
     * @return {String} property value.
     */
    getFirstPropertyValue: function(name) {
      var prop = this.getFirstProperty(name);
      if (prop) {
        return prop.getFirstValue();
      }

      return null;
    },

    /**
     * get all properties in the component.
     *
     * @param {String} [name] (lowercase) property name.
     * @return {Array[ICAL.Property]} list of properties.
     */
    getAllProperties: function(name) {
      var jCalLen = this.jCal[PROPERTY_INDEX].length;

      if (name) {
        var props = this.jCal[PROPERTY_INDEX];
        var result = [];
        var i = 0;

        for (; i < jCalLen; i++) {
          if (name === props[i][NAME_INDEX]) {
            result.push(
              this._hydrateProperty(i)
            );
          }
        }
        return result;
      } else {
        if (!this._properties ||
            (this._properties.length !== jCalLen)) {
          var i = 0;
          for (; i < jCalLen; i++) {
            this._hydrateProperty(i);
          }
        }

        return this._properties;
      }

      return null;
    },

    _removeObjectByIndex: function(jCalIndex, cache, index) {
      // remove cached version
      if (cache && cache[index]) {
        cache.splice(index, 1);
      }

      // remove it from the jCal
      this.jCal[jCalIndex].splice(index, 1);
    },

    _removeObject: function(jCalIndex, cache, nameOrObject) {
      var i = 0;
      var objects = this.jCal[jCalIndex];
      var len = objects.length;
      var cached = this[cache];

      if (typeof(nameOrObject) === 'string') {
        for (; i < len; i++) {
          if (objects[i][NAME_INDEX] === nameOrObject) {
            this._removeObjectByIndex(jCalIndex, cached, i);
            return true;
          }
        }
      } else if (cached) {
        for (; i < len; i++) {
          if (cached[i] && cached[i] === nameOrObject) {
            this._removeObjectByIndex(jCalIndex, cached, i);
            return true;
          }
        }
      }

      return false;
    },

    _removeAllObjects: function(jCalIndex, cache, name) {
      var cached = this[cache];

      if (name) {
        var objects = this.jCal[jCalIndex];
        var i = objects.length - 1;

        // descending search required because splice
        // is used and will effect the indices.
        for (; i >= 0; i--) {
          if (objects[i][NAME_INDEX] === name) {
            this._removeObjectByIndex(jCalIndex, cached, i);
          }
        }
      } else {
        if (cache in this) {
          // I think its probable that when we remove all
          // of a type we may want to add to it again so it
          // makes sense to reuse the object in that case.
          // For now we remove the contents of the array.
          this[cache].length = 0;
        }
        this.jCal[jCalIndex].length = 0;
      }
    },

    /**
     * Adds a single sub component.
     *
     * @param {ICAL.Component} component to add.
     */
    addSubcomponent: function(component) {
      if (!this._components) {
        this._components = [];
      }

      var idx = this.jCal[COMPONENT_INDEX].push(component.jCal);
      this._components[idx - 1] = component;
    },

    /**
     * Removes a single component by name or
     * the instance of a specific component.
     *
     * @param {ICAL.Component|String} nameOrComp comp type.
     * @return {Boolean} true when comp is removed.
     */
    removeSubcomponent: function(nameOrComp) {
      return this._removeObject(COMPONENT_INDEX, '_components', nameOrComp);
    },

    /**
     * Removes all components or (if given) all
     * components by a particular name.
     *
     * @param {String} [name] (lowercase) component name.
     */
    removeAllSubcomponents: function(name) {
      return this._removeAllObjects(COMPONENT_INDEX, '_components', name);
    },

    /**
     * Adds a property to the component.
     *
     * @param {ICAL.Property} property object.
     */
    addProperty: function(property) {
      if (!(property instanceof ICAL.Property)) {
        throw new TypeError('must instance of ICAL.Property');
      }

      var idx = this.jCal[PROPERTY_INDEX].push(property.jCal);
      property.component = this;

      if (!this._properties) {
        this._properties = [];
      }

      this._properties[idx - 1] = property;
    },

    /**
     * Helper method to add a property with a value to the component.
     *
     * @param {String} name property name to add.
     * @param {Object} value property value.
     */
    addPropertyWithValue: function(name, value) {
      var prop = new ICAL.Property(name, this);
      prop.setValue(value);

      this.addProperty(prop, this);

      return prop;
    },

    /**
     * Helper method that will update or create a property
     * of the given name and sets its value.
     *
     * @param {String} name property name.
     * @param {Object} value property value.
     * @return {ICAL.Property} property.
     */
    updatePropertyWithValue: function(name, value) {
      var prop = this.getFirstProperty(name);

      if (prop) {
        prop.setValue(value);
      } else {
        prop = this.addPropertyWithValue(name, value);
      }

      return prop;
    },

    /**
     * Removes a single property by name or
     * the instance of the specific property.
     *
     * @param {String|ICAL.Property} nameOrProp to remove.
     * @return {Boolean} true when deleted.
     */
    removeProperty: function(nameOrProp) {
      return this._removeObject(PROPERTY_INDEX, '_properties', nameOrProp);
    },

    /**
     * Removes all properties associated with this component.
     *
     * @param {String} [name] (lowecase) optional property name.
     */
    removeAllProperties: function(name) {
      return this._removeAllObjects(PROPERTY_INDEX, '_properties', name);
    },

    toJSON: function() {
      return this.jCal;
    },

    toString: function() {
      return ICAL.stringify.component(
        this.jCal
      );
    }

  };

  return Component;

}());
ICAL.Property = (function() {
  'use strict';

  var NAME_INDEX = 0;
  var PROP_INDEX = 1;
  var TYPE_INDEX = 2;
  var VALUE_INDEX = 3;

  var design = ICAL.design;

  /**
   * Provides a nicer interface to any kind of property.
   * Its important to note that mutations done in the wrapper
   * directly effect (mutate) the jCal object used to initialize.
   *
   * Can also be used to create new properties by passing
   * the name of the property (as a String).
   *
   *
   * @param {Array|String} jCal raw jCal representation OR
   *  the new name of the property (when creating).
   *
   * @param {ICAL.Component} [component] parent component.
   */
  function Property(jCal, component) {
    if (typeof(jCal) === 'string') {
      // because we a creating by name we need
      // to find the type when creating the property.
      var name = jCal;

      if (name in design.property) {
        var prop = design.property[name];
        if ('defaultType' in prop) {
          var type = prop.defaultType;
        } else {
          var type = design.defaultType;
        }
      } else {
        var type = design.defaultType;
      }

      jCal = [name, {}, type];
    }

    this.jCal = jCal;
    this.component = component;
    this._updateType();
  }

  Property.prototype = {
    get type() {
      return this.jCal[TYPE_INDEX];
    },

    get name() {
      return this.jCal[NAME_INDEX];
    },

    _updateType: function() {
      if (this.type in design.value) {
        var designType = design.value[this.type];

        if ('decorate' in design.value[this.type]) {
          this.isDecorated = true;
        } else {
          this.isDecorated = false;
        }

        if (this.name in design.property) {
          if ('multiValue' in design.property[this.name]) {
            this.isMultiValue = true;
          } else {
            this.isMultiValue = false;
          }
        }
      }
    },

    /**
     * Hydrate a single value.
     */
    _hydrateValue: function(index) {
      if (this._values && this._values[index]) {
        return this._values[index];
      }

      // for the case where there is no value.
      if (this.jCal.length <= (VALUE_INDEX + index)) {
        return null;
      }

      if (this.isDecorated) {
        if (!this._values) {
          this._values = [];
        }
        return this._values[index] = this._decorate(
          this.jCal[VALUE_INDEX + index]
        );
      } else {
        return this.jCal[VALUE_INDEX + index];
      }
    },

    _decorate: function(value) {
      return design.value[this.type].decorate(value);
    },

    _undecorate: function(value) {
      return design.value[this.type].undecorate(value);
    },

    _setDecoratedValue: function(value, index) {
      if (!this._values) {
        this._values = [];
      }

      if (typeof(value) === 'object' && 'icaltype' in value) {
        // decorated value
        this.jCal[VALUE_INDEX + index] = this._undecorate(value);
        this._values[index] = value;
      } else {
        // undecorated value
        this.jCal[VALUE_INDEX + index] = value;
        this._values[index] = this._decorate(value);
      }
    },

    /**
     * Gets a param on the property.
     *
     * @param {String} name prop name (lowercase).
     * @return {String} prop value.
     */
    getParameter: function(name) {
      return this.jCal[PROP_INDEX][name];
    },

    /**
     * Sets a param on the property.
     *
     * @param {String} value property value.
     */
    setParameter: function(name, value) {
      this.jCal[PROP_INDEX][name] = value;
    },

    /**
     * Removes a parameter
     *
     * @param {String} name prop name (lowercase).
     */
    removeParameter: function(name) {
      return delete this.jCal[PROP_INDEX][name];
    },

    /**
     * Sets type of property and clears out any
     * existing values of the current type.
     *
     * @param {String} type new iCAL type (see design.values).
     */
    resetType: function(type) {
      this.removeAllValues();
      this.jCal[TYPE_INDEX] = type;
      this._updateType();
    },

    /**
     * Finds first property value.
     *
     * @return {String} first property value.
     */
    getFirstValue: function() {
      return this._hydrateValue(0);
    },

    /**
     * Gets all values on the property.
     *
     * NOTE: this creates an array during each call.
     *
     * @return {Array} list of values.
     */
    getValues: function() {
      var len = this.jCal.length - VALUE_INDEX;

      if (len < 1) {
        // its possible for a property to have no value.
        return;
      }

      var i = 0;
      var result = [];

      for (; i < len; i++) {
        result[i] = this._hydrateValue(i);
      }

      return result;
    },

    removeAllValues: function() {
      if (this._values) {
        this._values.length = 0;
      }
      this.jCal.length = 3;
    },

    /**
     * Sets the values of the property.
     * Will overwrite the existing values.
     *
     * @param {Array} values an array of values.
     */
    setValues: function(values) {
      if (!this.isMultiValue) {
        throw new Error(
          this.name + ': does not not support mulitValue.\n' +
          'override isMultiValue'
        );
      }

      var len = values.length;
      var i = 0;
      this.removeAllValues();

      if (this.isDecorated) {
        for (; i < len; i++) {
          this._setDecoratedValue(values[i], i);
        }
      } else {
        for (; i < len; i++) {
          this.jCal[VALUE_INDEX + i] = values[i];
        }
      }
    },

    /**
     * Sets the current value of the property.
     *
     * @param {String|Object} value new prop value.
     */
    setValue: function(value) {
      if (this.isDecorated) {
        this._setDecoratedValue(value, 0);
      } else {
        this.jCal[VALUE_INDEX] = value;
      }
    },

    /**
     * Returns the jCal representation of this property.
     *
     * @return {Object} jCal.
     */
    toJSON: function() {
      return this.jCal;
    },

    toICAL: function() {
      return ICAL.stringify.property(
        this.jCal
      );
    }

  };

  return Property;

}());
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */



(typeof(ICAL) === 'undefined')? ICAL = {} : '';
(function() {
  ICAL.icalvalue = function icalvalue(aData, aParent, aType) {
    this.parent = aParent;
    this.fromData(aData, aType);
  };

  ICAL.icalvalue.prototype = {

    data: null,
    parent: null,
    icaltype: null,

    fromData: function icalvalue_fromData(aData, aType) {
      var type = (aType || (aData && aData.type) || this.icaltype);
      this.icaltype = type;

      if (aData && type) {
        aData.type = type;
      }

      this.data = aData;
    },

    fromString: function icalvalue_fromString(aString, aType) {
      var type = aType || this.icaltype;
      this.fromData(ICAL.DecorationParser.parseValue(aString, type), type);
    },

    undecorate: function icalvalue_undecorate() {
      return this.toString();
    },

    toString: function() {
      return this.data.value.toString();
    }
  };

  ICAL.icalvalue.fromString = function icalvalue_fromString(aString, aType) {
    var val = new ICAL.icalvalue();
    val.fromString(aString, aType);
    return val;
  };

  ICAL.icalvalue._createFromString = function icalvalue__createFromString(ctor) {
    ctor.fromString = function icalvalue_derived_fromString(aStr) {
      var val = new ctor();
      val.fromString(aStr);
      return val;
    };
  };

  ICAL.icalbinary = function icalbinary(aData, aParent) {
    ICAL.icalvalue.call(this, aData, aParent, "binary");
  };

  ICAL.icalbinary.prototype = {

    __proto__: ICAL.icalvalue.prototype,

    icaltype: "binary",

    decodeValue: function decodeValue() {
      return this._b64_decode(this.data.value);
    },

    setEncodedValue: function setEncodedValue(val) {
      this.data.value = this._b64_encode(val);
    },

    _b64_encode: function base64_encode(data) {
      // http://kevin.vanzonneveld.net
      // +   original by: Tyler Akins (http://rumkin.com)
      // +   improved by: Bayron Guevara
      // +   improved by: Thunder.m
      // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // +   bugfixed by: Pellentesque Malesuada
      // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // +   improved by: Rafał Kukawski (http://kukawski.pl)
      // *     example 1: base64_encode('Kevin van Zonneveld');
      // *     returns 1: 'S2V2aW4gdmFuIFpvbm5ldmVsZA=='
      // mozilla has this native
      // - but breaks in 2.0.0.12!
      //if (typeof this.window['atob'] == 'function') {
      //    return atob(data);
      //}
      var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
                "abcdefghijklmnopqrstuvwxyz0123456789+/=";
      var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        enc = "",
        tmp_arr = [];

      if (!data) {
        return data;
      }

      do { // pack three octets into four hexets
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);

        bits = o1 << 16 | o2 << 8 | o3;

        h1 = bits >> 18 & 0x3f;
        h2 = bits >> 12 & 0x3f;
        h3 = bits >> 6 & 0x3f;
        h4 = bits & 0x3f;

        // use hexets to index into b64, and append result to encoded string
        tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
      } while (i < data.length);

      enc = tmp_arr.join('');

      var r = data.length % 3;

      return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);

    },

    _b64_decode: function base64_decode(data) {
      // http://kevin.vanzonneveld.net
      // +   original by: Tyler Akins (http://rumkin.com)
      // +   improved by: Thunder.m
      // +      input by: Aman Gupta
      // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // +   bugfixed by: Onno Marsman
      // +   bugfixed by: Pellentesque Malesuada
      // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // +      input by: Brett Zamir (http://brett-zamir.me)
      // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // *     example 1: base64_decode('S2V2aW4gdmFuIFpvbm5ldmVsZA==');
      // *     returns 1: 'Kevin van Zonneveld'
      // mozilla has this native
      // - but breaks in 2.0.0.12!
      //if (typeof this.window['btoa'] == 'function') {
      //    return btoa(data);
      //}
      var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
                "abcdefghijklmnopqrstuvwxyz0123456789+/=";
      var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        dec = "",
        tmp_arr = [];

      if (!data) {
        return data;
      }

      data += '';

      do { // unpack four hexets into three octets using index points in b64
        h1 = b64.indexOf(data.charAt(i++));
        h2 = b64.indexOf(data.charAt(i++));
        h3 = b64.indexOf(data.charAt(i++));
        h4 = b64.indexOf(data.charAt(i++));

        bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

        o1 = bits >> 16 & 0xff;
        o2 = bits >> 8 & 0xff;
        o3 = bits & 0xff;

        if (h3 == 64) {
          tmp_arr[ac++] = String.fromCharCode(o1);
        } else if (h4 == 64) {
          tmp_arr[ac++] = String.fromCharCode(o1, o2);
        } else {
          tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
        }
      } while (i < data.length);

      dec = tmp_arr.join('');

      return dec;
    }
  };
  ICAL.icalvalue._createFromString(ICAL.icalbinary);

  ICAL.icalutcoffset = function icalutcoffset(aData, aParent) {
    ICAL.icalvalue.call(this, aData, aParent, "utc-offset");
  };

  ICAL.icalutcoffset.prototype = {

    __proto__: ICAL.icalvalue.prototype,

    hours: null,
    minutes: null,
    factor: null,

    icaltype: "utc-offset",

    fromData: function fromData(aData) {
      if (aData) {
        this.hours = aData.hours;
        this.minutes = aData.minutes;
        this.factor = aData.factor;
      }
    },

    toString: function toString() {
      return (this.factor == 1 ? "+" : "-") +
              ICAL.helpers.pad2(this.hours) +
              ICAL.helpers.pad2(this.minutes);
    }
  };
  ICAL.icalvalue._createFromString(ICAL.icalutcoffset);
})();
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */



(typeof(ICAL) === 'undefined')? ICAL = {} : '';
(function() {
  ICAL.icalperiod = function icalperiod(aData) {
    this.wrappedJSObject = this;
    this.fromData(aData);
  };

  ICAL.icalperiod.prototype = {

    start: null,
    end: null,
    duration: null,
    icalclass: "icalperiod",
    icaltype: "period",

    getDuration: function duration() {
      if (this.duration) {
        return this.duration;
      } else {
        return this.end.subtractDate(this.start);
      }
    },

    toString: function toString() {
      return this.start + "/" + (this.end || this.duration);
    },

    fromData: function fromData(data) {
      if (data) {
        this.start = ("start" in data ? new ICAL.icaltime(data.start) : null);
        this.end = ("end" in data ? new ICAL.icaltime(data.end) : null);
        this.duration = ("duration" in data ? new ICAL.icalduration(data.duration) : null);
      }
    }
  };

  ICAL.icalperiod.fromString = function fromString(str) {
    var data = ICAL.DecorationParser.parseValue(str, "period");
    return ICAL.icalperiod.fromData(data);
  };

  ICAL.icalperiod.fromData = function fromData(aData) {
    return new ICAL.icalperiod(aData);
  };
})();
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */



(typeof(ICAL) === 'undefined')? ICAL = {} : '';
(function() {
  var DURATION_LETTERS = /([PDWHMTS]{1,1})/;

  ICAL.icalduration = function icalduration(data) {
    this.wrappedJSObject = this;
    this.fromData(data);
  };

  ICAL.icalduration.prototype = {

    weeks: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isNegative: false,
    icalclass: "icalduration",
    icaltype: "duration",

    clone: function clone() {
      return ICAL.icalduration.fromData(this);
    },

    toSeconds: function toSeconds() {
      var seconds = this.seconds + 60 * this.minutes + 3600 * this.hours +
                    86400 * this.days + 7 * 86400 * this.weeks;
      return (this.isNegative ? -seconds : seconds);
    },

    fromSeconds: function fromSeconds(aSeconds) {
      var secs = Math.abs(aSeconds);

      this.isNegative = (aSeconds < 0);
      this.days = ICAL.helpers.trunc(secs / 86400);

      // If we have a flat number of weeks, use them.
      if (this.days % 7 == 0) {
        this.weeks = this.days / 7;
        this.days = 0;
      } else {
        this.weeks = 0;
      }

      secs -= (this.days + 7 * this.weeks) * 86400;

      this.hours = ICAL.helpers.trunc(secs / 3600);
      secs -= this.hours * 3600;

      this.minutes = ICAL.helpers.trunc(secs / 60);
      secs -= this.minutes * 60;

      this.seconds = secs;
      return this;
    },

    fromData: function fromData(aData) {
      var propsToCopy = ["weeks", "days", "hours",
                         "minutes", "seconds", "isNegative"];
      for (var key in propsToCopy) {
        var prop = propsToCopy[key];
        if (aData && prop in aData) {
          this[prop] = aData[prop];
        } else {
          this[prop] = 0;
        }
      }

      if (aData && "factor" in aData) {
        this.isNegative = (aData.factor == "-1");
      }
    },

    reset: function reset() {
      this.isNegative = false;
      this.weeks = 0;
      this.days = 0;
      this.hours = 0;
      this.minutes = 0;
      this.seconds = 0;
    },

    compare: function compare(aOther) {
      var thisSeconds = this.toSeconds();
      var otherSeconds = aOther.toSeconds();
      return (thisSeconds > otherSeconds) - (thisSeconds < otherSeconds);
    },

    normalize: function normalize() {
      this.fromSeconds(this.toSeconds());
      return this;
    },

    toString: function toString() {
      if (this.toSeconds() == 0) {
        return "PT0S";
      } else {
        var str = "";
        if (this.isNegative) str += "-";
        str += "P";
        if (this.weeks) str += this.weeks + "W";
        if (this.days) str += this.days + "D";

        if (this.hours || this.minutes || this.seconds) {
          str += "T";
          if (this.hours) str += this.hours + "H";
          if (this.minutes) str += this.minutes + "M";
          if (this.seconds) str += this.seconds + "S";
        }
        return str;
      }
    }
  };

  ICAL.icalduration.fromSeconds = function icalduration_from_seconds(aSeconds) {
    return (new ICAL.icalduration()).fromSeconds();
  };

  /**
   * Internal helper function to handle a chunk of a duration.
   *
   * @param {String} letter type of duration chunk.
   * @param {String} number numeric value or -/+.
   * @param {Object} dict target to assign values to.
   */
  function parseDurationChunk(letter, number, object) {
    var type;
    switch (letter) {
      case 'P':
        if (number && number === '-') {
          object.isNegative = true;
        } else {
          object.isNegative = false;
        }
        // period
        break;
      case 'D':
        type = 'days';
        break;
      case 'W':
        type = 'weeks';
        break;
      case 'H':
        type = 'hours';
        break;
      case 'M':
        type = 'minutes';
        break;
      case 'S':
        type = 'seconds';
        break;
    }

    if (type) {
      object[type] = parseInt(number);
    }
  }

  ICAL.icalduration.fromString = function icalduration_from_string(aStr) {
    var pos = 0;
    var dict = Object.create(null);

    while ((pos = aStr.search(DURATION_LETTERS)) !== -1) {
      var type = aStr[pos];
      var numeric = aStr.substr(0, pos);
      aStr = aStr.substr(pos + 1);

      parseDurationChunk(type, numeric, dict);
    }

    return new ICAL.icalduration(dict);
  };

  ICAL.icalduration.fromData = function icalduration_from_data(aData) {
    return new ICAL.icalduration(aData);
  };
})();
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */



(typeof(ICAL) === 'undefined')? ICAL = {} : '';
(function() {
  ICAL.icaltimezone = function icaltimezone(data) {
    this.wrappedJSObject = this;
    this.fromData(data);
  };

  ICAL.icaltimezone.prototype = {

    tzid: "",
    location: "",
    tznames: "",

    latitude: 0.0,
    longitude: 0.0,

    component: null,

    expand_end_year: 0,
    expand_start_year: 0,

    changes: null,
    icalclass: "icaltimezone",

    fromData: function fromData(aData) {
      var propsToCopy = ["tzid", "location", "tznames",
                         "latitude", "longitude"];
      for (var key in propsToCopy) {
        var prop = propsToCopy[key];
        if (aData && prop in aData) {
          this[prop] = aData[prop];
        } else {
          this[prop] = 0;
        }
      }

      this.expand_end_year = 0;
      this.expand_start_year = 0;
      if (aData && "component" in aData) {
        if (typeof aData.component == "string") {
          this.component = this.componentFromString(aData.component);
        } else {
          this.component = ICAL.helpers.clone(aData.component, true);
        }
      } else {
        this.component = null;
      }
      return this;
    },

    componentFromString: function componentFromString(str) {
      this.component = ICAL.toJSON(str, true);
      return this.component;
    },

    utc_offset: function utc_offset(tt) {
      if (this == ICAL.icaltimezone.utc_timezone || this == ICAL.icaltimezone.local_timezone) {
        return 0;
      }

      this.ensure_coverage(tt.year);

      if (!this.changes || this.changes.length == 0) {
        return 0;
      }

      var tt_change = {
        year: tt.year,
        month: tt.month,
        day: tt.day,
        hour: tt.hour,
        minute: tt.minute,
        second: tt.second
      };

      var change_num = this.find_nearby_change(tt_change);
      var change_num_to_use = -1;
      var step = 1;

      for (;;) {
        var change = ICAL.helpers.clone(this.changes[change_num], true);
        if (change.utc_offset < change.prev_utc_offset) {
          ICAL.helpers.dumpn("Adjusting " + change.utc_offset);
          ICAL.icaltimezone.adjust_change(change, 0, 0, 0, change.utc_offset);
        } else {
          ICAL.helpers.dumpn("Adjusting prev " + change.prev_utc_offset);
          ICAL.icaltimezone.adjust_change(change, 0, 0, 0,
                                          change.prev_utc_offset);
        }

        var cmp = ICAL.icaltimezone._compare_change_fn(tt_change, change);
        ICAL.helpers.dumpn("Compare" + cmp + " / " + change.toString());

        if (cmp >= 0) {
          change_num_to_use = change_num;
        } else {
          step = -1;
        }

        if (step == -1 && change_num_to_use != -1) {
          break;
        }

        change_num += step;

        if (change_num < 0) {
          return 0;
        }

        if (change_num >= this.changes.length) {
          break;
        }
      }

      var zone_change = this.changes[change_num_to_use];
      var utc_offset_change = zone_change.utc_offset - zone_change.prev_utc_offset;

      if (utc_offset_change < 0 && change_num_to_use > 0) {
        var tmp_change = ICAL.helpers.clone(zone_change, true);
        ICAL.icaltimezone.adjust_change(tmp_change, 0, 0, 0,
                                        tmp_change.prev_utc_offset);

        if (ICAL.icaltimezone._compare_change_fn(tt_change, tmp_change) < 0) {
          var prev_zone_change = this.changes[change_num_to_use - 1];

          var want_daylight = false; // TODO

          if (zone_change.is_daylight != want_daylight &&
              prev_zone_change.is_daylight == want_daylight) {
            zone_change = prev_zone_change;
          }
        }
      }

      // TODO return is_daylight?
      return zone_change.utc_offset;
    },

    find_nearby_change: function icaltimezone_find_nearby_change(change) {
      var lower = 0,
        middle = 0;
      var upper = this.changes.length;

      while (lower < upper) {
        middle = ICAL.helpers.trunc(lower + upper / 2);
        var zone_change = this.changes[middle];
        var cmp = ICAL.icaltimezone._compare_change_fn(change, zone_change);
        if (cmp == 0) {
          break;
        } else if (cmp > 0) {
          upper = middle;
        } else {
          lower = middle;
        }
      }

      return middle;
    },

    ensure_coverage: function ensure_coverage(aYear) {
      if (ICAL.icaltimezone._minimum_expansion_year == -1) {
        var today = ICAL.icaltime.now();
        ICAL.icaltimezone._minimum_expansion_year = today.year;
      }

      var changes_end_year = aYear;
      if (changes_end_year < ICAL.icaltimezone._minimum_expansion_year) {
        changes_end_year = ICAL.icaltimezone._minimum_expansion_year;
      }

      changes_end_year += ICAL.icaltimezone.EXTRA_COVERAGE;

      if (changes_end_year > ICAL.icaltimezone.MAX_YEAR) {
        changes_end_year = ICAL.icaltimezone.MAX_YEAR;
      }

      if (!this.changes || this.expand_end_year < aYear) {
        this.expand_changes(changes_end_year);
      }
    },

    expand_changes: function expand_changes(aYear) {
      var changes = [];
      if (this.component) {
        // HACK checking for component only needed for floating
        // tz, which is not in core libical.
        var subcomps = this.component.getAllSubcomponents();
        for (var compkey in subcomps) {
          this.expand_vtimezone(subcomps[compkey], aYear, changes);
        }

        this.changes = changes.concat(this.changes || []);
        this.changes.sort(ICAL.icaltimezone._compare_change_fn);
      }

      this.change_end_year = aYear;
    },

    expand_vtimezone: function expand_vtimezone(aComponent, aYear, changes) {
      if (!aComponent.hasProperty("DTSTART") ||
          !aComponent.hasProperty("TZOFFSETTO") ||
          !aComponent.hasProperty("TZOFFSETFROM")) {
        return null;
      }

      var dtstart = aComponent.getFirstProperty("DTSTART").getFirstValue();

      function convert_tzoffset(offset) {
        return offset.factor * (offset.hours * 3600 + offset.minutes * 60);
      }

      function init_changes() {
        var changebase = {};
        changebase.is_daylight = (aComponent.name == "DAYLIGHT");
        changebase.utc_offset = convert_tzoffset(aComponent.getFirstProperty("TZOFFSETTO").data);
        changebase.prev_utc_offset = convert_tzoffset(aComponent.getFirstProperty("TZOFFSETFROM").data);
        return changebase;
      }

      if (!aComponent.hasProperty("RRULE") && !aComponent.hasProperty("RDATE")) {
        var change = init_changes();
        change.year = dtstart.year;
        change.month = dtstart.month;
        change.day = dtstart.day;
        change.hour = dtstart.hour;
        change.minute = dtstart.minute;
        change.second = dtstart.second;

        ICAL.icaltimezone.adjust_change(change, 0, 0, 0,
                                        -change.prev_utc_offset);
        changes.push(change);
      } else {
        var props = aComponent.getAllProperties("RDATE");
        for (var rdatekey in props) {
          var rdate = props[rdatekey];
          var change = init_changes();
          change.year = rdate.time.year;
          change.month = rdate.time.month;
          change.day = rdate.time.day;

          if (rdate.time.isDate) {
            change.hour = dtstart.hour;
            change.minute = dtstart.minute;
            change.second = dtstart.second;
          } else {
            change.hour = rdate.time.hour;
            change.minute = rdate.time.minute;
            change.second = rdate.time.second;

            if (rdate.time.zone == ICAL.icaltimezone.utc_timezone) {
              ICAL.icaltimezone.adjust_change(change, 0, 0, 0,
                                              -change.prev_utc_offset);
            }
          }

          changes.push(change);
        }

        var rrule = aComponent.getFirstProperty("RRULE").getFirstValue();
        // TODO multiple rrules?

        var change = init_changes();

        if (rrule.until && rrule.until.zone == ICAL.icaltimezone.utc_timezone) {
          rrule.until.adjust(0, 0, 0, change.prev_utc_offset);
          rrule.until.zone = ICAL.icaltimezone.local_timezone;
        }

        var iterator = rrule.iterator(dtstart);

        var occ;
        while ((occ = iterator.next())) {
          var change = init_changes();
          if (occ.year > aYear || !occ) {
            break;
          }

          change.year = occ.year;
          change.month = occ.month;
          change.day = occ.day;
          change.hour = occ.hour;
          change.minute = occ.minute;
          change.second = occ.second;
          change.isDate = occ.isDate;

          ICAL.icaltimezone.adjust_change(change, 0, 0, 0,
                                          -change.prev_utc_offset);
          changes.push(change);
        }
      }

      return changes;
    },

    toString: function toString() {
      return (this.tznames ? this.tznames : this.tzid);
    }

  };

  ICAL.icaltimezone._compare_change_fn = function icaltimezone_compare_change_fn(a, b) {
    if (a.year < b.year) return -1;
    else if (a.year > b.year) return 1;

    if (a.month < b.month) return -1;
    else if (a.month > b.month) return 1;

    if (a.day < b.day) return -1;
    else if (a.day > b.day) return 1;

    if (a.hour < b.hour) return -1;
    else if (a.hour > b.hour) return 1;

    if (a.minute < b.minute) return -1;
    else if (a.minute > b.minute) return 1;

    if (a.second < b.second) return -1;
    else if (a.second > b.second) return 1;

    return 0;
  };

  ICAL.icaltimezone.convert_time = function icaltimezone_convert_time(tt, from_zone, to_zone) {
    if (tt.isDate ||
        from_zone.tzid == to_zone.tzid ||
        from_zone == ICAL.icaltimezone.local_timezone ||
        to_zone == ICAL.icaltimezone.local_timezone) {
      tt.zone = to_zone;
      return tt;
    }

    var utc_offset = from_zone.utc_offset(tt);
    tt.adjust(0, 0, 0, - utc_offset);

    utc_offset = to_zone.utc_offset(tt);
    tt.adjust(0, 0, 0, utc_offset);

    return null;
  };

  ICAL.icaltimezone.fromData = function icaltimezone_fromData(aData) {
    var tt = new ICAL.icaltimezone();
    return tt.fromData(aData);
  };

  ICAL.icaltimezone.utc_timezone = ICAL.icaltimezone.fromData({
    tzid: "UTC"
  });
  ICAL.icaltimezone.local_timezone = ICAL.icaltimezone.fromData({
    tzid: "floating"
  });

  ICAL.icaltimezone.adjust_change = function icaltimezone_adjust_change(change, days, hours, minutes, seconds) {
    return ICAL.icaltime.prototype.adjust.call(change, days, hours, minutes, seconds);
  };

  ICAL.icaltimezone._minimum_expansion_year = -1;
  ICAL.icaltimezone.MAX_YEAR = 2035; // TODO this is because of time_t, which we don't need. Still usefull?
  ICAL.icaltimezone.EXTRA_COVERAGE = 5;
})();
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */



(typeof(ICAL) === 'undefined')? ICAL = {} : '';
(function() {
  ICAL.icaltime = function icaltime(data) {
    this.wrappedJSObject = this;
    this.fromData(data);
  };

  ICAL.icaltime.prototype = {

    year: 0,
    month: 1,
    day: 1,

    hour: 0,
    minute: 0,
    second: 0,

    isDate: false,
    zone: null,

    auto_normalize: false,
    icalclass: "icaltime",
    icaltype: "date-time",

    clone: function icaltime_clone() {
      return new ICAL.icaltime(this);
    },

    reset: function icaltime_reset() {
      this.fromData(ICAL.icaltime.epoch_time);
      this.zone = ICAL.icaltimezone.utc_timezone;
    },

    resetTo: function icaltime_resetTo(year, month, day,
                                       hour, minute, second, timezone) {
      this.fromData({
        year: year,
        month: month,
        day: day,
        hour: hour,
        minute: minute,
        second: second,
        zone: timezone
      });
    },

    fromString: function icaltime_fromString(str) {
      var data;
      try {
        data = ICAL.DecorationParser.parseValue(str, "date");
        data.isDate = true;
      } catch (e) {
        data = ICAL.DecorationParser.parseValue(str, "date-time");
        data.isDate = false;
      }
      return this.fromData(data);
    },

    fromJSDate: function icaltime_fromJSDate(aDate, useUTC) {
      if (!aDate) {
        this.reset();
      } else {
        if (useUTC) {
          this.zone = ICAL.icaltimezone.utc_timezone;
          this.year = aDate.getUTCFullYear();
          this.month = aDate.getUTCMonth() + 1;
          this.day = aDate.getUTCDate();
          this.hour = aDate.getUTCHours();
          this.minute = aDate.getUTCMinutes();
          this.second = aDate.getUTCSeconds();
        } else {
          this.zone = ICAL.icaltimezone.local_timezone;
          this.year = aDate.getFullYear();
          this.month = aDate.getMonth() + 1;
          this.day = aDate.getDate();
          this.hour = aDate.getHours();
          this.minute = aDate.getMinutes();
          this.second = aDate.getSeconds();
        }
      }
      return this;
    },

    fromData: function fromData(aData) {
      // TODO given we're switching formats, this may not be needed
      var old_auto_normalize = this.auto_normalize;
      this.auto_normalize = false;

      var propsToCopy = {
        year: 0,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0
      };
      for (var key in propsToCopy) {
        if (aData && key in aData) {
          this[key] = aData[key];
        } else {
          this[key] = propsToCopy[key];
        }
      }
      if (aData && !("isDate" in aData)) {
        this.isDate = !("hour" in aData);
      } else if (aData && ("isDate" in aData)) {
        this.isDate = aData.isDate;
      }

      if (aData && "timezone" in aData) {
        var timezone = aData.timezone;

        //TODO: replace with timezone service
        switch (timezone) {
          case 'Z':
          case ICAL.icaltimezone.utc_timezone.tzid:
            this.zone = ICAL.icaltimezone.utc_timezone;
            break;
          case ICAL.icaltimezone.local_timezone.tzid:
            this.zone = ICAL.icaltimezone.local_timezone;
            break;
        }
      }

      if (aData && "zone" in aData) {
        this.zone = aData.zone;
      }

      if (!this.zone) {
        this.zone = ICAL.icaltimezone.local_timezone;
      }

      if (aData && "auto_normalize" in aData) {
        this.auto_normalize = aData.auto_normalize;
      } else {
        this.auto_normalize = old_auto_normalize;
      }
      if (this.auto_normalize) {
        this.normalize();
      }
      return this;
    },

    dayOfWeek: function icaltime_dayOfWeek() {
      // Using Zeller's algorithm
      var q = this.day;
      var m = this.month + (this.month < 3 ? 12 : 0);
      var Y = this.year - (this.month < 3 ? 1 : 0);

      var h = (q + Y + ICAL.helpers.trunc(((m + 1) * 26) / 10) + ICAL.helpers.trunc(Y / 4));
      if (true /* gregorian */) {
        h += ICAL.helpers.trunc(Y / 100) * 6 + ICAL.helpers.trunc(Y / 400);
      } else {
        h += 5;
      }

      // Normalize to 1 = sunday
      h = ((h + 6) % 7) + 1;
      return h;
    },

    dayOfYear: function icaltime_dayOfYear() {
      var is_leap = (ICAL.icaltime.is_leap_year(this.year) ? 1 : 0);
      var diypm = ICAL.icaltime._days_in_year_passed_month;
      return diypm[is_leap][this.month - 1] + this.day;
    },

    startOfWeek: function startOfWeek() {
      var result = this.clone();
      result.day -= this.dayOfWeek() - 1;
      return result.normalize();
    },

    end_of_week: function end_of_week() {
      var result = this.clone();
      result.day += 7 - this.dayOfWeek();
      return result.normalize();
    },

    start_of_month: function start_of_month() {
      var result = this.clone();
      result.day = 1;
      result.isDate = true;
      result.hour = 0;
      result.minute = 0;
      result.second = 0;
      return result;
    },

    end_of_month: function end_of_month() {
      var result = this.clone();
      result.day = ICAL.icaltime.daysInMonth(result.month, result.year);
      result.isDate = true;
      result.hour = 0;
      result.minute = 0;
      result.second = 0;
      return result;
    },

    start_of_year: function start_of_year() {
      var result = this.clone();
      result.day = 1;
      result.month = 1;
      result.isDate = true;
      result.hour = 0;
      result.minute = 0;
      result.second = 0;
      return result;
    },

    end_of_year: function end_of_year() {
      var result = this.clone();
      result.day = 31;
      result.month = 12;
      result.isDate = true;
      result.hour = 0;
      result.minute = 0;
      result.second = 0;
      return result;
    },

    start_doy_week: function start_doy_week(aFirstDayOfWeek) {
      var firstDow = aFirstDayOfWeek || ICAL.icaltime.SUNDAY;
      var delta = this.dayOfWeek() - firstDow;
      if (delta < 0) delta += 7;
      return this.dayOfYear() - delta;
    },

    /**
     * Finds the nthWeekDay relative to the current month (not day).
     * The returned value is a day relative the month that this
     * month belongs to so 1 would indicate the first of the month
     * and 40 would indicate a day in the following month.
     *
     * @param {Numeric} aDayOfWeek day of the week see the day name constants.
     * @param {Numeric} aPos nth occurrence of a given week day
     *                       values of 1 and 0 both indicate the first
     *                       weekday of that type. aPos may be either positive
     *                       or negative.
     *
     * @return {Numeric} numeric value indicating a day relative
     *                   to the current month of this time object.
     */
    nthWeekDay: function icaltime_nthWeekDay(aDayOfWeek, aPos) {
      var daysInMonth = ICAL.icaltime.daysInMonth(this.month, this.year);
      var weekday;
      var pos = aPos;

      var start = 0;

      var otherDay = this.clone();

      if (pos >= 0) {
        otherDay.day = 1;

        // because 0 means no position has been given
        // 1 and 0 indicate the same day.
        if (pos != 0) {
          // remove the extra numeric value
          pos--;
        }

        // set current start offset to current day.
        start = otherDay.day;

        // find the current day of week
        var startDow = otherDay.dayOfWeek();

        // calculate the difference between current
        // day of the week and desired day of the week
        var offset = aDayOfWeek - startDow;


        // if the offset goes into the past
        // week we add 7 so its goes into the next
        // week. We only want to go forward in time here.
        if (offset < 0)
          // this is really important otherwise we would
          // end up with dates from in the past.
          offset += 7;

        // add offset to start so start is the same
        // day of the week as the desired day of week.
        start += offset;

        // because we are going to add (and multiply)
        // the numeric value of the day we subtract it
        // from the start position so not to add it twice.
        start -= aDayOfWeek;

        // set week day
        weekday = aDayOfWeek;
      } else {

        // then we set it to the last day in the current month
        otherDay.day = daysInMonth;

        // find the ends weekday
        var endDow = otherDay.dayOfWeek();

        pos++;

        weekday = (endDow - aDayOfWeek);

        if (weekday < 0) {
          weekday += 7;
        }

        weekday = daysInMonth - weekday;
      }

      weekday += pos * 7;

      return start + weekday;
    },

    /**
     * Checks if current time is the nthWeekDay.
     * Relative to the current month.
     *
     * Will always return false when rule resolves
     * outside of current month.
     *
     * @param {Numeric} aDayOfWeek day of week.
     * @param {Numeric} aPos position.
     * @param {Numeric} aMax maximum valid day.
     */
    isNthWeekDay: function(aDayOfWeek, aPos) {
      var dow = this.dayOfWeek();

      if (aPos === 0 && dow === aDayOfWeek) {
        return true;
      }

      // get pos
      var day = this.nthWeekDay(aDayOfWeek, aPos);

      if (day === this.day) {
        return true;
      }

      return false;
    },

    week_number: function week_number(aWeekStart) {
      // This function courtesty of Julian Bucknall, published under the MIT license
      // http://www.boyet.com/articles/publishedarticles/calculatingtheisoweeknumb.html
      var doy = this.dayOfYear();
      var dow = this.dayOfWeek();
      var year = this.year;
      var week1;

      var dt = this.clone();
      dt.isDate = true;
      var first_dow = dt.dayOfWeek();
      var isoyear = this.year;

      if (dt.month == 12 && dt.day > 28) {
        week1 = ICAL.icaltime.week_one_starts(isoyear + 1, aWeekStart);
        if (dt.compare(week1) < 0) {
          week1 = ICAL.icaltime.week_one_starts(isoyear, aWeekStart);
        } else {
          isoyear++;
        }
      } else {
        week1 = ICAL.icaltime.week_one_starts(isoyear, aWeekStart);
        if (dt.compare(week1) < 0) {
          week1 = ICAL.icaltime.week_one_starts(--isoyear, aWeekStart);
        }
      }

      var daysBetween = (dt.subtractDate(week1).toSeconds() / 86400);
      return ICAL.helpers.trunc(daysBetween / 7) + 1;
    },

    addDuration: function icaltime_add(aDuration) {
      var mult = (aDuration.isNegative ? -1 : 1);

      this.second += mult * aDuration.seconds;
      this.minute += mult * aDuration.minutes;
      this.hour += mult * aDuration.hours;
      this.day += mult * aDuration.days;
      this.day += mult * 7 * aDuration.weeks;

      this.normalize();
    },

    subtractDate: function icaltime_subtract(aDate) {
      function leap_years_until(aYear) {
        return ICAL.helpers.trunc(aYear / 4) -
               ICAL.helpers.trunc(aYear / 100) +
               ICAL.helpers.trunc(aYear / 400);
      }

      function leap_years_between(aStart, aEnd) {
        if (aStart >= aEnd) {
          return 0;
        } else {
          return leap_years_until(aEnd - 1) - leap_years_until(aStart);
        }
      }
      var dur = new ICAL.icalduration();

      dur.seconds = this.second - aDate.second;
      dur.minutes = this.minute - aDate.minute;
      dur.hours = this.hour - aDate.hour;

      if (this.year == aDate.year) {
        var this_doy = this.dayOfYear();
        var that_doy = aDate.dayOfYear();
        dur.days = this_doy - that_doy;
      } else if (this.year < aDate.year) {
        var days_left_thisyear = 365 +
          (ICAL.icaltime.is_leap_year(this.year) ? 1 : 0) -
          this.dayOfYear();

        dur.days -= days_left_thisyear + aDate.dayOfYear();
        dur.days -= leap_years_between(this.year + 1, aDate.year);
        dur.days -= 365 * (aDate.year - this.year - 1);
      } else {
        var days_left_thatyear = 365 +
          (ICAL.icaltime.is_leap_year(aDate.year) ? 1 : 0) -
          aDate.dayOfYear();

        dur.days += days_left_thatyear + this.dayOfYear();
        dur.days += leap_years_between(aDate.year + 1, this.year);
        dur.days += 365 * (this.year - aDate.year - 1);
      }

      return dur.normalize();
    },

    compare: function icaltime_compare(other) {
      function cmp(attr) {
        return ICAL.icaltime._cmp_attr(a, b, attr);
      }

      if (!other) return 0;

      if (this.isDate || other.isDate) {
        return this.compare_date_only_tz(other, this.zone);
      }

      var target_zone;
      if (this.zone == ICAL.icaltimezone.local_timezone ||
          other.zone == ICAL.icaltimezone.local_timezone) {
        target_zone = ICAL.icaltimezone.local_timezone;
      } else {
        target_zone = ICAL.icaltimezone.utc_timezone;
      }

      var a = this.convert_to_zone(target_zone);
      var b = other.convert_to_zone(target_zone);
      var rc = 0;

      if ((rc = cmp("year")) != 0) return rc;
      if ((rc = cmp("month")) != 0) return rc;
      if ((rc = cmp("day")) != 0) return rc;

      if (a.isDate && b.isDate) {
        // If both are dates, we are done
        return 0;
      } else if (b.isDate) {
        // If b is a date, then a is greater
        return 1;
      } else if (a.isDate) {
        // If a is a date, then b is greater
        return -1;
      }

      if ((rc = cmp("hour")) != 0) return rc;
      if ((rc = cmp("minute")) != 0) return rc;
      if ((rc = cmp("second")) != 0) return rc;

      // Now rc is 0 and the dates are equal
      return rc;
    },

    compare_date_only_tz: function icaltime_compare_date_only_tz(other, tz) {
      function cmp(attr) {
        return ICAL.icaltime._cmp_attr(a, b, attr);
      }
      var a = this.convert_to_zone(tz);
      var b = other.convert_to_zone(tz);
      var rc = 0;

      if ((rc = cmp("year")) != 0) return rc;
      if ((rc = cmp("month")) != 0) return rc;
      if ((rc = cmp("day")) != 0) return rc;

      return rc;
    },

    convert_to_zone: function convert_to_zone(zone) {
      var copy = this.clone();
      var zone_equals = (this.zone.tzid == zone.tzid);

      if (!this.isDate && !zone_equals) {
        ICAL.icaltimezone.convert_time(copy, this.zone, zone);
      }

      copy.zone = zone;
      return copy;
    },

    utc_offset: function utc_offset() {
      if (this.zone == ICAL.icaltimezone.local_timezone ||
          this.zone == ICAL.icaltimezone.utc_timezone) {
        return 0;
      } else {
        return this.zone.utc_offset(this);
      }
    },

    toString: function toString() {
        return ("0000" + this.year).substr(-4) +
               ("00" + this.month).substr(-2) +
               ("00" + this.day).substr(-2) +
               (this.isDate ? "" :
                 "T" +
                 ("00" + this.hour).substr(-2) +
                 ("00" + this.minute).substr(-2) +
                 ("00" + this.second).substr(-2) +
                 (this.zone && this.zone.tzid == "UTC" ? "Z" : "")
               );
    },

    toJSDate: function toJSDate() {
      if (this.zone == ICAL.icaltimezone.local_timezone) {
        if (this.isDate) {
          return new Date(this.year, this.month - 1, this.day);
        } else {
          return new Date(this.year, this.month - 1, this.day,
                          this.hour, this.minute, this.second, 0);
        }
      } else {
        var utcDate = this.convert_to_zone(ICAL.icaltimezone.utc_timezone);
        if (this.isDate) {
          return Date.UTC(this.year, this.month - 1, this.day);
        } else {
          return Date.UTC(this.year, this.month - 1, this.day,
                          this.hour, this.minute, this.second, 0);
        }
      }
    },

    normalize: function icaltime_normalize() {
      if (this.isDate) {
        this.hour = 0;
        this.minute = 0;
        this.second = 0;
      }
      this.icaltype = (this.isDate ? "date" : "date-time");

      this.adjust(0, 0, 0, 0);
      return this;
    },

    adjust: function icaltime_adjust(aExtraDays, aExtraHours,
                                     aExtraMinutes, aExtraSeconds) {
      var second, minute, hour, day;
      var minutes_overflow, hours_overflow, days_overflow = 0,
        years_overflow = 0;
      var daysInMonth;

      if (!this.isDate) {
        second = this.second + aExtraSeconds;
        this.second = second % 60;
        minutes_overflow = ICAL.helpers.trunc(second / 60);
        if (this.second < 0) {
          this.second += 60;
          minutes_overflow--;
        }

        minute = this.minute + aExtraMinutes + minutes_overflow;
        this.minute = minute % 60;
        hours_overflow = ICAL.helpers.trunc(minute / 60);
        if (this.minute < 0) {
          this.minute += 60;
          hours_overflow--;
        }

        hour = this.hour + aExtraHours + hours_overflow;
        this.hour = hour % 24;
        days_overflow = ICAL.helpers.trunc(hour / 24);
        if (this.hour < 0) {
          this.hour += 24;
          days_overflow--;
        }
      }

      // Adjust month and year first, because we need to know what month the day
      // is in before adjusting it.
      if (this.month > 12) {
        years_overflow = ICAL.helpers.trunc((this.month - 1) / 12);
      } else if (this.month < 1) {
        years_overflow = ICAL.helpers.trunc(this.month / 12) - 1;
      }

      this.year += years_overflow;
      this.month -= 12 * years_overflow;

      // Now take care of the days (and adjust month if needed)
      day = this.day + aExtraDays + days_overflow;
      if (day > 0) {
        for (;;) {
          var daysInMonth = ICAL.icaltime.daysInMonth(this.month, this.year);
          if (day <= daysInMonth) {
            break;
          }

          this.month++;
          if (this.month > 12) {
            this.year++;
            this.month = 1;
          }

          day -= daysInMonth;
        }
      } else {
        while (day <= 0) {
          if (this.month == 1) {
            this.year--;
            this.month = 12;
          } else {
            this.month--;
          }

          day += ICAL.icaltime.daysInMonth(this.month, this.year);
        }
      }

      this.day = day;
      return this;
    },

    fromUnixTime: function fromUnixTime(seconds) {
      var epoch = ICAL.icaltime.epoch_time.clone();
      epoch.adjust(0, 0, 0, seconds);
      this.fromData(epoch);
      this.zone = ICAL.icaltimezone.utc_timezone;
    },

    toUnixTime: function toUnixTime() {
      var dur = this.subtractDate(ICAL.icaltime.epoch_time);
      return dur.toSeconds();
    },

    /**
     * Converts time to into Object
     * which can be serialized then re-created
     * using the constructor.
     *
     * Example:
     *
     *    // toJSON will automatically be called
     *    var json = JSON.stringify(mytime);
     *
     *    var deserialized = JSON.parse(json);
     *
     *    var time = new ICAL.icaltime(deserialized);
     *
     */
    toJSON: function() {
      var copy = [
        'year',
        'month',
        'day',
        'hour',
        'minute',
        'second',
        'isDate'
      ];

      var result = Object.create(null);

      var i = 0;
      var len = copy.length;
      var prop;

      for (; i < len; i++) {
        prop = copy[i];
        result[prop] = this[prop];
      }

      if (this.zone) {
        result.timezone = this.zone.tzid;
      }

      return result;
    }

  };

  (function setupNormalizeAttributes() {
    // This needs to run before any instances are created!
    function addAutoNormalizeAttribute(attr, mattr) {
      ICAL.icaltime.prototype[mattr] = ICAL.icaltime.prototype[attr];

      Object.defineProperty(ICAL.icaltime.prototype, attr, {
        get: function() {
          return this[mattr];
        },
        set: function(val) {
          this[mattr] = val;
          if (this.auto_normalize) {
            var old_normalize = this.auto_normalize;
            this.auto_normalize = false;
            this.normalize();
            this.auto_normalize = old_normalize;
          }
          return val;
        }
      });

    }

    if ("defineProperty" in Object) {
      addAutoNormalizeAttribute("year", "mYear");
      addAutoNormalizeAttribute("month", "mMonth");
      addAutoNormalizeAttribute("day", "mDay");
      addAutoNormalizeAttribute("hour", "mHour");
      addAutoNormalizeAttribute("minute", "mMinute");
      addAutoNormalizeAttribute("second", "mSecond");
      addAutoNormalizeAttribute("isDate", "mIsDate");

      ICAL.icaltime.prototype.auto_normalize = true;
    }
  })();

  ICAL.icaltime.daysInMonth = function icaltime_daysInMonth(month, year) {
    var _daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var days = 30;

    if (month < 1 || month > 12) return days;

    days = _daysInMonth[month];

    if (month == 2) {
      days += ICAL.icaltime.is_leap_year(year);
    }

    return days;
  };

  ICAL.icaltime.is_leap_year = function icaltime_is_leap_year(year) {
    if (year <= 1752) {
      return ((year % 4) == 0);
    } else {
      return (((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0));
    }
  };

  ICAL.icaltime.fromDayOfYear = function icaltime_fromDayOfYear(aDayOfYear, aYear) {
    var year = aYear;
    var doy = aDayOfYear;
    var tt = new ICAL.icaltime();
    tt.auto_normalize = false;
    var is_leap = (ICAL.icaltime.is_leap_year(year) ? 1 : 0);

    if (doy < 1) {
      year--;
      is_leap = (ICAL.icaltime.is_leap_year(year) ? 1 : 0);
      doy += ICAL.icaltime._days_in_year_passed_month[is_leap][12];
    } else if (doy > ICAL.icaltime._days_in_year_passed_month[is_leap][12]) {
      is_leap = (ICAL.icaltime.is_leap_year(year) ? 1 : 0);
      doy -= ICAL.icaltime._days_in_year_passed_month[is_leap][12];
      year++;
    }

    tt.year = year;
    tt.isDate = true;

    for (var month = 11; month >= 0; month--) {
      if (doy > ICAL.icaltime._days_in_year_passed_month[is_leap][month]) {
        tt.month = month + 1;
        tt.day = doy - ICAL.icaltime._days_in_year_passed_month[is_leap][month];
        break;
      }
    }

    tt.auto_normalize = true;
    return tt;
  };

  ICAL.icaltime.fromStringv2 = function fromString(str) {
    return new ICAL.icaltime({
      year: parseInt(str.substr(0, 4), 10),
      month: parseInt(str.substr(5, 2), 10),
      day: parseInt(str.substr(8, 2), 10),
      isDate: true
    });
  };

  ICAL.icaltime.fromString = function fromString(str) {
    var tt = new ICAL.icaltime();
    return tt.fromString(str);
  };

  ICAL.icaltime.fromJSDate = function fromJSDate(aDate, useUTC) {
    var tt = new ICAL.icaltime();
    return tt.fromJSDate(aDate, useUTC);
  };

  ICAL.icaltime.fromData = function fromData(aData) {
    var t = new ICAL.icaltime();
    return t.fromData(aData);
  };

  ICAL.icaltime.now = function icaltime_now() {
    return ICAL.icaltime.fromJSDate(new Date(), false);
  };

  ICAL.icaltime.week_one_starts = function week_one_starts(aYear, aWeekStart) {
    var t = ICAL.icaltime.fromData({
      year: aYear,
      month: 1,
      day: 4,
      isDate: true
    });

    var fourth_dow = t.dayOfWeek();
    t.day += (1 - fourth_dow) + ((aWeekStart || ICAL.icaltime.SUNDAY) - 1);
    return t;
  };

  ICAL.icaltime.epoch_time = ICAL.icaltime.fromData({
    year: 1970,
    month: 1,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
    isDate: false,
    timezone: "Z"
  });

  ICAL.icaltime._cmp_attr = function _cmp_attr(a, b, attr) {
    if (a[attr] > b[attr]) return 1;
    if (a[attr] < b[attr]) return -1;
    return 0;
  };

  ICAL.icaltime._days_in_year_passed_month = [
    [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365],
    [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366]
  ];


  ICAL.icaltime.SUNDAY = 1;
  ICAL.icaltime.MONDAY = 2;
  ICAL.icaltime.TUESDAY = 3;
  ICAL.icaltime.WEDNESDAY = 4;
  ICAL.icaltime.THURSDAY = 5;
  ICAL.icaltime.FRIDAY = 6;
  ICAL.icaltime.SATURDAY = 7;

  ICAL.icaltime.DEFAULT_WEEK_START = ICAL.icaltime.MONDAY;
})();
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */



(typeof(ICAL) === 'undefined')? ICAL = {} : '';
(function() {

  var DOW_MAP = {
    SU: ICAL.icaltime.SUNDAY,
    MO: ICAL.icaltime.MONDAY,
    TU: ICAL.icaltime.TUESDAY,
    WE: ICAL.icaltime.WEDNESDAY,
    TH: ICAL.icaltime.THURSDAY,
    FR: ICAL.icaltime.FRIDAY,
    SA: ICAL.icaltime.SATURDAY
  };

  var REVERSE_DOW_MAP = {};

  for (var key in DOW_MAP) {
    REVERSE_DOW_MAP[DOW_MAP[key]] = key;
  }

  ICAL.icalrecur = function icalrecur(data) {
    this.wrappedJSObject = this;
    this.parts = {};
    this.fromData(data);
  };

  ICAL.icalrecur.prototype = {

    parts: null,

    interval: 1,
    wkst: ICAL.icaltime.MONDAY,
    until: null,
    count: null,
    freq: null,
    icalclass: "icalrecur",
    icaltype: "recur",

    iterator: function(aStart) {
      return new ICAL.icalrecur_iterator({
        rule: this,
        dtstart: aStart
      });
    },

    clone: function clone() {
      return ICAL.icalrecur.fromData(this);
      //return ICAL.icalrecur.fromIcalProperty(this.toIcalProperty());
    },

    isFinite: function isfinite() {
      return !!(this.count || this.until);
    },

    isByCount: function isbycount() {
      return !!(this.count && !this.until);
    },

    addComponent: function addPart(aType, aValue) {
      if (!(aType in this.parts)) {
        this.parts[aType] = [aValue];
      } else {
        this.parts[aType].push(aValue);
      }
    },

    setComponent: function setComponent(aType, aValues) {
      this.parts[aType] = aValues;
    },

    getComponent: function getComponent(aType, aCount) {
      var ucName = aType.toUpperCase();
      var components = (ucName in this.parts ? this.parts[ucName] : []);

      if (aCount) aCount.value = components.length;
      return components;
    },

    getNextOccurrence: function getNextOccurrence(aStartTime, aRecurrenceId) {
      ICAL.helpers.dumpn("GNO: " + aRecurrenceId + " / " + aStartTime);
      var iter = this.iterator(aStartTime);
      var next, cdt;

      do {
        next = iter.next();
        ICAL.helpers.dumpn("Checking " + next + " <= " + aRecurrenceId);
      } while (next && next.compare(aRecurrenceId) <= 0);

      if (next && aRecurrenceId.zone) {
        next.zone = aRecurrenceId.zone;
      }

      return next;
    },

    toJSON: function() {
      //XXX: extract this list up to proto?
      var propsToCopy = [
        "freq",
        "count",
        "until",
        "wkst",
        "interval",
        "parts"
      ];

      var result = Object.create(null);

      var i = 0;
      var len = propsToCopy.length;
      var prop;

      for (; i < len; i++) {
        var prop = propsToCopy[i];
        result[prop] = this[prop];
      }

      if (result.until instanceof ICAL.icaltime) {
        result.until = result.until.toJSON();
      }

      return result;
    },

    fromData: function fromData(aData) {
      var propsToCopy = ["freq", "count", "until", "wkst", "interval"];
      for (var key in propsToCopy) {
        var prop = propsToCopy[key];
        if (aData && prop.toUpperCase() in aData) {
          this[prop] = aData[prop.toUpperCase()];
          // TODO casing sucks, fix the parser!
        } else if (aData && prop in aData) {
          this[prop] = aData[prop];
          // TODO casing sucks, fix the parser!
        }
      }

      // wkst is usually in SU, etc.. format we need
      // to convert it from the string
      if (typeof(this.wkst) === 'string') {
        this.wkst = ICAL.icalrecur.icalDayToNumericDay(this.wkst);
      }

      // Another hack for multiple construction of until value.
      if (this.until) {
        if (this.until instanceof ICAL.icaltime) {
          this.until = this.until.clone();
        } else {
          this.until = ICAL.icaltime.fromData(this.until);
        }
      }

      var partsToCopy = ["BYSECOND", "BYMINUTE", "BYHOUR", "BYDAY",
                         "BYMONTHDAY", "BYYEARDAY", "BYWEEKNO",
                         "BYMONTH", "BYSETPOS"];
      this.parts = {};
      if (aData) {
        for (var key in partsToCopy) {
          var prop = partsToCopy[key];
          if (prop in aData) {
            this.parts[prop] = aData[prop];
            // TODO casing sucks, fix the parser!
          }
        }
        // TODO oh god, make it go away!
        if (aData.parts) {
          for (var key in partsToCopy) {
            var prop = partsToCopy[key];
            if (prop in aData.parts) {
              this.parts[prop] = aData.parts[prop];
              // TODO casing sucks, fix the parser!
            }
          }
        }
      }
      return this;
    },

    toString: function icalrecur_toString() {
      // TODO retain order
      var str = "FREQ=" + this.freq;
      if (this.count) {
        str += ";COUNT=" + this.count;
      }
      if (this.interval != 1) {
        str += ";INTERVAL=" + this.interval;
      }
      for (var k in this.parts) {
        str += ";" + k + "=" + this.parts[k];
      }
      if (this.until ){
        str += ';UNTIL=' + this.until.toString();
      }
      if ('wkst' in this && this.wkst !== ICAL.icaltime.DEFAULT_WEEK_START) {
        str += ';WKST=' + REVERSE_DOW_MAP[this.wkst];
      }
      return str;
    },

    toIcalProperty: function toIcalProperty() {
      try {
        var valueData = {
          name: this.isNegative ? "EXRULE" : "RRULE",
          type: "RECUR",
          value: [this.toString()]
          // TODO more props?
        };
        return ICAL.Property.fromData(valueData);
      } catch (e) {
        ICAL.helpers.dumpn("EICALPROP: " + this.toString() + "//" + e);
        ICAL.helpers.dumpn(e.stack);
        return null;
      }

      return null;
    },

    fromIcalProperty: function fromIcalProperty(aProp) {
      var propval = aProp.getFirstValue();
      this.fromData(propval);
      this.parts = ICAL.helpers.clone(propval.parts, true);
      if (aProp.name == "EXRULE") {
        this.isNegative = true;
      } else if (aProp.name == "RRULE") {
        this.isNegative = false;
      } else {
        throw new Error("Invalid Property " + aProp.name + " passed");
      }
    }
  };

  ICAL.icalrecur.fromData = function icalrecur_fromData(data) {
    return (new ICAL.icalrecur(data));
  }

  ICAL.icalrecur.fromString = function icalrecur_fromString(str) {
    var data = ICAL.DecorationParser.parseValue(str, "recur");
    return ICAL.icalrecur.fromData(data);
  };

  ICAL.icalrecur.fromIcalProperty = function icalrecur_fromIcalProperty(prop) {
    var recur = new ICAL.icalrecur();
    recur.fromIcalProperty(prop);
    return recur;
  };

  /**
   * Convert an ical representation of a day (SU, MO, etc..)
   * into a numeric value of that day.
   *
   * @param {String} day ical day.
   * @return {Numeric} numeric value of given day.
   */
  ICAL.icalrecur.icalDayToNumericDay = function toNumericDay(string) {
    //XXX: this is here so we can deal
    //     with possibly invalid string values.

    return DOW_MAP[string];
  };

})();
ICAL.icalrecur_iterator = (function() {

  /**
   * Options:
   *  - rule: (ICAL.icalrecur) instance
   *  - dtstart: (ICAL.icaltime) start date of recurrence rule
   *  - initialized: (Boolean) when true will assume options
   *                           are from previously constructed
   *                           iterator and will not re-initialize
   *                           iterator but resume its state from given data.
   *
   *  - by_data: (for iterator de-serialization)
   *  - days: "
   *  - last: "
   *  - by_indices: "
   */
  function icalrecur_iterator(options) {
    this.fromData(options);
  }

  icalrecur_iterator.prototype = {

    /**
     * True when iteration is finished.
     */
    completed: false,

    rule: null,
    dtstart: null,
    last: null,
    occurrence_number: 0,
    by_indices: null,
    initialized: false,
    by_data: null,

    days: null,
    days_index: 0,

    fromData: function(options) {
      this.rule = ICAL.helpers.formatClassType(options.rule, ICAL.icalrecur);

      if (!this.rule) {
        throw new Error('iterator requires a (ICAL.icalrecur) rule');
      }

      this.dtstart = ICAL.helpers.formatClassType(options.dtstart, ICAL.icaltime);

      if (!this.dtstart) {
        throw new Error('iterator requires a (ICAL.icaltime) dtstart');
      }

      if (options.by_data) {
        this.by_data = options.by_data;
      } else {
        this.by_data = ICAL.helpers.clone(this.rule.parts, true);
      }

      if (options.occurrence_number)
        this.occurrence_number = options.occurrence_number;

      this.days = options.days || [];
      this.last = ICAL.helpers.formatClassType(options.last, ICAL.icaltime);

      this.by_indices = options.by_indices;

      if (!this.by_indices) {
        this.by_indices = {
          "BYSECOND": 0,
          "BYMINUTE": 0,
          "BYHOUR": 0,
          "BYDAY": 0,
          "BYMONTH": 0,
          "BYWEEKNO": 0,
          "BYMONTHDAY": 0
        };
      }

      this.initialized = options.initialized || false;

      if (!this.initialized) {
        this.init();
      }
    },

    init: function icalrecur_iterator_init() {
      this.initialized = true;
      this.last = this.dtstart.clone();
      var parts = this.by_data;

      if ("BYDAY" in parts) {
        // libical does this earlier when the rule is loaded, but we postpone to
        // now so we can preserve the original order.
        this.sort_byday_rules(parts.BYDAY, this.rule.wkst);
      }

      // If the BYYEARDAY appares, no other date rule part may appear
      if ("BYYEARDAY" in parts) {
        if ("BYMONTH" in parts || "BYWEEKNO" in parts ||
            "BYMONTHDAY" in parts || "BYDAY" in parts) {
          throw new Error("Invalid BYYEARDAY rule");
        }
      }

      // BYWEEKNO and BYMONTHDAY rule parts may not both appear
      if ("BYWEEKNO" in parts && "BYMONTHDAY" in parts) {
        throw new Error("BYWEEKNO does not fit to BYMONTHDAY");
      }

      // For MONTHLY recurrences (FREQ=MONTHLY) neither BYYEARDAY nor
      // BYWEEKNO may appear.
      if (this.rule.freq == "MONTHLY" &&
          ("BYYEARDAY" in parts || "BYWEEKNO" in parts)) {
        throw new Error("For MONTHLY recurrences neither BYYEARDAY nor BYWEEKNO may appear");
      }

      // For WEEKLY recurrences (FREQ=WEEKLY) neither BYMONTHDAY nor
      // BYYEARDAY may appear.
      if (this.rule.freq == "WEEKLY" &&
          ("BYYEARDAY" in parts || "BYMONTHDAY" in parts)) {
        throw new Error("For WEEKLY recurrences neither BYMONTHDAY nor BYYEARDAY may appear");
      }

      // BYYEARDAY may only appear in YEARLY rules
      if (this.rule.freq != "YEARLY" && "BYYEARDAY" in parts) {
        throw new Error("BYYEARDAY may only appear in YEARLY rules");
      }

      this.last.second = this.setup_defaults("BYSECOND", "SECONDLY", this.dtstart.second);
      this.last.minute = this.setup_defaults("BYMINUTE", "MINUTELY", this.dtstart.minute);
      this.last.hour = this.setup_defaults("BYHOUR", "HOURLY", this.dtstart.hour);
      this.last.day = this.setup_defaults("BYMONTHDAY", "DAILY", this.dtstart.day);
      this.last.month = this.setup_defaults("BYMONTH", "MONTHLY", this.dtstart.month);

      if (this.rule.freq == "WEEKLY") {
        if ("BYDAY" in parts) {
          var parts = this.ruleDayOfWeek(parts.BYDAY[0]);
          var pos = parts[0];
          var rule_dow = parts[1];
          var dow = rule_dow - this.last.dayOfWeek();
          if ((this.last.dayOfWeek() < rule_dow && dow >= 0) || dow < 0) {
            // Initial time is after first day of BYDAY data
            this.last.day += dow;
            this.last.normalize();
          }
        } else {
          var wkMap = icalrecur_iterator._wkdayMap[this.dtstart.dayOfWeek()];
          parts.BYDAY = [wkMap];
        }
      }

      if (this.rule.freq == "YEARLY") {
        for (;;) {
          this.expand_year_days(this.last.year);
          if (this.days.length > 0) {
            break;
          }
          this.increment_year(this.rule.interval);
        }

        var next = ICAL.icaltime.fromDayOfYear(this.days[0], this.last.year);

        this.last.day = next.day;
        this.last.month = next.month;
      }

      if (this.rule.freq == "MONTHLY" && this.has_by_data("BYDAY")) {

        var coded_day = this.by_data.BYDAY[this.by_indices.BYDAY];
        var parts = this.ruleDayOfWeek(coded_day);
        var pos = parts[0];
        var dow = parts[1];

        var daysInMonth = ICAL.icaltime.daysInMonth(this.last.month, this.last.year);
        var poscount = 0;

        if (pos >= 0) {
          for (this.last.day = 1; this.last.day <= daysInMonth; this.last.day++) {
            if (this.last.dayOfWeek() == dow) {
              if (++poscount == pos || pos == 0) {
                break;
              }
            }
          }
        } else {
          pos = -pos;
          for (this.last.day = daysInMonth; this.last.day != 0; this.last.day--) {
            if (this.last.dayOfWeek() == dow) {
              if (++poscount == pos) {
                break;
              }
            }
          }
        }

        //XXX: This feels like a hack, but we need to initialize
        //     the BYMONTHDAY case correctly and byDayAndMonthDay handles
        //     this case. It accepts a special flag which will avoid incrementing
        //     the initial value without the flag days that match the start time
        //     would be missed.
        if (this.has_by_data('BYMONTHDAY')) {
          this._byDayAndMonthDay(true);
        }

        if (this.last.day > daysInMonth || this.last.day == 0) {
          throw new Error("Malformed values in BYDAY part");
        }

      } else if (this.has_by_data("BYMONTHDAY")) {
        if (this.last.day < 0) {
          var daysInMonth = ICAL.icaltime.daysInMonth(this.last.month, this.last.year);
          this.last.day = daysInMonth + this.last.day + 1;
        }

        this.last.normalize();
      }
    },

    next: function icalrecur_iterator_next() {
      var before = (this.last ? this.last.clone() : null);

      if ((this.rule.count && this.occurrence_number >= this.rule.count) ||
          (this.rule.until && this.last.compare(this.rule.until) > 0)) {

        //XXX: right now this is just a flag and has no impact
        //     we can simplify the above case to check for completed later.
        this.completed = true;

        return null;
      }

      if (this.occurrence_number == 0 && this.last.compare(this.dtstart) >= 0) {
        // First of all, give the instance that was initialized
        this.occurrence_number++;
        return this.last;
      }

      do {
        var valid = 1;

        switch (this.rule.freq) {
        case "SECONDLY":
          this.next_second();
          break;
        case "MINUTELY":
          this.next_minute();
          break;
        case "HOURLY":
          this.next_hour();
          break;
        case "DAILY":
          this.next_day();
          break;
        case "WEEKLY":
          this.next_week();
          break;
        case "MONTHLY":
          valid = this.next_month();
          break;
        case "YEARLY":
          this.next_year();
          break;

        default:
          return null;
        }
      } while (!this.check_contracting_rules() ||
               this.last.compare(this.dtstart) < 0 ||
               !valid);

      // TODO is this valid?
      if (this.last.compare(before) == 0) {
        throw new Error("Same occurrence found twice, protecting " +
                        "you from death by recursion");
      }

      if (this.rule.until && this.last.compare(this.rule.until) > 0) {
        this.completed = true;
        return null;
      } else {
        this.occurrence_number++;
        return this.last;
      }
    },

    next_second: function next_second() {
      return this.next_generic("BYSECOND", "SECONDLY", "second", "minute");
    },

    increment_second: function increment_second(inc) {
      return this.increment_generic(inc, "second", 60, "minute");
    },

    next_minute: function next_minute() {
      return this.next_generic("BYMINUTE", "MINUTELY",
                               "minute", "hour", "next_second");
    },

    increment_minute: function increment_minute(inc) {
      return this.increment_generic(inc, "minute", 60, "hour");
    },

    next_hour: function next_hour() {
      return this.next_generic("BYHOUR", "HOURLY", "hour",
                               "monthday", "next_minute");
    },

    increment_hour: function increment_hour(inc) {
      this.increment_generic(inc, "hour", 24, "monthday");
    },

    next_day: function next_day() {
      var has_by_day = ("BYDAY" in this.by_data);
      var this_freq = (this.rule.freq == "DAILY");

      if (this.next_hour() == 0) {
        return 0;
      }

      if (this_freq) {
        this.increment_monthday(this.rule.interval);
      } else {
        this.increment_monthday(1);
      }

      return 0;
    },

    next_week: function next_week() {
      var end_of_data = 0;

      if (this.next_weekday_by_week() == 0) {
        return end_of_data;
      }

      if (this.has_by_data("BYWEEKNO")) {
        var idx = ++this.by_indices.BYWEEKNO;

        if (this.by_indices.BYWEEKNO == this.by_data.BYWEEKNO.length) {
          this.by_indices.BYWEEKNO = 0;
          end_of_data = 1;
        }

        // HACK should be first month of the year
        this.last.month = 1;
        this.last.day = 1;

        var week_no = this.by_data.BYWEEKNO[this.by_indices.BYWEEKNO];

        this.last.day += 7 * week_no;
        this.last.normalize();

        if (end_of_data) {
          this.increment_year(1);
        }
      } else {
        // Jump to the next week
        this.increment_monthday(7 * this.rule.interval);
      }

      return end_of_data;
    },

    /**
     * normalize each by day rule for a given year/month.
     * Takes into account ordering and negative rules
     *
     * @param {Numeric} year current year.
     * @param {Numeric} month current month.
     * @param {Array} rules array of rules.
     *
     * @return {Array} sorted and normalized rules.
     *                 Negative rules will be expanded to their
     *                 correct positive values for easier processing.
     */
    normalizeByMonthDayRules: function(year, month, rules) {
      var daysInMonth = ICAL.icaltime.daysInMonth(month, year);

      // XXX: This is probably bad for performance to allocate
      //      a new array for each month we scan, if possible
      //      we should try to optimize this...
      var newRules = [];

      var ruleIdx = 0;
      var len = rules.length;
      var rule;

      for (; ruleIdx < len; ruleIdx++) {
        rule = rules[ruleIdx];

        // if this rule falls outside of given
        // month discard it.
        if (Math.abs(rule) > daysInMonth) {
          continue;
        }

        // negative case
        if (rule < 0) {
          // we add (not subtract its a negative number)
          // one from the rule because 1 === last day of month
          rule = daysInMonth + (rule + 1);
        } else if (rule === 0) {
          // skip zero its invalid.
          continue;
        }

        // only add unique items...
        if (newRules.indexOf(rule) === -1) {
          newRules.push(rule);
        }

      }

      // unique and sort
      return newRules.sort();
    },

    /**
     * NOTES:
     * We are given a list of dates in the month (BYMONTHDAY) (23, etc..)
     * Also we are given a list of days (BYDAY) (MO, 2SU, etc..) when
     * both conditions match a given date (this.last.day) iteration stops.
     *
     * @param {Boolean} [isInit] when given true will not
     *                           increment the current day (this.last).
     */
    _byDayAndMonthDay: function(isInit) {
     var byMonthDay; // setup in initMonth
      var byDay = this.by_data.BYDAY;

      var date;
      var dateIdx = 0;
      var dateLen; // setup in initMonth
      var dayIdx = 0;
      var dayLen = byDay.length;

      // we are not valid by default
      var dataIsValid = 0;

      var daysInMonth;
      var self = this;

      function initMonth() {
        daysInMonth = ICAL.icaltime.daysInMonth(
          self.last.month, self.last.year
        );

        byMonthDay = self.normalizeByMonthDayRules(
          self.last.year,
          self.last.month,
          self.by_data.BYMONTHDAY
        );

        dateLen = byMonthDay.length;
      }

      function nextMonth() {
        self.last.day = 1;
        self.increment_month();
        initMonth();

        dateIdx = 0;
        dayIdx = 0;
      }

      initMonth();

      // should come after initMonth
      if (isInit) {
        this.last.day -= 1;
      }

      while (!dataIsValid) {
        // find next date
        var next = byMonthDay[dateIdx++];

        // increment the current date. This is really
        // important otherwise we may fall into the infinite
        // loop trap. The initial date takes care of the case
        // where the current date is the date we are looking
        // for.
        date = this.last.day + 1;

        if (date > daysInMonth) {
          nextMonth();
          continue;
        }

        // after verify that the next date
        // is in the current month we can increment
        // it permanently.
        this.last.day = date;

        // this logic is dependant on the BYMONTHDAYS
        // being in order (which is done by #normalizeByMonthDayRules)
        if (next >= this.last.day) {
          // if the next month day is in the future jump to it.
          this.last.day = next;
        } else {
          // in this case the 'next' monthday has past
          // we must move to the month.
          nextMonth();
          continue;
        }

        // Now we can loop through the day rules to see
        // if one matches the current month date.
        for (dayIdx = 0; dayIdx < dayLen; dayIdx++) {
          var parts = this.ruleDayOfWeek(byDay[dayIdx]);
          var pos = parts[0];
          var dow = parts[1];

          if (this.last.isNthWeekDay(dow, pos)) {
            // when we find the valid one we can mark
            // the conditions as met and break the loop.
            // (Because we have this condition above
            //  it will also break the parent loop).
            dataIsValid = 1;
            break;
          }
        }

        // Its completely possible that the combination
        // cannot be matched in the current month.
        // When we reach the end of possible combinations
        // in the current month we iterate to the next one.
        if (!dataIsValid && dateIdx === (dateLen - 1)) {
          nextMonth();
          continue;
        }
      }

      return dataIsValid;
    },

    next_month: function next_month() {
      var this_freq = (this.rule.freq == "MONTHLY");
      var data_valid = 1;

      if (this.next_hour() == 0) {
        return data_valid;
      }

      if (this.has_by_data("BYDAY") && this.has_by_data("BYMONTHDAY")) {
        data_valid = this._byDayAndMonthDay();
      } else if (this.has_by_data("BYDAY")) {
        var daysInMonth = ICAL.icaltime.daysInMonth(this.last.month, this.last.year);
        var setpos = 0;

        if (this.has_by_data("BYSETPOS")) {
          var last_day = this.last.day;
          for (var day = 1; day <= daysInMonth; day++) {
            this.last.day = day;
            if (this.is_day_in_byday(this.last) && day <= last_day) {
              setpos++;
            }
          }
          this.last.day = last_day;
        }

        for (var day = this.last.day + 1; day <= daysInMonth; day++) {
          this.last.day = day;

          if (this.is_day_in_byday(this.last)) {
            if (!this.has_by_data("BYSETPOS") ||
                this.check_set_position(++setpos) ||
                this.check_set_position(setpos - this.by_data.BYSETPOS.length - 1)) {

              data_valid = 1;
              break;
            }
          }
        }

        if (day > daysInMonth) {
          this.last.day = 1;
          this.increment_month();

          if (this.is_day_in_byday(this.last)) {
            if (!this.has_by_data("BYSETPOS") || this.check_set_position(1)) {
              data_valid = 1;
            }
          } else {
            data_valid = 0;
          }
        }
      } else if (this.has_by_data("BYMONTHDAY")) {
        this.by_indices.BYMONTHDAY++;

        if (this.by_indices.BYMONTHDAY >= this.by_data.BYMONTHDAY.length) {
          this.by_indices.BYMONTHDAY = 0;
          this.increment_month();
        }

        var daysInMonth = ICAL.icaltime.daysInMonth(this.last.month, this.last.year);

        var day = this.by_data.BYMONTHDAY[this.by_indices.BYMONTHDAY];

        if (day < 0) {
          day = daysInMonth + day + 1;
        }

        if (day > daysInMonth) {
          this.last.day = 1;
          data_valid = this.is_day_in_byday(this.last);
        }

        this.last.day = day;
      } else {
        this.last.day = this.by_data.BYMONTHDAY[0];
        this.increment_month();
        var daysInMonth = ICAL.icaltime.daysInMonth(this.last.month, this.last.year);
        this.last.day = Math.min(this.last.day, daysInMonth);
      }

      return data_valid;
    },

    next_weekday_by_week: function next_weekday_by_week() {
      var end_of_data = 0;

      if (this.next_hour() == 0) {
        return end_of_data;
      }

      if (!this.has_by_data("BYDAY")) {
        return 1;
      }

      for (;;) {
        var tt = new ICAL.icaltime();
        tt.auto_normalize = false;
        this.by_indices.BYDAY++;

        if (this.by_indices.BYDAY == this.by_data.BYDAY.length) {
          this.by_indices.BYDAY = 0;
          end_of_data = 1;
        }

        var coded_day = this.by_data.BYDAY[this.by_indices.BYDAY];
        var parts = this.ruleDayOfWeek(coded_day);
        var dow = parts[1];

        dow -= this.rule.wkst;
        if (dow < 0) {
          dow += 7;
        }

        tt.year = this.last.year;
        tt.month = this.last.month;
        tt.day = this.last.day;

        var startOfWeek = tt.start_doy_week(this.rule.wkst);

        if (dow + startOfWeek < 1) {
          // The selected date is in the previous year
          if (!end_of_data) {
            continue;
          }
        }

        var next = ICAL.icaltime.fromDayOfYear(startOfWeek + dow,
                                                  this.last.year);

        this.last.day = next.day;
        this.last.month = next.month;
        this.last.year = next.year;

        return end_of_data;
      }
    },

    next_year: function next_year() {

      if (this.next_hour() == 0) {
        return 0;
      }

      if (++this.days_index == this.days.length) {
        this.days_index = 0;
        do {
          this.increment_year(this.rule.interval);
          this.expand_year_days(this.last.year);
        } while (this.days.length == 0);
      }

      var next = ICAL.icaltime.fromDayOfYear(this.days[this.days_index],
                                                this.last.year);

      this.last.day = next.day;
      this.last.month = next.month;

      return 1;
    },

    ruleDayOfWeek: function ruleDayOfWeek(dow) {
      var matches = dow.match(/([+-]?[0-9])?(MO|TU|WE|TH|FR|SA|SU)/);
      if (matches) {
        var pos = parseInt(matches[1] || 0, 10);
        dow = ICAL.icalrecur.icalDayToNumericDay(matches[2]);
        return [pos, dow];
      } else {
        return [0, 0];
      }
    },

    next_generic: function next_generic(aRuleType, aInterval, aDateAttr,
                                        aFollowingAttr, aPreviousIncr) {
      var has_by_rule = (aRuleType in this.by_data);
      var this_freq = (this.rule.freq == aInterval);
      var end_of_data = 0;

      if (aPreviousIncr && this[aPreviousIncr]() == 0) {
        return end_of_data;
      }

      if (has_by_rule) {
        this.by_indices[aRuleType]++;
        var idx = this.by_indices[aRuleType];
        var dta = this.by_data[aRuleType];

        if (this.by_indices[aRuleType] == dta.length) {
          this.by_indices[aRuleType] = 0;
          end_of_data = 1;
        }
        this.last[aDateAttr] = dta[this.by_indices[aRuleType]];
      } else if (this_freq) {
        this["increment_" + aDateAttr](this.rule.interval);
      }

      if (has_by_rule && end_of_data && this_freq) {
        this["increment_" + aFollowingAttr](1);
      }

      return end_of_data;
    },

    increment_monthday: function increment_monthday(inc) {
      for (var i = 0; i < inc; i++) {
        var daysInMonth = ICAL.icaltime.daysInMonth(this.last.month, this.last.year);
        this.last.day++;

        if (this.last.day > daysInMonth) {
          this.last.day -= daysInMonth;
          this.increment_month();
        }
      }
    },

    increment_month: function increment_month() {
      if (this.has_by_data("BYMONTH")) {
        this.by_indices.BYMONTH++;

        if (this.by_indices.BYMONTH == this.by_data.BYMONTH.length) {
          this.by_indices.BYMONTH = 0;
          this.increment_year(1);
        }

        this.last.month = this.by_data.BYMONTH[this.by_indices.BYMONTH];
      } else {
        var inc;
        if (this.rule.freq == "MONTHLY") {
          this.last.month += this.rule.interval;
        } else {
          this.last.month++;
        }

        this.last.month--;
        var years = ICAL.helpers.trunc(this.last.month / 12);
        this.last.month %= 12;
        this.last.month++;

        if (years != 0) {
          this.increment_year(years);
        }
      }
    },

    increment_year: function increment_year(inc) {
      this.last.year += inc;
    },

    increment_generic: function increment_generic(inc, aDateAttr,
                                                  aFactor, aNextIncrement) {
      this.last[aDateAttr] += inc;
      var nextunit = ICAL.helpers.trunc(this.last[aDateAttr] / aFactor);
      this.last[aDateAttr] %= aFactor;
      if (nextunit != 0) {
        this["increment_" + aNextIncrement](nextunit);
      }
    },

    has_by_data: function has_by_data(aRuleType) {
      return (aRuleType in this.rule.parts);
    },

    expand_year_days: function expand_year_days(aYear) {
      var t = new ICAL.icaltime();
      this.days = [];

      // We need our own copy with a few keys set
      var parts = {};
      var rules = ["BYDAY", "BYWEEKNO", "BYMONTHDAY", "BYMONTH", "BYYEARDAY"];
      for (var p in rules) {
        var part = rules[p];
        if (part in this.rule.parts) {
          parts[part] = this.rule.parts[part];
        }
      }

      if ("BYMONTH" in parts && "BYWEEKNO" in parts) {
        var valid = 1;
        var validWeeks = {};
        t.year = aYear;
        t.isDate = true;

        for (var monthIdx = 0; monthIdx < this.by_data.BYMONTH.length; monthIdx++) {
          var month = this.by_data.BYMONTH[monthIdx];
          t.month = month;
          t.day = 1;
          var first_week = t.week_number(this.rule.wkst);
          t.day = ICAL.icaltime.daysInMonth(month, aYear);
          var last_week = t.week_number(this.rule.wkst);
          for (monthIdx = first_week; monthIdx < last_week; monthIdx++) {
            validWeeks[monthIdx] = 1;
          }
        }

        for (var weekIdx = 0; weekIdx < this.by_data.BYWEEKNO.length && valid; weekIdx++) {
          var weekno = this.by_data.BYWEEKNO[weekIdx];
          if (weekno < 52) {
            valid &= validWeeks[weekIdx];
          } else {
            valid = 0;
          }
        }

        if (valid) {
          delete parts.BYMONTH;
        } else {
          delete parts.BYWEEKNO;
        }
      }

      var partCount = Object.keys(parts).length;

      if (partCount == 0) {
        var t = this.dtstart.clone();
        t.year = this.last.year;
        this.days.push(t.dayOfYear());
      } else if (partCount == 1 && "BYMONTH" in parts) {
        for (var monthkey in this.by_data.BYMONTH) {
          var t2 = this.dtstart.clone();
          t2.year = aYear;
          t2.month = this.by_data.BYMONTH[monthkey];
          t2.isDate = true;
          this.days.push(t2.dayOfYear());
        }
      } else if (partCount == 1 && "BYMONTHDAY" in parts) {
        for (var monthdaykey in this.by_data.BYMONTHDAY) {
          var t2 = this.dtstart.clone();
          t2.day = this.by_data.BYMONTHDAY[monthdaykey];
          t2.year = aYear;
          t2.isDate = true;
          this.days.push(t2.dayOfYear());
        }
      } else if (partCount == 2 &&
                 "BYMONTHDAY" in parts &&
                 "BYMONTH" in parts) {
        for (var monthkey in this.by_data.BYMONTH) {
          for (var monthdaykey in this.by_data.BYMONTHDAY) {
            t.day = this.by_data.BYMONTHDAY[monthdaykey];
            t.month = this.by_data.BYMONTH[monthkey];
            t.year = aYear;
            t.isDate = true;

            this.days.push(t.dayOfYear());
          }
        }
      } else if (partCount == 1 && "BYWEEKNO" in parts) {
        // TODO unimplemented in libical
      } else if (partCount == 2 &&
                 "BYWEEKNO" in parts &&
                 "BYMONTHDAY" in parts) {
        // TODO unimplemented in libical
      } else if (partCount == 1 && "BYDAY" in parts) {
        this.days = this.days.concat(this.expand_by_day(aYear));
      } else if (partCount == 2 && "BYDAY" in parts && "BYMONTH" in parts) {
        for (var monthkey in this.by_data.BYMONTH) {
          month = this.by_data.BYMONTH[monthkey];
          var daysInMonth = ICAL.icaltime.daysInMonth(month, aYear);

          t.year = aYear;
          t.month = this.by_data.BYMONTH[monthkey];
          t.day = 1;
          t.isDate = true;

          var first_dow = t.dayOfWeek();
          var doy_offset = t.dayOfYear() - 1;

          t.day = daysInMonth;
          var last_dow = t.dayOfWeek();

          if (this.has_by_data("BYSETPOS")) {
            var set_pos_counter = 0;
            var by_month_day = [];
            for (var day = 1; day <= daysInMonth; day++) {
              t.day = day;
              if (this.is_day_in_byday(t)) {
                by_month_day.push(day);
              }
            }

            for (var spIndex = 0; spIndex < by_month_day.length; spIndex++) {
              if (this.check_set_position(spIndex + 1) ||
                  this.check_set_position(spIndex - by_month_day.length)) {
                this.days.push(doy_offset + by_month_day[spIndex]);
              }
            }
          } else {
            for (var daycodedkey in this.by_data.BYDAY) {
              //TODO: This should return dates in order of occurrence
              //      (1,2,3, etc...) instead of by weekday (su, mo, etc..)
              var coded_day = this.by_data.BYDAY[daycodedkey];
              var parts = this.ruleDayOfWeek(coded_day);
              var pos = parts[0];
              var dow = parts[1];
              var month_day;

              var first_matching_day = ((dow + 7 - first_dow) % 7) + 1;
              var last_matching_day = daysInMonth - ((last_dow + 7 - dow) % 7);

              if (pos == 0) {
                for (var day = first_matching_day; day <= daysInMonth; day += 7) {
                  this.days.push(doy_offset + day);
                }
              } else if (pos > 0) {
                month_day = first_matching_day + (pos - 1) * 7;

                if (month_day <= daysInMonth) {
                  this.days.push(doy_offset + month_day);
                }
              } else {
                month_day = last_matching_day + (pos + 1) * 7;

                if (month_day > 0) {
                  this.days.push(doy_offset + month_day);
                }
              }
            }
          }
        }
      } else if (partCount == 2 && "BYDAY" in parts && "BYMONTHDAY" in parts) {
        var expandedDays = this.expand_by_day(aYear);

        for (var daykey in expandedDays) {
          var day = expandedDays[daykey];
          var tt = ICAL.icaltime.fromDayOfYear(day, aYear);
          if (this.by_data.BYMONTHDAY.indexOf(tt.day) >= 0) {
            this.days.push(day);
          }
        }
      } else if (partCount == 3 &&
                 "BYDAY" in parts &&
                 "BYMONTHDAY" in parts &&
                 "BYMONTH" in parts) {
        var expandedDays = this.expand_by_day(aYear);

        for (var daykey in expandedDays) {
          var day = expandedDays[daykey];
          var tt = ICAL.icaltime.fromDayOfYear(day, aYear);

          if (this.by_data.BYMONTH.indexOf(tt.month) >= 0 &&
              this.by_data.BYMONTHDAY.indexOf(tt.day) >= 0) {
            this.days.push(day);
          }
        }
      } else if (partCount == 2 && "BYDAY" in parts && "BYWEEKNO" in parts) {
        var expandedDays = this.expand_by_day(aYear);

        for (var daykey in expandedDays) {
          var day = expandedDays[daykey];
          var tt = ICAL.icaltime.fromDayOfYear(day, aYear);
          var weekno = tt.week_number(this.rule.wkst);

          if (this.by_data.BYWEEKNO.indexOf(weekno)) {
            this.days.push(day);
          }
        }
      } else if (partCount == 3 &&
                 "BYDAY" in parts &&
                 "BYWEEKNO" in parts &&
                 "BYMONTHDAY" in parts) {
        // TODO unimplemted in libical
      } else if (partCount == 1 && "BYYEARDAY" in parts) {
        this.days = this.days.concat(this.by_data.BYYEARDAY);
      } else {
        this.days = [];
      }
      return 0;
    },

    expand_by_day: function expand_by_day(aYear) {

      var days_list = [];
      var tmp = this.last.clone();

      tmp.year = aYear;
      tmp.month = 1;
      tmp.day = 1;
      tmp.isDate = true;

      var start_dow = tmp.dayOfWeek();

      tmp.month = 12;
      tmp.day = 31;
      tmp.isDate = true;

      var end_dow = tmp.dayOfWeek();
      var end_year_day = tmp.dayOfYear();

      for (var daykey in this.by_data.BYDAY) {
        var day = this.by_data.BYDAY[daykey];
        var parts = this.ruleDayOfWeek(day);
        var pos = parts[0];
        var dow = parts[1];

        if (pos == 0) {
          var tmp_start_doy = ((dow + 7 - start_dow) % 7) + 1;

          for (var doy = tmp_start_doy; doy <= end_year_day; doy += 7) {
            days_list.push(doy);
          }

        } else if (pos > 0) {
          var first;
          if (dow >= start_dow) {
            first = dow - start_dow + 1;
          } else {
            first = dow - start_dow + 8;
          }

          days_list.push(first + (pos - 1) * 7);
        } else {
          var last;
          pos = -pos;

          if (dow <= end_dow) {
            last = end_year_day - end_dow + dow;
          } else {
            last = end_year_day - end_dow + dow - 7;
          }

          days_list.push(last - (pos - 1) * 7);
        }
      }
      return days_list;
    },

    is_day_in_byday: function is_day_in_byday(tt) {
      for (var daykey in this.by_data.BYDAY) {
        var day = this.by_data.BYDAY[daykey];
        var parts = this.ruleDayOfWeek(day);
        var pos = parts[0];
        var dow = parts[1];
        var this_dow = tt.dayOfWeek();

        if ((pos == 0 && dow == this_dow) ||
            (tt.nthWeekDay(dow, pos) == tt.day)) {
          return 1;
        }
      }

      return 0;
    },

    /**
     * Checks if given value is in BYSETPOS.
     *
     * @param {Numeric} aPos position to check for.
     * @return {Boolean} false unless BYSETPOS rules exist
     *                   and the given value is present in rules.
     */
    check_set_position: function check_set_position(aPos) {
      if (this.has_by_data('BYSETPOS')) {
        var idx = this.by_data.BYSETPOS.indexOf(aPos);
        // negative numbers are not false-y
        return idx !== -1;
      }
      return false;
    },

    sort_byday_rules: function icalrecur_sort_byday_rules(aRules, aWeekStart) {
      for (var i = 0; i < aRules.length; i++) {
        for (var j = 0; j < i; j++) {
          var one = this.ruleDayOfWeek(aRules[j])[1];
          var two = this.ruleDayOfWeek(aRules[i])[1];
          one -= aWeekStart;
          two -= aWeekStart;
          if (one < 0) one += 7;
          if (two < 0) two += 7;

          if (one > two) {
            var tmp = aRules[i];
            aRules[i] = aRules[j];
            aRules[j] = tmp;
          }
        }
      }
    },

    check_contract_restriction: function check_contract_restriction(aRuleType, v) {
      var indexMapValue = icalrecur_iterator._indexMap[aRuleType];
      var ruleMapValue = icalrecur_iterator._expandMap[this.rule.freq][indexMapValue];
      var pass = false;

      if (aRuleType in this.by_data &&
          ruleMapValue == icalrecur_iterator.CONTRACT) {

        var ruleType = this.by_data[aRuleType];

        for (var bydatakey in ruleType) {
          if (ruleType[bydatakey] == v) {
            pass = true;
            break;
          }
        }
      } else {
        // Not a contracting byrule or has no data, test passes
        pass = true;
      }
      return pass;
    },

    check_contracting_rules: function check_contracting_rules() {
      var dow = this.last.dayOfWeek();
      var weekNo = this.last.week_number(this.rule.wkst);
      var doy = this.last.dayOfYear();

      return (this.check_contract_restriction("BYSECOND", this.last.second) &&
              this.check_contract_restriction("BYMINUTE", this.last.minute) &&
              this.check_contract_restriction("BYHOUR", this.last.hour) &&
              this.check_contract_restriction("BYDAY", icalrecur_iterator._wkdayMap[dow]) &&
              this.check_contract_restriction("BYWEEKNO", weekNo) &&
              this.check_contract_restriction("BYMONTHDAY", this.last.day) &&
              this.check_contract_restriction("BYMONTH", this.last.month) &&
              this.check_contract_restriction("BYYEARDAY", doy));
    },

    setup_defaults: function setup_defaults(aRuleType, req, deftime) {
      var indexMapValue = icalrecur_iterator._indexMap[aRuleType];
      var ruleMapValue = icalrecur_iterator._expandMap[this.rule.freq][indexMapValue];

      if (ruleMapValue != icalrecur_iterator.CONTRACT) {
        if (!(aRuleType in this.by_data)) {
          this.by_data[aRuleType] = [deftime];
        }
        if (this.rule.freq != req) {
          return this.by_data[aRuleType][0];
        }
      }
      return deftime;
    },

    /**
     * Convert iterator into a serialize-able object.
     * Will preserve current iteration sequence to ensure
     * the seamless continuation of the recurrence rule.
     */
    toJSON: function() {
      var result = Object.create(null);

      result.initialized = this.initialized;
      result.rule = this.rule.toJSON();
      result.dtstart = this.dtstart.toJSON();
      result.by_data = this.by_data;
      result.days = this.days;
      result.last = this.last.toJSON();
      result.by_indices = this.by_indices;
      result.occurrence_number = this.occurrence_number;

      return result;
    }

  };

  icalrecur_iterator._wkdayMap = ["", "SU", "MO", "TU", "WE", "TH", "FR", "SA"];

  icalrecur_iterator._indexMap = {
    "BYSECOND": 0,
    "BYMINUTE": 1,
    "BYHOUR": 2,
    "BYDAY": 3,
    "BYMONTHDAY": 4,
    "BYYEARDAY": 5,
    "BYWEEKNO": 6,
    "BYMONTH": 7,
    "BYSETPOS": 8
  };

  icalrecur_iterator._expandMap = {
    "SECONDLY": [1, 1, 1, 1, 1, 1, 1, 1],
    "MINUTELY": [2, 1, 1, 1, 1, 1, 1, 1],
    "HOURLY": [2, 2, 1, 1, 1, 1, 1, 1],
    "DAILY": [2, 2, 2, 1, 1, 1, 1, 1],
    "WEEKLY": [2, 2, 2, 2, 3, 3, 1, 1],
    "MONTHLY": [2, 2, 2, 2, 2, 3, 3, 1],
    "YEARLY": [2, 2, 2, 2, 2, 2, 2, 2]
  };
  icalrecur_iterator.UNKNOWN = 0;
  icalrecur_iterator.CONTRACT = 1;
  icalrecur_iterator.EXPAND = 2;
  icalrecur_iterator.ILLEGAL = 3;

  return icalrecur_iterator;

}());
ICAL.RecurExpansion = (function() {
  function formatTime(item) {
    return ICAL.helpers.formatClassType(item, ICAL.icaltime);
  }

  function compareTime(a, b) {
    return a.compare(b);
  }

  function isRecurringComponent(comp) {
    return comp.hasProperty('rdate') ||
           comp.hasProperty('rrule') ||
           comp.hasProperty('recurrence-id');
  }

  /**
   * Primary class for expanding recurring rules.
   * Can take multiple rrules, rdates, exdate(s)
   * and iterate (in order) over each next occurrence.
   *
   * Once initialized this class can also be serialized
   * saved and continue iteration from the last point.
   *
   * NOTE: it is intended that this class is to be used
   *       with ICAL.Event which handles recurrence exceptions.
   *
   * Options:
   *  - dtstart: (ICAL.icaltime) start time of event (required)
   *  - component: (ICAL.Component) component (required unless resuming)
   *
   * Examples:
   *
   *    // assuming event is a parsed ical component
   *    var event;
   *
   *    var expand = new ICAL.RecurExpansion({
   *      component: event,
   *      start: event.getFirstPropertyValue('DTSTART')
   *    });
   *
   *    // remember there are infinite rules
   *    // so its a good idea to limit the scope
   *    // of the iterations then resume later on.
   *
   *    // next is always an ICAL.icaltime or null
   *    var next;
   *
   *    while(someCondition && (next = expand.next())) {
   *      // do something with next
   *    }
   *
   *    // save instance for later
   *    var json = JSON.stringify(expand);
   *
   *    //...
   *
   *    // NOTE: if the component's properties have
   *    //       changed you will need to rebuild the
   *    //       class and start over. This only works
   *    //       when the component's recurrence info is the same.
   *    var expand = new ICAL.RecurExpansion(JSON.parse(json));
   *
   *
   * @param {Object} options see options block.
   */
  function RecurExpansion(options) {
    this.ruleDates = [];
    this.exDates = [];
    this.fromData(options);
  }

  RecurExpansion.prototype = {

    /**
     * True when iteration is fully completed.
     */
    complete: false,

    /**
     * Array of rrule iterators.
     *
     * @type Array[ICAL.icalrecur_iterator]
     * @private
     */
    ruleIterators: null,

    /**
     * Array of rdate instances.
     *
     * @type Array[ICAL.icaltime]
     * @private
     */
    ruleDates: null,

    /**
     * Array of exdate instances.
     *
     * @type Array[ICAL.icaltime]
     * @private
     */
    exDates: null,

    /**
     * Current position in ruleDates array.
     * @type Numeric
     * @private
     */
    ruleDateInc: 0,

    /**
     * Current position in exDates array
     * @type Numeric
     * @private
     */
    exDateInc: 0,

    /**
     * Current negative date.
     *
     * @type ICAL.icaltime
     * @private
     */
    exDate: null,

    /**
     * Current additional date.
     *
     * @type ICAL.icaltime
     * @private
     */
    ruleDate: null,

    /**
     * Start date of recurring rules.
     *
     * @type ICAL.icaltime
     */
    dtstart: null,

    /**
     * Last expanded time
     *
     * @type ICAL.icaltime
     */
    last: null,

    fromData: function(options) {
      var start = ICAL.helpers.formatClassType(options.dtstart, ICAL.icaltime);

      if (!start) {
        throw new Error('.dtstart (ICAL.icaltime) must be given');
      } else {
        this.dtstart = start;
      }

      if (options.component) {
        this._init(options.component);
      } else {
        this.last = formatTime(options.last);

        this.ruleIterators = options.ruleIterators.map(function(item) {
          return ICAL.helpers.formatClassType(item, ICAL.icalrecur_iterator);
        });

        this.ruleDateInc = options.ruleDateInc;
        this.exDateInc = options.exDateInc;

        if (options.ruleDates) {
          this.ruleDates = options.ruleDates.map(formatTime);
          this.ruleDate = this.ruleDates[this.ruleDateInc];
        }

        if (options.exDates) {
          this.exDates = options.exDates.map(formatTime);
          this.exDate = this.exDates[this.exDateInc];
        }

        if (typeof(options.complete) !== 'undefined') {
          this.complete = options.complete;
        }
      }
    },

    next: function() {
      var iter;
      var ruleOfDay;
      var next;
      var compare;

      var maxTries = 500;
      var currentTry = 0;

      while (true) {
        if (currentTry++ > maxTries) {
          throw new Error(
            'max tries have occured, rule may be impossible to forfill.'
          );
        }

        next = this.ruleDate;
        iter = this._nextRecurrenceIter(this.last);

        // no more matches
        // because we increment the rule day or rule
        // _after_ we choose a value this should be
        // the only spot where we need to worry about the
        // end of events.
        if (!next && !iter) {
          // there are no more iterators or rdates
          this.complete = true;
          break;
        }

        // no next rule day or recurrence rule is first.
        if (!next || (iter && next.compare(iter.last) > 0)) {
          // must be cloned, recur will reuse the time element.
          next = iter.last.clone();
          // move to next so we can continue
          iter.next();
        }

        // if the ruleDate is still next increment it.
        if (this.ruleDate === next) {
          this._nextRuleDay();
        }

        this.last = next;

        // check the negative rules
        if (this.exDate) {
          compare = this.exDate.compare(this.last);

          if (compare < 0) {
            this._nextExDay();
          }

          // if the current rule is excluded skip it.
          if (compare === 0) {
            this._nextExDay();
            continue;
          }
        }

        //XXX: The spec states that after we resolve the final
        //     list of dates we execute exdate this seems somewhat counter
        //     intuitive to what I have seen most servers do so for now
        //     I exclude based on the original date not the one that may
        //     have been modified by the exception.
        return this.last;
      }
    },

    /**
     * Converts object into a serialize-able format.
     */
    toJSON: function() {
      function toJSON(item) {
        return item.toJSON();
      }

      var result = Object.create(null);
      result.ruleIterators = this.ruleIterators.map(toJSON);

      if (this.ruleDates) {
        result.ruleDates = this.ruleDates.map(toJSON);
      }

      if (this.exDates) {
        result.exDates = this.exDates.map(toJSON);
      }

      result.ruleDateInc = this.ruleDateInc;
      result.exDateInc = this.exDateInc;
      result.last = this.last.toJSON();
      result.dtstart = this.dtstart.toJSON();
      result.complete = this.complete;

      return result;
    },


    _extractDates: function(component, property) {
      var result = [];
      var props = component.getAllProperties(property);
      var len = props.length;
      var i = 0;
      var prop;

      var idx;

      for (; i < len; i++) {
        prop = props[i].getFirstValue();

        idx = ICAL.helpers.binsearchInsert(
          result,
          prop,
          compareTime
        );

        // ordered insert
        result.splice(idx, 0, prop);
      }

      return result;
    },

    _init: function(component) {
      this.ruleIterators = [];

      this.last = this.dtstart.clone();

      // to provide api consistency non-recurring
      // events can also use the iterator though it will
      // only return a single time.
      if (!isRecurringComponent(component)) {
        this.ruleDate = this.last.clone();
        this.complete = true;
        return;
      }

      if (component.hasProperty('rrule')) {
        var rules = component.getAllProperties('rrule');
        var i = 0;
        var len = rules.length;

        var rule;
        var iter;

        for (; i < len; i++) {
          rule = rules[i].getFirstValue();
          iter = rule.iterator(this.dtstart);
          this.ruleIterators.push(iter);

          // increment to the next occurrence so future
          // calls to next return times beyond the initial iteration.
          // XXX: I find this suspicious might be a bug?
          iter.next();
        }
      }

      if (component.hasProperty('rdate')) {
        this.ruleDates = this._extractDates(component, 'rdate');
        this.ruleDateInc = ICAL.helpers.binsearchInsert(
          this.ruleDates,
          this.last,
          compareTime
        );

        this.ruleDate = this.ruleDates[this.ruleDateInc];
      }

      if (component.hasProperty('exdate')) {
        this.exDates = this._extractDates(component, 'exdate');
        // if we have a .last day we increment the index to beyond it.
        this.exDateInc = ICAL.helpers.binsearchInsert(
          this.exDates,
          this.last,
          compareTime
        );

        this.exDate = this.exDates[this.exDateInc];
      }
    },

    _nextExDay: function() {
      this.exDate = this.exDates[++this.exDateInc];
    },

    _nextRuleDay: function() {
      this.ruleDate = this.ruleDates[++this.ruleDateInc];
    },

    /**
     * Find and return the recurrence rule with the most
     * recent event and return it.
     *
     * @return {Object} iterator.
     */
    _nextRecurrenceIter: function() {
      var iters = this.ruleIterators;

      if (iters.length === 0) {
        return null;
      }

      var len = iters.length;
      var iter;
      var iterTime;
      var iterIdx = 0;
      var chosenIter;

      // loop through each iterator
      for (; iterIdx < len; iterIdx++) {
        iter = iters[iterIdx];
        iterTime = iter.last;

        // if iteration is complete
        // then we must exclude it from
        // the search and remove it.
        if (iter.completed) {
          len--;
          if (iterIdx !== 0) {
            iterIdx--;
          }
          iters.splice(iterIdx, 1);
          continue;
        }

        // find the most recent possible choice
        if (!chosenIter || chosenIter.last.compare(iterTime) > 0) {
          // that iterator is saved
          chosenIter = iter;
        }
      }

      // the chosen iterator is returned but not mutated
      // this iterator contains the most recent event.
      return chosenIter;
    }

  };

  return RecurExpansion;

}());
ICAL.Event = (function() {

  function Event(component, options) {
    if (!(component instanceof ICAL.Component)) {
      options = component;
      component = null;
    }

    if (component) {
      this.component = component;
    } else {
      this.component = new ICAL.Component('vevent');
    }

    this.exceptions = Object.create(null);

    if (options && options.exceptions) {
      options.exceptions.forEach(this.relateException, this);
    }
  }

  Event.prototype = {

    /**
     * List of related event exceptions.
     *
     * @type Array[ICAL.Event]
     */
    exceptions: null,

    /**
     * Relates a given event exception to this object.
     * If the given component does not share the UID of
     * this event it cannot be related and will throw an
     * exception.
     *
     * If this component is an exception it cannot have other
     * exceptions related to it.
     *
     * @param {ICAL.Component|ICAL.Event} obj component or event.
     */
    relateException: function(obj) {
      if (this.isRecurrenceException()) {
        throw new Error('cannot relate exception to exceptions');
      }

      if (obj instanceof ICAL.Component) {
        obj = new ICAL.Event(obj);
      }

      if (obj.uid !== this.uid) {
        throw new Error('attempted to relate unrelated exception');
      }

      // we don't sort or manage exceptions directly
      // here the recurrence expander handles that.
      this.exceptions[obj.recurrenceId.toString()] = obj;
    },

    /**
     * Returns the occurrence details based on its start time.
     * If the occurrence has an exception will return the details
     * for that exception.
     *
     * NOTE: this method is intend to be used in conjunction
     *       with the #iterator method.
     *
     * @param {ICAL.icaltime} occurrence time occurrence.
     */
    getOccurrenceDetails: function(occurrence) {
      var id = occurrence.toString();
      var result = {
        //XXX: Clone?
        recurrenceId: occurrence
      };

      if (id in this.exceptions) {
        var item = result.item = this.exceptions[id];
        result.startDate = item.startDate;
        result.endDate = item.endDate;
        result.item = item;
      } else {
        var end = occurrence.clone();
        end.addDuration(this.duration);

        result.endDate = end;
        result.startDate = occurrence;
        result.item = this;
      }

      return result;
    },

    /**
     * Builds a recur expansion instance for a specific
     * point in time (defaults to startDate).
     *
     * @return {ICAL.RecurExpansion} expander object.
     */
    iterator: function(startTime) {
      return new ICAL.RecurExpansion({
        component: this.component,
        dtstart: startTime || this.startDate
      });
    },

    isRecurring: function() {
      var comp = this.component;
      return comp.hasProperty('rrule') || comp.hasProperty('rdate');
    },

    isRecurrenceException: function() {
      return this.component.hasProperty('recurrence-id');
    },

    /**
     * Returns the types of recurrences this event may have.
     *
     * Returned as an object with the following possible keys:
     *
     *    - YEARLY
     *    - MONTHLY
     *    - WEEKLY
     *    - DAILY
     *    - MINUTELY
     *    - SECONDLY
     *
     * @return {Object} object of recurrence flags.
     */
    getRecurrenceTypes: function() {
      var rules = this.component.getAllProperties('rrule');
      var i = 0;
      var len = rules.length;
      var result = Object.create(null);

      for (; i < len; i++) {
        var value = rules[i].getFirstValue();
        result[value.freq] = true;
      }

      return result;
    },

    get uid() {
      return this._firstProp('uid');
    },

    set uid(value) {
      this._setProp('uid', value);
    },

    get startDate() {
      return this._firstProp('dtstart');
    },

    set startDate(value) {
      this._setProp('dtstart', value);
    },

    get endDate() {
      return this._firstProp('dtend');
    },

    set endDate(value) {
      this._setProp('dtend', value);
    },

    get duration() {
      // cached because its dynamically calculated
      // and may be frequently used. This could be problematic
      // later if we modify the underlying start/endDate.
      //
      // When do add that functionality it should expire this cache...
      if (typeof(this._duration) === 'undefined') {
        this._duration = this.endDate.subtractDate(this.startDate);
      }
      return this._duration;
    },

    get location() {
      return this._firstProp('location');
    },

    set location(value) {
      return this._setProp('location', value);
    },

    get attendees() {
      //XXX: This is way lame we should have a better
      //     data structure for this later.
      return this.component.getAllProperties('attendee');
    },

    get summary() {
      return this._firstProp('summary');
    },

    set summary(value) {
      this._setProp('summary', value);
    },

    get description() {
      return this._firstProp('description');
    },

    set description(value) {
      this._setProp('description', value);
    },

    get organizer() {
      return this._firstProp('organizer');
    },

    set organizer(value) {
      this._setProp('organizer', value);
    },

    get sequence() {
      return this._firstProp('sequence');
    },

    set sequence(value) {
      this._setProp('sequence', value);
    },

    get recurrenceId() {
      return this._firstProp('recurrence-id');
    },

    set recurrenceId(value) {
      this._setProp('recurrence-id', value);
    },

    _setProp: function(name, value) {
      this.component.updatePropertyWithValue(name, value);
    },

    _firstProp: function(name) {
      return this.component.getFirstPropertyValue(name);
    },

    toString: function() {
      return this.component.toString();
    }

  };

  return Event;

}());
ICAL.ComponentParser = (function() {

  /**
   * Component parser initializer.
   *
   * Usage:
   *
   *    var options = {
   *      // when false no events will be emitted for type
   *      parseEvent: true,
   *      parseTimezone: true
   *    };
   *
   *    var parser = new ICAL.ComponentParser(options);
   *
   *    parser.onevent() {
   *      //...
   *    }
   *
   *    // ontimezone, etc...
   *
   *    parser.oncomplete = function() {
   *
   *    };
   *
   *    parser.process(string | component);
   *
   *
   * @param {Object} options component parser options.
   */
  function ComponentParser(options) {
    if (typeof(options) === 'undefined') {
      options = {};
    }

    var key;
    for (key in options) {
      if (options.hasOwnProperty(key)) {
        this[key] = options[key];
      }
    }
  }

  ComponentParser.prototype = {

    /**
     * When true parse events
     *
     * @type Boolean
     */
    parseEvent: true,

    /**
     * when true parse timezones
     *
     * @type Boolean
     */
    parseTimezone: true,


    /* SAX like events here for reference */

    /**
     * Fired when parsing is complete
     */
    oncomplete: function() {},

    /**
     * Fired if an error occurs during parsing.
     *
     * @param {Error} err details of error.
     */
    onerror: function(err) {},

    /**
     * Fired when a top level component (vtimezone) is found
     *
     * @param {ICAL.icaltimezone} timezone object.
     */
    ontimezone: function(component) {},

    /*
     * Fired when a top level component (VEVENT) is found.
     * @param {ICAL.Event} component top level component.
     */
    onevent: function(component) {},

    /**
     * Process a string or parse ical object.
     * This function itself will return nothing but
     * will start the parsing process.
     *
     * Events must be registered prior to calling this method.
     *
     * @param {String|Object} ical string or parsed ical object.
     */
    process: function(ical) {
      //TODO: this is sync now in the future we will have a incremental parser.
      if (typeof(ical) === 'string') {
        ical = ICAL.parse(ical)[1];
      }

      if (!(ical instanceof ICAL.Component)) {
        ical = new ICAL.Component(ical);
      }

      var components = ical.getAllSubcomponents();
      var i = 0;
      var len = components.length;
      var component;

      for (; i < len; i++) {
        component = components[i];

        switch (component.name) {
          case 'vevent':
            if (this.parseEvent) {
              this.onevent(new ICAL.Event(component));
            }
            break;
          default:
            continue;
        }
      }

      //XXX: ideally we should do a "nextTick" here
      //     so in all cases this is actually async.
      this.oncomplete();
    }
  };

  return ComponentParser;

}());
