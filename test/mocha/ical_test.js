testSupport.requireICAL();

suite('ical/parser', function() {

  var icsData;
  var blankLineEndICS, blankLineMidICS;

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
    var obj = { a: [], b: false };

    // round trip the data
    var icsOut = ICAL.stringify(ICAL.parse(icsData));

    // again just basic testing to verify
    // stringify from the top most level
    assert.equal(strip(icsData), strip(icsOut));
  });

  testSupport.defineSample('blank_line_end.ics', function(data) {
    blankLineEndICS = data;
  });
  testSupport.defineSample('blank_line_mid.ics', function(data) {
    blankLineMidICS = data;
  });

  test('Blank line at end', function() {
    // This sample contains a blank line at the end, it should still parse
    var result = ICAL.parse(blankLineEndICS);
  });

  test('Blank line within', function() {
    // This sample contains a blank line at the end, it should throw an error
    assert.throw(function() {
      var result = ICAL.parse(blankLineMidICS);
    }, ICAL.ParserError, "Parser falsly accepted blank line inbetween");
  });
});
