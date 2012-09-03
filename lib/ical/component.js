/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

"use strict";

(typeof(ICAL) === 'undefined')? ICAL = {} : '';
(function() {
  ICAL.icalcomponent = function icalcomponent(data, parent) {
    this.wrappedJSObject = this;
    this.parent = parent;
    this.fromData(data);
  }

  ICAL.icalcomponent.prototype = {

    data: null,
    name: "",
    components: null,
    properties: null,

    icalclass: "icalcomponent",

    clone: function clone() {
      return new ICAL.icalcomponent(this.undecorate(), this.parent);
    },

    fromData: function fromData(data) {
      if (!data) {
        data = ICAL.helpers.initComponentData(null);
      }
      this.data = data;
      this.data.value = this.data.value || [];
      this.data.type = this.data.type || "COMPONENT";
      this.components = {};
      this.properties = {};

      // Save the name directly on the object, as we want this accessed
      // from the outside.
      this.name = this.data.name;
      delete this.data.name;

      var value = this.data.value;

      for (var key in value) {
        var keyname = value[key].name;
        if (value[key].type == "COMPONENT") {
          value[key] = new ICAL.icalcomponent(value[key], this);
          ICAL.helpers.ensureKeyExists(this.components, keyname, []);
          this.components[keyname].push(value[key]);
        } else {
          value[key] = new ICAL.icalproperty(value[key], this);
          ICAL.helpers.ensureKeyExists(this.properties, keyname, []);
          this.properties[keyname].push(value[key]);
        }
      }
    },

    undecorate: function undecorate() {
      var newdata = [];
      for (var key in this.data.value) {
        newdata.push(this.data.value[key].undecorate());
      }
      return {
        name: this.name,
        type: "COMPONENT",
        value: newdata
      };
    },

    getFirstSubcomponent: function getFirstSubcomponent(aType) {
      var comp = null;
      if (aType) {
        var ucType = aType.toUpperCase();
        if (ucType in this.components &&
            this.components[ucType] &&
            this.components[ucType].length > 0) {
          comp = this.components[ucType][0];
        }
      } else {
        for (var thiscomp in this.components) {
          comp = this.components[thiscomp][0];
          break;
        }
      }
      return comp;
    },

    getAllSubcomponents: function getAllSubcomponents(aType) {
      var comps = [];
      if (aType && aType != "ANY") {
        var ucType = aType.toUpperCase();
        if (ucType in this.components) {
          for (var compKey in this.components[ucType]) {
            comps.push(this.components[ucType][compKey]);
          }
        }
      } else {
        for (var compName in this.components) {
          for (var compKey in this.components[compName]) {
            comps.push(this.components[compName][compKey]);
          }
        }
      }
      return comps;
    },

    addSubcomponent: function addSubcomponent(aComp, aCompName) {
      var ucName, comp;
      var comp;
      if (aComp.icalclass == "icalcomponent") {
        ucName = aComp.name;
        comp = aComp.clone();
        comp.parent = this;
      } else {
        ucName = aCompName.toUpperCase();
        comp = new ICAL.icalcomponent(aComp, ucName, this);
      }

      this.data.value.push(comp);
      ICAL.helpers.ensureKeyExists(this.components, ucName, []);
      this.components[ucName].push(comp);
    },

    removeSubcomponent: function removeSubComponent(aName) {
      var ucName = aName.toUpperCase();
      for (var key in this.components[ucName]) {
        var pos = this.data.value.indexOf(this.components[ucName][key]);
        if (pos > -1) {
          this.data.value.splice(pos, 1);
        }
      }

      delete this.components[ucName];
    },

    hasProperty: function hasProperty(aName) {
      var ucName = aName.toUpperCase();
      return (ucName in this.properties);
    },

    getFirstProperty: function getFirstProperty(aName) {
      var prop = null;
      if (aName) {
        var ucName = aName.toUpperCase();
        if (ucName in this.properties && this.properties[ucName]) {
          prop = this.properties[ucName][0];
        }
      } else {
        for (var p in this.properties) {
          prop = this.properties[p];
          break;
        }
      }
      return prop;
    },

    getFirstPropertyValue: function getFirstPropertyValue(aName) {
      // TODO string value?
      var prop = this.getFirstProperty(aName);
      return (prop ? prop.getFirstValue() : null);
    },

    getAllProperties: function getAllProperties(aName) {
      var props = [];
      if (aName && aName != "ANY") {
        var ucType = aName.toUpperCase();
        if (ucType in this.properties) {
          props = this.properties[ucType].concat([]);
        }
      } else {
        for (var propName in this.properties) {
          props = props.concat(this.properties[propName]);
        }
      }
      return props;
    },

    addPropertyWithValue: function addStringProperty(aName, aValue) {
      var ucName = aName.toUpperCase();
      var lineData = ICAL.icalparser.detectValueType({
        name: ucName,
        value: aValue
      });

      var prop = ICAL.icalproperty.fromData(lineData);
      ICAL.helpers.dumpn("Adding property " + ucName + "=" + aValue);
      return this.addProperty(prop);
    },

    addProperty: function addProperty(aProp) {
      var prop = aProp;
      if (aProp.parent) {
        prop = aProp.clone();
      }
      aProp.parent = this;

      ICAL.helpers.ensureKeyExists(this.properties, aProp.name, []);
      this.properties[aProp.name].push(aProp);
      ICAL.helpers.dumpn("DATA IS: " + this.data.toString());
      this.data.value.push(aProp);
      ICAL.helpers.dumpn("Adding property " + aProp);
    },

    removeProperty: function removeProperty(aName) {
      var ucName = aName.toUpperCase();
      for (var key in this.properties[ucName]) {
        var pos = this.data.value.indexOf(this.properties[ucName][key]);
        if (pos > -1) {
          this.data.value.splice(pos, 1);
        }
      }
      delete this.properties[ucName];
    },

    clearAllProperties: function clearAllProperties() {
      this.properties = {};
      for (var i = this.data.value.length - 1; i >= 0; i--) {
        if (this.data.value[i].type != "COMPONENT") {
          delete this.data.value[i];
        }
      }
    },

    _valueToJSON: function(value) {
      if (value && value.icaltype) {
        return value.toString();
      }

      if (typeof(value) === 'object') {
        return this._undecorateJSON(value);
      }

      return value;
    },

    _undecorateJSON: function(object) {
      if (object instanceof Array) {
        var result = [];
        var len = object.length;

        for (var i = 0; i < len; i++) {
          result.push(this._valueToJSON(object[i]));
        }

      } else {
        var result = {};
        var key;

        for (key in object) {
          if (object.hasOwnProperty(key)) {
            result[key] = this._valueToJSON(object[key]);
          }
        }
      }

      return result;
    },

    /**
     * Exports the components values to a json friendly
     * object. You can use JSON.stringify directly on
     * components as a result.
     */
    toJSON: function toJSON() {
      return this._undecorateJSON(this.undecorate());
    },

    toString: function toString() {
      var str = ICAL.helpers.foldline("BEGIN:" + this.name) + ICAL.newLineChar;
      for (var key in this.data.value) {
        str += this.data.value[key].toString() + ICAL.newLineChar;
      }
      str += ICAL.helpers.foldline("END:" + this.name);
      return str;
    }
  };

  ICAL.icalcomponent.fromString = function icalcomponent_from_string(str) {
    return ICAL.toJSON(str, true);
  };

  ICAL.icalcomponent.fromData = function icalcomponent_from_data(aData) {
    return new ICAL.icalcomponent(aData);
  };
})();
