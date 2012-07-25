# jsical - Javascript parser for rfc5545

This is a library to parse the ICAL format defined in [rfc5545](http://tools.ietf.org/html/rfc5545). While it may be usable for basic tasks, it is still very much in development. There are a lot of TODOs in this library. If you would like to help out and would like to discuss any API changes, please [contact me](mailto:mozilla@kewis.ch).

The inital goal was to use this as a replacement for libical in the [Mozilla Calendar Project](http://www.mozilla.org/projects/calendar/), but the library has been written with the web in mind. This library should one day be called ical.js and allow all sorts of cool experiments with calendar data and the web. I am also aiming for a caldav.js when this is done. Most algorithms here were taken from [libical](http://sourceforge.net/projects/freeassociation/). If you are bugfixing this library, please check if the fix can be upstreamed to libical.

Check out sandbox/validation.html for how to use this library from a web page.

## Tests

Currently tests only run in a gecko browser environment.
The goal is to have complete support for most modern browsers
nodejs and power the ical parser of Lightning (xpcom tests).

1. Run `make package`

2. (without node js

    Tests are written in mocha and chai for assertions.
    Run `make test-agent-config`
    (You need a webserver)
    Go to http://your_server/ical.js/test-agent/index.html

2. (with nodejs)

    Run `make test-server`
    Go to http://localhost:8789/test-agent/index.html
    Run all tests with `make test`
