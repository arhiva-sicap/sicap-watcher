module.exports = {
  env: {
    browser: true,
    es6: true,
    jest: true,
  },
  extends: "eslint:recommended",
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
    process: true,
  },
  parserOptions: {
    ecmaVersion: 11,
    sourceType: "module",
  },
  rules: {
    "max-len": ["error", { code: 200 }],
  },
}
