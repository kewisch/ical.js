import { defineConfig } from 'vite';

const license = `/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch */`;

export default defineConfig(({ mode }) => {
  const minified = mode !== 'development';
  const suffix = minified ? '.min' : '';

  return {
    build: {
      emptyOutDir: minified,
      lib: {
        entry: 'lib/ical/module.js',
        name: 'ICAL',
        formats: ['es', 'cjs', 'iife'],
        fileName(format) {
          if (format === 'iife') {
            return `ical.browser${suffix}.js`;
          }
          const extension = format === 'cjs' ? 'cjs' : 'js';
          return `ical${suffix}.${extension}`;
        }
      },
      minify: minified,
      sourcemap: true,
      target: 'es2022',
      rolldownOptions: {
        output: {
          banner: license
        }
      }
    }
  };
});
