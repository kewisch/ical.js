suite('ICAL.stringify', function() {

  suite('round trip tests', function() {
    var root = 'samples/';
    var list = [
      'minimal',
      'blank_line_end',
      'forced_types',
      'parserv2',
      'utc_negative_zero'
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

  suite('stringify property', function() {
    test('no explicit default set', function() {
      var subject = new ICAL.Property('tz', new ICAL.Component('vcard'));
      subject.setValue(ICAL.UtcOffset.fromString('+0500'));

      var ical = ICAL.stringify.property(subject.toJSON());
      assert.equal(ical, 'TZ;VALUE=UTC-OFFSET:+0500');
    });
    test('custom property with no default type', function() {
      ICAL.design.defaultSet.property.custom = {};
      var subject = new ICAL.Property('custom');
      subject.setValue('unescaped, right?');
      assert.equal(subject.toICALString(), 'CUSTOM:unescaped, right?')

      subject.resetType('integer');
      subject.setValue(123);
      assert.equal(subject.toICALString(), 'CUSTOM;VALUE=INTEGER:123');

      delete ICAL.design.defaultSet.property.custom;
    });

    test('custom property not using default type', function() {
      ICAL.design.defaultSet.property.custom = { defaultType: 'text' };
      var subject = new ICAL.Property('custom');
      subject.resetType('integer');
      subject.setValue(123);
      assert.equal(subject.toICALString(), 'CUSTOM;VALUE=INTEGER:123');
      delete ICAL.design.defaultSet.property.custom;
    });

    test('rfc6868 roundtrip', function() {
      var subject = new ICAL.Property('attendee');
      var input = "caret ^ dquote \" newline \n end";
      var expected = 'ATTENDEE;CN=caret ^^ dquote ^\' newline ^n end:mailto:id';
      subject.setParameter('cn', input);
      subject.setValue('mailto:id');
      assert.equal(subject.toICALString(), expected);
      assert.equal(ICAL.parse.property(expected)[1].cn, input);
    });

    test('folding', function() {
      var oldLength = ICAL.foldLength;
      var subject = new ICAL.Property("description");
      var N = ICAL.newLineChar + " ";
      subject.setValue('foobar');

      ICAL.foldLength = 19;
      assert.equal(subject.toICALString(), "DESCRIPTION:foobar");
      assert.equal(ICAL.stringify.property(subject.toJSON(), ICAL.design.icalendar, false), "DESCRIPTION:foobar");
      assert.equal(ICAL.stringify.property(subject.toJSON(), ICAL.design.icalendar, true), "DESCRIPTION:foobar");

      ICAL.foldLength = 15;
      assert.equal(subject.toICALString(), "DESCRIPTION:foobar");
      assert.equal(ICAL.stringify.property(subject.toJSON(), ICAL.design.icalendar, false), "DESCRIPTION:foo" + N + "bar");
      assert.equal(ICAL.stringify.property(subject.toJSON(), ICAL.design.icalendar, true), "DESCRIPTION:foobar");

      ICAL.foldLength = oldLength;
    });
  });

  suite('stringify component', function() {
    test('minimal jcal', function() {
      var subject = ["vcalendar", [["version", {}, "text", "2.0"]], [["vevent", [], []]]];
      var expected = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nEND:VEVENT\r\nEND:VCALENDAR";

      assert.equal(ICAL.stringify.component(subject), expected);
    });

    test('minimal jcard', function() {
      // related to issue #266
      var subject = ["vcard", [["version", {}, "text", "4.0"]]];
      var expected = "BEGIN:VCARD\r\nVERSION:4.0\r\nEND:VCARD";

      assert.equal(ICAL.stringify.component(subject), expected);
    });

    test('minimal jcard with empty subcomponent', function() {
      var subject = ["vcard", [["version", {}, "text", "4.0"]], []];
      var expected = "BEGIN:VCARD\r\nVERSION:4.0\r\nEND:VCARD";

      assert.equal(ICAL.stringify.component(subject), expected);
    });
  });
});
