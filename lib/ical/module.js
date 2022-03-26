/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch */

import Binary from "./binary.js";
import Component from "./component.js";
import ComponentParser from "./component_parser.js";
import design from "./design.js";
import Duration from "./duration.js";
import Event from "./event.js";
import * as helpers from "./helpers.js";
import parse from "./parse.js";
import Period from "./period.js";
import Property from "./property.js";
import Recur from "./recur.js";
import RecurExpansion from "./recur_expansion.js";
import RecurIterator from "./recur_iterator.js";
import stringify from "./stringify.js";
import Time from "./time.js";
import Timezone from "./timezone.js";
import TimezoneService from "./timezone_service.js";
import UtcOffset from "./utc_offset.js";
import VCardTime from "./vcard_time.js";

/**
 * The main ICAL module. Provides access to everything else.
 *
 * @alias ICAL
 * @namespace ICAL
 * @property {ICAL.design} design
 * @property {ICAL.helpers} helpers
 */
export default {
  /**
   * The number of characters before iCalendar line folding should occur
   * @type {Number}
   * @default 75
   */
  foldLength: 75,

  debug: false,

  /**
   * The character(s) to be used for a newline. The default value is provided by
   * rfc5545.
   * @type {String}
   * @default "\r\n"
   */
  newLineChar: '\r\n',

  Binary,
  Component,
  ComponentParser,
  Duration,
  Event,
  Period,
  Property,
  Recur,
  RecurExpansion,
  RecurIterator,
  Time,
  Timezone,
  TimezoneService,
  UtcOffset,
  VCardTime,

  parse,
  stringify,

  design,
  helpers
};
