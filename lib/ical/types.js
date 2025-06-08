/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2024 */

// TODO: Once https://github.com/microsoft/TypeScript/issues/22160 and
// https://github.com/microsoft/TypeScript/issues/46011 is fixed, update
// @typedef(import(...)) to @import to avoid re-exporting the typedefs

/* eslint-disable no-unused-vars */
// needed for typescript type resolution
import Component from "./component";
import Event from "./event";
import Time from "./time";
import Timezone from "./timezone";

/**
 * The weekday, 1 = SUNDAY, 7 = SATURDAY. Access via
 * ICAL.Time.MONDAY, ICAL.Time.TUESDAY, ...
 *
 * @typedef {Number} weekDay
 * @memberof ICAL.Time
 */

/**
 * @typedef {Object} timeInit         Time initialization
 * @property {Number=} year           The year for this date
 * @property {Number=} month          The month for this date
 * @property {Number=} day            The day for this date
 * @property {Number=} hour           The hour for this date
 * @property {Number=} minute         The minute for this date
 * @property {Number=} second         The second for this date
 * @property {Boolean=} isDate        If true, the instance represents a date
 *                                    (as opposed to a date-time)
 * @property {String=} timezone       Timezone id if zone is unknown [internal]
 * @property {Timezone=} zone         Resolved timezone object [internal]
 * @memberof ICAL.Time
 */

/**
 * Possible frequency values for the FREQ part
 * (YEARLY, MONTHLY, WEEKLY, DAILY, HOURLY, MINUTELY, SECONDLY)
 *
 * @typedef {String} frequencyValues
 * @memberof ICAL.Recur
 */

/**
 * This object is returned by {@link ICAL.Event#getOccurrenceDetails getOccurrenceDetails}
 * @memberof ICAL.Event
 * @typedef {Object} occurrenceDetails
 * @property {Time} recurrenceId       The passed in recurrence id
 * @property {Event} item              The occurrence
 * @property {Time} startDate          The start of the occurrence
 * @property {Time} endDate            The end of the occurrence
 */

/**
 * The state for parsing content lines from an iCalendar/vCard string.
 *
 * @private
 * @memberof ICAL.parse
 * @typedef {Object} parserState
 * @property {designSet} designSet           The design set to use for parsing
 * @property {Component[]} stack             The stack of components being processed
 * @property {Component} component           The currently active component
 */

/**
 * A jCal component.
 *
 * TODO: Properly typedef this when https://github.com/hegemonic/catharsis/pull/70
 * is merged. Documentation is ignored until this can be documented properly.
 *
 * @example
 *     ["vevent", [...properties here...], [...components here...] ]
 *
 * @ignore
 * @typedef {Array} jCalComponent
 * @property {String} 0               The component name
 * @property {jCalProperty[]} 1       The properties of this component
 * @property {jCalComponent[]} 2      The subcomponents of this component
 */

/**
 * A designSet describes value, parameter and property data. It is used by
 * ther parser and stringifier in components and properties to determine they
 * should be represented.
 *
 * @memberof ICAL.design
 * @typedef {Object} designSet
 * @property {Object} value       Definitions for value types, keys are type names
 * @property {Object} param       Definitions for params, keys are param names
 * @property {Object} property    Definitions for properties, keys are property names
 * @property {boolean} propertyGroups  If content lines may include a group name
 */

/**
 * The jCal Geo type. This is a tuple representing a geographical location.
 * The first element is the Latitude and the second element is the Longitude.
 *
 * TODO: Properly typedef this when https://github.com/hegemonic/catharsis/pull/70
 *
 * @typedef {Array} Geo
 * @property {Number} 0     Latitude
 * @property {Number} 1     Longitude
 */

export const _ = {};
