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
    fs.writeFileSync("./temp.json", JSON.stringify({gIcalClasses: Array.from(gIcalClasses), typedefs: Array.from(typedefs)}));
  }
};