// ignore-css.js
// Ignore CSS imports in Node (for payload generate:types)
require.extensions['.css'] = () => {};
