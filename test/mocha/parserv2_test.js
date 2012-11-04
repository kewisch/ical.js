suite('parserv2', function() {

  var icsData;
  testSupport.defineSample('parserv2.ics', function(data) {
    icsData = data;
  });

  var subject;
  setup(function() {
    subject = ICAL.parsev2;
  });

  /**
   * Full parser tests fetch two resources
   * (one to parse, one is expected
   */
  suite('full parser tests', function() {
    var root = 'test/mocha/parser/';
    var list = [
      'single_empty_vcalendar',
      'property_params_no_value',
      'newline_junk',
      'unfold_properties',
      'quoted_params',
      'base64',
      'dates',
      'time',
      'boolean',
      'float',
      'integer',
      'component'
    ];

    list.forEach(function(path) {
      suite(path.replace('_', ' '), function() {
        var input;
        var expected;

        // fetch ical
        setup(function(done) {
          testSupport.load(root + path + '.ics', function(err, data) {
            if (err) {
              return done(err);
            }
            input = data;
            done();
          });
        });

        // fetch json
        setup(function(done) {
          testSupport.load(root + path + '.json', function(err, data) {
            if (err) {
              return done(err);
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

        test('compare', function() {
          var actual = subject(input);

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
        });
      });
    });
  });

  test('#parser', function() {
    var tree = subject(icsData);
    console.log(JSON.stringify(tree));
  });

  suite('#_parseParameters', function() {
    test('with processed text', function() {
      var input = ';FOO=x\\na';
      var expected = {
        'foo': 'x\na'
      };

      assert.deepEqual(
        subject._parseParameters(input, 0),
        expected
      );
    });
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

  suite('#eachLine', function() {

    function unfold(input) {
      var result = [];

      subject.eachLine(input, function(err, line) {
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
