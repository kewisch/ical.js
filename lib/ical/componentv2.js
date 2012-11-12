ICAL.Componentv2 = (function() {

  const PROPERTY_INDEX = 1;
  const COMPONENT_INDEX = 2;
  const NAME_INDEX = 0;

  /**
   * Create a wrapper for a jCal component.
   *
   * @param {Array} jCal raw jCal component data.
   * @param {ICAL.Component} parent parent component to associate.
   */
  function Component(jCal, parent) {
    // mostly for legacy reasons.
    this.name = jCal[NAME_INDEX];
    this.jCal = jCal;

    if (parent) {
      this.parent = parent;
    }
  }

  Component.prototype = {

    _hydrateComponent: function(index) {
      if (!this._components) {
        this._components = [];
      }

      if (this._components[index]) {
        return this._components[index];
      }

      var comp = new Component(
        this.jCal[COMPONENT_INDEX][index],
        this
      );

      return this._components[index] = comp;
    },

    _hydrateProperty: function(index) {
      if (!this._properties) {
        this._properties = [];
      }

      if (this._properties[index]) {
        return this._properties[index];
      }

      var prop = new ICAL.Propertyv2(
        this.jCal[PROPERTY_INDEX][index],
        this
      );

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
            (this._components.length !== jCalLen)) {
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

      if (!len) {
        return false;
      }

      var i = 0;
      for (; i < len; i++) {
        // 0 is property name
        if (props[i][NAME_INDEX] === name) {
          return true;
        }
      }
    },

    /**
     * Finds first property.
     *
     * @param {String} [name] lowercase name of property.
     * @return {ICAL.Propertyv2} found property.
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
    },

    /**
     * get all properties in the component.
     *
     * @param {String} [name] (lowercase) property name.
     * @return {Array[ICAL.Propertyv2]} list of properties.
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
            (this._properties.length !== jCalLen)) {
          var i = 0;
          for (; i < jCalLen; i++) {
            this._hydrateProperty(i);
          }
        }

        return this._properties;
      }
    }

  };

  return Component;

}());
