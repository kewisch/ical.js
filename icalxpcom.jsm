/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const EXPORTED_SYMBOLS = ["defineXPCOMProps", "forwardAttribute", "forwardFunc",
                          "unwrapFunc", "forwardInnerAttribute", "forwardInnerFunc",
                          "unwrapValue"];

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function defineXPCOMProps(proto, classInfo) {
    proto.QueryInterface = XPCOMUtils.generateQI(classInfo.interfaces);
    proto.classInfo = XPCOMUtils.generateCI(classInfo);
    proto.classID = classInfo.classID;
}

function forwardAttribute(proto, name, getname, setname) {
    var getFunc = undefined;
    if (getname && (typeof proto[getname] == "function")) {
        getFunc = function() {
            return this[getname]();
        };
    } else {
        getFunc = function() {
            return this[getname];
        };
    }

    if (setname && (typeof proto[setname] == "function")) {
        setFunc = function(val) {
            if (val && typeof val == "object" &&  "wrappedJSObject" in val) {
                val = val.wrappedJSObject;
            }
            this[setname](val);
            return val;
        };
    } else {
        setFunc = function(val) {
            if (val && typeof val == "object" &&  "wrappedJSObject" in val) {
                val = val.wrappedJSObject;
            }
            return (this[setname] = val);
        };
    }

    Object.defineProperty(proto, name, { get: getFunc, set: setFunc });
}
function forwardInnerAttribute(proto, innerproto, name, getname, setname) {

    if (!getname && !setname) {
        getname = name;
        setname = name;
    }

    var getFunc = undefined;
    if (getname && (typeof innerproto[getname] == "function")) {
        getFunc = function() {
            return this.mInner[getname]();
        };
    } else {
        getFunc = function() {
            return this.mInner[getname];
        };
    }

    if (setname && (typeof innerproto[setname] == "function")) {
        setFunc = function(val) {
            if (val && typeof val == "object" &&  "wrappedJSObject" in val) {
                val = val.wrappedJSObject;
            }
            this.mInner[setname](val);
            return val;
        };
    } else {
        setFunc = function(val) {
            if (val && typeof val == "object" &&  "wrappedJSObject" in val) {
                val = val.wrappedJSObject;
            }
            return (this.mInner[setname] = val);
        };
    }

    Object.defineProperty(proto, name, { get: getFunc, set: setFunc });
}

function forwardFunc(proto, name, innername, unwrapIndices) {
    var innerFunc = proto[name];
    proto[name] = function() {
        var newArgs = arguments;
        if (unwrapIndices) {
            newArgs = Array.slice(arguments);
            for each (let index in unwrapIndices) {
                if (newArgs[index] && "wrappedJSObject" in newArgs[index]) {
                    newArgs[index] = newArgs[index].wrappedJSObject;
                }
            }
        }
        if (innername) {
            return this[innername].apply(this, newArgs);
        } else {
            return innerFunc.apply(this, newArgs);
        }
    };
}

function unwrapValue(val) {
    if (val && "wrappedJSObject" in val) {
        return val.wrappedJSObject;
    } else {
        return val;
    }
}

function dumpn(x) dump(x + "\n");

function forwardInnerFunc(proto, name, innername, unwrapIndices) {
    dumpn("Defining " + name + " => " + innername + " unwrap " + unwrapIndices);
    proto[name] = function() {
        var newArgs = arguments;
        if (unwrapIndices) {
            dumpn("Unwrapping " + name);
            newArgs = Array.slice(arguments);
            for each (let index in unwrapIndices) {
                dumpn("Unwrapping " + newArgs[index]);
                if (newArgs[index] && "wrappedJSObject" in newArgs[index]) {
                    dumpn("  to  " + newArgs[index].wrappedJSObject.mInner +
                           " what about " + newArgs[index].wrappedJSObject);
                    newArgs[index] = newArgs[index].wrappedJSObject.mInner;
                }
            }
        }
        dumpn("Forwarding " + name + " to " + (innername || name));
        return this.mInner[innername || name].apply(this.mInner, arguments);
    };
}

function unwrapFunc(proto, name, unwrapIndices) {
    let innerFunc = proto[name];

    proto[name] = function() {
        var newArgs = Array.slice(arguments);
        for each (let index in unwrapIndices) {
            if (newArgs[index] && "wrappedJSObject" in newArgs[index]) {
                newArgs[index] = newArgs[index].wrappedJSObject;
            }
        }
        return innerFunc.apply(this, newArgs);
    };
}
