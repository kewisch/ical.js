/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch */

/* The Node only dependencies of helper.js, kept separate so that the browser
 * test runner never has to resolve them. */

export { readFile, readdir } from "node:fs/promises";
export { default as Benchmark } from "benchmark";
