const { defineConfig } = require('i18next-cli')

/** @type {import('i18next-cli').I18nextToolkitConfig} */
module.exports = defineConfig({
  locales: [
    "en",
    "af",
    "xh",
    "zu",
    "nso",
    "st",
    "tn",
    "ss",
    "ve",
    "ts",
    "nr"
  ],
  extract: {
    input: [
      'src/**/*.{js,jsx,ts,tsx}',
    ],
    output: 'src/i18n/locales/{{language}}.json',
  }
})