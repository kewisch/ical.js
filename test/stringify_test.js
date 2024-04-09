suite('ICAL.stringify', function() {

  suite('round trip tests', function() {
    let root = 'samples/';
    let list = [
      'minimal',
      'blank_line_end',
      'forced_types',
      'parserv2',
      'utc_negative_zero'
    ];

    list.forEach(function(path) {
      suite(path.replace('_', ' '), function() {
        let input;

        // fetch ical
        setup(async function() {
          input = await testSupport.load(root + path + '.ics');
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
          let parsed = ICAL.parse(input);
          let ical = ICAL.stringify(parsed);

          // NOTE: this is not an absolute test that serialization
          //       works as our parser should be error tolerant and
          //       it is remotely possible that we consistently produce
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
      let subject = new ICAL.Property('tz', new ICAL.Component('vcard'));
      subject.setValue(ICAL.UtcOffset.fromString('+0500'));

      let ical = ICAL.stringify.property(subject.toJSON());
      assert.equal(ical, 'TZ;VALUE=UTC-OFFSET:+0500');
    });
    test('custom property with no default type', function() {
      ICAL.design.defaultSet.property.custom = {};
      let subject = new ICAL.Property('custom');
      subject.setValue('unescaped, right?');
      assert.equal(subject.toICALString(), 'CUSTOM:unescaped, right?');

      subject.resetType('integer');
      subject.setValue(123);
      assert.equal(subject.toICALString(), 'CUSTOM;VALUE=INTEGER:123');

      delete ICAL.design.defaultSet.property.custom;
    });

    test('custom property not using default type', function() {
      ICAL.design.defaultSet.property.custom = { defaultType: 'text' };
      let subject = new ICAL.Property('custom');
      subject.resetType('integer');
      subject.setValue(123);
      assert.equal(subject.toICALString(), 'CUSTOM;VALUE=INTEGER:123');
      delete ICAL.design.defaultSet.property.custom;
    });

    test('property with multiple parameter values', function() {
      ICAL.design.defaultSet.property.custom = { defaultType: 'text' };
      ICAL.design.defaultSet.param.type = { multiValue: ',' };
      let subject = new ICAL.Property('custom');
      subject.setParameter('type', ['ABC', 'XYZ']);
      subject.setValue('some value');
      assert.equal(subject.toICALString(), 'CUSTOM;TYPE=ABC,XYZ:some value');
      delete ICAL.design.defaultSet.property.custom;
      delete ICAL.design.defaultSet.param.type;
    });

    test('property with multiple parameter values which must be escaped', function() {
      ICAL.design.defaultSet.property.custom = { defaultType: 'text' };
      ICAL.design.defaultSet.param.type = { multiValue: ',' };
      let subject = new ICAL.Property('custom');
      subject.setParameter('type', ['ABC', '--"XYZ"--']);
      subject.setValue('some value');
      assert.equal(subject.toICALString(), "CUSTOM;TYPE=ABC,--^'XYZ^'--:some value");
      delete ICAL.design.defaultSet.property.custom;
      delete ICAL.design.defaultSet.param.type;
    });

    test('property with multiple parameter values with enabled quoting', function() {
      ICAL.design.defaultSet.property.custom = { defaultType: 'text' };
      ICAL.design.defaultSet.param.type = { multiValue: ',', multiValueSeparateDQuote: true };
      let subject = new ICAL.Property('custom');
      subject.setParameter('type', ['ABC', 'XYZ']);
      subject.setValue('some value');
      assert.equal(subject.toICALString(), 'CUSTOM;TYPE="ABC","XYZ":some value');
      delete ICAL.design.defaultSet.property.custom;
      delete ICAL.design.defaultSet.param.type;
    });

    test('stringify property value containing "escaped" semicolons, commas, colons', function() {
      let subject = new ICAL.Property('attendee');
      subject.setParameter('cn', 'X\\:');
      subject.setValue('mailto:id');
      assert.equal(subject.toICALString(), 'ATTENDEE;CN="X\\:":mailto:id');
    });

    test('rfc6868 roundtrip', function() {
      let subject = new ICAL.Property('attendee');
      let input = "caret ^ dquote \" newline \n end";
      let expected = 'ATTENDEE;CN=caret ^^ dquote ^\' newline ^n end:mailto:id';
      subject.setParameter('cn', input);
      subject.setValue('mailto:id');
      assert.equal(subject.toICALString(), expected);
      assert.equal(ICAL.parse.property(expected)[1].cn, input);
    });

    test('roundtrip for property with multiple parameters', function() {
      ICAL.design.defaultSet.property.custom = { defaultType: 'text' };
      ICAL.design.defaultSet.param.type = { multiValue: ',', multiValueSeparateDQuote: true };
      let subject = new ICAL.Property('custom');
      subject.setParameter('type', ['ABC', '--"123"--']);
      subject.setValue('some value');
      assert.lengthOf(ICAL.parse.property(subject.toICALString())[1].type, 2);
      assert.include(ICAL.parse.property(subject.toICALString())[1].type, 'ABC');
      assert.include(ICAL.parse.property(subject.toICALString())[1].type, '--"123"--');
      delete ICAL.design.defaultSet.property.custom;
      delete ICAL.design.defaultSet.param.type;
    });

    test('folding', function() {
      let oldLength = ICAL.foldLength;
      let subject = new ICAL.Property("description");
      let N = ICAL.newLineChar + " ";
      subject.setValue('foobar');

      ICAL.foldLength = 19;
      assert.equal(subject.toICALString(), "DESCRIPTION:foobar");
      assert.equal(ICAL.stringify.property(subject.toJSON(), ICAL.design.icalendar, false), "DESCRIPTION:foobar");
      assert.equal(ICAL.stringify.property(subject.toJSON(), ICAL.design.icalendar, true), "DESCRIPTION:foobar");

      ICAL.foldLength = 15;
      assert.equal(subject.toICALString(), "DESCRIPTION:foobar");
      assert.equal(ICAL.stringify.property(subject.toJSON(), ICAL.design.icalendar, false), "DESCRIPTION:foo" + N + "bar");
      assert.equal(ICAL.stringify.property(subject.toJSON(), ICAL.design.icalendar, true), "DESCRIPTION:foobar");

      let utf16_muscle = '\uD83D\uDCAA'; //in UTF-8 this is F0 DF 92 AA.  If space/new line is inserted between the surrogates, then the JS Engine substitutes each stand-alone surrogate with REPLACEMENT CHARACTER 0xEF 0xBF 0xBD
      subject.setValue(utf16_muscle);
      assert.equal(ICAL.stringify.property(subject.toJSON(), ICAL.design.icalendar, false), "DESCRIPTION:" + N + utf16_muscle);//verify new line is after ':', as otherwise the whole line is longer than ICAL.foldLength
      subject.setValue('aa' + utf16_muscle + utf16_muscle + 'a' + utf16_muscle + utf16_muscle);
      assert.equal(ICAL.stringify.property(subject.toJSON(), ICAL.design.icalendar, false), "DESCRIPTION:aa" + N + utf16_muscle + utf16_muscle + 'a' + utf16_muscle + N + utf16_muscle);//verify that the utf16_muscle is moved as whole to a new line as it is 4 UTF-8 bytes

      ICAL.foldLength = oldLength;
    });

    test('property groups', function() {
      // Make sure the GROUP param is stripped
      let subject = ["fn", { "group": "bff" }, "text", "coffee"];
      assert.equal(ICAL.stringify.property(subject, ICAL.design.vcard, false), "BFF.FN:coffee");
    });
  });

  suite('stringify component', function() {
    test('minimal jcal', function() {
      let subject = ["vcalendar", [["version", {}, "text", "2.0"]], [["vevent", [], []]]];
      let expected = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nEND:VEVENT\r\nEND:VCALENDAR";

      assert.equal(ICAL.stringify.component(subject), expected);
    });

    test('minimal jcard', function() {
      // related to issue #266
      let subject = ["vcard", [["version", {}, "text", "4.0"]]];
      let expected = "BEGIN:VCARD\r\nVERSION:4.0\r\nEND:VCARD";

      assert.equal(ICAL.stringify.component(subject), expected);
    });

    test('minimal jcard with empty subcomponent', function() {
      let subject = ["vcard", [["version", {}, "text", "4.0"]], []];
      let expected = "BEGIN:VCARD\r\nVERSION:4.0\r\nEND:VCARD";

      assert.equal(ICAL.stringify.component(subject), expected);
    });

    test('structured values', function() {
      let subject = [
        "vcard",
        [
          [
            "adr",
            {},
            "text",
            [
              "one",
              "two",
              "three\n\n",
              "four\nfour\n",
              [
                "five",
                "five\n\n",
                "five\nfive\n"
              ],
              "six",
              "seven"
            ]
          ]
        ]
      ];
      let expected = "BEGIN:VCARD\r\nADR:one;two;three\\n\\n;four\\nfour\\n;five,five\\n\\n,five\\nfive\\n;six;seven\r\nEND:VCARD";

      assert.equal(ICAL.stringify.component(subject), expected);
    });
  });
});
