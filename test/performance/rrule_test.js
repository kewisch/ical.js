perfCompareSuite('rrule', function(perf, ICAL) {

  var start;
  var occurrences;

  suiteSetup(function() {
    start = ICAL.Time.fromString("2015-01-01T12:00:00");
    occurrences = 50;
  });


  // These are common rules that can be created in the UI of various clients.
  // At the moment we will just check getting 50 occurrences with INTERVAL=1.
  // Checking COUNT, UNTIL and a higher INTERVAL could be applied to any rule,
  // which would be quite a lot of combinations. Therefore those rules are just
  // checked once.
  [
    // COUNT, UNTIL and INTERVAL
    "FREQ=DAILY;COUNT=50",
    "FREQ=DAILY;UNTIL=2015-02-20T12:00:00",
    "FREQ=DAILY;INTERVAL=7",

    // Lightning rules
    "FREQ=DAILY",

    "FREQ=WEEKLY",
    "FREQ=WEEKLY;BYDAY=MO,WE,FR",

    "FREQ=MONTHLY",
    "FREQ=MONTHLY;BYMONTHDAY=1,15,31",
    "FREQ=MONTHLY;BYMONTHDAY=-1",
    "FREQ=MONTHLY;BYDAY=FR",
    "FREQ=MONTHLY;BYDAY=-1SU",
    "FREQ=MONTHLY;BYDAY=3MO",

    "FREQ=YEARLY",
    "FREQ=YEARLY;BYMONTHDAY=23;BYMONTH=11",
    "FREQ=YEARLY;BYDAY=4TH;BYMONTH=11",

    "FREQ=YEARLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYMONTH=11",
    "FREQ=YEARLY;BYDAY=-1SU;BYMONTH=11",
    "FREQ=YEARLY;BYDAY=4TH;BYMONTH=11",

    // Apple iCal rules
    "FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=3",
    "FREQ=MONTHLY;BYDAY=SA,SU;BYMONTH=11;BYSETPOS=-1"

  ].forEach(function(rulestring) {
    perf.test(rulestring, function() {
      var rrule = ICAL.Recur.fromString(rulestring);
      var iter = rrule.iterator(start);
      for (var i = 0; i < occurrences; i++) {
        iter.next();
      }
    });
  });

});
