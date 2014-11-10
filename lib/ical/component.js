ICAL.Component = (function() {
  'use strict';

  var PROPERTY_INDEX = 1;
  var COMPONENT_INDEX = 2;
  var NAME_INDEX = 0;

  /**
   * Create a wrapper for a jCal component.
   *
   * @param {Array|String} jCal
   *  raw jCal component data OR name of new component.
   * @param {ICAL.Component} parent parent component to associate.
   */
  function Component(jCal, parent) {
    if (typeof(jCal) === 'string') {
      // jCal spec (name, properties, components)
      jCal = [jCal, [], []];
    }

    // mostly for legacy reasons.
    this.jCal = jCal;

    this.parent = parent || null;
  }

  Component.prototype = {
    /**
     * Hydrated properties are inserted into the _properties array at the same
     * position as in the jCal array, so its possible the array contains
     * undefined values for unhydrdated properties. To avoid iterating the
     * array when checking if all properties have been hydrated, we save the
     * count here.
     */
    _hydratedPropertyCount: 0,

    /**
     * The same count as for _hydratedPropertyCount, but for subcomponents
     */
    _hydratedComponentCount: 0,

    get name() {
      return this.jCal[NAME_INDEX];
    },

    _hydrateComponent: function(index) {
      if (!this._components) {
        this._components = [];
        this._hydratedComponentCount = 0;
      }

      if (this._components[index]) {
        return this._components[index];
      }

      var comp = new Component(
        this.jCal[COMPONENT_INDEX][index],
        this
      );

      this._hydratedComponentCount++;
      return this._components[index] = comp;
    },

    _hydrateProperty: function(index) {
      if (!this._properties) {
        this._properties = [];
        this._hydratedPropertyCount = 0;
      }

      if (this._properties[index]) {
        return this._properties[index];
      }

      var prop = new ICAL.Property(
        this.jCal[PROPERTY_INDEX][index],
        this
      );

      this._hydratedPropertyCount++;
      return this._properties[index] = prop;
    },

    /**
     * Finds first sub component, optionally filtered by name.
     *
     * @method getFirstSubcomponent
     * @param {String} [name] optional name to filter by.
     */
    getFirstSubcomponent: function(name) {
      if (name) {
        var i = 0;
        var comps = this.jCal[COMPONENT_INDEX];
        var len = comps.length;

        for (; i < len; i++) {
          if (comps[i][NAME_INDEX] === name) {
            var result = this._hydrateComponent(i);
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
    },

    /**
     * Finds all sub components, optionally filtering by name.
     *
     * @method getAllSubcomponents
     * @param {String} [name] optional name to filter by.
     */
    getAllSubcomponents: function(name) {
      var jCalLen = this.jCal[COMPONENT_INDEX].length;

      if (name) {
        var comps = this.jCal[COMPONENT_INDEX];
        var result = [];
        var i = 0;

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
          var i = 0;
          for (; i < jCalLen; i++) {
            this._hydrateComponent(i);
          }
        }

        return this._components;
      }
    },

    /**
     * Returns true when a named property exists.
     *
     * @param {String} name property name.
     * @return {Boolean} true when property is found.
     */
    hasProperty: function(name) {
      var props = this.jCal[PROPERTY_INDEX];
      var len = props.length;

      var i = 0;
      for (; i < len; i++) {
        // 0 is property name
        if (props[i][NAME_INDEX] === name) {
          return true;
        }
      }

      return false;
    },

    /**
     * Finds first property.
     *
     * @param {String} [name] lowercase name of property.
     * @return {ICAL.Property} found property.
     */
    getFirstProperty: function(name) {
      if (name) {
        var i = 0;
        var props = this.jCal[PROPERTY_INDEX];
        var len = props.length;

        for (; i < len; i++) {
          if (props[i][NAME_INDEX] === name) {
            var result = this._hydrateProperty(i);
            return result;
          }
        }
      } else {
        if (this.jCal[PROPERTY_INDEX].length) {
          return this._hydrateProperty(0);
        }
      }

      return null;
    },

    /**
     * Returns first properties value if available.
     *
     * @param {String} [name] (lowecase) property name.
     * @return {String} property value.
     */
    getFirstPropertyValue: function(name) {
      var prop = this.getFirstProperty(name);
      if (prop) {
        return prop.getFirstValue();
      }

      return null;
    },

    /**
     * get all properties in the component.
     *
     * @param {String} [name] (lowercase) property name.
     * @return {Array[ICAL.Property]} list of properties.
     */
    getAllProperties: function(name) {
      var jCalLen = this.jCal[PROPERTY_INDEX].length;

      if (name) {
        var props = this.jCal[PROPERTY_INDEX];
        var result = [];
        var i = 0;

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
          var i = 0;
          for (; i < jCalLen; i++) {
            this._hydrateProperty(i);
          }
        }

        return this._properties;
      }

      return null;
    },

    _removeObjectByIndex: function(jCalIndex, cache, index) {
      // remove cached version
      if (cache && cache[index]) {
        var obj = cache[index];
        if ("parent" in obj) {
            obj.parent = null;
        }
        cache.splice(index, 1);
      }

      // remove it from the jCal
      this.jCal[jCalIndex].splice(index, 1);
    },

    _removeObject: function(jCalIndex, cache, nameOrObject) {
      var i = 0;
      var objects = this.jCal[jCalIndex];
      var len = objects.length;
      var cached = this[cache];

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
    },

    _removeAllObjects: function(jCalIndex, cache, name) {
      var cached = this[cache];

      // Unfortunately we have to run through all children to reset their
      // parent property.
      var objects = this.jCal[jCalIndex];
      var i = objects.length - 1;

      // descending search required because splice
      // is used and will effect the indices.
      for (; i >= 0; i--) {
        if (!name || objects[i][NAME_INDEX] === name) {
          this._removeObjectByIndex(jCalIndex, cached, i);
        }
      }
    },

    /**
     * Adds a single sub component.
     *
     * @param {ICAL.Component} component to add.
     */
    addSubcomponent: function(component) {
      if (!this._components) {
        this._components = [];
        this._hydratedComponentCount = 0;
      }

      if (component.parent) {
        component.parent.removeSubcomponent(component);
      }

      var idx = this.jCal[COMPONENT_INDEX].push(component.jCal);
      this._components[idx - 1] = component;
      this._hydratedComponentCount++;
      component.parent = this;
    },

    /**
     * Removes a single component by name or
     * the instance of a specific component.
     *
     * @param {ICAL.Component|String} nameOrComp comp type.
     * @return {Boolean} true when comp is removed.
     */
    removeSubcomponent: function(nameOrComp) {
      var removed = this._removeObject(COMPONENT_INDEX, '_components', nameOrComp);
      if (removed) {
        this._hydratedComponentCount--;
      }
      return removed;
    },

    /**
     * Removes all components or (if given) all
     * components by a particular name.
     *
     * @param {String} [name] (lowercase) component name.
     */
    removeAllSubcomponents: function(name) {
      var removed = this._removeAllObjects(COMPONENT_INDEX, '_components', name);
      this._hydratedComponentCount = 0;
      return removed;
    },

    /**
     * Adds a property to the component.
     *
     * @param {ICAL.Property} property object.
     */
    addProperty: function(property) {
      if (!(property instanceof ICAL.Property)) {
        throw new TypeError('must instance of ICAL.Property');
      }

      if (!this._properties) {
        this._properties = [];
        this._hydratedPropertyCount = 0;
      }


      if (property.parent) {
        property.parent.removeProperty(property);
      }

      var idx = this.jCal[PROPERTY_INDEX].push(property.jCal);
      this._properties[idx - 1] = property;
      this._hydratedPropertyCount++;
      property.parent = this;
    },

    /**
     * Helper method to add a property with a value to the component.
     *
     * @param {String} name property name to add.
     * @param {Object} value property value.
     */
    addPropertyWithValue: function(name, value) {
      var prop = new ICAL.Property(name);
      prop.setValue(value);

      this.addProperty(prop);

      return prop;
    },

    /**
     * Helper method that will update or create a property
     * of the given name and sets its value.
     *
     * @param {String} name property name.
     * @param {Object} value property value.
     * @return {ICAL.Property} property.
     */
    updatePropertyWithValue: function(name, value) {
      var prop = this.getFirstProperty(name);

      if (prop) {
        prop.setValue(value);
      } else {
        prop = this.addPropertyWithValue(name, value);
      }

      return prop;
    },

    /**
     * Removes a single property by name or
     * the instance of the specific property.
     *
     * @param {String|ICAL.Property} nameOrProp to remove.
     * @return {Boolean} true when deleted.
     */
    removeProperty: function(nameOrProp) {
      var removed = this._removeObject(PROPERTY_INDEX, '_properties', nameOrProp);
      if (removed) {
        this._hydratedPropertyCount--;
      }
      return removed;
    },

    /**
     * Removes all properties associated with this component.
     *
     * @param {String} [name] (lowecase) optional property name.
     */
    removeAllProperties: function(name) {
      var removed = this._removeAllObjects(PROPERTY_INDEX, '_properties', name);
      this._hydratedPropertyCount = 0;
      return removed;
    },

    toJSON: function() {
      return this.jCal;
    },

    toString: function() {
      return ICAL.stringify.component(
        this.jCal
      );
    }

  };

  Component.fromString = function(str) {
    return new Component(ICAL.parse.component(str));
  };

  return Component;

}());
