# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# Portions Copyright (C) Philipp Kewisch, 2012

from closure_linter import errors
from closure_linter import errorrules 

OriginalShouldReportError = None

def InjectErrorReporter():
  global OriginalShouldReportError
  OriginalShouldReportError = errorrules.ShouldReportError
  errorrules.ShouldReportError = IcalShouldReportError

def IcalShouldReportError(error):
  global OriginalShouldReportError
  return error not in (
    errors.UNNECESSARY_DOUBLE_QUOTED_STRING,
    errors.LINE_TOO_LONG,
  ) and OriginalShouldReportError(error)
