ICAL.parse = (function() {
  'use strict';

  var CHAR = /[^ \t]/;
  var MULTIVALUE_DELIMITER = ',';
  var VALUE_DELIMITER = ':';
  var PARAM_DELIMITER = ';';
  var PARAM_NAME_DELIMITER = '=';
  var DEFAULT_VALUE_TYPE = 'unknown';
  var DEFAULT_PARAM_TYPE = 'text';

  var design = ICAL.design;
  var helpers = ICAL.helpers;

  function ParserError(message) {
    this.message = message;

    try {
      throw new Error();
    } catch (e) {
      var split = e.stack.split('\n');
      split.shift();
      this.stack = split.join('\n');
    }
  }

  ParserError.prototype = {
    __proto__: Error.prototype
  };

  function parser(input) {
    var state = {};
    var root = state.component = [];

    state.stack = [root];

    parser._eachLine(input, function(err, line) {
      parser._handleContentLine(line, state);
    });


    // when there are still items on the stack
    // throw a fatal error, a component was not closed
    // correctly in that case.
    if (state.stack.length > 1) {
      throw new ParserError(
        'invalid ical body. component began but did not end'
      );
    }

    state = null;

    return (root.length == 1 ? root[0] : root);
  }


  /**
   * Parse an iCalendar property value into the jCal for a single property
   *
   * @param {String} str        The iCalendar property string to parse.
   * @param {Object} designSet  (optional) The design data to use for this property.
   * @return {Object}           The jCal Object containing the property.
   */
  parser.property = function(str, designSet) {
    var state = {
      component: [[], []],
      designSet: designSet || design.defaultSet
    };
    parser._handleContentLine(str, state);
    return state.component[1][0];
  };

  /**
   * Convenience method to parse a component. You can use ICAL.parse() directly
   * instead.
   *
   * @param {String} str    The iCalendar component string to parse.
   * @return {Object}       The jCal Object containing the component.
   */
  parser.component = function(str) {
    return parser(str);
  };

  // classes & constants
  parser.ParserError = ParserError;

  parser._handleContentLine = function(line, state) {
    // break up the parts of the line
    var valuePos = line.indexOf(VALUE_DELIMITER);
    var paramPos = line.indexOf(PARAM_DELIMITER);

    var lastParamIndex;
    var lastValuePos;

    // name of property or begin/end
    var name;
    var value;
    // params is only overridden if paramPos !== -1.
    // we can't do params = params || {} later on
    // because it sacrifices ops.
    var params = {};

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
      // when the parameter delimiter is after the
      // value delimiter then its not a parameter.

    if ((paramPos !== -1 && valuePos !== -1)) {
      // when the parameter delimiter is after the
      // value delimiter then its not a parameter.
      if (paramPos > valuePos) {
        paramPos = -1;
      }
    }

    var parsedParams;
    if (paramPos !== -1) {
      name = line.substring(0, paramPos).toLowerCase();
      parsedParams = parser._parseParameters(line.substring(paramPos), 0, state.designSet);
      if (parsedParams[2] == -1) {
        throw new ParserError("Invalid parameters in '" + line + "'");
      }
      params = parsedParams[0];
      lastParamIndex = parsedParams[1].length + parsedParams[2] + paramPos;
      if ((lastValuePos =
        line.substring(lastParamIndex).indexOf(VALUE_DELIMITER)) !== -1) {
        value = line.substring(lastParamIndex + lastValuePos + 1);
      } else {
        throw new ParserError("Missing parameter value in '" + line + "'");
      }
    } else if (valuePos !== -1) {
      // without parmeters (BEGIN:VCAENDAR, CLASS:PUBLIC)
      name = line.substring(0, valuePos).toLowerCase();
      value = line.substring(valuePos + 1);

      if (name === 'begin') {
        var newComponent = [value.toLowerCase(), [], []];
        if (state.stack.length === 1) {
          state.component.push(newComponent);
        } else {
          state.component[2].push(newComponent);
        }
        state.stack.push(state.component);
        state.component = newComponent;
        if (!state.designSet) {
          state.designSet = design.getDesignSet(state.component[0]);
        }
        return;
      } else if (name === 'end') {
        state.component = state.stack.pop();
        return;
      }
      // If its not begin/end, then this is a property with an empty value,
      // which should be considered valid.
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
    var structuredValue = false;
    var propertyDetails;

    if (name in state.designSet.property) {
      propertyDetails = state.designSet.property[name];

      if ('multiValue' in propertyDetails) {
        multiValue = propertyDetails.multiValue;
      }

      if ('structuredValue' in propertyDetails) {
        structuredValue = propertyDetails.structuredValue;
      }

      if (value && 'detectType' in propertyDetails) {
        valueType = propertyDetails.detectType(value);
      }
    }

    // attempt to determine value
    if (!valueType) {
      if (!('value' in params)) {
        if (propertyDetails) {
          valueType = propertyDetails.defaultType;
        } else {
          valueType = DEFAULT_VALUE_TYPE;
        }
      } else {
        // possible to avoid this?
        valueType = params.value.toLowerCase();
      }
    }

    delete params.value;

    /**
     * Note on `var result` juggling:
     *
     * I observed that building the array in pieces has adverse
     * effects on performance, so where possible we inline the creation.
     * Its a little ugly but resulted in ~2000 additional ops/sec.
     */

    var result;
    if (multiValue && structuredValue) {
      value = parser._parseMultiValue(value, structuredValue, valueType, [], multiValue, state.designSet);
      result = [name, params, valueType, value];
    } else if (multiValue) {
      result = [name, params, valueType];
      parser._parseMultiValue(value, multiValue, valueType, result, null, state.designSet);
    } else if (structuredValue) {
      value = parser._parseMultiValue(value, structuredValue, valueType, [], null, state.designSet);
      result = [name, params, valueType, value];
    } else {
      value = parser._parseValue(value, valueType, state.designSet);
      result = [name, params, valueType, value];
    }

    state.component[1].push(result);
  };

  /**
   * Parse a value from the raw value into the jCard/jCal value.
   *
   * @param {String} value          Original value.
   * @param {String} type           Type of value.
   * @param {Object} designSet      The design data to use for this value.
   * @return {Object} varies on type.
   */
  parser._parseValue = function(value, type, designSet) {
    if (type in designSet.value && 'fromICAL' in designSet.value[type]) {
      return designSet.value[type].fromICAL(value);
    }
    return value;
  };

  /**
   * Parse parameters from a string to object.
   *
   * @param {String} line           A single unfolded line.
   * @param {Numeric} start         Position to start looking for properties.
   * @param {Object} designSet      The design data to use for this property.
   * @return {Object} key/value pairs.
   */
  parser._parseParameters = function(line, start, designSet) {
    var lastParam = start;
    var pos = 0;
    var delim = PARAM_NAME_DELIMITER;
    var result = {};
    var name, lcname;
    var value, valuePos = -1;
    var type, multiValue;

    // find the next '=' sign
    // use lastParam and pos to find name
    // check if " is used if so get value from "->"
    // then increment pos to find next ;

    while ((pos !== false) &&
           (pos = helpers.unescapedIndexOf(line, delim, pos + 1)) !== -1) {

      name = line.substr(lastParam + 1, pos - lastParam - 1);
      if (name.length == 0) {
        throw new ParserError("Empty parameter name in '" + line + "'");
      }
      lcname = name.toLowerCase();

      var nextChar = line[pos + 1];
      if (nextChar === '"') {
        valuePos = pos + 2;
        pos = helpers.unescapedIndexOf(line, '"', valuePos);
        if (pos === -1) {
          throw new ParserError(
            'invalid line (no matching double quote) "' + line + '"'
          );
        }
        value = line.substr(valuePos, pos - valuePos);
        lastParam = helpers.unescapedIndexOf(line, PARAM_DELIMITER, pos);
        if (lastParam === -1) {
          pos = false;
        }
      } else {
        valuePos = pos + 1;

        // move to next ";"
        var nextPos = helpers.unescapedIndexOf(line, PARAM_DELIMITER, valuePos);
        var propValuePos = helpers.unescapedIndexOf(line, VALUE_DELIMITER, valuePos);
        if (propValuePos !== -1 && nextPos > propValuePos) {
          // this is a delimiter in the property value, let's stop here
          nextPos = propValuePos;
          pos = false;
        } else if (nextPos === -1) {
          // no ";"
          if (propValuePos === -1) {
            nextPos = line.length;
          } else {
            nextPos = propValuePos;
          }
          pos = false;
        } else {
          lastParam = nextPos;
        }

        value = line.substr(valuePos, nextPos - valuePos);
      }

      if (lcname in designSet.param && designSet.param[lcname].valueType) {
        type = designSet.param[lcname].valueType;
      } else {
        type = DEFAULT_PARAM_TYPE;
      }

      if (lcname in designSet.param) {
        multiValue = designSet.param[lcname].multiValue;
      }

      value = parser._rfc6868Escape(value);
      if (multiValue) {
        result[lcname] = parser._parseMultiValue(value, multiValue, type, [], null, designSet);
      } else {
        result[lcname] = parser._parseValue(value, type, designSet);
      }
    }
    return [result, value, valuePos];
  };

  /**
   * Internal helper for rfc6868. Exposing this on ICAL.parse so that
   * hackers can disable the rfc6868 parsing if the really need to.
   */
  parser._rfc6868Escape = function(val) {
    return val.replace(/\^['n^]/g, function(x) {
      return RFC6868_REPLACE_MAP[x];
    });
  };
  var RFC6868_REPLACE_MAP = { "^'": '"', "^n": "\n", "^^": "^" };

  /**
   * Parse a multi value string
   */
  parser._parseMultiValue = function(buffer, delim, type, result, innerMulti, designSet) {
    var pos = 0;
    var lastPos = 0;
    var value;

    // split each piece
    while ((pos = helpers.unescapedIndexOf(buffer, delim, lastPos)) !== -1) {
      value = buffer.substr(lastPos, pos - lastPos);
      if (innerMulti) {
        value = parser._parseMultiValue(value, innerMulti, type, [], null, designSet);
      } else {
        value = parser._parseValue(value, type, designSet);
      }
      result.push(value);
      lastPos = pos + 1;
    }

    // on the last piece take the rest of string
    value = buffer.substr(lastPos);
    if (innerMulti) {
      value = parser._parseMultiValue(value, innerMulti, type, [], null, designSet);
    } else {
      value = parser._parseValue(value, type, designSet);
    }
    result.push(value);

    return result.length == 1 ? result[0] : result;
  };

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
  };

  return parser;

}());
