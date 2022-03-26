/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch */

import Timezone from "./timezone.js";
import Component from "./component.js";

let zones = {
};

function lazyZone(name) {
  return {
    configurable: true,
    enumerable: true,
    get: function() {
      delete this[name];
      TimezoneService.reset();
      return this[name];
    }
  };
}

Object.defineProperties(zones, {
  Z: lazyZone("Z"),
  UTC: lazyZone("UTC"),
  GMT: lazyZone("GMT"),
});

/**
 * @classdesc
 * Singleton class to contain timezones.  Right now it is all manual registry in
 * the future we may use this class to download timezone information or handle
 * loading pre-expanded timezones.
 *
 * @exports module:ICAL.TimezoneService
 * @alias ICAL.TimezoneService
 */
const TimezoneService = {
  get count() {
    return Object.keys(zones).length;
  },

  reset: function() {
    zones = Object.create(null);
    let utc = Timezone.utcTimezone;

    zones.Z = utc;
    zones.UTC = utc;
    zones.GMT = utc;
  },

  /**
   * Checks if timezone id has been registered.
   *
   * @param {String} tzid     Timezone identifier (e.g. America/Los_Angeles)
   * @return {Boolean}        False, when not present
   */
  has: function(tzid) {
    return !!zones[tzid];
  },

  /**
   * Returns a timezone by its tzid if present.
   *
   * @param {String} tzid     Timezone identifier (e.g. America/Los_Angeles)
   * @return {?ICAL.Timezone} The timezone, or null if not found
   */
  get: function(tzid) {
    return zones[tzid];
  },

  /**
   * Registers a timezone object or component.
   *
   * @param {String=} name
   *        The name of the timezone. Defaults to the component's TZID if not
   *        passed.
   * @param {ICAL.Component|ICAL.Timezone} zone
   *        The initialized zone or vtimezone.
   */
  register: function(name, timezone) {
    if (name instanceof Component) {
      if (name.name === 'vtimezone') {
        timezone = new Timezone(name);
        name = timezone.tzid;
      }
    }

    if (timezone instanceof Timezone) {
      zones[name] = timezone;
    } else {
      throw new TypeError('timezone must be ICAL.Timezone or ICAL.Component');
    }
  },

  /**
   * Removes a timezone by its tzid from the list.
   *
   * @param {String} tzid     Timezone identifier (e.g. America/Los_Angeles)
   * @return {?ICAL.Timezone} The removed timezone, or null if not registered
   */
  remove: function(tzid) {
    return (delete zones[tzid]);
  }
};

export default TimezoneService;
