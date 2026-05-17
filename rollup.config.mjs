import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'player.js',
  output: { file: 'player.bundle.js', format: 'iife' },
  plugins: [resolve()],
};
