REPORTER=Spec
VENDOR_FILE=build/ical.js
LIB=lib/ical
VENDOR_FILE_LIST= $(LIB)/helpers.js \
	$(LIB)/design.js \
	$(LIB)/stringify.js \
	$(LIB)/parse.js \
	$(LIB)/component.js \
	$(LIB)/property.js \
	$(LIB)/utc_offset.js \
	$(LIB)/binary.js \
	$(LIB)/period.js \
	$(LIB)/duration.js \
	$(LIB)/timezone.js \
	$(LIB)/timezone_service.js \
	$(LIB)/time.js \
	$(LIB)/recur.js \
	$(LIB)/recur_iterator.js \
	$(LIB)/recur_expansion.js \
	$(LIB)/event.js \
	$(LIB)/component_parser.js

OLSON_DB_REMOTE=http://www.iana.org/time-zones/repository/releases/tzdata2012j.tar.gz
OLSON_DIR=$(PWD)/tools/tzurl/olson

.PHONY: dev
dev: package test-agent-config

.PHONY: package
package:
	rm -f $(VENDOR_FILE);
	touch $(VENDOR_FILE);
	# remove use strict for now in browser build...
	cat $(VENDOR_FILE_LIST) | sed 's:"use strict";::' >> $(VENDOR_FILE);

TEST_AGENT_CONFIG=./test-agent/config.json
.PHONY: test-agent-config
test-agent-config:
	@rm -f $(TEST_AGENT_CONFIG)
	@touch $(TEST_AGENT_CONFIG)
	@rm -f /tmp/test-agent-config;
	# Build json array of all test files
	for d in test; \
	do \
		find $$d -name '*_test.js' | sed "s:$$d/:/$$d/:g"  >> /tmp/test-agent-config; \
	done;
	@echo '{"tests": [' >> $(TEST_AGENT_CONFIG)
	@cat /tmp/test-agent-config |  \
		sed 's:\(.*\):"\1":' | \
		sed -e ':a' -e 'N' -e '$$!ba' -e 's/\n/,\
	/g' >> $(TEST_AGENT_CONFIG);
	@echo '  ]}' >> $(TEST_AGENT_CONFIG);
	@echo "Built test ui config file: $(TEST_AGENT_CONFIG)"
	@rm -f /tmp/test-agent-config

.PHONY: test
test: test-browser test-node

.PHONY: test-node
test-node:
	./node_modules/mocha/bin/mocha --ui tdd \
		test/helper.js \
		test/*_test.js \
		test/acceptance/*_test.js \
		test/performance/*_test.js

.PHONY: test-browser
test-browser:
	./node_modules/test-agent/bin/js-test-agent test --reporter $(REPORTER)

.PHONY: test-server
test-server:
	./node_modules/test-agent/bin/js-test-agent server --growl

.PHONY: timezones
timezones:
	# download tzurl
	if [ -d tools/tzurl ]; then \
		echo "tzurl downloaded"; \
	else \
		svn export -r40 http://tzurl.googlecode.com/svn/trunk/ tools/tzurl ; \
	fi;
	if [ -d $(OLSON_DIR) ]; then \
		echo "Using olson db from $(OLSON_DIR)"; \
	else \
		wget $(OLSON_DB_REMOTE) -O tools/tzurl/olson.tar.gz; \
		mkdir $(OLSON_DIR); \
		tar xvfz tools/tzurl/olson.tar.gz -C $(OLSON_DIR); \
	fi;
	# build it
	make -C tools/tzurl OLSON_DIR=$(OLSON_DIR)
	./tools/tzurl/vzic
