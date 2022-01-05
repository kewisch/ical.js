/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2021 */

/* jshint ignore:start */
var ICAL;
(function() {
  /* istanbul ignore next */
  if (typeof module === 'object') {
    // CommonJS, where exports may be different each time.
    ICAL = module.exports;
  } else if (typeof HTMLScriptElement !== 'undefined' && 'noModule' in HTMLScriptElement.prototype) {
    // Until we use ES6 exports, using <script type="module"> we define ICAL on the window global.
    window.ICAL = ICAL = {};
  } else if (typeof ICAL !== 'object') {
    ICAL = {};
  }
})();
/* jshint ignore:end */
