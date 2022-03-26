/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch */

import ICALParse from "./parse.js";
import Component from "./component.js";
import Event from "./event.js";
import Timezone from "./timezone.js";

/**
 * The ComponentParser is used to process a String or jCal Object,
 * firing callbacks for various found components, as well as completion.
 *
 * @example
 * var options = {
 *   // when false no events will be emitted for type
 *   parseEvent: true,
 *   parseTimezone: true
 * };
 *
 * var parser = new ICAL.ComponentParser(options);
 *
 * parser.onevent(eventComponent) {
 *   //...
 * }
 *
 * // ontimezone, etc...
 *
 * parser.oncomplete = function() {
 *
 * };
 *
 * parser.process(stringOrComponent);
 *
 * @class
 * @alias ICAL.ComponentParser
 */
class ComponentParser {
  /**
   * Creates a new ICAL.ComponentParser instance.
   *
   * @param {Object=} options                   Component parser options
   * @param {Boolean} options.parseEvent        Whether events should be parsed
   * @param {Boolean} options.parseTimezeone    Whether timezones should be parsed
   */
  constructor(options) {
    if (typeof(options) === 'undefined') {
      options = {};
    }

    for (let [key, value] of Object.entries(options)) {
      this[key] = value;
    }
  }

  /**
   * When true, parse events
   *
   * @type {Boolean}
   */
  parseEvent = true;

  /**
   * When true, parse timezones
   *
   * @type {Boolean}
   */
  parseTimezone = true;


  /* SAX like events here for reference */

  /**
   * Fired when parsing is complete
   * @callback
   */
  oncomplete = /* c8 ignore next */ function() {};

  /**
   * Fired if an error occurs during parsing.
   *
   * @callback
   * @param {Error} err details of error
   */
  onerror = /* c8 ignore next */ function(err) {};

  /**
   * Fired when a top level component (VTIMEZONE) is found
   *
   * @callback
   * @param {ICAL.Timezone} component     Timezone object
   */
  ontimezone = /* c8 ignore next */ function(component) {};

  /**
   * Fired when a top level component (VEVENT) is found.
   *
   * @callback
   * @param {ICAL.Event} component    Top level component
   */
  onevent = /* c8 ignore next */ function(component) {};

  /**
   * Process a string or parse ical object.  This function itself will return
   * nothing but will start the parsing process.
   *
   * Events must be registered prior to calling this method.
   *
   * @param {ICAL.Component|String|Object} ical      The component to process,
   *        either in its final form, as a jCal Object, or string representation
   */
  process(ical) {
    //TODO: this is sync now in the future we will have a incremental parser.
    if (typeof(ical) === 'string') {
      ical = ICALParse(ical);
    }

    if (!(ical instanceof Component)) {
      ical = new Component(ical);
    }

    let components = ical.getAllSubcomponents();
    let i = 0;
    let len = components.length;
    let component;

    for (; i < len; i++) {
      component = components[i];

      switch (component.name) {
        case 'vtimezone':
          if (this.parseTimezone) {
            let tzid = component.getFirstPropertyValue('tzid');
            if (tzid) {
              this.ontimezone(new Timezone({
                tzid: tzid,
                component: component
              }));
            }
          }
          break;
        case 'vevent':
          if (this.parseEvent) {
            this.onevent(new Event(component));
          }
          break;
        default:
          continue;
      }
    }

    //XXX: ideally we should do a "nextTick" here
    //     so in all cases this is actually async.
    this.oncomplete();
  }
}
export default ComponentParser;
