testSupport.requireICAL();

suite('parser', function () {
  var helpers;
  var parser;
  var serializer;

  suiteSetup(function() {
    helpers = ICAL.helpers;
    parser = ICAL.icalparser;
    serializer = ICAL.serializer;
  });

  test('fold', function() {
    // TODO: Add back unicode tests.
    var testcases = [{
      buffer: "TEST:foobar\r\n baz",
      unfolded: "TEST:foobarbaz"
    }];

    for(var tcasekey in testcases) {
      var tcase = testcases[tcasekey];
      if("unfolded" in tcase) {
        var state = helpers.initState(tcase.buffer, 0);
        assert.equal(helpers.unfoldline(state), tcase.unfolded);
      }
      if("folded" in tcase) {
        assert.equal(helpers.foldline(tcase.buffer), tcase.folded);
      }
    }
  });

  test('content line', function() {

    var testcases = [{ /* Test an XName */
      buffer: 'X-MOZ-TEST:value',
      expected: {
        name: 'X-MOZ-TEST',
        value: 'value'
      }
    }, { /* Test an IANA token */
      buffer: 'BEGIN:VEVENT',
      expected: {
        name: 'BEGIN',
        value: 'VEVENT'
      }
    }, { /* Test some parameters on a IANA token */
      buffer: 'ATTACH;FMTTYPE=text/html;X-TEST=bar:<html><foo/></html>',
      expected: {
        name: 'ATTACH',
        parameters: {
          'FMTTYPE': 'text/html',
          'X-TEST': 'bar',
        },
        value: '<html><foo/></html>'
      }
    }, {
      /* Test an XName without a vendorid with a multi-val
       * parameter and a quoted param */
      buffer: 'X-TEXT;MVAL=a,b,c;QUOT="d;e:f,g":value',
      expected: {
        name: 'X-TEXT',
        parameters: {
          'MVAL': ['a', 'b', 'c'],
          'QUOT': 'd;e:f,g'
        },
        value: 'value'
      }
    }, { /* A line without a value */
      buffer: 'X-TEST;something=other',
      fail: true
    }, { /* Invalid character in xname property name */
      buffer: 'X-SCHEIßE:value',
      fail: true
    }, { /* Invalid character in xname vendor id */
      buffer: 'X-MÖZ-TEXT:value',
      fail: true
    }, { /* Invalid character in iana token name */
      buffer: 'ÄTTENDEE:mailto:test@test.com',
      fail: true
    }, { /* Invalid character in quoted param value */
      buffer: 'X-TEXT;VALUE="\x01":value',
      fail: true
    }, { /* Invalid character in unquoted param */
      buffer: 'X-TEXT;VALUE=\x01',
      fail: true
    }];

    for(var tcasekey in testcases) {
      var tcase = testcases[tcasekey];
      var state = helpers.initState(tcase.buffer, 0);
      if('fail' in tcase && tcase.fail) {
        assert.throws(function() {
          var line = parser.lexContentLine(state);
        }, parser.Error, 'should fail whiel trying to parse: ' + JSON.stringify(state));
      } else {
        assert.deepEqual(
          parser.lexContentLine(state), tcase.expected
        );
      }
    }
  });

  suite('#validateValue', function() {
    var testcases = [{ /* Invalid value type through passed VALUE */
      data: {
        name: "X-FOO",
        parameters: {
          "VALUE": "BAR"
        },
        value: "baz"
      },
      fail: true
    }, { /* Invalid default INTEGER value by regex */
      data: {
        name: "PRIORITY",
        value: "high"
      },
      fail: true
    }, { /* Invalid default  DATE value by validator func */
      data: {
        name: "EXDATE",
        parameters: {
          "VALUE": "DATE"
        },
        value: "2O1PO9O8"
      },
      fail: true
    }, { /* Invalid default BOOLEAN value by fixed values */
      data: {
        name: "X-BOOL",
        parameters: {
          "VALUE": "BOOLEAN"
        },
        value: "FUZZY"
      },
      fail: true
    }, { /* Missing required paramter */
      data: {
        name: "ATTACH",
        parameters: {
          "VALUE": "BINARY"
        },
        value: "unencoded"
      },
      fail: true
    }, { /* Binary without b64 encoding */
      data: {
        name: 'X-BIN',
        parameters: {
          'VALUE': 'BINARY'
        },
        value: 'abcd',
      },
      fail: true
    }, { /* Binary with b64 value */
      data: {
        name: 'X-BIN',
        parameters: {
          'VALUE': 'BINARY',
          'ENCODING': 'BASE64'
        },
        value: 'abcd'
      }
    }, { /* Boolean true */
      data: {
        name: 'X-BIN',
        parameters: {
          'VALUE': 'BOOLEAN',
        },
        value: 'TRUE'
      }
    }, { /* DATE value */
      data: {
        name: 'X-D',
        parameters: {
          'VALUE': 'DATE',
        },
        value: '20100101'
      }
    }, { /* DATE-TIME */
      data: {
        name: 'X-DT',
        parameters: {
          'VALUE': 'DATE-TIME'
        },
        value: '20100101T020304'
      }
    }, { /* DURATION DAYS */
      data: {
        name: 'X-DUR',
        parameters: {
          'VALUE': 'DURATION'
        },
        value: "P3D"
      }
    }, { /* DURATION D/HMS */
      data: {
        name: 'X-DUR',
        parameters: {
          'VALUE': 'DURATION'
        },
        value: "P3DT1H2M3S"
      }
    }, { /* DURATION WEEKS */
      data: {
        name: 'X-DUR',
        parameters: {
          'VALUE': 'DURATION'
        },
        value: "P3W"
      }
    }, { /* PERIOD date/date */
      data: {
        name: 'X-PR',
        parameters: {
          'VALUE': 'PERIOD',
        },
        value: '20100101T020304/20100102T030405'
      }
    }, { /* PERIOD date/duration */
      data: {
        name: 'X-PR',
        parameters: {
          'VALUE': 'PERIOD',
        },
        value: '20100101T020304/P1W'
      }
    }, { /* RECUR */
      data: {
        name: 'X-RECUR',
        parameters: {
          'VALUE': 'RECUR',
        },
        value: 'FREQ=YEARLY;UNTIL=20100101T010101;COUNT=5;INTERVAL=2;BYSECOND=38;BYMINUTE=48;BYHOUR=23;BYDAY=+53SU;BYMONTHDAY=-31,20;BYYEARDAY=+230,-123;BYWEEKNO=+40,-20;BYMONTH=8;BYSETPOS=320;WKST=SU'
      }
    }, { /* TIME */
      data: {
        name: 'X-TIME',
        parameters: {
          'VALUE': 'TIME',
        },
        value: '235959'
      }
    }, { /* UTC-OFFSET */
      data: {
        name: 'X-UTC',
        parameters: {
          VALUE: 'UTC-OFFSET'
        },
        value: '-0100'
      }
    }];

    for (var tcasekey in testcases) {
      var tcase = testcases[tcasekey];

      // we need this extra function for scoping
      // purposes we could use let here but it would
      // break non-gecko runtimes...
      (function(tcase) {
        var type = '';

        if (tcase.fail) {
          type += 'expected fail: ';
        }

        type += '"' + JSON.stringify(tcase.data) + '"'

        test(type, function() {
          var input;
          if (tcase.fail) {
            assert.throws(function() {
              input = parser.detectValueType(tcase.data);
              ICAL.icalproperty.fromData(input);
            }, parser.Error);
          } else {
            input = parser.detectValueType(tcase.data);
            ICAL.icalproperty.fromData(input);
          }
        });

      }(tcase));
    }

  });

  test('parse content line', function() {
    var testcases = [{ /* Test an simple calendar */
      // XXX: Re-add unicode test
      buffer: ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'UID;SOMEPARAM=VAL:1234', 'END:VEVENT', 'END:VCALENDAR', ''].join("\n"),
      expected: {
        name: 'VCALENDAR',
        type: 'COMPONENT',
        value: [
          {
            name: 'VEVENT',
            type: 'COMPONENT',
            value: [
              {
                name: 'UID',
                parameters: {
                  'SOMEPARAM': { value: 'VAL', type: 'TEXT'  }
                },
                value: ['1234'],
                type: "TEXT"
              }
            ]
          }
        ]
      }
    }];

    for (var tcasekey in testcases) {
      var tcase = testcases[tcasekey];
      // toJSON calls parseContentLine
      var json = ICAL.parse(tcase.buffer);
      if ("expected" in tcase) {
        assert.deepEqual(json, tcase.expected);
      }
      // While we're here, also check the serializer
      assert.equal(serializer.serializeToIcal(json).trim(), tcase.buffer.trim());
    }
  });
});
