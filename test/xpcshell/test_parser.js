/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2012 */

"use strict";

function test_fold() {
    var testcases = [{ buffer: "TEST:foo\r\n bar\r\n baz",
                       unfolded: "TEST:foobarbaz" },
                     { buffer: "TEST:abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
                       folded: "TEST:abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqr\r\n stuvwxyz"}];

    for (var tcasekey in testcases) {
        var tcase = testcases[tcasekey];
        if ("unfolded" in tcase) {
            var state = helpers.initState(tcase.buffer, 0);
            do_check_eq(helpers.unfoldline(state), tcase.unfolded);
        }
        if ("folded" in tcase) {
            do_check_eq(helpers.foldline(tcase.buffer), tcase.folded);
        }
    }
}

function test_contentLine() {
    var testcases = [
        { /* Test an XName */
          buffer: 'X-MOZ-TEST:value',
          expected: {
            name: 'X-MOZ-TEST',
            value: 'value'
          }
        },
        { /* Test an IANA token */
          buffer: 'BEGIN:VEVENT',
          expected: {
           name: 'BEGIN',
           value: 'VEVENT'
          }
        },
        { /* Test some parameters on a IANA token */
          buffer: 'ATTACH;FMTTYPE=text/html;X-TEST=bar:<html><foo/></html>',
          expected: {
            name: 'ATTACH',
            parameters: {
              'FMTTYPE': 'text/html',
              'X-TEST': 'bar',
            },
            value: '<html><foo/></html>'
          }
        },
        { /* Test an XName without a vendorid with a multi-val
           * parameter and a quoted param */
          buffer: 'X-TEXT;MVAL=a,b,c;QUOT="d;e:f,g":value',
          expected: {
            name: 'X-TEXT',
            parameters: {
              'MVAL': ['a','b','c'],
              'QUOT': 'd;e:f,g'
            },
            value: 'value'
          }
        },
        { /* A line with junk at the end */
          buffer: 'X-TEXT:test\x01',
          fail: true
        },
        { /* A line without a value */
          buffer: 'X-TEST;something=other',
          fail: true
        },
        { /* Invalid character in xname property name */
          buffer: 'X-SCHEIßE:value',
          fail: true
        },
        { /* Invalid character in xname vendor id */
          buffer: 'X-MÖZ-TEXT:value',
          fail: true
        },
        { /* Invalid character in iana token name */
          buffer: 'ÄTTENDEE:mailto:test@test.com',
          fail: true
        },
        { /* Invalid character in quoted param value */
          buffer: 'X-TEXT;VALUE="\x01":value',
          fail: true
        },
        { /* Invalid character in unquoted param */
          buffer: 'X-TEXT;VALUE=\x01',
          fail: true
        }
    ];

    for(var tcasekey in testcases) {
        var tcase = testcases[tcasekey];
        var state = helpers.initState(tcase.buffer, 0);
        if ('fail' in tcase && tcase.fail) {
            try {
                var line = parser.lexContentLine(state);
                do_throw("FAIL: Expected Failure, got: " + line.toSource() + "\n");
            } catch (e) {
                //dump("PASS: Expected Failure (" + tcase.buffer + ") Message: " + e + "\n");
            }
        } else {
            do_check_eq(parser.lexContentLine(state).toSource(),
                        tcase.expected.toSource());
        }
    }
}

function test_parseCheckValue() {
    var testcases = [
        { /* Invalid value type through passed VALUE */
          data: {
            name: "X-FOO",
            parameters: {
              "VALUE": "BAR"
            },
            value: "baz"
          },
          fail: true
        },
        { /* Invalid default INTEGER value by regex */
          data: {
            name: "PRIORITY",
            value: "high"
          },
          fail: true
        },
        { /* Invalid default  DATE value by validator func */
          data: {
            name: "EXDATE",
            parameters: { "VALUE" : "DATE" },
            value: "2O1PO9O8"
          },
          fail: true
        },
        { /* Invalid default BOOLEAN value by fixed values */
          data: {
            name: "X-BOOL",
            parameters: { "VALUE": "BOOLEAN" },
            value: "FUZZY"
          },
          fail: true
        },
        { /* Missing required paramter */
          data: {
            name: "ATTACH",
            parameters: { "VALUE": "BINARY" },
            value: "unencoded"
          },
          fail: true
        },
        { /* Binary without b64 encoding */
          data: {
            name: 'X-BIN',
            parameters: {
              'VALUE': 'BINARY'
            },
            value: 'abcd',
          },
          fail: true
        },
        { /* Binary with b64 value */
          data: {
            name: 'X-BIN',
            parameters: {
              'VALUE': 'BINARY',
              'ENCODING': 'BASE64'
            },
            value: 'abcd'
          }
        },
        { /* Boolean true */
          data: {
            name: 'X-BIN',
            parameters: {
              'VALUE': 'BOOLEAN',
            },
            value: 'TRUE'
          }
        },
        { /* DATE value */
          data: {
            name: 'X-D',
            parameters: {
              'VALUE': 'DATE',
            },
            value: '20100101'
          }
        },
        { /* DATE-TIME */
          data: {
            name: 'X-DT',
            parameters: {
              'VALUE': 'DATE-TIME'
            },
            value: '20100101T020304'
          }
        },
        { /* DURATION DAYS */
          data: {
            name: 'X-DUR',
            parameters: {
              'VALUE': 'DURATION'
            },
            value: "P3D"
          }
        },
        { /* DURATION D/HMS */
          data: {
            name: 'X-DUR',
            parameters: {
              'VALUE': 'DURATION'
            },
            value: "P3DT1H2M3S"
          }
        },
        { /* DURATION WEEKS */
          data: {
            name: 'X-DUR',
            parameters: {
              'VALUE': 'DURATION'
            },
            value: "P3W"
          }
        },
        { /* PERIOD date/date */
          data: {
            name: 'X-PR',
            parameters: {
              'VALUE': 'PERIOD',
            },
            value: '20100101T020304/20100102T030405'
          }
        },
        { /* PERIOD date/duration */
          data: {
            name: 'X-PR',
            parameters: {
              'VALUE': 'PERIOD',
            },
            value: '20100101T020304/P1W'
          }
        },
        { /* RECUR */
          data: {
            name: 'X-RECUR',
            parameters: {
              'VALUE': 'RECUR',
            },
            value:
            'FREQ=YEARLY;UNTIL=20100101T010101;COUNT=5;INTERVAL=2;BYSECOND=38;BYMINUTE=48;BYHOUR=23;BYDAY=+53SU;BYMONTHDAY=-31,20;BYYEARDAY=+230,-123;BYWEEKNO=+40,-20;BYMONTH=8;BYSETPOS=320;WKST=SU'
          }
        },
        { /* TIME */
          data: {
            name: 'X-TIME',
            parameters: {
              'VALUE': 'TIME',
            },
            value: '235959'
          }
        },
        { /* UTC-OFFSET */
          data: {
            name: 'X-UTC',
            parameters: {
              VALUE: 'UTC-OFFSET'
            },
            value: '-0100'
          }
        },
        { /* UTC-OFFSET failing type -0000 */
          data: {
            name: 'X-UTC',
            parameters: {
              VALUE: 'UTC-OFFSET'
            },
            value: '-0000'
          },
          fail: true
        }
    ];

    for(var tcasekey in testcases) {
        var tcase = testcases[tcasekey];
        try {
            parser.parseCheckValue(tcase.data);
            if ('fail' in tcase && tcase.fail) {
                dump("FAIL: Expected Failure, but succeeded: " + tcase.data.toSource() + "\n");
            } else {
                //dump("PASS: " + tcase.data.toSource() + "\n");
            }
        } catch (e) {
            if (e instanceof ParserError) {
                if ('fail' in tcase && tcase.fail) {
                    //dump("PASS: Expected Failure. Message: " + e + "\n");
                } else {
                    dump("FAIL: Expected Success, but failed: " + tcase.data.toSource() + "\n");
                    dump("Message: " + e + "\n");
                }
            } else {
                dump("FAIL: Other Exception thrown: " + e + "(" + (typeof e) + ")\n");
            }
        }
    }
}

function test_parseContentLine() {
    var testcases = [
        { /* Test an simple calendar */
          buffer: ['BEGIN:VCALENDAR',
                   'BEGIN:VEVENT',
                   'UID;SOMEPARAM=VAL:1234',
                   'END:VEVENT',
                   'END:VCALENDAR',''].join("\r\n"),
          expected: {
            components: {
              VCALENDAR: [
                {
                  components: {
                    VEVENT: [
                      {
                        properties: {
                          'UID': {
                            parameters: {
                              'SOMEPARAM': {
                                value: 'VAL',
                                type: 'TEXT'
                              }
                            },
                            value: '1234',
                            type: 'TEXT'
                          }
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        },
    ];

    for(var tcasekey in testcases) {
        var tcase = testcases[tcasekey];
        // toJSON calls parseContentLine
        var json = ICAL.toJSON(tcase.buffer);
        if ("expected" in tcase) {
            do_check_eq(json.toSource(), tcase.expected.toSource());
        }

        // While we're here, also check the serializer
        do_check_eq(serializer.serializeToIcal(json), tcase.buffer);
    }
}

function run_test() {
    test_fold();
    test_contentLine();
    test_parseCheckValue();
    test_parseContentLine();
}
