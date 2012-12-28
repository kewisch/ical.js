suite('ICAL.stringify', function() {

  suite('round trip tests', function() {
    var root = 'samples/';
    var list = [
      'minimal',
      'blank_line_end',
      'forced_types',
      'parserv2',
      'utc_negative_zero',
      'forced_types'
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
          var parsed = ICAL.parse(input);
          var ical = ICAL.stringify(parsed);

          // NOTE: this is not an absolute test that serialization
          //       works as our parser should be error tolerant and
          //       its remotely possible that we consistently produce
          //       ICAL that only we can parse.
          jsonEqual(
            ICAL.parse(ical),
            parsed
          );
        });

      });
    });
  });
});
