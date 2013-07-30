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
        'invalid ical body. component began but did not end'
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
    var valuePos;
    var paramPos = line.indexOf(PARAM_DELIMITER);
    //var temp = helpers.firstIndexOf(line, ';');
    //var paramPos = temp[2];
    //var temp = helpers.splitOnFirst(line, paramPos);

    var lastParamIndex;
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
      // when the parameter delimiter is after the
      // value delimiter then its not a parameter.

    var parsedParams;
    var parsedValue;
    if (paramPos !== -1) {
      // when there are parameters (ATTENDEE;RSVP=TRUE;)
      //var temp = line.substr(0, paramPos);
      //var temp = line.split(";");
      //var temp = helpers.firstIndexOf(line, ';');
      var temp = helpers.splitOnFirst(line, paramPos);
      name = parser._formatName(temp[0]);
      parsedParams = parser._parseParameters(temp[1], 0);
      params = parsedParams[0];
      parsedValue = parsedParams[1];
      lastParamIndex = parsedValue.length + parsedParams[2]+ paramPos;
      valuePos = lastParamIndex + line.substr(lastParamIndex).indexOf(VALUE_DELIMITER);
      value = line.substr(valuePos + 1);
    }
    else if ((valuePos = line.indexOf(VALUE_DELIMITER)) !== -1) {
      //valuePos = line.indexOf(VALUE_DELIMITER);
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

      else if (name === 'end') {
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

      if (value && 'detectType' in propertyDetails) {
        valueType = propertyDetails.detectType(value);
      }
    }

    // at this point params is mandatory per jcal spec
    params = params || {};

    // attempt to determine value
    if (!valueType) {
      if (!('value' in params)) {
        if (propertyDetails) {
          valueType = propertyDetails.defaultType;
        } else {
          valueType = DEFAULT_TYPE;
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
    var name;
    var value;
    var type;
    //var array = helpers.indexes(line, PARAM_DELIMITER ,start, line.length -1 );

    // find the next '=' sign
    // use lastParam and pos to find name
    // check if " is used if so get value from "->"
    // then increment pos to find next ;

    while ((pos !== false) &&
           (pos = helpers.unescapedIndexOf(line, delim, pos + 1)) !== -1) {

      name = line.substr(lastParam + 1, pos - lastParam - 1);

      var nextChar = line[pos + 1];
      if (nextChar === '"') {
        var valuePos = pos + 2;
        pos = helpers.unescapedIndexOf(line, '"', valuePos);
        value = line.substr(valuePos, pos - valuePos);
        lastParam = helpers.unescapedIndexOf(line, PARAM_DELIMITER, pos);
      } 
      else {
        var valuePos = pos + 1;

        // move to next ";"
        var nextPos = helpers.unescapedIndexOf(line, PARAM_DELIMITER, valuePos);

        if (nextPos === -1) {
          // when there is no ";" attempt to locate ":"
          nextPos = helpers.unescapedIndexOf(line, VALUE_DELIMITER, valuePos);

          if (nextPos === -1) {
            nextPos = line.length;
          }
          pos = false;
        } 
        else {
          lastParam = nextPos;
        }

        value = line.substr(valuePos, nextPos - valuePos);
      }

      if (name in design.param && design.param[name].valueType) {
        type = design.param[name].valueType;
      }
      else {
        type = DEFAULT_TYPE
      }

      result[parser._formatName(name)] = parser._parseValue(value, type);
    }
    return [result,value,valuePos];
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
