/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2024 */

let gIcalClasses = new Set();

function augmentTypes(obj) {
  if (obj.type?.names?.length) {
    for (let i = 0; i < obj.type.names.length; i++) {
      if (gIcalClasses.has(obj.type.names[i]) && !obj.type.names[i].startsWith("ICAL.")) {
        obj.type.names[i] = "ICAL." + obj.type.names[i];
      }
    }
  }
}

exports.handlers = {
  newDoclet: function({ doclet }) {
    if (doclet.kind == "class" && doclet.longname.startsWith("ICAL.")) {
      gIcalClasses.add(doclet.name);
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
  }
};
