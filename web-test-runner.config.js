/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch */

import { playwrightLauncher } from "@web/test-runner-playwright";

let products = ["chromium", "firefox", "webkit"];

export default {
  files: ["test/*_test.js", "test/acceptance/*_test.js"],

  // Resolves the bare "chai" specifier in test/support/helper.js. The ICAL
  // sources are loaded by relative path and need no resolution.
  nodeResolve: true,

  browsers: products.map(product => playwrightLauncher({ product })),

  // Allows running a single engine, e.g. npm run test-browser -- --group webkit
  groups: products.map(product => ({
    name: product,
    browsers: [playwrightLauncher({ product })]
  })),

  testFramework: {
    config: {
      ui: "tdd",
      timeout: "30000"
    }
  },

  testsFinishTimeout: 120000,

  // helper.js installs the ICAL/assert/testSupport globals the test files
  // expect. It must finish evaluating, including its top level awaits, before
  // the mocha framework imports the test file. Awaiting a dynamic import
  // guarantees that; two module script tags would rely on the browser not
  // interleaving them. Keep these sequential.
  testRunnerHtml: testFramework => `
    <html>
      <body>
        <script type="module">
          try {
            await import("/test/support/helper.js");
          } catch (e) {
            // Let mocha load anyway, so a broken helper surfaces as test
            // failures instead of the whole file timing out.
            console.error(e);
          }
          await import("${testFramework}");
        </script>
      </body>
    </html>
  `
};
