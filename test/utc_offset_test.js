suite('ICAL.UtcOffset', function() {
  suite('from/toSeconds', function() {
    test('static', function() {
      var subject = ICAL.UtcOffset.fromSeconds(3661);
      assert.equal(subject.toString(), '+01:01');
      assert.equal(subject.toSeconds(), 3660);
    });
    test('instance', function() {
      var subject = ICAL.UtcOffset.fromSeconds(3661);
      subject.fromSeconds(-7321);
      assert.equal(subject.toString(), '-02:02');
      assert.equal(subject.toSeconds(), -7320);
    });
  });
});
