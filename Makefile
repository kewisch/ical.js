REPORTER=Spec
VENDOR_FILE=build/ical.js
LIB=lib/ical
VENDOR_FILE_LIST= $(LIB)/helpers.js \
	$(LIB)/serializer.js \
	$(LIB)/parser.js \
	$(LIB)/design.js \
	$(LIB)/component.js \
	$(LIB)/property.js \
	$(LIB)/value.js \
	$(LIB)/period.js \
	$(LIB)/duration.js \
	$(LIB)/timezone.js \
	$(LIB)/time.js \
	$(LIB)/recur.js \
	$(LIB)/ical.js

.PHONY: dev
dev: package test-agent-config node-deps

.PHONY: node-deps
node-deps:
	npm install .
	# mocha
	rm -f test-agent/mocha.js
	cp node_modules/mocha/mocha.js test-agent/

	rm -f test-agent/mocha.css
	cp node_modules/mocha/mocha.css test-agent/

	#chai
	rm -f test-agent/chai.js
	cp node_modules/chai/chai.js test-agent/

 # test-agent
	rm -f test-agent/test-agent.js
	cp node_modules/test-agent/test-agent.js test-agent/

	rm -f test-agent/test-agent.css
	cp node_modules/test-agent/test-agent.css test-agent/

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
		test/mocha/helper.js \
		test/mocha/*_test.js \
		test/mocha/acceptance/*_test.js

.PHONY: test-browser
test-browser:
	./node_modules/test-agent/bin/js-test-agent test --reporter $(REPORTER)

.PHONY: test-server
test-server:
	./node_modules/test-agent/bin/js-test-agent server --growl
