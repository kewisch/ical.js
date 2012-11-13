/* This Source Code Form is subject to the terms of the Mozilla Public
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
