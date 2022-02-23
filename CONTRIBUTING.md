Woohoo, a new contributor!
==========================
Thank you so much for looking into ical.js. With your work you are doing good by making it easier to
process calendar data on the web.

To give you a feeling about what you are dealing with, ical.js was originally created as a
replacement for [libical], meant to be used in [Lightning], the calendaring extension to
Thunderbird. Using binary components in Mozilla extensions often leads to compatibility issues so a
pure JavaScript implementation was needed. It was also used in the Firefox OS calendaring
application.

Work on the library prompted creating some standards around it. One of them is jCal ([rfc7265]), an
alternative text format for iCalendar data using JSON. The other document is jCard ([rfc7095]),
which is the counterpart for vCard data.

Pull Requests
-------------
In general we are happy about any form of contribution to ical.js. Note however that since the
library is used in at least one larger projects, drastic changes to the API should be discussed in
an issue beforehand. If you have a bug fix that doesn't affect the API or just adds methods and you
don't want to waste time discussing it, feel free to just send a pull request and we'll see.

Also, you should check for linter errors and run the tests using `npm run lint` `npm run test`.
There are also performance tests and browser tests if you want to be thourough.

Currently the team working on ical.js consists of a very small number of voluntary contributors. If
you don't get a reply in a timely manner please don't feel turned down. If you are getting impatient
with us, go ahead and send one or more reminders via email or comment.

License
-------
ical.js is licensed under the [Mozilla Public License], version 2.0.

Last words
----------
If you have any questions please don't hesitate to get in touch. You can leave a comment on an
issue, send [@kewisch] an email, or for ad-hoc questions contact `Fallen` on [chat.mozilla.org].

[libical]: https://github.com/libical/libical/
[Lightning]: http://www.mozilla.org/projects/calendar/
[rfc7095]: https://tools.ietf.org/html/rfc7095
[rfc7265]: https://tools.ietf.org/html/rfc7265
[running tests]: https://github.com/mozilla-comm/ical.js/wiki/Running-Tests
[chat.mozilla.org]: https://chat.mozilla.org/
[@kewisch]: https://github.com/kewisch/
[Mozilla Public License]: https://www.mozilla.org/MPL/2.0/
