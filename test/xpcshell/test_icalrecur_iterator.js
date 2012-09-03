/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

function run_test() {
    test_init();
}

function test_init() {

    check_init_throw({
        BYYEARDAY: [3,4,5],
        BYMONTH: [2]
    }, "Invalid BYYEARDAY rule");

    check_init_throw({
        BYWEEKNO: [3],
        BYMONTHDAY: [2]
    }, "BYWEEKNO does not fit to BYMONTHDAY");

    check_init_throw({
        freq: "MONTHLY",
        BYWEEKNO: [30],
    }, "For MONTHLY recurrences neither BYYEARDAY nor BYWEEKNO may appear");

    check_init_throw({
        freq: "WEEKLY",
        BYMONTHDAY: [20],
    }, "For WEEKLY recurrences neither BYMONTHDAY nor BYYEARDAY may appear");

    check_init_throw({
        freq: "DAILY",
        BYYEARDAY: [200],
    }, "BYYEARDAY may only appear in YEARLY rules");

    check_init_throw({
        freq: "MONTHLY",
        BYDAY: ["-5TH"]
    }, "Malformed values in BYDAY part", "19700201T000000Z");

    check_init_date({
        freq: "SECONDLY",
        BYSECOND: ["2"],
        BYMINUTE: ["2"],
        BYHOUR: ["2"],
        BYDAY: ["2"],
        BYMONTHDAY: ["2"],
        BYMONTH: ["2"],
        BYSETPOS: ["2"]
    }, "19700101T000000Z");

    check_init_date({
        freq: "MINUTELY",
        BYSECOND: [2,4,6],
        BYMINUTE: [1,3,5]
    }, "19700101T000002Z");

    check_init_date({
        freq: "YEARLY",
        BYSECOND: [1],
        BYMINUTE: [2],
        BYHOUR: [3],
        BYMONTHDAY: [4],
        BYMONTH: [5]
    }, "19700504T030201Z");

    check_init_date({
        freq: "WEEKLY",
        BYDAY: ["MO", "TH", "FR"]
    }, "19700101T000000Z");

    check_init_date({
        freq: "WEEKLY",
        BYDAY: ["MO", "WE"]
    }, "19700105T000000Z");

    check_init_date({
        freq: "YEARLY",
        BYMONTH: [3],
    }, "19700305T000000Z", "19700105T000000Z");

    check_init_date({
        freq: "YEARLY",
        BYDAY: ["FR"],
        BYMONTH: [12],
        BYMONTHDAY: [1],
    }, "19721201T000000Z");

    check_init_date({
        freq: "MONTHLY",
        BYDAY: ["2MO"]
    }, "19700112T000000Z");

    check_init_date({
        freq: "MONTHLY",
        BYDAY: ["-3MO"]
    }, "19700112T000000Z");

    // TODO bymonthday else part
    // TODO check weekly without byday instances + 1 same wkday
}

function check_init_date(data, last, dtstart) {
    var recur = new ICAL.icalrecur(data);

    if (dtstart) {
        dtstart = ICAL.icaltime.fromString(dtstart);
    } else {
        dtstart = ICAL.icaltime.epoch_time.clone();
    }

    var iter = recur.iterator(dtstart);
    do_check_eq(iter.next().toString(), last);
}

function check_init_throw(data, expectedMessage, dtstart, stack) {
    var recur = new ICAL.icalrecur(data);

    if (dtstart) {
        dtstart = ICAL.icaltime.fromString(dtstart);
    } else {
        dtstart = ICAL.icaltime.epoch_time.clone();
    }

    if (!stack) {
        stack = Components.stack.caller;
    }

    try {
        var iter = recur.iterator(dtstart);
    } catch (e) {
        if (e.message == expectedMessage) {
            var text = data.toSource() + " didn't throw '" + expectedMessage + "'";
            _dump("TEST-PASS | " + stack.filename + " | [" + stack.name + " : " +
                  stack.lineNumber + "] " + text + "\n");
            ++_passedChecks;
            return;
        }

        do_throw("expected result " + expectedMessage + ", but got " + e, stack);
    }
    do_throw("expected result " + expectedMessage + ", none thrown", stack);
}
