/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2024 */

/**
 * This jsdoc plugin collects all classes and static typedefs defined in the library
 * which start with `ICAL.` and writes those to a temporary file which is read 
 * by the jsdoc-ical plugin.
 * This is needed because of jsdoc plugin limitations.
 */

const fs = require("node:fs");
let gIcalClasses = new Set();
let typedefs = new Set();

exports.handlers = {
  newDoclet: function({ doclet }) {
    if (doclet.kind == "class" && doclet.longname.startsWith("ICAL.")) {
      gIcalClasses.add(doclet.name);
    }
    if (doclet.kind === "typedef" && doclet.scope === "static" && doclet.longname.startsWith("ICAL.")) {
      typedefs.add({name: doclet.name, full: doclet.longname})
    }
  },
  processingComplete: function() {
    fs.writeFileSync("./tools/jsdoc-symbols-temp.json", JSON.stringify({gIcalClasses: Array.from(gIcalClasses), typedefs: Array.from(typedefs)}));
  }
};
