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
