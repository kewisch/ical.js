testSupport.requireICAL();

suite('ical/parser', function() {

  var icsData;

  function strip(text) {
    var val = text.replace(/\\r/g, '');
    return val.trim();
  }


  testSupport.defineSample('blank_description.ics', function(data) {
    icsData = data;
  });

  test('ICAL.parse', function() {
    var object = ICAL.parse(icsData);

    // just basic verification that
    // parsing works at a high level
    // deeper testing will be done at
    // the function level
    assert.equal(object.name, 'VCALENDAR');
    assert.equal(object.type, 'COMPONENT');
  });

  test('ICAL.stringify', function() {
    // round trip the data
    var icsOut = ICAL.stringify(ICAL.parse(icsData));

    // again just basic testing to verify
    // stringify from the top most level
    assert.equal(strip(icsData), strip(icsOut));
  });

});
