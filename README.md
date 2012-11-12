# jsical - Javascript parser for rfc5545

[![Build Status](https://secure.travis-ci.org/kewisch/ical.js.png?branch=master)](http://travis-ci.org/kewisch/ical.js)

This is a library to parse the ICAL format defined in [rfc5545](http://tools.ietf.org/html/rfc5545). While it may be usable for basic tasks, it is still very much in development. There are a lot of TODOs in this library. If you would like to help out and would like to discuss any API changes, please [contact me](mailto:mozilla@kewis.ch).

The inital goal was to use this as a replacement for libical in the [Mozilla Calendar Project](http://www.mozilla.org/projects/calendar/), but the library has been written with the web in mind. This library should one day be called ical.js and allow all sorts of cool experiments with calendar data and the web. I am also aiming for a caldav.js when this is done. Most algorithms here were taken from [libical](http://sourceforge.net/projects/freeassociation/). If you are bugfixing this library, please check if the fix can be upstreamed to libical.


## Validator 

There is a validator that demonstrates how to use the library in a webpage in the [sandbox/](https://github.com/kewisch/ical.js/tree/master/sandbox) subdirectory.

[Try the validator online](http://kewisch.github.com/ical.js/validator.html), it always uses the latest copy of ical.js.

## Developing

The browser build is always found under build/ical.js build/ical.min.js
coming soon.

Run `make package`

### Tests

You need nodejs/nodejs to install the testing tools.

#### in node js

1. `make test-node`

#### in the browser

1.  Run `make dev`

2.  Run `make test-server`
    Go to http://localhost:8789/test-agent/index.html
    Run all tests with `make test-browser`

