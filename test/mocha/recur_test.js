suite('recur', function() {
  var recur;
  var iterator;
  var Time = ICAL.icaltime;
  var Recur = ICAL.icalrecur;

  function createDay(date) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
  }

  function isSameDate(first, second) {
    return first.getMonth() == second.getMonth() &&
           first.getDate() == second.getDate() &&
           first.getFullYear() == second.getFullYear();
  }

  // taken from gaia calendar app
  function datesBetween(start, end, includeTime) {
    var list = [];
    var last = start.getDate();
    var cur;

    while (true) {
      var next = new Date(
        start.getFullYear(),
        start.getMonth(),
        ++last
      );

      if (next > end) {
        throw new Error(
          'sanity fails next is greater then end'
        );
      }

      if (!isSameDate(next, end)) {
        list.push(next);
        continue;
      }

      break;
    }

    if (includeTime) {
      list.unshift(start);
      list.push(end);
    } else {
      list.unshift(createDay(start));
      list.push(createDay(end));
    }

    return list;
  }

  function getDaysIn(month) {
    var start = new Date(
      month.getFullYear(),
      month.getMonth(),
      1
    );
    var end = new Date(start.valueOf());
    end.setMonth(start.getMonth() + 1);
    end.setMilliseconds(-1);

    return datesBetween(start, end);
  }

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


  test('round trip', function() {
    var until = ICAL.icaltime.epoch_time.clone();
    var a = new ICAL.icalrecur({
      interval: 2,
      wkst: 3,
      until: until,
      count: 5,
      freq: 'YEARLY'
    });

    var iprop = a.toIcalProperty();
    assert.equal(a.toString(), iprop.getStringValue());
    var b = ICAL.icalrecur.fromIcalProperty(iprop);
    assert.equal(a.toString(), b.toString());

    var str = a.toString();
    b = ICAL.icalrecur.fromString(str);
    assert.equal(str, b.toString());
  });

  suite('yearly & by month', function() {

    test('infinite', function() {
      var raw = 'FREQ=YEARLY;BYMONTH=3;BYDAY=TU';
      var start = '19700308T020000';
      var recur = ICAL.icalrecur.fromString(raw);
      var start = ICAL.icaltime.fromString(start);

      var iterator = recur.iterator(start);
      var limit = 1;
      var cur = 0;

      var rootDate = new Date(
        1970, 2
      );

      while (limit > cur++) {
        var next = iterator.next();
        var date = next.toJSDate();

        assert.equal(
          date.getMonth(), 2,
          'expected March for year ' + String(1970 + cur)
        );
      }
    });

  });

  function createIterator(ruleString, timeString) {
    setup(function() {
      var start = ICAL.icaltime.fromString(timeString);
      recur = ICAL.icalrecur.fromString(ruleString);
      iterator = recur.iterator(start);
    });
  }

  suite('daily for 10 occurances', function() {
    createIterator(
      'FREQ=DAILY;COUNT=10',
      '20120901T090000'
    );

    test('until end', function() {
      var calls = 0;
      var next;

      assert.isTrue(recur.isFinite(), 'finite');
      assert.isTrue(recur.isByCount(), 'by count');

      while ((next = iterator.next())) {
        ++calls;
        assert.equal(iterator.occurrence_number, calls);
        assert.deepEqual(
          new Date(2012, 8, calls, 9),
          next.toJSDate()
        );
      }
      assert.equal(calls, 10);
    });
  });

  suite('every other day - forever', function() {
    createIterator(
      'FREQ=DAILY;INTERVAL=2',
      '20120901T090000'
    );

    test('10 times', function() {
      assert.isFalse(recur.isFinite(), 'finite');
      assert.isFalse(recur.isByCount(), 'by count');

      var max = 10;
      var cur = 0;
      var next;

      while (cur < max && (next = iterator.next())) {
        cur++;
        assert.equal(iterator.occurrence_number, cur);
        // cur is 1 based we want zero based so -1
        // 1 + ((cur - 1) * 2) == 1, 3, 5, etc..
        var nextDay = 1 + ((cur - 1) * 2);
        assert.deepEqual(
          next.toJSDate(),
          new Date(2012, 8, 1 + ((cur - 1) * 2), 9)
        );
      }
    });
  });


  suite('every 10 days, 5 occurrences', function() {
    createIterator(
      'FREQ=DAILY;INTERVAL=10;COUNT=5',
      '20120901T090000'
    );

    test('until end', function() {
      var calls = 0;
      var next;

      assert.isTrue(recur.isFinite(), 'is finite');
      assert.isTrue(recur.isByCount(), 'is by count');

      while ((next = iterator.next())) {
        calls++;
        assert.equal(iterator.occurrence_number, calls);
        var expected = new Date(
          2012,
          8,
          1 + ((calls - 1) * 10),
          9
        );

        assert.deepEqual(
          next.toJSDate(),
          expected
        );
      }

      assert.equal(calls, 5);
    });
  });

  suite('every day in January, for 3 years', function() {
    createIterator(
      'FREQ=YEARLY;UNTIL=20150131T090000Z;BYMONTH=1;BYDAY=SU,MO,TU,WE,TH,FR,SA',
      '20120501T090000'
    );

    var months = [
      new Date(2013, 0),
      new Date(2014, 0),
      new Date(2015, 0)
    ];

    test('until end', function() {
      // take list of months and convert each month to an
      // array of single dates. Then reduce list into
      // one array of dates.
      var expected = months.map(getDaysIn).reduce(function(a, b) {
        return a.concat(b);
      });

      // then set the hour
      expected.forEach(function(date) {
        date.setHours(9);
      });

      var dates = [];
      var endDate = ICAL.icaltime.fromString('20150131T090000Z');
      var max = expected.length;
      var calls = 0;
      var next;

      assert.isTrue(recur.isFinite(), 'is finite');
      assert.deepEqual(
        recur.until.toJSDate(),
        endDate.toJSDate()
      );

      while ((next = iterator.next())) {
        if (calls > (max + 90)) {
          throw new Error(
            'Too many dates created expected maximum of: ' + max +
            ' currently at: ' + calls + ''
          );
          break;
        }
        calls++;
        dates.push(next.toJSDate());
      }

      assert.length(dates, expected.length);
      assert.deepEqual(dates.sort(), expected.sort());
      assert.equal(calls, expected.length);
    });
  });

  suite('weekly for 10 occurances', function() {
    createIterator(
      'FREQ=WEEKLY;COUNT=10',
      '20120105T090000'
    );

    var expected = [
      new Date(2012, 0, 5, 9),
      new Date(2012, 0, 12, 9),
      new Date(2012, 0, 19, 9),
      new Date(2012, 0, 26, 9),
      new Date(2012, 1, 2, 9),
      new Date(2012, 1, 9, 9),
      new Date(2012, 1, 16, 9),
      new Date(2012, 1, 23, 9),
      new Date(2012, 2, 1, 9),
      new Date(2012, 2, 8, 9)
    ];

    test('until end', function() {
      assert.isTrue(recur.isFinite(), 'finite');
      var dates = [];
      var next;

      while ((next = iterator.next())) {
        dates.push(next.toJSDate());
      }

      assert.deepEqual(
        dates,
        expected
      );
    });
  });

  suite('weekly on tuesday and thursday for five weeks', function() {
    createIterator(
      'FREQ=WEEKLY;COUNT=4;WKST=SU;BYDAY=TU,TH',
      '20120101T090000'
    );

    var expected = [
      new Date(2012, 0, 3, 9),
      new Date(2012, 0, 5, 9),
      new Date(2012, 0, 10, 9),
      new Date(2012, 0, 12, 9)
    ];

    test('until end', function() {
      var next;
      var dates = [];

      assert.isTrue(recur.isFinite(), 'finite');

      var inc = 0;
      var max = 10;

      while ((next = iterator.next())) {
        inc++;
        if (inc > max) {
          throw new Error('max');
        }
        dates.push(next.toJSDate());
      }

      assert.deepEqual(dates, expected);
    });
  });

  suite('every thursday 31th forever', function() {
    createIterator(
      'FREQ=MONTHLY;BYDAY=TH;BYMONTHDAY=31',
      '20120131T090000'
    );

    test('for 3 occurances', function() {
      var next;
      var dates = [];
      var expected = [
        new Date(2012, 4, 31, 9),
        new Date(2013, 0, 31, 9),
        new Date(2013, 9, 31, 9)
      ];

      var inc = 0;
      var max = 3;

      while (inc < max) {
        var value = iterator.next().toJSDate();
        dates.push(value);
        inc++;
      }

      assert.deepEqual(
        dates.sort(),
        expected.sort()
      );
    });
  });

  suite('every friday 13th forever', function() {
    createIterator(
      'FREQ=MONTHLY;BYDAY=FR;BYMONTHDAY=13',
      '20120401T090000'
    );

    test('for 3 occurances', function() {
      var next;
      var dates = [];

      assert.isFalse(recur.isFinite(), 'finite');

      var max = 3;
      var inc = 0;

      var expected = [
        new Date(2012, 3, 13, 9),
        new Date(2012, 6, 13, 9),
        new Date(2013, 8, 13, 9)
      ];

      while (inc < max) {
        var value = iterator.next().toJSDate();
        dates.push(value);
        inc++;
      }

      assert.deepEqual(
        dates.sort(),
        expected.sort()
      );

    });
  });

});
