import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'lib/ical/module.js',
  output: [
    { file: 'dist/ical.js', format: 'es', exports: "default" },
    {
      file: 'dist/ical.min.js',
      format: 'es',
      exports: "default",
      plugins: [terser()]
    },
    {
      file: 'dist/ical.es5.cjs',
      exports: "default",
      format: 'cjs',
      plugins: [
        getBabelOutputPlugin({ presets: ['@babel/preset-env'] })
      ],
    },
    {
      file: 'dist/ical.es5.min.cjs',
      exports: "default",
      format: 'cjs',
      plugins: [
        getBabelOutputPlugin({ presets: ['@babel/preset-env'] }),
        terser()
      ]
    }
  ]
};
