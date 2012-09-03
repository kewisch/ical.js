/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

"use strict";

(typeof(ICAL) === 'undefined')? ICAL = {} : '';
(function() {
  ICAL.icalproperty = function icalproperty(data, parent) {
    this.wrappedJSObject = this;
    this.parent = parent;
    this.fromData(data);
  }

  ICAL.icalproperty.prototype = {
    parent: null,
    data: null,
    name: null,
    icalclass: "icalproperty",

    clone: function clone() {
      return new ICAL.icalproperty(this.undecorate(), this.parent);
    },

    fromData: function fromData(aData) {
      if (!aData.name) {
        ICAL.helpers.dumpn("Missing name: " + aData.toString());
      }
      this.name = aData.name;
      this.data = aData;
      this.setValues(this.data.value, this.data.type);
      delete this.data.name;
    },

    undecorate: function() {
      var values = [];
      for (var key in this.data.value) {
        var val = this.data.value[key];
        if ("undecorate" in val) {
          values.push(val.undecorate());
        } else {
          values.push(val);
        }
      }
      var obj = {
        name: this.name,
        type: this.data.type,
        value: values
      };
      if (this.data.parameters) {
        obj.parameters = this.data.parameters;
      }
      return obj;
    },

    toString: function toString() {
      return ICAL.icalparser.stringifyProperty({
        name: this.name,
        type: this.data.type,
        value: this.data.value,
        parameters: this.data.parameters
      });
    },

    getStringValue: function getStringValue() {
      ICAL.helpers.dumpn("GV: " + ICAL.icalparser.stringifyValue(this.data));
      return ICAL.icalparser.stringifyValue(this.data);
    },

    setStringValue: function setStringValue(val) {
      this.setValue(val, this.data.type);
      // TODO force TEXT or rename method to something like setParseValue()
    },

    getFirstValue: function getValue() {
      return (this.data.value ? this.data.value[0] : null);
    },

    getValues: function getValues() {
      return (this.data.value ? this.data.value : []);
    },

    setValue: function setValue(aValue, aType) {
      return this.setValues([aValue], aType);
    },

    setValues: function setValues(aValues, aType) {
      var newValues = [];
      var newType = null;
      for (var key in aValues) {
        var value = aValues[key];
        if (value.icalclass && value.icaltype) {
          if (newType && newType != value.icaltype) {
            throw new Error("All values must be of the same type!");
          } else {
            newType = value.icaltype;
          }
          newValues.push(value);
        } else {
          var type;
          if (aType) {
            type = aType;
          } else if (typeof value == "string") {
            type = "TEXT";
          } else if (typeof value == "number") {
            type = (Math.floor(value) == value ? "INTEGER" : "FLOAT");
          } else if (typeof value == "boolean") {
            type = "BOOLEAN";
            value = (value ? "TRUE" : "FALSE");
          } else {
            throw new ParserError(null, "Invalid value: " + value);
          }

          if (newType && newType != type) {
            throw new Error("All values must be of the same type!");
          } else {
            newType = type;
          }
          ICAL.icalparser.validateValue(this.data, type, "" + value, true);
          newValues.push(ICAL.icalparser.decorateValue(type, "" + value));
        }
      }

      this.data.value = newValues;
      this.data.type = newType;
      return aValues;
    },

    getValueType: function getValueType() {
      return this.data.type;
    },

    getName: function getName() {
      return this.name;
    },

    getParameterValue: function getParameter(aName) {
      var value = null;
      var ucName = aName.toUpperCase();
      if (ICAL.helpers.hasKey(this.data.parameters, ucName)) {
        value = this.data.parameters[ucName].value;
      }
      return value;
    },

    getParameterType: function getParameterType(aName) {
      var type = null;
      var ucName = aName.toUpperCase();
      if (ICAL.helpers.hasKey(this.data.parameters, ucName)) {
        type = this.data.parameters[ucName].type;
      }
      return type;
    },

    setParameter: function setParameter(aName, aValue, aType) {
      // TODO autodetect type by name
      var ucName = aName.toUpperCase();
      ICAL.helpers.ensureKeyExists(this.data, "parameters", {});
      this.data.parameters[ucName] = {
        type: aType || "TEXT",
        value: aValue
      };

      if (aName == "VALUE") {
        this.data.type = aValue;
        // TODO revalidate value
      }
    },

    countParameters: function countParmeters() {
      // TODO Object.keys compatibility?
      var dp = this.data.parameters;
      return (dp ? Object.keys(dp).length : 0);
    },

    removeParameter: function removeParameter(aName) {
      var ucName = aName.toUpperCase();
      if (ICAL.helpers.hasKey(this.data.parameters, ucName)) {
        delete this.data.parameters[ucName];
      }
    }
  };

  ICAL.icalproperty.fromData = function(aData) {
    return new ICAL.icalproperty(aData);
  };
})();
