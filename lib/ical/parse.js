/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch */

import design from "./design.js";
import { unescapedIndexOf } from "./helpers.js";

/**
 * This lets typescript resolve our custom types in the
 * generated d.ts files (jsdoc typedefs are converted to typescript types).
 * Ignore prevents the typedefs from being documented more than once.
 *
 * @ignore
 * @typedef {import("./types.js").parserState} parserState
 * Imports the 'parserState' type from the "types.js" module
 * @typedef {import("./types.js").designSet} designSet
 * Imports the 'designSet' type from the "types.js" module
 */

const CHAR = /[^ \t]/;
const VALUE_DELIMITER = ':';
const PARAM_DELIMITER = ';';
const PARAM_NAME_DELIMITER = '=';
const DEFAULT_VALUE_TYPE = 'unknown';
const DEFAULT_PARAM_TYPE = 'text';
const RFC6868_REPLACE_MAP = { "^'": '"', "^n": "\n", "^^": "^" };

/**
 * Parses iCalendar or vCard data into a raw jCal object. Consult
 * documentation on the {@tutorial layers|layers of parsing} for more
 * details.
 *
 * @function ICAL.parse
 * @memberof ICAL
 * @variation function
 * @todo Fix the API to be more clear on the return type
 * @param {String} input      The string data to parse
 * @return {Object|Object[]}  A single jCal object, or an array thereof
 */
export default function parse(input) {
  let state = {};
  let root = state.component = [];

  state.stack = [root];

  parse._eachLine(input, function(err, line) {
    parse._handleContentLine(line, state);
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
 * @function ICAL.parse.property
 * @param {String} str
 *   The iCalendar property string to parse
 * @param {designSet=} designSet
 *   The design data to use for this property
 * @return {Object}
 *   The jCal Object containing the property
 */
parse.property = function(str, designSet) {
  let state = {
    component: [[], []],
    designSet: designSet || design.defaultSet
  };
  parse._handleContentLine(str, state);
  return state.component[1][0];
};

/**
 * Convenience method to parse a component. You can use ICAL.parse() directly
 * instead.
 *
 * @function ICAL.parse.component
 * @see ICAL.parse(function)
 * @param {String} str    The iCalendar component string to parse
 * @return {Object}       The jCal Object containing the component
 */
parse.component = function(str) {
  return parse(str);
};


/**
 * An error that occurred during parsing.
 *
 * @param {String} message        The error message
 * @memberof ICAL.parse
 * @extends {Error}
 */
class ParserError extends Error {
  name = this.constructor.name;
}

// classes & constants
parse.ParserError = ParserError;


/**
 * Handles a single line of iCalendar/vCard, updating the state.
 *
 * @private
 * @function ICAL.parse._handleContentLine
 * @param {String} line          The content line to process
 * @param {parserState} state    The current state of the line parsing
 */
parse._handleContentLine = function(line, state) {
  // break up the parts of the line
  let valuePos = line.indexOf(VALUE_DELIMITER);
  let paramPos = line.indexOf(PARAM_DELIMITER);

  let lastParamIndex;
  let lastValuePos;

  // name of property or begin/end
  let name;
  let value;
  // params is only overridden if paramPos !== -1.
  // we can't do params = params || {} later on
  // because it sacrifices ops.
  let params = {};

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
    // value delimiter then it is not a parameter.

  if ((paramPos !== -1 && valuePos !== -1)) {
    // when the parameter delimiter is after the
    // value delimiter then it is not a parameter.
    if (paramPos > valuePos) {
      paramPos = -1;
    }
  }

  let parsedParams;
  if (paramPos !== -1) {
    name = line.slice(0, Math.max(0, paramPos)).toLowerCase();
    parsedParams = parse._parseParameters(line.slice(Math.max(0, paramPos)), 0, state.designSet);
    if (parsedParams[2] == -1) {
      throw new ParserError("Invalid parameters in '" + line + "'");
    }
    params = parsedParams[0];
    // Handle parameter values with multiple entries
    let parsedParamLength;
    if (typeof parsedParams[1] === 'string') {
      parsedParamLength = parsedParams[1].length;
    } else {
      parsedParamLength = parsedParams[1].reduce((accumulator, currentValue) => {
        return accumulator + currentValue.length;
      }, 0);
    }
    lastParamIndex = parsedParamLength + parsedParams[2] + paramPos;
    if ((lastValuePos =
      line.slice(Math.max(0, lastParamIndex)).indexOf(VALUE_DELIMITER)) !== -1) {
      value = line.slice(Math.max(0, lastParamIndex + lastValuePos + 1));
    } else {
      throw new ParserError("Missing parameter value in '" + line + "'");
    }
  } else if (valuePos !== -1) {
    // without parmeters (BEGIN:VCAENDAR, CLASS:PUBLIC)
    name = line.slice(0, Math.max(0, valuePos)).toLowerCase();
    value = line.slice(Math.max(0, valuePos + 1));

    if (name === 'begin') {
      let newComponent = [value.toLowerCase(), [], []];
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
    // If it is not begin/end, then this is a property with an empty value,
    // which should be considered valid.
  } else {
    /**
     * Invalid line.
     * The rational to throw an error is we will
     * never be certain that the rest of the file
     * is sane and it is unlikely that we can serialize
     * the result correctly either.
     */
    throw new ParserError(
      'invalid line (no token ";" or ":") "' + line + '"'
    );
  }

  let valueType;
  let multiValue = false;
  let structuredValue = false;
  let propertyDetails;
  let splitName;
  let ungroupedName;

  // fetch the ungrouped part of the name
  if (state.designSet.propertyGroups && name.indexOf('.') !== -1) {
    splitName = name.split('.');
    params.group = splitName[0];
    ungroupedName = splitName[1];
  } else {
    ungroupedName = name;
  }

  if (ungroupedName in state.designSet.property) {
    propertyDetails = state.designSet.property[ungroupedName];

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
   * It is a little ugly but resulted in ~2000 additional ops/sec.
   */

  let result;
  if (multiValue && structuredValue) {
    value = parse._parseMultiValue(value, structuredValue, valueType, [], multiValue, state.designSet, structuredValue);
    result = [ungroupedName, params, valueType, value];
  } else if (multiValue) {
    result = [ungroupedName, params, valueType];
    parse._parseMultiValue(value, multiValue, valueType, result, null, state.designSet, false);
  } else if (structuredValue) {
    value = parse._parseMultiValue(value, structuredValue, valueType, [], null, state.designSet, structuredValue);
    result = [ungroupedName, params, valueType, value];
  } else {
    value = parse._parseValue(value, valueType, state.designSet, false);
    result = [ungroupedName, params, valueType, value];
  }
  // rfc6350 requires that in vCard 4.0 the first component is the VERSION
  // component with as value 4.0, note that 3.0 does not have this requirement.
  if (state.component[0] === 'vcard' && state.component[1].length === 0 &&
          !(name === 'version' && value === '4.0')) {
    state.designSet = design.getDesignSet("vcard3");
  }
  state.component[1].push(result);
};

/**
 * Parse a value from the raw value into the jCard/jCal value.
 *
 * @private
 * @function ICAL.parse._parseValue
 * @param {String} value          Original value
 * @param {String} type           Type of value
 * @param {Object} designSet      The design data to use for this value
 * @return {Object} varies on type
 */
parse._parseValue = function(value, type, designSet, structuredValue) {
  if (type in designSet.value && 'fromICAL' in designSet.value[type]) {
    return designSet.value[type].fromICAL(value, structuredValue);
  }
  return value;
};

/**
 * Parse parameters from a string to object.
 *
 * @function ICAL.parse._parseParameters
 * @private
 * @param {String} line               A single unfolded line
 * @param {Number} start              Position to start looking for properties
 * @param {Object} designSet          The design data to use for this property
 * @return {Array}                    Array containing key/valye pairs of parsed parameters, the
 *                                      parsed value, and the position of the last parameter found
 */
parse._parseParameters = function(line, start, designSet) {
  let lastParam = start;
  let pos = 0;
  let delim = PARAM_NAME_DELIMITER;
  let result = {};
  let name, lcname;
  let value, valuePos = -1;
  let type, multiValue, mvdelim;

  // find the next '=' sign
  // use lastParam and pos to find name
  // check if " is used if so get value from "->"
  // then increment pos to find next ;

  while ((pos !== false) &&
         (pos = line.indexOf(delim, pos + 1)) !== -1) {

    name = line.slice(lastParam + 1, pos);
    if (name.length == 0) {
      throw new ParserError("Empty parameter name in '" + line + "'");
    }
    lcname = name.toLowerCase();
    mvdelim = false;
    multiValue = false;

    if (lcname in designSet.param && designSet.param[lcname].valueType) {
      type = designSet.param[lcname].valueType;
    } else {
      type = DEFAULT_PARAM_TYPE;
    }

    if (lcname in designSet.param) {
      multiValue = designSet.param[lcname].multiValue;
      if (designSet.param[lcname].multiValueSeparateDQuote) {
        mvdelim = parse._rfc6868Escape('"' + multiValue + '"');
      }
    }

    let nextChar = line[pos + 1];
    if (nextChar === '"') {
      valuePos = pos + 2;
      pos = line.indexOf('"', valuePos);
      if (multiValue && pos != -1) {
          let extendedValue = true;
          while (extendedValue) {
            if (line[pos + 1] == multiValue && line[pos + 2] == '"') {
              pos = line.indexOf('"', pos + 3);
            } else {
              extendedValue = false;
            }
          }
        }
      if (pos === -1) {
        throw new ParserError(
          'invalid line (no matching double quote) "' + line + '"'
        );
      }
      value = line.slice(valuePos, pos);
      lastParam = line.indexOf(PARAM_DELIMITER, pos);
      let propValuePos = line.indexOf(VALUE_DELIMITER, pos);
      // if either no next parameter or delimeter in property value, let's stop here
      if (lastParam === -1 || (propValuePos !== -1 && lastParam > propValuePos)) {
        pos = false;
      }
    } else {
      valuePos = pos + 1;

      // move to next ";"
      let nextPos = line.indexOf(PARAM_DELIMITER, valuePos);
      let propValuePos = line.indexOf(VALUE_DELIMITER, valuePos);
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
        pos = nextPos;
      }

      value = line.slice(valuePos, nextPos);
    }

    const length_before = value.length;
    value = parse._rfc6868Escape(value);
    valuePos += length_before - value.length;
    if (multiValue) {
      let delimiter = mvdelim || multiValue;
      value = parse._parseMultiValue(value, delimiter, type, [], null, designSet);
    } else {
      value = parse._parseValue(value, type, designSet);
    }

    if (multiValue && (lcname in result)) {
      if (Array.isArray(result[lcname])) {
        result[lcname].push(value);
      } else {
        result[lcname] = [
          result[lcname],
          value
        ];
      }
    } else {
      result[lcname] = value;
    }
  }
  return [result, value, valuePos];
};

/**
 * Internal helper for rfc6868. Exposing this on ICAL.parse so that
 * hackers can disable the rfc6868 parsing if the really need to.
 *
 * @function ICAL.parse._rfc6868Escape
 * @param {String} val        The value to escape
 * @return {String}           The escaped value
 */
parse._rfc6868Escape = function(val) {
  return val.replace(/\^['n^]/g, function(x) {
    return RFC6868_REPLACE_MAP[x];
  });
};

/**
 * Parse a multi value string. This function is used either for parsing
 * actual multi-value property's values, or for handling parameter values. It
 * can be used for both multi-value properties and structured value properties.
 *
 * @private
 * @function ICAL.parse._parseMultiValue
 * @param {String} buffer           The buffer containing the full value
 * @param {String} delim            The multi-value delimiter
 * @param {String} type             The value type to be parsed
 * @param {Array.<?>} result        The array to append results to, varies on value type
 * @param {String} innerMulti       The inner delimiter to split each value with
 * @param {designSet} designSet     The design data for this value
 * @return {?|Array.<?>}            Either an array of results, or the first result
 */
parse._parseMultiValue = function(buffer, delim, type, result, innerMulti, designSet, structuredValue) {
  let pos = 0;
  let lastPos = 0;
  let value;
  if (delim.length === 0) {
    return buffer;
  }

  // split each piece
  while ((pos = unescapedIndexOf(buffer, delim, lastPos)) !== -1) {
    value = buffer.slice(lastPos, pos);
    if (innerMulti) {
      value = parse._parseMultiValue(value, innerMulti, type, [], null, designSet, structuredValue);
    } else {
      value = parse._parseValue(value, type, designSet, structuredValue);
    }
    result.push(value);
    lastPos = pos + delim.length;
  }

  // on the last piece take the rest of string
  value = buffer.slice(lastPos);
  if (innerMulti) {
    value = parse._parseMultiValue(value, innerMulti, type, [], null, designSet, structuredValue);
  } else {
    value = parse._parseValue(value, type, designSet, structuredValue);
  }
  result.push(value);

  return result.length == 1 ? result[0] : result;
};

/**
 * Process a complete buffer of iCalendar/vCard data line by line, correctly
 * unfolding content. Each line will be processed with the given callback
 *
 * @private
 * @function ICAL.parse._eachLine
 * @param {String} buffer                         The buffer to process
 * @param {function(?String, String)} callback    The callback for each line
 */
parse._eachLine = function(buffer, callback) {
  let len = buffer.length;
  let lastPos = buffer.search(CHAR);
  let pos = lastPos;
  let line;
  let firstChar;

  let newlineOffset;

  do {
    pos = buffer.indexOf('\n', lastPos) + 1;

    if (pos > 1 && buffer[pos - 2] === '\r') {
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
      line += buffer.slice(lastPos + 1, pos - newlineOffset);
    } else {
      if (line)
        callback(null, line);
      // push line
      line = buffer.slice(lastPos, pos - newlineOffset);
    }

    lastPos = pos;
  } while (pos !== len);

  // extra ending line
  line = line.trim();

  if (line.length)
    callback(null, line);
};
