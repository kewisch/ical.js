/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const jsdoc = path.join(root, "node_modules", ".bin", "jsdoc");
const tempConfig = path.join(root, ".jsdoc-build.json");
const args = process.argv.slice(2);
const basePathIndex = args.indexOf("--base-path");
const basePath = basePathIndex === -1 ? null : args[basePathIndex + 1];

function run(config) {
  const result = spawnSync(jsdoc, ["--configure", config, "--verbose"], {
    cwd: root,
    stdio: "inherit"
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status);
  }
}

try {
  fs.rmSync(path.join(root, "docs", "api"), { recursive: true, force: true });
  run(path.join(root, "jsdoc-prepare.json"));

  fs.rmSync(path.join(root, "docs", "api"), { recursive: true, force: true });
  if (basePath) {
    const config = JSON.parse(fs.readFileSync(path.join(root, "jsdoc.json"), "utf8"));
    config.opts.basePath = basePath;
    fs.writeFileSync(tempConfig, JSON.stringify(config, null, 2));
    run(tempConfig);
  } else {
    run(path.join(root, "jsdoc.json"));
  }
} finally {
  fs.rmSync(tempConfig, { force: true });
}
