/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

function run_test() {
    test_date_properties();
    test_normalize();
    test_roundtrip();
    test_calculations();
}

function test_roundtrip() {

    var f = new ICAL.icaltime({
        second: 1,
        minute: 2,
        hour: 3,
        day: 4,
        month: 5,
        year: 6007
    });

    var g = f.clone();
    g.fromJSDate(f.toJSDate());
    do_check_eq(f.toString(), g.toString());
    // TODO also check UTC dates

    g.reset();
    do_check_eq(g, ICAL.icaltime.epoch_time.toString());
}

function test_calculations() {

    var test_data = [{
        str: "20120101T000000",
        expect_unixtime: 1325376000,
        expect_1s: "20120101T000001",
        expect_1m: "20120101T000100",
        expect_1h: "20120101T010000",
        expect_1d: "20120102T000000",
        expect_1w: "20120108T000000"
    }];

    for (var datakey in test_data) {
        var data = test_data[datakey];
        var dt = ICAL.icaltime.fromString(data.str);
        var cp = dt.clone();

        do_check_eq(dt.toUnixTime(), data.expect_unixtime);
        var dur = dt.subtractDate(ICAL.icaltime.epoch_time);
        do_check_eq(dur.toSeconds(), data.expect_unixtime);

        cp = dt.clone();
        cp.year += 1;
        var diff = cp.subtractDate(dt);
        var yearseconds = (365 + ICAL.icaltime.is_leap_year(dt.year)) * 86400;
        do_check_eq(diff.toSeconds(), yearseconds);

        cp = dt.clone();
        cp.year += 2;
        var diff = cp.subtractDate(dt);
        var yearseconds = (365 + ICAL.icaltime.is_leap_year(dt.year) + 365 + ICAL.icaltime.is_leap_year(dt.year + 1)) * 86400;
        do_check_eq(diff.toSeconds(), yearseconds);

        cp = dt.clone();
        cp.year -= 1;
        var diff = cp.subtractDate(dt);
        var yearseconds = (365 + ICAL.icaltime.is_leap_year(cp.year)) * 86400;
        do_check_eq(diff.toSeconds(), -yearseconds);

        cp = dt.clone();
        cp.second += 3;
        var diff = cp.subtractDate(dt);
        do_check_eq(diff.toSeconds(), 3);

        cp = dt.clone();
        cp.addDuration(ICAL.icalduration.fromString("PT1S"));
        do_check_eq(cp, data.expect_1s);
        cp.addDuration(ICAL.icalduration.fromString("-PT1S"));
        do_check_eq(cp.toString(), dt.toString());

        cp.addDuration(ICAL.icalduration.fromString("PT1M"));
        do_check_eq(cp, data.expect_1m);
        cp.addDuration(ICAL.icalduration.fromString("-PT1M"));
        do_check_eq(cp.toString(), dt.toString());

        cp.addDuration(ICAL.icalduration.fromString("PT1H"));
        do_check_eq(cp, data.expect_1h);
        cp.addDuration(ICAL.icalduration.fromString("-PT1H"));
        do_check_eq(cp.toString(), dt.toString());

        cp.addDuration(ICAL.icalduration.fromString("P1D"));
        do_check_eq(cp, data.expect_1d);
        cp.addDuration(ICAL.icalduration.fromString("-P1D"));
        do_check_eq(cp.toString(), dt.toString());

        cp.addDuration(ICAL.icalduration.fromString("P1W"));
        do_check_eq(cp, data.expect_1w);
        cp.addDuration(ICAL.icalduration.fromString("-P1W"));
        do_check_eq(cp.toString(), dt.toString());
    }
};

function test_normalize() {

    var f = new ICAL.icaltime({
        second: 59,
        minute: 59,
        hour: 23,
        day: 31,
        month: 12,
        year: 2012
    });

    var test_data = [{
        str: "20121231T235959",
        add_seconds: 1,
        expect: "20130101T000000"
    }, {
        str: "20110101T000000",
        add_seconds: -1,
        expect: "20101231T235959"
    }];

    for(var datakey in test_data) {
        var data = test_data[datakey];
        var dt = ICAL.icaltime.fromString(data.str);
        var cur_seconds = dt.second;
        var add_seconds = data.add_seconds || 0;

        dt.auto_normalize = false;
        dt.second += add_seconds;
        do_check_eq(cur_seconds + add_seconds, dt.second);
        dt.second = cur_seconds;

        dt.auto_normalize = true;
        dt.second += add_seconds;
        do_check_eq(dt, data.expect);
    }
}

function test_date_properties() {
    var test_data = [{ /* A date where the year starts on sunday */
        str: "20120101T000000",
        isDate: false,
        year: 2012,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        leap_year: true,
        day_of_week: ICAL.icaltime.SUNDAY,
        day_of_year: 1,
        start_of_week: "20120101T000000",
        end_of_week: "20120107T000000",
        start_of_month: "20120101",
        end_of_month: "20120131",
        start_of_year: "20120101",
        end_of_year: "20121231",
        start_doy_week: 1,
        week_number: 1,
    }, { /* A date in week number 53 */
        str: "20090101T000000",
        isDate: false,
        year: 2009,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        leap_year: false,
        day_of_week: ICAL.icaltime.THURSDAY,
        day_of_year: 1,
        start_of_week: "20081228T000000",
        end_of_week: "20090103T000000",
        start_of_month: "20090101",
        end_of_month: "20090131",
        start_of_year: "20090101",
        end_of_year: "20091231",
        start_doy_week: -3,
        week_number: 53,
    }]

    for(var datakey in test_data) {
        var data = test_data[datakey];
        var dt = ICAL.icaltime.fromString(data.str);
        do_check_eq(data.isDate, dt.isDate);
        do_check_eq(data.year, dt.year);
        do_check_eq(data.month, dt.month);
        do_check_eq(data.day, dt.day);
        do_check_eq(data.hour, dt.hour);
        do_check_eq(data.minute, dt.minute);
        do_check_eq(data.second, dt.second);
        do_check_eq(data.leap_year, ICAL.icaltime.is_leap_year(dt.year));
        do_check_eq(data.day_of_week, dt.day_of_week());
        do_check_eq(data.day_of_year, dt.day_of_year());
        do_check_eq(data.start_of_week, dt.start_of_week());
        do_check_eq(data.end_of_week, dt.end_of_week());
        do_check_eq(data.start_of_month, dt.start_of_month());
        do_check_eq(data.end_of_month, dt.end_of_month().toString());
        do_check_eq(data.start_of_year, dt.start_of_year());
        do_check_eq(data.end_of_year, dt.end_of_year());
        do_check_eq(data.start_doy_week, dt.start_doy_week(ICAL.icaltime.SUNDAY));
        do_check_eq(data.week_number, dt.week_number(ICAL.icaltime.SUNDAY));
        // TODO nth_weekday

        dt = new ICAL.icaltime();
        dt.resetTo(data.year, data.month, data.day, data.hour, data.minute,
                   data.second, ICAL.icaltimezone.utc_timezone);
        do_check_eq(data.year, dt.year);
        do_check_eq(data.month, dt.month);
        do_check_eq(data.day, dt.day);
        do_check_eq(data.hour, dt.hour);
        do_check_eq(data.minute, dt.minute);
        do_check_eq(data.second, dt.second);
    }
}
