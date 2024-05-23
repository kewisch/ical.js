import { babel } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

const LICENSE =
`/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch */`;

const TERSER_OPTIONS = {
  format: {
    comments: function(node, comment) {
      if (comment.type == 'comment2') {
        return /terms of the Mozilla Public/.test(comment.value) && comment.pos === 0;
      }
      return false;
    }
  }
};

export default [{
  input: 'lib/ical/module.js',
  output: [
    { file: 'dist/ical.js', format: 'es', exports: 'default' },
    {
      file: 'dist/ical.min.js',
      banner: LICENSE,
      format: 'es',
      exports: 'default',
      plugins: [terser(TERSER_OPTIONS)]
    }
  ]
}, {
  input: 'lib/ical/module.js',
  output: [
    {
      file: 'dist/ical.es5.cjs',
      exports: 'default',
      name: 'ICAL',
      format: 'umd',
      banner: LICENSE,
    },
    {
      file: 'dist/ical.es5.min.cjs',
      exports: 'default',
      name: 'ICAL',
      format: 'umd',
      banner: LICENSE,
      plugins: [terser(TERSER_OPTIONS)],
    }
  ],
  plugins: [
    babel({ babelHelpers: 'bundled', presets: ['@babel/preset-env'] }),
    typescript({
      include: ['lib/ical/*.js'],
      noForceEmit: true,
      compilerOptions: {
        allowJs: true,
        declaration: true,
        emitDeclarationOnly: true,
        declarationMap: true,
        declarationDir: 'dist/types',
      },
    })
  ]
}];
