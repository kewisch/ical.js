/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

"use strict";

(typeof(ICAL) === 'undefined')? ICAL = {} : '';

(function() {
  ICAL.foldLength = 75;
  ICAL.newLineChar = "\n";

  /**
   * Return a parsed ICAL object to the ICAL format.
   *
   * @param {Object} object parsed ical string.
   * @return {String} ICAL string.
   */
  ICAL.stringify = function ICALStringify(object) {
    return ICAL.serializer.serializeToIcal(object);
  };

  /**
   * Parse an ICAL object or string.
   *
   * @param {String|Object} ical ical string or pre-parsed object.
   * @param {Boolean} decorate when true decorates object data types.
   *
   * @return {Object|ICAL.icalcomponent} The raw data or decorated icalcomponent.
   */
  ICAL.parse = function ICALParse(ical) {
    var state = ICAL.helpers.initState(ical, 0);

    while (state.buffer.length) {
      var line = ICAL.helpers.unfoldline(state);
      var lexState = ICAL.helpers.initState(line, state.lineNr);
      if (line.match(/^\s*$/) && state.buffer.match(/^\s*$/)) {
        break;
      }

      var lineData = ICAL.icalparser.lexContentLine(lexState);
      ICAL.icalparser.parseContentLine(state, lineData);
      state.lineNr++;
    }

    return state.currentData;
  };
}());
