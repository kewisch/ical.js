suite('parserv2', function() {

  let subject;
  setup(function() {
    subject = ICAL.parse;
  });

  /**
   * Full parser tests fetch two resources
   * (one to parse, one is expected
   */
  suite('full parser tests', function() {
    let root = 'test/parser/';
    let list = [
      // icalendar tests
      'rfc.ics',
      'single_empty_vcalendar.ics',
      'property_params.ics',
      'newline_junk.ics',
      'unfold_properties.ics',
      'quoted_params.ics',
      'multivalue.ics',
      'values.ics',
      'recur.ics',
      'base64.ics',
      'dates.ics',
      'time.ics',
      'boolean.ics',
      'float.ics',
      'integer.ics',
      'period.ics',
      'utc_offset.ics',
      'component.ics',
      'tzid_with_gmt.ics',
      'multiple_root_components.ics',
      'grouped.ics',

      // vcard tests
      'vcard.vcf',
      'vcard_author.vcf',
      'vcard3.vcf',
      'vcard_grouped.vcf',
      'escape_semicolon.vcf'
    ];

    list.forEach(function(path) {
      suite(path.replace('_', ' '), function() {
        let input;
        let expected;

        // fetch ical
        setup(async function() {
          input = await testSupport.load(root + path);
        });

        // fetch json
        setup(async function() {
          let data = await testSupport.load(root + path.replace(/vcf|ics$/, 'json'));
          try {
            expected = JSON.parse(data.trim());
          } catch {
            throw new Error('expect json is invalid: \n\n' + data);
          }
        });

        function jsonEqual(jsonActual, jsonExpected) {
          assert.deepEqual(
            jsonActual,
            jsonExpected,
            'hint use: ' +
            'http://tlrobinson.net/projects/javascript-fun/jsondiff/\n\n' +
            '\nexpected:\n\n' +
              JSON.stringify(jsonActual, null, 2) +
            '\n\n to equal:\n\n ' +
              JSON.stringify(jsonExpected, null, 2) + '\n\n'
          );
        }

        test('round-trip', function() {
          let parsed = subject(input);
          let ical = ICAL.stringify(parsed);

          // NOTE: this is not an absolute test that serialization
          //       works as our parser should be error tolerant and
          //       it is remotely possible that we consistently produce
          //       ICAL that only we can parse.
          jsonEqual(
            subject(ical),
            expected
          );
        });

        test('compare', function() {
          let actual = subject(input);
          jsonEqual(actual, expected);
        });
      });
    });
  });

  suite('invalid ical', function() {

    test('invalid property', function() {
      let ical = 'BEGIN:VCALENDAR\n';
      // no param or value token
      ical += 'DTSTART\n';
      ical += 'DESCRIPTION:1\n';
      ical += 'END:VCALENDAR';

      assert.throws(function() {
        subject(ical);
      }, /invalid line/);
    });

    test('invalid quoted params', function() {
      let ical = 'BEGIN:VCALENDAR\n';
      ical += 'X-FOO;BAR="quoted\n';
      // an invalid newline inside quoted parameter
      ical += 'params";FOO=baz:realvalue\n';
      ical += 'END:VCALENDAR';

      assert.throws(function() {
        subject(ical);
      }, /invalid line/);
    });

    test('missing value with param delimiter', function() {
      let ical = 'BEGIN:VCALENDAR\n' +
                 'X-FOO;\n';
      assert.throws(function() {
        subject(ical);
      }, "Invalid parameters in");
    });

    test('missing param name ', function() {
      let ical = 'BEGIN:VCALENDAR\n' +
                 'X-FOO;=\n';
      assert.throws(function() {
        subject(ical);
      }, "Empty parameter name in");
    });

    test('missing param value', function() {
      let ical = 'BEGIN:VCALENDAR\n' +
                 'X-FOO;BAR=\n';
      assert.throws(function() {
        subject(ical);
      }, "Missing parameter value in");
    });

    test('missing component end', function() {
      let ical = 'BEGIN:VCALENDAR\n';
      ical += 'BEGIN:VEVENT\n';
      ical += 'BEGIN:VALARM\n';
      ical += 'DESCRIPTION: foo\n';
      ical += 'END:VALARM';
      // ended calendar before event
      ical += 'END:VCALENDAR';

      assert.throws(function() {
        subject(ical);
      }, /invalid/);
    });

  });

  suite('#_parseParameters', function() {
    test('with processed text', function() {
      let input = ';FOO=x\\na';
      let expected = {
        'foo': 'x\na'
      };

      assert.deepEqual(
        subject._parseParameters(input, 0, ICAL.design.defaultSet)[0],
        expected
      );
    });

    test('with multiple vCard TYPE parameters', function() {
      let input = ';TYPE=work;TYPE=voice';
      let expected = {
        'type': ['work', 'voice']
      };

      assert.deepEqual(
        subject._parseParameters(input, 0, ICAL.design.components.vcard)[0],
        expected
      );
    });

    test('with multiple iCalendar MEMBER parameters', function() {
      let input = ';MEMBER="urn:one","urn:two";MEMBER="urn:three"';
      let expected = {
        'member': ['urn:one', 'urn:two', 'urn:three']
      };

      assert.deepEqual(
        subject._parseParameters(input, 0, ICAL.design.components.vevent)[0],
        expected
      );
    });

    test('with comma in singleValue parameter', function() {
      let input = ';LABEL="A, B"';
      let expected = {
        'label': 'A, B'
      };

      assert.deepEqual(
        subject._parseParameters(input, 0, ICAL.design.components.vcard)[0],
        expected
      );
    });

    test('with comma in singleValue parameter after multiValue parameter', function() {
      // TYPE allows multiple values, whereas LABEL doesn't.
      let input = ';TYPE=home;LABEL="A, B"';
      let expected = {
        'type': 'home',
        'label': 'A, B'
      };

      assert.deepEqual(
        subject._parseParameters(input, 0, ICAL.design.components.vcard)[0],
        expected
      );
    });

    test('with quoted value', function() {
      let input = ';FMTTYPE="text/html":Here is HTML with signs like =;';
      let expected = {
        'fmttype': 'text/html'
      };

      assert.deepEqual(
        subject._parseParameters(input, 0, ICAL.design.components.vevent)[0],
        expected
      );
    });
  });

  test('#_parseMultiValue', function() {
    let values = 'woot\\, category,foo,bar,baz';
    let result = [];
    assert.deepEqual(
      subject._parseMultiValue(values, ',', 'text', result, null, ICAL.design.defaultSet),
      ['woot, category', 'foo', 'bar', 'baz']
    );
  });

  suite('#_parseValue', function() {
    test('text', function() {
      let value = 'start \\n next';
      let expected = 'start \n next';

      assert.equal(
        subject._parseValue(value, 'text', ICAL.design.defaultSet),
        expected
      );
    });
  });

  suite('#_eachLine', function() {

    function unfold(input) {
      let result = [];

      subject._eachLine(input, function(err, line) {
        result.push(line);
      });

      return result;
    }

    test('unfold single with \\r\\n', function() {
      let input = 'foo\r\n bar';
      let expected = ['foobar'];

      assert.deepEqual(unfold(input), expected);
    });

    test('with \\n', function() {
      let input = 'foo\nbar\n  baz';
      let expected = [
        'foo',
        'bar baz'
      ];

      assert.deepEqual(unfold(input), expected);
    });
  });

  suite('embedded timezones', function() {
    let icsDataEmbeddedTimezones;
    suiteSetup(async function() {
      icsDataEmbeddedTimezones = await testSupport.loadSample('timezone_from_file.ics');
    });

    test('used in event date', function() {
      const parsed = ICAL.parse(icsDataEmbeddedTimezones);
      const component = new ICAL.Component(parsed);

      const event = new ICAL.Event(component.getFirstSubcomponent('vevent'));
      const startDate = event.startDate.toJSDate();
      const endDate = event.endDate.toJSDate();

      assert.equal(startDate.getUTCDate(), 6);
      assert.equal(startDate.getUTCHours(), 21);
      assert.equal(startDate.getUTCMinutes(), 23);

      assert.equal(endDate.getUTCDate(), 6);
      assert.equal(endDate.getUTCHours(), 22);
      assert.equal(endDate.getUTCMinutes(), 23);
    });
  });
});
