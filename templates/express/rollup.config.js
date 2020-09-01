// NPM
// npm i @rollup/plugin-commonjs @rollup/plugin-node-resolve rollup-plugin-terser -D
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/js/script.js',
  output: [
    {
      file: 'public/js/script.min.js',
      format: 'es',
      plugins: [terser()],
    },
  ],
  plugins: [
    commonjs({
      transformMixedEsModules: true,
    }),
    nodeResolve(),
  ],
};
