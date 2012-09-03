# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# Portions Copyright (C) Philipp Kewisch, 2012

from closure_linter import fixjsstyle
import icaljs_errorrules

if __name__ == '__main__':
  icaljs_errorrules.InjectErrorReporter()
  fixjsstyle.main()
