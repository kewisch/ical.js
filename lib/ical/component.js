/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch */

import Property from "./property.js";
import Timezone from "./timezone.js";
import ICALParse from "./parse.js";
import stringify from "./stringify.js";
import design from "./design.js";
// needed for typescript type resolution
// eslint-disable-next-line no-unused-vars
import Duration from "./duration.js";
// needed for typescript type resolution
// eslint-disable-next-line no-unused-vars
import UtcOffset from "./utc_offset.js";
// needed for typescript type resolution
// eslint-disable-next-line no-unused-vars
import Binary from "./binary.js";
// needed for typescript type resolution
// eslint-disable-next-line no-unused-vars
import Period from "./period.js";
// needed for typescript type resolution
// eslint-disable-next-line no-unused-vars
import Recur from "./recur.js";
// needed for typescript type resolution
// eslint-disable-next-line no-unused-vars
import Time from "./time.js";

/**
 * This lets typescript resolve our custom types in the
 * generated d.ts files (jsdoc typedefs are converted to typescript types).
 * Ignore prevents the typedefs from being documented more than once.
 * @ignore
 * @typedef {import("./types.js").designSet} designSet
 * Imports the 'designSet' type from the "types.js" module
 * @typedef {import("./types.js").Geo} Geo
 * Imports the 'Geo' type from the "types.js" module
 */

const NAME_INDEX = 0;
const PROPERTY_INDEX = 1;
const COMPONENT_INDEX = 2;

/**
 * Wraps a jCal component, adding convenience methods to add, remove and update subcomponents and
 * properties.
 *
 * @memberof ICAL
 */
class Component {
  /**
   * Create an {@link ICAL.Component} by parsing the passed iCalendar string.
   *
   * @param {String} str        The iCalendar string to parse
   */
  static fromString(str) {
    return new Component(ICALParse.component(str));
  }

  /**
   * Creates a new Component instance.
   *
   * @param {Array|String} jCal         Raw jCal component data OR name of new
   *                                      component
   * @param {Component=} parent     Parent component to associate
   */
  constructor(jCal, parent) {
    if (typeof(jCal) === 'string') {
      // jCal spec (name, properties, components)
      jCal = [jCal, [], []];
    }

    // mostly for legacy reasons.
    this.jCal = jCal;

    this.parent = parent || null;

    if (!this.parent && this.name === 'vcalendar') {
      this._timezoneCache = new Map();
    }
  }

  /**
   * Hydrated properties are inserted into the _properties array at the same
   * position as in the jCal array, so it is possible that the array contains
   * undefined values for unhydrdated properties. To avoid iterating the
   * array when checking if all properties have been hydrated, we save the
   * count here.
   *
   * @type {Number}
   * @private
   */
  _hydratedPropertyCount = 0;

  /**
   * The same count as for _hydratedPropertyCount, but for subcomponents
   *
   * @type {Number}
   * @private
   */
  _hydratedComponentCount = 0;

  /**
   * A cache of hydrated time zone objects which may be used by consumers, keyed
   * by time zone ID.
   *
   * @type {Map}
   * @private
   */
  _timezoneCache = null;

  /**
   * @private
   */
  _components = null;

  /**
   * @private
   */
  _properties = null;

  /**
   * The name of this component
   *
   * @type {String}
   */
  get name() {
    return this.jCal[NAME_INDEX];
  }

  /**
   * The design set for this component, e.g. icalendar vs vcard
   *
   * @type {designSet}
   * @private
   */
  get _designSet() {
    let parentDesign = this.parent && this.parent._designSet;
    return parentDesign || design.getDesignSet(this.name);
  }

  /**
   * @private
   */
  _hydrateComponent(index) {
    if (!this._components) {
      this._components = [];
      this._hydratedComponentCount = 0;
    }

    if (this._components[index]) {
      return this._components[index];
    }

    let comp = new Component(
      this.jCal[COMPONENT_INDEX][index],
      this
    );

    this._hydratedComponentCount++;
    return (this._components[index] = comp);
  }

  /**
   * @private
   */
  _hydrateProperty(index) {
    if (!this._properties) {
      this._properties = [];
      this._hydratedPropertyCount = 0;
    }

    if (this._properties[index]) {
      return this._properties[index];
    }

    let prop = new Property(
      this.jCal[PROPERTY_INDEX][index],
      this
    );

    this._hydratedPropertyCount++;
    return (this._properties[index] = prop);
  }

  /**
   * Finds first sub component, optionally filtered by name.
   *
   * @param {String=} name        Optional name to filter by
   * @return {?Component}     The found subcomponent
   */
  getFirstSubcomponent(name) {
    if (name) {
      let i = 0;
      let comps = this.jCal[COMPONENT_INDEX];
      let len = comps.length;

      for (; i < len; i++) {
        if (comps[i][NAME_INDEX] === name) {
          let result = this._hydrateComponent(i);
          return result;
        }
      }
    } else {
      if (this.jCal[COMPONENT_INDEX].length) {
        return this._hydrateComponent(0);
      }
    }

    // ensure we return a value (strict mode)
    return null;
  }

  /**
   * Finds all sub components, optionally filtering by name.
   *
   * @param {String=} name            Optional name to filter by
   * @return {Component[]}       The found sub components
   */
  getAllSubcomponents(name) {
    let jCalLen = this.jCal[COMPONENT_INDEX].length;
    let i = 0;

    if (name) {
      let comps = this.jCal[COMPONENT_INDEX];
      let result = [];

      for (; i < jCalLen; i++) {
        if (name === comps[i][NAME_INDEX]) {
          result.push(
            this._hydrateComponent(i)
          );
        }
      }
      return result;
    } else {
      if (!this._components ||
          (this._hydratedComponentCount !== jCalLen)) {
        for (; i < jCalLen; i++) {
          this._hydrateComponent(i);
        }
      }

      return this._components || [];
    }
  }

  /**
   * Returns true when a named property exists.
   *
   * @param {String} name     The property name
   * @return {Boolean}        True, when property is found
   */
  hasProperty(name) {
    let props = this.jCal[PROPERTY_INDEX];
    let len = props.length;

    let i = 0;
    for (; i < len; i++) {
      // 0 is property name
      if (props[i][NAME_INDEX] === name) {
        return true;
      }
    }

    return false;
  }

  /**
   * Finds the first property, optionally with the given name.
   *
   * @param {String=} name        Lowercase property name
   * @return {?Property}     The found property
   */
  getFirstProperty(name) {
    if (name) {
      let i = 0;
      let props = this.jCal[PROPERTY_INDEX];
      let len = props.length;

      for (; i < len; i++) {
        if (props[i][NAME_INDEX] === name) {
          let result = this._hydrateProperty(i);
          return result;
        }
      }
    } else {
      if (this.jCal[PROPERTY_INDEX].length) {
        return this._hydrateProperty(0);
      }
    }

    return null;
  }

  /**
   * Returns first property's value, if available.
   *
   * @param {String=} name                    Lowercase property name
   * @return {Binary | Duration | Period |
   * Recur | Time | UtcOffset | Geo | string | null}         The found property value.
   */
  getFirstPropertyValue(name) {
    let prop = this.getFirstProperty(name);
    if (prop) {
      return prop.getFirstValue();
    }

    return null;
  }

  /**
   * Get all properties in the component, optionally filtered by name.
   *
   * @param {String=} name        Lowercase property name
   * @return {Property[]}    List of properties
   */
  getAllProperties(name) {
    let jCalLen = this.jCal[PROPERTY_INDEX].length;
    let i = 0;

    if (name) {
      let props = this.jCal[PROPERTY_INDEX];
      let result = [];

      for (; i < jCalLen; i++) {
        if (name === props[i][NAME_INDEX]) {
          result.push(
            this._hydrateProperty(i)
          );
        }
      }
      return result;
    } else {
      if (!this._properties ||
          (this._hydratedPropertyCount !== jCalLen)) {
        for (; i < jCalLen; i++) {
          this._hydrateProperty(i);
        }
      }

      return this._properties || [];
    }
  }

  /**
   * @private
   */
  _removeObjectByIndex(jCalIndex, cache, index) {
    cache = cache || [];
    // remove cached version
    if (cache[index]) {
      let obj = cache[index];
      if ("parent" in obj) {
          obj.parent = null;
      }
    }

    cache.splice(index, 1);

    // remove it from the jCal
    this.jCal[jCalIndex].splice(index, 1);
  }

  /**
   * @private
   */
  _removeObject(jCalIndex, cache, nameOrObject) {
    let i = 0;
    let objects = this.jCal[jCalIndex];
    let len = objects.length;
    let cached = this[cache];

    if (typeof(nameOrObject) === 'string') {
      for (; i < len; i++) {
        if (objects[i][NAME_INDEX] === nameOrObject) {
          this._removeObjectByIndex(jCalIndex, cached, i);
          return true;
        }
      }
    } else if (cached) {
      for (; i < len; i++) {
        if (cached[i] && cached[i] === nameOrObject) {
          this._removeObjectByIndex(jCalIndex, cached, i);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * @private
   */
  _removeAllObjects(jCalIndex, cache, name) {
    let cached = this[cache];

    // Unfortunately we have to run through all children to reset their
    // parent property.
    let objects = this.jCal[jCalIndex];
    let i = objects.length - 1;

    // descending search required because splice
    // is used and will effect the indices.
    for (; i >= 0; i--) {
      if (!name || objects[i][NAME_INDEX] === name) {
        this._removeObjectByIndex(jCalIndex, cached, i);
      }
    }
  }

  /**
   * Adds a single sub component.
   *
   * @param {Component} component        The component to add
   * @return {Component}                 The passed in component
   */
  addSubcomponent(component) {
    if (!this._components) {
      this._components = [];
      this._hydratedComponentCount = 0;
    }

    if (component.parent) {
      component.parent.removeSubcomponent(component);
    }

    let idx = this.jCal[COMPONENT_INDEX].push(component.jCal);
    this._components[idx - 1] = component;
    this._hydratedComponentCount++;
    component.parent = this;
    return component;
  }

  /**
   * Removes a single component by name or the instance of a specific
   * component.
   *
   * @param {Component|String} nameOrComp    Name of component, or component
   * @return {Boolean}                            True when comp is removed
   */
  removeSubcomponent(nameOrComp) {
    let removed = this._removeObject(COMPONENT_INDEX, '_components', nameOrComp);
    if (removed) {
      this._hydratedComponentCount--;
    }
    return removed;
  }

  /**
   * Removes all components or (if given) all components by a particular
   * name.
   *
   * @param {String=} name            Lowercase component name
   */
  removeAllSubcomponents(name) {
    let removed = this._removeAllObjects(COMPONENT_INDEX, '_components', name);
    this._hydratedComponentCount = 0;
    return removed;
  }

  /**
   * Adds an {@link ICAL.Property} to the component.
   *
   * @param {Property} property      The property to add
   * @return {Property}              The passed in property
   */
  addProperty(property) {
    if (!(property instanceof Property)) {
      throw new TypeError('must be instance of ICAL.Property');
    }

    if (!this._properties) {
      this._properties = [];
      this._hydratedPropertyCount = 0;
    }

    if (property.parent) {
      property.parent.removeProperty(property);
    }

    let idx = this.jCal[PROPERTY_INDEX].push(property.jCal);
    this._properties[idx - 1] = property;
    this._hydratedPropertyCount++;
    property.parent = this;
    return property;
  }

  /**
   * Helper method to add a property with a value to the component.
   *
   * @param {String}               name         Property name to add
   * @param {String|Number|Object} value        Property value
   * @return {Property}                    The created property
   */
  addPropertyWithValue(name, value) {
    let prop = new Property(name);
    prop.setValue(value);

    this.addProperty(prop);

    return prop;
  }

  /**
   * Helper method that will update or create a property of the given name
   * and sets its value. If multiple properties with the given name exist,
   * only the first is updated.
   *
   * @param {String}               name         Property name to update
   * @param {String|Number|Object} value        Property value
   * @return {Property}                    The created property
   */
  updatePropertyWithValue(name, value) {
    let prop = this.getFirstProperty(name);

    if (prop) {
      prop.setValue(value);
    } else {
      prop = this.addPropertyWithValue(name, value);
    }

    return prop;
  }

  /**
   * Removes a single property by name or the instance of the specific
   * property.
   *
   * @param {String|Property} nameOrProp     Property name or instance to remove
   * @return {Boolean}                            True, when deleted
   */
  removeProperty(nameOrProp) {
    let removed = this._removeObject(PROPERTY_INDEX, '_properties', nameOrProp);
    if (removed) {
      this._hydratedPropertyCount--;
    }
    return removed;
  }

  /**
   * Removes all properties associated with this component, optionally
   * filtered by name.
   *
   * @param {String=} name        Lowercase property name
   * @return {Boolean}            True, when deleted
   */
  removeAllProperties(name) {
    let removed = this._removeAllObjects(PROPERTY_INDEX, '_properties', name);
    this._hydratedPropertyCount = 0;
    return removed;
  }

  /**
   * Returns the Object representation of this component. The returned object
   * is a live jCal object and should be cloned if modified.
   * @return {Object}
   */
  toJSON() {
    return this.jCal;
  }

  /**
   * The string representation of this component.
   * @return {String}
   */
  toString() {
    return stringify.component(
      this.jCal, this._designSet
    );
  }

  /**
   * Retrieve a time zone definition from the component tree, if any is present.
   * If the tree contains no time zone definitions or the TZID cannot be
   * matched, returns null.
   *
   * @param {String} tzid     The ID of the time zone to retrieve
   * @return {Timezone}  The time zone corresponding to the ID, or null
   */
  getTimeZoneByID(tzid) {
    // VTIMEZONE components can only appear as a child of the VCALENDAR
    // component; walk the tree if we're not the root.
    if (this.parent) {
      return this.parent.getTimeZoneByID(tzid);
    }

    // If there is no time zone cache, we are probably parsing an incomplete
    // file and will have no time zone definitions.
    if (!this._timezoneCache) {
      return null;
    }

    if (this._timezoneCache.has(tzid)) {
      return this._timezoneCache.get(tzid);
    }

    // If the time zone is not already cached, hydrate it from the
    // subcomponents.
    const zones = this.getAllSubcomponents('vtimezone');
    for (const zone of zones) {
      if (zone.getFirstProperty('tzid').getFirstValue() === tzid) {
        const hydratedZone = new Timezone({
          component: zone,
          tzid: tzid,
        });

        this._timezoneCache.set(tzid, hydratedZone);

        return hydratedZone;
      }
    }

    // Per the standard, we should always have a time zone defined in a file
    // for any referenced TZID, but don't blow up if the file is invalid.
    return null;
  }
}
export default Component;
