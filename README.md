# ical.js - Javascript parser for iCalendar, jCal, vCard, jCard.

This is a library to parse the formats defined in the following rfcs and their extensions:
* [rfc 5545](http://tools.ietf.org/html/rfc5545) (iCalendar)
* [rfc7265](http://tools.ietf.org/html/rfc7265) (jCal)
* [rfc6350](http://tools.ietf.org/html/rfc6350) (vCard)
* [rfc7095](http://tools.ietf.org/html/rfc7095) (jCard)

The initial goal was to use it as a replacement for libical in the [Mozilla Calendar
Project](http://www.mozilla.org/projects/calendar/), but the library has been written with the web
in mind. This library enables you to do all sorts of cool experiments with calendar data and the
web. Most algorithms here were taken from [libical](https://github.com/libical/libical). If you are
bugfixing this library, please check if the fix can be upstreamed to libical.

![Build Status](https://github.com/kewisch/ical.js/workflows/Checkin/badge.svg) [![Coverage Status](https://coveralls.io/repos/kewisch/ical.js/badge.svg)](https://coveralls.io/r/kewisch/ical.js) [![npm version](https://badge.fury.io/js/ical.js.svg)](http://badge.fury.io/js/ical.js) [![CDNJS](https://img.shields.io/cdnjs/v/ical.js.svg)](https://cdnjs.com/libraries/ical.js)  

## Sandbox and Validator

If you want to try out ICAL.js right now, there is a
[jsfiddle](http://jsfiddle.net/kewisch/227efboL/) set up and ready to use.

The ICAL validator demonstrates how to use the library in a webpage, and helps verify iCalendar and
jCal. [Try the validator online](http://kewisch.github.io/ical.js/validator.html)

The recurrence tester calculates occurrences based on a RRULE. It can be used to aid in
creating test cases for the recurrence iterator.
[Try the recurrence tester online](https://kewisch.github.io/ical.js/recur-tester.html).

## Installing

ICAL.js has no dependencies and is written in modern JavaScript. You can install ICAL.js via
[npm](https://www.npmjs.com/), if you would like to use it in Node.js:
```bash
npm install ical.js
```
Then simply import it for use:
```javascript
import ICAL from "ical.js";
```

If you are working with a browser, be aware this is an ES6 module:

```html
<script type="module">
  import ICAL from "https://unpkg.com/ical.js/dist/ical.min.js";
  document.querySelector("button").addEventListener("click", () => {
    ICAL.parse(document.getElementById("txt").value);
  });
</script>
```

If you need to make use of a script tag, you can use the transpiled ES5 version:
```html
<script src="https://unpkg.com/ical.js/dist/ical.es5.min.cjs"></script>
<textarea id="txt"></textarea>
<button onclick="ICAL.parse(document.getElementById('txt').value)"></button>
```

The browser examples above use the minified versions of the library, which is probably what you want.
However, there are also unminified versions of ICAL.js available on unpkg.

- Unminified ES6 module: `https://unpkg.com/ical.js/dist/ical.js`
- Unminified ES5 version: `https://unpkg.com/ical.js/dist/ical.es5.cjs`

## Timezones
The stock ical.js does not register any timezones, due to the additional size it brings. If you'd
like to do timezone conversion, and the timezone definitions are not included in the respective ics
files, you'll need to use `ical.timezones.js` or its minified counterpart.

This file is not included in the distribution since it pulls in IANA timezones that might change
regularly. See the github actions on building your own timezones during CI, or grab a recent build
from main.

## Documentation

For a few guides with code samples, please check out
[the wiki](https://github.com/kewisch/ical.js/wiki). If you prefer,
full API documentation [is available here](http://kewisch.github.io/ical.js/api/).
If you are missing anything, please don't hesitate to create an issue.

## Developing

To contribute to ICAL.js you need to set up the development environment. A simple `npm install` will
get you set up. If you would like to help out and would like to discuss any API changes, please feel 
free to create an issue.

### Tests

The following test suites are available

    npm run test-unit         # Node unit tests
    npm run test-acceptance   # Node acceptance tests
    npm run test-performance  # Performance comparison tests
    npm run test-browser      # Browser unit and acceptance tests
    
    npm run test              # Node unit and acceptance tests (This is fast and covers most aspects)
    npm run test-all          # All of the above

See [the wiki](https://github.com/kewisch/ical.js/wiki/Running-Tests) for more details.

Code coverage is automatically generated for the node unit tests. You can [view the coverage
results](https://coveralls.io/r/kewisch/ical.js) online, or run them locally to make sure new
code is covered.

### Linters
To make sure all ICAL.js code uses a common style, please run the linters using `npm run lint`.
Please make sure you fix any issues shown by this command before sending a pull request.

### Documentation
You can generate the documentation locally, this is also helpful to ensure the jsdoc you have
written is valid. To do so, run `npm run jsdoc`. You will find the output in the `docs/api/`
subdirectory.

### Packaging
When you are done with your work, you can run `npm run build` to create the single-file build for
use in the browser, including its minified counterpart and the source map.

## License
ical.js is licensed under the
[Mozilla Public License](https://www.mozilla.org/MPL/2.0/), version 2.0.
