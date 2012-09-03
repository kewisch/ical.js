/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

function run_test() {
    test_clone();
    //test_roundtrip();
    test_components();
}

function test_roundtrip() {
    var until = ICAL.icaltime.epoch_time.clone();
    var a = new ICAL.icalrecur({
        interval: 2,
        wkst: 3,
        until: until,
        count: 5,
        freq: "YEARLY",
    });

    var iprop = a.toIcalProperty();
    do_check_eq(a.toString(), iprop.getStringValue());
    var b = ICAL.icalrecur.fromIcalProperty(iprop);
    do_check_eq(a.toString(), b.toString());

    var str = a.toString();
    b = icalrecur.fromString(str);
    do_check_eq(str, b.toString());
}

function test_components() {
    var until = ICAL.icaltime.epoch_time.clone();
    var a = new ICAL.icalrecur({
        interval: 2,
        wkst: 3,
        until: until,
        count: 5,
        freq: "YEARLY",
        BYDAY: ["-1SU"]
    });

    do_check_array_eq(a.getComponent("BYDAY"), ["-1SU"]);
    do_check_array_eq(a.getComponent("BYWTF"), []);

    a.addComponent("BYDAY", "+2MO");
    do_check_array_eq(a.getComponent("BYDAY"), ["-1SU", "+2MO"]);
    do_check_array_eq(a.getComponent("BYWTF"), []);

    a.setComponent("BYDAY", ["WE", "TH"]);
    do_check_array_eq(a.getComponent("BYDAY"), ["WE", "TH"]);

    a.addComponent("BYMONTHDAY", "31");
    do_check_array_eq(a.getComponent("BYMONTHDAY"), ["31"]);

    var count = {};
    a.getComponent("BYDAY", count);
    do_check_eq(count.value, 2);
}

function test_clone() {
    var until = ICAL.icaltime.epoch_time.clone();
    var a = new ICAL.icalrecur({
        interval: 2,
        wkst: 3,
        until: until,
        count: 5,
        freq: "YEARLY",
    });

    var b = a.clone();

    do_check_eq(a.interval, b.interval);
    do_check_eq(a.wkst, b.wkst);
    do_check_eq(a.until.compare(b.until), 0)
    do_check_eq(a.count, b.count);
    do_check_eq(a.freq, b.freq);

    b.interval++; b.wkst++; b.until.day++; b.count++; b.freq = "WEEKLY";

    do_check_neq(a.interval, b.interval);
    do_check_neq(a.wkst, b.wkst);
    do_check_neq(a.until.compare(b.until), 0)
    do_check_neq(a.count, b.count);
    do_check_neq(a.freq, b.freq);
}
