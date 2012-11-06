ICAL.Propertyv2 = (function() {

  const PROP_INDEX = 1;
  const VALUE_INDEX = 3;

  var design = ICAL.designv2;

  function Property(jCal, component) {
    this.jCal = jCal;
    this.component = component;

    this.type = jCal[2];
    this.name = jCal[0];

    if (this.type in design.value) {
      if ('decorate' in design.value[this.type]) {
        this.isDecorated = true;
      }
    }
  }

  Property.prototype = {
    isDecorated: false,

    /**
     * Hydrate a single value.
     */
    _hydrateValue: function(index) {
      if (this._values && this._values[index]) {
        return this._values[index];
      }

      if (this.isDecorated) {
        if (!this._values) {
          this._values = [];
        }

        var value = design.value[this.type].decorate(
          this.jCal[VALUE_INDEX + index]
        );

        this._values[index] = value;

        return value;
      } else {
        return this.jCal[VALUE_INDEX + index];
      }
    },

    /**
     * Gets a param on the property.
     *
     * @param {String} name prop name (lowercase).
     * @return {String} prop value.
     */
    getParameter: function(name) {
      return this.jCal[PROP_INDEX][name];
    },

    /**
     * Sets a param on the property.
     *
     * @param {String} name prop name (lowercase).
     * @param {String} value property value.
     */
    setParameter: function(name, value) {
      this.jCal[PROP_INDEX][name] = value;
    },

    /**
     * Finds first property value.
     *
     * @return {String} first property value.
     */
    getFirstValue: function() {
      return this._hydrateValue(0);
    },

    /**
     * Gets all values on the property.
     *
     * NOTE: this creates an array during each call.
     *
     * @return {Array} list of values.
     */
    getValues: function() {
      var len = this.jCal.length - VALUE_INDEX;

      if (len < 1) {
        // its possible for a property to have no value.
        return;
      }

      var i = 0;
      var result = [];

      for (; i < len; i++) {
        result[i] = this._hydrateValue(i);
      }

      return result;
    }
  };

  return Property;

}());
