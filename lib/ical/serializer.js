var ICAL = ICAL || {};

(function () {
  ICAL.serializer = {
    serializeToIcal: function (obj, name, isParam) {
      if(obj && obj.icalclass) {
        return obj.toString();
      }

      var str = "";

      if(obj.type == "COMPONENT") {
        str = "BEGIN:" + obj.name + ICAL.newLineChar;
        for each(var sub in obj.value) {
          str += this.serializeToIcal(sub) + ICAL.newLineChar;
        }
        str += "END:" + obj.name;
      } else {
        str += ICAL.icalparser.stringifyProperty(obj);
      }
      return str;
    }
  };
}());
