ICALTester
==========

This is a simple program to compare various ICAL recurrence implementations
with ICAL.js. It generates random rules based on the format defined in
rules.json and runs them through the various libraries.

Running
-------

The usage goes as follows:

```bash
$ node compare.js rules.json ./support/libical-recur
```

The first argument to compare.js is the path to the rules.json described
further down. An example file is provided. The second argument is the path to a
binary executed for comparison. The binary should be able to take arguments as
in the following example and expects the same output:

```bash
# Usage: ./support/libical-recur <rrule> <dtstart> <occurrence count>
$ ./support/libical-recur "FREQ=MONTHLY;BYDAY=1FR,3SU" "2014-11-11T08:00:00" 10
20141116T080000
20141205T080000
20141221T080000
20150102T080000
20150118T080000
20150206T080000
20150215T080000
20150306T080000
20150315T080000
20150403T080000
```

The libical-recur binary can be built using the provided Makefile.

rules.json
----------

The format is the same as what can be passed to ICAL.Recur.fromData(), with one
addition. If the value is `%`, the tester generates a random rule value.

Example:

```json
[
  { "freq": "MONTHLY", "bymonthday": "%" }
]
```

Possible Result:

```
RRULE:FREQ=MONTHLY;BYMONTHDAY=1,15,17,20,31
```
