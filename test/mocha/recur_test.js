suite('recur', function() {
  var Time = ICAL.icaltime;
  var Recur = ICAL.icalrecur;

  suite('#iterator', function() {
    function checkDate(data, last, dtstart) {
      var name = JSON.stringify(data);
      // XXX: better names
      test('RULE: ' + name, function() {
        var recur = new ICAL.icalrecur(data);
        if (dtstart) {
          dtstart = ICAL.icaltime.fromString(dtstart);
        } else {
          dtstart = ICAL.icaltime.epoch_time.clone();
        }
        var iter = recur.iterator(dtstart);
        assert.equal(iter.next().toString(), last);
      });
    }

    function checkThrow(data, expectedMessage, dtstart, stack) {
      test(expectedMessage, function() {
        var recur = new ICAL.icalrecur(data);
        if (dtstart) {
          dtstart = ICAL.icaltime.fromString(dtstart);
        } else {
          dtstart = ICAL.icaltime.epoch_time.clone();
        }
        assert.throws(function() {
          var iter = recur.iterator(dtstart);
        }, expectedMessage);
      });
    }

    checkThrow({
        BYYEARDAY: [3, 4, 5],
        BYMONTH: [2]
    }, 'Invalid BYYEARDAY rule');

    checkThrow({
        BYWEEKNO: [3],
        BYMONTHDAY: [2]
    }, 'BYWEEKNO does not fit to BYMONTHDAY');

    checkThrow({
        freq: 'MONTHLY',
        BYWEEKNO: [30]
    }, 'For MONTHLY recurrences neither BYYEARDAY nor BYWEEKNO may appear');

    checkThrow({
        freq: 'WEEKLY',
        BYMONTHDAY: [20]
    }, 'For WEEKLYLY recurrences neither BYMONTHDAY nor BYYEARDAY may appear');

    checkThrow({
        freq: 'DAILY',
        BYYEARDAY: [200]
    }, 'BYYEARDAY may only appear in YEARLY rules');

    checkThrow({
        freq: 'MONTHLY',
        BYDAY: ['-5TH']
    }, 'Malformed values in BYDAY part', '19700201T000000Z');

    checkDate({
        freq: 'SECONDLY',
        BYSECOND: ['2'],
        BYMINUTE: ['2'],
        BYHOUR: ['2'],
        BYDAY: ['2'],
        BYMONTHDAY: ['2'],
        BYMONTH: ['2'],
        BYSETPOS: ['2']
    }, '19700101T000000Z');

    checkDate({
        freq: 'MINUTELY',
        BYSECOND: [2, 4, 6],
        BYMINUTE: [1, 3, 5]
    }, '19700101T000002Z');

    checkDate({
        freq: 'YEARLY',
        BYSECOND: [1],
        BYMINUTE: [2],
        BYHOUR: [3],
        BYMONTHDAY: [4],
        BYMONTH: [5]
    }, '19700504T030201Z');

    checkDate({
        freq: 'WEEKLY',
        BYDAY: ['MO', 'TH', 'FR']
    }, '19700101T000000Z');

    checkDate({
        freq: 'WEEKLY',
        BYDAY: ['MO', 'WE']
    }, '19700105T000000Z');

    checkDate({
        freq: 'YEARLY',
        BYMONTH: [3]
    }, '19700305T000000Z', '19700105T000000Z');

    checkDate({
        freq: 'YEARLY',
        BYDAY: ['FR'],
        BYMONTH: [12],
        BYMONTHDAY: [1]
    }, '19721201T000000Z');

    checkDate({
        freq: 'MONTHLY',
        BYDAY: ['2MO']
    }, '19700112T000000Z');

    checkDate({
        freq: 'MONTHLY',
        BYDAY: ['-3MO']
    }, '19700112T000000Z');

    // TODO bymonthday else part
    // TODO check weekly without byday instances + 1 same wkday
  });

  test('#clone', function() {
    var until = ICAL.icaltime.epoch_time.clone();
    var a = new ICAL.icalrecur({
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

  suite('ICAL.icalrecur#toJSON', function() {

    test('round-trip', function() {
      var recur = ICAL.icalrecur.fromString(
        'FREQ=MONTHLY;BYDAY=1SU,2MO;BYSETPOS=1;COUNT=10;UNTIL=20121001T090000'
      );

      var props = {
        parts: {
          BYDAY: ['1SU', '2MO'],
          BYSETPOS: [1]
        },
        wkst: ICAL.icaltime.MONDAY,
        until: recur.until.toJSON(),
        freq: 'MONTHLY',
        count: 10,
        interval: 1
      };

      var result = recur.toJSON();
      assert.deepEqual(result, props);

      var fromJSON = new ICAL.icalrecur(result);

      assert.instanceOf(fromJSON.until, ICAL.icaltime);

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
    var until = ICAL.icaltime.epoch_time.clone();
    var a = new ICAL.icalrecur({
        interval: 2,
        wkst: 3,
        until: until,
        count: 5,
        freq: 'YEARLY',
        BYDAY: ['-1SU']
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


  test('#toString - round trip', function() {
    var until = ICAL.icaltime.epoch_time.clone();
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

    var a = new ICAL.icalrecur(data);
    var output = a.toString();
    var b = ICAL.icalrecur.fromString(output);

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

  suite('ICAL.icalrecur#icalDayToNumericDay', function() {
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
            ICAL.icalrecur.icalDayToNumericDay(map),
            expected[map]
          );
        });
      }(map));
    }
  });

 });
