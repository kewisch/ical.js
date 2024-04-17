'use strict';

const Mocha = require('mocha');
const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END
} = Mocha.Runner.constants;

const { Base } = Mocha.reporters;
const color = Base.color;

// this reporter outputs test results, indenting two spaces per suite
class MyReporter extends Base {
  constructor(runner, options) {
    super(runner, options);
    this._indents = 0;
    this._n = 0;

    runner
      .once(EVENT_RUN_BEGIN, () => {
        Base.consoleLog();
      })
      .on(EVENT_SUITE_BEGIN, (suite) => {
        this._indents++;
        Base.consoleLog(color('suite', '%s%s'), this.indent(), suite.title);
      })
      .on(EVENT_SUITE_END, () => {
        this._indents--;
        if (this._indents === 1) {
          Base.consoleLog();
        }
      })
      .on(EVENT_TEST_PASS, test => {
        // Test#fullTitle() returns the suite name(s)
        // prepended to the test title
        let fmt =
        this.indent() +
        color('checkmark', '  ' + Base.symbols.ok) +
        color('pass', ' %s') +
        ' (fastest: %s)';
        Base.consoleLog(fmt, test.fullTitle(), test._benchFastest.join(","));
        this._indents += 2;
        Base.consoleLog(this.indent() + test._benchCycle.join("\n" + this.indent()));
        this._indents -= 2;
      })
      .on(EVENT_TEST_FAIL, (test) => {
        Base.consoleLog(this.indent() + color('fail', '  %d) %s'), ++this._n, test.title);
      })
      .once(EVENT_RUN_END, this.epilogue.bind(this));
  }

  indent() {
    return Array(this._indents).join('  ');
  }

  increaseIndent() {
  }

  decreaseIndent() {
    this._indents--;
  }
}

module.exports = MyReporter;
