/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2011-2015 */

#include <libical/ical.h>
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
    struct icalrecurrencetype recur;
    icalrecur_iterator *ritr;
    struct icaltimetype dtstart, next;
    int howmany = 1;

    if (argc < 4) {
        printf("Usage: libical-recur <rrule> <dtstart> <occurrence count>\n");
        exit(1);
    }

    howmany = atoi(argv[3]);
    dtstart = icaltime_from_string(argv[2]);
    recur = icalrecurrencetype_from_string(argv[1]);
    ritr = icalrecur_iterator_new(recur, dtstart);

    if (ritr) {
        for (next = icalrecur_iterator_next(ritr);
             howmany > 0 && !icaltime_is_null_time(next);
             next = icalrecur_iterator_next(ritr), howmany--) {
            printf("%s\n", icaltime_as_ical_string_r(next));
        }
    } else {
        printf("Error: %d\n", icalerrno);
    }
}
