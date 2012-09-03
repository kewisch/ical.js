/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

function run_test() {
    var dtStartStr   =  'DTSTART:20110101T121314';
    var alarmCompStr = ['BEGIN:VALARM',
                        'END:VALARM'].join("\r\n");
    var eventStr     = ['BEGIN:VEVENT',
                        dtStartStr,
                        alarmCompStr,
                        'END:VEVENT'].join("\r\n");
    dump("AA " + eventStr + "\n");
    var event = ICAL.icalcomponent.fromString(eventStr);
    dump("AA\n");
    var event2 = event.clone();
    var rawEvent = ICAL.toJSON(eventStr, false);

    do_check_eq(event.toString(), event2.toString());

    do_check_eq(event.toString(), eventStr);
    // TODO do_check_eq(event.undecorate().toSource(), rawEvent.toSource());

    dump("AA\n");

    var alarmComp = event.getFirstSubcomponent("VALARM");
    do_check_eq(alarmComp.toString(), alarmCompStr);

    var alarmComp2 = event.getAllSubcomponents("VALARM");
    do_check_eq(alarmComp2.length, 1);
    do_check_eq(alarmComp2[0].toString(), alarmCompStr);

    do_check_true(event.hasProperty("DTSTART"));
    var dtstart = event.getFirstProperty("DTSTART");
    do_check_eq(event.getFirstProperty("DTEND"), null);

    var allDtProps = event.getAllProperties("DTSTART");
    do_check_eq(allDtProps.length, 1);
    do_check_eq(allDtProps[0].toString(), dtStartStr);

    event.removeSubcomponent("VALARM");
    do_check_eq(event.getFirstSubcomponent("VALARM"), null);
    do_check_neq(event.toString(), event2.toString());
    dump("BB\n");

    do_check_false(event.hasProperty("X-FOO"));
    event.addPropertyWithValue("X-FOO", "BAR");
    dump(event.toSource());
    do_check_true(event.hasProperty("X-FOO"));

    var xprop = event.getFirstProperty("X-FOO");
    do_check_eq(xprop.getStringValue(), "BAR");

    event.removeProperty("X-FOO");
    do_check_false(event.hasProperty("X-FOO"));
    var xprop2 = ICAL.icalproperty.fromData({
        name: "X-BAR",
        value: "BAZ"
    });
    event.addProperty(xprop2);
    do_check_true(event.hasProperty("X-BAR"));
    do_check_eq(event.getFirstProperty("X-BAR"), xprop2);
    do_check_eq(xprop2.parent, event);

    do_check_neq(event.toString(), event2.toString());

    event.clearAllProperties();
    do_check_eq(event.getFirstProperty(), null);
    do_check_eq(event.getAllProperties().length, 0);
    do_check_false(event.hasProperty("X-BAR"));
    dump("CC\n");

    // TODO getFirstPropertyValue ?

    do_check_neq(event.toString(), event2.toString());
    dump("DD\n");
}
