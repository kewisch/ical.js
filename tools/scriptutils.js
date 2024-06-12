/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch */

import { Octokit } from "@octokit/core";
import fetch from 'node-fetch';
import fs from "fs/promises";
import fsc from "fs";
import path from "path";
import { pipeline } from "stream/promises";


const octokit = new Octokit();

async function get_latest_release(outFile) {
  let response = await octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
    owner: 'kewisch',
    repo: 'ical.js'
  });

  let release = response.data.name;

  let icaljsAsset = response.data.assets.find(asset => asset.name == "ical.js");
  if (!icaljsAsset) {
    console.error("ical.js asset missing from " + release);
  }
  response = await fetch(icaljsAsset.browser_download_url);

  let icaljs = await response.text();

  await fs.writeFile(outFile, icaljs);
  console.log("Latest release written to " + outFile);
}


async function get_latest_main(outFile) {
  let response = await octokit.request("GET /repos/{owner}/{repo}/actions/runs", {
    workflow_id: "ci.yml",
    branch: "es6",
    //branch: "main",
    status: "success",
    //exclude_pull_requests: true,
    //event: "push",
    owner: "kewisch",
    repo: "ical.js"
  });

  let workflows = response.data.workflow_runs;

  workflows.sort((a, b) => {
    let datea = new Date(a);
    let dateb = new Date(b);

    return (datea < dateb) - (dateb < datea);
  });

  let archive_download_url = `https://nightly.link/kewisch/ical.js/actions/runs/${workflows[0].id}/distribution.zip`;
  console.log(archive_download_url);
  response = await fetch(archive_download_url);
  if (!response.ok) {
    throw new Error(response.status);
  }

  let buffer = Buffer.from(await response.arrayBuffer());

  // Yauzl has been difficult due to the native bindings for crc32.
  // Import ad-hoc to make GitHub Actions work.
  let yauzl = await import("yauzl-promise");

  let archive = await yauzl.fromBuffer(buffer);

  let entry;
  do {
    entry = await archive.readEntry();
  } while (entry && entry.fileName == "ical.js");

  if (!entry) {
    throw new Error("ical.js not found in distribution");
  }

  let stream = await entry.openReadStream();
  let writeStream = fsc.createWriteStream(outFile);

  await pipeline(stream, writeStream);

  console.log("Latest main written to " + outFile);
}

async function performance_downloader() {
  await Promise.allSettled([
    get_latest_main("./tools/benchmark/ical_main.cjs"),
    get_latest_release("./tools/benchmark/ical_release.js")
  ]);
}

async function generateZonesFile(tzdbDir) {
  async function processZone(zoneFile) {
    let contents = await fs.readFile(zoneFile, "utf-8");
    let lines = contents.split("\r\n");
    let vtimezone = lines.slice(lines.indexOf("BEGIN:VTIMEZONE") + 1, lines.indexOf("END:VTIMEZONE")).join("\r\n");
    return `  register(${JSON.stringify(vtimezone)});`;
  }

  let tzdbVersion = (await fs.readFile(path.join(tzdbDir, "version"), "utf-8")).trim();

  let lines = [
    `(function() {`,
    `  function register(tzdata) { ICAL.TimezoneService.register(ICAL.Component.fromString("BEGIN:VTIMEZONE\\r\\n" + tzdata + "\\r\\nEND:VTIMEZONE")) };`,
    `  ICAL.TimezoneService.IANA_TZDB_VERSION = "${tzdbVersion}";`
  ];

  let contents = await fs.readFile(path.join(tzdbDir, "zoneinfo", "zones.tab"), "utf-8");
  for (let line of contents.split("\n")) {
    let parts = line.split(" ");
    if (parts.length == 3 && parts[2].length) {
      lines.push(await processZone(path.join(tzdbDir, "zoneinfo", parts[2] + ".ics")));
    } else if (parts.length == 1 && parts[0].length) {
      lines.push(await processZone(path.join(tzdbDir, "zoneinfo", parts[0] + ".ics")));
    }
  }

  lines.push("})();");

  return lines.join("\n");
}

async function get_tzdb_version() {
  let response = await fetch('https://www.iana.org/time-zones');
  let text = await response.text();

  let match = text.match(/version">([0-9a-z]*)<\/span>/);
  if (!match) {
    throw new Error('Could not detect latest timezone database version');
  }
  return match[1];
}

async function replace_unpkg(input, output) {
  let content = await fs.readFile(input, { encoding: "utf-8" });
  let pkg = JSON.parse(await fs.readFile(path.join(import.meta.dirname, "..", "package.json"), { encoding: "utf-8" }));
  await fs.writeFile(output, content.replace(/unpkg.com\/ical.js/g, `unpkg.com/ical.js@${pkg.version}/dist/ical.js`));
  console.log(`unpkg link from ${input} updated to ${pkg.version} and written to ${output}`);
}

async function main() {
  switch (process.argv[2]) {
    case "tzdb-version":
      console.log(await get_tzdb_version());
      break;
    case "generate-zones":
      console.log(await generateZonesFile(process.argv[3]));
      break;
    case "performance-downloader":
      await performance_downloader();
      break;
    case "replace-unpkg":
      await replace_unpkg(process.argv[3], process.argv[4]);
  }
}
main();
