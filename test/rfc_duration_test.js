 suite("ical/duration - fromSeconds → toString", function() {
   test("pure weeks → P2W", function() {
    let Duration = new ICAL.Duration();
    let d = Duration.fromSeconds(2 * 7 * 86400);
    assert.equal(d.toString(), "P2W");
   });

   test("pure days → P3D", function() {
    let Duration = new ICAL.Duration();
    let d = Duration.fromSeconds(3 * 86400);
    assert.equal(d.toString(), "P3D");
   });

   test("pure time → PT5H30M5S", function() {
    let Duration = new ICAL.Duration();
    let d = Duration.fromSeconds(5 * 3600 + 30 * 60 + 5);
    assert.equal(d.toString(), "PT5H30M5S");
   });

   test("1 day + 2 hours → P1DT2H", function() {
    let Duration = new ICAL.Duration();
    let d = Duration.fromSeconds(86400 + 2 * 3600);
    assert.equal(d.toString(), "P1DT2H");
   });

   test("9 days → P9D", function() {
    let Duration = new ICAL.Duration();
    let d = Duration.fromSeconds(9 * 86400);
    assert.equal(d.toString(), "P9D");
   });

   test("10 days + 2 hours → P10DT2H", function() {
    let Duration = new ICAL.Duration();
    let d = Duration.fromSeconds(10 * 86400 + 2 * 3600);
    assert.equal(d.toString(), "P10DT2H");
   });
 });
