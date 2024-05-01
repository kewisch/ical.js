import assert from "assert";


/**
 * The tests in this suite are known to fail, due to a bug in the library. If the tests here start
 * failing in the sense of mocha, then the test is passing and you have either:
 *
 * 1) Fixed the bug (yay! remove the test)
 * 2) Triggered some unknown underlying issue (boo! investigate)
 *
 * When adding something here, make sure to link the issue.
 */
suite('Known failures', function() {
  function testKnownFailure(message, testFn, only) {
    let runner = only ? test.only : test;
    runner(message, function(done) {
      try {
        testFn(done);
        done(new Error("Expected test fo fail"));
      } catch (e) {
        if (e instanceof assert.AssertionError) {
          this.skip();
        } else {
          done(e);
        }
      }
    });
  }
  testKnownFailure.only = function(message, testFn) {
    return testKnownFailure(message, testFn, true);
  };

  // Escaped parameters are not correctly parsed
  // Please see https://github.com/kewisch/ical.js/issues/669
  testKnownFailure('Parameter escaping', function() {
    let subject = ICAL.Property.fromString(`ATTENDEE;CN="Z\\;":mailto:z@example.org`);
    assert.equal(subject.getParameter("cn"), "Z\\;");
    assert.equal(subject.getFirstValue(), "mailto:z@example.org");
  });

  // Quoted multi-value parameters leak into the value
  // Please see https://github.com/kewisch/ical.js/issues/634
  testKnownFailure('with quoted multi-value parameter', function() {
    let attendee = ICAL.Property.fromString(
      'ATTENDEE;MEMBER=' +
      '"mailto:mygroup@localhost",' +
      '"mailto:mygroup2@localhost",' +
      '"mailto:mygroup3@localhost":' +
      'mailto:user2@localhost'
    );

    let expected = [
      'attendee',
      {
        member: [
          'mailto:mygroup@localhost',
          'mailto:mygroup2@localhost',
          'mailto:mygroup3@localhost'
        ]
      },
      'cal-address',
      'mailto:user2@localhost'
    ];

    assert.deepEqual(attendee.toJSON(), expected);
  });
});
