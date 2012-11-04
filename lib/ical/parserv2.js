ICAL.parsev2 = (function() {

  const CHAR = /[^ \t]/;
  const VALUE_DELIMITER = ':';
  const PARAM_DELIMITER = ';';
  const PARAM_NAME_DELIMITER = '=';
  const DEFAULT_TYPE = 'text';

  var design = ICAL.designv2;

  function parser(input, options) {
    if (typeof(options) === 'undefined') {
      options = {};
    }

    parser.eachLine(input, function(err, line) {
      if (err && options.onerror) {
        options.onerror(err, line);
      }
      parser.handleContentLine(line, options);
    });
  }

  parser.formatName = function(name) {
    return name.toLowerCase();
  }

  parser.handleContentLine = function(line, options) {
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
        if (options.onbegincomponent) {
          options.onbegincomponent(parser.formatName(value));
        }
        return;
      }

      if (name === 'end') {
        if (options.onendcomponent) {
          options.onendcomponent(parser.formatName(value));
        }
        return;
      }
    }

    var valueType;

    // at this point params is mandatory per jcal spec
    params = params || {};

    // attempt to determine value
    if (!('value' in params)) {
      if (name in design.property) {
        valueType = design.property[name].defaultType;
      } else {
        valueType = DEFAULT_TYPE;
      }
    } else {
      // possible to avoid this?
      valueType = params.value;
      delete params.value;
    }

    if (options.onproperty) {
      var result = [name, params, valueType];

      if (value) {
        result.push(parser._parseValue(value, valueType));
      }

      options.onproperty(result);
    }
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
    if (type in design.value && 'unescape' in design.value[type]) {
      return design.value[type].unescape(value);
    }
    return value;
  };

  /**
   * Parse parameters from a string to object.
   *
   * @param {String} line a single unfolded line.
   * @param {Numeric} start position to start looking for properties.
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

    while ((pos = parser._unescapedIndexOf(line, delim, pos + 1)) !== -1) {
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

  parser.eachLine = function(buffer, callback) {
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

      if (firstChar === ' ' || firstChar === '\n') {
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
