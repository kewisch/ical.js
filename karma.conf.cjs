// Karma configuration
// Generated on Sun Feb 20 2022 00:57:11 GMT+0100 (Central European Standard Time)

let pkg = require("./package.json");

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai'],
    plugins: ["karma-chai", "karma-mocha", "karma-spec-reporter"],
    files: [
      { pattern: 'samples/**/*.ics', included: false },
      { pattern: 'test/parser/*', included: false },
      { pattern: 'lib/ical/*.js', type: 'module', included: false },
      { pattern: 'test/*_test.js', included: false },
      { pattern: 'test/acceptance/*_test.js', included: false },
      { pattern: 'test/support/helper.js', type: "module", included: true },
    ],
    client: { mocha: Object.assign(pkg.mocha, { timeout: 0 }) },
    reporters: ['spec'],
    port: 9876,
    colors: true,
    autoWatch: false,
    singleRun: true,
    concurrency: Infinity,
    captureTimeout: 240000,
    browserNoActivityTimeout: 120000,
    //browsers: ['Firefox'],

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO
  });


  if (process.env.GITHUB_ACTIONS) {
    config.set({
      exitOnFailure: false,
      customLaunchers: pkg.saucelabs,
      browsers: Object.keys(pkg.saucelabs),
      reporters: ['saucelabs', 'spec'],
      sauceLabs: {
        testName: 'ICAL.js',
        startConnect: true
      }
    });
  }
};
