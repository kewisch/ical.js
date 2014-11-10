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
      "rfc",
      'single_empty_vcalendar',
      'property_params',
      'newline_junk',
      'unfold_properties',
      'quoted_params',
      'multivalue',
      'recur',
      'base64',
      'dates',
      'time',
      'boolean',
      'float',
      'integer',
      'period',
      'utc_offset',
      'component',
      'tzid_with_gmt',
      'multiple_root_components',
      'rfc6868'
    ];

    list.forEach(function(path) {
      suite(path.replace('_', ' '), function() {
        var input;
        var expected;

        // fetch ical
        setup(function(done) {
          testSupport.load(root + path + '.ics', function(err, data) {
            if (err) {
              return done(new Error('failed to load ics'));
            }
            input = data;
            done();
          });
        });

        // fetch json
        setup(function(done) {
          testSupport.load(root + path + '.json', function(err, data) {
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
        subject._parseParameters(input, 0)[0],
        expected
      );
    });
  });

  test('#_parseMultiValue', function() {
    var values = 'woot\\, category,foo,bar,baz';
    var result = [];
    assert.deepEqual(
      subject._parseMultiValue(values, ',', 'text', result),
      ['woot, category', 'foo', 'bar', 'baz']
    );
  });

  suite('#_parseValue', function() {
    test('text', function() {
      var value = 'start \\n next';
      var expected = 'start \n next';

      assert.equal(
        subject._parseValue(value, 'text'),
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
