/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

if (typeof ICAL === 'undefined') {
  if (typeof exports === 'object') {
    // CommonJS
    ICAL = exports;
  } else if (typeof window !== 'undefined') {
    // Browser globals
    this.ICAL = {};
  } else {
    // ...?
    ICAL = {};
  }
}

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
   * Checks if the given number is NaN
   */
  isStrictlyNaN: function(number) {
    return typeof(number) === 'number' && isNaN(number);
  },

  /**
   * Parses a string value that is expected to be an
   * integer, when the valid is not an integer throws
   * a decoration error.
   *
   * @param {String} string raw input.
   * @return {Number} integer.
   */
  strictParseInt: function(string) {
    var result = parseInt(string, 10);

    if (ICAL.helpers.isStrictlyNaN(result)) {
      throw new Error(
        'Could not extract integer from "' + string + '"'
      );
    }

    return result;
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
   *    var time = new ICAL.Time(...);
   *    var result = ICAL.helpers.formatClassType(time, ICAL.Time);
   *
   *    (result instanceof ICAL.Time)
   *    // => true
   *
   *    result = ICAL.helpers.formatClassType({}, ICAL.Time);
   *    (result isntanceof ICAL.Time)
   *    // => true
   *
   *
   * @param {Object} data object initialization data.
   * @param {Object} type object type (like ICAL.Time).
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
        // uses prototype method to allow use of Object.create(null);
        if (Object.prototype.hasOwnProperty.call(aSrc, name)) {
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
      // handle fractions.
      if (typeof(data) === 'number') {
        data = parseInt(data);
      }
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
