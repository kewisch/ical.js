/**
 * The weekday, 1 = SUNDAY, 7 = SATURDAY. Access via
 * ICAL.Time.MONDAY, ICAL.Time.TUESDAY, ...
 *
 * @typedef {Number} weekDay
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
 * @property {ICAL.Time} recurrenceId       The passed in recurrence id
 * @property {ICAL.Event} item              The occurrence
 * @property {ICAL.Time} startDate          The start of the occurrence
 * @property {ICAL.Time} endDate            The end of the occurrence
 */
