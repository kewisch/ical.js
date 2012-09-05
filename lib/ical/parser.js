/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

// TODO validate known parameters
// TODO make sure all known types don't contain junk
// TODO tests for parsers
// TODO SAX type parser
// TODO structure data in components
// TODO enforce uppercase when parsing
// TODO optionally preserve value types that are default but explicitly set
// TODO floating timezone
(typeof(ICAL) === 'undefined')? ICAL = {} : '';
(function() {
  /* NOTE: I'm not sure this is the latest syntax...

     {
       X-WR-CALNAME: "test",
       components: {
         VTIMEZONE: { ... },
         VEVENT: {
             "uuid1": {
                 UID: "uuid1",
                 ...
                 components: {
                     VALARM: [
                         ...
                     ]
                 }
             }
         },
         VTODO: { ... }
       }
     }
     */

  // Exports

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

  var parser = {};
  ICAL.icalparser = parser;

  parser.lexContentLine = function lexContentLine(aState) {
    // contentline   = name *(";" param ) ":" value CRLF
    // The corresponding json object will be:
    // { name: "name", parameters: { key: "value" }, value: "value" }
    var lineData = {};

    // Parse the name
    lineData.name = parser.lexName(aState);

    // Read Paramaters, if there are any.
    if (aState.buffer.substr(0, 1) == ";") {
      lineData.parameters = {};
      while (aState.buffer.substr(0, 1) == ";") {
        aState.buffer = aState.buffer.substr(1);
        var param = parser.lexParam(aState);
        lineData.parameters[param.name] = param.value;
      }
    }

    // Read the value
    parser.expectRE(aState, /^:/, "Expected ':'");
    lineData.value = parser.lexValue(aState);
    parser.expectEnd(aState, "Junk at End of Line");
    return lineData;
  };

  parser.lexName = function lexName(aState) {
    function parseIanaToken(aState) {
      var match = parser.expectRE(aState, /^([A-Za-z0-9-]+)/,
                                  "Expected IANA Token");
      return match[1];
    }

    function parseXName(aState) {
      var error = "Expected XName";
      var value = "X-";
      var match = parser.expectRE(aState, /^X-/, error);

      // Vendor ID
      if ((match = parser.expectOptionalRE(aState, /^([A-Za-z0-9]+-)/, error))) {
        value += match[1];
      }

      // Remaining part
      match = parser.expectRE(aState, /^([A-Za-z0-9-]+)/, error);
      value += match[1];

      return value;
    }
    return parser.parseAlternative(aState, parseXName, parseIanaToken);
  };

  parser.lexValue = function lexValue(aState) {
    // VALUE-CHAR = WSP / %x21-7E / NON-US-ASCII
    // ; Any textual character

    if (aState.buffer.length === 0) {
      return aState.buffer;
    }

    // TODO the unicode range might be wrong!
    var match = parser.expectRE(aState,
                                /*  WSP|%x21-7E|NON-US-ASCII  */
                                /^([ \t\x21-\x7E\u00C2-\uF400]+)/,
                                "Invalid Character in value");

    return match[1];
  };

  parser.lexParam = function lexParam(aState) {
    // read param name
    var name = parser.lexName(aState);
    parser.expectRE(aState, /^=/, "Expected '='");

    // read param value
    var values = parser.parseList(aState, parser.lexParamValue, ",");
    return {
      name: name,
      value: (values.length == 1 ? values[0] : values)
    };
  };

  parser.lexParamValue = function lexParamValue(aState) {
    // CONTROL = %x00-08 / %x0A-1F / %x7F
    // ; All the controls except HTAB
    function parseQuotedString(aState) {
      parser.expectRE(aState, /^"/, "Expecting Quote Character");
      // QSAFE-CHAR    = WSP / %x21 / %x23-7E / NON-US-ASCII
      // ; Any character except CONTROL and DQUOTE

      var match = parser.expectRE(aState, /^([^"\x00-\x08\x0A-\x1F\x7F]*)/,
                                  "Invalid Param Value");
      parser.expectRE(aState, /^"/, "Expecting Quote Character");
      return match[1];
    }

    function lexParamText(aState) {
      // SAFE-CHAR     = WSP / %x21 / %x23-2B / %x2D-39 / %x3C-7E / NON-US-ASCII
      // ; Any character except CONTROL, DQUOTE, ";", ":", ","
      var match = parser.expectRE(aState, /^([^";:,\x00-\x08\x0A-\x1F\x7F]*)/,
                                  "Invalid Param Value");
      return match[1];
    }

    return parser.parseAlternative(aState, parseQuotedString, lexParamText);
  };

  parser.parseContentLine = function parseContentLine(aState, aLineData) {

    switch (aLineData.name) {
    case "BEGIN":
      var newdata = ICAL.helpers.initComponentData(aLineData.value);
      if (aState.currentData) {
        // If there is already data (i.e this is not the top level
        // component), then push the new data to its values and
        // stack the parent data.
        aState.currentData.value.push(newdata);
        aState.parentData.push(aState.currentData);
      }

      aState.currentData = newdata; // set the new data array
      break;
    case "END":
      if (aState.currentData.name != aLineData.value) {
        throw new ParserError(aState, "Unexpected END:" + aLineData.value +
                              ", expected END:" + aState.currentData.name);
      }
      if (aState.parentData.length) {
        aState.currentData = aState.parentData.pop();
      }
      break;
    default:
      ICAL.helpers.dumpn("parse " + aLineData.toString());
      parser.detectParameterType(aLineData);
      parser.detectValueType(aLineData);
      ICAL.helpers.dumpn("parse " + aLineData.toString());
      aState.currentData.value.push(aLineData);
      break;
    }
  },

  parser.detectParameterType = function detectParameterType(aLineData) {
    for (var name in aLineData.parameters) {
      var paramType = "TEXT";

      if (name in ICAL.design.param && "valueType" in ICAL.design.param[name]) {
        paramType = ICAL.design.param[name].valueType;
      }
      var paramData = {
        value: aLineData.parameters[name],
        type: paramType
      };

      aLineData.parameters[name] = paramData;
    }
  };

  parser.detectValueType = function detectValueType(aLineData) {
    var valueType = "TEXT";
    var defaultType = null;
    if (aLineData.name in ICAL.design.property &&
        "defaultType" in ICAL.design.property[aLineData.name]) {
      valueType = ICAL.design.property[aLineData.name].defaultType;
    }

    if ("parameters" in aLineData && "VALUE" in aLineData.parameters) {
      ICAL.helpers.dumpn("VAAAA: " + aLineData.parameters.VALUE.toString());
      valueType = aLineData.parameters.VALUE.value.toUpperCase();
    }

    if (!(valueType in ICAL.design.value)) {
      throw new ParserError(aLineData, "Invalid VALUE Type '" + valueType);
    }

    aLineData.type = valueType;

    // It could be a multi-value value, we have to take that apart first
    function unwrapMultiValue(x, separator) {
      var values = [];

      function replacer(s, a) {
        values.push(a);
        return "";
      }
      var re = new RegExp("(.*?[^\\\\])" + separator, "g");
      values.push(x.replace(re, replacer));
      return values;
    }

    if (aLineData.name in ICAL.design.property) {
      if (ICAL.design.property[aLineData.name].multiValue) {
        aLineData.value = unwrapMultiValue(aLineData.value, ",");
      } else if (ICAL.design.property[aLineData.name].structuredValue) {
        aLineData.value = unwrapMultiValue(aLineData.value, ";");
      } else {
        aLineData.value = [aLineData.value];
      }
    } else {
      aLineData.value = [aLineData.value];
    }

    if ("unescape" in ICAL.design.value[valueType]) {
      var unescaper = ICAL.design.value[valueType].unescape;
      for (var idx in aLineData.value) {
        aLineData.value[idx] = unescaper(aLineData.value[idx], aLineData.name);
      }
    }

    return aLineData;
  }

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
            aLineData.parameters[param].value != reqParam[param]) {

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

  parser.decorateValue = function decorateValue(aType, aValue) {
    if (aType in ICAL.design.value && "decorate" in ICAL.design.value[aType]) {
      return ICAL.design.value[aType].decorate(aValue);
    } else {
      return ICAL.design.value.TEXT.decorate(aValue);
    }
  };

  parser.stringifyProperty = function stringifyProperty(aLineData) {
    ICAL.helpers.dumpn("Stringify: " + aLineData.toString());
    var str = aLineData.name;
    if (aLineData.parameters) {
      for (var key in aLineData.parameters) {
        str += ";" + key + "=" + aLineData.parameters[key].value;
      }
    }

    str += ":" + parser.stringifyValue(aLineData);

    return ICAL.helpers.foldline(str);
  };

  parser.stringifyValue = function stringifyValue(aLineData) {
    function arrayStringMap(arr, func) {
      var newArr = [];
      for (var idx in arr) {
        newArr[idx] = func(arr[idx].toString());
      }
      return newArr;
    }

    if (aLineData) {
      var values = aLineData.value;
      if (aLineData.type in ICAL.design.value &&
          "escape" in ICAL.design.value[aLineData.type]) {
        var escaper = ICAL.design.value[aLineData.type].escape;
        values = arrayStringMap(values, escaper);
      }

      var separator = ",";
      if (aLineData.name in ICAL.design.property &&
          ICAL.design.property[aLineData.name].structuredValue) {
        separator = ";";
      }

      return values.join(separator);
    } else {
      return null;
    }
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
        weeks: parser.expectRE(aState, /^((\d+)W)/, "Expected Weeks")[2]
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
        data.days = days[2];
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

  /* Possible shortening:
      - pro: retains order
      - con: datatypes not obvious
      - pro: not so many objects created

    {
      "begin:vcalendar": [
        {
          prodid: "-//Example Inc.//Example Client//EN",
          version: "2.0"
          "begin:vtimezone": [
            {
              "last-modified": [{
                type: "date-time",
                value: "2004-01-10T03:28:45Z"
              }],
              tzid: "US/Eastern"
              "begin:daylight": [
                {
                  dtstart: {
                    type: "date-time",
                    value: "2000-04-04T02:00:00"
                  }
                  rrule: {
                    type: "recur",
                    value: {
                      freq: "YEARLY",
                      byday: ["1SU"],
                      bymonth: ["4"],
                    }
                  }
                }
              ]
            }
          ],
          "begin:vevent": [
            {
              category: [{
                type: "text"
                // have icalcomponent take apart the multivalues
                value: "multi1,multi2,multi3"
              },{
                type "text"
                value: "otherprop1"
              }]
            }
          ]
        }
      ]
    }
    */
})();
