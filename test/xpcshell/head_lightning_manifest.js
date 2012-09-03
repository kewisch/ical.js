/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

(function load_lightning_manifest() {
  let bindir = Components.classes["@mozilla.org/file/directory_service;1"]
                         .getService(Components.interfaces.nsIProperties)
                         .get("CurProcD", Components.interfaces.nsIFile);
  bindir.append("extensions");
  bindir.append("{e2fda1a4-762b-4020-b5ad-a41df1933103}");
  bindir.append("chrome.manifest");
  Components.manager.autoRegister(bindir);
})();

Components.utils.import("resource://calendar/modules/libical/ical.jsm");

function do_check_array_eq(a, b) {
    var same = (a.length == b.length);
    for (var i = 0; same && i < a.length; i++) {
        if (a[i] != b[i]) {
            same = false;
        }
    }

    var stack = Components.stack.caller;
    var text = a.toSource() + " == " + b.toSource();

    if (same) {
        ++_passedChecks;
        _dump("TEST-PASS | " + stack.filename + " | [" + stack.name + " : " +
              stack.lineNumber + "] " + text + "\n");
    } else {
        do_throw(text, stack);
    }
}
