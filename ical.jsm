/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var loadScript;
var ICAL = {};
var dumpn;

if (typeof window != "undefined" && navigator && document) {
    // Looks like we are on a webpage, use script tags to load them
    // TODO we can't load into a specific scope, use XMLHttpRequest/eval?
    var head = document.getElementsByTagName("head")[0];

    loadScript = function loadScript(path, scope) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = path;
        head.appendChild(script);
    };

    dumpn = console.log;
} else if (typeof Components != "undefined") {
    // We are on a mozilla browser, hopefully privileged
    Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

    var ssl = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                        .createInstance(Components.interfaces.mozIJSSubScriptLoader);
    var thisUri = this.__URI__;
    var baseUri = thisUri.substring(0, thisUri.lastIndexOf("/")+1);

    var globalScope = Components.utils.getGlobalForObject(ICAL);

    loadScript = function loadScript(path, scope) {
        try {
            ssl.loadSubScript(baseUri + path, scope || globalScope);
        } catch (e) {
            dump("Error loading " + baseUri + path + "\n");
            throw e;
        }
    };

    dumpn = function dumpn(str) dump(str + "\n");
} else if (typeof importScripts != "undefined") {
    // We are on a mozilla browser, in a (Chrome)Worker

    loadScript = function loadScript(path, scope) {
        importScripts(path);
    }
    dumpn = function dumpn(str) dump(str + "\n");
}

function WARN(aMessage) {
    var cs = Components.classes["@mozilla.org/consoleservice;1"]
                     .getService(Components.interfaces.nsIConsoleService);
    dump("Warning: " + aMessage + '\n');
    var scriptError = Components.classes["@mozilla.org/scripterror;1"]
                                .createInstance(Components.interfaces.nsIScriptError);
    scriptError.init(aMessage, null, null, 0, 0,
                     Components.interfaces.nsIScriptError.warningFlag,
                     "component javascript");
    cs.logMessage(scriptError);
}

function STACK(aDepth, aSkip, aStartFrame) {
    var depth = aDepth || 10;
    var skip = aSkip || 0;
    var stack = "";
    var frame = aStartFrame || Components.stack.caller;
    for (var i = 1; i <= depth + skip && frame; i++) {
        if (i > skip) {
            stack += i + ": [" + frame.filename + ":" +
                     frame.lineNumber + "] " + frame.name + "\n";
        }
        frame = frame.caller;
    }
    return stack;
}

loadScript("icalhelpers.js");
loadScript("icalparser.js");
loadScript("designData.js");

loadScript("icalcomponent.js");
loadScript("icalproperty.js");

loadScript("icalvalue.js");
loadScript("icalperiod.js");
loadScript("icalduration.js");
loadScript("icaltimezone.js");
loadScript("icalrecur.js");
loadScript("icaltime.js");

var EXPORTED_SYMBOLS = ["ICAL"];
