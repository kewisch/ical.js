suite('timezone', function() {
  var icsData;
  var timezone;


  function timezoneTest(tzid, testCb) {
    suite(tzid, function() {
      testSupport.defineSample('timezones/' + tzid + '.ics', function(data) {
        icsData = data;
      });

      setup(function() {
        var parsed = ICAL.parse(icsData)[1];
        var vcalendar = new ICAL.Component(parsed);
        var comp = vcalendar.getFirstSubcomponent('vtimezone');

        timezone = new ICAL.Timezone({
          tzid: comp.getFirstPropertyValue('tzid'),
          component: comp
        });
      });

      test('parse', testCb);
    });
  }

  function utcHours(time) {
    var seconds = timezone.utcOffset(
      new ICAL.Time(time)
    );

    // in hours
    return (seconds / 60) / 60;
  }

  var sanityChecks = [
    {
      // just before US DST
      time: { year: 2012, month: 3, day: 11, hour: 1, minute: 59 },
      offsets: {
        'America/Los_Angeles': -8,
        'America/New_York': -5,
        'America/Atikokan': -5 // single tz
      }
    },

    {
      // just after US DST
      time: { year: 2012, month: 3, day: 11, hour: 2 },
      offsets: {
        'America/Los_Angeles': -7,
        'America/New_York': -4,
        'America/Atikokan': -5
      }
    }
  ];

  // simple format checks
  sanityChecks.forEach(function(item) {
    var title = 'time: ' + JSON.stringify(item.time);

    suite(title, function() {
      for (var tzid in item.offsets) {
        timezoneTest(tzid, function(tzid) {
          assert.equal(
            utcHours(item.time),
            item.offsets[tzid]
          );
        }.bind(this, tzid));
      }
    });
  });

});
