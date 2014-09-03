# jsical - Javascript parser for rfc5545

This is a library to parse the iCalendar format defined in
[rfc5545](http://tools.ietf.org/html/rfc5545), as well as similar formats like
vCard.

There are still some issues to be taken care of, but the library works for most
cases. If you would like to help out and would like to discuss any API changes,
please [contact me](mailto:mozilla@kewis.ch).

The inital goal was to use this as a replacement for libical in the [Mozilla
Calendar Project](http://www.mozilla.org/projects/calendar/), but the library
has been written with the web in mind. This library is now called ical.js and
enables you to do all sorts of cool experiments with calendar data and the web.
I am also aiming for a caldav.js when this is done. Most algorithms here were
taken from [libical](https://github.com/libical/libical). If you are bugfixing
this library, please check if the fix can be upstreamed to libical.

[![Build Status](https://secure.travis-ci.org/mozilla-comm/ical.js.png?branch=master)](http://travis-ci.org/mozilla-comm/ical.js)

## Validator 

There is a validator that demonstrates how to use the library in a webpage in the [sandbox/](https://github.com/mozilla-comm/ical.js/tree/master/sandbox) subdirectory.

[Try the validator online](http://mozilla-comm.github.com/ical.js/validator.html), it always uses the latest copy of ical.js.

## Developing

Run: `npm install .`

The browser build is always found under build/ical.js. 

### Tests

You need nodejs/nodejs to install the testing tools.

#### in node js

1. `make test-node`

#### in the browser

1.  Run `make test-server`
    Go to http://localhost:8789/test-agent/index.html
    Run all tests with `make test-browser`

## Documentation

Until a full reference documentation is available, please see the
[wiki](https://github.com/mozilla-comm/ical.js/wiki) for a few examples.
