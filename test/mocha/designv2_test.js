suite('designv2', function() {
  var subject;
  setup(function() {
    subject = ICAL.designv2;
  });

  suite('types', function() {

    suite('binary', function() {
      setup(function() {
        subject = subject.value.binary;
      });

      test('#(un)decorate', function() {
        var undecorated = 'VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcy' +
                          'BvdmVyIHRoZSBsYXp5IGRvZy4=';

        var decorated = subject.decorate(undecorated);

        assert.equal(
          subject.undecorate(decorated),
          undecorated
        );
      });
    });

    suite('date', function() {
      setup(function() {
        subject = subject.value.date;
      });

      test('#fromICAL', function() {
        var value = subject.fromICAL(
          '20121010'
        );

        assert.equal(value, '2012-10-10');
      });

      test('#toICAL', function() {
        var value = subject.toICAL(
          '2012-10-10'
        );

        assert.equal(value, '20121010');
      });

      test('#(un)decorate', function() {
        var value = '2012-10-10';

        var time = subject.decorate(
          '2012-10-10'
        );

        assert.hasProperties(
          time,
          { year: 2012, month: 10, day: 10, isDate: true }
        );

        assert.equal(
          subject.undecorate(time),
          '2012-10-10'
        );
      });
    });


    suite('date-time', function() {
      setup(function() {
        subject = subject.value['date-time'];
      });

      test('#(from|to)ICAL', function() {
        var value = '20120901T130000';
        var expected = '2012-09-01T13:00:00';
        var time = subject.fromICAL(value);

        assert.equal(
          subject.fromICAL(value),
          expected
        );

        assert.equal(
          subject.toICAL(expected),
          value
        );
      });

      test('#(un)decorate (utc)', function() {
        var undecorated = '2012-09-01T13:05:11Z';

        var decorated = subject.decorate(undecorated);

        assert.hasProperties(
          decorated,
          {
            year: 2012,
            month: 9,
            day: 1,
            hour: 13,
            minute: 05,
            second: 11,
            isDate: false,
            zone: ICAL.icaltimezone.utc_timezone
          }
        );

        assert.equal(
          subject.undecorate(decorated),
          undecorated
        );
      });

      test('#(un)decorate (utc)', function() {
        var undecorated = '2012-09-01T13:05:11';
        var decorated = subject.decorate(undecorated);

        assert.hasProperties(
          decorated,
          {
            year: 2012,
            month: 9,
            day: 1,
            hour: 13,
            minute: 05,
            second: 11,
            isDate: false
          }
        );

        assert.equal(
          subject.undecorate(decorated),
          undecorated
        );
      });
    });

    suite('duration', function() {
      setup(function() {
        subject = subject.value.duration;
      });

      test('#(un)decorate', function() {
        var undecorated = 'P15DT5H5M20S';
        var decorated = subject.decorate(undecorated);
        assert.equal(subject.undecorate(decorated), undecorated);
      });
    });

    suite('float', function() {
      setup(function() {
        subject = subject.value.float;
      });

      test('#(from|to)ICAL', function() {
        var original = '1.5';
        var fromICAL = subject.fromICAL(original);

        assert.equal(fromICAL, 1.5);
        assert.equal(subject.toICAL(fromICAL), original);
      });
    });

    suite('integer', function() {
      setup(function() {
        subject = subject.value.integer;
      });

      test('#(from|to)ICAL', function() {
        var original = '105';
        var fromICAL = subject.fromICAL(original);

        assert.equal(fromICAL, 105);
        assert.equal(subject.toICAL(fromICAL), original);
      });
    });

    suite('period', function() {
      setup(function() {
        subject = subject.value.period;
      });

      test('#(un)decorate', function() {
        var undecorated = '19970101T180000Z/PT5H30M';
        var decorated = subject.decorate(
          undecorated
        );

        assert.hasProperties(
          decorated.start,
          {
            year: 1997,
            day: 1,
            month: 1,
            hour: 18
          }
        );

        assert.hasProperties(
          decorated.duration,
          {
            hours: 5,
            minutes: 30
          }
        );

        assert.equal(
          subject.undecorate(decorated),
          undecorated
        );
      });
    });

    suite('recur', function() {
      setup(function() {
        subject = subject.value.recur;
      });

      test('#(un)decorate', function() {
        var undecorated = 'FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR';
        var decorated = subject.decorate(undecorated);

        assert.instanceOf(decorated, ICAL.icalrecur);

        assert.hasProperties(
          decorated,
          {
            freq: 'MONTHLY',
            parts: {
              BYDAY: ['MO', 'TU', 'WE', 'TH', 'FR']
            }
          }
        );

        assert.equal(
          subject.undecorate(decorated),
          undecorated
        );
      });
    });

    suite('utc-offset', function() {
      setup(function() {
        subject = subject.value['utc-offset'];
      });

      test('#(un)decorate', function() {
        var undecorated = '-0500';
        var decorated = subject.decorate(undecorated);

        assert.equal(decorated.hours, 5, 'hours');
        assert.equal(decorated.factor, -1, 'factor');

        assert.equal(
          subject.undecorate(decorated),
          undecorated
        );
      });
    });

  });

});
