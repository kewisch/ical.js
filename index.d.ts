// Type definitions for ical.js
// Project: https://github.com/mozilla-comm/ical.js/
// Definitions by: @glixlur <https://github.com/glixlur>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.1

// 1.2.2
// Sat Jun 30 2018 21:16:18

/**
 * Represents the BINARY value type, which contains extra methods for
 * encoding and decoding.
 */
export class Binary {
  /**
   * @param aValue The binary data for this value
   */
  constructor(aValue: string)

  /**
   * The type name, to be used in the jCal object.
   * @default "binary"
   * @constant
   */
  icaltype: "binary"

  /**
   * Base64 decode the current value
   *
   * @return The base64-decoded value
   */
  decodeValue(): string

  /**
   * Encodes the passed parameter with base64 and sets the internal
   * value to the result.
   *
   * @param aValue The raw binary value to encode
   */
  setEncodedValue(aValue: string): void

  /**
   * The string representation of this value
   */
  toString(): string

  /**
   * Creates a binary value from the given string.
   *
   * @param aString The binary value string
   * @return The binary value instance
   */
  static fromString(aString: string): Binary
}

/**
 * Wraps a jCal component, adding convenience methods to add,
 * remove and update subcomponents and properties.
 */
export class Component {
  /**
   * @param jCal Raw jCal component data OR name of new component
   * @param parent Parent component to associate
   */
  constructor(jCal: any[] | string, parent: Component)

  /**
   * The name of this component
   * @readonly
   */
  name: any

  /**
   * Create an {@link ICAL.Property} by parsing the passed iCalendar string.
   * @param str The iCalendar string to parse
   */
  static fromString(str: string): Component

   /**
   * Adds an {@link ICAL.Property} to the component.
   *
   * @param property The property to add
   * @return The passed in property
   */
  addProperty(property: Property): Property

  /**
   * Helper method to add a property with a value to the component.
   *
   * @param name Property name to add
   * @param value Property value
   * @return The created property
   */
  addPropertyWithValue(name: string, value: string | number | object): Property

  /**
   * Adds a single sub component.
   *
   * @param component The component to add
   * @return The passed in component
   */
  addSubcomponent(component: Component): Component

  /**
   * Get all properties in the component, optionally filtered by name.
   *
   * @param name Lowercase property name
   * @return List of properties
   */
  getAllProperties(name?: string): Property[]

  /**
   * Finds all sub components, optionally filtering by name.
   *
   * @param name Optional name to filter by
   * @return The found sub components
   */
  getAllSubcomponents(name?: string): Component[]

  /**
   * Finds the first property, optionally with the given name.
   *
   * @param name Lowercase property name
   * @return The found property
   */
  getFirstProperty(name?: string): Property | undefined

  /**
   * Returns first property's value, if available.
   *
   * @param name Lowercase property name
   * @return The found property value.
   */
  getFirstPropertyValue(name?: string): string | undefined

  /**
   * Finds first sub component, optionally filtered by name.
   *
   * @param name Optional name to filter by
   * @return The found subcomponent
   */
  getFirstSubcomponent(name?: string): Component | undefined

  /**
   * Returns true when a named property exists.
   *
   * @param name The property name
   * @return True, when property is found
   */
  hasProperty(name: string): boolean

  /**
   * Removes all properties associated with this component, optionally
   * filtered by name.
   *
   * @param name Lowercase property name
   * @return True, when deleted
   */
  removeAllProperties(name?: string): boolean

  /**
   * Removes all components or (if given) all components by a particular
   * name.
   *
   * @param name Lowercase component name
   */
  removeAllSubcomponents(name?: string)

  /**
   * Removes a single property by name or the instance of the specific
   * property.
   *
   * @param nameOrProp Property name or instance to remove
   * @return True, when deleted
   */
  removeProperty(nameOrProp: string | Property): boolean

  /**
   * Removes a single component by name or the instance of a specific
   * component.
   *
   * @param nameOrComp Name of component, or component
   * @return True when comp is removed
   */
  removeSubcomponent(nameOrComp: Component | string): boolean

  /**
   * Returns the Object representation of this component. The returned object
   * is a live jCal object and should be cloned if modified.
   */
  toJSON(): object

  /**
   * The string representation of this component.
   */
  toString(): string
}

/**
 * The ComponentParser is used to process a String or jCal Object, firing
 * callbacks for various found components, as well as completion.
 */
export class ComponentParser {
  /**
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
   * @param options Component parser options
   */
  constructor(options?: {
    /** Whether events should be parsed */
    parseEvent: boolean
    /** Whether timezones should be parsed */
    parseTimezeone: boolean
  })

  /** When true, parse events */
  parseEvent: boolean
  /** When true, parse timezones */
  parseTimezeone: boolean

  /**
   * Process a string or parse ical object.  This function itself will return
   * nothing but will start the parsing process.
   *
   * Events must be registered prior to calling this method.
   *
   * @param ical      The component to process,
   *        either in its final form, as a jCal Object, or string representation
   */
  process(ical: Component | string | object): void

  /**
   * Fired when parsing is complete
   */
  oncomplete(): void

  /**
   * Fired if an error occurs during parsing.
   *
   * @param err details of error
   */
  onerror(err: Error): void

  /**
   * Fired when a top level component (VTIMEZONE) is found
   *
   * @param component Timezone object
   */
  ontimezone(component: Timezone): void

  /**
   * Fired when a top level component (VEVENT) is found.
   *
   * @param component Top level component
   */
  onevent(component: Event): void
}

/**
 * This class represents the “duration” value type, with various calculation and 
 * manipulation methods.
 */
export class Duration {
  /**
   * @param data An object with members of the duration
   */
  constructor(data: {
    /** Duration in weeks */
    weeks: number
    /** Duration in days */
    days: number
    /** Duration in hours */
    hours: number
    /** Duration in minutes */
    minutes: number
    /** Duration in seconds */
    seconds: number
    /** If true, the duration is negative */
    isNegative: boolean
  })

    /**
   * The weeks in this duration
   * @default 0
   */
  weeks: number

  /**
   * The days in this duration
   * @default 0
   */
  days: number

  /**
   * The days in this duration
   * @default 0
   */
  hours: number

  /**
   * The minutes in this duration
   * @type {Number}
   * @default 0
   */
  minutes: number

  /**
   * The seconds in this duration
   * @default 0
   */
  seconds: number

  /**
   * This duration is negative
   * @default false
   */
  isNegative: boolean

  /**
   * The class identifier.
   * @constant
   * @default "icalduration"
   */
  icalclass: "icalduration"

  /**
   * The type name, to be used in the jCal object.
   * @constant
   * @default "duration"
   */
  icaltype: "duration"

  /**
   * Creates a new ICAL.Duration instance from the given data object.
   *
   * @param aData An object with members of the duration
   * @return The createad duration instance
   */
  static fromData(aData: {
    /** Duration in weeks */
    weeks: number
    /** Duration in days */
    days: number
    /** Duration in hours */
    hours: number
    /** Duration in minutes */
    minutes: number
    /** Duration in seconds */
    seconds: number
    /** If true, the duration is negative */
    isNegative: boolean
  }): Duration

  /**
   * Returns a new ICAL.Duration instance from the passed seconds value.
   *
   * @param aSeconds The seconds to create the instance from
   * @return The newly created duration instance
   */
  static fromSeconds(aSeconds: number): Duration

  /**
   * Creates a new {@link ICAL.Duration} instance from the passed string.
   *
   * @param aStr The string to parse
   * @return The created duration instance
   */
  static fromString(aStr: string): Duration

  /**
   * Checks if the given string is an iCalendar duration value.
   *
   * @param value The raw ical value
   * @return True, if the given value is of the duration ical type
   */
  static isValueString(value: string): boolean

  /**
   * Returns a clone of the duration object.
   *
   * @return The cloned object
   */
  clone(): Duration

  /**
   * Compares the duration instance with another one.
   *
   * @param aOther The instance to compare with
   * @return -1, 0 or 1 for less/equal/greater
   */
  compare(aOther: Duration): -1 | 0 | 1

  /**
   * Sets up the current instance using members from the passed data object.
   *
   * @param aData An object with members of the duration
   */
  fromData(aData: {
    /** Duration in weeks */
    weeks: number
    /** Duration in days */
    days: number
    /** Duration in hours */
    hours: number
    /** Duration in minutes */
    minutes: number
    /** Duration in seconds */
    seconds: number
    /** If true, the duration is negative */
    isNegative: boolean
  }): Duration

 /**
   * Reads the passed seconds value into this duration object. Afterwards,
   * members like {@link ICAL.Duration#days days} and {@link ICAL.Duration#weeks weeks} will be set up
   * accordingly.
   *
   * @param aSeconds The duration value in seconds
   * @return Returns this instance
   */
  fromSeconds(aSeconds: number): Duration

  /**
   * Normalizes the duration instance. For example, a duration with a value
   * of 61 seconds will be normalized to 1 minute and 1 second.
   */
  normalize(): void

  /**
   * Resets the duration instance to the default values, i.e. PT0S
   */
  reset(): void

  /**
   * The iCalendar string representation of this duration.
   */
  toICALString(): string

  /**
   * The duration value expressed as a number of seconds.
   * @return The duration value in seconds
   */
  toSeconds(): number

  /**
   * The string representation of this duration.
   */
  toString(): string
}

/**
 * ICAL.js is organized into multiple layers. The bottom layer is a raw jCal
 * object, followed by the component/property layer. The highest level is the
 * event representation, which this class is part of. See the layers guide for
 * more details.
 */
export class Event {
  /**
   * @param component The ICAL.Component to base this event on
   * @param options Options for this event
   */
  constructor(component: Component | undefined, options: {
    /**
     * When true, will verify exceptions are related by their UUID
     */
    strictExceptions: boolean

    /**
     * Exceptions to this event, either as components or events. If not
     * specified exceptions will automatically be set in relation of component’s 
     * parent
     */
    exceptions: (Component | Event)[]
  })

  /**
   * The attendees in the event
   */
  readonly attendees: Property[]

  /**
   * The event description.
   */
  description: string

  /**
   * The duration. This can be the result directly from the property, or the
   * duration calculated from start date and end date. Setting the property
   * will remove any `dtend` properties.
   */
  duration: Duration

  /**
   * The end date. This can be the result directly from the property, or the
   * end date calculated from start date and duration. Setting the property
   * will remove any duration properties.
   */
  endDate: Time

  /**
   * List of related event exceptions.
   */
  exceptions: Event[]

  /**
   * The location of the event.
   */
  location: string

  /**
   * The organizer value as an uri. In most cases this is a mailto: uri, but
   * it can also be something else, like urn:uuid:...
   */
  organizer: string

  /**
   * The recurrence id for this event. See terminology for details.
   */
  recurrenceId: Time

  /**
   * The sequence value for this event. Used for scheduling see terminology.
   */
  sequence: number

  /**
   * When true, will verify exceptions are related by their UUID.
   */
  strictExceptions: boolean

  /**
   * The event summary
   */
  summary: string

  /**
   * The uid of this event
   */
  uid: string

 /**
   * Finds the range exception nearest to the given date.
   *
   * @param time usually an occurrence time of an event
   * @return the related event/exception or null
   */
  findRangeException(time: Time): Event | null

  /**
   * Returns the occurrence details based on its start time.  If the
   * occurrence has an exception will return the details for that exception.
   *
   * NOTE: this method is intend to be used in conjunction
   *       with the {@link ICAL.Event#iterator iterator} method.
   *
   * @param occurrence time occurrence
   * @return Information about the occurrence
   */
  getOccurrenceDetails(occurrence: Time): Event.occurrenceDetails

  /**
   * Returns the types of recurrences this event may have. Returned as an
   * object with the following possible keys: - YEARLY - MONTHLY - WEEKLY -
   * DAILY - MINUTELY - SECONDLY
   * 
   * @returns Object of recurrence flags
   */
  getRecurrenceTypes(): { [key in Recur.frequencyValues]: boolean }

  /**
   * Checks if the event describes a recurrence exception. See
   * {@tutorial terminology} for details.
   *
   * @return True, if the even describes a recurrence exception
   */
  isRecurrenceException(): boolean

  /**
   * Checks if the event is recurring
   *
   * @return True, if event is recurring
   */
  isRecurring(): boolean

  /**
   * Builds a recur expansion instance for a specific point in time (defaults
   * to startDate).
   *
   * @param startTime Starting point for expansion
   * @return Expansion object
   */
  iterator(startTime: Time): RecurExpansion

  /**
   * Checks if this record is an exception and has the RANGE=THISANDFUTURE
   * value.
   *
   * @return True, when exception is within range
   */
  modifiesFuture(): boolean

  /**
   * Relates a given event exception to this object.  If the given component
   * does not share the UID of this event it cannot be related and will throw
   * an exception.
   *
   * If this component is an exception it cannot have other exceptions
   * related to it.
   *
   * @param obj Component or event
   */
  relateException(obj: Component | Event): void

  /**
   * The string representation of this event.
   */
  toString(): string
}

export namespace Event {
  /**
   * This object is returned by {@link ICAL.Event#getOccurrenceDetails getOccurrenceDetails}
   */
  interface occurrenceDetails {
    /** The passed in recurrence id */
    recurrenceId: Time
    /** The occurrence */
    item: Event
    /** The start of the occurrence */
    startDate: Time
    /** The end of the occurrence */
    endDate: Time
  }
}

/**
 * An error that occurred during parsing.
 */
export class ParserError {
  /**
   * @param message The error message
   */
  constructor(message: string)
}

/**
 * This class represents the “period” value type, with various calculation and
 * manipulation methods.
 */
export class Period {
  /**
   * The passed data object cannot contain both and end date and a duration.
   *
   * @param aData An object with members of the period
   */
  constructor(aData: {
    /** The start of the period */
    start?: Time
    /** The end of the period */
    end?: Time
  } | {
    /** The start of the period */
    start?: Time
    /** The duration of the period */
    duration?: Duration
  })

  /**
   * The duration of the period
   */
  duration: Duration

  /**
   * The end of the period
   */
  end: Time

  /**
   * The class identifier.
   */
  readonly icalclass: 'icalperiod'

  /**
   * The type name, to be used in the jCal object.
   */
  readonly icaltype: 'period'

  /**
   * The start of the period
   */
  start: Time

  /**
   * Creates a new {@link ICAL.Period} instance from the given data object.
   * The passed data object cannot contain both and end date and a duration.
   *
   * @param aData An object with members of the period
   * @return The period instance
   */
  static fromData(aData: {
    /** The start of the period */
    start?: Time
    /** The end of the period */
    end?: Time
  } | {
    /** The start of the period */
    start?: Time
    /** The duration of the period */
    duration?: Duration
  })

 /**
   * Returns a new period instance from the given jCal data array. The first
   * member is always the start date string, the second member is either a
   * duration or end date string.
   *
   * @param aData The jCal data array
   * @param aProp The property this jCal data is on
   * @return The period instance
   */
  static fromJSON(aData: [string, string][], aProp: Property): Period

   /**
   * Creates a new {@link ICAL.Period} instance from the passed string.
   *
   * @param str The string to parse
   * @param prop The property this period will be on
   * @return The created period instance
   */
  static fromString(str: string, prop: Property): Period


  /**
   * Returns a clone of the duration object.
   * @return The cloned object
   */
  clone(): Period


  /**
   * Calculates the duration of the period, either directly or by subtracting
   * start from end date.
   * @return The calculated duration
   */
  getDuration(): Duration

  /**
   * Calculates the end date of the period, either directly or by adding
   * duration to start date.
   * @return The calculated end date
   */
  getEnd(): Time

  /**
   * The iCalendar string representation of this period.
   */
  toICALString(): string

  /**
   * The jCal representation of this period type.
   */
  toJSON(): object

  /**
   * The string representation of this period.
   */
  toString(): string
}

/**
 * Provides a layer on top of the raw jCal object for manipulating a single
 * property, with its parameters and value.
 */
export class Property {
  /**
   * Its important to note that mutations done in the wrapper
   * directly mutate the jCal object used to initialize.
   *
   * Can also be used to create new properties by passing
   * the name of the property (as a String).
   *
   * @param jCal Raw jCal representation OR the new name of the property
   * @param parent Parent component
   */
  constructor(jCal: any[] | string, parent?: Component)

  /**
   * The name of this property, in lowercase.
   */
  readonly name: string

  /**
   * The parent component for this property.
   */
  readonly parent: Component

  /**
   * The value type for this property
   */
  readonly type: string

  /**
   * Create an {@link ICAL.Property} by parsing the passed iCalendar string.
   *
   * @param str The iCalendar string to parse
   * @param designSet The design data to use for this property
   * @return The created iCalendar property
   */
  static fromString(str: string, designSet?: design.designSet): Property


  /**
   * Get the default type based on this property's name.
   *
   * @return The default type for this property
   */
  getDefaultType(): string

  /**
   * Gets first parameter on the property.
   *
   * @param name Property name (lowercase)
   * @return Property value
   */
  getFirstParameter(name: string): string

  /**
   * Finds the first property value.
   *
   * @return First property value
   */
  getFirstValue(): string

  /**
   * Gets a parameter on the property.
   *
   * @param name Property name (lowercase)
   * @return Property value
   */
  getParameter(name: string): any[] | string

  /**
   * Gets all values on the property.
   *
   * NOTE: this creates an array during each call.
   *
   * @return List of values
   */
  getValues(): any[]

  /**
   * Removes all values from this property
   */
  removeAllValues(): void

  /**
   * Removes a parameter
   *
   * @param name The parameter name
   */
  removeParameter(name: string): void

  /**
   * Sets type of property and clears out any existing values of the current
   * type.
   *
   * @param type New iCAL type (see design.*.values)
   */
  resetType(type: string): void

  /**
   * Sets a parameter on the property.
   *
   * @param name  The parameter name
   * @param value The parameter value
   */
  setParameter(name: string, value: any[] | string): void

  /**
   * Sets the current value of the property. If this is a multi-value
   * property, all other values will be removed.
   *
   * @param value     New property value.
   */
  setValue(value: string | object): void

  /**
   * Sets the values of the property.  Will overwrite the existing values.
   * This can only be used for multi-value properties.
   *
   * @param values sAn array of values
   */
  setValues(values: any[])

  /**
   * The string representation of this component.
   */
  toICALString(): string

  /**
   * Returns the Object representation of this component. The returned object
   * is a live jCal object and should be cloned if modified.
   */
  toJSON(): object
}

/**
 * This class represents the “recur” value type, with various calculation and 
 * manipulation methods.
 */
export class Recur {
  /**
   * @param data An object with members of the recurrence
   */
  constructor(data: {
    /** The frequency value */
    freq?: Recur.frequencyValues
    /** The INTERVAL value */
    interval?: number
    /** The week start value */
    wkst?: Time.weekDay
    /** The end of the recurrence set */
    until?: Time
    /** The number of occurrences */
    count?: Number
    /** The seconds for the BYSECOND part */
    bysecond?: number[]
    /** The minutes for the BYMINUTE part */
    byminute?: number[]
    /** The hours for the BYHOUR part */
    byhour?: number[]
    /** The BYDAY values */
    byday?: string[]
    /** The days for the BYMONTHDAY part */
    bymonthday?: number[]
    /** The days for the BYYEARDAY part */
    byyearday?: number[]
    /** The weeks for the BYWEEKNO part */
    byweekno?: number[]
    /** The month for the BYMONTH part */
    bymonth?: number[]
    /** The positionals for the BYSETPOS part */
    bysetpos?: number[]
  })

  /**
   * The maximum number of occurrences
   */
  count?: number

  /**
   * The frequency value.
   */
  freq: Recur.frequencyValues

  /**
   * The class identifier.
   */
  readonly icalclass: 'icalrecur'

  /**
   * The type name, to be used in the jCal object.
   */
  icaltype: 'recur'

  /**
   * The interval value for the recurrence rule.
   */
  interval: number

  /**
   * An object holding the BY-parts of the recurrence rule
   */
  parts: { [key: string]: any }

  /**
   * The end of the recurrence
   */
  until?: Time

  /**
   * The week start day
   */
  wkst?: Time.weekDay

  /**
   * Converts a recurrence string to a data object, suitable for the fromData
   * method.
   *
   * @param string The string to parse
   * @param fmtIcal If true, the string is considered to be an iCalendar string
   * @return The recurrence instance
   */
  static _stringToData(string: string, fmtIcal: boolean): Recur


  /**
   * Creates a new {@link ICAL.Recur} instance using members from the passed
   * data object.
   */
  static fromData(data: {
    /** The frequency value */
    freq?: Recur.frequencyValues
    /** The INTERVAL value */
    interval?: number
    /** The week start value */
    wkst?: Time.weekDay
    /** The end of the recurrence set */
    until?: Time
    /** The number of occurrences */
    count?: Number
    /** The seconds for the BYSECOND part */
    bysecond?: number[]
    /** The minutes for the BYMINUTE part */
    byminute?: number[]
    /** The hours for the BYHOUR part */
    byhour?: number[]
    /** The BYDAY values */
    byday?: string[]
    /** The days for the BYMONTHDAY part */
    bymonthday?: number[]
    /** The days for the BYYEARDAY part */
    byyearday?: number[]
    /** The weeks for the BYWEEKNO part */
    byweekno?: number[]
    /** The month for the BYMONTH part */
    bymonth?: number[]
    /** The positionals for the BYSETPOS part */
    bysetpos?: number[]
  }): Recur

  /**
   * Creates a new {@link ICAL.Recur} instance from the passed string.
   *
   * @param string The string to parse
   * @return The created recurrence instance
   */
  static fromString(string: string): Recur

  /**
   * Convert an ical representation of a day (SU, MO, etc..)
   * into a numeric value of that day.
   *
   * @param string The iCalendar day name
   * @return Numeric value of given day
   */
  static icalDayToNumericDay(string: string): number

  /**
   * Convert a numeric day value into its ical representation (SU, MO, etc..)
   *
   * @param num Numeric value of given day
   * @return The ICAL day value, e.g SU,MO,...
   */
  static numericDayToIcalDay(num: number): string

  /**
   * Adds a component (part) to the recurrence rule. This is not a component
   * in the sense of {@link ICAL.Component}, but a part of the recurrence
   * rule, i.e. BYMONTH.
   *
   * @param aType The name of the component part
   * @param aValue The component value
   */
  addComponent(aType: string, aValue: any[] | string): void

  /**
   * Returns a clone of the recurrence object.
   *
   * @return {ICAL.Recur}      The cloned object
   */
  clone(): Recur

  /**
   * Sets up the current instance using members from the passed data object.
   */
  fromData(data: {
    /** The frequency value */
    freq?: Recur.frequencyValues
    /** The INTERVAL value */
    interval?: number
    /** The week start value */
    wkst?: Time.weekDay
    /** The end of the recurrence set */
    until?: Time
    /** The number of occurrences */
    count?: Number
    /** The seconds for the BYSECOND part */
    bysecond?: number[]
    /** The minutes for the BYMINUTE part */
    byminute?: number[]
    /** The hours for the BYHOUR part */
    byhour?: number[]
    /** The BYDAY values */
    byday?: string[]
    /** The days for the BYMONTHDAY part */
    bymonthday?: number[]
    /** The days for the BYYEARDAY part */
    byyearday?: number[]
    /** The weeks for the BYWEEKNO part */
    byweekno?: number[]
    /** The month for the BYMONTH part */
    bymonth?: number[]
    /** The positionals for the BYSETPOS part */
    bysetpos?: number[]
  }): Recur

  /**
   * Gets (a copy) of the requested component value.
   *
   * @param aType The component part name
   * @return The component part value
   */
  getComponent(aType: string): any[]

  /**
   * Retrieves the next occurrence after the given recurrence id. See the
   * guide on {@tutorial terminology} for more details.
   *
   * NOTE: Currently, this method iterates all occurrences from the start
   * date. It should not be called in a loop for performance reasons. If you
   * would like to get more than one occurrence, you can iterate the
   * occurrences manually, see the example on the
   * {@link ICAL.Recur#iterator iterator} method.
   *
   * @param aStartTime The start of the event series
   * @param aRecurrenceId The date of the last occurrence
   * @return The next occurrence after
   */
  getNextOccurrence(aStartTime: Time, aRecurrenceId: Time): Time

  /**
   * Checks if the current rule has a count part, and not limited by an until
   * part.
   *
   * @return {Boolean}        True, if the rule is by count
   */
  isByCount(): boolean

  /**
   * Checks if the current rule is finite, i.e. has a count or until part.
   *
   * @return True, if the rule is finite
   */
  isFinite(): boolean

  /**
   * Create a new iterator for this recurrence rule. The passed start date
   * must be the start date of the event, not the start of the range to
   * search in.
   *
   * @example
   *
   * var recur = comp.getFirstPropertyValue('rrule');
   * var dtstart = comp.getFirstPropertyValue('dtstart');
   * var iter = recur.iterator(dtstart);
   * for (var next = iter.next(); next; next = iter.next()) {
   *   if (next.compare(rangeStart) < 0) {
   *     continue;
   *   }
   *   console.log(next.toString());
   * }
   *
   * @param aStart The item's start date
   * @return The recurrence iterator
   */
  iterator(aStart: Time): RecurIterator

  /**
   * Sets the component value for the given by-part.
   *
   * @param aType   The component part name
   * @param aValues The component values
   */
  setComponent(aType: string, aValues: any[]): void

  /**
   * The jCal representation of this recurrence type.
   * @return {Object}
   */
  toJSON(): object

  /**
   * The string representation of this recurrence rule.
   * @return {String}
   */
  toString(): string
}

export namespace Recur {
  /**
   * Possible frequency values for the FREQ part.
   */
  type frequencyValues = 'SECONDLY' | 'MINUTELY' | 'HOURLY' | 'DAILY' |
    'WEEKLY' | 'MONTHLY' | 'YEARLY'
}

/**
 * Primary class for expanding recurring rules.  Can take multiple rrules,
 * rdates, exdate(s) and iterate (in order) over each next occurrence.
 *
 * Once initialized this class can also be serialized saved and continue
 * iteration from the last point.
 *
 * NOTE: it is intended that this class is to be used
 *       with ICAL.Event which handles recurrence exceptions.
 */
export class RecurExpansion {
  /**
   * @example
   * // assuming event is a parsed ical component
   * var event;
   *
   * var expand = new ICAL.RecurExpansion({
   *   component: event,
   *   dtstart: event.getFirstPropertyValue('dtstart')
   * });
   *
   * // remember there are infinite rules
   * // so its a good idea to limit the scope
   * // of the iterations then resume later on.
   *
   * // next is always an ICAL.Time or null
   * var next;
   *
   * while (someCondition && (next = expand.next())) {
   *   // do something with next
   * }
   *
   * // save instance for later
   * var json = JSON.stringify(expand);
   *
   * //...
   *
   * // NOTE: if the component's properties have
   * //       changed you will need to rebuild the
   * //       class and start over. This only works
   * //       when the component's recurrence info is the same.
   * var expand = new ICAL.RecurExpansion(JSON.parse(json));
   *
   * @description
   * The options object can be filled with the specified initial values. It can
   * also contain additional members, as a result of serializing a previous
   * expansion state, as shown in the example.
   *
   * @param options Recurrence expansion options
   */
  constructor(options: {
    /** Start time of the event */
    dtstart: Time
    /** Component for expansion, required if not resuming. */
    component?: Component
  })

  /**
   * True when iteration is fully completed.
   */
  complete: boolean

  /**
   * Start date of recurring rules.
   */ 
  dtstart: Time

  /**
   * Last expanded time
   */
  last: Time

  /**
   * Initialize the recurrence expansion from the data object. The options 
   * object may also contain additional members, see the constructor for more 
   * details.
   * @param options Recurrence expansion options
   */
  fromData(options: {
    /** Start time of the event */
    dtstart: Time
    /** Component for expansion, required if not resuming. */
    component?: Component
  })

  /**
   * Retrieve the next occurrence in the series.
   */
  next(): Time

  /**
   * Converts object into a serialize-able format. This format can be passed
   * back into the expansion to resume iteration.
   */
  toJSON(): object
}

/**
 * An iterator for a single recurrence rule. This class usually doesn't have
 * to be instanciated directly, the convenience method
 * {@link ICAL.Recur#iterator} can be used.
 */
export class RecurIterator {
  /**
   * The options object may contain additional members when resuming iteration
   * from a previous run.
   *
   * @param options The iterator options
   */
  constructor(options: {
    /** The rule to iterate. */
    rule: Recur
    /** The start date of the event. */
    dtstart: Time
    /**
     * When true, assume that options are from a previously constructed 
     * iterator. Initialization will not be repeated.
     */
    initialized?: boolean
  })

  /**
   * True when iteration is finished.
   */
  completed: boolean

  /**
   * The start date of the event being iterated.
   */
  dtstart: Time

  /**
   * The last occurrence that was returned from the
   * {@link ICAL.RecurIterator#next} method.
   */
  last: Time

  /**
   * The sequence number from the occurrence
   */
  occurrence_number: number

  /**
   * The rule that is being iterated
   */
  rule: Recur


  /**
   * Initialize the recurrence iterator from the passed data object. This method
   * is usually not called directly, you can initialize the iterator through the
   * constructor.
   *
   * @param options The iterator options
   */
  fromData(options: {
    /** The rule to iterate. */
    rule: Recur
    /** The start date of the event. */
    dtstart: Time
    /**
     * When true, assume that options are from a previously constructed 
     * iterator. Initialization will not be repeated.
     */
    initialized?: boolean
  }): void

  /**
   * Retrieve the next occurrence from the iterator.
   */
  next(): Time

  /**
   * Convert iterator into a serialize-able object. Will preserve current 
   * iteration sequence to ensure the seamless continuation of the recurrence 
   * rule.
   */
  toJSON(): object
}

/**
 * iCalendar Time representation (similar to JS Date object). Fully independent
 * of system (OS) timezone / time.
 * Unlike JS Date, the month January is 1, not zero.
 */
export class Time {
  /**
   * @example
   * var time = new ICAL.Time({
   *   year: 2012,
   *   month: 10,
   *   day: 11
   *   minute: 0,
   *   second: 0,
   *   isDate: false
   * });
   *
   * @param data Time initialization
   * @param zone Timezone this position occurs in
   */
  constructor(data: {
    /** The year for this date */
    year?: number
    /** The month for this date */
    month?: number
    /** The day for this date */
    day?: number
    /** The hour for this date */
    hour?: number
    /** The minute for this date */
    minute?: number
    /** The second for this date */
    second?: number
    /** If true, the instance represents a date (as opposed to a date-time) */
    isDate?: boolean
  }, zone: Timezone)

  /**
   * The days that have passed in the year after a given month. The array has
   * two members, one being an array of passed days for non-leap years, the
   * other analog for leap years.
   * @example
   *
   * var isLeapYear = ICAL.Time.isLeapYear(year);
   * var passedDays = ICAL.Time.daysInYearPassedMonth[isLeapYear][month];
   */
  static daysInYearPassedMonth: [number[], number[]]

  /**
   * The default weekday for the WKST part.
   * @default ICAL.Time.MONDAY
   */
  static readonly DEFAULT_WEEK_START: Time

  /**
   * January 1st, 1970 as an ICAL.Time.
   */
  static readonly epochTime: Time

  /**
   * The class identifier.
   */
  readonly icalclass: string

  /**
   * The type name, to be used in the jCal object. This value may change and
   * is strictly defined by the isDate member.
   */
  readonly icaltype: string

  /**
   * The timezone for this time.
   */
  zone: Timezone

  /**
   * Returns the days in the given month
   *
   * @param month      The month to check
   * @param year       The year to check
   * @return           The number of days in the month
   */
  static daysInMonth(month: number, year: number): number

  /**
   * Creates a new ICAL.Time instance from the the passed data object.
   * @param data Time initialization
   * @param zone Timezone this position occurs in
   */
  static fromData(data: {
    /** The year for this date */
    year?: number
    /** The month for this date */
    month?: number
    /** The day for this date */
    day?: number
    /** The hour for this date */
    hour?: number
    /** The minute for this date */
    minute?: number
    /** The second for this date */
    second?: number
    /** If true, the instance represents a date (as opposed to a date-time) */
    isDate?: boolean
  }, zone?: Timezone): Time

  /**
   * Returns a new ICAL.Time instance from a date string, e.g 2015-01-02.
   *
   * @param aValue     The string to create from
   * @return The date/time instance
   */
  static fromDateString(aValue: string): Time

  /**
   * Returns a new ICAL.Time instance from a date-time string, e.g
   * 2015-01-02T03:04:05. If a property is specified, the timezone is set up
   * from the property's TZID parameter.
   *
   * @param aValue The string to create from
   * @param prop   The property the date belongs to
   * @return       The date/time instance
   */
  static fromDateTimeString(aValue: string, prop?: Property): Time

  /**
   * Create a new ICAL.Time from the day of year and year. The date is returned
   * in floating timezone.
   *
   * @param {Number} aDayOfYear     The day of year
   * @param {Number} aYear          The year to create the instance in
   * @return The created instance with the calculated date
   */
  static fromDayOfYear(aDayOfYear: number, aYear: number): Time

  /**
   * Creates a new ICAL.Time instance from the given Javascript Date.
   *
   * @param aDate     The Javascript Date to read, or null to reset
   * @param useUTC  If true, the UTC values of the date will be used
   */
  static fromJSDate(aDate: Date | null, useUTC: boolean): Time

  /**
   * Returns a new ICAL.Time instance from a date or date-time string,
   *
   * @param aValue The string to create from
   * @return The date/time instance
   */
  static fromString(aValue: string): Time

  /**
   * Returns a new ICAL.Time instance from a date string, e.g 2015-01-02.
   *
   * @deprecated Use {@link ICAL.Time.fromDateString} instead
   * @param str The string to create from
   * @return The date/time instance
   */
  fromStringv2(str: string): Time

  /**
   * Get the dominical letter for the given year. Letters range from A - G for
   * common years, and AG to GF for leap years.
   *
   * @param yr           The year to retrieve the letter for
   * @return             The dominical letter.
   */
  static getDominicalLetter(yr: number): string

  /**
   * Checks if the year is a leap year
   *
   * @param year The year to check
   * @return True, if the year is a leap year
   */
  static isLeapYear(year: number): boolean

  /**
   * Creates a new ICAL.Time instance from the current moment.
   * @return {ICAL.Time}
   */
  static now(): Time

  /**
   * Returns the date on which ISO week number 1 starts.
   *
   * @see ICAL.Time#weekNumber
   * @param aYear      The year to search in
   * @param aWeekStart The week start weekday, used for calculation.
   * @return           The date on which week number 1 starts
   */
  static weekOneStarts(aYear: number, aWeekStart?: Time.weekDay): Time

  /**
   * Adds the duration to the current time. The instance is modified in
   * place.
   *
   * @param aDuration         The duration to add
   */
  addDuration(duration: Duration): void

  /**
   * Adjust the date/time by the given offset
   *
   * @param aExtraDays    The extra amount of days
   * @param aExtraHours   The extra amount of hours
   * @param aExtraMinutes The extra amount of minutes
   * @param aExtraSeconds The extra amount of seconds
   * @param aTime         The time to adjust, defaults to the current instance.
   *                                    
   */
  adjust(aExtraDays: number, aExtraHours: number,
    aExtraMinutes: number, aExtraSeconds: number, aTime?: number): void

  /**
   * Returns a clone of the time object.
   *
   * @return The cloned object
   */
  clone(): Time

  /**
   * Compares the ICAL.Time instance with another one.
   *
   * @param aOther The instance to compare with
   * @return -1, 0 or 1 for less/equal/greater
   */
  compare(other: Duration): -1 | 0 | 1

  /**
   * Compares only the date part of this instance with another one.
   *
   * @param other The instance to compare with
   * @param tz    The timezone to compare in
   * @return -1, 0 or 1 for less/equal/greater
   */
  compareDateOnlyTz(other: Duration, tz: Timezone): -1 | 0 | 1

  /**
   * Convert the instance into another timzone. The returned ICAL.Time
   * instance is always a copy.
   *
   * @param zone The zone to convert to
   * @return The copy, converted to the zone
   */
  convertToZone(zone: Timezone): Time

  /**
   * Calculate the day of week.
   */
  dayOfWeek(): Time.weekDay

  /**
   * Calculate the day of year.
   */
  dayOfYear(): number

  /**
   * Returns a copy of the current date/time, shifted to the end of the
   * month.  The resulting ICAL.Time instance is of icaltype date, even if
   * this is a date-time.
   *
   * @return The end of the month (cloned)
   */
  endOfMonth(): Time

  /**
   * Returns a copy of the current date/time, shifted to the end of the week.
   * The resulting ICAL.Time instance is of icaltype date, even if this is a
   * date-time.
   *
   * @param aWeekStart The week start weekday, defaults to SUNDAY
   * @return The end of the week (cloned)
   */
  endOfWeek(aWeekStart?: Time.weekDay): Time

  /**
   * Returns a copy of the current date/time, shifted to the end of the
   * year.  The resulting ICAL.Time instance is of icaltype date, even if
   * this is a date-time.
   *
   * @return The end of the year (cloned)
   */
  endOfYear(): Time

  /**
   * Sets up the current instance using members from the passed data object.
   * @param data Time initialization
   * @param zone Timezone this position occurs in
   */
  fromData(data: {
    /** The year for this date */
    year?: number
    /** The month for this date */
    month?: number
    /** The day for this date */
    day?: number
    /** The hour for this date */
    hour?: number
    /** The minute for this date */
    minute?: number
    /** The second for this date */
    second?: number
    /** If true, the instance represents a date (as opposed to a date-time) */
    isDate?: boolean
  }, zone?: Timezone): void

  /**
   * Set up the current instance from the Javascript date value.
   *
   * @param aDate   The Javascript Date to read, or null to reset
   * @param useUTC  If true, the UTC values of the date will be used
   */
  fromJSDate(aDate: Date | null, useUTC: boolean)

  /**
   * Sets up the current instance from unix time, the number of seconds since
   * January 1st, 1970.
   *
   * @param seconds The seconds to set up with
   */
  fromUnixTime(seconds: number): void

  /**
   * Get the dominical letter for the current year. Letters range from A - G
   * for common years, and AG to GF for leap years.
   *
   * @return The dominical letter.
   */
  getDominicalLetter(): string

  /**
   * Checks if current time is the nth weekday, relative to the current
   * month.  Will always return false when rule resolves outside of current
   * month.
   *
   * @param aDayOfWeek Day of week to check
   * @param aPos       Relative position
   * @return True, if its the nth weekday
   */
  isNthWeekDay(aDayOfWeek: Time.weekDay, aPos: number): boolean

  /**
   * Finds the nthWeekDay relative to the current month (not day).  The
   * returned value is a day relative the month that this month belongs to so
   * 1 would indicate the first of the month and 40 would indicate a day in
   * the following month.
   *
   * @param aDayOfWeek   Day of the week see the day name constants
   * @param aPos         Nth occurrence of a given week day values
   *        of 1 and 0 both indicate the first weekday of that type. aPos may
   *        be either positive or negative
   *
   * @return numeric value indicating a day relative
   *                   to the current month of this time object
   */
  nthWeekDay(aDayOfWeek: number, aPos: number): number

  /**
   * Reset the time instance to epoch time
   */
  reset(): void

  /**
   * Reset the time instance to the given date/time values.
   *
   * @param year             The year to set
   * @param month            The month to set
   * @param day              The day to set
   * @param hour             The hour to set
   * @param minute           The minute to set
   * @param second           The second to set
   * @param timezone  The timezone to set
   */
  resetTo(year: number, month: number, day: number, hour: number, minute: number, second: number, timezone: Timezone): void

  /**
   * First calculates the start of the week, then returns the day of year for
   * this date. If the day falls into the previous year, the day is zero or negative.
   *
   * @param aFirstDayOfWeek The week start weekday, defaults to SUNDAY
   * @return The calculated day of year
   */
  startDoyWeek(aFirstDayOfWeek?: Time.weekDay): number

  /**
   * Returns a copy of the current date/time, rewound to the start of the
   * month. The resulting ICAL.Time instance is of icaltype date, even if
   * this is a date-time.
   *
   * @return The start of the month (cloned)
   */
  startOfMonth(): Time

  /**
   * Returns a copy of the current date/time, rewound to the start of the
   * week. The resulting ICAL.Time instance is of icaltype date, even if this
   * is a date-time.
   *
   * @param aWeekStart The week start weekday, defaults to SUNDAY
   * @return The start of the week (cloned)
   */
  startOfWeek(aWeekStart?: Time.weekDay): Time

  /**
   * Returns a copy of the current date/time, rewound to the start of the
   * year. The resulting ICAL.Time instance is of icaltype date, even if
   * this is a date-time.
   *
   * @return The start of the year (cloned)
   */
  startOfYear(): Time

  /**
   * Subtract the date details (_excluding_ timezone).  Useful for finding
   * the relative difference between two time objects excluding their
   * timezone differences.
   *
   * @param aDate The date to substract
   * @return The difference as a duration
   */
  subtractDate(aDate: Time): Duration

  /**
   * Subtract the date details, taking timezones into account.
   *
   * @param aDate The date to subtract
   * @return The difference in duration
   */
  subtractDateTz(aDate: Time): Duration

  /**
   * Returns an RFC 5545 compliant ical representation of this object.
   *
   * @return {String} ical date/date-time
   */
  toICALString(): string

  /**
   * Converts the current instance to a Javascript date
   */
  toJSDate(): Date

  /**
   * Converts time to into Object which can be serialized then re-created
   * using the constructor.
   *
   * @example
   * // toJSON will automatically be called
   * var json = JSON.stringify(mytime);
   *
   * var deserialized = JSON.parse(json);
   *
   * var time = new ICAL.Time(deserialized);
   *
   */
  toJSON(): object

  /**
   * The string representation of this date/time, in jCal form
   * (including : and - separators).
   */
  toString(): string

  /**
   * Converts the current instance to seconds since January 1st 1970.
   *
   * @return {Number}         Seconds since 1970
   */
  toUnixTime(): number

  /**
   * Calculates the UTC offset of the current date/time in the timezone it is
   * in.
   *
   * @return {Number}     UTC offset in seconds
   */
  utcOffset(): number

  /**
   * Calculates the ISO 8601 week number. The first week of a year is the
   * week that contains the first Thursday. The year can have 53 weeks, if
   * January 1st is a Friday.
   *
   * Note there are regions where the first week of the year is the one that
   * starts on January 1st, which may offset the week number. Also, if a
   * different week start is specified, this will also affect the week
   * number.
   *
   * @see ICAL.Time.weekOneStarts
   * @param aWeekStart The weekday the week starts with
   * @return The ISO week number
   */
  weekNumber(aWeekStart: Time.weekDay): number
}


export namespace Time {
  /**
   * The weekday, 1 = SUNDAY, 7 = SATURDAY. Access via
   * ICAL.Time.MONDAY, ICAL.Time.TUESDAY, ...
   *
   * @typedef {Number} weekDay
   * @memberof ICAL.Time
   */
  export const enum weekDay {
    SUNDAY = 1,
    MONDAY = 2,
    TUESDAY = 3,
    WEDNESDAY = 4,
    THURSDAY = 5,
    FRIDAY = 6,
    SATURDAY = 7,
  }
}

/**
 * Timezone representation, created by passing in a tzid and component.
 */
export class Timezone {
  /**
   * @example
   * 
   * var vcalendar;
   * var timezoneComp = vcalendar.getFirstSubcomponent('vtimezone');
   * var tzid = timezoneComp.getFirstPropertyValue('tzid');
   *
   * var timezone = new ICAL.Timezone({
   *   component: timezoneComp,
   *   tzid
   * });
   * @param data options for class
   */
  constructor(data: Component | {
    /**
     * If data is a simple object, then this member can be set to either a
     * string containing the component data, or an already parsed
     * ICAL.Component
     */
    component: string | Component

    /** The timezone identifier */
    tzid: string
    /** The timezone locationw */
    location: string
    /** An alternative string representation of the timezone */
    tznames: string
    /** The latitude of the timezone */
    latitude: number
    /** The longitude of the timezone */
    longitude: number
  })

  /**
   * The instance describing the local timezone
   */
  static readonly localTimezone: Timezone

  /**
   * The instance describing the UTC timezone
   */
  static readonly utcTimezone: Timezone

  /**
   * The vtimezone component for this timezone.
   */
  component: Component

  /**
   * The class identifier.
   */
  readonly icalclass: 'icaltimezone'

  /**
   * The primary latitude for the timezone.
   */
  latitude: number

  /**
   * Timezone location
   */
  location: string

  /**
   * The primary longitude for the timezone.
   */
  longitude: number

  /**
   * Timezone identifier
   */
  tzid: string

  /**
   * Alternative timezone name, for the string representation
   */
  tznames: string

  /**
   * Convert the date/time from one zone to the next.
   *
   * @param t            The time to convert
   * @param from_zone    The source zone to convert from
   * @param to_zone      The target zone to conver to
   * @return             The converted date/time object
   */
  static convert_time(tt: Time, from_zone: Timezone, to_zone: Timezone): Time

  /**
   * Creates a new ICAL.Timezone instance from the passed data object.
   * @param data options for class
   */
  static fromData(data: Component | {
    /**
     * If data is a simple object, then this member can be set to either a
     * string containing the component data, or an already parsed
     * ICAL.Component
     */
    component: string | Component

    /** The timezone identifier */
    tzid: string
    /** The timezone locationw */
    location: string
    /** An alternative string representation of the timezone */
    tznames: string
    /** The latitude of the timezone */
    latitude: number
    /** The longitude of the timezone */
    longitude: number
  }): Timezone

  /**
   * Sets up the current instance using members from the passed data object.
   * @param data options for class
   */
  fromData(data: Component | {
    /**
     * If data is a simple object, then this member can be set to either a
     * string containing the component data, or an already parsed
     * ICAL.Component
     */
    component: string | Component

    /** The timezone identifier */
    tzid: string
    /** The timezone locationw */
    location: string
    /** An alternative string representation of the timezone */
    tznames: string
    /** The latitude of the timezone */
    latitude: number
    /** The longitude of the timezone */
    longitude: number
  }): void

  /**
   * The string representation of this timezone.
   */
  toString(): string

  /**
   * Finds the utcOffset the given time would occur in this timezone.
   *
   * @param tt The time to check for
   * @return utc offset in seconds
   */
  utcOffset(tt: Time): number
}

/**
 * This class represents the “duration” value type, with various calculation
 * and manipulation methods.
 */
export class UtcOffset {
  /**
   * @param aData An object with members of the utc offset
   */
  constructor(aData: {
    /** The hours for the utc offset */
    hours?: number
    /** The minutes in the utc offset */
    minutes?: number
    /** The factor for the utc-offset, either -1 or 1 */
    factor: -1 | 1,
  })

  /**
   * The sign of the utc offset, 1 for positive offset, -1 for negative offsets.
   */
  factor: -1 | 1

  /**
   * The hours in the utc-offset
   */
  hours: number

  /**
   * The type name, to be used in the jCal object.
   */
  readonly icaltype: 'utc-offset'

  /**
   * The minutes in the utc-offset
   */
  minutes: number

  /**
   * Creates a new {@link ICAL.UtcOffset} instance from the passed seconds
   * value.
   *
   * @param {Number} aSeconds       The number of seconds to convert
   */
  static fromSeconds(aSeconds: number): UtcOffset

  /**
   * Creates a new {@link ICAL.UtcOffset} instance from the passed string.
   *
   * @param aString The string to parse
   * @return The created utc-offset instance
   */
  static fromString(aString): UtcOffset

  /**
   * Returns a clone of the utc offset object.
   *
   * @return {ICAL.UtcOffset}     The cloned object
   */
  clone(): UtcOffset

  /**
   * Compare this utc offset with another one.
   *
   * @param {ICAL.UtcOffset} other        The other offset to compare with
   * @return {Number}                     -1, 0 or 1 for less/equal/greater
   */
  compare(other: UtcOffset): -1 | 0 | 1

  /**
   * Sets up the current instance using members from the passed data object.
   * @param aData An object with members of the utc offset
   */
  fromData(aData: {
    /** The hours for the utc offset */
    hours?: number
    /** The minutes in the utc offset */
    minutes?: number
    /** The factor for the utc-offset, either -1 or 1 */
    factor: -1 | 1,
  }): void

  /**
   * Sets up the current instance from the given seconds value. The seconds
   * value is truncated to the minute. Offsets are wrapped when the world
   * ends, the hour after UTC+14:00 is UTC-12:00.
   *
   * @param {Number} aSeconds         The seconds to convert into an offset
   */
  fromSeconds(aSeconds: number): UtcOffset

  /**
   * The iCalendar string representation of this utc-offset.
   * @return {String}
   */
  toICALString(): string

  /**
   * Convert the current offset to a value in seconds
   *
   * @return {Number}                 The offset in seconds
   */
  toSeconds(): number

  /**
   * The string representation of this utc-offset.
   * @return {String}
   */
  toString(): string
}

/**
 * Describes a vCard time, which has slight differences to the ICAL.Time.
 * Properties can be null if not specified, for example for dates with
 * reduced accuracy or truncation.
 *
 * Note that currently not all methods are correctly re-implemented for
 * VCardTime. For example, comparison will have undefined results when some
 * members are null.
 *
 * Also, normalization is not yet implemented for this class!
 */
export class VCardTime extends Time {
  /**
   * @param data The data for the time instance
   * @param zone The timezone to use
   * @param icaltype The type for this date/time object
   */
  constructor(data: {
    /** The year for this date */
    year?: number
    /** The month for this date */
    month?: number
    /** The day for this date */
    day?: number
    /** The hour for this date */
    hour?: number
    /** The minute for this date */
    minute?: number
    /** The second for this date */
    second?: number
    /** If true, the instance represents a date (as opposed to a date-time) */
    isDate?: boolean
  }, zone: Timezone | UtcOffset, icaltype: string)

  /** The class identifier. */
  static readonly icalclass: 'vcardtime'
  
  /** The type name, to be used in the jCal object. */
  static readonly icaltype: 'date-and-or-time'

  /**
   * The timezone. This can either be floating, UTC, or an instance of
   * ICAL.UtcOffset.
   */
  static zone: Timezone | UtcOffset

  /**
   * The class identifier.
   */
  readonly icalclass: 'icaltime'

  /**
   * The type name, to be used in the jCal object. This value may change and is strictly defined by the isDate member.
   */
  readonly icaltype: 'date-time'

  /**
   * Returns a clone of the vcard date/time object.
   *
   * @return The cloned object
   */
  static clone(): VCardTime

  /**
   * Returns a new ICAL.VCardTime instance from a date and/or time string.
   *
   * @param aValue     The string to create from
   * @param aIcalType  The type for this instance, e.g. date-and-or-time
   * @return The date/time instance
   */
  static fromDateAndOrTimeString(aValue: string, aIcalType: string): VCardTime

  /**
   * Returns an RFC 6350 compliant representation of this object.
   *
   * @return vcard date/time string
   */
  toICALString(): string

  /**
   * The string representation of this date/time, in jCard form
   * (including : and - separators).
   */
  toString(): string

  /**
   * Adds the duration to the current time. The instance is modified in
   * place.
   *
   * @param aDuration         The duration to add
   */
  addDuration(aDuration: Duration): void

  /**
   * Adjust the date/time by the given offset
   *
   * @param aExtraDays       The extra amount of days
   * @param aExtraHours      The extra amount of hours
   * @param aExtraMinutes    The extra amount of minutes
   * @param aExtraSeconds    The extra amount of seconds
   * @param aTime         The time to adjust, defaults to the current instance.
   */
  adjust(aExtraDays: number, aExtraHours: number,
    aExtraMinutes: number, aExtraSeconds: number, aTime?: number): void

  /**
   * Returns a clone of the time object.
   *
   * @return The cloned object
   */
  clone(): Time

  /**
   * Compares the ICAL.Time instance with another one.
   *
   * @param aOther The instance to compare with
   * @return -1, 0 or 1 for less/equal/greater
   */
  compare(other: Duration): -1 | 0 | 1

  /**
   * Compares only the date part of this instance with another one.
   *
   * @param {ICAL.Duration} other         The instance to compare with
   * @param {ICAL.Timezone} tz            The timezone to compare in
   * @return {Number}                     -1, 0 or 1 for less/equal/greater
   */
  compareDateOnlyTz(other: Duration, tz: Timezone): -1 | 0 | 1
  
  /**
   * Convert the instance into another timzone. The returned ICAL.Time
   * instance is always a copy.
   *
   * @param {ICAL.Timezone} zone      The zone to convert to
   * @return {ICAL.Time}              The copy, converted to the zone
   */
  convertToZone(zone: Timezone): Time

  /**
   * Calculate the day of week.
   */
  dayOfWeek(): Time.weekDay

  /**
   * Calculate the day of year.
   */
  dayOfYear(): number

  /**
   * Returns a copy of the current date/time, shifted to the end of the
   * month.  The resulting ICAL.Time instance is of icaltype date, even if
   * this is a date-time.
   *
   * @return {ICAL.Time}      The end of the month (cloned)
   */
  endOfMonth(): Time

  /**
   * Returns a copy of the current date/time, shifted to the end of the week.
   * The resulting ICAL.Time instance is of icaltype date, even if this is a
   * date-time.
   *
   * @param {ICAL.Time.weekDay=} aWeekStart
   *        The week start weekday, defaults to SUNDAY
   * @return {ICAL.Time} The end of the week (cloned)
   */
  endOfWeek(aWeekStart?: Time.weekDay): Time

  /**
   * Returns a copy of the current date/time, shifted to the end of the
   * year.  The resulting ICAL.Time instance is of icaltype date, even if
   * this is a date-time.
   *
   * @return {ICAL.Time}      The end of the year (cloned)
   */
  endOfYear(): Time

  /**
   * Sets up the current instance using members from the passed data object.
   * @param data The data for the time instance
   * @param icaltype Timezone this position occurs in
   */
  fromData(aData: {
    /** The year for this date */
    year?: number
    /** The month for this date */
    month?: number
    /** The day for this date */
    day?: number
    /** The hour for this date */
    hour?: number
    /** The minute for this date */
    minute?: number
    /** The second for this date */
    second?: number
    /** If true, the instance represents a date (as opposed to a date-time) */
    isDate?: boolean
  }, aZone?: Timezone): void

  /**
   * Set up the current instance from the Javascript date value.
   *
   * @param aDate     The Javascript Date to read, or null to reset
   * @param useUTC  If true, the UTC values of the date will be used
   */
  fromJSDate(aDate: Date | null, useUTC: boolean): void

  /**
   * Sets up the current instance from unix time, the number of seconds since
   * January 1st, 1970.
   *
   * @param {Number} seconds      The seconds to set up with
   */
  fromUnixTime(seconds: number): void

  /**
   * Get the dominical letter for the current year. Letters range from A - G
   * for common years, and AG to GF for leap years.
   *
   * @param {Number} yr           The year to retrieve the letter for
   * @return {String}             The dominical letter.
   */
  getDominicalLetter(): string

  /**
   * Checks if current time is the nth weekday, relative to the current
   * month.  Will always return false when rule resolves outside of current
   * month.
   *
   * @param {ICAL.Time.weekDay} aDayOfWeek       Day of week to check
   * @param {Number} aPos                        Relative position
   * @return {Boolean}                           True, if its the nth weekday
   */
  isNthWeekDay(aDayOfWeek: Time.weekDay, aPos: number): boolean

  /**
   * Finds the nthWeekDay relative to the current month (not day).  The
   * returned value is a day relative the month that this month belongs to so
   * 1 would indicate the first of the month and 40 would indicate a day in
   * the following month.
   *
   * @param {Number} aDayOfWeek   Day of the week see the day name constants
   * @param {Number} aPos         Nth occurrence of a given week day values
   *        of 1 and 0 both indicate the first weekday of that type. aPos may
   *        be either positive or negative
   *
   * @return {Number} numeric value indicating a day relative
   *                   to the current month of this time object
   */
  nthWeekDay(aDayOfWeek: number, aPos: number): number

  /**
   * Reset the time instance to epoch time
   */
  reset(): void

  /**
   * Reset the time instance to the given date/time values.
   *
   * @param {Number} year             The year to set
   * @param {Number} month            The month to set
   * @param {Number} day              The day to set
   * @param {Number} hour             The hour to set
   * @param {Number} minute           The minute to set
   * @param {Number} second           The second to set
   * @param {ICAL.Timezone} timezone  The timezone to set
   */
  resetTo(year: number, month: number, day: number,
    hour: number, minute: number, second: number, timezone: Timezone)

  /**
   * First calculates the start of the week, then returns the day of year for
   * this date. If the day falls into the previous year, the day is zero or negative.
   *
   * @param {ICAL.Time.weekDay=} aFirstDayOfWeek
   *        The week start weekday, defaults to SUNDAY
   * @return {Number}     The calculated day of year
   */
  startDoyWeek(aFirstDayOfWeek?: Time.weekDay): number

  /**
   * Returns a copy of the current date/time, rewound to the start of the
   * month. The resulting ICAL.Time instance is of icaltype date, even if
   * this is a date-time.
   *
   * @return {ICAL.Time}      The start of the month (cloned)
   */
  startOfMonth(): Time

  /**
   * Returns a copy of the current date/time, rewound to the start of the
   * week. The resulting ICAL.Time instance is of icaltype date, even if this
   * is a date-time.
   *
   * @param aWeekStart The week start weekday, defaults to SUNDAY
   * @return The start of the week (cloned)
   */
  startOfWeek(aWeekStart?: Time.weekDay): Time

  /**
   * Returns a copy of the current date/time, rewound to the start of the
   * year. The resulting ICAL.Time instance is of icaltype date, even if
   * this is a date-time.
   *
   * @return The start of the year (cloned)
   */
  startOfYear(): Time

  /**
   * Subtract the date details (_excluding_ timezone).  Useful for finding
   * the relative difference between two time objects excluding their
   * timezone differences.
   *
   * @param {ICAL.Time} aDate     The date to substract
   * @return {ICAL.Duration}      The difference as a duration
   */
  subtractDate(aDate: Time): Duration

  /**
   * Subtract the date details, taking timezones into account.
   *
   * @param {ICAL.Time} aDate  The date to subtract
   * @return {ICAL.Duration}  The difference in duration
   */
  subtractDateTz(aDaqte: Time): Duration

  /**
   * Returns an RFC 5545 compliant ical representation of this object.
   *
   * @return {String} ical date/date-time
   */
  toICALString(): string

  /**
   * Converts the current instance to a Javascript date
   * @return {Date}
   */
  toJSDate(): Date

  /**
   * Converts time to into Object which can be serialized then re-created
   * using the constructor.
   *
   * @example
   * // toJSON will automatically be called
   * var json = JSON.stringify(mytime);
   *
   * var deserialized = JSON.parse(json);
   *
   * var time = new ICAL.Time(deserialized);
   */
  toJSON(): object

  /**
   * The string representation of this date/time, in jCal form
   * (including : and - separators).
   */
  toString(): string

  /**
   * Converts the current instance to seconds since January 1st 1970.
   *
   * @return {Number}         Seconds since 1970
   */
  toUnixTime(): number

  /**
   * Calculates the UTC offset of the current date/time in the timezone it is
   * in.
   *
   * @return {Number}     UTC offset in seconds
   */
  utcOffset(): number

  /**
   * Calculates the ISO 8601 week number. The first week of a year is the
   * week that contains the first Thursday. The year can have 53 weeks, if
   * January 1st is a Friday.
   *
   * Note there are regions where the first week of the year is the one that
   * starts on January 1st, which may offset the week number. Also, if a
   * different week start is specified, this will also affect the week
   * number.
   *
   * @see ICAL.Time.weekOneStarts
   * @param aWeekStart The weekday the week starts with
   * @return The ISO week number
   */
  weekNumber(aWeekStart: Time.weekDay): number
}

declare const ICal: {
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
  UtcOffset,
  VCardTime,

  design,
  helpers,
  parse,
  stringify,
  TimezoneService,

  /**
   * The number of characters before iCalendar line folding should occur
   * @default 75
   */
  foldLength: number

  /**
   * The character(s) to be used for a newline. The default value is provided by
   * rfc5545.
   * @default "\r\n"
   */
  newLineChar: string
}

/**
 * The design data, used by the parser to determine types for properties and
 * other metadata needed to produce correct jCard/jCal data.
 */
export const design: {
  /**
   * Holds the design set for known top-level components
   *
   *
   * @example
   * var propertyName = 'fn';
   * var componentDesign = ICAL.design.components.vcard;
   * var propertyDetails = componentDesign.property[propertyName];
   * if (propertyDetails.defaultType == 'text') {
   *   // Yep, sure is...
   * }
   */
  designSet: {
    /** vCard VCARD */
    vcard: design.designSet
    /** iCalendar VEVENT */
    vevent: design.designSet
    /** iCalendar VTODO */
    vtodo: design.designSet
    /** iCalendar VJOURNAL */
    vjournal: design.designSet
    /** iCalendar VALARM */
    valarm: design.designSet
    /** iCalendar VTIMEZONE */
    vtimezone: design.designSet
    /** iCalendar DAYLIGHT */
    daylight: design.designSet
    /** iCalendar STANDARD */
    standard: design.designSet
  }

  /**
   * The default set for new properties and components if none is specified.
   */
  defaultSet: design.designSet

  /** 
   * The default type for unknown properties
   */
  defaultType: string

  /**
   * The design set for iCalendar (rfc5545/rfc7265) components.
   */
  icalender: design.designSet

  /**
   * The design set for vCard (rfc6350/rfc7095) components.
   */
  vcard: design.designSet

  /**
   * The design set for vCard (rfc2425/rfc2426/rfc7095) components.
   */
  vcard3: design.designSet

  /**
   * Gets the design set for the given component name.
   *
   * @param componentName The name of the component
   * @return The design set for the component
   */
  getDesignSet(componentName: string): design.designSet
}

export namespace design {
  /**
   * A designSet describes value, parameter and property data. It is used by
   * ther parser and stringifier in components and properties to determine they
   * should be represented.
   */
  interface designSet {
    /** Definitions for value types, keys are type names */
    value: object
    /** Definitions for params, keys are param names */
    param: object
    /** Defintions for properties, keys are property names */
    property: object
  }
}

/**
 * Helper functions used in various places within ical.js
 */
export const helpers: {
  /**
   * Find the index for insertion using binary search.
   *
   * @param list The list to search
   * @param seekVal The value to insert
   * @param cmpfunc The comparison func, that can compare two seekVals
   * @return The insert position
   */
  binsearchInsert<T>(list: T[], seekVal: T, cmpfunc: (a: T, b: T) => number): number

  /**
   * Clone the passed object or primitive. By default a shallow clone will be
   * executed.
   *
   * @param aSrc The thing to clone
   * @param aDeep If true, a deep clone will be performed
   * @return The copy of the thing
   */
  clone<T>(aSrc: T, aDeep?: boolean): T

  /**
   * Poor-man’s cross-browser object extension. Doesn’t support all the
   * features, but enough for our usage. Note that the target’s properties are
   * not overwritten with the source properties.
   *
   * @example
   * var child = ICAL.helpers.extend(parent, { "bar": 123 });
   *
   * @param source The object to extend
   * @param target The object to extend with
   * @return Returns the target.
   */
  extend<T, T2>(source: T, target: T2): T & T2

  /**
   * Performs iCalendar line folding. A line ending character is inserted and
   * the next line begins with a whitespace.
   *
   * @example
   * SUMMARY:This line will be fold
   *  ed right in the middle of a word.
   *
   * @param {String} aLine      The line to fold
   * @return {String}           The folded line
   */
  foldline(aLine: string): string

  /**
   * Creates or returns a class instance of a given type with the initialization
   * data if the data is not already an instance of the given type.
   *
   * @example
   * var time = new ICAL.Time(...);
   * var result = ICAL.helpers.formatClassType(time, ICAL.Time);
   *
   * (result instanceof ICAL.Time)
   * // => true
   *
   * result = ICAL.helpers.formatClassType({}, ICAL.Time);
   * (result isntanceof ICAL.Time)
   * // => true
   *
   *
   * @param data object initialization data
   * @param type object type (like ICAL.Time)
   * @return An instance of the found type.
   */
  formatClassType<T>(data: Partial<T>, type: { new (...args): T }): T

  /**
   * Poor-man's cross-browser inheritance for JavaScript. Doesn't support all
   * the features, but enough for our usage.
   *
   * @param base The base class constructor function.
   * @param child The child class constructor function.
   * @param extra Extends the prototype with extra properties and methods
   */
  inherits(base: Function, child: Function, extra: object): object

  /**
   * Checks if the given type is of the number type and also NaN.
   *
   * @param number The number to check
   * @return True, if the number is strictly NaN
   */
  isStrictlyNaN(number: number): boolean

  /**
   * Pads the given string or number with zeros so it will have at least two
   * characters.
   *
   * @param data The string or number to pad
   * @return The number padded as a string
   */
  pad2(data: string | number): string

  /**
   * Parses a string value that is expected to be an integer, when the valid is
   * not an integer throws a decoration error.
   *
   * @param string Raw string input
   * @return Parsed integer
   */
  strictParseInt(string: string): number

  /**
   * Truncates the given number, correctly handling negative numbers.
   *
   * @param number The number to truncate
   * @return The truncated number
   */
  trunc(number: number): number

  /**
   * Identical to indexOf but will only match values when they are not preceded
   * by a backslash character.
   *
   * @param buffer String to search
   * @param search Value to look for
   * @param pos Start position
   * @return The position, or -1 if not found
   */
  unescapedIndexOf(buffer: string, search: string, pos: number): number

  /**
   * Compiles a list of all referenced TZIDs in all subcomponents and
   * removes any extra VTIMEZONE subcomponents. In addition, if any TZIDs
   * are referenced by a component, but a VTIMEZONE does not exist,
   * an attempt will be made to generate a VTIMEZONE using ICAL.TimezoneService.
   *
   * @param vcal The top-level VCALENDAR component.
   * @return The ICAL.Component that was passed in.
   */
  updateTimezones(vcal: Component): Component
}

/**
 * Contains various functions to parse iCalendar and vCard data.
 */
export const parse: {
  /**
   * Parses iCalendar or vCard data into a raw jCal object. Consult
   * documentation on the {@tutorial layers|layers of parsing} for more
   * details.
   *
   * @todo Fix the API to be more clear on the return type
   * @param input The string data to parse
   * @return A single jCal object, or an array thereof
   */
  (input: string): object | object[]

  /**
   * Internal helper for rfc6868. Exposing this on ICAL.parse so that
   * hackers can disable the rfc6868 parsing if the really need to.
   *
   * @param val The value to escape
   * @return The escaped value
   */
  _rfc6868Escape(val: string): string

  /**
   * Convenience method to parse a component. You can use ICAL.parse() directly
   * instead.
   *
   * @see IACL.parse(function)
   * @param str The iCalendar component string to parse
   * @return The jCal Object containing the component
   */
  component(str: string): object

  /**
   * Parse an iCalendar property value into the jCal for a single property
   *
   * @param str The iCalendar property string to parse
   * @param designSet The design data to use for this property
   * @return The jCal Object containing the property
   */
  property(str: string, designSet?: design.designSet): object
}

/**
 * Contains various functions to convert jCal and jCard data back into
 * iCalendar and vCard.
 */
export const stringify: {
 /**
   * Convert a full jCal/jCard array into a iCalendar/vCard string.
   *
   * @param jCal The jCal/jCard document
   * @return The stringified iCalendar/vCard document
   */
  (jCal: any[]): string

  /**
   * Converts an jCal component array into a ICAL string.
   * Recursive will resolve sub-components.
   *
   * Exact component/property order is not saved all
   * properties will come before subcomponents.
   *
   * @param component jCal/jCard fragment of a component
   * @param designSet The design data to use for this component
   * @return The iCalendar/vCard string
   */
  component(component: any[], designSet: design.designSet): string

  /**
   * Converts an array of ical values into a single
   * string based on a type and a delimiter value (like ",").
   *
   * @param values List of values to convert
   * @param delim Used to join the values (",", ";", ":")
   * @param type Lowecase ical value type (like boolean, date-time, etc..)
   * @param innerMulti If set, each value will again be processed
   *        Used for structured values
   * @param designSet
   *        The design data to use for this property
   *
   * @return iCalendar/vCard string for value
   */
  multiValue(values: any[], delim: string, type: string, innerMulti: string | undefined, designSet: design.designSet, structuredValue): string

  /**
   * Converts a single jCal/jCard property to a iCalendar/vCard string.
   *
   * @param property jCal/jCard property array
   * @param designSet The design data to use for this property
   * @param noFold If true, the line is not folded
   * @return The iCalendar/vCard string
   */
  property(property: any[], designSet: design.designSet, noFold: boolean): string

  /**
   * Handles escaping of property values that may contain:
   *
   *    COLON (:), SEMICOLON (;), or COMMA (,)
   *
   * If any of the above are present the result is wrapped
   * in double quotes.
   *
   * @param value Raw property value
   * @return Given or escaped value when needed
   */
  propertyValue(value: string): string

   /**
   * Processes a single ical value runs the associated "toICAL" method from the
   * design value type if available to convert the value.
   *
   * @param value A formatted value
   * @param type Lowercase iCalendar/vCard value type
   *  (like boolean, date-time, etc..)
   * @return iCalendar/vCard value for single value
   */
  value(value: string | number, type: string, designSet, structuredValue): string
}

/**
 * Singleton class to contain timezones. Right now its all manual registry in
 * the future we may use this class to download timezone information or handle
 * loading pre-expanded timezones.
 */
export const TimezoneService: {
  /**
   * Returns a timezone by its tzid if present.
   *
   * @param tzid     Timezone identifier (e.g. America/Los_Angeles)
   * @return The timezone, or null if not found
   */
  get(tzid: string): Timezone | undefined

  /**
   * Checks if timezone id has been registered.
   *
   * @param tzid Timezone identifier (e.g. America/Los_Angeles)
   * @return False, when not present
   */
  has(tzid: string): boolean

  /**
   * Registers a timezone object or component.
   *
   * @param name
   *        The name of the timezone. Defaults to the component's TZID if not
   *        passed.
   * @param zone
   *        The initialized zone or vtimezone.
   */
  register(name: string | undefined, timezone: Component | Timezone): void

  /**
   * Removes a timezone by its tzid from the list.
   *
   * @param tzid Timezone identifier (e.g. America/Los_Angeles)
   * @return The removed timezone, or null if not registered
   */
  remove(tzid: string): Timezone | undefined
}
