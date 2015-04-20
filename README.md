# jsical - Javascript parser for rfc5545

This is a library to parse the iCalendar format defined in
[rfc5545](http://tools.ietf.org/html/rfc5545), as well as similar formats like
vCard.

There are still some issues to be taken care of, but the library works for most
cases. If you would like to help out and would like to discuss any API changes,
please [contact me](mailto:mozilla@kewis.ch) or create an issue.

The inital goal was to use this as a replacement for libical in the [Mozilla
Calendar Project](http://www.mozilla.org/projects/calendar/), but the library
has been written with the web in mind. This library is now called ical.js and
enables you to do all sorts of cool experiments with calendar data and the web.
I am also aiming for a caldav.js when this is done. Most algorithms here were
taken from [libical](https://github.com/libical/libical). If you are bugfixing
this library, please check if the fix can be upstreamed to libical.

[![Build Status](https://secure.travis-ci.org/mozilla-comm/ical.js.png?branch=master)](http://travis-ci.org/mozilla-comm/ical.js) [![npm version](https://badge.fury.io/js/ical.js.svg)](http://badge.fury.io/js/ical.js)

## Validator 

There is a validator that demonstrates how to use the library in a webpage in
the [sandbox/](https://github.com/mozilla-comm/ical.js/tree/master/sandbox)
subdirectory.

[Try the validator online](http://mozilla-comm.github.com/ical.js/validator.html), it always uses the latest copy of ical.js.

## Installing

Run: `npm install ical.js`

NOTE: ical.js will work with node 0.8.x, but the development dependencies
contain packages that require a later version. Please use
`npm install --production ical.js` for node 0.8.x

## Developing

Run: `npm install .`

The single-file browser build can be found under [build/ical.js](build/ical.js)
and needs to be rebuilt before pushing. Please see
[CONTRIBUTING.md](CONTRIBUTING.md) for more details.

### Tests

Tests can either be run via node or in the browser, but setting up the testing
infrastructure requires [node](https://github.com/joyent/node). More
information on how to set up and run tests can be found on
[the wiki](https://github.com/mozilla-comm/ical.js/wiki/Running-Tests).

#### in node js

    grunt test-node

#### in the browser

Running `grunt test-server` will start a webserver and open the page in your
browser. You can then select and execute tests as you wish. If you want to run
all tests you can also open a second terminal and run `grunt test-browser`

## Documentation

Aside from inline documentation and jsdoc in the source, there are some guides
and descriptions in [the wiki](https://github.com/mozilla-comm/ical.js/wiki).
If you are missing anything, please don't hesitate to create an issue.
