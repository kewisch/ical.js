suite('recur', function() {
  var Time = ICAL.Time;
  var Recur = ICAL.Recur;

  suite('#iterator', function() {
    function checkDate(data, last, dtstart) {
      var name = JSON.stringify(data);
      // XXX: better names
      test('RULE: ' + name, function() {
        var recur = new ICAL.Recur(data);
        if (dtstart) {
          dtstart = ICAL.Time.fromString(dtstart);
        } else {
          dtstart = ICAL.Time.epochTime.clone();
        }
        var iter = recur.iterator(dtstart);
        assert.equal(iter.next().toString(), last);
      });
    }

    function checkThrow(data, expectedMessage, dtstart, stack) {
      test(expectedMessage, function() {
        var recur = new ICAL.Recur(data);
        if (dtstart) {
          dtstart = ICAL.Time.fromString(dtstart);
        } else {
          dtstart = ICAL.Time.epochTime.clone();
        }
        assert.throws(function() {
          var iter = recur.iterator(dtstart);
        }, expectedMessage);
      });
    }

    checkThrow({
      parts: {
        BYYEARDAY: [3, 4, 5],
        BYMONTH: [2]
      }
    }, 'Invalid BYYEARDAY rule');

    checkThrow({
      parts: {
        BYWEEKNO: [3],
        BYMONTHDAY: [2]
      }
   }, 'BYWEEKNO does not fit to BYMONTHDAY');

    checkThrow({
      freq: 'MONTHLY',
      parts: {
        BYWEEKNO: [30]
      }
    }, 'For MONTHLY recurrences neither BYYEARDAY nor BYWEEKNO may appear');

    checkThrow({
      freq: 'WEEKLY',
      parts: {
        BYMONTHDAY: [20]
      }
    }, 'For WEEKLYLY recurrences neither BYMONTHDAY nor BYYEARDAY may appear');

    checkThrow({
      freq: 'DAILY',
      parts: {
        BYYEARDAY: [200]
      }
    }, 'BYYEARDAY may only appear in YEARLY rules');

    checkThrow({
      freq: 'MONTHLY',
      parts: {
        BYDAY: ['-5TH']
      }
    }, 'Malformed values in BYDAY part', '1970-02-01T00:00:00Z');

    checkDate({
      freq: 'SECONDLY',
      parts: {
        BYSECOND: ['2'],
        BYMINUTE: ['2'],
        BYHOUR: ['2'],
        BYDAY: ['2'],
        BYMONTHDAY: ['2'],
        BYMONTH: ['2'],
        BYSETPOS: ['2']
      }
    }, '1970-01-01T00:00:00Z');

    checkDate({
      freq: 'MINUTELY',
      parts: {
        BYSECOND: [2, 4, 6],
        BYMINUTE: [1, 3, 5]
      }
    }, '1970-01-01T00:00:02Z');

    checkDate({
      freq: 'YEARLY',
      parts: {
        BYSECOND: [1],
        BYMINUTE: [2],
        BYHOUR: [3],
        BYMONTHDAY: [4],
        BYMONTH: [5]
      }
    }, '1970-05-04T03:02:01Z');

    checkDate({
      freq: 'WEEKLY',
      parts: {
        BYDAY: ['MO', 'TH', 'FR']
      }
    }, '1970-01-01T00:00:00Z');

    checkDate({
      freq: 'WEEKLY',
      parts: {
        BYDAY: ['MO', 'WE']
      }
    }, '1970-01-05T00:00:00Z');

    checkDate({
      freq: 'YEARLY',
      parts: {
        BYMONTH: [3]
      }
    }, '1970-03-05T00:00:00Z', '1970-01-05T00:00:00Z');

    checkDate({
      freq: 'YEARLY',
      parts: {
        BYDAY: ['FR'],
        BYMONTH: [12],
        BYMONTHDAY: [1]
      }
    }, '1972-12-01T00:00:00Z');

    checkDate({
      freq: 'MONTHLY',
      parts: {
        BYDAY: ['2MO']
      }
    }, '1970-01-12T00:00:00Z');

    checkDate({
      freq: 'MONTHLY',
      parts: {
        BYDAY: ['-3MO']
      }
    }, '1970-01-12T00:00:00Z');

    // TODO bymonthday else part
    // TODO check weekly without byday instances + 1 same wkday
  });

  test('#clone', function() {
    var until = ICAL.Time.epochTime.clone();
    var a = new ICAL.Recur({
        interval: 2,
        wkst: 3,
        until: until,
        count: 5,
        freq: 'YEARLY'
    });

    var b = a.clone();

    assert.equal(a.interval, b.interval);
    assert.equal(a.wkst, b.wkst);
    assert.equal(a.until.compare(b.until), 0);
    assert.equal(a.count, b.count);
    assert.equal(a.freq, b.freq);

    b.interval++; b.wkst++; b.until.day++; b.count++; b.freq = 'WEEKLY';

    assert.notEqual(a.interval, b.interval);
    assert.notEqual(a.wkst, b.wkst);
    assert.notEqual(a.until.compare(b.until), 0);
    assert.notEqual(a.count, b.count);
    assert.notEqual(a.freq, b.freq);
  });

  suite('ICAL.Recur#toJSON', function() {

    test('round-trip', function() {
      var recur = ICAL.Recur.fromString(
        'FREQ=MONTHLY;BYDAY=1SU,2MO;BYSETPOS=1;COUNT=10;UNTIL=2012-10-01T09:00:00'
      );

      var props = {
        parts: {
          BYDAY: ['1SU', '2MO'],
          BYSETPOS: [1]
        },
        wkst: ICAL.Time.MONDAY,
        until: recur.until.toJSON(),
        freq: 'MONTHLY',
        count: 10,
        interval: 1
      };

      var result = recur.toJSON();
      assert.deepEqual(result, props);

      var fromJSON = new ICAL.Recur(result);

      assert.instanceOf(fromJSON.until, ICAL.Time);

      assert.hasProperties(fromJSON, {
        parts: props.parts,
        wkst: props.wkst,
        freq: props.freq,
        count: props.count,
        interval: props.interval
      });
    });
  });

  test('components', function() {
    var until = ICAL.Time.epochTime.clone();
    var a = new ICAL.Recur({
      interval: 2,
      wkst: 3,
      until: until,
      count: 5,
      freq: 'YEARLY',
      parts: {
        BYDAY: ['-1SU']
      }
    });

    assert.deepEqual(a.getComponent('BYDAY'), ['-1SU']);
    assert.deepEqual(a.getComponent('BYWTF'), []);

    a.addComponent('BYDAY', '+2MO');
    assert.deepEqual(a.getComponent('BYDAY'), ['-1SU', '+2MO']);
    assert.deepEqual(a.getComponent('BYWTF'), []);

    a.setComponent('BYDAY', ['WE', 'TH']);
    assert.deepEqual(a.getComponent('BYDAY'), ['WE', 'TH']);

    a.addComponent('BYMONTHDAY', '31');
    assert.deepEqual(a.getComponent('BYMONTHDAY'), ['31']);

    var count = {};
    a.getComponent('BYDAY', count);
    assert.equal(count.value, 2);
  });

  suite('#fromString', function() {

    function verify(string, options) {
      test('parse: "' + string + '"', function() {
        var result = ICAL.Recur.fromString(string);
        // HACK for until validation
        if (options.until) {
          var until = options.until;
          delete options.until;
          assert.hasProperties(result.until, until);
        }
        assert.hasProperties(result, options);
      });
    }

    function verifyFail(string, errorParam) {
      test('invalid input "' + string + '"', function() {
        assert.throws(function() {
          var result = ICAL.Recur.fromString(string);
        }, errorParam);
      });
    }

    verifyFail('FREQ=FOOBAR', /invalid frequency/);
    verify('FREQ=YEARLY;BYYEARDAY=300,301,-1', {
      freq: 'YEARLY',
      parts: { BYYEARDAY: [300, 301, -1] }
    });

    verifyFail('BYYEARDAY=367', /BYYEARDAY/);
    verifyFail('BYYEARDAY=-367', /BYYEARDAY/);

    verify('FREQ=MONTHLY;BYMONTHDAY=+3', {
      freq: 'MONTHLY',
      parts: { BYMONTHDAY: [3] }
    });

    verify('FREQ=MONTHLY;BYMONTHDAY=-3', {
      freq: 'MONTHLY',
      parts: { BYMONTHDAY: [-3] }
    });

    verify('BYSECOND=10;BYMINUTE=11;BYHOUR=12;BYWEEKNO=53;BYSETPOS=30', {
      parts: {
        BYSECOND: [10],
        BYMINUTE: [11],
        BYHOUR: [12],
        BYWEEKNO: [53],
        BYSETPOS: [30]
      }
    });

    verify('FREQ=DAILY;INTERVAL=3;COUNT=10;', {
      freq: 'DAILY',
      count: 10,
      interval: 3
    });

    verify('BYDAY=1SU,MO,TU,-53MO,13FR', {
      parts: {
        BYDAY: ['1SU', 'MO', 'TU', '-53MO', '13FR']
      }
    });

    verifyFail('BYDAY=ZA,FO1', /invalid BYDAY/);

    verify('UNTIL=2012-10-12T10:15:07', {
      until: {
        year: 2012,
        month: 10,
        day: 12,
        hour: 10,
        minute: 15,
        second: 07
      }
    });

    verify('WKST=SU', {
      wkst: 1
    });

    verifyFail('WKST=ofo', /invalid WKST/);
  });

  test('#toString - round trip', function() {
    var until = ICAL.Time.epochTime.clone();
    var data = {
      interval: 2,
      wkst: 3,
      until: until,
      count: 5,
      freq: 'YEARLY',
      parts: {
        'BYDAY': 'TU',
        'BYMONTH': '1'
      }
    };

    var a = new ICAL.Recur(data);
    var output = a.toString();
    var b = ICAL.Recur.fromString(output);

    assert.ok(a.toString(), 'outputs');

    assert.include(output, ';UNTIL=' + until.toString());
    // wkst 3 == TU see DOW_MAP
    assert.include(output, 'WKST=TU');
    assert.include(output, 'COUNT=5');
    assert.include(output, 'INTERVAL=2');
    assert.include(output, 'FREQ=YEARLY');
    assert.include(output, 'BYMONTH=1');
    assert.include(output, 'BYDAY=TU');

    assert.equal(a.toString(), b.toString(), 'roundtrip equality');
  });

  suite('ICAL.Recur#icalDayToNumericDay', function() {
    var expected = {
      'SU': Time.SUNDAY,
      'MO': Time.MONDAY,
      'TU': Time.TUESDAY,
      'WE': Time.WEDNESDAY,
      'TH': Time.THURSDAY,
      'FR': Time.FRIDAY,
      'SA': Time.SATURDAY
    };

    for (var map in expected) {
      (function(map) {
        test(map + ' to constant', function() {
          assert.equal(
            ICAL.Recur.icalDayToNumericDay(map),
            expected[map]
          );
        });
      }(map));
    }
  });

 });
