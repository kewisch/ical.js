# jsical - Javascript parser for rfc5545

This is a library to parse the iCalendar format defined in
[rfc5545](http://tools.ietf.org/html/rfc5545), as well as similar formats like
vCard.

There are still some issues to be taken care of, but the library works for most
cases. If you would like to help out and would like to discuss any API changes,
please [contact me](mailto:mozilla@kewis.ch) or create an issue.

The initial goal was to use it as a replacement for libical in the [Mozilla
Calendar Project](http://www.mozilla.org/projects/calendar/), but the library
has been written with the web in mind. This library is now called ICAL.js and
enables you to do all sorts of cool experiments with calendar data and the web.
I am also aiming for a caldav.js when this is done. Most algorithms here were
taken from [libical](https://github.com/libical/libical). If you are bugfixing
this library, please check if the fix can be upstreamed to libical.

[![Build Status](https://secure.travis-ci.org/mozilla-comm/ical.js.png?branch=master)](http://travis-ci.org/mozilla-comm/ical.js) [![Coverage Status](https://coveralls.io/repos/mozilla-comm/ical.js/badge.svg)](https://coveralls.io/r/mozilla-comm/ical.js) [![npm version](https://badge.fury.io/js/ical.js.svg)](http://badge.fury.io/js/ical.js)

## Validator 

There is a validator that demonstrates how to use the library in a webpage in
the [sandbox/](https://github.com/mozilla-comm/ical.js/tree/master/sandbox)
subdirectory.

[Try the validator online](http://mozilla-comm.github.com/ical.js/validator.html), it always uses the latest copy of ICAL.js.

## Installing

Run: `npm install ical.js`

ICAL.js has no dependencies and uses fairly basic JavaScript. Therefore, it
should work in all versions of node and modern browsers. It does use getters
and setters, so the minimum version of Internet Explorer is 9.

## Developing

To contribute to ICAL.js you need to set up the development environment. This
requires node 0.10.x or later and grunt. Run the following steps to get
started.

    npm install -g grunt-cli  # Might need to run with sudo
    npm install .

You can now dive into the code, run the tests and check coverage.

### Tests

Tests can either be run via node or in the browser, but setting up the testing
infrastructure requires [node](https://github.com/joyent/node). More
information on how to set up and run tests can be found on
[the wiki](https://github.com/mozilla-comm/ical.js/wiki/Running-Tests).

#### in node js

The quickest way to execute tests is using node. Running the following command
will run all test suites: performance, acceptance and unit tests.

    grunt test-node

You can also select a single suite, or run a single test.

    grunt test-node:performance
    grunt test-node:acceptance
    grunt test-node:unit

    grunt test-node:single --test test/parse_test.js

Appending the `--debug` option to any of the above commands will run the
test(s) with node-inspector. It will start the debugging server and open it in
Chrome or Opera, depending on what you have installed. The tests will pause
before execution starts so you can set breakpoints and debug the unit tests
you are working on.

If you run the performance tests comparison will be done between the current
working version (latest), a previous build of ICAL.js (previous) and the
unchanged copy of build/ical.js (from the master branch). See
[the wiki](https://github.com/mozilla-comm/ical.js/wiki/Running-Tests) for more
details.

#### in the browser

Running `grunt test-server` will start a webserver and open the page in your
browser. You can then select and execute tests as you wish. If you want to run
all tests you can also open a second terminal and run `grunt test-browser`

### Code Coverage
ICAL.js is set up to calculate code coverage. You can
[view the coverage results](https://coveralls.io/r/mozilla-comm/ical.js)
online, or run them locally to make sure new code is covered. Running `grunt
coverage` will run the unit test suite measuring coverage. You can then open
`coverage/lcov-report/index.html` to view the results in your browser.

### Linters
To make sure all ICAL.js code uses a common style, please run the linters using
`grunt linters`. Please make sure you fix any issues shown by this command
before sending a pull request.

### Packaging
When you are done with your work, you can run `grunt package` to create the
single-file build for use in the browser. This file needs to be checked in (in
a separate commit) and can be found in [build/ical.js](build/ical.js). Please
see [CONTRIBUTING.md](CONTRIBUTING.md) for more details.


## Documentation

Aside from inline documentation and jsdoc in the source, there are some guides
and descriptions in [the wiki](https://github.com/mozilla-comm/ical.js/wiki).
If you are missing anything, please don't hesitate to create an issue.
