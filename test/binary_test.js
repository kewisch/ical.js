suite('ICAL.Binary', function() {
  var subject;

  setup(function() {
    subject = new ICAL.Binary();
  });

  test('setEncodedValue', function() {
    subject.setEncodedValue('bananas');
    assert.equal(subject.decodeValue(), 'bananas');
    assert.equal(subject.value, 'YmFuYW5hcw==');

    subject.setEncodedValue('apples');
    assert.equal(subject.decodeValue(), 'apples');
    assert.equal(subject.value, 'YXBwbGVz');
  });

  test('null values', function() {
    subject.setEncodedValue(null);
    assert.equal(subject.decodeValue(), null);
    assert.equal(subject.value, null);
  });
});
