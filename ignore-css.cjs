// ignore-css.cjs
// This tells Node to ignore .css imports during payload generate:types
require.extensions['.css'] = () => {};
