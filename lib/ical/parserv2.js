ICAL.parsev2 = (function() {

  const CHAR = /[^ \t]/;
  const MULTIVALUE_DELIMITER = ',';
  const VALUE_DELIMITER = ':';
  const PARAM_DELIMITER = ';';
  const PARAM_NAME_DELIMITER = '=';
  const DEFAULT_TYPE = 'text';

  var design = ICAL.designv2;

  function parser(input) {
    var state = {};
    var root = state.component = [
      'icalendar'
    ];

    state.stack = [root];

    parser._eachLine(input, function(err, line) {
      parser.handleContentLine(line, state);
    });

    state = null;

    return root;
  }

  parser.formatName = function(name) {
    return name.toLowerCase();
  }

  parser.handleContentLine = function(line, state) {
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
      name = parser.formatName(line.substr(0, paramPos));
      params = parser._parseParameters(line, paramPos);
      if (valuePos !== -1) {
        value = line.substr(valuePos + 1);
      }
    } else if (valuePos !== -1) {
      // without parmeters (BEGIN:VCAENDAR, CLASS:PUBLIC)
      name = parser.formatName(line.substr(0, valuePos));
      value = line.substr(valuePos + 1);

      if (name === 'begin') {
        var newComponent = [parser.formatName(value), [], []];
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
   * Identical to index of but will only match values
   * when they are not preceded by a backslash char \\\
   *
   * @param {String} buffer string value.
   * @param {String} search value.
   * @param {Numeric} pos start position.
   */
  parser._unescapedIndexOf = function(buffer, search, pos) {
    while ((pos = buffer.indexOf(search, pos)) !== -1) {
      if (pos > 0 && buffer[pos - 1] === '\\') {
        pos += 1;
      } else {
        return pos;
      }
    }
    return -1;
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
           (pos = parser._unescapedIndexOf(line, delim, pos + 1)) !== -1) {

      var name = line.substr(lastParam + 1, pos - lastParam - 1);

      var nextChar = line[pos + 1];
      var substrOffset = -2;

      if (nextChar === '"') {
        var valuePos = pos + 2;
        pos = parser._unescapedIndexOf(line, '"', valuePos);
        var value = line.substr(valuePos, pos - valuePos);
        lastParam = parser._unescapedIndexOf(line, PARAM_DELIMITER, pos);
      } else {
        var valuePos = pos + 1;
        substrOffset = -1;

        // move to next ";"
        var nextPos = parser._unescapedIndexOf(line, PARAM_DELIMITER, valuePos);

        if (nextPos === -1) {
          // when there is no ";" attempt to locate ":"
          nextPos = parser._unescapedIndexOf(line, VALUE_DELIMITER, valuePos);
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

      result[parser.formatName(name)] = parser._parseValue(value, type);
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
    while ((pos = parser._unescapedIndexOf(buffer, delim, lastPos)) !== -1) {
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
