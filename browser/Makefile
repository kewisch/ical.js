VENDOR_FILE=./ical.js
LIB=../

.PHONY: package
package::
	rm -f ical.js
	cat $(LIB)/icalhelpers.js >> $(VENDOR_FILE);
	cat $(LIB)/icalparser.js >> $(VENDOR_FILE);
	cat $(LIB)/designData.js >> $(VENDOR_FILE);
	cat $(LIB)/icalcomponent.js >> $(VENDOR_FILE);
	cat $(LIB)/icalproperty.js >> $(VENDOR_FILE);
	cat $(LIB)/icalvalue.js >> $(VENDOR_FILE);
	cat $(LIB)/icalperiod.js >> $(VENDOR_FILE);
	cat $(LIB)/icalduration.js >> $(VENDOR_FILE);
	cat $(LIB)/icaltimezone.js >> $(VENDOR_FILE);
	cat $(LIB)/icalrecur.js >> $(VENDOR_FILE);
	cat $(LIB)/icaltime.js >> $(VENDOR_FILE);
