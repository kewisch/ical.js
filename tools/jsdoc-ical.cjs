/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2024 */

/**
 * This jsdoc plugin add the correct prefix `ICAL.` to everything that
 * uses a class or typedef which are collected by the jsdoc-collect-types plugin
 * so that the generated API docs link to the correct classes, typedefs, etc.
 */

const fs = require("node:fs");
let gIcalClasses = [];
let typedefs = [];

function addPrefix(objNames) {
  if (objNames?.length) {
    for (let i = 0; i < objNames.length; i++) {
      // finds all strings in objNames[i] that include a known class
      let classNames = gIcalClasses.reduce((acc, curr) => {
        if (objNames[i] === curr) acc = [...acc, curr];
        return acc;
      }, []);
      if ((gIcalClasses.includes(objNames[i]) || classNames.length !== 0) && !objNames[i].includes("ICAL.")) {
        for (let className of classNames) {
          let index = objNames[i].indexOf(className);
          // add ICAL. to classnames without ICAL.
          objNames[i] = objNames[i].substring(0, index) + "ICAL." + objNames[i].substring(index);
        }
      }
      // add correct typedef path to anything using a known typedef
      let typedef = typedefs.find((val) => objNames[i].includes(val.name));
      if (typedef !== undefined) {
        // replace partial name with full path
        let result = objNames[i].replace(typedef.name, typedef.full);
        objNames[i] = result;
      }
    }
  }
}

function augmentTypes(obj) {
  // handle @type
  if (obj.names?.length) {
    addPrefix(obj.names);
  }
  // handle @returns or @params
  if (obj.type?.names?.length) {
    addPrefix(obj.type?.names);
  }
}

exports.handlers = {
  parseBegin: function() {
    ({ gIcalClasses, typedefs } = JSON.parse(fs.readFileSync("./tools/jsdoc-symbols-temp.json", "utf-8")));
  },
  newDoclet: function({ doclet }) {
    if (doclet.type) {
      augmentTypes(doclet.type);
    }

    if (doclet.returns) {
      for (let ret of doclet.returns) {
        augmentTypes(ret);
      }
    }
    if (doclet.params) {
      for (let param of doclet.params) {
        augmentTypes(param);
      }
    }
    if (doclet.properties) {
      for (let property of doclet.properties) {
        augmentTypes(property);
      }
    }
  }
};
