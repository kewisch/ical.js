# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# Portions Copyright (C) Philipp Kewisch, 2015

LIBICAL_BASE ?= $(CURDIR)/../libical
LIBICAL_BUILD = $(LIBICAL_BASE)/build
LDFLAGS = -L $(LIBICAL_BUILD)/lib -lical
CFLAGS = -I $(LIBICAL_BUILD)/src -g

LIBICAL_SOURCES = support/libical-recur.c
LIBICAL_PROG = support/libical-recur

all: libical

libical: $(LIBICAL_BUILD)
	$(CC) -o $(LIBICAL_PROG) $(LIBICAL_SOURCES) $(LDFLAGS) $(CFLAGS)

clean:
	$(RM) -r $(LIBICAL_BASE)

run:
	node index.js

$(LIBICAL_BUILD):
	cd $(dir $(LIBICAL_BASE)) && git clone https://github.com/libical/libical
	mkdir  $(LIBICAL_BUILD)
	cd $(LIBICAL_BUILD) && cmake .. && make
