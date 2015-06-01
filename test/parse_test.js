suite('parserv2', function() {

  var subject;
  setup(function() {
    subject = ICAL.parse;
  });

  /**
   * Full parser tests fetch two resources
   * (one to parse, one is expected
   */
  suite('full parser tests', function() {
    var root = 'test/parser/';
    var list = [
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

      // vcard tests
      'vcard.vcf',
      'vcard_author.vcf',
      'vcard3.vcf'
    ];

    list.forEach(function(path) {
      suite(path.replace('_', ' '), function() {
        var input;
        var expected;

        // fetch ical
        setup(function(done) {
          testSupport.load(root + path, function(err, data) {
            if (err) {
              return done(new Error('failed to load ics'));
            }
            input = data;
            done();
          });
        });

        // fetch json
        setup(function(done) {
          testSupport.load(root + path.replace(/vcf|ics$/, 'json'), function(err, data) {
            if (err) {
              return done(new Error('failed to load .json'));
            }
            try {
              expected = JSON.parse(data.trim());
            } catch (e) {
              return done(
                new Error('expect json is invalid: \n\n' + data)
              );
            }
            done();
          });
        });

        function jsonEqual(actual, expected) {
          assert.deepEqual(
            actual,
            expected,
            'hint use: ' +
            'http://tlrobinson.net/projects/javascript-fun/jsondiff/\n\n' +
            '\nexpected:\n\n' +
              JSON.stringify(actual, null, 2) +
            '\n\n to equal:\n\n ' +
              JSON.stringify(expected, null, 2) + '\n\n'
          );
        }

        test('round-trip', function() {
          var parsed = subject(input);
          var ical = ICAL.stringify(parsed);

          // NOTE: this is not an absolute test that serialization
          //       works as our parser should be error tolerant and
          //       its remotely possible that we consistently produce
          //       ICAL that only we can parse.
          jsonEqual(
            subject(ical),
            expected
          );
        });

        test('compare', function() {
          var actual = subject(input);
          jsonEqual(actual, expected);
        });
      });
    });
  });

  suite('invalid ical', function() {

    test('invalid property', function() {
      var ical = 'BEGIN:VCALENDAR\n';
      // no param or value token
      ical += 'DTSTART\n';
      ical += 'DESCRIPTION:1\n';
      ical += 'END:VCALENDAR';

      assert.throws(function() {
        subject(ical);
      }, /invalid line/);
    });

    test('invalid quoted params', function() {
      var ical = 'BEGIN:VCALENDAR\n';
      ical += 'X-FOO;BAR="quoted\n';
      // an invalid newline inside quoted parameter
      ical += 'params";FOO=baz:realvalue\n';
      ical += 'END:VCALENDAR';

      assert.throws(function() {
        subject(ical);
      }, /invalid line/);
    });

    test('missing value with param delimiter', function() {
      var ical = 'BEGIN:VCALENDAR\n' +
                 'X-FOO;\n';
      assert.throws(function() {
        subject(ical);
      }, "Invalid parameters in");
    });

    test('missing param name ', function() {
      var ical = 'BEGIN:VCALENDAR\n' +
                 'X-FOO;=\n';
      assert.throws(function() {
        subject(ical);
      }, "Empty parameter name in");
    });

    test('missing param value', function() {
      var ical = 'BEGIN:VCALENDAR\n' +
                 'X-FOO;BAR=\n';
      assert.throws(function() {
        subject(ical);
      }, "Missing parameter value in");
    });

    test('missing component end', function() {
      var ical = 'BEGIN:VCALENDAR\n';
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
      var input = ';FOO=x\\na';
      var expected = {
        'foo': 'x\na'
      };

      assert.deepEqual(
        subject._parseParameters(input, 0, ICAL.design.defaultSet)[0],
        expected
      );
    });
  });

  test('#_parseMultiValue', function() {
    var values = 'woot\\, category,foo,bar,baz';
    var result = [];
    assert.deepEqual(
      subject._parseMultiValue(values, ',', 'text', result, null, ICAL.design.defaultSet),
      ['woot, category', 'foo', 'bar', 'baz']
    );
  });

  suite('#_parseValue', function() {
    test('text', function() {
      var value = 'start \\n next';
      var expected = 'start \n next';

      assert.equal(
        subject._parseValue(value, 'text', ICAL.design.defaultSet),
        expected
      );
    });
  });

  suite('#_eachLine', function() {

    function unfold(input) {
      var result = [];

      subject._eachLine(input, function(err, line) {
        result.push(line);
      });

      return result;
    }

    test('unfold single with \\r\\n', function() {
      var input = 'foo\r\n bar';
      var expected = ['foobar'];

      assert.deepEqual(unfold(input), expected);
    });

    test('with \\n', function() {
      var input = 'foo\nbar\n  baz';
      var expected = [
        'foo',
        'bar baz'
      ];

      assert.deepEqual(unfold(input), expected);
    });
  });
});
