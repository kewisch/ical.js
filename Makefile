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
	$(LIB)/recur.js \
	$(LIB)/time.js \
	$(LIB)/ical.js

.PHONY: node-deps
node-deps:
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
package: node-deps
	rm -f $(VENDOR_FILE);
	touch $(VENDOR_FILE);
	cat $(VENDOR_FILE_LIST) >> $(VENDOR_FILE);

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
test:
	./node_modules/test-agent/bin/js-test-agent test

.PHONY: test-server
test-server:
	./node_modules/test-agent/bin/js-test-agent server --growl
