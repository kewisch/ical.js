suite('recur', function() {
  suite('initialization', function() {
    test('empty init', function() {
      let recur = new ICAL.Recur();
      assert.equal(recur.interval, 1);
      assert.equal(recur.wkst, ICAL.Time.MONDAY);
      assert.isNull(recur.until);
      assert.isNull(recur.count);
      assert.isNull(recur.freq);
    });
  });

  suite('#iterator', function() {
    function checkDate(data, last, dtstart) {
      let name = JSON.stringify(data);
      // XXX: better names
      test('RULE: ' + name, function() {
        let recur = new ICAL.Recur(data);
        if (dtstart) {
          dtstart = ICAL.Time.fromString(dtstart);
        } else {
          dtstart = ICAL.Time.epochTime.clone();
        }
        let iter = recur.iterator(dtstart);
        assert.equal(iter.next().toString(), last);
      });
    }

    function checkThrow(data, expectedMessage, dtstart, stack) {
      test(expectedMessage, function() {
        let recur = new ICAL.Recur(data);
        if (dtstart) {
          dtstart = ICAL.Time.fromString(dtstart);
        } else {
          dtstart = ICAL.Time.epochTime.clone();
        }
        assert.throws(function() {
          recur.iterator(dtstart);
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
    }, 'For WEEKLY recurrences neither BYMONTHDAY nor BYYEARDAY may appear');

    checkThrow({
      freq: 'DAILY',
      parts: {
        BYYEARDAY: [200]
      }
    }, 'BYYEARDAY may only appear in YEARLY rules');

    checkThrow({
      freq: 'MONTHLY',
      parts: {
        BYDAY: ['-6TH']
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

    checkDate({
      freq: 'MONTHLY',
      parts: {
        BYDAY: ['WE'],
        BYMONTHDAY: [1]
      }
    }, '1970-04-01T00:00:00Z');

    // TODO bymonthday else part
    // TODO check weekly without byday instances + 1 same wkday
  });

  test('#clone', function() {
    let until = ICAL.Time.epochTime.clone();
    let a = new ICAL.Recur({
        interval: 2,
        wkst: 3,
        until: until,
        count: 5,
        freq: 'YEARLY'
    });

    let b = a.clone();

    assert.equal(a.interval, b.interval);
    assert.equal(a.wkst, b.wkst);
    assert.equal(a.until.compare(b.until), 0);
    assert.equal(a.count, b.count);
    assert.equal(a.freq, b.freq);

    b.interval++;
    b.wkst++;
    b.until.day++;
    b.count++;
    b.freq = 'WEEKLY';

    assert.notEqual(a.interval, b.interval);
    assert.notEqual(a.wkst, b.wkst);
    assert.notEqual(a.until.compare(b.until), 0);
    assert.notEqual(a.count, b.count);
    assert.notEqual(a.freq, b.freq);
  });

  suite('ICAL.Recur#toJSON', function() {

    test('round-trip', function() {
      let recur = ICAL.Recur.fromString(
        'FREQ=MONTHLY;BYDAY=1SU,2MO;BYSETPOS=1;COUNT=10;UNTIL=20121001T090000'
      );

      let props = {
        byday: ['1SU', '2MO'],
        bysetpos: 1,
        until: '2012-10-01T09:00:00',
        freq: 'MONTHLY',
        count: 10
      };

      let result = recur.toJSON();
      assert.deepEqual(result, props);

      let fromJSON = new ICAL.Recur(result);

      assert.instanceOf(fromJSON.until, ICAL.Time);

      assert.hasProperties(fromJSON, {
        freq: props.freq,
        count: props.count,
      });

      assert.hasProperties(fromJSON.parts, {
        BYDAY: props.byday,
        BYSETPOS: [props.bysetpos]
      });
    });
  });

  test('components', function() {
    let until = ICAL.Time.epochTime.clone();
    let a = new ICAL.Recur({
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
    assert.deepEqual(a.getComponent('byday'), ['-1SU', '+2MO']);
    assert.deepEqual(a.getComponent('bywtf'), []);

    a.setComponent('BYDAY', ['WE', 'TH']);
    assert.deepEqual(a.getComponent('BYDAY'), ['WE', 'TH']);

    a.addComponent('BYMONTHDAY', '31');
    assert.deepEqual(a.getComponent('bymonthday'), ['31']);

    let comp = a.getComponent('BYDAY');
    assert.equal(comp.length, 2);
  });

  suite('#fromString', function() {

    function verify(string, options) {
      test('parse: "' + string + '"', function() {
        let result = ICAL.Recur.fromString(string);
        // HACK for until validation
        if (options.until) {
          let until = options.until;
          delete options.until;
          assert.hasProperties(result.until, until);
        }
        assert.hasProperties(result, options);
      });
    }

    function verifyFail(string, errorParam) {
      test('invalid input "' + string + '"', function() {
        assert.throws(function() {
          ICAL.Recur.fromString(string);
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

    verify('UNTIL=20121012T101507', {
      until: {
        year: 2012,
        month: 10,
        day: 12,
        hour: 10,
        minute: 15,
        second: 7
      }
    });

    verify('WKST=SU', {
      wkst: 1
    });

    verifyFail('WKST=ofo', /invalid WKST/);

    // Zero or negative interval should be accepted as interval=1
    verify('INTERVAL=0', {
      interval: 1
    });
    verify('INTERVAL=-1', {
      interval: 1
    });
  });

  suite('#fromData', function() {

    function verify(data, options) {
      test('parse: "' + JSON.stringify(data) + '"', function() {
        assert.hasProperties(ICAL.Recur.fromData(data), options);
      });
    }

    function verifyFail(data) {
      test('invalid input "' + JSON.stringify(data) + '"', function() {
        assert.throws(function() {
          ICAL.Recur.fromString(data);
        });
      });
    }

    verify({}, {});

    // INTERVAL checks
    verify({ interval: 1 }, { interval: 1 });
    verify({ count: 1 }, { count: 1 });
    verify({ interval: '1' }, { interval: 1 });
    verifyFail({ interval: 'NaN' });
  });

  suite('#getNextOccurrence', function() {
    test('basic test', function() {
      let rec = ICAL.Recur.fromString('FREQ=DAILY;INTERVAL=2');
      let dtstart = ICAL.Time.epochTime.clone();
      let recId = dtstart.clone();
      recId.day += 20;

      let next = rec.getNextOccurrence(dtstart, recId);
      assert.deepEqual(next.toJSON(), {
        year: 1970,
        month: 1,
        day: 23,
        hour: 0,
        minute: 0,
        second: 0,
        isDate: false,
        timezone: 'UTC'
      });
    });

    test('no next occurrence', function() {
      let rec = ICAL.Recur.fromString('FREQ=DAILY;INTERVAL=2;UNTIL=19700103T000000Z');
      let dtstart = ICAL.Time.epochTime.clone();
      let recId = dtstart.clone();
      recId.day += 20;

      assert.isNull(rec.getNextOccurrence(dtstart, recId));
    });
  });

  suite('recur data types', function() {
    test('invalid freq', function() {
      assert.throws(function() {
        ICAL.Recur.fromString("FREQ=123");
      }, /invalid frequency/);
    });

    test('invalid wkst', function() {
      assert.throws(function() {
        ICAL.Recur.fromString("FREQ=WEEKLY;WKST=DUNNO");
      }, /invalid WKST value/);
    });

    test('invalid count', function() {
      assert.throws(function() {
        ICAL.Recur.fromString("FREQ=WEEKLY;COUNT=MAYBE10");
      }, /Could not extract integer from/);
    });

    test('invalid interval', function() {
      assert.throws(function() {
        ICAL.Recur.fromString("FREQ=WEEKLY;INTERVAL=ADAGIO");
      }, /Could not extract integer from/);
    });

    test('invalid numeric byday', function() {
      assert.throws(function() {
        ICAL.Recur.fromString("FREQ=WEEKLY;BYDAY=1,2,3");
      }, /invalid BYDAY value/);
    });

    test('extra structured recur values', function() {
      let rec = ICAL.Recur.fromString("RSCALE=ISLAMIC-CIVIL;FREQ=YEARLY;BYMONTH=9");
      assert.equal(rec.rscale, "ISLAMIC-CIVIL");
    });

    test('single BYxxx value from string', function() {
      let rec = ICAL.Recur.fromString("FREQ=MINUTELY;BYSECOND=5");
      let comp = rec.getComponent("bysecond");
      assert.equal(comp.length, 1);
      assert.equal(comp[0], 5);
    });

    test('single BYxxx value from jCal', function() {
      let prop = new ICAL.Property("rrule");
      prop.setValue({ freq: "minutely", bysecond: 5 });
      let val = prop.getFirstValue();

      let comp = val.getComponent("bysecond");
      assert.equal(comp.length, 1);
      assert.equal(comp[0], 5);
    });

    test('multiple BYxxx values from string', function() {
      let rec = ICAL.Recur.fromString("FREQ=YEARLY;BYYEARDAY=20,30,40");
      let comp = rec.getComponent("byyearday");
      assert.deepEqual(comp, [20, 30, 40]);
    });

    test('multiple BYxxx values from jCal', function() {
      let prop = new ICAL.Property("rrule");
      prop.setValue({ freq: "yearly", byyearday: [20, 30, 40] });
      let val = prop.getFirstValue();

      let comp = val.getComponent("byyearday");
      assert.deepEqual(comp, [20, 30, 40]);
    });

    test('can be saved to a property that will be serialized correctly', function() {
      let icalString = 'FREQ=WEEKLY;UNTIL=19700103T000000Z;WKST=SU;BYDAY=TU,TH';
      let recur = ICAL.Recur.fromString(icalString);
      let prop = new ICAL.Property('rrule');
      prop.setValue(recur);
      assert.equal(prop.toICALString(), 'RRULE:FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=19700103T000000Z;WKST=SU');
    });
  });

  suite('#toString', function() {
    test('round trip', function() {
      let until = ICAL.Time.epochTime.clone();
      let data = {
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

      let a = new ICAL.Recur(data);
      let output = a.toString();
      let b = ICAL.Recur.fromString(output);

      assert.ok(a.toString(), 'outputs');

      assert.include(output, ';UNTIL=19700101T000000Z');
      // wkst 3 == TU see DOW_MAP
      assert.include(output, 'WKST=TU');
      assert.include(output, 'COUNT=5');
      assert.include(output, 'INTERVAL=2');
      assert.include(output, 'FREQ=YEARLY');
      assert.include(output, 'BYMONTH=1');
      assert.include(output, 'BYDAY=TU');

      assert.equal(a.toString(), b.toString(), 'roundtrip equality');
    });
    test('not all props', function() {
      let data = {
        freq: 'YEARLY',
      };

      let a = new ICAL.Recur(data);
      assert.equal(a.toString(), 'FREQ=YEARLY');
    });
  });

  suite('ICAL.Recur#icalDayToNumericDay', function() {
    let expectedDayMap = {
      'SU': ICAL.Time.SUNDAY,
      'MO': ICAL.Time.MONDAY,
      'TU': ICAL.Time.TUESDAY,
      'WE': ICAL.Time.WEDNESDAY,
      'TH': ICAL.Time.THURSDAY,
      'FR': ICAL.Time.FRIDAY,
      'SA': ICAL.Time.SATURDAY
    };

    Object.entries(expectedDayMap).forEach(([icalDay, numericDay]) => {
      test(icalDay + ' to constant', function() {
        assert.equal(
          ICAL.Recur.icalDayToNumericDay(icalDay),
          numericDay
        );
      });
    });

    let expectedWithWkst = [
      //day, wkst, expected
      ['SU', ICAL.Time.SUNDAY, 1],
      ['MO', ICAL.Time.SUNDAY, 2],
      ['TU', ICAL.Time.SUNDAY, 3],
      ['WE', ICAL.Time.SUNDAY, 4],
      ['TH', ICAL.Time.SUNDAY, 5],
      ['FR', ICAL.Time.SUNDAY, 6],
      ['SA', ICAL.Time.SUNDAY, 7],
      ['SU', ICAL.Time.MONDAY, 7],
      ['MO', ICAL.Time.MONDAY, 1],
      ['TU', ICAL.Time.MONDAY, 2],
      ['WE', ICAL.Time.MONDAY, 3],
      ['TH', ICAL.Time.MONDAY, 4],
      ['FR', ICAL.Time.MONDAY, 5],
      ['SA', ICAL.Time.MONDAY, 6],
      ['SU', ICAL.Time.TUESDAY, 6],
      ['MO', ICAL.Time.TUESDAY, 7],
      ['TU', ICAL.Time.TUESDAY, 1],
      ['WE', ICAL.Time.TUESDAY, 2],
      ['TH', ICAL.Time.TUESDAY, 3],
      ['FR', ICAL.Time.TUESDAY, 4],
      ['SA', ICAL.Time.TUESDAY, 5],
      ['SU', ICAL.Time.WEDNESDAY, 5],
      ['MO', ICAL.Time.WEDNESDAY, 6],
      ['TU', ICAL.Time.WEDNESDAY, 7],
      ['WE', ICAL.Time.WEDNESDAY, 1],
      ['TH', ICAL.Time.WEDNESDAY, 2],
      ['FR', ICAL.Time.WEDNESDAY, 3],
      ['SA', ICAL.Time.WEDNESDAY, 4],
      ['SU', ICAL.Time.THURSDAY, 4],
      ['MO', ICAL.Time.THURSDAY, 5],
      ['TU', ICAL.Time.THURSDAY, 6],
      ['WE', ICAL.Time.THURSDAY, 7],
      ['TH', ICAL.Time.THURSDAY, 1],
      ['FR', ICAL.Time.THURSDAY, 2],
      ['SA', ICAL.Time.THURSDAY, 3],
      ['SU', ICAL.Time.FRIDAY, 3],
      ['MO', ICAL.Time.FRIDAY, 4],
      ['TU', ICAL.Time.FRIDAY, 5],
      ['WE', ICAL.Time.FRIDAY, 6],
      ['TH', ICAL.Time.FRIDAY, 7],
      ['FR', ICAL.Time.FRIDAY, 1],
      ['SA', ICAL.Time.FRIDAY, 2],
      ['SU', ICAL.Time.SATURDAY, 2],
      ['MO', ICAL.Time.SATURDAY, 3],
      ['TU', ICAL.Time.SATURDAY, 4],
      ['WE', ICAL.Time.SATURDAY, 5],
      ['TH', ICAL.Time.SATURDAY, 6],
      ['FR', ICAL.Time.SATURDAY, 7],
      ['SA', ICAL.Time.SATURDAY, 1]
    ];

    expectedWithWkst.forEach(([day, wkst, expected]) => {
      test(day + ' to constant, wkst = ' + wkst, function() {
        assert.equal(
          ICAL.Recur.icalDayToNumericDay(day, wkst),
          expected
        );
      });
    });
  });

  suite('ICAL.Recur#numericDayToIcalDay', function() {
    let expected = {
      [ICAL.Time.SUNDAY]: 'SU',
      [ICAL.Time.MONDAY]: 'MO',
      [ICAL.Time.TUESDAY]: 'TU',
      [ICAL.Time.WEDNESDAY]: 'WE',
      [ICAL.Time.THURSDAY]: 'TH',
      [ICAL.Time.FRIDAY]: 'FR',
      [ICAL.Time.SATURDAY]: 'SA'
    };

    Object.entries(expected).forEach(([numericDay, icalDay]) => {
      test(numericDay + ' to ' + icalDay, function() {
        assert.equal(
          ICAL.Recur.numericDayToIcalDay(+numericDay),
          icalDay
        );
      });
    });
  });

  let expectedWithWkst = [
    //expectedDay, wkst, numericDay
    ['SU', ICAL.Time.SUNDAY, 1],
    ['MO', ICAL.Time.SUNDAY, 2],
    ['TU', ICAL.Time.SUNDAY, 3],
    ['WE', ICAL.Time.SUNDAY, 4],
    ['TH', ICAL.Time.SUNDAY, 5],
    ['FR', ICAL.Time.SUNDAY, 6],
    ['SA', ICAL.Time.SUNDAY, 7],
    ['SU', ICAL.Time.MONDAY, 7],
    ['MO', ICAL.Time.MONDAY, 1],
    ['TU', ICAL.Time.MONDAY, 2],
    ['WE', ICAL.Time.MONDAY, 3],
    ['TH', ICAL.Time.MONDAY, 4],
    ['FR', ICAL.Time.MONDAY, 5],
    ['SA', ICAL.Time.MONDAY, 6],
    ['SU', ICAL.Time.TUESDAY, 6],
    ['MO', ICAL.Time.TUESDAY, 7],
    ['TU', ICAL.Time.TUESDAY, 1],
    ['WE', ICAL.Time.TUESDAY, 2],
    ['TH', ICAL.Time.TUESDAY, 3],
    ['FR', ICAL.Time.TUESDAY, 4],
    ['SA', ICAL.Time.TUESDAY, 5],
    ['SU', ICAL.Time.WEDNESDAY, 5],
    ['MO', ICAL.Time.WEDNESDAY, 6],
    ['TU', ICAL.Time.WEDNESDAY, 7],
    ['WE', ICAL.Time.WEDNESDAY, 1],
    ['TH', ICAL.Time.WEDNESDAY, 2],
    ['FR', ICAL.Time.WEDNESDAY, 3],
    ['SA', ICAL.Time.WEDNESDAY, 4],
    ['SU', ICAL.Time.THURSDAY, 4],
    ['MO', ICAL.Time.THURSDAY, 5],
    ['TU', ICAL.Time.THURSDAY, 6],
    ['WE', ICAL.Time.THURSDAY, 7],
    ['TH', ICAL.Time.THURSDAY, 1],
    ['FR', ICAL.Time.THURSDAY, 2],
    ['SA', ICAL.Time.THURSDAY, 3],
    ['SU', ICAL.Time.FRIDAY, 3],
    ['MO', ICAL.Time.FRIDAY, 4],
    ['TU', ICAL.Time.FRIDAY, 5],
    ['WE', ICAL.Time.FRIDAY, 6],
    ['TH', ICAL.Time.FRIDAY, 7],
    ['FR', ICAL.Time.FRIDAY, 1],
    ['SA', ICAL.Time.FRIDAY, 2],
    ['SU', ICAL.Time.SATURDAY, 2],
    ['MO', ICAL.Time.SATURDAY, 3],
    ['TU', ICAL.Time.SATURDAY, 4],
    ['WE', ICAL.Time.SATURDAY, 5],
    ['TH', ICAL.Time.SATURDAY, 6],
    ['FR', ICAL.Time.SATURDAY, 7],
    ['SA', ICAL.Time.SATURDAY, 1]
  ];

  for (let i = 0; i< expectedWithWkst.length; i++) {
    (function(list) {
      test(list[2] + ' to string, wkst = ' + list[1], function() {
        assert.equal(
          ICAL.Recur.numericDayToIcalDay(list[2], list[1]),
          list[0]
        );
      });
    }(expectedWithWkst[i]));
  }
});
