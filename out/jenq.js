var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.require = function(rule) {
  if(!COMPILED) {
    if(goog.getObjectByName(rule)) {
      return
    }
    var path = goog.getPathFromDeps_(rule);
    if(path) {
      goog.included_[path] = true;
      goog.writeScripts_()
    }else {
      var errorMessage = "goog.require could not find: " + rule;
      if(goog.global.console) {
        goog.global.console["error"](errorMessage)
      }
      throw Error(errorMessage);
    }
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName])
          }else {
            if(!goog.getObjectByName(requireName)) {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs)
    }
  }else {
    return function() {
      return fn.apply(context, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global && !goog.string.contains(str, "<")) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global["document"]["createElement"]("div");
  el["innerHTML"] = "<pre>x" + str + "</pre>";
  if(el["firstChild"][goog.string.NORMALIZE_FN_]) {
    el["firstChild"][goog.string.NORMALIZE_FN_]()
  }
  str = el["firstChild"]["firstChild"]["nodeValue"].slice(1);
  el["innerHTML"] = "";
  return goog.string.canonicalizeNewlines(str)
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.NORMALIZE_FN_ = "normalize";
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
void 0;
void 0;
void 0;
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
void 0;
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  if(p[goog.typeOf.call(null, x)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error("No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
void 0;
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__4453__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__4453 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4453__delegate.call(this, array, i, idxs)
    };
    G__4453.cljs$lang$maxFixedArity = 2;
    G__4453.cljs$lang$applyTo = function(arglist__4454) {
      var array = cljs.core.first(arglist__4454);
      var i = cljs.core.first(cljs.core.next(arglist__4454));
      var idxs = cljs.core.rest(cljs.core.next(arglist__4454));
      return G__4453__delegate(array, i, idxs)
    };
    G__4453.cljs$lang$arity$variadic = G__4453__delegate;
    return G__4453
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
void 0;
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
void 0;
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____4455 = this$;
      if(and__3822__auto____4455) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____4455
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3824__auto____4456 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4456) {
          return or__3824__auto____4456
        }else {
          var or__3824__auto____4457 = cljs.core._invoke["_"];
          if(or__3824__auto____4457) {
            return or__3824__auto____4457
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____4458 = this$;
      if(and__3822__auto____4458) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____4458
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3824__auto____4459 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4459) {
          return or__3824__auto____4459
        }else {
          var or__3824__auto____4460 = cljs.core._invoke["_"];
          if(or__3824__auto____4460) {
            return or__3824__auto____4460
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____4461 = this$;
      if(and__3822__auto____4461) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____4461
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3824__auto____4462 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4462) {
          return or__3824__auto____4462
        }else {
          var or__3824__auto____4463 = cljs.core._invoke["_"];
          if(or__3824__auto____4463) {
            return or__3824__auto____4463
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____4464 = this$;
      if(and__3822__auto____4464) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____4464
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3824__auto____4465 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4465) {
          return or__3824__auto____4465
        }else {
          var or__3824__auto____4466 = cljs.core._invoke["_"];
          if(or__3824__auto____4466) {
            return or__3824__auto____4466
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____4467 = this$;
      if(and__3822__auto____4467) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____4467
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3824__auto____4468 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4468) {
          return or__3824__auto____4468
        }else {
          var or__3824__auto____4469 = cljs.core._invoke["_"];
          if(or__3824__auto____4469) {
            return or__3824__auto____4469
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____4470 = this$;
      if(and__3822__auto____4470) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____4470
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3824__auto____4471 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4471) {
          return or__3824__auto____4471
        }else {
          var or__3824__auto____4472 = cljs.core._invoke["_"];
          if(or__3824__auto____4472) {
            return or__3824__auto____4472
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____4473 = this$;
      if(and__3822__auto____4473) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____4473
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3824__auto____4474 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4474) {
          return or__3824__auto____4474
        }else {
          var or__3824__auto____4475 = cljs.core._invoke["_"];
          if(or__3824__auto____4475) {
            return or__3824__auto____4475
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____4476 = this$;
      if(and__3822__auto____4476) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____4476
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3824__auto____4477 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4477) {
          return or__3824__auto____4477
        }else {
          var or__3824__auto____4478 = cljs.core._invoke["_"];
          if(or__3824__auto____4478) {
            return or__3824__auto____4478
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____4479 = this$;
      if(and__3822__auto____4479) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____4479
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3824__auto____4480 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4480) {
          return or__3824__auto____4480
        }else {
          var or__3824__auto____4481 = cljs.core._invoke["_"];
          if(or__3824__auto____4481) {
            return or__3824__auto____4481
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____4482 = this$;
      if(and__3822__auto____4482) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____4482
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3824__auto____4483 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4483) {
          return or__3824__auto____4483
        }else {
          var or__3824__auto____4484 = cljs.core._invoke["_"];
          if(or__3824__auto____4484) {
            return or__3824__auto____4484
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____4485 = this$;
      if(and__3822__auto____4485) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____4485
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3824__auto____4486 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4486) {
          return or__3824__auto____4486
        }else {
          var or__3824__auto____4487 = cljs.core._invoke["_"];
          if(or__3824__auto____4487) {
            return or__3824__auto____4487
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____4488 = this$;
      if(and__3822__auto____4488) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____4488
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3824__auto____4489 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4489) {
          return or__3824__auto____4489
        }else {
          var or__3824__auto____4490 = cljs.core._invoke["_"];
          if(or__3824__auto____4490) {
            return or__3824__auto____4490
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____4491 = this$;
      if(and__3822__auto____4491) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____4491
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3824__auto____4492 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4492) {
          return or__3824__auto____4492
        }else {
          var or__3824__auto____4493 = cljs.core._invoke["_"];
          if(or__3824__auto____4493) {
            return or__3824__auto____4493
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____4494 = this$;
      if(and__3822__auto____4494) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____4494
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3824__auto____4495 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4495) {
          return or__3824__auto____4495
        }else {
          var or__3824__auto____4496 = cljs.core._invoke["_"];
          if(or__3824__auto____4496) {
            return or__3824__auto____4496
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____4497 = this$;
      if(and__3822__auto____4497) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____4497
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3824__auto____4498 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4498) {
          return or__3824__auto____4498
        }else {
          var or__3824__auto____4499 = cljs.core._invoke["_"];
          if(or__3824__auto____4499) {
            return or__3824__auto____4499
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____4500 = this$;
      if(and__3822__auto____4500) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____4500
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3824__auto____4501 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4501) {
          return or__3824__auto____4501
        }else {
          var or__3824__auto____4502 = cljs.core._invoke["_"];
          if(or__3824__auto____4502) {
            return or__3824__auto____4502
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____4503 = this$;
      if(and__3822__auto____4503) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____4503
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3824__auto____4504 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4504) {
          return or__3824__auto____4504
        }else {
          var or__3824__auto____4505 = cljs.core._invoke["_"];
          if(or__3824__auto____4505) {
            return or__3824__auto____4505
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____4506 = this$;
      if(and__3822__auto____4506) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____4506
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3824__auto____4507 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4507) {
          return or__3824__auto____4507
        }else {
          var or__3824__auto____4508 = cljs.core._invoke["_"];
          if(or__3824__auto____4508) {
            return or__3824__auto____4508
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____4509 = this$;
      if(and__3822__auto____4509) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____4509
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3824__auto____4510 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4510) {
          return or__3824__auto____4510
        }else {
          var or__3824__auto____4511 = cljs.core._invoke["_"];
          if(or__3824__auto____4511) {
            return or__3824__auto____4511
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____4512 = this$;
      if(and__3822__auto____4512) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____4512
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3824__auto____4513 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4513) {
          return or__3824__auto____4513
        }else {
          var or__3824__auto____4514 = cljs.core._invoke["_"];
          if(or__3824__auto____4514) {
            return or__3824__auto____4514
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____4515 = this$;
      if(and__3822__auto____4515) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____4515
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3824__auto____4516 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4516) {
          return or__3824__auto____4516
        }else {
          var or__3824__auto____4517 = cljs.core._invoke["_"];
          if(or__3824__auto____4517) {
            return or__3824__auto____4517
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
void 0;
void 0;
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____4518 = coll;
    if(and__3822__auto____4518) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____4518
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4519 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4519) {
        return or__3824__auto____4519
      }else {
        var or__3824__auto____4520 = cljs.core._count["_"];
        if(or__3824__auto____4520) {
          return or__3824__auto____4520
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____4521 = coll;
    if(and__3822__auto____4521) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____4521
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4522 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4522) {
        return or__3824__auto____4522
      }else {
        var or__3824__auto____4523 = cljs.core._empty["_"];
        if(or__3824__auto____4523) {
          return or__3824__auto____4523
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____4524 = coll;
    if(and__3822__auto____4524) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____4524
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3824__auto____4525 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4525) {
        return or__3824__auto____4525
      }else {
        var or__3824__auto____4526 = cljs.core._conj["_"];
        if(or__3824__auto____4526) {
          return or__3824__auto____4526
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
void 0;
void 0;
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____4527 = coll;
      if(and__3822__auto____4527) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____4527
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3824__auto____4528 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4528) {
          return or__3824__auto____4528
        }else {
          var or__3824__auto____4529 = cljs.core._nth["_"];
          if(or__3824__auto____4529) {
            return or__3824__auto____4529
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____4530 = coll;
      if(and__3822__auto____4530) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____4530
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3824__auto____4531 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4531) {
          return or__3824__auto____4531
        }else {
          var or__3824__auto____4532 = cljs.core._nth["_"];
          if(or__3824__auto____4532) {
            return or__3824__auto____4532
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
void 0;
void 0;
cljs.core.ASeq = {};
void 0;
void 0;
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____4533 = coll;
    if(and__3822__auto____4533) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____4533
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4534 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4534) {
        return or__3824__auto____4534
      }else {
        var or__3824__auto____4535 = cljs.core._first["_"];
        if(or__3824__auto____4535) {
          return or__3824__auto____4535
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____4536 = coll;
    if(and__3822__auto____4536) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____4536
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4537 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4537) {
        return or__3824__auto____4537
      }else {
        var or__3824__auto____4538 = cljs.core._rest["_"];
        if(or__3824__auto____4538) {
          return or__3824__auto____4538
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____4539 = o;
      if(and__3822__auto____4539) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____4539
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3824__auto____4540 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____4540) {
          return or__3824__auto____4540
        }else {
          var or__3824__auto____4541 = cljs.core._lookup["_"];
          if(or__3824__auto____4541) {
            return or__3824__auto____4541
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____4542 = o;
      if(and__3822__auto____4542) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____4542
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3824__auto____4543 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____4543) {
          return or__3824__auto____4543
        }else {
          var or__3824__auto____4544 = cljs.core._lookup["_"];
          if(or__3824__auto____4544) {
            return or__3824__auto____4544
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
void 0;
void 0;
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____4545 = coll;
    if(and__3822__auto____4545) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____4545
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____4546 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4546) {
        return or__3824__auto____4546
      }else {
        var or__3824__auto____4547 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____4547) {
          return or__3824__auto____4547
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____4548 = coll;
    if(and__3822__auto____4548) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____4548
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3824__auto____4549 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4549) {
        return or__3824__auto____4549
      }else {
        var or__3824__auto____4550 = cljs.core._assoc["_"];
        if(or__3824__auto____4550) {
          return or__3824__auto____4550
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
void 0;
void 0;
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____4551 = coll;
    if(and__3822__auto____4551) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____4551
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____4552 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4552) {
        return or__3824__auto____4552
      }else {
        var or__3824__auto____4553 = cljs.core._dissoc["_"];
        if(or__3824__auto____4553) {
          return or__3824__auto____4553
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
void 0;
void 0;
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____4554 = coll;
    if(and__3822__auto____4554) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____4554
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4555 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4555) {
        return or__3824__auto____4555
      }else {
        var or__3824__auto____4556 = cljs.core._key["_"];
        if(or__3824__auto____4556) {
          return or__3824__auto____4556
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____4557 = coll;
    if(and__3822__auto____4557) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____4557
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4558 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4558) {
        return or__3824__auto____4558
      }else {
        var or__3824__auto____4559 = cljs.core._val["_"];
        if(or__3824__auto____4559) {
          return or__3824__auto____4559
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____4560 = coll;
    if(and__3822__auto____4560) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____4560
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3824__auto____4561 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4561) {
        return or__3824__auto____4561
      }else {
        var or__3824__auto____4562 = cljs.core._disjoin["_"];
        if(or__3824__auto____4562) {
          return or__3824__auto____4562
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
void 0;
void 0;
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____4563 = coll;
    if(and__3822__auto____4563) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____4563
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4564 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4564) {
        return or__3824__auto____4564
      }else {
        var or__3824__auto____4565 = cljs.core._peek["_"];
        if(or__3824__auto____4565) {
          return or__3824__auto____4565
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____4566 = coll;
    if(and__3822__auto____4566) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____4566
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4567 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4567) {
        return or__3824__auto____4567
      }else {
        var or__3824__auto____4568 = cljs.core._pop["_"];
        if(or__3824__auto____4568) {
          return or__3824__auto____4568
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____4569 = coll;
    if(and__3822__auto____4569) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____4569
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3824__auto____4570 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4570) {
        return or__3824__auto____4570
      }else {
        var or__3824__auto____4571 = cljs.core._assoc_n["_"];
        if(or__3824__auto____4571) {
          return or__3824__auto____4571
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
void 0;
void 0;
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____4572 = o;
    if(and__3822__auto____4572) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____4572
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4573 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3824__auto____4573) {
        return or__3824__auto____4573
      }else {
        var or__3824__auto____4574 = cljs.core._deref["_"];
        if(or__3824__auto____4574) {
          return or__3824__auto____4574
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____4575 = o;
    if(and__3822__auto____4575) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____4575
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3824__auto____4576 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3824__auto____4576) {
        return or__3824__auto____4576
      }else {
        var or__3824__auto____4577 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____4577) {
          return or__3824__auto____4577
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
void 0;
void 0;
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____4578 = o;
    if(and__3822__auto____4578) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____4578
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4579 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____4579) {
        return or__3824__auto____4579
      }else {
        var or__3824__auto____4580 = cljs.core._meta["_"];
        if(or__3824__auto____4580) {
          return or__3824__auto____4580
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____4581 = o;
    if(and__3822__auto____4581) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____4581
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3824__auto____4582 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____4582) {
        return or__3824__auto____4582
      }else {
        var or__3824__auto____4583 = cljs.core._with_meta["_"];
        if(or__3824__auto____4583) {
          return or__3824__auto____4583
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
void 0;
void 0;
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____4584 = coll;
      if(and__3822__auto____4584) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____4584
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3824__auto____4585 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4585) {
          return or__3824__auto____4585
        }else {
          var or__3824__auto____4586 = cljs.core._reduce["_"];
          if(or__3824__auto____4586) {
            return or__3824__auto____4586
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____4587 = coll;
      if(and__3822__auto____4587) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____4587
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3824__auto____4588 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4588) {
          return or__3824__auto____4588
        }else {
          var or__3824__auto____4589 = cljs.core._reduce["_"];
          if(or__3824__auto____4589) {
            return or__3824__auto____4589
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
void 0;
void 0;
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____4590 = coll;
    if(and__3822__auto____4590) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____4590
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3824__auto____4591 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4591) {
        return or__3824__auto____4591
      }else {
        var or__3824__auto____4592 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____4592) {
          return or__3824__auto____4592
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
void 0;
void 0;
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____4593 = o;
    if(and__3822__auto____4593) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____4593
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3824__auto____4594 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3824__auto____4594) {
        return or__3824__auto____4594
      }else {
        var or__3824__auto____4595 = cljs.core._equiv["_"];
        if(or__3824__auto____4595) {
          return or__3824__auto____4595
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
void 0;
void 0;
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____4596 = o;
    if(and__3822__auto____4596) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____4596
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4597 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3824__auto____4597) {
        return or__3824__auto____4597
      }else {
        var or__3824__auto____4598 = cljs.core._hash["_"];
        if(or__3824__auto____4598) {
          return or__3824__auto____4598
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____4599 = o;
    if(and__3822__auto____4599) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____4599
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4600 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____4600) {
        return or__3824__auto____4600
      }else {
        var or__3824__auto____4601 = cljs.core._seq["_"];
        if(or__3824__auto____4601) {
          return or__3824__auto____4601
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISequential = {};
void 0;
void 0;
cljs.core.IList = {};
void 0;
void 0;
cljs.core.IRecord = {};
void 0;
void 0;
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____4602 = coll;
    if(and__3822__auto____4602) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____4602
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4603 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4603) {
        return or__3824__auto____4603
      }else {
        var or__3824__auto____4604 = cljs.core._rseq["_"];
        if(or__3824__auto____4604) {
          return or__3824__auto____4604
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____4605 = coll;
    if(and__3822__auto____4605) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____4605
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____4606 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4606) {
        return or__3824__auto____4606
      }else {
        var or__3824__auto____4607 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____4607) {
          return or__3824__auto____4607
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____4608 = coll;
    if(and__3822__auto____4608) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____4608
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____4609 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4609) {
        return or__3824__auto____4609
      }else {
        var or__3824__auto____4610 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____4610) {
          return or__3824__auto____4610
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____4611 = coll;
    if(and__3822__auto____4611) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____4611
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3824__auto____4612 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4612) {
        return or__3824__auto____4612
      }else {
        var or__3824__auto____4613 = cljs.core._entry_key["_"];
        if(or__3824__auto____4613) {
          return or__3824__auto____4613
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____4614 = coll;
    if(and__3822__auto____4614) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____4614
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4615 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4615) {
        return or__3824__auto____4615
      }else {
        var or__3824__auto____4616 = cljs.core._comparator["_"];
        if(or__3824__auto____4616) {
          return or__3824__auto____4616
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____4617 = o;
    if(and__3822__auto____4617) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____4617
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3824__auto____4618 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____4618) {
        return or__3824__auto____4618
      }else {
        var or__3824__auto____4619 = cljs.core._pr_seq["_"];
        if(or__3824__auto____4619) {
          return or__3824__auto____4619
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
void 0;
void 0;
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____4620 = d;
    if(and__3822__auto____4620) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____4620
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3824__auto____4621 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3824__auto____4621) {
        return or__3824__auto____4621
      }else {
        var or__3824__auto____4622 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____4622) {
          return or__3824__auto____4622
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
void 0;
void 0;
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____4623 = this$;
    if(and__3822__auto____4623) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____4623
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3824__auto____4624 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3824__auto____4624) {
        return or__3824__auto____4624
      }else {
        var or__3824__auto____4625 = cljs.core._notify_watches["_"];
        if(or__3824__auto____4625) {
          return or__3824__auto____4625
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____4626 = this$;
    if(and__3822__auto____4626) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____4626
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3824__auto____4627 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____4627) {
        return or__3824__auto____4627
      }else {
        var or__3824__auto____4628 = cljs.core._add_watch["_"];
        if(or__3824__auto____4628) {
          return or__3824__auto____4628
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____4629 = this$;
    if(and__3822__auto____4629) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____4629
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3824__auto____4630 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____4630) {
        return or__3824__auto____4630
      }else {
        var or__3824__auto____4631 = cljs.core._remove_watch["_"];
        if(or__3824__auto____4631) {
          return or__3824__auto____4631
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
void 0;
void 0;
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____4632 = coll;
    if(and__3822__auto____4632) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____4632
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4633 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4633) {
        return or__3824__auto____4633
      }else {
        var or__3824__auto____4634 = cljs.core._as_transient["_"];
        if(or__3824__auto____4634) {
          return or__3824__auto____4634
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____4635 = tcoll;
    if(and__3822__auto____4635) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____4635
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3824__auto____4636 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4636) {
        return or__3824__auto____4636
      }else {
        var or__3824__auto____4637 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____4637) {
          return or__3824__auto____4637
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____4638 = tcoll;
    if(and__3822__auto____4638) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____4638
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____4639 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4639) {
        return or__3824__auto____4639
      }else {
        var or__3824__auto____4640 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____4640) {
          return or__3824__auto____4640
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____4641 = tcoll;
    if(and__3822__auto____4641) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____4641
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3824__auto____4642 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4642) {
        return or__3824__auto____4642
      }else {
        var or__3824__auto____4643 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____4643) {
          return or__3824__auto____4643
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
void 0;
void 0;
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____4644 = tcoll;
    if(and__3822__auto____4644) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____4644
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3824__auto____4645 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4645) {
        return or__3824__auto____4645
      }else {
        var or__3824__auto____4646 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____4646) {
          return or__3824__auto____4646
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
void 0;
void 0;
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____4647 = tcoll;
    if(and__3822__auto____4647) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____4647
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3824__auto____4648 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4648) {
        return or__3824__auto____4648
      }else {
        var or__3824__auto____4649 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____4649) {
          return or__3824__auto____4649
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____4650 = tcoll;
    if(and__3822__auto____4650) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____4650
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____4651 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4651) {
        return or__3824__auto____4651
      }else {
        var or__3824__auto____4652 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____4652) {
          return or__3824__auto____4652
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____4653 = tcoll;
    if(and__3822__auto____4653) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____4653
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3824__auto____4654 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4654) {
        return or__3824__auto____4654
      }else {
        var or__3824__auto____4655 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____4655) {
          return or__3824__auto____4655
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
void 0;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
void 0;
void 0;
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____4656 = x === y;
    if(or__3824__auto____4656) {
      return or__3824__auto____4656
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__4657__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4658 = y;
            var G__4659 = cljs.core.first.call(null, more);
            var G__4660 = cljs.core.next.call(null, more);
            x = G__4658;
            y = G__4659;
            more = G__4660;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4657 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4657__delegate.call(this, x, y, more)
    };
    G__4657.cljs$lang$maxFixedArity = 2;
    G__4657.cljs$lang$applyTo = function(arglist__4661) {
      var x = cljs.core.first(arglist__4661);
      var y = cljs.core.first(cljs.core.next(arglist__4661));
      var more = cljs.core.rest(cljs.core.next(arglist__4661));
      return G__4657__delegate(x, y, more)
    };
    G__4657.cljs$lang$arity$variadic = G__4657__delegate;
    return G__4657
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(function() {
    var or__3824__auto____4662 = x == null;
    if(or__3824__auto____4662) {
      return or__3824__auto____4662
    }else {
      return void 0 === x
    }
  }()) {
    return null
  }else {
    return x.constructor
  }
};
void 0;
void 0;
void 0;
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__4663 = null;
  var G__4663__2 = function(o, k) {
    return null
  };
  var G__4663__3 = function(o, k, not_found) {
    return not_found
  };
  G__4663 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4663__2.call(this, o, k);
      case 3:
        return G__4663__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4663
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__4664 = null;
  var G__4664__2 = function(_, f) {
    return f.call(null)
  };
  var G__4664__3 = function(_, f, start) {
    return start
  };
  G__4664 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4664__2.call(this, _, f);
      case 3:
        return G__4664__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4664
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__4665 = null;
  var G__4665__2 = function(_, n) {
    return null
  };
  var G__4665__3 = function(_, n, not_found) {
    return not_found
  };
  G__4665 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4665__2.call(this, _, n);
      case 3:
        return G__4665__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4665
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
void 0;
void 0;
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    if(cljs.core._count.call(null, cicoll) === 0) {
      return f.call(null)
    }else {
      var val__4666 = cljs.core._nth.call(null, cicoll, 0);
      var n__4667 = 1;
      while(true) {
        if(n__4667 < cljs.core._count.call(null, cicoll)) {
          var nval__4668 = f.call(null, val__4666, cljs.core._nth.call(null, cicoll, n__4667));
          if(cljs.core.reduced_QMARK_.call(null, nval__4668)) {
            return cljs.core.deref.call(null, nval__4668)
          }else {
            var G__4675 = nval__4668;
            var G__4676 = n__4667 + 1;
            val__4666 = G__4675;
            n__4667 = G__4676;
            continue
          }
        }else {
          return val__4666
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__4669 = val;
    var n__4670 = 0;
    while(true) {
      if(n__4670 < cljs.core._count.call(null, cicoll)) {
        var nval__4671 = f.call(null, val__4669, cljs.core._nth.call(null, cicoll, n__4670));
        if(cljs.core.reduced_QMARK_.call(null, nval__4671)) {
          return cljs.core.deref.call(null, nval__4671)
        }else {
          var G__4677 = nval__4671;
          var G__4678 = n__4670 + 1;
          val__4669 = G__4677;
          n__4670 = G__4678;
          continue
        }
      }else {
        return val__4669
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__4672 = val;
    var n__4673 = idx;
    while(true) {
      if(n__4673 < cljs.core._count.call(null, cicoll)) {
        var nval__4674 = f.call(null, val__4672, cljs.core._nth.call(null, cicoll, n__4673));
        if(cljs.core.reduced_QMARK_.call(null, nval__4674)) {
          return cljs.core.deref.call(null, nval__4674)
        }else {
          var G__4679 = nval__4674;
          var G__4680 = n__4673 + 1;
          val__4672 = G__4679;
          n__4673 = G__4680;
          continue
        }
      }else {
        return val__4672
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
void 0;
void 0;
void 0;
void 0;
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15990906
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4681 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4682 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ASeq$ = true;
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__4683 = this;
  var this$__4684 = this;
  return cljs.core.pr_str.call(null, this$__4684)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__4685 = this;
  if(cljs.core.counted_QMARK_.call(null, this__4685.a)) {
    return cljs.core.ci_reduce.call(null, this__4685.a, f, this__4685.a[this__4685.i], this__4685.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__4685.a[this__4685.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__4686 = this;
  if(cljs.core.counted_QMARK_.call(null, this__4686.a)) {
    return cljs.core.ci_reduce.call(null, this__4686.a, f, start, this__4686.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__4687 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__4688 = this;
  return this__4688.a.length - this__4688.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__4689 = this;
  return this__4689.a[this__4689.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__4690 = this;
  if(this__4690.i + 1 < this__4690.a.length) {
    return new cljs.core.IndexedSeq(this__4690.a, this__4690.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4691 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__4692 = this;
  var i__4693 = n + this__4692.i;
  if(i__4693 < this__4692.a.length) {
    return this__4692.a[i__4693]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__4694 = this;
  var i__4695 = n + this__4694.i;
  if(i__4695 < this__4694.a.length) {
    return this__4694.a[i__4695]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__4696 = null;
  var G__4696__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__4696__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__4696 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4696__2.call(this, array, f);
      case 3:
        return G__4696__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4696
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__4697 = null;
  var G__4697__2 = function(array, k) {
    return array[k]
  };
  var G__4697__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__4697 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4697__2.call(this, array, k);
      case 3:
        return G__4697__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4697
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__4698 = null;
  var G__4698__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__4698__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__4698 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4698__2.call(this, array, n);
      case 3:
        return G__4698__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4698
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(coll != null) {
    if(function() {
      var G__4699__4700 = coll;
      if(G__4699__4700 != null) {
        if(function() {
          var or__3824__auto____4701 = G__4699__4700.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____4701) {
            return or__3824__auto____4701
          }else {
            return G__4699__4700.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__4699__4700.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4699__4700)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4699__4700)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  if(coll != null) {
    if(function() {
      var G__4702__4703 = coll;
      if(G__4702__4703 != null) {
        if(function() {
          var or__3824__auto____4704 = G__4702__4703.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____4704) {
            return or__3824__auto____4704
          }else {
            return G__4702__4703.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4702__4703.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4702__4703)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4702__4703)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__4705 = cljs.core.seq.call(null, coll);
      if(s__4705 != null) {
        return cljs.core._first.call(null, s__4705)
      }else {
        return null
      }
    }
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  if(coll != null) {
    if(function() {
      var G__4706__4707 = coll;
      if(G__4706__4707 != null) {
        if(function() {
          var or__3824__auto____4708 = G__4706__4707.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____4708) {
            return or__3824__auto____4708
          }else {
            return G__4706__4707.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4706__4707.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4706__4707)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4706__4707)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__4709 = cljs.core.seq.call(null, coll);
      if(s__4709 != null) {
        return cljs.core._rest.call(null, s__4709)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll != null) {
    if(function() {
      var G__4710__4711 = coll;
      if(G__4710__4711 != null) {
        if(function() {
          var or__3824__auto____4712 = G__4710__4711.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____4712) {
            return or__3824__auto____4712
          }else {
            return G__4710__4711.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4710__4711.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4710__4711)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4710__4711)
      }
    }()) {
      var coll__4713 = cljs.core._rest.call(null, coll);
      if(coll__4713 != null) {
        if(function() {
          var G__4714__4715 = coll__4713;
          if(G__4714__4715 != null) {
            if(function() {
              var or__3824__auto____4716 = G__4714__4715.cljs$lang$protocol_mask$partition0$ & 32;
              if(or__3824__auto____4716) {
                return or__3824__auto____4716
              }else {
                return G__4714__4715.cljs$core$ASeq$
              }
            }()) {
              return true
            }else {
              if(!G__4714__4715.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4714__4715)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4714__4715)
          }
        }()) {
          return coll__4713
        }else {
          return cljs.core._seq.call(null, coll__4713)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__4717 = cljs.core.next.call(null, s);
      s = G__4717;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__4718__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__4719 = conj.call(null, coll, x);
          var G__4720 = cljs.core.first.call(null, xs);
          var G__4721 = cljs.core.next.call(null, xs);
          coll = G__4719;
          x = G__4720;
          xs = G__4721;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__4718 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4718__delegate.call(this, coll, x, xs)
    };
    G__4718.cljs$lang$maxFixedArity = 2;
    G__4718.cljs$lang$applyTo = function(arglist__4722) {
      var coll = cljs.core.first(arglist__4722);
      var x = cljs.core.first(cljs.core.next(arglist__4722));
      var xs = cljs.core.rest(cljs.core.next(arglist__4722));
      return G__4718__delegate(coll, x, xs)
    };
    G__4718.cljs$lang$arity$variadic = G__4718__delegate;
    return G__4718
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
void 0;
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__4723 = cljs.core.seq.call(null, coll);
  var acc__4724 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__4723)) {
      return acc__4724 + cljs.core._count.call(null, s__4723)
    }else {
      var G__4725 = cljs.core.next.call(null, s__4723);
      var G__4726 = acc__4724 + 1;
      s__4723 = G__4725;
      acc__4724 = G__4726;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
void 0;
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll != null) {
      if(function() {
        var G__4727__4728 = coll;
        if(G__4727__4728 != null) {
          if(function() {
            var or__3824__auto____4729 = G__4727__4728.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____4729) {
              return or__3824__auto____4729
            }else {
              return G__4727__4728.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__4727__4728.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4727__4728)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4727__4728)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }else {
      return null
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(coll != null) {
      if(function() {
        var G__4730__4731 = coll;
        if(G__4730__4731 != null) {
          if(function() {
            var or__3824__auto____4732 = G__4730__4731.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____4732) {
              return or__3824__auto____4732
            }else {
              return G__4730__4731.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__4730__4731.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4730__4731)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4730__4731)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__4734__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__4733 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__4735 = ret__4733;
          var G__4736 = cljs.core.first.call(null, kvs);
          var G__4737 = cljs.core.second.call(null, kvs);
          var G__4738 = cljs.core.nnext.call(null, kvs);
          coll = G__4735;
          k = G__4736;
          v = G__4737;
          kvs = G__4738;
          continue
        }else {
          return ret__4733
        }
        break
      }
    };
    var G__4734 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4734__delegate.call(this, coll, k, v, kvs)
    };
    G__4734.cljs$lang$maxFixedArity = 3;
    G__4734.cljs$lang$applyTo = function(arglist__4739) {
      var coll = cljs.core.first(arglist__4739);
      var k = cljs.core.first(cljs.core.next(arglist__4739));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4739)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4739)));
      return G__4734__delegate(coll, k, v, kvs)
    };
    G__4734.cljs$lang$arity$variadic = G__4734__delegate;
    return G__4734
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__4741__delegate = function(coll, k, ks) {
      while(true) {
        var ret__4740 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4742 = ret__4740;
          var G__4743 = cljs.core.first.call(null, ks);
          var G__4744 = cljs.core.next.call(null, ks);
          coll = G__4742;
          k = G__4743;
          ks = G__4744;
          continue
        }else {
          return ret__4740
        }
        break
      }
    };
    var G__4741 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4741__delegate.call(this, coll, k, ks)
    };
    G__4741.cljs$lang$maxFixedArity = 2;
    G__4741.cljs$lang$applyTo = function(arglist__4745) {
      var coll = cljs.core.first(arglist__4745);
      var k = cljs.core.first(cljs.core.next(arglist__4745));
      var ks = cljs.core.rest(cljs.core.next(arglist__4745));
      return G__4741__delegate(coll, k, ks)
    };
    G__4741.cljs$lang$arity$variadic = G__4741__delegate;
    return G__4741
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__4746__4747 = o;
    if(G__4746__4747 != null) {
      if(function() {
        var or__3824__auto____4748 = G__4746__4747.cljs$lang$protocol_mask$partition0$ & 65536;
        if(or__3824__auto____4748) {
          return or__3824__auto____4748
        }else {
          return G__4746__4747.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__4746__4747.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4746__4747)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4746__4747)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__4750__delegate = function(coll, k, ks) {
      while(true) {
        var ret__4749 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4751 = ret__4749;
          var G__4752 = cljs.core.first.call(null, ks);
          var G__4753 = cljs.core.next.call(null, ks);
          coll = G__4751;
          k = G__4752;
          ks = G__4753;
          continue
        }else {
          return ret__4749
        }
        break
      }
    };
    var G__4750 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4750__delegate.call(this, coll, k, ks)
    };
    G__4750.cljs$lang$maxFixedArity = 2;
    G__4750.cljs$lang$applyTo = function(arglist__4754) {
      var coll = cljs.core.first(arglist__4754);
      var k = cljs.core.first(cljs.core.next(arglist__4754));
      var ks = cljs.core.rest(cljs.core.next(arglist__4754));
      return G__4750__delegate(coll, k, ks)
    };
    G__4750.cljs$lang$arity$variadic = G__4750__delegate;
    return G__4750
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4755__4756 = x;
    if(G__4755__4756 != null) {
      if(function() {
        var or__3824__auto____4757 = G__4755__4756.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____4757) {
          return or__3824__auto____4757
        }else {
          return G__4755__4756.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__4755__4756.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4755__4756)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4755__4756)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4758__4759 = x;
    if(G__4758__4759 != null) {
      if(function() {
        var or__3824__auto____4760 = G__4758__4759.cljs$lang$protocol_mask$partition0$ & 2048;
        if(or__3824__auto____4760) {
          return or__3824__auto____4760
        }else {
          return G__4758__4759.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__4758__4759.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4758__4759)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4758__4759)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__4761__4762 = x;
  if(G__4761__4762 != null) {
    if(function() {
      var or__3824__auto____4763 = G__4761__4762.cljs$lang$protocol_mask$partition0$ & 256;
      if(or__3824__auto____4763) {
        return or__3824__auto____4763
      }else {
        return G__4761__4762.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__4761__4762.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4761__4762)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4761__4762)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__4764__4765 = x;
  if(G__4764__4765 != null) {
    if(function() {
      var or__3824__auto____4766 = G__4764__4765.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____4766) {
        return or__3824__auto____4766
      }else {
        return G__4764__4765.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__4764__4765.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4764__4765)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4764__4765)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__4767__4768 = x;
  if(G__4767__4768 != null) {
    if(function() {
      var or__3824__auto____4769 = G__4767__4768.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____4769) {
        return or__3824__auto____4769
      }else {
        return G__4767__4768.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__4767__4768.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4767__4768)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4767__4768)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__4770__4771 = x;
  if(G__4770__4771 != null) {
    if(function() {
      var or__3824__auto____4772 = G__4770__4771.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____4772) {
        return or__3824__auto____4772
      }else {
        return G__4770__4771.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__4770__4771.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4770__4771)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4770__4771)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__4773__4774 = x;
  if(G__4773__4774 != null) {
    if(function() {
      var or__3824__auto____4775 = G__4773__4774.cljs$lang$protocol_mask$partition0$ & 262144;
      if(or__3824__auto____4775) {
        return or__3824__auto____4775
      }else {
        return G__4773__4774.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__4773__4774.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4773__4774)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4773__4774)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4776__4777 = x;
    if(G__4776__4777 != null) {
      if(function() {
        var or__3824__auto____4778 = G__4776__4777.cljs$lang$protocol_mask$partition0$ & 512;
        if(or__3824__auto____4778) {
          return or__3824__auto____4778
        }else {
          return G__4776__4777.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__4776__4777.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4776__4777)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4776__4777)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__4779__4780 = x;
  if(G__4779__4780 != null) {
    if(function() {
      var or__3824__auto____4781 = G__4779__4780.cljs$lang$protocol_mask$partition0$ & 8192;
      if(or__3824__auto____4781) {
        return or__3824__auto____4781
      }else {
        return G__4779__4780.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__4779__4780.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4779__4780)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4779__4780)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__4782__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__4782 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4782__delegate.call(this, keyvals)
    };
    G__4782.cljs$lang$maxFixedArity = 0;
    G__4782.cljs$lang$applyTo = function(arglist__4783) {
      var keyvals = cljs.core.seq(arglist__4783);
      return G__4782__delegate(keyvals)
    };
    G__4782.cljs$lang$arity$variadic = G__4782__delegate;
    return G__4782
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(falsecljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__4784 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__4784.push(key)
  });
  return keys__4784
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__4785 = i;
  var j__4786 = j;
  var len__4787 = len;
  while(true) {
    if(len__4787 === 0) {
      return to
    }else {
      to[j__4786] = from[i__4785];
      var G__4788 = i__4785 + 1;
      var G__4789 = j__4786 + 1;
      var G__4790 = len__4787 - 1;
      i__4785 = G__4788;
      j__4786 = G__4789;
      len__4787 = G__4790;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__4791 = i + (len - 1);
  var j__4792 = j + (len - 1);
  var len__4793 = len;
  while(true) {
    if(len__4793 === 0) {
      return to
    }else {
      to[j__4792] = from[i__4791];
      var G__4794 = i__4791 - 1;
      var G__4795 = j__4792 - 1;
      var G__4796 = len__4793 - 1;
      i__4791 = G__4794;
      j__4792 = G__4795;
      len__4793 = G__4796;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__4797__4798 = s;
    if(G__4797__4798 != null) {
      if(function() {
        var or__3824__auto____4799 = G__4797__4798.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____4799) {
          return or__3824__auto____4799
        }else {
          return G__4797__4798.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__4797__4798.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4797__4798)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4797__4798)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__4800__4801 = s;
  if(G__4800__4801 != null) {
    if(function() {
      var or__3824__auto____4802 = G__4800__4801.cljs$lang$protocol_mask$partition0$ & 4194304;
      if(or__3824__auto____4802) {
        return or__3824__auto____4802
      }else {
        return G__4800__4801.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__4800__4801.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4800__4801)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4800__4801)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____4803 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____4803)) {
    return cljs.core.not.call(null, function() {
      var or__3824__auto____4804 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____4804) {
        return or__3824__auto____4804
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3822__auto____4803
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____4805 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____4805)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____4805
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____4806 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____4806)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____4806
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____4807 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____4807) {
    return or__3824__auto____4807
  }else {
    var G__4808__4809 = f;
    if(G__4808__4809 != null) {
      if(function() {
        var or__3824__auto____4810 = G__4808__4809.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____4810) {
          return or__3824__auto____4810
        }else {
          return G__4808__4809.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__4808__4809.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4808__4809)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4808__4809)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____4811 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____4811) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____4811
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____4812 = coll;
    if(cljs.core.truth_(and__3822__auto____4812)) {
      var and__3822__auto____4813 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____4813) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____4813
      }
    }else {
      return and__3822__auto____4812
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___3 = function() {
    var G__4818__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__4814 = cljs.core.set([y, x]);
        var xs__4815 = more;
        while(true) {
          var x__4816 = cljs.core.first.call(null, xs__4815);
          var etc__4817 = cljs.core.next.call(null, xs__4815);
          if(cljs.core.truth_(xs__4815)) {
            if(cljs.core.contains_QMARK_.call(null, s__4814, x__4816)) {
              return false
            }else {
              var G__4819 = cljs.core.conj.call(null, s__4814, x__4816);
              var G__4820 = etc__4817;
              s__4814 = G__4819;
              xs__4815 = G__4820;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__4818 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4818__delegate.call(this, x, y, more)
    };
    G__4818.cljs$lang$maxFixedArity = 2;
    G__4818.cljs$lang$applyTo = function(arglist__4821) {
      var x = cljs.core.first(arglist__4821);
      var y = cljs.core.first(cljs.core.next(arglist__4821));
      var more = cljs.core.rest(cljs.core.next(arglist__4821));
      return G__4818__delegate(x, y, more)
    };
    G__4818.cljs$lang$arity$variadic = G__4818__delegate;
    return G__4818
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
    return goog.array.defaultCompare.call(null, x, y)
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if("\ufdd0'else") {
          throw new Error("compare on non-nil objects of different types");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__4822 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__4822)) {
        return r__4822
      }else {
        if(cljs.core.truth_(r__4822)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
void 0;
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__4823 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__4823, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__4823)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____4824 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3971__auto____4824)) {
      var s__4825 = temp__3971__auto____4824;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__4825), cljs.core.next.call(null, s__4825))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__4826 = val;
    var coll__4827 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__4827)) {
        var nval__4828 = f.call(null, val__4826, cljs.core.first.call(null, coll__4827));
        if(cljs.core.reduced_QMARK_.call(null, nval__4828)) {
          return cljs.core.deref.call(null, nval__4828)
        }else {
          var G__4829 = nval__4828;
          var G__4830 = cljs.core.next.call(null, coll__4827);
          val__4826 = G__4829;
          coll__4827 = G__4830;
          continue
        }
      }else {
        return val__4826
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__4831__4832 = coll;
      if(G__4831__4832 != null) {
        if(function() {
          var or__3824__auto____4833 = G__4831__4832.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____4833) {
            return or__3824__auto____4833
          }else {
            return G__4831__4832.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__4831__4832.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4831__4832)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4831__4832)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__4834__4835 = coll;
      if(G__4834__4835 != null) {
        if(function() {
          var or__3824__auto____4836 = G__4834__4835.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____4836) {
            return or__3824__auto____4836
          }else {
            return G__4834__4835.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__4834__4835.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4834__4835)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4834__4835)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16384
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$ = true;
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__4837 = this;
  return this__4837.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__4838__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__4838 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4838__delegate.call(this, x, y, more)
    };
    G__4838.cljs$lang$maxFixedArity = 2;
    G__4838.cljs$lang$applyTo = function(arglist__4839) {
      var x = cljs.core.first(arglist__4839);
      var y = cljs.core.first(cljs.core.next(arglist__4839));
      var more = cljs.core.rest(cljs.core.next(arglist__4839));
      return G__4838__delegate(x, y, more)
    };
    G__4838.cljs$lang$arity$variadic = G__4838__delegate;
    return G__4838
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__4840__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__4840 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4840__delegate.call(this, x, y, more)
    };
    G__4840.cljs$lang$maxFixedArity = 2;
    G__4840.cljs$lang$applyTo = function(arglist__4841) {
      var x = cljs.core.first(arglist__4841);
      var y = cljs.core.first(cljs.core.next(arglist__4841));
      var more = cljs.core.rest(cljs.core.next(arglist__4841));
      return G__4840__delegate(x, y, more)
    };
    G__4840.cljs$lang$arity$variadic = G__4840__delegate;
    return G__4840
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__4842__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__4842 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4842__delegate.call(this, x, y, more)
    };
    G__4842.cljs$lang$maxFixedArity = 2;
    G__4842.cljs$lang$applyTo = function(arglist__4843) {
      var x = cljs.core.first(arglist__4843);
      var y = cljs.core.first(cljs.core.next(arglist__4843));
      var more = cljs.core.rest(cljs.core.next(arglist__4843));
      return G__4842__delegate(x, y, more)
    };
    G__4842.cljs$lang$arity$variadic = G__4842__delegate;
    return G__4842
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__4844__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__4844 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4844__delegate.call(this, x, y, more)
    };
    G__4844.cljs$lang$maxFixedArity = 2;
    G__4844.cljs$lang$applyTo = function(arglist__4845) {
      var x = cljs.core.first(arglist__4845);
      var y = cljs.core.first(cljs.core.next(arglist__4845));
      var more = cljs.core.rest(cljs.core.next(arglist__4845));
      return G__4844__delegate(x, y, more)
    };
    G__4844.cljs$lang$arity$variadic = G__4844__delegate;
    return G__4844
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__4846__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4847 = y;
            var G__4848 = cljs.core.first.call(null, more);
            var G__4849 = cljs.core.next.call(null, more);
            x = G__4847;
            y = G__4848;
            more = G__4849;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4846 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4846__delegate.call(this, x, y, more)
    };
    G__4846.cljs$lang$maxFixedArity = 2;
    G__4846.cljs$lang$applyTo = function(arglist__4850) {
      var x = cljs.core.first(arglist__4850);
      var y = cljs.core.first(cljs.core.next(arglist__4850));
      var more = cljs.core.rest(cljs.core.next(arglist__4850));
      return G__4846__delegate(x, y, more)
    };
    G__4846.cljs$lang$arity$variadic = G__4846__delegate;
    return G__4846
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__4851__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4852 = y;
            var G__4853 = cljs.core.first.call(null, more);
            var G__4854 = cljs.core.next.call(null, more);
            x = G__4852;
            y = G__4853;
            more = G__4854;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4851 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4851__delegate.call(this, x, y, more)
    };
    G__4851.cljs$lang$maxFixedArity = 2;
    G__4851.cljs$lang$applyTo = function(arglist__4855) {
      var x = cljs.core.first(arglist__4855);
      var y = cljs.core.first(cljs.core.next(arglist__4855));
      var more = cljs.core.rest(cljs.core.next(arglist__4855));
      return G__4851__delegate(x, y, more)
    };
    G__4851.cljs$lang$arity$variadic = G__4851__delegate;
    return G__4851
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__4856__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4857 = y;
            var G__4858 = cljs.core.first.call(null, more);
            var G__4859 = cljs.core.next.call(null, more);
            x = G__4857;
            y = G__4858;
            more = G__4859;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4856 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4856__delegate.call(this, x, y, more)
    };
    G__4856.cljs$lang$maxFixedArity = 2;
    G__4856.cljs$lang$applyTo = function(arglist__4860) {
      var x = cljs.core.first(arglist__4860);
      var y = cljs.core.first(cljs.core.next(arglist__4860));
      var more = cljs.core.rest(cljs.core.next(arglist__4860));
      return G__4856__delegate(x, y, more)
    };
    G__4856.cljs$lang$arity$variadic = G__4856__delegate;
    return G__4856
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__4861__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4862 = y;
            var G__4863 = cljs.core.first.call(null, more);
            var G__4864 = cljs.core.next.call(null, more);
            x = G__4862;
            y = G__4863;
            more = G__4864;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4861 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4861__delegate.call(this, x, y, more)
    };
    G__4861.cljs$lang$maxFixedArity = 2;
    G__4861.cljs$lang$applyTo = function(arglist__4865) {
      var x = cljs.core.first(arglist__4865);
      var y = cljs.core.first(cljs.core.next(arglist__4865));
      var more = cljs.core.rest(cljs.core.next(arglist__4865));
      return G__4861__delegate(x, y, more)
    };
    G__4861.cljs$lang$arity$variadic = G__4861__delegate;
    return G__4861
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__4866__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__4866 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4866__delegate.call(this, x, y, more)
    };
    G__4866.cljs$lang$maxFixedArity = 2;
    G__4866.cljs$lang$applyTo = function(arglist__4867) {
      var x = cljs.core.first(arglist__4867);
      var y = cljs.core.first(cljs.core.next(arglist__4867));
      var more = cljs.core.rest(cljs.core.next(arglist__4867));
      return G__4866__delegate(x, y, more)
    };
    G__4866.cljs$lang$arity$variadic = G__4866__delegate;
    return G__4866
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__4868__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__4868 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4868__delegate.call(this, x, y, more)
    };
    G__4868.cljs$lang$maxFixedArity = 2;
    G__4868.cljs$lang$applyTo = function(arglist__4869) {
      var x = cljs.core.first(arglist__4869);
      var y = cljs.core.first(cljs.core.next(arglist__4869));
      var more = cljs.core.rest(cljs.core.next(arglist__4869));
      return G__4868__delegate(x, y, more)
    };
    G__4868.cljs$lang$arity$variadic = G__4868__delegate;
    return G__4868
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__4870 = n % d;
  return cljs.core.fix.call(null, (n - rem__4870) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__4871 = cljs.core.quot.call(null, n, d);
  return n - d * q__4871
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(n) {
  var c__4872 = 0;
  var n__4873 = n;
  while(true) {
    if(n__4873 === 0) {
      return c__4872
    }else {
      var G__4874 = c__4872 + 1;
      var G__4875 = n__4873 & n__4873 - 1;
      c__4872 = G__4874;
      n__4873 = G__4875;
      continue
    }
    break
  }
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__4876__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4877 = y;
            var G__4878 = cljs.core.first.call(null, more);
            var G__4879 = cljs.core.next.call(null, more);
            x = G__4877;
            y = G__4878;
            more = G__4879;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4876 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4876__delegate.call(this, x, y, more)
    };
    G__4876.cljs$lang$maxFixedArity = 2;
    G__4876.cljs$lang$applyTo = function(arglist__4880) {
      var x = cljs.core.first(arglist__4880);
      var y = cljs.core.first(cljs.core.next(arglist__4880));
      var more = cljs.core.rest(cljs.core.next(arglist__4880));
      return G__4876__delegate(x, y, more)
    };
    G__4876.cljs$lang$arity$variadic = G__4876__delegate;
    return G__4876
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__4881 = n;
  var xs__4882 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____4883 = xs__4882;
      if(cljs.core.truth_(and__3822__auto____4883)) {
        return n__4881 > 0
      }else {
        return and__3822__auto____4883
      }
    }())) {
      var G__4884 = n__4881 - 1;
      var G__4885 = cljs.core.next.call(null, xs__4882);
      n__4881 = G__4884;
      xs__4882 = G__4885;
      continue
    }else {
      return xs__4882
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__4886__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__4887 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__4888 = cljs.core.next.call(null, more);
            sb = G__4887;
            more = G__4888;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__4886 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4886__delegate.call(this, x, ys)
    };
    G__4886.cljs$lang$maxFixedArity = 1;
    G__4886.cljs$lang$applyTo = function(arglist__4889) {
      var x = cljs.core.first(arglist__4889);
      var ys = cljs.core.rest(arglist__4889);
      return G__4886__delegate(x, ys)
    };
    G__4886.cljs$lang$arity$variadic = G__4886__delegate;
    return G__4886
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__4890__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__4891 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__4892 = cljs.core.next.call(null, more);
            sb = G__4891;
            more = G__4892;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__4890 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4890__delegate.call(this, x, ys)
    };
    G__4890.cljs$lang$maxFixedArity = 1;
    G__4890.cljs$lang$applyTo = function(arglist__4893) {
      var x = cljs.core.first(arglist__4893);
      var ys = cljs.core.rest(arglist__4893);
      return G__4890__delegate(x, ys)
    };
    G__4890.cljs$lang$arity$variadic = G__4890__delegate;
    return G__4890
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__4894 = cljs.core.seq.call(null, x);
    var ys__4895 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__4894 == null) {
        return ys__4895 == null
      }else {
        if(ys__4895 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__4894), cljs.core.first.call(null, ys__4895))) {
            var G__4896 = cljs.core.next.call(null, xs__4894);
            var G__4897 = cljs.core.next.call(null, ys__4895);
            xs__4894 = G__4896;
            ys__4895 = G__4897;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__4898_SHARP_, p2__4899_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__4898_SHARP_, cljs.core.hash.call(null, p2__4899_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__4900 = 0;
  var s__4901 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__4901)) {
      var e__4902 = cljs.core.first.call(null, s__4901);
      var G__4903 = (h__4900 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__4902)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__4902)))) % 4503599627370496;
      var G__4904 = cljs.core.next.call(null, s__4901);
      h__4900 = G__4903;
      s__4901 = G__4904;
      continue
    }else {
      return h__4900
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__4905 = 0;
  var s__4906 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__4906)) {
      var e__4907 = cljs.core.first.call(null, s__4906);
      var G__4908 = (h__4905 + cljs.core.hash.call(null, e__4907)) % 4503599627370496;
      var G__4909 = cljs.core.next.call(null, s__4906);
      h__4905 = G__4908;
      s__4906 = G__4909;
      continue
    }else {
      return h__4905
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__4910__4911 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__4910__4911)) {
    var G__4913__4915 = cljs.core.first.call(null, G__4910__4911);
    var vec__4914__4916 = G__4913__4915;
    var key_name__4917 = cljs.core.nth.call(null, vec__4914__4916, 0, null);
    var f__4918 = cljs.core.nth.call(null, vec__4914__4916, 1, null);
    var G__4910__4919 = G__4910__4911;
    var G__4913__4920 = G__4913__4915;
    var G__4910__4921 = G__4910__4919;
    while(true) {
      var vec__4922__4923 = G__4913__4920;
      var key_name__4924 = cljs.core.nth.call(null, vec__4922__4923, 0, null);
      var f__4925 = cljs.core.nth.call(null, vec__4922__4923, 1, null);
      var G__4910__4926 = G__4910__4921;
      var str_name__4927 = cljs.core.name.call(null, key_name__4924);
      obj[str_name__4927] = f__4925;
      var temp__3974__auto____4928 = cljs.core.next.call(null, G__4910__4926);
      if(cljs.core.truth_(temp__3974__auto____4928)) {
        var G__4910__4929 = temp__3974__auto____4928;
        var G__4930 = cljs.core.first.call(null, G__4910__4929);
        var G__4931 = G__4910__4929;
        G__4913__4920 = G__4930;
        G__4910__4921 = G__4931;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706670
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4932 = this;
  var h__364__auto____4933 = this__4932.__hash;
  if(h__364__auto____4933 != null) {
    return h__364__auto____4933
  }else {
    var h__364__auto____4934 = cljs.core.hash_coll.call(null, coll);
    this__4932.__hash = h__364__auto____4934;
    return h__364__auto____4934
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4935 = this;
  return new cljs.core.List(this__4935.meta, o, coll, this__4935.count + 1, null)
};
cljs.core.List.prototype.cljs$core$ASeq$ = true;
cljs.core.List.prototype.toString = function() {
  var this__4936 = this;
  var this$__4937 = this;
  return cljs.core.pr_str.call(null, this$__4937)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4938 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__4939 = this;
  return this__4939.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__4940 = this;
  return this__4940.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__4941 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4942 = this;
  return this__4942.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4943 = this;
  return this__4943.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4944 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4945 = this;
  return new cljs.core.List(meta, this__4945.first, this__4945.rest, this__4945.count, this__4945.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4946 = this;
  return this__4946.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4947 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List.prototype.cljs$core$IList$ = true;
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706638
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4948 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4949 = this;
  return new cljs.core.List(this__4949.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__4950 = this;
  var this$__4951 = this;
  return cljs.core.pr_str.call(null, this$__4951)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4952 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__4953 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__4954 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__4955 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4956 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4957 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4958 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4959 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4960 = this;
  return this__4960.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4961 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__4962__4963 = coll;
  if(G__4962__4963 != null) {
    if(function() {
      var or__3824__auto____4964 = G__4962__4963.cljs$lang$protocol_mask$partition0$ & 67108864;
      if(or__3824__auto____4964) {
        return or__3824__auto____4964
      }else {
        return G__4962__4963.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__4962__4963.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__4962__4963)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__4962__4963)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__4965) {
    var items = cljs.core.seq(arglist__4965);
    return list__delegate(items)
  };
  list.cljs$lang$arity$variadic = list__delegate;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32702572
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4966 = this;
  var h__364__auto____4967 = this__4966.__hash;
  if(h__364__auto____4967 != null) {
    return h__364__auto____4967
  }else {
    var h__364__auto____4968 = cljs.core.hash_coll.call(null, coll);
    this__4966.__hash = h__364__auto____4968;
    return h__364__auto____4968
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4969 = this;
  return new cljs.core.Cons(null, o, coll, this__4969.__hash)
};
cljs.core.Cons.prototype.cljs$core$ASeq$ = true;
cljs.core.Cons.prototype.toString = function() {
  var this__4970 = this;
  var this$__4971 = this;
  return cljs.core.pr_str.call(null, this$__4971)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4972 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4973 = this;
  return this__4973.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4974 = this;
  if(this__4974.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__4974.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4975 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4976 = this;
  return new cljs.core.Cons(meta, this__4976.first, this__4976.rest, this__4976.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4977 = this;
  return this__4977.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4978 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__4978.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____4979 = coll == null;
    if(or__3824__auto____4979) {
      return or__3824__auto____4979
    }else {
      var G__4980__4981 = coll;
      if(G__4980__4981 != null) {
        if(function() {
          var or__3824__auto____4982 = G__4980__4981.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____4982) {
            return or__3824__auto____4982
          }else {
            return G__4980__4981.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4980__4981.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4980__4981)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4980__4981)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__4983__4984 = x;
  if(G__4983__4984 != null) {
    if(function() {
      var or__3824__auto____4985 = G__4983__4984.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____4985) {
        return or__3824__auto____4985
      }else {
        return G__4983__4984.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__4983__4984.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__4983__4984)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__4983__4984)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__4986 = null;
  var G__4986__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__4986__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__4986 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4986__2.call(this, string, f);
      case 3:
        return G__4986__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4986
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__4987 = null;
  var G__4987__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__4987__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__4987 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4987__2.call(this, string, k);
      case 3:
        return G__4987__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4987
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__4988 = null;
  var G__4988__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__4988__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__4988 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4988__2.call(this, string, n);
      case 3:
        return G__4988__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4988
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__4997 = null;
  var G__4997__2 = function(tsym4991, coll) {
    var tsym4991__4993 = this;
    var this$__4994 = tsym4991__4993;
    return cljs.core.get.call(null, coll, this$__4994.toString())
  };
  var G__4997__3 = function(tsym4992, coll, not_found) {
    var tsym4992__4995 = this;
    var this$__4996 = tsym4992__4995;
    return cljs.core.get.call(null, coll, this$__4996.toString(), not_found)
  };
  G__4997 = function(tsym4992, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4997__2.call(this, tsym4992, coll);
      case 3:
        return G__4997__3.call(this, tsym4992, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4997
}();
String.prototype.apply = function(tsym4989, args4990) {
  return tsym4989.call.apply(tsym4989, [tsym4989].concat(cljs.core.aclone.call(null, args4990)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__4998 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__4998
  }else {
    lazy_seq.x = x__4998.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4999 = this;
  var h__364__auto____5000 = this__4999.__hash;
  if(h__364__auto____5000 != null) {
    return h__364__auto____5000
  }else {
    var h__364__auto____5001 = cljs.core.hash_coll.call(null, coll);
    this__4999.__hash = h__364__auto____5001;
    return h__364__auto____5001
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5002 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__5003 = this;
  var this$__5004 = this;
  return cljs.core.pr_str.call(null, this$__5004)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5005 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5006 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5007 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5008 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5009 = this;
  return new cljs.core.LazySeq(meta, this__5009.realized, this__5009.x, this__5009.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5010 = this;
  return this__5010.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5011 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5011.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__5012 = [];
  var s__5013 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__5013))) {
      ary__5012.push(cljs.core.first.call(null, s__5013));
      var G__5014 = cljs.core.next.call(null, s__5013);
      s__5013 = G__5014;
      continue
    }else {
      return ary__5012
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__5015 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__5016 = 0;
  var xs__5017 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__5017)) {
      ret__5015[i__5016] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__5017));
      var G__5018 = i__5016 + 1;
      var G__5019 = cljs.core.next.call(null, xs__5017);
      i__5016 = G__5018;
      xs__5017 = G__5019;
      continue
    }else {
    }
    break
  }
  return ret__5015
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__5020 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5021 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5022 = 0;
      var s__5023 = s__5021;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____5024 = s__5023;
          if(cljs.core.truth_(and__3822__auto____5024)) {
            return i__5022 < size
          }else {
            return and__3822__auto____5024
          }
        }())) {
          a__5020[i__5022] = cljs.core.first.call(null, s__5023);
          var G__5027 = i__5022 + 1;
          var G__5028 = cljs.core.next.call(null, s__5023);
          i__5022 = G__5027;
          s__5023 = G__5028;
          continue
        }else {
          return a__5020
        }
        break
      }
    }else {
      var n__685__auto____5025 = size;
      var i__5026 = 0;
      while(true) {
        if(i__5026 < n__685__auto____5025) {
          a__5020[i__5026] = init_val_or_seq;
          var G__5029 = i__5026 + 1;
          i__5026 = G__5029;
          continue
        }else {
        }
        break
      }
      return a__5020
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__5030 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5031 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5032 = 0;
      var s__5033 = s__5031;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____5034 = s__5033;
          if(cljs.core.truth_(and__3822__auto____5034)) {
            return i__5032 < size
          }else {
            return and__3822__auto____5034
          }
        }())) {
          a__5030[i__5032] = cljs.core.first.call(null, s__5033);
          var G__5037 = i__5032 + 1;
          var G__5038 = cljs.core.next.call(null, s__5033);
          i__5032 = G__5037;
          s__5033 = G__5038;
          continue
        }else {
          return a__5030
        }
        break
      }
    }else {
      var n__685__auto____5035 = size;
      var i__5036 = 0;
      while(true) {
        if(i__5036 < n__685__auto____5035) {
          a__5030[i__5036] = init_val_or_seq;
          var G__5039 = i__5036 + 1;
          i__5036 = G__5039;
          continue
        }else {
        }
        break
      }
      return a__5030
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__5040 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5041 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5042 = 0;
      var s__5043 = s__5041;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____5044 = s__5043;
          if(cljs.core.truth_(and__3822__auto____5044)) {
            return i__5042 < size
          }else {
            return and__3822__auto____5044
          }
        }())) {
          a__5040[i__5042] = cljs.core.first.call(null, s__5043);
          var G__5047 = i__5042 + 1;
          var G__5048 = cljs.core.next.call(null, s__5043);
          i__5042 = G__5047;
          s__5043 = G__5048;
          continue
        }else {
          return a__5040
        }
        break
      }
    }else {
      var n__685__auto____5045 = size;
      var i__5046 = 0;
      while(true) {
        if(i__5046 < n__685__auto____5045) {
          a__5040[i__5046] = init_val_or_seq;
          var G__5049 = i__5046 + 1;
          i__5046 = G__5049;
          continue
        }else {
        }
        break
      }
      return a__5040
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__5050 = s;
    var i__5051 = n;
    var sum__5052 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____5053 = i__5051 > 0;
        if(and__3822__auto____5053) {
          return cljs.core.seq.call(null, s__5050)
        }else {
          return and__3822__auto____5053
        }
      }())) {
        var G__5054 = cljs.core.next.call(null, s__5050);
        var G__5055 = i__5051 - 1;
        var G__5056 = sum__5052 + 1;
        s__5050 = G__5054;
        i__5051 = G__5055;
        sum__5052 = G__5056;
        continue
      }else {
        return sum__5052
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__5057 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__5057)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5057), concat.call(null, cljs.core.rest.call(null, s__5057), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__5060__delegate = function(x, y, zs) {
      var cat__5059 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__5058 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__5058)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__5058), cat.call(null, cljs.core.rest.call(null, xys__5058), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__5059.call(null, concat.call(null, x, y), zs)
    };
    var G__5060 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5060__delegate.call(this, x, y, zs)
    };
    G__5060.cljs$lang$maxFixedArity = 2;
    G__5060.cljs$lang$applyTo = function(arglist__5061) {
      var x = cljs.core.first(arglist__5061);
      var y = cljs.core.first(cljs.core.next(arglist__5061));
      var zs = cljs.core.rest(cljs.core.next(arglist__5061));
      return G__5060__delegate(x, y, zs)
    };
    G__5060.cljs$lang$arity$variadic = G__5060__delegate;
    return G__5060
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__5062__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__5062 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5062__delegate.call(this, a, b, c, d, more)
    };
    G__5062.cljs$lang$maxFixedArity = 4;
    G__5062.cljs$lang$applyTo = function(arglist__5063) {
      var a = cljs.core.first(arglist__5063);
      var b = cljs.core.first(cljs.core.next(arglist__5063));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5063)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5063))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5063))));
      return G__5062__delegate(a, b, c, d, more)
    };
    G__5062.cljs$lang$arity$variadic = G__5062__delegate;
    return G__5062
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
void 0;
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__5064 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__5065 = cljs.core._first.call(null, args__5064);
    var args__5066 = cljs.core._rest.call(null, args__5064);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__5065)
      }else {
        return f.call(null, a__5065)
      }
    }else {
      var b__5067 = cljs.core._first.call(null, args__5066);
      var args__5068 = cljs.core._rest.call(null, args__5066);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__5065, b__5067)
        }else {
          return f.call(null, a__5065, b__5067)
        }
      }else {
        var c__5069 = cljs.core._first.call(null, args__5068);
        var args__5070 = cljs.core._rest.call(null, args__5068);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__5065, b__5067, c__5069)
          }else {
            return f.call(null, a__5065, b__5067, c__5069)
          }
        }else {
          var d__5071 = cljs.core._first.call(null, args__5070);
          var args__5072 = cljs.core._rest.call(null, args__5070);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__5065, b__5067, c__5069, d__5071)
            }else {
              return f.call(null, a__5065, b__5067, c__5069, d__5071)
            }
          }else {
            var e__5073 = cljs.core._first.call(null, args__5072);
            var args__5074 = cljs.core._rest.call(null, args__5072);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__5065, b__5067, c__5069, d__5071, e__5073)
              }else {
                return f.call(null, a__5065, b__5067, c__5069, d__5071, e__5073)
              }
            }else {
              var f__5075 = cljs.core._first.call(null, args__5074);
              var args__5076 = cljs.core._rest.call(null, args__5074);
              if(argc === 6) {
                if(f__5075.cljs$lang$arity$6) {
                  return f__5075.cljs$lang$arity$6(a__5065, b__5067, c__5069, d__5071, e__5073, f__5075)
                }else {
                  return f__5075.call(null, a__5065, b__5067, c__5069, d__5071, e__5073, f__5075)
                }
              }else {
                var g__5077 = cljs.core._first.call(null, args__5076);
                var args__5078 = cljs.core._rest.call(null, args__5076);
                if(argc === 7) {
                  if(f__5075.cljs$lang$arity$7) {
                    return f__5075.cljs$lang$arity$7(a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077)
                  }else {
                    return f__5075.call(null, a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077)
                  }
                }else {
                  var h__5079 = cljs.core._first.call(null, args__5078);
                  var args__5080 = cljs.core._rest.call(null, args__5078);
                  if(argc === 8) {
                    if(f__5075.cljs$lang$arity$8) {
                      return f__5075.cljs$lang$arity$8(a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079)
                    }else {
                      return f__5075.call(null, a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079)
                    }
                  }else {
                    var i__5081 = cljs.core._first.call(null, args__5080);
                    var args__5082 = cljs.core._rest.call(null, args__5080);
                    if(argc === 9) {
                      if(f__5075.cljs$lang$arity$9) {
                        return f__5075.cljs$lang$arity$9(a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081)
                      }else {
                        return f__5075.call(null, a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081)
                      }
                    }else {
                      var j__5083 = cljs.core._first.call(null, args__5082);
                      var args__5084 = cljs.core._rest.call(null, args__5082);
                      if(argc === 10) {
                        if(f__5075.cljs$lang$arity$10) {
                          return f__5075.cljs$lang$arity$10(a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083)
                        }else {
                          return f__5075.call(null, a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083)
                        }
                      }else {
                        var k__5085 = cljs.core._first.call(null, args__5084);
                        var args__5086 = cljs.core._rest.call(null, args__5084);
                        if(argc === 11) {
                          if(f__5075.cljs$lang$arity$11) {
                            return f__5075.cljs$lang$arity$11(a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085)
                          }else {
                            return f__5075.call(null, a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085)
                          }
                        }else {
                          var l__5087 = cljs.core._first.call(null, args__5086);
                          var args__5088 = cljs.core._rest.call(null, args__5086);
                          if(argc === 12) {
                            if(f__5075.cljs$lang$arity$12) {
                              return f__5075.cljs$lang$arity$12(a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085, l__5087)
                            }else {
                              return f__5075.call(null, a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085, l__5087)
                            }
                          }else {
                            var m__5089 = cljs.core._first.call(null, args__5088);
                            var args__5090 = cljs.core._rest.call(null, args__5088);
                            if(argc === 13) {
                              if(f__5075.cljs$lang$arity$13) {
                                return f__5075.cljs$lang$arity$13(a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085, l__5087, m__5089)
                              }else {
                                return f__5075.call(null, a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085, l__5087, m__5089)
                              }
                            }else {
                              var n__5091 = cljs.core._first.call(null, args__5090);
                              var args__5092 = cljs.core._rest.call(null, args__5090);
                              if(argc === 14) {
                                if(f__5075.cljs$lang$arity$14) {
                                  return f__5075.cljs$lang$arity$14(a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085, l__5087, m__5089, n__5091)
                                }else {
                                  return f__5075.call(null, a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085, l__5087, m__5089, n__5091)
                                }
                              }else {
                                var o__5093 = cljs.core._first.call(null, args__5092);
                                var args__5094 = cljs.core._rest.call(null, args__5092);
                                if(argc === 15) {
                                  if(f__5075.cljs$lang$arity$15) {
                                    return f__5075.cljs$lang$arity$15(a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085, l__5087, m__5089, n__5091, o__5093)
                                  }else {
                                    return f__5075.call(null, a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085, l__5087, m__5089, n__5091, o__5093)
                                  }
                                }else {
                                  var p__5095 = cljs.core._first.call(null, args__5094);
                                  var args__5096 = cljs.core._rest.call(null, args__5094);
                                  if(argc === 16) {
                                    if(f__5075.cljs$lang$arity$16) {
                                      return f__5075.cljs$lang$arity$16(a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085, l__5087, m__5089, n__5091, o__5093, p__5095)
                                    }else {
                                      return f__5075.call(null, a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085, l__5087, m__5089, n__5091, o__5093, p__5095)
                                    }
                                  }else {
                                    var q__5097 = cljs.core._first.call(null, args__5096);
                                    var args__5098 = cljs.core._rest.call(null, args__5096);
                                    if(argc === 17) {
                                      if(f__5075.cljs$lang$arity$17) {
                                        return f__5075.cljs$lang$arity$17(a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085, l__5087, m__5089, n__5091, o__5093, p__5095, q__5097)
                                      }else {
                                        return f__5075.call(null, a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085, l__5087, m__5089, n__5091, o__5093, p__5095, q__5097)
                                      }
                                    }else {
                                      var r__5099 = cljs.core._first.call(null, args__5098);
                                      var args__5100 = cljs.core._rest.call(null, args__5098);
                                      if(argc === 18) {
                                        if(f__5075.cljs$lang$arity$18) {
                                          return f__5075.cljs$lang$arity$18(a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085, l__5087, m__5089, n__5091, o__5093, p__5095, q__5097, r__5099)
                                        }else {
                                          return f__5075.call(null, a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085, l__5087, m__5089, n__5091, o__5093, p__5095, q__5097, r__5099)
                                        }
                                      }else {
                                        var s__5101 = cljs.core._first.call(null, args__5100);
                                        var args__5102 = cljs.core._rest.call(null, args__5100);
                                        if(argc === 19) {
                                          if(f__5075.cljs$lang$arity$19) {
                                            return f__5075.cljs$lang$arity$19(a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085, l__5087, m__5089, n__5091, o__5093, p__5095, q__5097, r__5099, s__5101)
                                          }else {
                                            return f__5075.call(null, a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085, l__5087, m__5089, n__5091, o__5093, p__5095, q__5097, r__5099, s__5101)
                                          }
                                        }else {
                                          var t__5103 = cljs.core._first.call(null, args__5102);
                                          var args__5104 = cljs.core._rest.call(null, args__5102);
                                          if(argc === 20) {
                                            if(f__5075.cljs$lang$arity$20) {
                                              return f__5075.cljs$lang$arity$20(a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085, l__5087, m__5089, n__5091, o__5093, p__5095, q__5097, r__5099, s__5101, t__5103)
                                            }else {
                                              return f__5075.call(null, a__5065, b__5067, c__5069, d__5071, e__5073, f__5075, g__5077, h__5079, i__5081, j__5083, k__5085, l__5087, m__5089, n__5091, o__5093, p__5095, q__5097, r__5099, s__5101, t__5103)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
void 0;
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__5105 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5106 = cljs.core.bounded_count.call(null, args, fixed_arity__5105 + 1);
      if(bc__5106 <= fixed_arity__5105) {
        return cljs.core.apply_to.call(null, f, bc__5106, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__5107 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__5108 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5109 = cljs.core.bounded_count.call(null, arglist__5107, fixed_arity__5108 + 1);
      if(bc__5109 <= fixed_arity__5108) {
        return cljs.core.apply_to.call(null, f, bc__5109, arglist__5107)
      }else {
        return f.cljs$lang$applyTo(arglist__5107)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5107))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__5110 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__5111 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5112 = cljs.core.bounded_count.call(null, arglist__5110, fixed_arity__5111 + 1);
      if(bc__5112 <= fixed_arity__5111) {
        return cljs.core.apply_to.call(null, f, bc__5112, arglist__5110)
      }else {
        return f.cljs$lang$applyTo(arglist__5110)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5110))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__5113 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__5114 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5115 = cljs.core.bounded_count.call(null, arglist__5113, fixed_arity__5114 + 1);
      if(bc__5115 <= fixed_arity__5114) {
        return cljs.core.apply_to.call(null, f, bc__5115, arglist__5113)
      }else {
        return f.cljs$lang$applyTo(arglist__5113)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5113))
    }
  };
  var apply__6 = function() {
    var G__5119__delegate = function(f, a, b, c, d, args) {
      var arglist__5116 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__5117 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__5118 = cljs.core.bounded_count.call(null, arglist__5116, fixed_arity__5117 + 1);
        if(bc__5118 <= fixed_arity__5117) {
          return cljs.core.apply_to.call(null, f, bc__5118, arglist__5116)
        }else {
          return f.cljs$lang$applyTo(arglist__5116)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__5116))
      }
    };
    var G__5119 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__5119__delegate.call(this, f, a, b, c, d, args)
    };
    G__5119.cljs$lang$maxFixedArity = 5;
    G__5119.cljs$lang$applyTo = function(arglist__5120) {
      var f = cljs.core.first(arglist__5120);
      var a = cljs.core.first(cljs.core.next(arglist__5120));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5120)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5120))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5120)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5120)))));
      return G__5119__delegate(f, a, b, c, d, args)
    };
    G__5119.cljs$lang$arity$variadic = G__5119__delegate;
    return G__5119
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__5121) {
    var obj = cljs.core.first(arglist__5121);
    var f = cljs.core.first(cljs.core.next(arglist__5121));
    var args = cljs.core.rest(cljs.core.next(arglist__5121));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___3 = function() {
    var G__5122__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__5122 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5122__delegate.call(this, x, y, more)
    };
    G__5122.cljs$lang$maxFixedArity = 2;
    G__5122.cljs$lang$applyTo = function(arglist__5123) {
      var x = cljs.core.first(arglist__5123);
      var y = cljs.core.first(cljs.core.next(arglist__5123));
      var more = cljs.core.rest(cljs.core.next(arglist__5123));
      return G__5122__delegate(x, y, more)
    };
    G__5122.cljs$lang$arity$variadic = G__5122__delegate;
    return G__5122
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__5124 = pred;
        var G__5125 = cljs.core.next.call(null, coll);
        pred = G__5124;
        coll = G__5125;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3824__auto____5126 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____5126)) {
        return or__3824__auto____5126
      }else {
        var G__5127 = pred;
        var G__5128 = cljs.core.next.call(null, coll);
        pred = G__5127;
        coll = G__5128;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__5129 = null;
    var G__5129__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__5129__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__5129__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__5129__3 = function() {
      var G__5130__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__5130 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__5130__delegate.call(this, x, y, zs)
      };
      G__5130.cljs$lang$maxFixedArity = 2;
      G__5130.cljs$lang$applyTo = function(arglist__5131) {
        var x = cljs.core.first(arglist__5131);
        var y = cljs.core.first(cljs.core.next(arglist__5131));
        var zs = cljs.core.rest(cljs.core.next(arglist__5131));
        return G__5130__delegate(x, y, zs)
      };
      G__5130.cljs$lang$arity$variadic = G__5130__delegate;
      return G__5130
    }();
    G__5129 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__5129__0.call(this);
        case 1:
          return G__5129__1.call(this, x);
        case 2:
          return G__5129__2.call(this, x, y);
        default:
          return G__5129__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__5129.cljs$lang$maxFixedArity = 2;
    G__5129.cljs$lang$applyTo = G__5129__3.cljs$lang$applyTo;
    return G__5129
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__5132__delegate = function(args) {
      return x
    };
    var G__5132 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__5132__delegate.call(this, args)
    };
    G__5132.cljs$lang$maxFixedArity = 0;
    G__5132.cljs$lang$applyTo = function(arglist__5133) {
      var args = cljs.core.seq(arglist__5133);
      return G__5132__delegate(args)
    };
    G__5132.cljs$lang$arity$variadic = G__5132__delegate;
    return G__5132
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__5137 = null;
      var G__5137__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__5137__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__5137__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__5137__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__5137__4 = function() {
        var G__5138__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__5138 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5138__delegate.call(this, x, y, z, args)
        };
        G__5138.cljs$lang$maxFixedArity = 3;
        G__5138.cljs$lang$applyTo = function(arglist__5139) {
          var x = cljs.core.first(arglist__5139);
          var y = cljs.core.first(cljs.core.next(arglist__5139));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5139)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5139)));
          return G__5138__delegate(x, y, z, args)
        };
        G__5138.cljs$lang$arity$variadic = G__5138__delegate;
        return G__5138
      }();
      G__5137 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5137__0.call(this);
          case 1:
            return G__5137__1.call(this, x);
          case 2:
            return G__5137__2.call(this, x, y);
          case 3:
            return G__5137__3.call(this, x, y, z);
          default:
            return G__5137__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5137.cljs$lang$maxFixedArity = 3;
      G__5137.cljs$lang$applyTo = G__5137__4.cljs$lang$applyTo;
      return G__5137
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__5140 = null;
      var G__5140__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__5140__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__5140__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__5140__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__5140__4 = function() {
        var G__5141__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__5141 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5141__delegate.call(this, x, y, z, args)
        };
        G__5141.cljs$lang$maxFixedArity = 3;
        G__5141.cljs$lang$applyTo = function(arglist__5142) {
          var x = cljs.core.first(arglist__5142);
          var y = cljs.core.first(cljs.core.next(arglist__5142));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5142)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5142)));
          return G__5141__delegate(x, y, z, args)
        };
        G__5141.cljs$lang$arity$variadic = G__5141__delegate;
        return G__5141
      }();
      G__5140 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5140__0.call(this);
          case 1:
            return G__5140__1.call(this, x);
          case 2:
            return G__5140__2.call(this, x, y);
          case 3:
            return G__5140__3.call(this, x, y, z);
          default:
            return G__5140__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5140.cljs$lang$maxFixedArity = 3;
      G__5140.cljs$lang$applyTo = G__5140__4.cljs$lang$applyTo;
      return G__5140
    }()
  };
  var comp__4 = function() {
    var G__5143__delegate = function(f1, f2, f3, fs) {
      var fs__5134 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__5144__delegate = function(args) {
          var ret__5135 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__5134), args);
          var fs__5136 = cljs.core.next.call(null, fs__5134);
          while(true) {
            if(cljs.core.truth_(fs__5136)) {
              var G__5145 = cljs.core.first.call(null, fs__5136).call(null, ret__5135);
              var G__5146 = cljs.core.next.call(null, fs__5136);
              ret__5135 = G__5145;
              fs__5136 = G__5146;
              continue
            }else {
              return ret__5135
            }
            break
          }
        };
        var G__5144 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5144__delegate.call(this, args)
        };
        G__5144.cljs$lang$maxFixedArity = 0;
        G__5144.cljs$lang$applyTo = function(arglist__5147) {
          var args = cljs.core.seq(arglist__5147);
          return G__5144__delegate(args)
        };
        G__5144.cljs$lang$arity$variadic = G__5144__delegate;
        return G__5144
      }()
    };
    var G__5143 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5143__delegate.call(this, f1, f2, f3, fs)
    };
    G__5143.cljs$lang$maxFixedArity = 3;
    G__5143.cljs$lang$applyTo = function(arglist__5148) {
      var f1 = cljs.core.first(arglist__5148);
      var f2 = cljs.core.first(cljs.core.next(arglist__5148));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5148)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5148)));
      return G__5143__delegate(f1, f2, f3, fs)
    };
    G__5143.cljs$lang$arity$variadic = G__5143__delegate;
    return G__5143
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__5149__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__5149 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5149__delegate.call(this, args)
      };
      G__5149.cljs$lang$maxFixedArity = 0;
      G__5149.cljs$lang$applyTo = function(arglist__5150) {
        var args = cljs.core.seq(arglist__5150);
        return G__5149__delegate(args)
      };
      G__5149.cljs$lang$arity$variadic = G__5149__delegate;
      return G__5149
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__5151__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__5151 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5151__delegate.call(this, args)
      };
      G__5151.cljs$lang$maxFixedArity = 0;
      G__5151.cljs$lang$applyTo = function(arglist__5152) {
        var args = cljs.core.seq(arglist__5152);
        return G__5151__delegate(args)
      };
      G__5151.cljs$lang$arity$variadic = G__5151__delegate;
      return G__5151
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__5153__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__5153 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5153__delegate.call(this, args)
      };
      G__5153.cljs$lang$maxFixedArity = 0;
      G__5153.cljs$lang$applyTo = function(arglist__5154) {
        var args = cljs.core.seq(arglist__5154);
        return G__5153__delegate(args)
      };
      G__5153.cljs$lang$arity$variadic = G__5153__delegate;
      return G__5153
    }()
  };
  var partial__5 = function() {
    var G__5155__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__5156__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__5156 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5156__delegate.call(this, args)
        };
        G__5156.cljs$lang$maxFixedArity = 0;
        G__5156.cljs$lang$applyTo = function(arglist__5157) {
          var args = cljs.core.seq(arglist__5157);
          return G__5156__delegate(args)
        };
        G__5156.cljs$lang$arity$variadic = G__5156__delegate;
        return G__5156
      }()
    };
    var G__5155 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5155__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__5155.cljs$lang$maxFixedArity = 4;
    G__5155.cljs$lang$applyTo = function(arglist__5158) {
      var f = cljs.core.first(arglist__5158);
      var arg1 = cljs.core.first(cljs.core.next(arglist__5158));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5158)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5158))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5158))));
      return G__5155__delegate(f, arg1, arg2, arg3, more)
    };
    G__5155.cljs$lang$arity$variadic = G__5155__delegate;
    return G__5155
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__5159 = null;
      var G__5159__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__5159__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__5159__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__5159__4 = function() {
        var G__5160__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__5160 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5160__delegate.call(this, a, b, c, ds)
        };
        G__5160.cljs$lang$maxFixedArity = 3;
        G__5160.cljs$lang$applyTo = function(arglist__5161) {
          var a = cljs.core.first(arglist__5161);
          var b = cljs.core.first(cljs.core.next(arglist__5161));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5161)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5161)));
          return G__5160__delegate(a, b, c, ds)
        };
        G__5160.cljs$lang$arity$variadic = G__5160__delegate;
        return G__5160
      }();
      G__5159 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__5159__1.call(this, a);
          case 2:
            return G__5159__2.call(this, a, b);
          case 3:
            return G__5159__3.call(this, a, b, c);
          default:
            return G__5159__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5159.cljs$lang$maxFixedArity = 3;
      G__5159.cljs$lang$applyTo = G__5159__4.cljs$lang$applyTo;
      return G__5159
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__5162 = null;
      var G__5162__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5162__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__5162__4 = function() {
        var G__5163__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__5163 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5163__delegate.call(this, a, b, c, ds)
        };
        G__5163.cljs$lang$maxFixedArity = 3;
        G__5163.cljs$lang$applyTo = function(arglist__5164) {
          var a = cljs.core.first(arglist__5164);
          var b = cljs.core.first(cljs.core.next(arglist__5164));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5164)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5164)));
          return G__5163__delegate(a, b, c, ds)
        };
        G__5163.cljs$lang$arity$variadic = G__5163__delegate;
        return G__5163
      }();
      G__5162 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5162__2.call(this, a, b);
          case 3:
            return G__5162__3.call(this, a, b, c);
          default:
            return G__5162__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5162.cljs$lang$maxFixedArity = 3;
      G__5162.cljs$lang$applyTo = G__5162__4.cljs$lang$applyTo;
      return G__5162
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__5165 = null;
      var G__5165__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5165__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__5165__4 = function() {
        var G__5166__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__5166 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5166__delegate.call(this, a, b, c, ds)
        };
        G__5166.cljs$lang$maxFixedArity = 3;
        G__5166.cljs$lang$applyTo = function(arglist__5167) {
          var a = cljs.core.first(arglist__5167);
          var b = cljs.core.first(cljs.core.next(arglist__5167));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5167)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5167)));
          return G__5166__delegate(a, b, c, ds)
        };
        G__5166.cljs$lang$arity$variadic = G__5166__delegate;
        return G__5166
      }();
      G__5165 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5165__2.call(this, a, b);
          case 3:
            return G__5165__3.call(this, a, b, c);
          default:
            return G__5165__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5165.cljs$lang$maxFixedArity = 3;
      G__5165.cljs$lang$applyTo = G__5165__4.cljs$lang$applyTo;
      return G__5165
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__5170 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5168 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5168)) {
        var s__5169 = temp__3974__auto____5168;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__5169)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__5169)))
      }else {
        return null
      }
    })
  };
  return mapi__5170.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____5171 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____5171)) {
      var s__5172 = temp__3974__auto____5171;
      var x__5173 = f.call(null, cljs.core.first.call(null, s__5172));
      if(x__5173 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__5172))
      }else {
        return cljs.core.cons.call(null, x__5173, keep.call(null, f, cljs.core.rest.call(null, s__5172)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__5183 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5180 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5180)) {
        var s__5181 = temp__3974__auto____5180;
        var x__5182 = f.call(null, idx, cljs.core.first.call(null, s__5181));
        if(x__5182 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5181))
        }else {
          return cljs.core.cons.call(null, x__5182, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5181)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__5183.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5190 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5190)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____5190
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5191 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5191)) {
            var and__3822__auto____5192 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____5192)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____5192
            }
          }else {
            return and__3822__auto____5191
          }
        }())
      };
      var ep1__4 = function() {
        var G__5228__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____5193 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____5193)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____5193
            }
          }())
        };
        var G__5228 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5228__delegate.call(this, x, y, z, args)
        };
        G__5228.cljs$lang$maxFixedArity = 3;
        G__5228.cljs$lang$applyTo = function(arglist__5229) {
          var x = cljs.core.first(arglist__5229);
          var y = cljs.core.first(cljs.core.next(arglist__5229));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5229)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5229)));
          return G__5228__delegate(x, y, z, args)
        };
        G__5228.cljs$lang$arity$variadic = G__5228__delegate;
        return G__5228
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5194 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5194)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____5194
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5195 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5195)) {
            var and__3822__auto____5196 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____5196)) {
              var and__3822__auto____5197 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____5197)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____5197
              }
            }else {
              return and__3822__auto____5196
            }
          }else {
            return and__3822__auto____5195
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5198 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5198)) {
            var and__3822__auto____5199 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____5199)) {
              var and__3822__auto____5200 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____5200)) {
                var and__3822__auto____5201 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____5201)) {
                  var and__3822__auto____5202 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____5202)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____5202
                  }
                }else {
                  return and__3822__auto____5201
                }
              }else {
                return and__3822__auto____5200
              }
            }else {
              return and__3822__auto____5199
            }
          }else {
            return and__3822__auto____5198
          }
        }())
      };
      var ep2__4 = function() {
        var G__5230__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____5203 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____5203)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5174_SHARP_) {
                var and__3822__auto____5204 = p1.call(null, p1__5174_SHARP_);
                if(cljs.core.truth_(and__3822__auto____5204)) {
                  return p2.call(null, p1__5174_SHARP_)
                }else {
                  return and__3822__auto____5204
                }
              }, args)
            }else {
              return and__3822__auto____5203
            }
          }())
        };
        var G__5230 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5230__delegate.call(this, x, y, z, args)
        };
        G__5230.cljs$lang$maxFixedArity = 3;
        G__5230.cljs$lang$applyTo = function(arglist__5231) {
          var x = cljs.core.first(arglist__5231);
          var y = cljs.core.first(cljs.core.next(arglist__5231));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5231)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5231)));
          return G__5230__delegate(x, y, z, args)
        };
        G__5230.cljs$lang$arity$variadic = G__5230__delegate;
        return G__5230
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5205 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5205)) {
            var and__3822__auto____5206 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5206)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____5206
            }
          }else {
            return and__3822__auto____5205
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5207 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5207)) {
            var and__3822__auto____5208 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5208)) {
              var and__3822__auto____5209 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____5209)) {
                var and__3822__auto____5210 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____5210)) {
                  var and__3822__auto____5211 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____5211)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____5211
                  }
                }else {
                  return and__3822__auto____5210
                }
              }else {
                return and__3822__auto____5209
              }
            }else {
              return and__3822__auto____5208
            }
          }else {
            return and__3822__auto____5207
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5212 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5212)) {
            var and__3822__auto____5213 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5213)) {
              var and__3822__auto____5214 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____5214)) {
                var and__3822__auto____5215 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____5215)) {
                  var and__3822__auto____5216 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____5216)) {
                    var and__3822__auto____5217 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____5217)) {
                      var and__3822__auto____5218 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____5218)) {
                        var and__3822__auto____5219 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____5219)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____5219
                        }
                      }else {
                        return and__3822__auto____5218
                      }
                    }else {
                      return and__3822__auto____5217
                    }
                  }else {
                    return and__3822__auto____5216
                  }
                }else {
                  return and__3822__auto____5215
                }
              }else {
                return and__3822__auto____5214
              }
            }else {
              return and__3822__auto____5213
            }
          }else {
            return and__3822__auto____5212
          }
        }())
      };
      var ep3__4 = function() {
        var G__5232__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____5220 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____5220)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5175_SHARP_) {
                var and__3822__auto____5221 = p1.call(null, p1__5175_SHARP_);
                if(cljs.core.truth_(and__3822__auto____5221)) {
                  var and__3822__auto____5222 = p2.call(null, p1__5175_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____5222)) {
                    return p3.call(null, p1__5175_SHARP_)
                  }else {
                    return and__3822__auto____5222
                  }
                }else {
                  return and__3822__auto____5221
                }
              }, args)
            }else {
              return and__3822__auto____5220
            }
          }())
        };
        var G__5232 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5232__delegate.call(this, x, y, z, args)
        };
        G__5232.cljs$lang$maxFixedArity = 3;
        G__5232.cljs$lang$applyTo = function(arglist__5233) {
          var x = cljs.core.first(arglist__5233);
          var y = cljs.core.first(cljs.core.next(arglist__5233));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5233)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5233)));
          return G__5232__delegate(x, y, z, args)
        };
        G__5232.cljs$lang$arity$variadic = G__5232__delegate;
        return G__5232
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__5234__delegate = function(p1, p2, p3, ps) {
      var ps__5223 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__5176_SHARP_) {
            return p1__5176_SHARP_.call(null, x)
          }, ps__5223)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__5177_SHARP_) {
            var and__3822__auto____5224 = p1__5177_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5224)) {
              return p1__5177_SHARP_.call(null, y)
            }else {
              return and__3822__auto____5224
            }
          }, ps__5223)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__5178_SHARP_) {
            var and__3822__auto____5225 = p1__5178_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5225)) {
              var and__3822__auto____5226 = p1__5178_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____5226)) {
                return p1__5178_SHARP_.call(null, z)
              }else {
                return and__3822__auto____5226
              }
            }else {
              return and__3822__auto____5225
            }
          }, ps__5223)
        };
        var epn__4 = function() {
          var G__5235__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____5227 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____5227)) {
                return cljs.core.every_QMARK_.call(null, function(p1__5179_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__5179_SHARP_, args)
                }, ps__5223)
              }else {
                return and__3822__auto____5227
              }
            }())
          };
          var G__5235 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5235__delegate.call(this, x, y, z, args)
          };
          G__5235.cljs$lang$maxFixedArity = 3;
          G__5235.cljs$lang$applyTo = function(arglist__5236) {
            var x = cljs.core.first(arglist__5236);
            var y = cljs.core.first(cljs.core.next(arglist__5236));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5236)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5236)));
            return G__5235__delegate(x, y, z, args)
          };
          G__5235.cljs$lang$arity$variadic = G__5235__delegate;
          return G__5235
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__5234 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5234__delegate.call(this, p1, p2, p3, ps)
    };
    G__5234.cljs$lang$maxFixedArity = 3;
    G__5234.cljs$lang$applyTo = function(arglist__5237) {
      var p1 = cljs.core.first(arglist__5237);
      var p2 = cljs.core.first(cljs.core.next(arglist__5237));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5237)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5237)));
      return G__5234__delegate(p1, p2, p3, ps)
    };
    G__5234.cljs$lang$arity$variadic = G__5234__delegate;
    return G__5234
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____5239 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5239)) {
          return or__3824__auto____5239
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____5240 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5240)) {
          return or__3824__auto____5240
        }else {
          var or__3824__auto____5241 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____5241)) {
            return or__3824__auto____5241
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__5277__delegate = function(x, y, z, args) {
          var or__3824__auto____5242 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____5242)) {
            return or__3824__auto____5242
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__5277 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5277__delegate.call(this, x, y, z, args)
        };
        G__5277.cljs$lang$maxFixedArity = 3;
        G__5277.cljs$lang$applyTo = function(arglist__5278) {
          var x = cljs.core.first(arglist__5278);
          var y = cljs.core.first(cljs.core.next(arglist__5278));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5278)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5278)));
          return G__5277__delegate(x, y, z, args)
        };
        G__5277.cljs$lang$arity$variadic = G__5277__delegate;
        return G__5277
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____5243 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5243)) {
          return or__3824__auto____5243
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____5244 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5244)) {
          return or__3824__auto____5244
        }else {
          var or__3824__auto____5245 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____5245)) {
            return or__3824__auto____5245
          }else {
            var or__3824__auto____5246 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5246)) {
              return or__3824__auto____5246
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____5247 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5247)) {
          return or__3824__auto____5247
        }else {
          var or__3824__auto____5248 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____5248)) {
            return or__3824__auto____5248
          }else {
            var or__3824__auto____5249 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____5249)) {
              return or__3824__auto____5249
            }else {
              var or__3824__auto____5250 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____5250)) {
                return or__3824__auto____5250
              }else {
                var or__3824__auto____5251 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____5251)) {
                  return or__3824__auto____5251
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__5279__delegate = function(x, y, z, args) {
          var or__3824__auto____5252 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____5252)) {
            return or__3824__auto____5252
          }else {
            return cljs.core.some.call(null, function(p1__5184_SHARP_) {
              var or__3824__auto____5253 = p1.call(null, p1__5184_SHARP_);
              if(cljs.core.truth_(or__3824__auto____5253)) {
                return or__3824__auto____5253
              }else {
                return p2.call(null, p1__5184_SHARP_)
              }
            }, args)
          }
        };
        var G__5279 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5279__delegate.call(this, x, y, z, args)
        };
        G__5279.cljs$lang$maxFixedArity = 3;
        G__5279.cljs$lang$applyTo = function(arglist__5280) {
          var x = cljs.core.first(arglist__5280);
          var y = cljs.core.first(cljs.core.next(arglist__5280));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5280)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5280)));
          return G__5279__delegate(x, y, z, args)
        };
        G__5279.cljs$lang$arity$variadic = G__5279__delegate;
        return G__5279
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____5254 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5254)) {
          return or__3824__auto____5254
        }else {
          var or__3824__auto____5255 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____5255)) {
            return or__3824__auto____5255
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____5256 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5256)) {
          return or__3824__auto____5256
        }else {
          var or__3824__auto____5257 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____5257)) {
            return or__3824__auto____5257
          }else {
            var or__3824__auto____5258 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5258)) {
              return or__3824__auto____5258
            }else {
              var or__3824__auto____5259 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____5259)) {
                return or__3824__auto____5259
              }else {
                var or__3824__auto____5260 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____5260)) {
                  return or__3824__auto____5260
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____5261 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5261)) {
          return or__3824__auto____5261
        }else {
          var or__3824__auto____5262 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____5262)) {
            return or__3824__auto____5262
          }else {
            var or__3824__auto____5263 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5263)) {
              return or__3824__auto____5263
            }else {
              var or__3824__auto____5264 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____5264)) {
                return or__3824__auto____5264
              }else {
                var or__3824__auto____5265 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____5265)) {
                  return or__3824__auto____5265
                }else {
                  var or__3824__auto____5266 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____5266)) {
                    return or__3824__auto____5266
                  }else {
                    var or__3824__auto____5267 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____5267)) {
                      return or__3824__auto____5267
                    }else {
                      var or__3824__auto____5268 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____5268)) {
                        return or__3824__auto____5268
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__5281__delegate = function(x, y, z, args) {
          var or__3824__auto____5269 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____5269)) {
            return or__3824__auto____5269
          }else {
            return cljs.core.some.call(null, function(p1__5185_SHARP_) {
              var or__3824__auto____5270 = p1.call(null, p1__5185_SHARP_);
              if(cljs.core.truth_(or__3824__auto____5270)) {
                return or__3824__auto____5270
              }else {
                var or__3824__auto____5271 = p2.call(null, p1__5185_SHARP_);
                if(cljs.core.truth_(or__3824__auto____5271)) {
                  return or__3824__auto____5271
                }else {
                  return p3.call(null, p1__5185_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__5281 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5281__delegate.call(this, x, y, z, args)
        };
        G__5281.cljs$lang$maxFixedArity = 3;
        G__5281.cljs$lang$applyTo = function(arglist__5282) {
          var x = cljs.core.first(arglist__5282);
          var y = cljs.core.first(cljs.core.next(arglist__5282));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5282)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5282)));
          return G__5281__delegate(x, y, z, args)
        };
        G__5281.cljs$lang$arity$variadic = G__5281__delegate;
        return G__5281
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__5283__delegate = function(p1, p2, p3, ps) {
      var ps__5272 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__5186_SHARP_) {
            return p1__5186_SHARP_.call(null, x)
          }, ps__5272)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__5187_SHARP_) {
            var or__3824__auto____5273 = p1__5187_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5273)) {
              return or__3824__auto____5273
            }else {
              return p1__5187_SHARP_.call(null, y)
            }
          }, ps__5272)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__5188_SHARP_) {
            var or__3824__auto____5274 = p1__5188_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5274)) {
              return or__3824__auto____5274
            }else {
              var or__3824__auto____5275 = p1__5188_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____5275)) {
                return or__3824__auto____5275
              }else {
                return p1__5188_SHARP_.call(null, z)
              }
            }
          }, ps__5272)
        };
        var spn__4 = function() {
          var G__5284__delegate = function(x, y, z, args) {
            var or__3824__auto____5276 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____5276)) {
              return or__3824__auto____5276
            }else {
              return cljs.core.some.call(null, function(p1__5189_SHARP_) {
                return cljs.core.some.call(null, p1__5189_SHARP_, args)
              }, ps__5272)
            }
          };
          var G__5284 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5284__delegate.call(this, x, y, z, args)
          };
          G__5284.cljs$lang$maxFixedArity = 3;
          G__5284.cljs$lang$applyTo = function(arglist__5285) {
            var x = cljs.core.first(arglist__5285);
            var y = cljs.core.first(cljs.core.next(arglist__5285));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5285)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5285)));
            return G__5284__delegate(x, y, z, args)
          };
          G__5284.cljs$lang$arity$variadic = G__5284__delegate;
          return G__5284
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__5283 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5283__delegate.call(this, p1, p2, p3, ps)
    };
    G__5283.cljs$lang$maxFixedArity = 3;
    G__5283.cljs$lang$applyTo = function(arglist__5286) {
      var p1 = cljs.core.first(arglist__5286);
      var p2 = cljs.core.first(cljs.core.next(arglist__5286));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5286)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5286)));
      return G__5283__delegate(p1, p2, p3, ps)
    };
    G__5283.cljs$lang$arity$variadic = G__5283__delegate;
    return G__5283
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5287 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5287)) {
        var s__5288 = temp__3974__auto____5287;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__5288)), map.call(null, f, cljs.core.rest.call(null, s__5288)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5289 = cljs.core.seq.call(null, c1);
      var s2__5290 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5291 = s1__5289;
        if(cljs.core.truth_(and__3822__auto____5291)) {
          return s2__5290
        }else {
          return and__3822__auto____5291
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5289), cljs.core.first.call(null, s2__5290)), map.call(null, f, cljs.core.rest.call(null, s1__5289), cljs.core.rest.call(null, s2__5290)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5292 = cljs.core.seq.call(null, c1);
      var s2__5293 = cljs.core.seq.call(null, c2);
      var s3__5294 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5295 = s1__5292;
        if(cljs.core.truth_(and__3822__auto____5295)) {
          var and__3822__auto____5296 = s2__5293;
          if(cljs.core.truth_(and__3822__auto____5296)) {
            return s3__5294
          }else {
            return and__3822__auto____5296
          }
        }else {
          return and__3822__auto____5295
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5292), cljs.core.first.call(null, s2__5293), cljs.core.first.call(null, s3__5294)), map.call(null, f, cljs.core.rest.call(null, s1__5292), cljs.core.rest.call(null, s2__5293), cljs.core.rest.call(null, s3__5294)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__5299__delegate = function(f, c1, c2, c3, colls) {
      var step__5298 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__5297 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5297)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__5297), step.call(null, map.call(null, cljs.core.rest, ss__5297)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__5238_SHARP_) {
        return cljs.core.apply.call(null, f, p1__5238_SHARP_)
      }, step__5298.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__5299 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5299__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5299.cljs$lang$maxFixedArity = 4;
    G__5299.cljs$lang$applyTo = function(arglist__5300) {
      var f = cljs.core.first(arglist__5300);
      var c1 = cljs.core.first(cljs.core.next(arglist__5300));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5300)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5300))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5300))));
      return G__5299__delegate(f, c1, c2, c3, colls)
    };
    G__5299.cljs$lang$arity$variadic = G__5299__delegate;
    return G__5299
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____5301 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5301)) {
        var s__5302 = temp__3974__auto____5301;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5302), take.call(null, n - 1, cljs.core.rest.call(null, s__5302)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__5305 = function(n, coll) {
    while(true) {
      var s__5303 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5304 = n > 0;
        if(and__3822__auto____5304) {
          return s__5303
        }else {
          return and__3822__auto____5304
        }
      }())) {
        var G__5306 = n - 1;
        var G__5307 = cljs.core.rest.call(null, s__5303);
        n = G__5306;
        coll = G__5307;
        continue
      }else {
        return s__5303
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5305.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__5308 = cljs.core.seq.call(null, coll);
  var lead__5309 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__5309)) {
      var G__5310 = cljs.core.next.call(null, s__5308);
      var G__5311 = cljs.core.next.call(null, lead__5309);
      s__5308 = G__5310;
      lead__5309 = G__5311;
      continue
    }else {
      return s__5308
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__5314 = function(pred, coll) {
    while(true) {
      var s__5312 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5313 = s__5312;
        if(cljs.core.truth_(and__3822__auto____5313)) {
          return pred.call(null, cljs.core.first.call(null, s__5312))
        }else {
          return and__3822__auto____5313
        }
      }())) {
        var G__5315 = pred;
        var G__5316 = cljs.core.rest.call(null, s__5312);
        pred = G__5315;
        coll = G__5316;
        continue
      }else {
        return s__5312
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5314.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____5317 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____5317)) {
      var s__5318 = temp__3974__auto____5317;
      return cljs.core.concat.call(null, s__5318, cycle.call(null, s__5318))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5319 = cljs.core.seq.call(null, c1);
      var s2__5320 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5321 = s1__5319;
        if(cljs.core.truth_(and__3822__auto____5321)) {
          return s2__5320
        }else {
          return and__3822__auto____5321
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__5319), cljs.core.cons.call(null, cljs.core.first.call(null, s2__5320), interleave.call(null, cljs.core.rest.call(null, s1__5319), cljs.core.rest.call(null, s2__5320))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__5323__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__5322 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5322)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__5322), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__5322)))
        }else {
          return null
        }
      })
    };
    var G__5323 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5323__delegate.call(this, c1, c2, colls)
    };
    G__5323.cljs$lang$maxFixedArity = 2;
    G__5323.cljs$lang$applyTo = function(arglist__5324) {
      var c1 = cljs.core.first(arglist__5324);
      var c2 = cljs.core.first(cljs.core.next(arglist__5324));
      var colls = cljs.core.rest(cljs.core.next(arglist__5324));
      return G__5323__delegate(c1, c2, colls)
    };
    G__5323.cljs$lang$arity$variadic = G__5323__delegate;
    return G__5323
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__5327 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____5325 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____5325)) {
        var coll__5326 = temp__3971__auto____5325;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__5326), cat.call(null, cljs.core.rest.call(null, coll__5326), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__5327.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__5328__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__5328 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5328__delegate.call(this, f, coll, colls)
    };
    G__5328.cljs$lang$maxFixedArity = 2;
    G__5328.cljs$lang$applyTo = function(arglist__5329) {
      var f = cljs.core.first(arglist__5329);
      var coll = cljs.core.first(cljs.core.next(arglist__5329));
      var colls = cljs.core.rest(cljs.core.next(arglist__5329));
      return G__5328__delegate(f, coll, colls)
    };
    G__5328.cljs$lang$arity$variadic = G__5328__delegate;
    return G__5328
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____5330 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____5330)) {
      var s__5331 = temp__3974__auto____5330;
      var f__5332 = cljs.core.first.call(null, s__5331);
      var r__5333 = cljs.core.rest.call(null, s__5331);
      if(cljs.core.truth_(pred.call(null, f__5332))) {
        return cljs.core.cons.call(null, f__5332, filter.call(null, pred, r__5333))
      }else {
        return filter.call(null, pred, r__5333)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__5335 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__5335.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__5334_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__5334_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__5336__5337 = to;
    if(G__5336__5337 != null) {
      if(function() {
        var or__3824__auto____5338 = G__5336__5337.cljs$lang$protocol_mask$partition0$ & 2147483648;
        if(or__3824__auto____5338) {
          return or__3824__auto____5338
        }else {
          return G__5336__5337.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__5336__5337.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5336__5337)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5336__5337)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__5339__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__5339 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5339__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5339.cljs$lang$maxFixedArity = 4;
    G__5339.cljs$lang$applyTo = function(arglist__5340) {
      var f = cljs.core.first(arglist__5340);
      var c1 = cljs.core.first(cljs.core.next(arglist__5340));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5340)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5340))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5340))));
      return G__5339__delegate(f, c1, c2, c3, colls)
    };
    G__5339.cljs$lang$arity$variadic = G__5339__delegate;
    return G__5339
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5341 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5341)) {
        var s__5342 = temp__3974__auto____5341;
        var p__5343 = cljs.core.take.call(null, n, s__5342);
        if(n === cljs.core.count.call(null, p__5343)) {
          return cljs.core.cons.call(null, p__5343, partition.call(null, n, step, cljs.core.drop.call(null, step, s__5342)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5344 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5344)) {
        var s__5345 = temp__3974__auto____5344;
        var p__5346 = cljs.core.take.call(null, n, s__5345);
        if(n === cljs.core.count.call(null, p__5346)) {
          return cljs.core.cons.call(null, p__5346, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__5345)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__5346, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__5347 = cljs.core.lookup_sentinel;
    var m__5348 = m;
    var ks__5349 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__5349)) {
        var m__5350 = cljs.core.get.call(null, m__5348, cljs.core.first.call(null, ks__5349), sentinel__5347);
        if(sentinel__5347 === m__5350) {
          return not_found
        }else {
          var G__5351 = sentinel__5347;
          var G__5352 = m__5350;
          var G__5353 = cljs.core.next.call(null, ks__5349);
          sentinel__5347 = G__5351;
          m__5348 = G__5352;
          ks__5349 = G__5353;
          continue
        }
      }else {
        return m__5348
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__5354, v) {
  var vec__5355__5356 = p__5354;
  var k__5357 = cljs.core.nth.call(null, vec__5355__5356, 0, null);
  var ks__5358 = cljs.core.nthnext.call(null, vec__5355__5356, 1);
  if(cljs.core.truth_(ks__5358)) {
    return cljs.core.assoc.call(null, m, k__5357, assoc_in.call(null, cljs.core.get.call(null, m, k__5357), ks__5358, v))
  }else {
    return cljs.core.assoc.call(null, m, k__5357, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__5359, f, args) {
    var vec__5360__5361 = p__5359;
    var k__5362 = cljs.core.nth.call(null, vec__5360__5361, 0, null);
    var ks__5363 = cljs.core.nthnext.call(null, vec__5360__5361, 1);
    if(cljs.core.truth_(ks__5363)) {
      return cljs.core.assoc.call(null, m, k__5362, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__5362), ks__5363, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__5362, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__5362), args))
    }
  };
  var update_in = function(m, p__5359, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__5359, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__5364) {
    var m = cljs.core.first(arglist__5364);
    var p__5359 = cljs.core.first(cljs.core.next(arglist__5364));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5364)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5364)));
    return update_in__delegate(m, p__5359, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5369 = this;
  var h__364__auto____5370 = this__5369.__hash;
  if(h__364__auto____5370 != null) {
    return h__364__auto____5370
  }else {
    var h__364__auto____5371 = cljs.core.hash_coll.call(null, coll);
    this__5369.__hash = h__364__auto____5371;
    return h__364__auto____5371
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5372 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5373 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5374 = this;
  var new_array__5375 = cljs.core.aclone.call(null, this__5374.array);
  new_array__5375[k] = v;
  return new cljs.core.Vector(this__5374.meta, new_array__5375, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__5404 = null;
  var G__5404__2 = function(tsym5367, k) {
    var this__5376 = this;
    var tsym5367__5377 = this;
    var coll__5378 = tsym5367__5377;
    return cljs.core._lookup.call(null, coll__5378, k)
  };
  var G__5404__3 = function(tsym5368, k, not_found) {
    var this__5379 = this;
    var tsym5368__5380 = this;
    var coll__5381 = tsym5368__5380;
    return cljs.core._lookup.call(null, coll__5381, k, not_found)
  };
  G__5404 = function(tsym5368, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5404__2.call(this, tsym5368, k);
      case 3:
        return G__5404__3.call(this, tsym5368, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5404
}();
cljs.core.Vector.prototype.apply = function(tsym5365, args5366) {
  return tsym5365.call.apply(tsym5365, [tsym5365].concat(cljs.core.aclone.call(null, args5366)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5382 = this;
  var new_array__5383 = cljs.core.aclone.call(null, this__5382.array);
  new_array__5383.push(o);
  return new cljs.core.Vector(this__5382.meta, new_array__5383, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__5384 = this;
  var this$__5385 = this;
  return cljs.core.pr_str.call(null, this$__5385)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5386 = this;
  return cljs.core.ci_reduce.call(null, this__5386.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5387 = this;
  return cljs.core.ci_reduce.call(null, this__5387.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5388 = this;
  if(this__5388.array.length > 0) {
    var vector_seq__5389 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__5388.array.length) {
          return cljs.core.cons.call(null, this__5388.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__5389.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5390 = this;
  return this__5390.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5391 = this;
  var count__5392 = this__5391.array.length;
  if(count__5392 > 0) {
    return this__5391.array[count__5392 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5393 = this;
  if(this__5393.array.length > 0) {
    var new_array__5394 = cljs.core.aclone.call(null, this__5393.array);
    new_array__5394.pop();
    return new cljs.core.Vector(this__5393.meta, new_array__5394, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5395 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5396 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5397 = this;
  return new cljs.core.Vector(meta, this__5397.array, this__5397.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5398 = this;
  return this__5398.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5400 = this;
  if(function() {
    var and__3822__auto____5401 = 0 <= n;
    if(and__3822__auto____5401) {
      return n < this__5400.array.length
    }else {
      return and__3822__auto____5401
    }
  }()) {
    return this__5400.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5402 = this;
  if(function() {
    var and__3822__auto____5403 = 0 <= n;
    if(and__3822__auto____5403) {
      return n < this__5402.array.length
    }else {
      return and__3822__auto____5403
    }
  }()) {
    return this__5402.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5399 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5399.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__455__auto__) {
  return cljs.core.list.call(null, "cljs.core.VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__5405 = pv.cnt;
  if(cnt__5405 < 32) {
    return 0
  }else {
    return cnt__5405 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__5406 = level;
  var ret__5407 = node;
  while(true) {
    if(ll__5406 === 0) {
      return ret__5407
    }else {
      var embed__5408 = ret__5407;
      var r__5409 = cljs.core.pv_fresh_node.call(null, edit);
      var ___5410 = cljs.core.pv_aset.call(null, r__5409, 0, embed__5408);
      var G__5411 = ll__5406 - 5;
      var G__5412 = r__5409;
      ll__5406 = G__5411;
      ret__5407 = G__5412;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__5413 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__5414 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__5413, subidx__5414, tailnode);
    return ret__5413
  }else {
    var temp__3971__auto____5415 = cljs.core.pv_aget.call(null, parent, subidx__5414);
    if(cljs.core.truth_(temp__3971__auto____5415)) {
      var child__5416 = temp__3971__auto____5415;
      var node_to_insert__5417 = push_tail.call(null, pv, level - 5, child__5416, tailnode);
      cljs.core.pv_aset.call(null, ret__5413, subidx__5414, node_to_insert__5417);
      return ret__5413
    }else {
      var node_to_insert__5418 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__5413, subidx__5414, node_to_insert__5418);
      return ret__5413
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____5419 = 0 <= i;
    if(and__3822__auto____5419) {
      return i < pv.cnt
    }else {
      return and__3822__auto____5419
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__5420 = pv.root;
      var level__5421 = pv.shift;
      while(true) {
        if(level__5421 > 0) {
          var G__5422 = cljs.core.pv_aget.call(null, node__5420, i >>> level__5421 & 31);
          var G__5423 = level__5421 - 5;
          node__5420 = G__5422;
          level__5421 = G__5423;
          continue
        }else {
          return node__5420.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__5424 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__5424, i & 31, val);
    return ret__5424
  }else {
    var subidx__5425 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__5424, subidx__5425, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5425), i, val));
    return ret__5424
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__5426 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5427 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5426));
    if(function() {
      var and__3822__auto____5428 = new_child__5427 == null;
      if(and__3822__auto____5428) {
        return subidx__5426 === 0
      }else {
        return and__3822__auto____5428
      }
    }()) {
      return null
    }else {
      var ret__5429 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__5429, subidx__5426, new_child__5427);
      return ret__5429
    }
  }else {
    if(subidx__5426 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__5430 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__5430, subidx__5426, null);
        return ret__5430
      }else {
        return null
      }
    }
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.vector_seq = function vector_seq(v, offset) {
  var c__5431 = cljs.core._count.call(null, v);
  if(c__5431 > 0) {
    if(void 0 === cljs.core.t5432) {
      cljs.core.t5432 = function(c, offset, v, vector_seq, __meta__389__auto__) {
        this.c = c;
        this.offset = offset;
        this.v = v;
        this.vector_seq = vector_seq;
        this.__meta__389__auto__ = __meta__389__auto__;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 282263648
      };
      cljs.core.t5432.cljs$lang$type = true;
      cljs.core.t5432.cljs$lang$ctorPrSeq = function(this__454__auto__) {
        return cljs.core.list.call(null, "cljs.core.t5432")
      };
      cljs.core.t5432.prototype.cljs$core$ISeqable$ = true;
      cljs.core.t5432.prototype.cljs$core$ISeqable$_seq$arity$1 = function(vseq) {
        var this__5433 = this;
        return vseq
      };
      cljs.core.t5432.prototype.cljs$core$ISeq$ = true;
      cljs.core.t5432.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
        var this__5434 = this;
        return cljs.core._nth.call(null, this__5434.v, this__5434.offset)
      };
      cljs.core.t5432.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
        var this__5435 = this;
        var offset__5436 = this__5435.offset + 1;
        if(offset__5436 < this__5435.c) {
          return this__5435.vector_seq.call(null, this__5435.v, offset__5436)
        }else {
          return cljs.core.List.EMPTY
        }
      };
      cljs.core.t5432.prototype.cljs$core$ASeq$ = true;
      cljs.core.t5432.prototype.cljs$core$IEquiv$ = true;
      cljs.core.t5432.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(vseq, other) {
        var this__5437 = this;
        return cljs.core.equiv_sequential.call(null, vseq, other)
      };
      cljs.core.t5432.prototype.cljs$core$ISequential$ = true;
      cljs.core.t5432.prototype.cljs$core$IPrintable$ = true;
      cljs.core.t5432.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(vseq, opts) {
        var this__5438 = this;
        return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, vseq)
      };
      cljs.core.t5432.prototype.cljs$core$IMeta$ = true;
      cljs.core.t5432.prototype.cljs$core$IMeta$_meta$arity$1 = function(___390__auto__) {
        var this__5439 = this;
        return this__5439.__meta__389__auto__
      };
      cljs.core.t5432.prototype.cljs$core$IWithMeta$ = true;
      cljs.core.t5432.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___390__auto__, __meta__389__auto__) {
        var this__5440 = this;
        return new cljs.core.t5432(this__5440.c, this__5440.offset, this__5440.v, this__5440.vector_seq, __meta__389__auto__)
      };
      cljs.core.t5432
    }else {
    }
    return new cljs.core.t5432(c__5431, offset, v, vector_seq, null)
  }else {
    return null
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2164209055
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5445 = this;
  return new cljs.core.TransientVector(this__5445.cnt, this__5445.shift, cljs.core.tv_editable_root.call(null, this__5445.root), cljs.core.tv_editable_tail.call(null, this__5445.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5446 = this;
  var h__364__auto____5447 = this__5446.__hash;
  if(h__364__auto____5447 != null) {
    return h__364__auto____5447
  }else {
    var h__364__auto____5448 = cljs.core.hash_coll.call(null, coll);
    this__5446.__hash = h__364__auto____5448;
    return h__364__auto____5448
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5449 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5450 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5451 = this;
  if(function() {
    var and__3822__auto____5452 = 0 <= k;
    if(and__3822__auto____5452) {
      return k < this__5451.cnt
    }else {
      return and__3822__auto____5452
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__5453 = cljs.core.aclone.call(null, this__5451.tail);
      new_tail__5453[k & 31] = v;
      return new cljs.core.PersistentVector(this__5451.meta, this__5451.cnt, this__5451.shift, this__5451.root, new_tail__5453, null)
    }else {
      return new cljs.core.PersistentVector(this__5451.meta, this__5451.cnt, this__5451.shift, cljs.core.do_assoc.call(null, coll, this__5451.shift, this__5451.root, k, v), this__5451.tail, null)
    }
  }else {
    if(k === this__5451.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__5451.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__5498 = null;
  var G__5498__2 = function(tsym5443, k) {
    var this__5454 = this;
    var tsym5443__5455 = this;
    var coll__5456 = tsym5443__5455;
    return cljs.core._lookup.call(null, coll__5456, k)
  };
  var G__5498__3 = function(tsym5444, k, not_found) {
    var this__5457 = this;
    var tsym5444__5458 = this;
    var coll__5459 = tsym5444__5458;
    return cljs.core._lookup.call(null, coll__5459, k, not_found)
  };
  G__5498 = function(tsym5444, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5498__2.call(this, tsym5444, k);
      case 3:
        return G__5498__3.call(this, tsym5444, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5498
}();
cljs.core.PersistentVector.prototype.apply = function(tsym5441, args5442) {
  return tsym5441.call.apply(tsym5441, [tsym5441].concat(cljs.core.aclone.call(null, args5442)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__5460 = this;
  var step_init__5461 = [0, init];
  var i__5462 = 0;
  while(true) {
    if(i__5462 < this__5460.cnt) {
      var arr__5463 = cljs.core.array_for.call(null, v, i__5462);
      var len__5464 = arr__5463.length;
      var init__5468 = function() {
        var j__5465 = 0;
        var init__5466 = step_init__5461[1];
        while(true) {
          if(j__5465 < len__5464) {
            var init__5467 = f.call(null, init__5466, j__5465 + i__5462, arr__5463[j__5465]);
            if(cljs.core.reduced_QMARK_.call(null, init__5467)) {
              return init__5467
            }else {
              var G__5499 = j__5465 + 1;
              var G__5500 = init__5467;
              j__5465 = G__5499;
              init__5466 = G__5500;
              continue
            }
          }else {
            step_init__5461[0] = len__5464;
            step_init__5461[1] = init__5466;
            return init__5466
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5468)) {
        return cljs.core.deref.call(null, init__5468)
      }else {
        var G__5501 = i__5462 + step_init__5461[0];
        i__5462 = G__5501;
        continue
      }
    }else {
      return step_init__5461[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5469 = this;
  if(this__5469.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__5470 = cljs.core.aclone.call(null, this__5469.tail);
    new_tail__5470.push(o);
    return new cljs.core.PersistentVector(this__5469.meta, this__5469.cnt + 1, this__5469.shift, this__5469.root, new_tail__5470, null)
  }else {
    var root_overflow_QMARK___5471 = this__5469.cnt >>> 5 > 1 << this__5469.shift;
    var new_shift__5472 = root_overflow_QMARK___5471 ? this__5469.shift + 5 : this__5469.shift;
    var new_root__5474 = root_overflow_QMARK___5471 ? function() {
      var n_r__5473 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__5473, 0, this__5469.root);
      cljs.core.pv_aset.call(null, n_r__5473, 1, cljs.core.new_path.call(null, null, this__5469.shift, new cljs.core.VectorNode(null, this__5469.tail)));
      return n_r__5473
    }() : cljs.core.push_tail.call(null, coll, this__5469.shift, this__5469.root, new cljs.core.VectorNode(null, this__5469.tail));
    return new cljs.core.PersistentVector(this__5469.meta, this__5469.cnt + 1, new_shift__5472, new_root__5474, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__5475 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__5476 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__5477 = this;
  var this$__5478 = this;
  return cljs.core.pr_str.call(null, this$__5478)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5479 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5480 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5481 = this;
  return cljs.core.vector_seq.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5482 = this;
  return this__5482.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5483 = this;
  if(this__5483.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__5483.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5484 = this;
  if(this__5484.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__5484.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5484.meta)
    }else {
      if(1 < this__5484.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__5484.meta, this__5484.cnt - 1, this__5484.shift, this__5484.root, this__5484.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__5485 = cljs.core.array_for.call(null, coll, this__5484.cnt - 2);
          var nr__5486 = cljs.core.pop_tail.call(null, coll, this__5484.shift, this__5484.root);
          var new_root__5487 = nr__5486 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__5486;
          var cnt_1__5488 = this__5484.cnt - 1;
          if(function() {
            var and__3822__auto____5489 = 5 < this__5484.shift;
            if(and__3822__auto____5489) {
              return cljs.core.pv_aget.call(null, new_root__5487, 1) == null
            }else {
              return and__3822__auto____5489
            }
          }()) {
            return new cljs.core.PersistentVector(this__5484.meta, cnt_1__5488, this__5484.shift - 5, cljs.core.pv_aget.call(null, new_root__5487, 0), new_tail__5485, null)
          }else {
            return new cljs.core.PersistentVector(this__5484.meta, cnt_1__5488, this__5484.shift, new_root__5487, new_tail__5485, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5491 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5492 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5493 = this;
  return new cljs.core.PersistentVector(meta, this__5493.cnt, this__5493.shift, this__5493.root, this__5493.tail, this__5493.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5494 = this;
  return this__5494.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5495 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5496 = this;
  if(function() {
    var and__3822__auto____5497 = 0 <= n;
    if(and__3822__auto____5497) {
      return n < this__5496.cnt
    }else {
      return and__3822__auto____5497
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5490 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5490.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__5502 = cljs.core.seq.call(null, xs);
  var out__5503 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__5502)) {
      var G__5504 = cljs.core.next.call(null, xs__5502);
      var G__5505 = cljs.core.conj_BANG_.call(null, out__5503, cljs.core.first.call(null, xs__5502));
      xs__5502 = G__5504;
      out__5503 = G__5505;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5503)
    }
    break
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.PersistentVector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__5506) {
    var args = cljs.core.seq(arglist__5506);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5511 = this;
  var h__364__auto____5512 = this__5511.__hash;
  if(h__364__auto____5512 != null) {
    return h__364__auto____5512
  }else {
    var h__364__auto____5513 = cljs.core.hash_coll.call(null, coll);
    this__5511.__hash = h__364__auto____5513;
    return h__364__auto____5513
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5514 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5515 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__5516 = this;
  var v_pos__5517 = this__5516.start + key;
  return new cljs.core.Subvec(this__5516.meta, cljs.core._assoc.call(null, this__5516.v, v_pos__5517, val), this__5516.start, this__5516.end > v_pos__5517 + 1 ? this__5516.end : v_pos__5517 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__5541 = null;
  var G__5541__2 = function(tsym5509, k) {
    var this__5518 = this;
    var tsym5509__5519 = this;
    var coll__5520 = tsym5509__5519;
    return cljs.core._lookup.call(null, coll__5520, k)
  };
  var G__5541__3 = function(tsym5510, k, not_found) {
    var this__5521 = this;
    var tsym5510__5522 = this;
    var coll__5523 = tsym5510__5522;
    return cljs.core._lookup.call(null, coll__5523, k, not_found)
  };
  G__5541 = function(tsym5510, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5541__2.call(this, tsym5510, k);
      case 3:
        return G__5541__3.call(this, tsym5510, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5541
}();
cljs.core.Subvec.prototype.apply = function(tsym5507, args5508) {
  return tsym5507.call.apply(tsym5507, [tsym5507].concat(cljs.core.aclone.call(null, args5508)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5524 = this;
  return new cljs.core.Subvec(this__5524.meta, cljs.core._assoc_n.call(null, this__5524.v, this__5524.end, o), this__5524.start, this__5524.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__5525 = this;
  var this$__5526 = this;
  return cljs.core.pr_str.call(null, this$__5526)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__5527 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__5528 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5529 = this;
  var subvec_seq__5530 = function subvec_seq(i) {
    if(i === this__5529.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__5529.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__5530.call(null, this__5529.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5531 = this;
  return this__5531.end - this__5531.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5532 = this;
  return cljs.core._nth.call(null, this__5532.v, this__5532.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5533 = this;
  if(this__5533.start === this__5533.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__5533.meta, this__5533.v, this__5533.start, this__5533.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5534 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5535 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5536 = this;
  return new cljs.core.Subvec(meta, this__5536.v, this__5536.start, this__5536.end, this__5536.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5537 = this;
  return this__5537.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5539 = this;
  return cljs.core._nth.call(null, this__5539.v, this__5539.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5540 = this;
  return cljs.core._nth.call(null, this__5540.v, this__5540.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5538 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5538.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, cljs.core.aclone.call(null, node.arr))
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__5542 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__5542, 0, tl.length);
  return ret__5542
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__5543 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__5544 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__5543, subidx__5544, level === 5 ? tail_node : function() {
    var child__5545 = cljs.core.pv_aget.call(null, ret__5543, subidx__5544);
    if(child__5545 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__5545, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__5543
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__5546 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__5547 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5548 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__5546, subidx__5547));
    if(function() {
      var and__3822__auto____5549 = new_child__5548 == null;
      if(and__3822__auto____5549) {
        return subidx__5547 === 0
      }else {
        return and__3822__auto____5549
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__5546, subidx__5547, new_child__5548);
      return node__5546
    }
  }else {
    if(subidx__5547 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__5546, subidx__5547, null);
        return node__5546
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____5550 = 0 <= i;
    if(and__3822__auto____5550) {
      return i < tv.cnt
    }else {
      return and__3822__auto____5550
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__5551 = tv.root;
      var node__5552 = root__5551;
      var level__5553 = tv.shift;
      while(true) {
        if(level__5553 > 0) {
          var G__5554 = cljs.core.tv_ensure_editable.call(null, root__5551.edit, cljs.core.pv_aget.call(null, node__5552, i >>> level__5553 & 31));
          var G__5555 = level__5553 - 5;
          node__5552 = G__5554;
          level__5553 = G__5555;
          continue
        }else {
          return node__5552.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 147;
  this.cljs$lang$protocol_mask$partition1$ = 11
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientVector")
};
cljs.core.TransientVector.prototype.cljs$core$IFn$ = true;
cljs.core.TransientVector.prototype.call = function() {
  var G__5593 = null;
  var G__5593__2 = function(tsym5558, k) {
    var this__5560 = this;
    var tsym5558__5561 = this;
    var coll__5562 = tsym5558__5561;
    return cljs.core._lookup.call(null, coll__5562, k)
  };
  var G__5593__3 = function(tsym5559, k, not_found) {
    var this__5563 = this;
    var tsym5559__5564 = this;
    var coll__5565 = tsym5559__5564;
    return cljs.core._lookup.call(null, coll__5565, k, not_found)
  };
  G__5593 = function(tsym5559, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5593__2.call(this, tsym5559, k);
      case 3:
        return G__5593__3.call(this, tsym5559, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5593
}();
cljs.core.TransientVector.prototype.apply = function(tsym5556, args5557) {
  return tsym5556.call.apply(tsym5556, [tsym5556].concat(cljs.core.aclone.call(null, args5557)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5566 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5567 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5568 = this;
  if(cljs.core.truth_(this__5568.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5569 = this;
  if(function() {
    var and__3822__auto____5570 = 0 <= n;
    if(and__3822__auto____5570) {
      return n < this__5569.cnt
    }else {
      return and__3822__auto____5570
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5571 = this;
  if(cljs.core.truth_(this__5571.root.edit)) {
    return this__5571.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__5572 = this;
  if(cljs.core.truth_(this__5572.root.edit)) {
    if(function() {
      var and__3822__auto____5573 = 0 <= n;
      if(and__3822__auto____5573) {
        return n < this__5572.cnt
      }else {
        return and__3822__auto____5573
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__5572.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__5576 = function go(level, node) {
          var node__5574 = cljs.core.tv_ensure_editable.call(null, this__5572.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__5574, n & 31, val);
            return node__5574
          }else {
            var subidx__5575 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__5574, subidx__5575, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__5574, subidx__5575)));
            return node__5574
          }
        }.call(null, this__5572.shift, this__5572.root);
        this__5572.root = new_root__5576;
        return tcoll
      }
    }else {
      if(n === this__5572.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__5572.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__5577 = this;
  if(cljs.core.truth_(this__5577.root.edit)) {
    if(this__5577.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__5577.cnt) {
        this__5577.cnt = 0;
        return tcoll
      }else {
        if((this__5577.cnt - 1 & 31) > 0) {
          this__5577.cnt = this__5577.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__5578 = cljs.core.editable_array_for.call(null, tcoll, this__5577.cnt - 2);
            var new_root__5580 = function() {
              var nr__5579 = cljs.core.tv_pop_tail.call(null, tcoll, this__5577.shift, this__5577.root);
              if(nr__5579 != null) {
                return nr__5579
              }else {
                return new cljs.core.VectorNode(this__5577.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____5581 = 5 < this__5577.shift;
              if(and__3822__auto____5581) {
                return cljs.core.pv_aget.call(null, new_root__5580, 1) == null
              }else {
                return and__3822__auto____5581
              }
            }()) {
              var new_root__5582 = cljs.core.tv_ensure_editable.call(null, this__5577.root.edit, cljs.core.pv_aget.call(null, new_root__5580, 0));
              this__5577.root = new_root__5582;
              this__5577.shift = this__5577.shift - 5;
              this__5577.cnt = this__5577.cnt - 1;
              this__5577.tail = new_tail__5578;
              return tcoll
            }else {
              this__5577.root = new_root__5580;
              this__5577.cnt = this__5577.cnt - 1;
              this__5577.tail = new_tail__5578;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__5583 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5584 = this;
  if(cljs.core.truth_(this__5584.root.edit)) {
    if(this__5584.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__5584.tail[this__5584.cnt & 31] = o;
      this__5584.cnt = this__5584.cnt + 1;
      return tcoll
    }else {
      var tail_node__5585 = new cljs.core.VectorNode(this__5584.root.edit, this__5584.tail);
      var new_tail__5586 = cljs.core.make_array.call(null, 32);
      new_tail__5586[0] = o;
      this__5584.tail = new_tail__5586;
      if(this__5584.cnt >>> 5 > 1 << this__5584.shift) {
        var new_root_array__5587 = cljs.core.make_array.call(null, 32);
        var new_shift__5588 = this__5584.shift + 5;
        new_root_array__5587[0] = this__5584.root;
        new_root_array__5587[1] = cljs.core.new_path.call(null, this__5584.root.edit, this__5584.shift, tail_node__5585);
        this__5584.root = new cljs.core.VectorNode(this__5584.root.edit, new_root_array__5587);
        this__5584.shift = new_shift__5588;
        this__5584.cnt = this__5584.cnt + 1;
        return tcoll
      }else {
        var new_root__5589 = cljs.core.tv_push_tail.call(null, tcoll, this__5584.shift, this__5584.root, tail_node__5585);
        this__5584.root = new_root__5589;
        this__5584.cnt = this__5584.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5590 = this;
  if(cljs.core.truth_(this__5590.root.edit)) {
    this__5590.root.edit = null;
    var len__5591 = this__5590.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__5592 = cljs.core.make_array.call(null, len__5591);
    cljs.core.array_copy.call(null, this__5590.tail, 0, trimmed_tail__5592, 0, len__5591);
    return new cljs.core.PersistentVector(null, this__5590.cnt, this__5590.shift, this__5590.root, trimmed_tail__5592, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5594 = this;
  var h__364__auto____5595 = this__5594.__hash;
  if(h__364__auto____5595 != null) {
    return h__364__auto____5595
  }else {
    var h__364__auto____5596 = cljs.core.hash_coll.call(null, coll);
    this__5594.__hash = h__364__auto____5596;
    return h__364__auto____5596
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5597 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__5598 = this;
  var this$__5599 = this;
  return cljs.core.pr_str.call(null, this$__5599)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5600 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5601 = this;
  return cljs.core._first.call(null, this__5601.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5602 = this;
  var temp__3971__auto____5603 = cljs.core.next.call(null, this__5602.front);
  if(cljs.core.truth_(temp__3971__auto____5603)) {
    var f1__5604 = temp__3971__auto____5603;
    return new cljs.core.PersistentQueueSeq(this__5602.meta, f1__5604, this__5602.rear, null)
  }else {
    if(this__5602.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__5602.meta, this__5602.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5605 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5606 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__5606.front, this__5606.rear, this__5606.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5607 = this;
  return this__5607.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5608 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5608.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15929422
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5609 = this;
  var h__364__auto____5610 = this__5609.__hash;
  if(h__364__auto____5610 != null) {
    return h__364__auto____5610
  }else {
    var h__364__auto____5611 = cljs.core.hash_coll.call(null, coll);
    this__5609.__hash = h__364__auto____5611;
    return h__364__auto____5611
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5612 = this;
  if(cljs.core.truth_(this__5612.front)) {
    return new cljs.core.PersistentQueue(this__5612.meta, this__5612.count + 1, this__5612.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____5613 = this__5612.rear;
      if(cljs.core.truth_(or__3824__auto____5613)) {
        return or__3824__auto____5613
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__5612.meta, this__5612.count + 1, cljs.core.conj.call(null, this__5612.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__5614 = this;
  var this$__5615 = this;
  return cljs.core.pr_str.call(null, this$__5615)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5616 = this;
  var rear__5617 = cljs.core.seq.call(null, this__5616.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____5618 = this__5616.front;
    if(cljs.core.truth_(or__3824__auto____5618)) {
      return or__3824__auto____5618
    }else {
      return rear__5617
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__5616.front, cljs.core.seq.call(null, rear__5617), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5619 = this;
  return this__5619.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5620 = this;
  return cljs.core._first.call(null, this__5620.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5621 = this;
  if(cljs.core.truth_(this__5621.front)) {
    var temp__3971__auto____5622 = cljs.core.next.call(null, this__5621.front);
    if(cljs.core.truth_(temp__3971__auto____5622)) {
      var f1__5623 = temp__3971__auto____5622;
      return new cljs.core.PersistentQueue(this__5621.meta, this__5621.count - 1, f1__5623, this__5621.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__5621.meta, this__5621.count - 1, cljs.core.seq.call(null, this__5621.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5624 = this;
  return cljs.core.first.call(null, this__5624.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5625 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5626 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5627 = this;
  return new cljs.core.PersistentQueue(meta, this__5627.count, this__5627.front, this__5627.rear, this__5627.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5628 = this;
  return this__5628.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5629 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.fromArray([]), 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1048576
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__5630 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__5631 = array.length;
  var i__5632 = 0;
  while(true) {
    if(i__5632 < len__5631) {
      if(cljs.core._EQ_.call(null, k, array[i__5632])) {
        return i__5632
      }else {
        var G__5633 = i__5632 + incr;
        i__5632 = G__5633;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___2 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___4 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____5634 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3822__auto____5634)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3822__auto____5634
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___2.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___4.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  obj_map_contains_key_QMARK_.cljs$lang$arity$2 = obj_map_contains_key_QMARK___2;
  obj_map_contains_key_QMARK_.cljs$lang$arity$4 = obj_map_contains_key_QMARK___4;
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__5635 = cljs.core.hash.call(null, a);
  var b__5636 = cljs.core.hash.call(null, b);
  if(a__5635 < b__5636) {
    return-1
  }else {
    if(a__5635 > b__5636) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__5638 = m.keys;
  var len__5639 = ks__5638.length;
  var so__5640 = m.strobj;
  var out__5641 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__5642 = 0;
  var out__5643 = cljs.core.transient$.call(null, out__5641);
  while(true) {
    if(i__5642 < len__5639) {
      var k__5644 = ks__5638[i__5642];
      var G__5645 = i__5642 + 1;
      var G__5646 = cljs.core.assoc_BANG_.call(null, out__5643, k__5644, so__5640[k__5644]);
      i__5642 = G__5645;
      out__5643 = G__5646;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__5643, k, v))
    }
    break
  }
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155021199
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5651 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5652 = this;
  var h__364__auto____5653 = this__5652.__hash;
  if(h__364__auto____5653 != null) {
    return h__364__auto____5653
  }else {
    var h__364__auto____5654 = cljs.core.hash_imap.call(null, coll);
    this__5652.__hash = h__364__auto____5654;
    return h__364__auto____5654
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5655 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5656 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5656.strobj, this__5656.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5657 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___5658 = this__5657.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___5658)) {
      var new_strobj__5659 = goog.object.clone.call(null, this__5657.strobj);
      new_strobj__5659[k] = v;
      return new cljs.core.ObjMap(this__5657.meta, this__5657.keys, new_strobj__5659, this__5657.update_count + 1, null)
    }else {
      if(this__5657.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__5660 = goog.object.clone.call(null, this__5657.strobj);
        var new_keys__5661 = cljs.core.aclone.call(null, this__5657.keys);
        new_strobj__5660[k] = v;
        new_keys__5661.push(k);
        return new cljs.core.ObjMap(this__5657.meta, new_keys__5661, new_strobj__5660, this__5657.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5662 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5662.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__5682 = null;
  var G__5682__2 = function(tsym5649, k) {
    var this__5663 = this;
    var tsym5649__5664 = this;
    var coll__5665 = tsym5649__5664;
    return cljs.core._lookup.call(null, coll__5665, k)
  };
  var G__5682__3 = function(tsym5650, k, not_found) {
    var this__5666 = this;
    var tsym5650__5667 = this;
    var coll__5668 = tsym5650__5667;
    return cljs.core._lookup.call(null, coll__5668, k, not_found)
  };
  G__5682 = function(tsym5650, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5682__2.call(this, tsym5650, k);
      case 3:
        return G__5682__3.call(this, tsym5650, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5682
}();
cljs.core.ObjMap.prototype.apply = function(tsym5647, args5648) {
  return tsym5647.call.apply(tsym5647, [tsym5647].concat(cljs.core.aclone.call(null, args5648)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5669 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__5670 = this;
  var this$__5671 = this;
  return cljs.core.pr_str.call(null, this$__5671)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5672 = this;
  if(this__5672.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__5637_SHARP_) {
      return cljs.core.vector.call(null, p1__5637_SHARP_, this__5672.strobj[p1__5637_SHARP_])
    }, this__5672.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5673 = this;
  return this__5673.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5674 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5675 = this;
  return new cljs.core.ObjMap(meta, this__5675.keys, this__5675.strobj, this__5675.update_count, this__5675.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5676 = this;
  return this__5676.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5677 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__5677.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5678 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____5679 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3822__auto____5679)) {
      return this__5678.strobj.hasOwnProperty(k)
    }else {
      return and__3822__auto____5679
    }
  }())) {
    var new_keys__5680 = cljs.core.aclone.call(null, this__5678.keys);
    var new_strobj__5681 = goog.object.clone.call(null, this__5678.strobj);
    new_keys__5680.splice(cljs.core.scan_array.call(null, 1, k, new_keys__5680), 1);
    cljs.core.js_delete.call(null, new_strobj__5681, k);
    return new cljs.core.ObjMap(this__5678.meta, new_keys__5680, new_strobj__5681, this__5678.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 7537551
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5688 = this;
  var h__364__auto____5689 = this__5688.__hash;
  if(h__364__auto____5689 != null) {
    return h__364__auto____5689
  }else {
    var h__364__auto____5690 = cljs.core.hash_imap.call(null, coll);
    this__5688.__hash = h__364__auto____5690;
    return h__364__auto____5690
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5691 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5692 = this;
  var bucket__5693 = this__5692.hashobj[cljs.core.hash.call(null, k)];
  var i__5694 = cljs.core.truth_(bucket__5693) ? cljs.core.scan_array.call(null, 2, k, bucket__5693) : null;
  if(cljs.core.truth_(i__5694)) {
    return bucket__5693[i__5694 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5695 = this;
  var h__5696 = cljs.core.hash.call(null, k);
  var bucket__5697 = this__5695.hashobj[h__5696];
  if(cljs.core.truth_(bucket__5697)) {
    var new_bucket__5698 = cljs.core.aclone.call(null, bucket__5697);
    var new_hashobj__5699 = goog.object.clone.call(null, this__5695.hashobj);
    new_hashobj__5699[h__5696] = new_bucket__5698;
    var temp__3971__auto____5700 = cljs.core.scan_array.call(null, 2, k, new_bucket__5698);
    if(cljs.core.truth_(temp__3971__auto____5700)) {
      var i__5701 = temp__3971__auto____5700;
      new_bucket__5698[i__5701 + 1] = v;
      return new cljs.core.HashMap(this__5695.meta, this__5695.count, new_hashobj__5699, null)
    }else {
      new_bucket__5698.push(k, v);
      return new cljs.core.HashMap(this__5695.meta, this__5695.count + 1, new_hashobj__5699, null)
    }
  }else {
    var new_hashobj__5702 = goog.object.clone.call(null, this__5695.hashobj);
    new_hashobj__5702[h__5696] = [k, v];
    return new cljs.core.HashMap(this__5695.meta, this__5695.count + 1, new_hashobj__5702, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5703 = this;
  var bucket__5704 = this__5703.hashobj[cljs.core.hash.call(null, k)];
  var i__5705 = cljs.core.truth_(bucket__5704) ? cljs.core.scan_array.call(null, 2, k, bucket__5704) : null;
  if(cljs.core.truth_(i__5705)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__5728 = null;
  var G__5728__2 = function(tsym5686, k) {
    var this__5706 = this;
    var tsym5686__5707 = this;
    var coll__5708 = tsym5686__5707;
    return cljs.core._lookup.call(null, coll__5708, k)
  };
  var G__5728__3 = function(tsym5687, k, not_found) {
    var this__5709 = this;
    var tsym5687__5710 = this;
    var coll__5711 = tsym5687__5710;
    return cljs.core._lookup.call(null, coll__5711, k, not_found)
  };
  G__5728 = function(tsym5687, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5728__2.call(this, tsym5687, k);
      case 3:
        return G__5728__3.call(this, tsym5687, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5728
}();
cljs.core.HashMap.prototype.apply = function(tsym5684, args5685) {
  return tsym5684.call.apply(tsym5684, [tsym5684].concat(cljs.core.aclone.call(null, args5685)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5712 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__5713 = this;
  var this$__5714 = this;
  return cljs.core.pr_str.call(null, this$__5714)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5715 = this;
  if(this__5715.count > 0) {
    var hashes__5716 = cljs.core.js_keys.call(null, this__5715.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__5683_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__5715.hashobj[p1__5683_SHARP_]))
    }, hashes__5716)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5717 = this;
  return this__5717.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5718 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5719 = this;
  return new cljs.core.HashMap(meta, this__5719.count, this__5719.hashobj, this__5719.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5720 = this;
  return this__5720.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5721 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__5721.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5722 = this;
  var h__5723 = cljs.core.hash.call(null, k);
  var bucket__5724 = this__5722.hashobj[h__5723];
  var i__5725 = cljs.core.truth_(bucket__5724) ? cljs.core.scan_array.call(null, 2, k, bucket__5724) : null;
  if(cljs.core.not.call(null, i__5725)) {
    return coll
  }else {
    var new_hashobj__5726 = goog.object.clone.call(null, this__5722.hashobj);
    if(3 > bucket__5724.length) {
      cljs.core.js_delete.call(null, new_hashobj__5726, h__5723)
    }else {
      var new_bucket__5727 = cljs.core.aclone.call(null, bucket__5724);
      new_bucket__5727.splice(i__5725, 2);
      new_hashobj__5726[h__5723] = new_bucket__5727
    }
    return new cljs.core.HashMap(this__5722.meta, this__5722.count - 1, new_hashobj__5726, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__5729 = ks.length;
  var i__5730 = 0;
  var out__5731 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__5730 < len__5729) {
      var G__5732 = i__5730 + 1;
      var G__5733 = cljs.core.assoc.call(null, out__5731, ks[i__5730], vs[i__5730]);
      i__5730 = G__5732;
      out__5731 = G__5733;
      continue
    }else {
      return out__5731
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__5734 = m.arr;
  var len__5735 = arr__5734.length;
  var i__5736 = 0;
  while(true) {
    if(len__5735 <= i__5736) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__5734[i__5736], k)) {
        return i__5736
      }else {
        if("\ufdd0'else") {
          var G__5737 = i__5736 + 2;
          i__5736 = G__5737;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
void 0;
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5742 = this;
  return new cljs.core.TransientArrayMap({}, this__5742.arr.length, cljs.core.aclone.call(null, this__5742.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5743 = this;
  var h__364__auto____5744 = this__5743.__hash;
  if(h__364__auto____5744 != null) {
    return h__364__auto____5744
  }else {
    var h__364__auto____5745 = cljs.core.hash_imap.call(null, coll);
    this__5743.__hash = h__364__auto____5745;
    return h__364__auto____5745
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5746 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5747 = this;
  var idx__5748 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5748 === -1) {
    return not_found
  }else {
    return this__5747.arr[idx__5748 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5749 = this;
  var idx__5750 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5750 === -1) {
    if(this__5749.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__5749.meta, this__5749.cnt + 1, function() {
        var G__5751__5752 = cljs.core.aclone.call(null, this__5749.arr);
        G__5751__5752.push(k);
        G__5751__5752.push(v);
        return G__5751__5752
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__5749.arr[idx__5750 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__5749.meta, this__5749.cnt, function() {
          var G__5753__5754 = cljs.core.aclone.call(null, this__5749.arr);
          G__5753__5754[idx__5750 + 1] = v;
          return G__5753__5754
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5755 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__5785 = null;
  var G__5785__2 = function(tsym5740, k) {
    var this__5756 = this;
    var tsym5740__5757 = this;
    var coll__5758 = tsym5740__5757;
    return cljs.core._lookup.call(null, coll__5758, k)
  };
  var G__5785__3 = function(tsym5741, k, not_found) {
    var this__5759 = this;
    var tsym5741__5760 = this;
    var coll__5761 = tsym5741__5760;
    return cljs.core._lookup.call(null, coll__5761, k, not_found)
  };
  G__5785 = function(tsym5741, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5785__2.call(this, tsym5741, k);
      case 3:
        return G__5785__3.call(this, tsym5741, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5785
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym5738, args5739) {
  return tsym5738.call.apply(tsym5738, [tsym5738].concat(cljs.core.aclone.call(null, args5739)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__5762 = this;
  var len__5763 = this__5762.arr.length;
  var i__5764 = 0;
  var init__5765 = init;
  while(true) {
    if(i__5764 < len__5763) {
      var init__5766 = f.call(null, init__5765, this__5762.arr[i__5764], this__5762.arr[i__5764 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__5766)) {
        return cljs.core.deref.call(null, init__5766)
      }else {
        var G__5786 = i__5764 + 2;
        var G__5787 = init__5766;
        i__5764 = G__5786;
        init__5765 = G__5787;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5767 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__5768 = this;
  var this$__5769 = this;
  return cljs.core.pr_str.call(null, this$__5769)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5770 = this;
  if(this__5770.cnt > 0) {
    var len__5771 = this__5770.arr.length;
    var array_map_seq__5772 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__5771) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__5770.arr[i], this__5770.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__5772.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5773 = this;
  return this__5773.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5774 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5775 = this;
  return new cljs.core.PersistentArrayMap(meta, this__5775.cnt, this__5775.arr, this__5775.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5776 = this;
  return this__5776.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5777 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__5777.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5778 = this;
  var idx__5779 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5779 >= 0) {
    var len__5780 = this__5778.arr.length;
    var new_len__5781 = len__5780 - 2;
    if(new_len__5781 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__5782 = cljs.core.make_array.call(null, new_len__5781);
      var s__5783 = 0;
      var d__5784 = 0;
      while(true) {
        if(s__5783 >= len__5780) {
          return new cljs.core.PersistentArrayMap(this__5778.meta, this__5778.cnt - 1, new_arr__5782, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__5778.arr[s__5783])) {
            var G__5788 = s__5783 + 2;
            var G__5789 = d__5784;
            s__5783 = G__5788;
            d__5784 = G__5789;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__5782[d__5784] = this__5778.arr[s__5783];
              new_arr__5782[d__5784 + 1] = this__5778.arr[s__5783 + 1];
              var G__5790 = s__5783 + 2;
              var G__5791 = d__5784 + 2;
              s__5783 = G__5790;
              d__5784 = G__5791;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__5792 = cljs.core.count.call(null, ks);
  var i__5793 = 0;
  var out__5794 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__5793 < len__5792) {
      var G__5795 = i__5793 + 1;
      var G__5796 = cljs.core.assoc_BANG_.call(null, out__5794, ks[i__5793], vs[i__5793]);
      i__5793 = G__5795;
      out__5794 = G__5796;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5794)
    }
    break
  }
};
void 0;
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__5797 = this;
  if(cljs.core.truth_(this__5797.editable_QMARK_)) {
    var idx__5798 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__5798 >= 0) {
      this__5797.arr[idx__5798] = this__5797.arr[this__5797.len - 2];
      this__5797.arr[idx__5798 + 1] = this__5797.arr[this__5797.len - 1];
      var G__5799__5800 = this__5797.arr;
      G__5799__5800.pop();
      G__5799__5800.pop();
      G__5799__5800;
      this__5797.len = this__5797.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__5801 = this;
  if(cljs.core.truth_(this__5801.editable_QMARK_)) {
    var idx__5802 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__5802 === -1) {
      if(this__5801.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__5801.len = this__5801.len + 2;
        this__5801.arr.push(key);
        this__5801.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__5801.len, this__5801.arr), key, val)
      }
    }else {
      if(val === this__5801.arr[idx__5802 + 1]) {
        return tcoll
      }else {
        this__5801.arr[idx__5802 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5803 = this;
  if(cljs.core.truth_(this__5803.editable_QMARK_)) {
    if(function() {
      var G__5804__5805 = o;
      if(G__5804__5805 != null) {
        if(function() {
          var or__3824__auto____5806 = G__5804__5805.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____5806) {
            return or__3824__auto____5806
          }else {
            return G__5804__5805.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__5804__5805.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5804__5805)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5804__5805)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__5807 = cljs.core.seq.call(null, o);
      var tcoll__5808 = tcoll;
      while(true) {
        var temp__3971__auto____5809 = cljs.core.first.call(null, es__5807);
        if(cljs.core.truth_(temp__3971__auto____5809)) {
          var e__5810 = temp__3971__auto____5809;
          var G__5816 = cljs.core.next.call(null, es__5807);
          var G__5817 = cljs.core._assoc_BANG_.call(null, tcoll__5808, cljs.core.key.call(null, e__5810), cljs.core.val.call(null, e__5810));
          es__5807 = G__5816;
          tcoll__5808 = G__5817;
          continue
        }else {
          return tcoll__5808
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5811 = this;
  if(cljs.core.truth_(this__5811.editable_QMARK_)) {
    this__5811.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__5811.len, 2), this__5811.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__5812 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__5813 = this;
  if(cljs.core.truth_(this__5813.editable_QMARK_)) {
    var idx__5814 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__5814 === -1) {
      return not_found
    }else {
      return this__5813.arr[idx__5814 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__5815 = this;
  if(cljs.core.truth_(this__5815.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__5815.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__5818 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__5819 = 0;
  while(true) {
    if(i__5819 < len) {
      var G__5820 = cljs.core.assoc_BANG_.call(null, out__5818, arr[i__5819], arr[i__5819 + 1]);
      var G__5821 = i__5819 + 2;
      out__5818 = G__5820;
      i__5819 = G__5821;
      continue
    }else {
      return out__5818
    }
    break
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__5822__5823 = cljs.core.aclone.call(null, arr);
    G__5822__5823[i] = a;
    return G__5822__5823
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__5824__5825 = cljs.core.aclone.call(null, arr);
    G__5824__5825[i] = a;
    G__5824__5825[j] = b;
    return G__5824__5825
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__5826 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__5826, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__5826, 2 * i, new_arr__5826.length - 2 * i);
  return new_arr__5826
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__5827 = inode.ensure_editable(edit);
    editable__5827.arr[i] = a;
    return editable__5827
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__5828 = inode.ensure_editable(edit);
    editable__5828.arr[i] = a;
    editable__5828.arr[j] = b;
    return editable__5828
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__5829 = arr.length;
  var i__5830 = 0;
  var init__5831 = init;
  while(true) {
    if(i__5830 < len__5829) {
      var init__5834 = function() {
        var k__5832 = arr[i__5830];
        if(k__5832 != null) {
          return f.call(null, init__5831, k__5832, arr[i__5830 + 1])
        }else {
          var node__5833 = arr[i__5830 + 1];
          if(node__5833 != null) {
            return node__5833.kv_reduce(f, init__5831)
          }else {
            return init__5831
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5834)) {
        return cljs.core.deref.call(null, init__5834)
      }else {
        var G__5835 = i__5830 + 2;
        var G__5836 = init__5834;
        i__5830 = G__5835;
        init__5831 = G__5836;
        continue
      }
    }else {
      return init__5831
    }
    break
  }
};
void 0;
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__5837 = this;
  var inode__5838 = this;
  if(this__5837.bitmap === bit) {
    return null
  }else {
    var editable__5839 = inode__5838.ensure_editable(e);
    var earr__5840 = editable__5839.arr;
    var len__5841 = earr__5840.length;
    editable__5839.bitmap = bit ^ editable__5839.bitmap;
    cljs.core.array_copy.call(null, earr__5840, 2 * (i + 1), earr__5840, 2 * i, len__5841 - 2 * (i + 1));
    earr__5840[len__5841 - 2] = null;
    earr__5840[len__5841 - 1] = null;
    return editable__5839
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5842 = this;
  var inode__5843 = this;
  var bit__5844 = 1 << (hash >>> shift & 31);
  var idx__5845 = cljs.core.bitmap_indexed_node_index.call(null, this__5842.bitmap, bit__5844);
  if((this__5842.bitmap & bit__5844) === 0) {
    var n__5846 = cljs.core.bit_count.call(null, this__5842.bitmap);
    if(2 * n__5846 < this__5842.arr.length) {
      var editable__5847 = inode__5843.ensure_editable(edit);
      var earr__5848 = editable__5847.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__5848, 2 * idx__5845, earr__5848, 2 * (idx__5845 + 1), 2 * (n__5846 - idx__5845));
      earr__5848[2 * idx__5845] = key;
      earr__5848[2 * idx__5845 + 1] = val;
      editable__5847.bitmap = editable__5847.bitmap | bit__5844;
      return editable__5847
    }else {
      if(n__5846 >= 16) {
        var nodes__5849 = cljs.core.make_array.call(null, 32);
        var jdx__5850 = hash >>> shift & 31;
        nodes__5849[jdx__5850] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__5851 = 0;
        var j__5852 = 0;
        while(true) {
          if(i__5851 < 32) {
            if((this__5842.bitmap >>> i__5851 & 1) === 0) {
              var G__5905 = i__5851 + 1;
              var G__5906 = j__5852;
              i__5851 = G__5905;
              j__5852 = G__5906;
              continue
            }else {
              nodes__5849[i__5851] = null != this__5842.arr[j__5852] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__5842.arr[j__5852]), this__5842.arr[j__5852], this__5842.arr[j__5852 + 1], added_leaf_QMARK_) : this__5842.arr[j__5852 + 1];
              var G__5907 = i__5851 + 1;
              var G__5908 = j__5852 + 2;
              i__5851 = G__5907;
              j__5852 = G__5908;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__5846 + 1, nodes__5849)
      }else {
        if("\ufdd0'else") {
          var new_arr__5853 = cljs.core.make_array.call(null, 2 * (n__5846 + 4));
          cljs.core.array_copy.call(null, this__5842.arr, 0, new_arr__5853, 0, 2 * idx__5845);
          new_arr__5853[2 * idx__5845] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__5853[2 * idx__5845 + 1] = val;
          cljs.core.array_copy.call(null, this__5842.arr, 2 * idx__5845, new_arr__5853, 2 * (idx__5845 + 1), 2 * (n__5846 - idx__5845));
          var editable__5854 = inode__5843.ensure_editable(edit);
          editable__5854.arr = new_arr__5853;
          editable__5854.bitmap = editable__5854.bitmap | bit__5844;
          return editable__5854
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__5855 = this__5842.arr[2 * idx__5845];
    var val_or_node__5856 = this__5842.arr[2 * idx__5845 + 1];
    if(null == key_or_nil__5855) {
      var n__5857 = val_or_node__5856.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__5857 === val_or_node__5856) {
        return inode__5843
      }else {
        return cljs.core.edit_and_set.call(null, inode__5843, edit, 2 * idx__5845 + 1, n__5857)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5855)) {
        if(val === val_or_node__5856) {
          return inode__5843
        }else {
          return cljs.core.edit_and_set.call(null, inode__5843, edit, 2 * idx__5845 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__5843, edit, 2 * idx__5845, null, 2 * idx__5845 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__5855, val_or_node__5856, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__5858 = this;
  var inode__5859 = this;
  return cljs.core.create_inode_seq.call(null, this__5858.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__5860 = this;
  var inode__5861 = this;
  var bit__5862 = 1 << (hash >>> shift & 31);
  if((this__5860.bitmap & bit__5862) === 0) {
    return inode__5861
  }else {
    var idx__5863 = cljs.core.bitmap_indexed_node_index.call(null, this__5860.bitmap, bit__5862);
    var key_or_nil__5864 = this__5860.arr[2 * idx__5863];
    var val_or_node__5865 = this__5860.arr[2 * idx__5863 + 1];
    if(null == key_or_nil__5864) {
      var n__5866 = val_or_node__5865.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__5866 === val_or_node__5865) {
        return inode__5861
      }else {
        if(null != n__5866) {
          return cljs.core.edit_and_set.call(null, inode__5861, edit, 2 * idx__5863 + 1, n__5866)
        }else {
          if(this__5860.bitmap === bit__5862) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__5861.edit_and_remove_pair(edit, bit__5862, idx__5863)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5864)) {
        removed_leaf_QMARK_[0] = true;
        return inode__5861.edit_and_remove_pair(edit, bit__5862, idx__5863)
      }else {
        if("\ufdd0'else") {
          return inode__5861
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__5867 = this;
  var inode__5868 = this;
  if(e === this__5867.edit) {
    return inode__5868
  }else {
    var n__5869 = cljs.core.bit_count.call(null, this__5867.bitmap);
    var new_arr__5870 = cljs.core.make_array.call(null, n__5869 < 0 ? 4 : 2 * (n__5869 + 1));
    cljs.core.array_copy.call(null, this__5867.arr, 0, new_arr__5870, 0, 2 * n__5869);
    return new cljs.core.BitmapIndexedNode(e, this__5867.bitmap, new_arr__5870)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__5871 = this;
  var inode__5872 = this;
  return cljs.core.inode_kv_reduce.call(null, this__5871.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__5909 = null;
  var G__5909__3 = function(shift, hash, key) {
    var this__5873 = this;
    var inode__5874 = this;
    var bit__5875 = 1 << (hash >>> shift & 31);
    if((this__5873.bitmap & bit__5875) === 0) {
      return null
    }else {
      var idx__5876 = cljs.core.bitmap_indexed_node_index.call(null, this__5873.bitmap, bit__5875);
      var key_or_nil__5877 = this__5873.arr[2 * idx__5876];
      var val_or_node__5878 = this__5873.arr[2 * idx__5876 + 1];
      if(null == key_or_nil__5877) {
        return val_or_node__5878.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__5877)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__5877, val_or_node__5878])
        }else {
          if("\ufdd0'else") {
            return null
          }else {
            return null
          }
        }
      }
    }
  };
  var G__5909__4 = function(shift, hash, key, not_found) {
    var this__5879 = this;
    var inode__5880 = this;
    var bit__5881 = 1 << (hash >>> shift & 31);
    if((this__5879.bitmap & bit__5881) === 0) {
      return not_found
    }else {
      var idx__5882 = cljs.core.bitmap_indexed_node_index.call(null, this__5879.bitmap, bit__5881);
      var key_or_nil__5883 = this__5879.arr[2 * idx__5882];
      var val_or_node__5884 = this__5879.arr[2 * idx__5882 + 1];
      if(null == key_or_nil__5883) {
        return val_or_node__5884.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__5883)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__5883, val_or_node__5884])
        }else {
          if("\ufdd0'else") {
            return not_found
          }else {
            return null
          }
        }
      }
    }
  };
  G__5909 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__5909__3.call(this, shift, hash, key);
      case 4:
        return G__5909__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5909
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__5885 = this;
  var inode__5886 = this;
  var bit__5887 = 1 << (hash >>> shift & 31);
  if((this__5885.bitmap & bit__5887) === 0) {
    return inode__5886
  }else {
    var idx__5888 = cljs.core.bitmap_indexed_node_index.call(null, this__5885.bitmap, bit__5887);
    var key_or_nil__5889 = this__5885.arr[2 * idx__5888];
    var val_or_node__5890 = this__5885.arr[2 * idx__5888 + 1];
    if(null == key_or_nil__5889) {
      var n__5891 = val_or_node__5890.inode_without(shift + 5, hash, key);
      if(n__5891 === val_or_node__5890) {
        return inode__5886
      }else {
        if(null != n__5891) {
          return new cljs.core.BitmapIndexedNode(null, this__5885.bitmap, cljs.core.clone_and_set.call(null, this__5885.arr, 2 * idx__5888 + 1, n__5891))
        }else {
          if(this__5885.bitmap === bit__5887) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__5885.bitmap ^ bit__5887, cljs.core.remove_pair.call(null, this__5885.arr, idx__5888))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5889)) {
        return new cljs.core.BitmapIndexedNode(null, this__5885.bitmap ^ bit__5887, cljs.core.remove_pair.call(null, this__5885.arr, idx__5888))
      }else {
        if("\ufdd0'else") {
          return inode__5886
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__5892 = this;
  var inode__5893 = this;
  var bit__5894 = 1 << (hash >>> shift & 31);
  var idx__5895 = cljs.core.bitmap_indexed_node_index.call(null, this__5892.bitmap, bit__5894);
  if((this__5892.bitmap & bit__5894) === 0) {
    var n__5896 = cljs.core.bit_count.call(null, this__5892.bitmap);
    if(n__5896 >= 16) {
      var nodes__5897 = cljs.core.make_array.call(null, 32);
      var jdx__5898 = hash >>> shift & 31;
      nodes__5897[jdx__5898] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__5899 = 0;
      var j__5900 = 0;
      while(true) {
        if(i__5899 < 32) {
          if((this__5892.bitmap >>> i__5899 & 1) === 0) {
            var G__5910 = i__5899 + 1;
            var G__5911 = j__5900;
            i__5899 = G__5910;
            j__5900 = G__5911;
            continue
          }else {
            nodes__5897[i__5899] = null != this__5892.arr[j__5900] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__5892.arr[j__5900]), this__5892.arr[j__5900], this__5892.arr[j__5900 + 1], added_leaf_QMARK_) : this__5892.arr[j__5900 + 1];
            var G__5912 = i__5899 + 1;
            var G__5913 = j__5900 + 2;
            i__5899 = G__5912;
            j__5900 = G__5913;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__5896 + 1, nodes__5897)
    }else {
      var new_arr__5901 = cljs.core.make_array.call(null, 2 * (n__5896 + 1));
      cljs.core.array_copy.call(null, this__5892.arr, 0, new_arr__5901, 0, 2 * idx__5895);
      new_arr__5901[2 * idx__5895] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__5901[2 * idx__5895 + 1] = val;
      cljs.core.array_copy.call(null, this__5892.arr, 2 * idx__5895, new_arr__5901, 2 * (idx__5895 + 1), 2 * (n__5896 - idx__5895));
      return new cljs.core.BitmapIndexedNode(null, this__5892.bitmap | bit__5894, new_arr__5901)
    }
  }else {
    var key_or_nil__5902 = this__5892.arr[2 * idx__5895];
    var val_or_node__5903 = this__5892.arr[2 * idx__5895 + 1];
    if(null == key_or_nil__5902) {
      var n__5904 = val_or_node__5903.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__5904 === val_or_node__5903) {
        return inode__5893
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__5892.bitmap, cljs.core.clone_and_set.call(null, this__5892.arr, 2 * idx__5895 + 1, n__5904))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5902)) {
        if(val === val_or_node__5903) {
          return inode__5893
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__5892.bitmap, cljs.core.clone_and_set.call(null, this__5892.arr, 2 * idx__5895 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__5892.bitmap, cljs.core.clone_and_set.call(null, this__5892.arr, 2 * idx__5895, null, 2 * idx__5895 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__5902, val_or_node__5903, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__5914 = array_node.arr;
  var len__5915 = 2 * (array_node.cnt - 1);
  var new_arr__5916 = cljs.core.make_array.call(null, len__5915);
  var i__5917 = 0;
  var j__5918 = 1;
  var bitmap__5919 = 0;
  while(true) {
    if(i__5917 < len__5915) {
      if(function() {
        var and__3822__auto____5920 = i__5917 != idx;
        if(and__3822__auto____5920) {
          return null != arr__5914[i__5917]
        }else {
          return and__3822__auto____5920
        }
      }()) {
        new_arr__5916[j__5918] = arr__5914[i__5917];
        var G__5921 = i__5917 + 1;
        var G__5922 = j__5918 + 2;
        var G__5923 = bitmap__5919 | 1 << i__5917;
        i__5917 = G__5921;
        j__5918 = G__5922;
        bitmap__5919 = G__5923;
        continue
      }else {
        var G__5924 = i__5917 + 1;
        var G__5925 = j__5918;
        var G__5926 = bitmap__5919;
        i__5917 = G__5924;
        j__5918 = G__5925;
        bitmap__5919 = G__5926;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__5919, new_arr__5916)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__5927 = this;
  var inode__5928 = this;
  var idx__5929 = hash >>> shift & 31;
  var node__5930 = this__5927.arr[idx__5929];
  if(null == node__5930) {
    return new cljs.core.ArrayNode(null, this__5927.cnt + 1, cljs.core.clone_and_set.call(null, this__5927.arr, idx__5929, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__5931 = node__5930.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__5931 === node__5930) {
      return inode__5928
    }else {
      return new cljs.core.ArrayNode(null, this__5927.cnt, cljs.core.clone_and_set.call(null, this__5927.arr, idx__5929, n__5931))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__5932 = this;
  var inode__5933 = this;
  var idx__5934 = hash >>> shift & 31;
  var node__5935 = this__5932.arr[idx__5934];
  if(null != node__5935) {
    var n__5936 = node__5935.inode_without(shift + 5, hash, key);
    if(n__5936 === node__5935) {
      return inode__5933
    }else {
      if(n__5936 == null) {
        if(this__5932.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__5933, null, idx__5934)
        }else {
          return new cljs.core.ArrayNode(null, this__5932.cnt - 1, cljs.core.clone_and_set.call(null, this__5932.arr, idx__5934, n__5936))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__5932.cnt, cljs.core.clone_and_set.call(null, this__5932.arr, idx__5934, n__5936))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__5933
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__5968 = null;
  var G__5968__3 = function(shift, hash, key) {
    var this__5937 = this;
    var inode__5938 = this;
    var idx__5939 = hash >>> shift & 31;
    var node__5940 = this__5937.arr[idx__5939];
    if(null != node__5940) {
      return node__5940.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__5968__4 = function(shift, hash, key, not_found) {
    var this__5941 = this;
    var inode__5942 = this;
    var idx__5943 = hash >>> shift & 31;
    var node__5944 = this__5941.arr[idx__5943];
    if(null != node__5944) {
      return node__5944.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__5968 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__5968__3.call(this, shift, hash, key);
      case 4:
        return G__5968__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5968
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__5945 = this;
  var inode__5946 = this;
  return cljs.core.create_array_node_seq.call(null, this__5945.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__5947 = this;
  var inode__5948 = this;
  if(e === this__5947.edit) {
    return inode__5948
  }else {
    return new cljs.core.ArrayNode(e, this__5947.cnt, cljs.core.aclone.call(null, this__5947.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5949 = this;
  var inode__5950 = this;
  var idx__5951 = hash >>> shift & 31;
  var node__5952 = this__5949.arr[idx__5951];
  if(null == node__5952) {
    var editable__5953 = cljs.core.edit_and_set.call(null, inode__5950, edit, idx__5951, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__5953.cnt = editable__5953.cnt + 1;
    return editable__5953
  }else {
    var n__5954 = node__5952.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__5954 === node__5952) {
      return inode__5950
    }else {
      return cljs.core.edit_and_set.call(null, inode__5950, edit, idx__5951, n__5954)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__5955 = this;
  var inode__5956 = this;
  var idx__5957 = hash >>> shift & 31;
  var node__5958 = this__5955.arr[idx__5957];
  if(null == node__5958) {
    return inode__5956
  }else {
    var n__5959 = node__5958.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__5959 === node__5958) {
      return inode__5956
    }else {
      if(null == n__5959) {
        if(this__5955.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__5956, edit, idx__5957)
        }else {
          var editable__5960 = cljs.core.edit_and_set.call(null, inode__5956, edit, idx__5957, n__5959);
          editable__5960.cnt = editable__5960.cnt - 1;
          return editable__5960
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__5956, edit, idx__5957, n__5959)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__5961 = this;
  var inode__5962 = this;
  var len__5963 = this__5961.arr.length;
  var i__5964 = 0;
  var init__5965 = init;
  while(true) {
    if(i__5964 < len__5963) {
      var node__5966 = this__5961.arr[i__5964];
      if(node__5966 != null) {
        var init__5967 = node__5966.kv_reduce(f, init__5965);
        if(cljs.core.reduced_QMARK_.call(null, init__5967)) {
          return cljs.core.deref.call(null, init__5967)
        }else {
          var G__5969 = i__5964 + 1;
          var G__5970 = init__5967;
          i__5964 = G__5969;
          init__5965 = G__5970;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__5965
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__5971 = 2 * cnt;
  var i__5972 = 0;
  while(true) {
    if(i__5972 < lim__5971) {
      if(cljs.core._EQ_.call(null, key, arr[i__5972])) {
        return i__5972
      }else {
        var G__5973 = i__5972 + 2;
        i__5972 = G__5973;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__5974 = this;
  var inode__5975 = this;
  if(hash === this__5974.collision_hash) {
    var idx__5976 = cljs.core.hash_collision_node_find_index.call(null, this__5974.arr, this__5974.cnt, key);
    if(idx__5976 === -1) {
      var len__5977 = this__5974.arr.length;
      var new_arr__5978 = cljs.core.make_array.call(null, len__5977 + 2);
      cljs.core.array_copy.call(null, this__5974.arr, 0, new_arr__5978, 0, len__5977);
      new_arr__5978[len__5977] = key;
      new_arr__5978[len__5977 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__5974.collision_hash, this__5974.cnt + 1, new_arr__5978)
    }else {
      if(cljs.core._EQ_.call(null, this__5974.arr[idx__5976], val)) {
        return inode__5975
      }else {
        return new cljs.core.HashCollisionNode(null, this__5974.collision_hash, this__5974.cnt, cljs.core.clone_and_set.call(null, this__5974.arr, idx__5976 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__5974.collision_hash >>> shift & 31), [null, inode__5975])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__5979 = this;
  var inode__5980 = this;
  var idx__5981 = cljs.core.hash_collision_node_find_index.call(null, this__5979.arr, this__5979.cnt, key);
  if(idx__5981 === -1) {
    return inode__5980
  }else {
    if(this__5979.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__5979.collision_hash, this__5979.cnt - 1, cljs.core.remove_pair.call(null, this__5979.arr, cljs.core.quot.call(null, idx__5981, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__6008 = null;
  var G__6008__3 = function(shift, hash, key) {
    var this__5982 = this;
    var inode__5983 = this;
    var idx__5984 = cljs.core.hash_collision_node_find_index.call(null, this__5982.arr, this__5982.cnt, key);
    if(idx__5984 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__5982.arr[idx__5984])) {
        return cljs.core.PersistentVector.fromArray([this__5982.arr[idx__5984], this__5982.arr[idx__5984 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__6008__4 = function(shift, hash, key, not_found) {
    var this__5985 = this;
    var inode__5986 = this;
    var idx__5987 = cljs.core.hash_collision_node_find_index.call(null, this__5985.arr, this__5985.cnt, key);
    if(idx__5987 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__5985.arr[idx__5987])) {
        return cljs.core.PersistentVector.fromArray([this__5985.arr[idx__5987], this__5985.arr[idx__5987 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__6008 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__6008__3.call(this, shift, hash, key);
      case 4:
        return G__6008__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6008
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__5988 = this;
  var inode__5989 = this;
  return cljs.core.create_inode_seq.call(null, this__5988.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__6009 = null;
  var G__6009__1 = function(e) {
    var this__5990 = this;
    var inode__5991 = this;
    if(e === this__5990.edit) {
      return inode__5991
    }else {
      var new_arr__5992 = cljs.core.make_array.call(null, 2 * (this__5990.cnt + 1));
      cljs.core.array_copy.call(null, this__5990.arr, 0, new_arr__5992, 0, 2 * this__5990.cnt);
      return new cljs.core.HashCollisionNode(e, this__5990.collision_hash, this__5990.cnt, new_arr__5992)
    }
  };
  var G__6009__3 = function(e, count, array) {
    var this__5993 = this;
    var inode__5994 = this;
    if(e === this__5993.edit) {
      this__5993.arr = array;
      this__5993.cnt = count;
      return inode__5994
    }else {
      return new cljs.core.HashCollisionNode(this__5993.edit, this__5993.collision_hash, count, array)
    }
  };
  G__6009 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__6009__1.call(this, e);
      case 3:
        return G__6009__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6009
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5995 = this;
  var inode__5996 = this;
  if(hash === this__5995.collision_hash) {
    var idx__5997 = cljs.core.hash_collision_node_find_index.call(null, this__5995.arr, this__5995.cnt, key);
    if(idx__5997 === -1) {
      if(this__5995.arr.length > 2 * this__5995.cnt) {
        var editable__5998 = cljs.core.edit_and_set.call(null, inode__5996, edit, 2 * this__5995.cnt, key, 2 * this__5995.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__5998.cnt = editable__5998.cnt + 1;
        return editable__5998
      }else {
        var len__5999 = this__5995.arr.length;
        var new_arr__6000 = cljs.core.make_array.call(null, len__5999 + 2);
        cljs.core.array_copy.call(null, this__5995.arr, 0, new_arr__6000, 0, len__5999);
        new_arr__6000[len__5999] = key;
        new_arr__6000[len__5999 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__5996.ensure_editable(edit, this__5995.cnt + 1, new_arr__6000)
      }
    }else {
      if(this__5995.arr[idx__5997 + 1] === val) {
        return inode__5996
      }else {
        return cljs.core.edit_and_set.call(null, inode__5996, edit, idx__5997 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__5995.collision_hash >>> shift & 31), [null, inode__5996, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__6001 = this;
  var inode__6002 = this;
  var idx__6003 = cljs.core.hash_collision_node_find_index.call(null, this__6001.arr, this__6001.cnt, key);
  if(idx__6003 === -1) {
    return inode__6002
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__6001.cnt === 1) {
      return null
    }else {
      var editable__6004 = inode__6002.ensure_editable(edit);
      var earr__6005 = editable__6004.arr;
      earr__6005[idx__6003] = earr__6005[2 * this__6001.cnt - 2];
      earr__6005[idx__6003 + 1] = earr__6005[2 * this__6001.cnt - 1];
      earr__6005[2 * this__6001.cnt - 1] = null;
      earr__6005[2 * this__6001.cnt - 2] = null;
      editable__6004.cnt = editable__6004.cnt - 1;
      return editable__6004
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__6006 = this;
  var inode__6007 = this;
  return cljs.core.inode_kv_reduce.call(null, this__6006.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__6010 = cljs.core.hash.call(null, key1);
    if(key1hash__6010 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__6010, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___6011 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__6010, key1, val1, added_leaf_QMARK___6011).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___6011)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__6012 = cljs.core.hash.call(null, key1);
    if(key1hash__6012 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__6012, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___6013 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__6012, key1, val1, added_leaf_QMARK___6013).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___6013)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6014 = this;
  var h__364__auto____6015 = this__6014.__hash;
  if(h__364__auto____6015 != null) {
    return h__364__auto____6015
  }else {
    var h__364__auto____6016 = cljs.core.hash_coll.call(null, coll);
    this__6014.__hash = h__364__auto____6016;
    return h__364__auto____6016
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6017 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__6018 = this;
  var this$__6019 = this;
  return cljs.core.pr_str.call(null, this$__6019)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6020 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6021 = this;
  if(this__6021.s == null) {
    return cljs.core.PersistentVector.fromArray([this__6021.nodes[this__6021.i], this__6021.nodes[this__6021.i + 1]])
  }else {
    return cljs.core.first.call(null, this__6021.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6022 = this;
  if(this__6022.s == null) {
    return cljs.core.create_inode_seq.call(null, this__6022.nodes, this__6022.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__6022.nodes, this__6022.i, cljs.core.next.call(null, this__6022.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6023 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6024 = this;
  return new cljs.core.NodeSeq(meta, this__6024.nodes, this__6024.i, this__6024.s, this__6024.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6025 = this;
  return this__6025.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6026 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6026.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__6027 = nodes.length;
      var j__6028 = i;
      while(true) {
        if(j__6028 < len__6027) {
          if(null != nodes[j__6028]) {
            return new cljs.core.NodeSeq(null, nodes, j__6028, null, null)
          }else {
            var temp__3971__auto____6029 = nodes[j__6028 + 1];
            if(cljs.core.truth_(temp__3971__auto____6029)) {
              var node__6030 = temp__3971__auto____6029;
              var temp__3971__auto____6031 = node__6030.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____6031)) {
                var node_seq__6032 = temp__3971__auto____6031;
                return new cljs.core.NodeSeq(null, nodes, j__6028 + 2, node_seq__6032, null)
              }else {
                var G__6033 = j__6028 + 2;
                j__6028 = G__6033;
                continue
              }
            }else {
              var G__6034 = j__6028 + 2;
              j__6028 = G__6034;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6035 = this;
  var h__364__auto____6036 = this__6035.__hash;
  if(h__364__auto____6036 != null) {
    return h__364__auto____6036
  }else {
    var h__364__auto____6037 = cljs.core.hash_coll.call(null, coll);
    this__6035.__hash = h__364__auto____6037;
    return h__364__auto____6037
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6038 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__6039 = this;
  var this$__6040 = this;
  return cljs.core.pr_str.call(null, this$__6040)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6041 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6042 = this;
  return cljs.core.first.call(null, this__6042.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6043 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__6043.nodes, this__6043.i, cljs.core.next.call(null, this__6043.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6044 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6045 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__6045.nodes, this__6045.i, this__6045.s, this__6045.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6046 = this;
  return this__6046.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6047 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6047.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__6048 = nodes.length;
      var j__6049 = i;
      while(true) {
        if(j__6049 < len__6048) {
          var temp__3971__auto____6050 = nodes[j__6049];
          if(cljs.core.truth_(temp__3971__auto____6050)) {
            var nj__6051 = temp__3971__auto____6050;
            var temp__3971__auto____6052 = nj__6051.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____6052)) {
              var ns__6053 = temp__3971__auto____6052;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__6049 + 1, ns__6053, null)
            }else {
              var G__6054 = j__6049 + 1;
              j__6049 = G__6054;
              continue
            }
          }else {
            var G__6055 = j__6049 + 1;
            j__6049 = G__6055;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
void 0;
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6060 = this;
  return new cljs.core.TransientHashMap({}, this__6060.root, this__6060.cnt, this__6060.has_nil_QMARK_, this__6060.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6061 = this;
  var h__364__auto____6062 = this__6061.__hash;
  if(h__364__auto____6062 != null) {
    return h__364__auto____6062
  }else {
    var h__364__auto____6063 = cljs.core.hash_imap.call(null, coll);
    this__6061.__hash = h__364__auto____6063;
    return h__364__auto____6063
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6064 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6065 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6065.has_nil_QMARK_)) {
      return this__6065.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6065.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__6065.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6066 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____6067 = this__6066.has_nil_QMARK_;
      if(cljs.core.truth_(and__3822__auto____6067)) {
        return v === this__6066.nil_val
      }else {
        return and__3822__auto____6067
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6066.meta, cljs.core.truth_(this__6066.has_nil_QMARK_) ? this__6066.cnt : this__6066.cnt + 1, this__6066.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___6068 = [false];
    var new_root__6069 = (this__6066.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6066.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6068);
    if(new_root__6069 === this__6066.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6066.meta, cljs.core.truth_(added_leaf_QMARK___6068[0]) ? this__6066.cnt + 1 : this__6066.cnt, new_root__6069, this__6066.has_nil_QMARK_, this__6066.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6070 = this;
  if(k == null) {
    return this__6070.has_nil_QMARK_
  }else {
    if(this__6070.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__6070.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__6091 = null;
  var G__6091__2 = function(tsym6058, k) {
    var this__6071 = this;
    var tsym6058__6072 = this;
    var coll__6073 = tsym6058__6072;
    return cljs.core._lookup.call(null, coll__6073, k)
  };
  var G__6091__3 = function(tsym6059, k, not_found) {
    var this__6074 = this;
    var tsym6059__6075 = this;
    var coll__6076 = tsym6059__6075;
    return cljs.core._lookup.call(null, coll__6076, k, not_found)
  };
  G__6091 = function(tsym6059, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6091__2.call(this, tsym6059, k);
      case 3:
        return G__6091__3.call(this, tsym6059, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6091
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym6056, args6057) {
  return tsym6056.call.apply(tsym6056, [tsym6056].concat(cljs.core.aclone.call(null, args6057)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6077 = this;
  var init__6078 = cljs.core.truth_(this__6077.has_nil_QMARK_) ? f.call(null, init, null, this__6077.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__6078)) {
    return cljs.core.deref.call(null, init__6078)
  }else {
    if(null != this__6077.root) {
      return this__6077.root.kv_reduce(f, init__6078)
    }else {
      if("\ufdd0'else") {
        return init__6078
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6079 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__6080 = this;
  var this$__6081 = this;
  return cljs.core.pr_str.call(null, this$__6081)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6082 = this;
  if(this__6082.cnt > 0) {
    var s__6083 = null != this__6082.root ? this__6082.root.inode_seq() : null;
    if(cljs.core.truth_(this__6082.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__6082.nil_val]), s__6083)
    }else {
      return s__6083
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6084 = this;
  return this__6084.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6085 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6086 = this;
  return new cljs.core.PersistentHashMap(meta, this__6086.cnt, this__6086.root, this__6086.has_nil_QMARK_, this__6086.nil_val, this__6086.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6087 = this;
  return this__6087.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6088 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__6088.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6089 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6089.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__6089.meta, this__6089.cnt - 1, this__6089.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__6089.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__6090 = this__6089.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__6090 === this__6089.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__6089.meta, this__6089.cnt - 1, new_root__6090, this__6089.has_nil_QMARK_, this__6089.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__6092 = ks.length;
  var i__6093 = 0;
  var out__6094 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__6093 < len__6092) {
      var G__6095 = i__6093 + 1;
      var G__6096 = cljs.core.assoc_BANG_.call(null, out__6094, ks[i__6093], vs[i__6093]);
      i__6093 = G__6095;
      out__6094 = G__6096;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6094)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__6097 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__6098 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__6099 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6100 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__6101 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6101.has_nil_QMARK_)) {
      return this__6101.nil_val
    }else {
      return null
    }
  }else {
    if(this__6101.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__6101.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__6102 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6102.has_nil_QMARK_)) {
      return this__6102.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6102.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__6102.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6103 = this;
  if(cljs.core.truth_(this__6103.edit)) {
    return this__6103.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__6104 = this;
  var tcoll__6105 = this;
  if(cljs.core.truth_(this__6104.edit)) {
    if(function() {
      var G__6106__6107 = o;
      if(G__6106__6107 != null) {
        if(function() {
          var or__3824__auto____6108 = G__6106__6107.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____6108) {
            return or__3824__auto____6108
          }else {
            return G__6106__6107.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__6106__6107.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6106__6107)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6106__6107)
      }
    }()) {
      return tcoll__6105.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__6109 = cljs.core.seq.call(null, o);
      var tcoll__6110 = tcoll__6105;
      while(true) {
        var temp__3971__auto____6111 = cljs.core.first.call(null, es__6109);
        if(cljs.core.truth_(temp__3971__auto____6111)) {
          var e__6112 = temp__3971__auto____6111;
          var G__6123 = cljs.core.next.call(null, es__6109);
          var G__6124 = tcoll__6110.assoc_BANG_(cljs.core.key.call(null, e__6112), cljs.core.val.call(null, e__6112));
          es__6109 = G__6123;
          tcoll__6110 = G__6124;
          continue
        }else {
          return tcoll__6110
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__6113 = this;
  var tcoll__6114 = this;
  if(cljs.core.truth_(this__6113.edit)) {
    if(k == null) {
      if(this__6113.nil_val === v) {
      }else {
        this__6113.nil_val = v
      }
      if(cljs.core.truth_(this__6113.has_nil_QMARK_)) {
      }else {
        this__6113.count = this__6113.count + 1;
        this__6113.has_nil_QMARK_ = true
      }
      return tcoll__6114
    }else {
      var added_leaf_QMARK___6115 = [false];
      var node__6116 = (this__6113.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6113.root).inode_assoc_BANG_(this__6113.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6115);
      if(node__6116 === this__6113.root) {
      }else {
        this__6113.root = node__6116
      }
      if(cljs.core.truth_(added_leaf_QMARK___6115[0])) {
        this__6113.count = this__6113.count + 1
      }else {
      }
      return tcoll__6114
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__6117 = this;
  var tcoll__6118 = this;
  if(cljs.core.truth_(this__6117.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__6117.has_nil_QMARK_)) {
        this__6117.has_nil_QMARK_ = false;
        this__6117.nil_val = null;
        this__6117.count = this__6117.count - 1;
        return tcoll__6118
      }else {
        return tcoll__6118
      }
    }else {
      if(this__6117.root == null) {
        return tcoll__6118
      }else {
        var removed_leaf_QMARK___6119 = [false];
        var node__6120 = this__6117.root.inode_without_BANG_(this__6117.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___6119);
        if(node__6120 === this__6117.root) {
        }else {
          this__6117.root = node__6120
        }
        if(cljs.core.truth_(removed_leaf_QMARK___6119[0])) {
          this__6117.count = this__6117.count - 1
        }else {
        }
        return tcoll__6118
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__6121 = this;
  var tcoll__6122 = this;
  if(cljs.core.truth_(this__6121.edit)) {
    this__6121.edit = null;
    return new cljs.core.PersistentHashMap(null, this__6121.count, this__6121.root, this__6121.has_nil_QMARK_, this__6121.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__6125 = node;
  var stack__6126 = stack;
  while(true) {
    if(t__6125 != null) {
      var G__6127 = cljs.core.truth_(ascending_QMARK_) ? t__6125.left : t__6125.right;
      var G__6128 = cljs.core.conj.call(null, stack__6126, t__6125);
      t__6125 = G__6127;
      stack__6126 = G__6128;
      continue
    }else {
      return stack__6126
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925322
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6129 = this;
  var h__364__auto____6130 = this__6129.__hash;
  if(h__364__auto____6130 != null) {
    return h__364__auto____6130
  }else {
    var h__364__auto____6131 = cljs.core.hash_coll.call(null, coll);
    this__6129.__hash = h__364__auto____6131;
    return h__364__auto____6131
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6132 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__6133 = this;
  var this$__6134 = this;
  return cljs.core.pr_str.call(null, this$__6134)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6135 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6136 = this;
  if(this__6136.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__6136.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__6137 = this;
  return cljs.core.peek.call(null, this__6137.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__6138 = this;
  var t__6139 = cljs.core.peek.call(null, this__6138.stack);
  var next_stack__6140 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__6138.ascending_QMARK_) ? t__6139.right : t__6139.left, cljs.core.pop.call(null, this__6138.stack), this__6138.ascending_QMARK_);
  if(next_stack__6140 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__6140, this__6138.ascending_QMARK_, this__6138.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6141 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6142 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__6142.stack, this__6142.ascending_QMARK_, this__6142.cnt, this__6142.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6143 = this;
  return this__6143.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
void 0;
void 0;
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____6144 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____6144) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____6144
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____6145 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____6145) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____6145
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__6146 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__6146)) {
    return cljs.core.deref.call(null, init__6146)
  }else {
    var init__6147 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__6146) : init__6146;
    if(cljs.core.reduced_QMARK_.call(null, init__6147)) {
      return cljs.core.deref.call(null, init__6147)
    }else {
      var init__6148 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__6147) : init__6147;
      if(cljs.core.reduced_QMARK_.call(null, init__6148)) {
        return cljs.core.deref.call(null, init__6148)
      }else {
        return init__6148
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$ = true;
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6153 = this;
  var h__364__auto____6154 = this__6153.__hash;
  if(h__364__auto____6154 != null) {
    return h__364__auto____6154
  }else {
    var h__364__auto____6155 = cljs.core.hash_coll.call(null, coll);
    this__6153.__hash = h__364__auto____6155;
    return h__364__auto____6155
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6156 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6157 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6158 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6158.key, this__6158.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__6205 = null;
  var G__6205__2 = function(tsym6151, k) {
    var this__6159 = this;
    var tsym6151__6160 = this;
    var node__6161 = tsym6151__6160;
    return cljs.core._lookup.call(null, node__6161, k)
  };
  var G__6205__3 = function(tsym6152, k, not_found) {
    var this__6162 = this;
    var tsym6152__6163 = this;
    var node__6164 = tsym6152__6163;
    return cljs.core._lookup.call(null, node__6164, k, not_found)
  };
  G__6205 = function(tsym6152, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6205__2.call(this, tsym6152, k);
      case 3:
        return G__6205__3.call(this, tsym6152, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6205
}();
cljs.core.BlackNode.prototype.apply = function(tsym6149, args6150) {
  return tsym6149.call.apply(tsym6149, [tsym6149].concat(cljs.core.aclone.call(null, args6150)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6165 = this;
  return cljs.core.PersistentVector.fromArray([this__6165.key, this__6165.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6166 = this;
  return this__6166.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6167 = this;
  return this__6167.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__6168 = this;
  var node__6169 = this;
  return ins.balance_right(node__6169)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__6170 = this;
  var node__6171 = this;
  return new cljs.core.RedNode(this__6170.key, this__6170.val, this__6170.left, this__6170.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__6172 = this;
  var node__6173 = this;
  return cljs.core.balance_right_del.call(null, this__6172.key, this__6172.val, this__6172.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__6174 = this;
  var node__6175 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__6176 = this;
  var node__6177 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6177, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__6178 = this;
  var node__6179 = this;
  return cljs.core.balance_left_del.call(null, this__6178.key, this__6178.val, del, this__6178.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__6180 = this;
  var node__6181 = this;
  return ins.balance_left(node__6181)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__6182 = this;
  var node__6183 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__6183, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__6206 = null;
  var G__6206__0 = function() {
    var this__6186 = this;
    var this$__6187 = this;
    return cljs.core.pr_str.call(null, this$__6187)
  };
  G__6206 = function() {
    switch(arguments.length) {
      case 0:
        return G__6206__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6206
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__6188 = this;
  var node__6189 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6189, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__6190 = this;
  var node__6191 = this;
  return node__6191
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6192 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6193 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6194 = this;
  return cljs.core.list.call(null, this__6194.key, this__6194.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6196 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6197 = this;
  return this__6197.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6198 = this;
  return cljs.core.PersistentVector.fromArray([this__6198.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6199 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6199.key, this__6199.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6200 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6201 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6201.key, this__6201.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6202 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6203 = this;
  if(n === 0) {
    return this__6203.key
  }else {
    if(n === 1) {
      return this__6203.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__6204 = this;
  if(n === 0) {
    return this__6204.key
  }else {
    if(n === 1) {
      return this__6204.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__6195 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$ = true;
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6211 = this;
  var h__364__auto____6212 = this__6211.__hash;
  if(h__364__auto____6212 != null) {
    return h__364__auto____6212
  }else {
    var h__364__auto____6213 = cljs.core.hash_coll.call(null, coll);
    this__6211.__hash = h__364__auto____6213;
    return h__364__auto____6213
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6214 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6215 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6216 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6216.key, this__6216.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__6263 = null;
  var G__6263__2 = function(tsym6209, k) {
    var this__6217 = this;
    var tsym6209__6218 = this;
    var node__6219 = tsym6209__6218;
    return cljs.core._lookup.call(null, node__6219, k)
  };
  var G__6263__3 = function(tsym6210, k, not_found) {
    var this__6220 = this;
    var tsym6210__6221 = this;
    var node__6222 = tsym6210__6221;
    return cljs.core._lookup.call(null, node__6222, k, not_found)
  };
  G__6263 = function(tsym6210, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6263__2.call(this, tsym6210, k);
      case 3:
        return G__6263__3.call(this, tsym6210, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6263
}();
cljs.core.RedNode.prototype.apply = function(tsym6207, args6208) {
  return tsym6207.call.apply(tsym6207, [tsym6207].concat(cljs.core.aclone.call(null, args6208)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6223 = this;
  return cljs.core.PersistentVector.fromArray([this__6223.key, this__6223.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6224 = this;
  return this__6224.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6225 = this;
  return this__6225.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__6226 = this;
  var node__6227 = this;
  return new cljs.core.RedNode(this__6226.key, this__6226.val, this__6226.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__6228 = this;
  var node__6229 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__6230 = this;
  var node__6231 = this;
  return new cljs.core.RedNode(this__6230.key, this__6230.val, this__6230.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__6232 = this;
  var node__6233 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__6234 = this;
  var node__6235 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6235, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__6236 = this;
  var node__6237 = this;
  return new cljs.core.RedNode(this__6236.key, this__6236.val, del, this__6236.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__6238 = this;
  var node__6239 = this;
  return new cljs.core.RedNode(this__6238.key, this__6238.val, ins, this__6238.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__6240 = this;
  var node__6241 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6240.left)) {
    return new cljs.core.RedNode(this__6240.key, this__6240.val, this__6240.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__6240.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6240.right)) {
      return new cljs.core.RedNode(this__6240.right.key, this__6240.right.val, new cljs.core.BlackNode(this__6240.key, this__6240.val, this__6240.left, this__6240.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__6240.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__6241, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__6264 = null;
  var G__6264__0 = function() {
    var this__6244 = this;
    var this$__6245 = this;
    return cljs.core.pr_str.call(null, this$__6245)
  };
  G__6264 = function() {
    switch(arguments.length) {
      case 0:
        return G__6264__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6264
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__6246 = this;
  var node__6247 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6246.right)) {
    return new cljs.core.RedNode(this__6246.key, this__6246.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6246.left, null), this__6246.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6246.left)) {
      return new cljs.core.RedNode(this__6246.left.key, this__6246.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6246.left.left, null), new cljs.core.BlackNode(this__6246.key, this__6246.val, this__6246.left.right, this__6246.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6247, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__6248 = this;
  var node__6249 = this;
  return new cljs.core.BlackNode(this__6248.key, this__6248.val, this__6248.left, this__6248.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6250 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6251 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6252 = this;
  return cljs.core.list.call(null, this__6252.key, this__6252.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6254 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6255 = this;
  return this__6255.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6256 = this;
  return cljs.core.PersistentVector.fromArray([this__6256.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6257 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6257.key, this__6257.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6258 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6259 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6259.key, this__6259.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6260 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6261 = this;
  if(n === 0) {
    return this__6261.key
  }else {
    if(n === 1) {
      return this__6261.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__6262 = this;
  if(n === 0) {
    return this__6262.key
  }else {
    if(n === 1) {
      return this__6262.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__6253 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__6265 = comp.call(null, k, tree.key);
    if(c__6265 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__6265 < 0) {
        var ins__6266 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__6266 != null) {
          return tree.add_left(ins__6266)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__6267 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__6267 != null) {
            return tree.add_right(ins__6267)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__6268 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6268)) {
            return new cljs.core.RedNode(app__6268.key, app__6268.val, new cljs.core.RedNode(left.key, left.val, left.left, app__6268.left), new cljs.core.RedNode(right.key, right.val, app__6268.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__6268, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__6269 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6269)) {
              return new cljs.core.RedNode(app__6269.key, app__6269.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__6269.left, null), new cljs.core.BlackNode(right.key, right.val, app__6269.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__6269, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(tree != null) {
    var c__6270 = comp.call(null, k, tree.key);
    if(c__6270 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__6270 < 0) {
        var del__6271 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____6272 = del__6271 != null;
          if(or__3824__auto____6272) {
            return or__3824__auto____6272
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__6271, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__6271, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__6273 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____6274 = del__6273 != null;
            if(or__3824__auto____6274) {
              return or__3824__auto____6274
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__6273)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__6273, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__6275 = tree.key;
  var c__6276 = comp.call(null, k, tk__6275);
  if(c__6276 === 0) {
    return tree.replace(tk__6275, v, tree.left, tree.right)
  }else {
    if(c__6276 < 0) {
      return tree.replace(tk__6275, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__6275, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 209388431
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6281 = this;
  var h__364__auto____6282 = this__6281.__hash;
  if(h__364__auto____6282 != null) {
    return h__364__auto____6282
  }else {
    var h__364__auto____6283 = cljs.core.hash_imap.call(null, coll);
    this__6281.__hash = h__364__auto____6283;
    return h__364__auto____6283
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6284 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6285 = this;
  var n__6286 = coll.entry_at(k);
  if(n__6286 != null) {
    return n__6286.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6287 = this;
  var found__6288 = [null];
  var t__6289 = cljs.core.tree_map_add.call(null, this__6287.comp, this__6287.tree, k, v, found__6288);
  if(t__6289 == null) {
    var found_node__6290 = cljs.core.nth.call(null, found__6288, 0);
    if(cljs.core._EQ_.call(null, v, found_node__6290.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6287.comp, cljs.core.tree_map_replace.call(null, this__6287.comp, this__6287.tree, k, v), this__6287.cnt, this__6287.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6287.comp, t__6289.blacken(), this__6287.cnt + 1, this__6287.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6291 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__6323 = null;
  var G__6323__2 = function(tsym6279, k) {
    var this__6292 = this;
    var tsym6279__6293 = this;
    var coll__6294 = tsym6279__6293;
    return cljs.core._lookup.call(null, coll__6294, k)
  };
  var G__6323__3 = function(tsym6280, k, not_found) {
    var this__6295 = this;
    var tsym6280__6296 = this;
    var coll__6297 = tsym6280__6296;
    return cljs.core._lookup.call(null, coll__6297, k, not_found)
  };
  G__6323 = function(tsym6280, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6323__2.call(this, tsym6280, k);
      case 3:
        return G__6323__3.call(this, tsym6280, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6323
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym6277, args6278) {
  return tsym6277.call.apply(tsym6277, [tsym6277].concat(cljs.core.aclone.call(null, args6278)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6298 = this;
  if(this__6298.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__6298.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6299 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6300 = this;
  if(this__6300.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6300.tree, false, this__6300.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__6301 = this;
  var this$__6302 = this;
  return cljs.core.pr_str.call(null, this$__6302)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__6303 = this;
  var coll__6304 = this;
  var t__6305 = this__6303.tree;
  while(true) {
    if(t__6305 != null) {
      var c__6306 = this__6303.comp.call(null, k, t__6305.key);
      if(c__6306 === 0) {
        return t__6305
      }else {
        if(c__6306 < 0) {
          var G__6324 = t__6305.left;
          t__6305 = G__6324;
          continue
        }else {
          if("\ufdd0'else") {
            var G__6325 = t__6305.right;
            t__6305 = G__6325;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6307 = this;
  if(this__6307.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6307.tree, ascending_QMARK_, this__6307.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6308 = this;
  if(this__6308.cnt > 0) {
    var stack__6309 = null;
    var t__6310 = this__6308.tree;
    while(true) {
      if(t__6310 != null) {
        var c__6311 = this__6308.comp.call(null, k, t__6310.key);
        if(c__6311 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__6309, t__6310), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__6311 < 0) {
              var G__6326 = cljs.core.conj.call(null, stack__6309, t__6310);
              var G__6327 = t__6310.left;
              stack__6309 = G__6326;
              t__6310 = G__6327;
              continue
            }else {
              var G__6328 = stack__6309;
              var G__6329 = t__6310.right;
              stack__6309 = G__6328;
              t__6310 = G__6329;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__6311 > 0) {
                var G__6330 = cljs.core.conj.call(null, stack__6309, t__6310);
                var G__6331 = t__6310.right;
                stack__6309 = G__6330;
                t__6310 = G__6331;
                continue
              }else {
                var G__6332 = stack__6309;
                var G__6333 = t__6310.left;
                stack__6309 = G__6332;
                t__6310 = G__6333;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__6309 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__6309, ascending_QMARK_, -1)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__6312 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6313 = this;
  return this__6313.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6314 = this;
  if(this__6314.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6314.tree, true, this__6314.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6315 = this;
  return this__6315.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6316 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6317 = this;
  return new cljs.core.PersistentTreeMap(this__6317.comp, this__6317.tree, this__6317.cnt, meta, this__6317.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6321 = this;
  return this__6321.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6322 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__6322.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6318 = this;
  var found__6319 = [null];
  var t__6320 = cljs.core.tree_map_remove.call(null, this__6318.comp, this__6318.tree, k, found__6319);
  if(t__6320 == null) {
    if(cljs.core.nth.call(null, found__6319, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6318.comp, null, 0, this__6318.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6318.comp, t__6320.blacken(), this__6318.cnt - 1, this__6318.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__6334 = cljs.core.seq.call(null, keyvals);
    var out__6335 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__6334)) {
        var G__6336 = cljs.core.nnext.call(null, in$__6334);
        var G__6337 = cljs.core.assoc_BANG_.call(null, out__6335, cljs.core.first.call(null, in$__6334), cljs.core.second.call(null, in$__6334));
        in$__6334 = G__6336;
        out__6335 = G__6337;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__6335)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__6338) {
    var keyvals = cljs.core.seq(arglist__6338);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__6339) {
    var keyvals = cljs.core.seq(arglist__6339);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__6340 = cljs.core.seq.call(null, keyvals);
    var out__6341 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__6340)) {
        var G__6342 = cljs.core.nnext.call(null, in$__6340);
        var G__6343 = cljs.core.assoc.call(null, out__6341, cljs.core.first.call(null, in$__6340), cljs.core.second.call(null, in$__6340));
        in$__6340 = G__6342;
        out__6341 = G__6343;
        continue
      }else {
        return out__6341
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__6344) {
    var keyvals = cljs.core.seq(arglist__6344);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__6345 = cljs.core.seq.call(null, keyvals);
    var out__6346 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__6345)) {
        var G__6347 = cljs.core.nnext.call(null, in$__6345);
        var G__6348 = cljs.core.assoc.call(null, out__6346, cljs.core.first.call(null, in$__6345), cljs.core.second.call(null, in$__6345));
        in$__6345 = G__6347;
        out__6346 = G__6348;
        continue
      }else {
        return out__6346
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__6349) {
    var comparator = cljs.core.first(arglist__6349);
    var keyvals = cljs.core.rest(arglist__6349);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__6350_SHARP_, p2__6351_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____6352 = p1__6350_SHARP_;
          if(cljs.core.truth_(or__3824__auto____6352)) {
            return or__3824__auto____6352
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__6351_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__6353) {
    var maps = cljs.core.seq(arglist__6353);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__6356 = function(m, e) {
        var k__6354 = cljs.core.first.call(null, e);
        var v__6355 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__6354)) {
          return cljs.core.assoc.call(null, m, k__6354, f.call(null, cljs.core.get.call(null, m, k__6354), v__6355))
        }else {
          return cljs.core.assoc.call(null, m, k__6354, v__6355)
        }
      };
      var merge2__6358 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__6356, function() {
          var or__3824__auto____6357 = m1;
          if(cljs.core.truth_(or__3824__auto____6357)) {
            return or__3824__auto____6357
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__6358, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__6359) {
    var f = cljs.core.first(arglist__6359);
    var maps = cljs.core.rest(arglist__6359);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__6360 = cljs.core.ObjMap.fromObject([], {});
  var keys__6361 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__6361)) {
      var key__6362 = cljs.core.first.call(null, keys__6361);
      var entry__6363 = cljs.core.get.call(null, map, key__6362, "\ufdd0'user/not-found");
      var G__6364 = cljs.core.not_EQ_.call(null, entry__6363, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__6360, key__6362, entry__6363) : ret__6360;
      var G__6365 = cljs.core.next.call(null, keys__6361);
      ret__6360 = G__6364;
      keys__6361 = G__6365;
      continue
    }else {
      return ret__6360
    }
    break
  }
};
void 0;
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155022479
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6371 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__6371.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6372 = this;
  var h__364__auto____6373 = this__6372.__hash;
  if(h__364__auto____6373 != null) {
    return h__364__auto____6373
  }else {
    var h__364__auto____6374 = cljs.core.hash_iset.call(null, coll);
    this__6372.__hash = h__364__auto____6374;
    return h__364__auto____6374
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6375 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6376 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6376.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__6395 = null;
  var G__6395__2 = function(tsym6369, k) {
    var this__6377 = this;
    var tsym6369__6378 = this;
    var coll__6379 = tsym6369__6378;
    return cljs.core._lookup.call(null, coll__6379, k)
  };
  var G__6395__3 = function(tsym6370, k, not_found) {
    var this__6380 = this;
    var tsym6370__6381 = this;
    var coll__6382 = tsym6370__6381;
    return cljs.core._lookup.call(null, coll__6382, k, not_found)
  };
  G__6395 = function(tsym6370, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6395__2.call(this, tsym6370, k);
      case 3:
        return G__6395__3.call(this, tsym6370, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6395
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym6367, args6368) {
  return tsym6367.call.apply(tsym6367, [tsym6367].concat(cljs.core.aclone.call(null, args6368)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6383 = this;
  return new cljs.core.PersistentHashSet(this__6383.meta, cljs.core.assoc.call(null, this__6383.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__6384 = this;
  var this$__6385 = this;
  return cljs.core.pr_str.call(null, this$__6385)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6386 = this;
  return cljs.core.keys.call(null, this__6386.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6387 = this;
  return new cljs.core.PersistentHashSet(this__6387.meta, cljs.core.dissoc.call(null, this__6387.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6388 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6389 = this;
  var and__3822__auto____6390 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____6390) {
    var and__3822__auto____6391 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____6391) {
      return cljs.core.every_QMARK_.call(null, function(p1__6366_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6366_SHARP_)
      }, other)
    }else {
      return and__3822__auto____6391
    }
  }else {
    return and__3822__auto____6390
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6392 = this;
  return new cljs.core.PersistentHashSet(meta, this__6392.hash_map, this__6392.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6393 = this;
  return this__6393.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6394 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__6394.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 131;
  this.cljs$lang$protocol_mask$partition1$ = 17
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashSet")
};
cljs.core.TransientHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.TransientHashSet.prototype.call = function() {
  var G__6413 = null;
  var G__6413__2 = function(tsym6399, k) {
    var this__6401 = this;
    var tsym6399__6402 = this;
    var tcoll__6403 = tsym6399__6402;
    if(cljs.core._lookup.call(null, this__6401.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__6413__3 = function(tsym6400, k, not_found) {
    var this__6404 = this;
    var tsym6400__6405 = this;
    var tcoll__6406 = tsym6400__6405;
    if(cljs.core._lookup.call(null, this__6404.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__6413 = function(tsym6400, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6413__2.call(this, tsym6400, k);
      case 3:
        return G__6413__3.call(this, tsym6400, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6413
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym6397, args6398) {
  return tsym6397.call.apply(tsym6397, [tsym6397].concat(cljs.core.aclone.call(null, args6398)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__6407 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__6408 = this;
  if(cljs.core._lookup.call(null, this__6408.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__6409 = this;
  return cljs.core.count.call(null, this__6409.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__6410 = this;
  this__6410.transient_map = cljs.core.dissoc_BANG_.call(null, this__6410.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__6411 = this;
  this__6411.transient_map = cljs.core.assoc_BANG_.call(null, this__6411.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6412 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__6412.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 208865423
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6418 = this;
  var h__364__auto____6419 = this__6418.__hash;
  if(h__364__auto____6419 != null) {
    return h__364__auto____6419
  }else {
    var h__364__auto____6420 = cljs.core.hash_iset.call(null, coll);
    this__6418.__hash = h__364__auto____6420;
    return h__364__auto____6420
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6421 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6422 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6422.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__6446 = null;
  var G__6446__2 = function(tsym6416, k) {
    var this__6423 = this;
    var tsym6416__6424 = this;
    var coll__6425 = tsym6416__6424;
    return cljs.core._lookup.call(null, coll__6425, k)
  };
  var G__6446__3 = function(tsym6417, k, not_found) {
    var this__6426 = this;
    var tsym6417__6427 = this;
    var coll__6428 = tsym6417__6427;
    return cljs.core._lookup.call(null, coll__6428, k, not_found)
  };
  G__6446 = function(tsym6417, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6446__2.call(this, tsym6417, k);
      case 3:
        return G__6446__3.call(this, tsym6417, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6446
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym6414, args6415) {
  return tsym6414.call.apply(tsym6414, [tsym6414].concat(cljs.core.aclone.call(null, args6415)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6429 = this;
  return new cljs.core.PersistentTreeSet(this__6429.meta, cljs.core.assoc.call(null, this__6429.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6430 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__6430.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__6431 = this;
  var this$__6432 = this;
  return cljs.core.pr_str.call(null, this$__6432)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6433 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__6433.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6434 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__6434.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__6435 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6436 = this;
  return cljs.core._comparator.call(null, this__6436.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6437 = this;
  return cljs.core.keys.call(null, this__6437.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6438 = this;
  return new cljs.core.PersistentTreeSet(this__6438.meta, cljs.core.dissoc.call(null, this__6438.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6439 = this;
  return cljs.core.count.call(null, this__6439.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6440 = this;
  var and__3822__auto____6441 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____6441) {
    var and__3822__auto____6442 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____6442) {
      return cljs.core.every_QMARK_.call(null, function(p1__6396_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6396_SHARP_)
      }, other)
    }else {
      return and__3822__auto____6442
    }
  }else {
    return and__3822__auto____6441
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6443 = this;
  return new cljs.core.PersistentTreeSet(meta, this__6443.tree_map, this__6443.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6444 = this;
  return this__6444.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6445 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__6445.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__6447 = cljs.core.seq.call(null, coll);
  var out__6448 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__6447))) {
      var G__6449 = cljs.core.next.call(null, in$__6447);
      var G__6450 = cljs.core.conj_BANG_.call(null, out__6448, cljs.core.first.call(null, in$__6447));
      in$__6447 = G__6449;
      out__6448 = G__6450;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6448)
    }
    break
  }
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__6451) {
    var keys = cljs.core.seq(arglist__6451);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__6453) {
    var comparator = cljs.core.first(arglist__6453);
    var keys = cljs.core.rest(arglist__6453);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__6454 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____6455 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____6455)) {
        var e__6456 = temp__3971__auto____6455;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__6456))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__6454, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__6452_SHARP_) {
      var temp__3971__auto____6457 = cljs.core.find.call(null, smap, p1__6452_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____6457)) {
        var e__6458 = temp__3971__auto____6457;
        return cljs.core.second.call(null, e__6458)
      }else {
        return p1__6452_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__6466 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__6459, seen) {
        while(true) {
          var vec__6460__6461 = p__6459;
          var f__6462 = cljs.core.nth.call(null, vec__6460__6461, 0, null);
          var xs__6463 = vec__6460__6461;
          var temp__3974__auto____6464 = cljs.core.seq.call(null, xs__6463);
          if(cljs.core.truth_(temp__3974__auto____6464)) {
            var s__6465 = temp__3974__auto____6464;
            if(cljs.core.contains_QMARK_.call(null, seen, f__6462)) {
              var G__6467 = cljs.core.rest.call(null, s__6465);
              var G__6468 = seen;
              p__6459 = G__6467;
              seen = G__6468;
              continue
            }else {
              return cljs.core.cons.call(null, f__6462, step.call(null, cljs.core.rest.call(null, s__6465), cljs.core.conj.call(null, seen, f__6462)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__6466.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__6469 = cljs.core.PersistentVector.fromArray([]);
  var s__6470 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__6470))) {
      var G__6471 = cljs.core.conj.call(null, ret__6469, cljs.core.first.call(null, s__6470));
      var G__6472 = cljs.core.next.call(null, s__6470);
      ret__6469 = G__6471;
      s__6470 = G__6472;
      continue
    }else {
      return cljs.core.seq.call(null, ret__6469)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____6473 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____6473) {
        return or__3824__auto____6473
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__6474 = x.lastIndexOf("/");
      if(i__6474 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__6474 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____6475 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____6475) {
      return or__3824__auto____6475
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__6476 = x.lastIndexOf("/");
    if(i__6476 > -1) {
      return cljs.core.subs.call(null, x, 2, i__6476)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__6479 = cljs.core.ObjMap.fromObject([], {});
  var ks__6480 = cljs.core.seq.call(null, keys);
  var vs__6481 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____6482 = ks__6480;
      if(cljs.core.truth_(and__3822__auto____6482)) {
        return vs__6481
      }else {
        return and__3822__auto____6482
      }
    }())) {
      var G__6483 = cljs.core.assoc.call(null, map__6479, cljs.core.first.call(null, ks__6480), cljs.core.first.call(null, vs__6481));
      var G__6484 = cljs.core.next.call(null, ks__6480);
      var G__6485 = cljs.core.next.call(null, vs__6481);
      map__6479 = G__6483;
      ks__6480 = G__6484;
      vs__6481 = G__6485;
      continue
    }else {
      return map__6479
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__6488__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6477_SHARP_, p2__6478_SHARP_) {
        return max_key.call(null, k, p1__6477_SHARP_, p2__6478_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__6488 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6488__delegate.call(this, k, x, y, more)
    };
    G__6488.cljs$lang$maxFixedArity = 3;
    G__6488.cljs$lang$applyTo = function(arglist__6489) {
      var k = cljs.core.first(arglist__6489);
      var x = cljs.core.first(cljs.core.next(arglist__6489));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6489)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6489)));
      return G__6488__delegate(k, x, y, more)
    };
    G__6488.cljs$lang$arity$variadic = G__6488__delegate;
    return G__6488
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__6490__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6486_SHARP_, p2__6487_SHARP_) {
        return min_key.call(null, k, p1__6486_SHARP_, p2__6487_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__6490 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6490__delegate.call(this, k, x, y, more)
    };
    G__6490.cljs$lang$maxFixedArity = 3;
    G__6490.cljs$lang$applyTo = function(arglist__6491) {
      var k = cljs.core.first(arglist__6491);
      var x = cljs.core.first(cljs.core.next(arglist__6491));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6491)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6491)));
      return G__6490__delegate(k, x, y, more)
    };
    G__6490.cljs$lang$arity$variadic = G__6490__delegate;
    return G__6490
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____6492 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____6492)) {
        var s__6493 = temp__3974__auto____6492;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__6493), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__6493)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____6494 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____6494)) {
      var s__6495 = temp__3974__auto____6494;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__6495)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__6495), take_while.call(null, pred, cljs.core.rest.call(null, s__6495)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__6496 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__6496.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__6497 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____6498 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____6498)) {
        var vec__6499__6500 = temp__3974__auto____6498;
        var e__6501 = cljs.core.nth.call(null, vec__6499__6500, 0, null);
        var s__6502 = vec__6499__6500;
        if(cljs.core.truth_(include__6497.call(null, e__6501))) {
          return s__6502
        }else {
          return cljs.core.next.call(null, s__6502)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6497, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____6503 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____6503)) {
      var vec__6504__6505 = temp__3974__auto____6503;
      var e__6506 = cljs.core.nth.call(null, vec__6504__6505, 0, null);
      var s__6507 = vec__6504__6505;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__6506)) ? s__6507 : cljs.core.next.call(null, s__6507))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__6508 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____6509 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____6509)) {
        var vec__6510__6511 = temp__3974__auto____6509;
        var e__6512 = cljs.core.nth.call(null, vec__6510__6511, 0, null);
        var s__6513 = vec__6510__6511;
        if(cljs.core.truth_(include__6508.call(null, e__6512))) {
          return s__6513
        }else {
          return cljs.core.next.call(null, s__6513)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6508, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____6514 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____6514)) {
      var vec__6515__6516 = temp__3974__auto____6514;
      var e__6517 = cljs.core.nth.call(null, vec__6515__6516, 0, null);
      var s__6518 = vec__6515__6516;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__6517)) ? s__6518 : cljs.core.next.call(null, s__6518))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16187486
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__6519 = this;
  var h__364__auto____6520 = this__6519.__hash;
  if(h__364__auto____6520 != null) {
    return h__364__auto____6520
  }else {
    var h__364__auto____6521 = cljs.core.hash_coll.call(null, rng);
    this__6519.__hash = h__364__auto____6521;
    return h__364__auto____6521
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__6522 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__6523 = this;
  var this$__6524 = this;
  return cljs.core.pr_str.call(null, this$__6524)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__6525 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__6526 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__6527 = this;
  var comp__6528 = this__6527.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__6528.call(null, this__6527.start, this__6527.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__6529 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__6529.end - this__6529.start) / this__6529.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__6530 = this;
  return this__6530.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__6531 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__6531.meta, this__6531.start + this__6531.step, this__6531.end, this__6531.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__6532 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__6533 = this;
  return new cljs.core.Range(meta, this__6533.start, this__6533.end, this__6533.step, this__6533.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__6534 = this;
  return this__6534.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__6535 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6535.start + n * this__6535.step
  }else {
    if(function() {
      var and__3822__auto____6536 = this__6535.start > this__6535.end;
      if(and__3822__auto____6536) {
        return this__6535.step === 0
      }else {
        return and__3822__auto____6536
      }
    }()) {
      return this__6535.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__6537 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6537.start + n * this__6537.step
  }else {
    if(function() {
      var and__3822__auto____6538 = this__6537.start > this__6537.end;
      if(and__3822__auto____6538) {
        return this__6537.step === 0
      }else {
        return and__3822__auto____6538
      }
    }()) {
      return this__6537.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__6539 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6539.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____6540 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____6540)) {
      var s__6541 = temp__3974__auto____6540;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__6541), take_nth.call(null, n, cljs.core.drop.call(null, n, s__6541)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____6543 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____6543)) {
      var s__6544 = temp__3974__auto____6543;
      var fst__6545 = cljs.core.first.call(null, s__6544);
      var fv__6546 = f.call(null, fst__6545);
      var run__6547 = cljs.core.cons.call(null, fst__6545, cljs.core.take_while.call(null, function(p1__6542_SHARP_) {
        return cljs.core._EQ_.call(null, fv__6546, f.call(null, p1__6542_SHARP_))
      }, cljs.core.next.call(null, s__6544)));
      return cljs.core.cons.call(null, run__6547, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__6547), s__6544))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {})), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____6558 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____6558)) {
        var s__6559 = temp__3971__auto____6558;
        return reductions.call(null, f, cljs.core.first.call(null, s__6559), cljs.core.rest.call(null, s__6559))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____6560 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____6560)) {
        var s__6561 = temp__3974__auto____6560;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__6561)), cljs.core.rest.call(null, s__6561))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__6563 = null;
      var G__6563__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__6563__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__6563__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__6563__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__6563__4 = function() {
        var G__6564__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__6564 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6564__delegate.call(this, x, y, z, args)
        };
        G__6564.cljs$lang$maxFixedArity = 3;
        G__6564.cljs$lang$applyTo = function(arglist__6565) {
          var x = cljs.core.first(arglist__6565);
          var y = cljs.core.first(cljs.core.next(arglist__6565));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6565)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6565)));
          return G__6564__delegate(x, y, z, args)
        };
        G__6564.cljs$lang$arity$variadic = G__6564__delegate;
        return G__6564
      }();
      G__6563 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6563__0.call(this);
          case 1:
            return G__6563__1.call(this, x);
          case 2:
            return G__6563__2.call(this, x, y);
          case 3:
            return G__6563__3.call(this, x, y, z);
          default:
            return G__6563__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6563.cljs$lang$maxFixedArity = 3;
      G__6563.cljs$lang$applyTo = G__6563__4.cljs$lang$applyTo;
      return G__6563
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__6566 = null;
      var G__6566__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__6566__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__6566__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__6566__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__6566__4 = function() {
        var G__6567__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__6567 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6567__delegate.call(this, x, y, z, args)
        };
        G__6567.cljs$lang$maxFixedArity = 3;
        G__6567.cljs$lang$applyTo = function(arglist__6568) {
          var x = cljs.core.first(arglist__6568);
          var y = cljs.core.first(cljs.core.next(arglist__6568));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6568)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6568)));
          return G__6567__delegate(x, y, z, args)
        };
        G__6567.cljs$lang$arity$variadic = G__6567__delegate;
        return G__6567
      }();
      G__6566 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6566__0.call(this);
          case 1:
            return G__6566__1.call(this, x);
          case 2:
            return G__6566__2.call(this, x, y);
          case 3:
            return G__6566__3.call(this, x, y, z);
          default:
            return G__6566__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6566.cljs$lang$maxFixedArity = 3;
      G__6566.cljs$lang$applyTo = G__6566__4.cljs$lang$applyTo;
      return G__6566
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__6569 = null;
      var G__6569__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__6569__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__6569__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__6569__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__6569__4 = function() {
        var G__6570__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__6570 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6570__delegate.call(this, x, y, z, args)
        };
        G__6570.cljs$lang$maxFixedArity = 3;
        G__6570.cljs$lang$applyTo = function(arglist__6571) {
          var x = cljs.core.first(arglist__6571);
          var y = cljs.core.first(cljs.core.next(arglist__6571));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6571)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6571)));
          return G__6570__delegate(x, y, z, args)
        };
        G__6570.cljs$lang$arity$variadic = G__6570__delegate;
        return G__6570
      }();
      G__6569 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6569__0.call(this);
          case 1:
            return G__6569__1.call(this, x);
          case 2:
            return G__6569__2.call(this, x, y);
          case 3:
            return G__6569__3.call(this, x, y, z);
          default:
            return G__6569__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6569.cljs$lang$maxFixedArity = 3;
      G__6569.cljs$lang$applyTo = G__6569__4.cljs$lang$applyTo;
      return G__6569
    }()
  };
  var juxt__4 = function() {
    var G__6572__delegate = function(f, g, h, fs) {
      var fs__6562 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__6573 = null;
        var G__6573__0 = function() {
          return cljs.core.reduce.call(null, function(p1__6548_SHARP_, p2__6549_SHARP_) {
            return cljs.core.conj.call(null, p1__6548_SHARP_, p2__6549_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__6562)
        };
        var G__6573__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__6550_SHARP_, p2__6551_SHARP_) {
            return cljs.core.conj.call(null, p1__6550_SHARP_, p2__6551_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__6562)
        };
        var G__6573__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__6552_SHARP_, p2__6553_SHARP_) {
            return cljs.core.conj.call(null, p1__6552_SHARP_, p2__6553_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__6562)
        };
        var G__6573__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__6554_SHARP_, p2__6555_SHARP_) {
            return cljs.core.conj.call(null, p1__6554_SHARP_, p2__6555_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__6562)
        };
        var G__6573__4 = function() {
          var G__6574__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__6556_SHARP_, p2__6557_SHARP_) {
              return cljs.core.conj.call(null, p1__6556_SHARP_, cljs.core.apply.call(null, p2__6557_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__6562)
          };
          var G__6574 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__6574__delegate.call(this, x, y, z, args)
          };
          G__6574.cljs$lang$maxFixedArity = 3;
          G__6574.cljs$lang$applyTo = function(arglist__6575) {
            var x = cljs.core.first(arglist__6575);
            var y = cljs.core.first(cljs.core.next(arglist__6575));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6575)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6575)));
            return G__6574__delegate(x, y, z, args)
          };
          G__6574.cljs$lang$arity$variadic = G__6574__delegate;
          return G__6574
        }();
        G__6573 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__6573__0.call(this);
            case 1:
              return G__6573__1.call(this, x);
            case 2:
              return G__6573__2.call(this, x, y);
            case 3:
              return G__6573__3.call(this, x, y, z);
            default:
              return G__6573__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__6573.cljs$lang$maxFixedArity = 3;
        G__6573.cljs$lang$applyTo = G__6573__4.cljs$lang$applyTo;
        return G__6573
      }()
    };
    var G__6572 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6572__delegate.call(this, f, g, h, fs)
    };
    G__6572.cljs$lang$maxFixedArity = 3;
    G__6572.cljs$lang$applyTo = function(arglist__6576) {
      var f = cljs.core.first(arglist__6576);
      var g = cljs.core.first(cljs.core.next(arglist__6576));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6576)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6576)));
      return G__6572__delegate(f, g, h, fs)
    };
    G__6572.cljs$lang$arity$variadic = G__6572__delegate;
    return G__6572
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__6578 = cljs.core.next.call(null, coll);
        coll = G__6578;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____6577 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3822__auto____6577)) {
          return n > 0
        }else {
          return and__3822__auto____6577
        }
      }())) {
        var G__6579 = n - 1;
        var G__6580 = cljs.core.next.call(null, coll);
        n = G__6579;
        coll = G__6580;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__6581 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__6581), s)) {
    if(cljs.core.count.call(null, matches__6581) === 1) {
      return cljs.core.first.call(null, matches__6581)
    }else {
      return cljs.core.vec.call(null, matches__6581)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__6582 = re.exec(s);
  if(matches__6582 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__6582) === 1) {
      return cljs.core.first.call(null, matches__6582)
    }else {
      return cljs.core.vec.call(null, matches__6582)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__6583 = cljs.core.re_find.call(null, re, s);
  var match_idx__6584 = s.search(re);
  var match_str__6585 = cljs.core.coll_QMARK_.call(null, match_data__6583) ? cljs.core.first.call(null, match_data__6583) : match_data__6583;
  var post_match__6586 = cljs.core.subs.call(null, s, match_idx__6584 + cljs.core.count.call(null, match_str__6585));
  if(cljs.core.truth_(match_data__6583)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__6583, re_seq.call(null, re, post_match__6586))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__6588__6589 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___6590 = cljs.core.nth.call(null, vec__6588__6589, 0, null);
  var flags__6591 = cljs.core.nth.call(null, vec__6588__6589, 1, null);
  var pattern__6592 = cljs.core.nth.call(null, vec__6588__6589, 2, null);
  return new RegExp(pattern__6592, flags__6591)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__6587_SHARP_) {
    return print_one.call(null, p1__6587_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____6593 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3822__auto____6593)) {
            var and__3822__auto____6597 = function() {
              var G__6594__6595 = obj;
              if(G__6594__6595 != null) {
                if(function() {
                  var or__3824__auto____6596 = G__6594__6595.cljs$lang$protocol_mask$partition0$ & 65536;
                  if(or__3824__auto____6596) {
                    return or__3824__auto____6596
                  }else {
                    return G__6594__6595.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__6594__6595.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6594__6595)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6594__6595)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____6597)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____6597
            }
          }else {
            return and__3822__auto____6593
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var and__3822__auto____6598 = obj != null;
          if(and__3822__auto____6598) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____6598
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__6599__6600 = obj;
          if(G__6599__6600 != null) {
            if(function() {
              var or__3824__auto____6601 = G__6599__6600.cljs$lang$protocol_mask$partition0$ & 268435456;
              if(or__3824__auto____6601) {
                return or__3824__auto____6601
              }else {
                return G__6599__6600.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__6599__6600.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6599__6600)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6599__6600)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__6602 = cljs.core.first.call(null, objs);
  var sb__6603 = new goog.string.StringBuffer;
  var G__6604__6605 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6604__6605)) {
    var obj__6606 = cljs.core.first.call(null, G__6604__6605);
    var G__6604__6607 = G__6604__6605;
    while(true) {
      if(obj__6606 === first_obj__6602) {
      }else {
        sb__6603.append(" ")
      }
      var G__6608__6609 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6606, opts));
      if(cljs.core.truth_(G__6608__6609)) {
        var string__6610 = cljs.core.first.call(null, G__6608__6609);
        var G__6608__6611 = G__6608__6609;
        while(true) {
          sb__6603.append(string__6610);
          var temp__3974__auto____6612 = cljs.core.next.call(null, G__6608__6611);
          if(cljs.core.truth_(temp__3974__auto____6612)) {
            var G__6608__6613 = temp__3974__auto____6612;
            var G__6616 = cljs.core.first.call(null, G__6608__6613);
            var G__6617 = G__6608__6613;
            string__6610 = G__6616;
            G__6608__6611 = G__6617;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____6614 = cljs.core.next.call(null, G__6604__6607);
      if(cljs.core.truth_(temp__3974__auto____6614)) {
        var G__6604__6615 = temp__3974__auto____6614;
        var G__6618 = cljs.core.first.call(null, G__6604__6615);
        var G__6619 = G__6604__6615;
        obj__6606 = G__6618;
        G__6604__6607 = G__6619;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__6603
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__6620 = cljs.core.pr_sb.call(null, objs, opts);
  sb__6620.append("\n");
  return[cljs.core.str(sb__6620)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__6621 = cljs.core.first.call(null, objs);
  var G__6622__6623 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6622__6623)) {
    var obj__6624 = cljs.core.first.call(null, G__6622__6623);
    var G__6622__6625 = G__6622__6623;
    while(true) {
      if(obj__6624 === first_obj__6621) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__6626__6627 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6624, opts));
      if(cljs.core.truth_(G__6626__6627)) {
        var string__6628 = cljs.core.first.call(null, G__6626__6627);
        var G__6626__6629 = G__6626__6627;
        while(true) {
          cljs.core.string_print.call(null, string__6628);
          var temp__3974__auto____6630 = cljs.core.next.call(null, G__6626__6629);
          if(cljs.core.truth_(temp__3974__auto____6630)) {
            var G__6626__6631 = temp__3974__auto____6630;
            var G__6634 = cljs.core.first.call(null, G__6626__6631);
            var G__6635 = G__6626__6631;
            string__6628 = G__6634;
            G__6626__6629 = G__6635;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____6632 = cljs.core.next.call(null, G__6622__6625);
      if(cljs.core.truth_(temp__3974__auto____6632)) {
        var G__6622__6633 = temp__3974__auto____6632;
        var G__6636 = cljs.core.first.call(null, G__6622__6633);
        var G__6637 = G__6622__6633;
        obj__6624 = G__6636;
        G__6622__6625 = G__6637;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__6638) {
    var objs = cljs.core.seq(arglist__6638);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__6639) {
    var objs = cljs.core.seq(arglist__6639);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__6640) {
    var objs = cljs.core.seq(arglist__6640);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__6641) {
    var objs = cljs.core.seq(arglist__6641);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__6642) {
    var objs = cljs.core.seq(arglist__6642);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__6643) {
    var objs = cljs.core.seq(arglist__6643);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__6644) {
    var objs = cljs.core.seq(arglist__6644);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__6645) {
    var objs = cljs.core.seq(arglist__6645);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6646 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6646, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6647 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6647, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6648 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6648, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____6649 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____6649)) {
        var nspc__6650 = temp__3974__auto____6649;
        return[cljs.core.str(nspc__6650), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____6651 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____6651)) {
          var nspc__6652 = temp__3974__auto____6651;
          return[cljs.core.str(nspc__6652), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6653 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6653, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6654 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6654, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1345404928
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__6655 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__6656 = this;
  var G__6657__6658 = cljs.core.seq.call(null, this__6656.watches);
  if(cljs.core.truth_(G__6657__6658)) {
    var G__6660__6662 = cljs.core.first.call(null, G__6657__6658);
    var vec__6661__6663 = G__6660__6662;
    var key__6664 = cljs.core.nth.call(null, vec__6661__6663, 0, null);
    var f__6665 = cljs.core.nth.call(null, vec__6661__6663, 1, null);
    var G__6657__6666 = G__6657__6658;
    var G__6660__6667 = G__6660__6662;
    var G__6657__6668 = G__6657__6666;
    while(true) {
      var vec__6669__6670 = G__6660__6667;
      var key__6671 = cljs.core.nth.call(null, vec__6669__6670, 0, null);
      var f__6672 = cljs.core.nth.call(null, vec__6669__6670, 1, null);
      var G__6657__6673 = G__6657__6668;
      f__6672.call(null, key__6671, this$, oldval, newval);
      var temp__3974__auto____6674 = cljs.core.next.call(null, G__6657__6673);
      if(cljs.core.truth_(temp__3974__auto____6674)) {
        var G__6657__6675 = temp__3974__auto____6674;
        var G__6682 = cljs.core.first.call(null, G__6657__6675);
        var G__6683 = G__6657__6675;
        G__6660__6667 = G__6682;
        G__6657__6668 = G__6683;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__6676 = this;
  return this$.watches = cljs.core.assoc.call(null, this__6676.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__6677 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__6677.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__6678 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__6678.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__6679 = this;
  return this__6679.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6680 = this;
  return this__6680.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__6681 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__6690__delegate = function(x, p__6684) {
      var map__6685__6686 = p__6684;
      var map__6685__6687 = cljs.core.seq_QMARK_.call(null, map__6685__6686) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6685__6686) : map__6685__6686;
      var validator__6688 = cljs.core.get.call(null, map__6685__6687, "\ufdd0'validator");
      var meta__6689 = cljs.core.get.call(null, map__6685__6687, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__6689, validator__6688, null)
    };
    var G__6690 = function(x, var_args) {
      var p__6684 = null;
      if(goog.isDef(var_args)) {
        p__6684 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6690__delegate.call(this, x, p__6684)
    };
    G__6690.cljs$lang$maxFixedArity = 1;
    G__6690.cljs$lang$applyTo = function(arglist__6691) {
      var x = cljs.core.first(arglist__6691);
      var p__6684 = cljs.core.rest(arglist__6691);
      return G__6690__delegate(x, p__6684)
    };
    G__6690.cljs$lang$arity$variadic = G__6690__delegate;
    return G__6690
  }();
  atom = function(x, var_args) {
    var p__6684 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____6692 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____6692)) {
    var validate__6693 = temp__3974__auto____6692;
    if(cljs.core.truth_(validate__6693.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5917))))].join(""));
    }
  }else {
  }
  var old_value__6694 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__6694, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__6695__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__6695 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__6695__delegate.call(this, a, f, x, y, z, more)
    };
    G__6695.cljs$lang$maxFixedArity = 5;
    G__6695.cljs$lang$applyTo = function(arglist__6696) {
      var a = cljs.core.first(arglist__6696);
      var f = cljs.core.first(cljs.core.next(arglist__6696));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6696)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6696))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6696)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6696)))));
      return G__6695__delegate(a, f, x, y, z, more)
    };
    G__6695.cljs$lang$arity$variadic = G__6695__delegate;
    return G__6695
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__6697) {
    var iref = cljs.core.first(arglist__6697);
    var f = cljs.core.first(cljs.core.next(arglist__6697));
    var args = cljs.core.rest(cljs.core.next(arglist__6697));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 536887296
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__6698 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__6698.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6699 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__6699.state, function(p__6700) {
    var curr_state__6701 = p__6700;
    var curr_state__6702 = cljs.core.seq_QMARK_.call(null, curr_state__6701) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__6701) : curr_state__6701;
    var done__6703 = cljs.core.get.call(null, curr_state__6702, "\ufdd0'done");
    if(cljs.core.truth_(done__6703)) {
      return curr_state__6702
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__6699.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__6704__6705 = options;
    var map__6704__6706 = cljs.core.seq_QMARK_.call(null, map__6704__6705) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6704__6705) : map__6704__6705;
    var keywordize_keys__6707 = cljs.core.get.call(null, map__6704__6706, "\ufdd0'keywordize-keys");
    var keyfn__6708 = cljs.core.truth_(keywordize_keys__6707) ? cljs.core.keyword : cljs.core.str;
    var f__6714 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__625__auto____6713 = function iter__6709(s__6710) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__6710__6711 = s__6710;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__6710__6711))) {
                        var k__6712 = cljs.core.first.call(null, s__6710__6711);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__6708.call(null, k__6712), thisfn.call(null, x[k__6712])]), iter__6709.call(null, cljs.core.rest.call(null, s__6710__6711)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__625__auto____6713.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__6714.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__6715) {
    var x = cljs.core.first(arglist__6715);
    var options = cljs.core.rest(arglist__6715);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__6716 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__6720__delegate = function(args) {
      var temp__3971__auto____6717 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__6716), args);
      if(cljs.core.truth_(temp__3971__auto____6717)) {
        var v__6718 = temp__3971__auto____6717;
        return v__6718
      }else {
        var ret__6719 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__6716, cljs.core.assoc, args, ret__6719);
        return ret__6719
      }
    };
    var G__6720 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6720__delegate.call(this, args)
    };
    G__6720.cljs$lang$maxFixedArity = 0;
    G__6720.cljs$lang$applyTo = function(arglist__6721) {
      var args = cljs.core.seq(arglist__6721);
      return G__6720__delegate(args)
    };
    G__6720.cljs$lang$arity$variadic = G__6720__delegate;
    return G__6720
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__6722 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__6722)) {
        var G__6723 = ret__6722;
        f = G__6723;
        continue
      }else {
        return ret__6722
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__6724__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__6724 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6724__delegate.call(this, f, args)
    };
    G__6724.cljs$lang$maxFixedArity = 1;
    G__6724.cljs$lang$applyTo = function(arglist__6725) {
      var f = cljs.core.first(arglist__6725);
      var args = cljs.core.rest(arglist__6725);
      return G__6724__delegate(f, args)
    };
    G__6724.cljs$lang$arity$variadic = G__6724__delegate;
    return G__6724
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__6726 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__6726, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__6726, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____6727 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____6727) {
      return or__3824__auto____6727
    }else {
      var or__3824__auto____6728 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3824__auto____6728) {
        return or__3824__auto____6728
      }else {
        var and__3822__auto____6729 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____6729) {
          var and__3822__auto____6730 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____6730) {
            var and__3822__auto____6731 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____6731) {
              var ret__6732 = true;
              var i__6733 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____6734 = cljs.core.not.call(null, ret__6732);
                  if(or__3824__auto____6734) {
                    return or__3824__auto____6734
                  }else {
                    return i__6733 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__6732
                }else {
                  var G__6735 = isa_QMARK_.call(null, h, child.call(null, i__6733), parent.call(null, i__6733));
                  var G__6736 = i__6733 + 1;
                  ret__6732 = G__6735;
                  i__6733 = G__6736;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____6731
            }
          }else {
            return and__3822__auto____6730
          }
        }else {
          return and__3822__auto____6729
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6201))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6205))))].join(""));
    }
    var tp__6740 = "\ufdd0'parents".call(null, h);
    var td__6741 = "\ufdd0'descendants".call(null, h);
    var ta__6742 = "\ufdd0'ancestors".call(null, h);
    var tf__6743 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____6744 = cljs.core.contains_QMARK_.call(null, tp__6740.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__6742.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__6742.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__6740, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__6743.call(null, "\ufdd0'ancestors".call(null, h), tag, td__6741, parent, ta__6742), "\ufdd0'descendants":tf__6743.call(null, "\ufdd0'descendants".call(null, h), parent, ta__6742, tag, td__6741)})
    }();
    if(cljs.core.truth_(or__3824__auto____6744)) {
      return or__3824__auto____6744
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__6745 = "\ufdd0'parents".call(null, h);
    var childsParents__6746 = cljs.core.truth_(parentMap__6745.call(null, tag)) ? cljs.core.disj.call(null, parentMap__6745.call(null, tag), parent) : cljs.core.set([]);
    var newParents__6747 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__6746)) ? cljs.core.assoc.call(null, parentMap__6745, tag, childsParents__6746) : cljs.core.dissoc.call(null, parentMap__6745, tag);
    var deriv_seq__6748 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__6737_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__6737_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__6737_SHARP_), cljs.core.second.call(null, p1__6737_SHARP_)))
    }, cljs.core.seq.call(null, newParents__6747)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__6745.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__6738_SHARP_, p2__6739_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__6738_SHARP_, p2__6739_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__6748))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__6749 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____6751 = cljs.core.truth_(function() {
    var and__3822__auto____6750 = xprefs__6749;
    if(cljs.core.truth_(and__3822__auto____6750)) {
      return xprefs__6749.call(null, y)
    }else {
      return and__3822__auto____6750
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____6751)) {
    return or__3824__auto____6751
  }else {
    var or__3824__auto____6753 = function() {
      var ps__6752 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__6752) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__6752), prefer_table))) {
          }else {
          }
          var G__6756 = cljs.core.rest.call(null, ps__6752);
          ps__6752 = G__6756;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____6753)) {
      return or__3824__auto____6753
    }else {
      var or__3824__auto____6755 = function() {
        var ps__6754 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__6754) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__6754), y, prefer_table))) {
            }else {
            }
            var G__6757 = cljs.core.rest.call(null, ps__6754);
            ps__6754 = G__6757;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____6755)) {
        return or__3824__auto____6755
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____6758 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____6758)) {
    return or__3824__auto____6758
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__6767 = cljs.core.reduce.call(null, function(be, p__6759) {
    var vec__6760__6761 = p__6759;
    var k__6762 = cljs.core.nth.call(null, vec__6760__6761, 0, null);
    var ___6763 = cljs.core.nth.call(null, vec__6760__6761, 1, null);
    var e__6764 = vec__6760__6761;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__6762)) {
      var be2__6766 = cljs.core.truth_(function() {
        var or__3824__auto____6765 = be == null;
        if(or__3824__auto____6765) {
          return or__3824__auto____6765
        }else {
          return cljs.core.dominates.call(null, k__6762, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__6764 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__6766), k__6762, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__6762), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__6766)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__6766
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__6767)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__6767));
      return cljs.core.second.call(null, best_entry__6767)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
void 0;
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____6768 = mf;
    if(and__3822__auto____6768) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____6768
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____6769 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6769) {
        return or__3824__auto____6769
      }else {
        var or__3824__auto____6770 = cljs.core._reset["_"];
        if(or__3824__auto____6770) {
          return or__3824__auto____6770
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____6771 = mf;
    if(and__3822__auto____6771) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____6771
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3824__auto____6772 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6772) {
        return or__3824__auto____6772
      }else {
        var or__3824__auto____6773 = cljs.core._add_method["_"];
        if(or__3824__auto____6773) {
          return or__3824__auto____6773
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____6774 = mf;
    if(and__3822__auto____6774) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____6774
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____6775 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6775) {
        return or__3824__auto____6775
      }else {
        var or__3824__auto____6776 = cljs.core._remove_method["_"];
        if(or__3824__auto____6776) {
          return or__3824__auto____6776
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____6777 = mf;
    if(and__3822__auto____6777) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____6777
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3824__auto____6778 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6778) {
        return or__3824__auto____6778
      }else {
        var or__3824__auto____6779 = cljs.core._prefer_method["_"];
        if(or__3824__auto____6779) {
          return or__3824__auto____6779
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____6780 = mf;
    if(and__3822__auto____6780) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____6780
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____6781 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6781) {
        return or__3824__auto____6781
      }else {
        var or__3824__auto____6782 = cljs.core._get_method["_"];
        if(or__3824__auto____6782) {
          return or__3824__auto____6782
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____6783 = mf;
    if(and__3822__auto____6783) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____6783
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____6784 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6784) {
        return or__3824__auto____6784
      }else {
        var or__3824__auto____6785 = cljs.core._methods["_"];
        if(or__3824__auto____6785) {
          return or__3824__auto____6785
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____6786 = mf;
    if(and__3822__auto____6786) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____6786
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____6787 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6787) {
        return or__3824__auto____6787
      }else {
        var or__3824__auto____6788 = cljs.core._prefers["_"];
        if(or__3824__auto____6788) {
          return or__3824__auto____6788
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____6789 = mf;
    if(and__3822__auto____6789) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____6789
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3824__auto____6790 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6790) {
        return or__3824__auto____6790
      }else {
        var or__3824__auto____6791 = cljs.core._dispatch["_"];
        if(or__3824__auto____6791) {
          return or__3824__auto____6791
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__6792 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__6793 = cljs.core._get_method.call(null, mf, dispatch_val__6792);
  if(cljs.core.truth_(target_fn__6793)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__6792)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__6793, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 2097152;
  this.cljs$lang$protocol_mask$partition1$ = 32
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__6794 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__6795 = this;
  cljs.core.swap_BANG_.call(null, this__6795.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6795.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6795.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6795.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__6796 = this;
  cljs.core.swap_BANG_.call(null, this__6796.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__6796.method_cache, this__6796.method_table, this__6796.cached_hierarchy, this__6796.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__6797 = this;
  cljs.core.swap_BANG_.call(null, this__6797.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__6797.method_cache, this__6797.method_table, this__6797.cached_hierarchy, this__6797.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__6798 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__6798.cached_hierarchy), cljs.core.deref.call(null, this__6798.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__6798.method_cache, this__6798.method_table, this__6798.cached_hierarchy, this__6798.hierarchy)
  }
  var temp__3971__auto____6799 = cljs.core.deref.call(null, this__6798.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____6799)) {
    var target_fn__6800 = temp__3971__auto____6799;
    return target_fn__6800
  }else {
    var temp__3971__auto____6801 = cljs.core.find_and_cache_best_method.call(null, this__6798.name, dispatch_val, this__6798.hierarchy, this__6798.method_table, this__6798.prefer_table, this__6798.method_cache, this__6798.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____6801)) {
      var target_fn__6802 = temp__3971__auto____6801;
      return target_fn__6802
    }else {
      return cljs.core.deref.call(null, this__6798.method_table).call(null, this__6798.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__6803 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__6803.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__6803.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__6803.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__6803.method_cache, this__6803.method_table, this__6803.cached_hierarchy, this__6803.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__6804 = this;
  return cljs.core.deref.call(null, this__6804.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__6805 = this;
  return cljs.core.deref.call(null, this__6805.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__6806 = this;
  return cljs.core.do_dispatch.call(null, mf, this__6806.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__6807__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__6807 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__6807__delegate.call(this, _, args)
  };
  G__6807.cljs$lang$maxFixedArity = 1;
  G__6807.cljs$lang$applyTo = function(arglist__6808) {
    var _ = cljs.core.first(arglist__6808);
    var args = cljs.core.rest(arglist__6808);
    return G__6807__delegate(_, args)
  };
  G__6807.cljs$lang$arity$variadic = G__6807__delegate;
  return G__6807
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isVersion("9"), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isVersion("9") || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            element[key] = val
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc;
  if(goog.userAgent.WEBKIT) {
    doc = frame.document || frame.contentWindow.document
  }else {
    doc = frame.contentDocument || frame.contentWindow.document
  }
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    for(var i = 0, child;child = root.childNodes[i];i++) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.userAgent.IE) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape.call(null, match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__14736 = s;
      var limit__14737 = limit;
      var parts__14738 = cljs.core.PersistentVector.fromArray([]);
      while(true) {
        if(cljs.core._EQ_.call(null, limit__14737, 1)) {
          return cljs.core.conj.call(null, parts__14738, s__14736)
        }else {
          var temp__3971__auto____14739 = cljs.core.re_find.call(null, re, s__14736);
          if(cljs.core.truth_(temp__3971__auto____14739)) {
            var m__14740 = temp__3971__auto____14739;
            var index__14741 = s__14736.indexOf(m__14740);
            var G__14742 = s__14736.substring(index__14741 + cljs.core.count.call(null, m__14740));
            var G__14743 = limit__14737 - 1;
            var G__14744 = cljs.core.conj.call(null, parts__14738, s__14736.substring(0, index__14741));
            s__14736 = G__14742;
            limit__14737 = G__14743;
            parts__14738 = G__14744;
            continue
          }else {
            return cljs.core.conj.call(null, parts__14738, s__14736)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim.call(null, s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft.call(null, s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight.call(null, s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__14745 = s.length;
  while(true) {
    if(index__14745 === 0) {
      return""
    }else {
      var ch__14746 = cljs.core.get.call(null, s, index__14745 - 1);
      if(function() {
        var or__3824__auto____14747 = cljs.core._EQ_.call(null, ch__14746, "\n");
        if(or__3824__auto____14747) {
          return or__3824__auto____14747
        }else {
          return cljs.core._EQ_.call(null, ch__14746, "\r")
        }
      }()) {
        var G__14748 = index__14745 - 1;
        index__14745 = G__14748;
        continue
      }else {
        return s.substring(0, index__14745)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__14749 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____14750 = cljs.core.not.call(null, s__14749);
    if(or__3824__auto____14750) {
      return or__3824__auto____14750
    }else {
      var or__3824__auto____14751 = cljs.core._EQ_.call(null, "", s__14749);
      if(or__3824__auto____14751) {
        return or__3824__auto____14751
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__14749)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__14752 = new goog.string.StringBuffer;
  var length__14753 = s.length;
  var index__14754 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__14753, index__14754)) {
      return buffer__14752.toString()
    }else {
      var ch__14755 = s.charAt(index__14754);
      var temp__3971__auto____14756 = cljs.core.get.call(null, cmap, ch__14755);
      if(cljs.core.truth_(temp__3971__auto____14756)) {
        var replacement__14757 = temp__3971__auto____14756;
        buffer__14752.append([cljs.core.str(replacement__14757)].join(""))
      }else {
        buffer__14752.append(ch__14755)
      }
      var G__14758 = index__14754 + 1;
      index__14754 = G__14758;
      continue
    }
    break
  }
};
goog.provide("goog.dom.xml");
goog.require("goog.dom");
goog.require("goog.dom.NodeType");
goog.dom.xml.MAX_XML_SIZE_KB = 2 * 1024;
goog.dom.xml.MAX_ELEMENT_DEPTH = 256;
goog.dom.xml.createDocument = function(opt_rootTagName, opt_namespaceUri) {
  if(opt_namespaceUri && !opt_rootTagName) {
    throw Error("Can't create document with namespace and no root tag");
  }
  if(document.implementation && document.implementation.createDocument) {
    return document.implementation.createDocument(opt_namespaceUri || "", opt_rootTagName || "", null)
  }else {
    if(typeof ActiveXObject != "undefined") {
      var doc = goog.dom.xml.createMsXmlDocument_();
      if(doc) {
        if(opt_rootTagName) {
          doc.appendChild(doc.createNode(goog.dom.NodeType.ELEMENT, opt_rootTagName, opt_namespaceUri || ""))
        }
        return doc
      }
    }
  }
  throw Error("Your browser does not support creating new documents");
};
goog.dom.xml.loadXml = function(xml) {
  if(typeof DOMParser != "undefined") {
    return(new DOMParser).parseFromString(xml, "application/xml")
  }else {
    if(typeof ActiveXObject != "undefined") {
      var doc = goog.dom.xml.createMsXmlDocument_();
      doc.loadXML(xml);
      return doc
    }
  }
  throw Error("Your browser does not support loading xml documents");
};
goog.dom.xml.serialize = function(xml) {
  if(typeof XMLSerializer != "undefined") {
    return(new XMLSerializer).serializeToString(xml)
  }
  var text = xml.xml;
  if(text) {
    return text
  }
  throw Error("Your browser does not support serializing XML documents");
};
goog.dom.xml.selectSingleNode = function(node, path) {
  if(typeof node.selectSingleNode != "undefined") {
    var doc = goog.dom.getOwnerDocument(node);
    if(typeof doc.setProperty != "undefined") {
      doc.setProperty("SelectionLanguage", "XPath")
    }
    return node.selectSingleNode(path)
  }else {
    if(document.implementation.hasFeature("XPath", "3.0")) {
      var doc = goog.dom.getOwnerDocument(node);
      var resolver = doc.createNSResolver(doc.documentElement);
      var result = doc.evaluate(path, node, resolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue
    }
  }
  return null
};
goog.dom.xml.selectNodes = function(node, path) {
  if(typeof node.selectNodes != "undefined") {
    var doc = goog.dom.getOwnerDocument(node);
    if(typeof doc.setProperty != "undefined") {
      doc.setProperty("SelectionLanguage", "XPath")
    }
    return node.selectNodes(path)
  }else {
    if(document.implementation.hasFeature("XPath", "3.0")) {
      var doc = goog.dom.getOwnerDocument(node);
      var resolver = doc.createNSResolver(doc.documentElement);
      var nodes = doc.evaluate(path, node, resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      var results = [];
      var count = nodes.snapshotLength;
      for(var i = 0;i < count;i++) {
        results.push(nodes.snapshotItem(i))
      }
      return results
    }else {
      return[]
    }
  }
};
goog.dom.xml.createMsXmlDocument_ = function() {
  var doc = new ActiveXObject("MSXML2.DOMDocument");
  if(doc) {
    doc.resolveExternals = false;
    doc.validateOnParse = false;
    try {
      doc.setProperty("ProhibitDTD", true);
      doc.setProperty("MaxXMLSize", goog.dom.xml.MAX_XML_SIZE_KB);
      doc.setProperty("MaxElementDepth", goog.dom.xml.MAX_ELEMENT_DEPTH)
    }catch(e) {
    }
  }
  return doc
};
goog.provide("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.math.Box = function(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left
};
goog.math.Box.boundingBox = function(var_args) {
  var box = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x);
  for(var i = 1;i < arguments.length;i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x)
  }
  return box
};
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left)
};
if(goog.DEBUG) {
  goog.math.Box.prototype.toString = function() {
    return"(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)"
  }
}
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other)
};
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom, opt_left) {
  if(goog.isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left
  }else {
    this.top -= top;
    this.right += opt_right;
    this.bottom += opt_bottom;
    this.left -= opt_left
  }
  return this
};
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom)
};
goog.math.Box.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.top == b.top && a.right == b.right && a.bottom == b.bottom && a.left == b.left
};
goog.math.Box.contains = function(box, other) {
  if(!box || !other) {
    return false
  }
  if(other instanceof goog.math.Box) {
    return other.left >= box.left && other.right <= box.right && other.top >= box.top && other.bottom <= box.bottom
  }
  return other.x >= box.left && other.x <= box.right && other.y >= box.top && other.y <= box.bottom
};
goog.math.Box.distance = function(box, coord) {
  if(coord.x >= box.left && coord.x <= box.right) {
    if(coord.y >= box.top && coord.y <= box.bottom) {
      return 0
    }
    return coord.y < box.top ? box.top - coord.y : coord.y - box.bottom
  }
  if(coord.y >= box.top && coord.y <= box.bottom) {
    return coord.x < box.left ? box.left - coord.x : coord.x - box.right
  }
  return goog.math.Coordinate.distance(coord, new goog.math.Coordinate(coord.x < box.left ? box.left : box.right, coord.y < box.top ? box.top : box.bottom))
};
goog.math.Box.intersects = function(a, b) {
  return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom
};
goog.math.Box.intersectsWithPadding = function(a, b, padding) {
  return a.left <= b.right + padding && b.left <= a.right + padding && a.top <= b.bottom + padding && b.top <= a.bottom + padding
};
goog.provide("goog.math.Rect");
goog.require("goog.math.Box");
goog.require("goog.math.Size");
goog.math.Rect = function(x, y, w, h) {
  this.left = x;
  this.top = y;
  this.width = w;
  this.height = h
};
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height)
};
goog.math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new goog.math.Box(this.top, right, bottom, this.left)
};
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top, box.right - box.left, box.bottom - box.top)
};
if(goog.DEBUG) {
  goog.math.Rect.prototype.toString = function() {
    return"(" + this.left + ", " + this.top + " - " + this.width + "w x " + this.height + "h)"
  }
}
goog.math.Rect.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.left == b.left && a.width == b.width && a.top == b.top && a.height == b.height
};
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);
  if(x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);
    if(y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;
      return true
    }
  }
  return false
};
goog.math.Rect.intersection = function(a, b) {
  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);
  if(x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);
    if(y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0)
    }
  }
  return null
};
goog.math.Rect.intersects = function(a, b) {
  return a.left <= b.left + b.width && b.left <= a.left + a.width && a.top <= b.top + b.height && b.top <= a.top + a.height
};
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect)
};
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if(!intersection || !intersection.height || !intersection.width) {
    return[a.clone()]
  }
  var result = [];
  var top = a.top;
  var height = a.height;
  var ar = a.left + a.width;
  var ab = a.top + a.height;
  var br = b.left + b.width;
  var bb = b.top + b.height;
  if(b.top > a.top) {
    result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    height -= b.top - a.top
  }
  if(bb < ab) {
    result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top
  }
  if(b.left > a.left) {
    result.push(new goog.math.Rect(a.left, top, b.left - a.left, height))
  }
  if(br < ar) {
    result.push(new goog.math.Rect(br, top, ar - br, height))
  }
  return result
};
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect)
};
goog.math.Rect.prototype.boundingRect = function(rect) {
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);
  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);
  this.width = right - this.left;
  this.height = bottom - this.top
};
goog.math.Rect.boundingRect = function(a, b) {
  if(!a || !b) {
    return null
  }
  var clone = a.clone();
  clone.boundingRect(b);
  return clone
};
goog.math.Rect.prototype.contains = function(another) {
  if(another instanceof goog.math.Rect) {
    return this.left <= another.left && this.left + this.width >= another.left + another.width && this.top <= another.top && this.top + this.height >= another.top + another.height
  }else {
    return another.x >= this.left && another.x <= this.left + this.width && another.y >= this.top && another.y <= this.top + this.height
  }
};
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height)
};
goog.provide("goog.style");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Rect");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.style.setStyle = function(element, style, opt_value) {
  if(goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style)
  }else {
    goog.object.forEach(style, goog.partial(goog.style.setStyle_, element))
  }
};
goog.style.setStyle_ = function(element, value, style) {
  element.style[goog.string.toCamelCase(style)] = value
};
goog.style.getStyle = function(element, property) {
  return element.style[goog.string.toCamelCase(property)] || ""
};
goog.style.getComputedStyle = function(element, property) {
  var doc = goog.dom.getOwnerDocument(element);
  if(doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, null);
    if(styles) {
      return styles[property] || styles.getPropertyValue(property)
    }
  }
  return""
};
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null
};
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) || goog.style.getCascadedStyle(element, style) || element.style[style]
};
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, "position")
};
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, "backgroundColor")
};
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, "overflowX")
};
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, "overflowY")
};
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, "zIndex")
};
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, "textAlign")
};
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, "cursor")
};
goog.style.setPosition = function(el, arg1, opt_arg2) {
  var x, y;
  var buggyGeckoSubPixelPos = goog.userAgent.GECKO && (goog.userAgent.MAC || goog.userAgent.X11) && goog.userAgent.isVersion("1.9");
  if(arg1 instanceof goog.math.Coordinate) {
    x = arg1.x;
    y = arg1.y
  }else {
    x = arg1;
    y = opt_arg2
  }
  el.style.left = goog.style.getPixelStyleValue_(x, buggyGeckoSubPixelPos);
  el.style.top = goog.style.getPixelStyleValue_(y, buggyGeckoSubPixelPos)
};
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop)
};
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  if(opt_node) {
    if(opt_node.nodeType == goog.dom.NodeType.DOCUMENT) {
      doc = opt_node
    }else {
      doc = goog.dom.getOwnerDocument(opt_node)
    }
  }else {
    doc = goog.dom.getDocument()
  }
  if(goog.userAgent.IE && !goog.userAgent.isVersion(9) && !goog.dom.getDomHelper(doc).isCss1CompatMode()) {
    return doc.body
  }
  return doc.documentElement
};
goog.style.getBoundingClientRect_ = function(el) {
  var rect = el.getBoundingClientRect();
  if(goog.userAgent.IE) {
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop
  }
  return rect
};
goog.style.getOffsetParent = function(element) {
  if(goog.userAgent.IE) {
    return element.offsetParent
  }
  var doc = goog.dom.getOwnerDocument(element);
  var positionStyle = goog.style.getStyle_(element, "position");
  var skipStatic = positionStyle == "fixed" || positionStyle == "absolute";
  for(var parent = element.parentNode;parent && parent != doc;parent = parent.parentNode) {
    positionStyle = goog.style.getStyle_(parent, "position");
    skipStatic = skipStatic && positionStyle == "static" && parent != doc.documentElement && parent != doc.body;
    if(!skipStatic && (parent.scrollWidth > parent.clientWidth || parent.scrollHeight > parent.clientHeight || positionStyle == "fixed" || positionStyle == "absolute")) {
      return parent
    }
  }
  return null
};
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var scrollEl = dom.getDocumentScrollElement();
  var inContainer;
  for(var el = element;el = goog.style.getOffsetParent(el);) {
    if((!goog.userAgent.IE || el.clientWidth != 0) && (!goog.userAgent.WEBKIT || el.clientHeight != 0 || el != body) && (el.scrollWidth != el.clientWidth || el.scrollHeight != el.clientHeight) && goog.style.getStyle_(el, "overflow") != "visible") {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;
      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right, pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom, pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x);
      inContainer = inContainer || el != scrollEl
    }
  }
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  if(goog.userAgent.WEBKIT) {
    visibleRect.left += scrollX;
    visibleRect.top += scrollY
  }else {
    visibleRect.left = Math.max(visibleRect.left, scrollX);
    visibleRect.top = Math.max(visibleRect.top, scrollY)
  }
  if(!inContainer || goog.userAgent.WEBKIT) {
    visibleRect.right += scrollX;
    visibleRect.bottom += scrollY
  }
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
  return visibleRect.top >= 0 && visibleRect.left >= 0 && visibleRect.bottom > visibleRect.top && visibleRect.right > visibleRect.left ? visibleRect : null
};
goog.style.scrollIntoContainerView = function(element, container, opt_center) {
  var elementPos = goog.style.getPageOffset(element);
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);
  var relX = elementPos.x - containerPos.x - containerBorder.left;
  var relY = elementPos.y - containerPos.y - containerBorder.top;
  var spaceX = container.clientWidth - element.offsetWidth;
  var spaceY = container.clientHeight - element.offsetHeight;
  if(opt_center) {
    container.scrollLeft += relX - spaceX / 2;
    container.scrollTop += relY - spaceY / 2
  }else {
    container.scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    container.scrollTop += Math.min(relY, Math.max(relY - spaceY, 0))
  }
};
goog.style.getClientLeftTop = function(el) {
  if(goog.userAgent.GECKO && !goog.userAgent.isVersion("1.9")) {
    var left = parseFloat(goog.style.getComputedStyle(el, "borderLeftWidth"));
    if(goog.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left - parseFloat(goog.style.getComputedStyle(el, "borderRightWidth"));
      left += scrollbarWidth
    }
    return new goog.math.Coordinate(left, parseFloat(goog.style.getComputedStyle(el, "borderTopWidth")))
  }
  return new goog.math.Coordinate(el.clientLeft, el.clientTop)
};
goog.style.getPageOffset = function(el) {
  var box, doc = goog.dom.getOwnerDocument(el);
  var positionStyle = goog.style.getStyle_(el, "position");
  var BUGGY_GECKO_BOX_OBJECT = goog.userAgent.GECKO && doc.getBoxObjectFor && !el.getBoundingClientRect && positionStyle == "absolute" && (box = doc.getBoxObjectFor(el)) && (box.screenX < 0 || box.screenY < 0);
  var pos = new goog.math.Coordinate(0, 0);
  var viewportElement = goog.style.getClientViewportElement(doc);
  if(el == viewportElement) {
    return pos
  }
  if(el.getBoundingClientRect) {
    box = goog.style.getBoundingClientRect_(el);
    var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y
  }else {
    if(doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
      box = doc.getBoxObjectFor(el);
      var vpBox = doc.getBoxObjectFor(viewportElement);
      pos.x = box.screenX - vpBox.screenX;
      pos.y = box.screenY - vpBox.screenY
    }else {
      var parent = el;
      do {
        pos.x += parent.offsetLeft;
        pos.y += parent.offsetTop;
        if(parent != el) {
          pos.x += parent.clientLeft || 0;
          pos.y += parent.clientTop || 0
        }
        if(goog.userAgent.WEBKIT && goog.style.getComputedPosition(parent) == "fixed") {
          pos.x += doc.body.scrollLeft;
          pos.y += doc.body.scrollTop;
          break
        }
        parent = parent.offsetParent
      }while(parent && parent != el);
      if(goog.userAgent.OPERA || goog.userAgent.WEBKIT && positionStyle == "absolute") {
        pos.y -= doc.body.offsetTop
      }
      for(parent = el;(parent = goog.style.getOffsetParent(parent)) && parent != doc.body && parent != viewportElement;) {
        pos.x -= parent.scrollLeft;
        if(!goog.userAgent.OPERA || parent.tagName != "TR") {
          pos.y -= parent.scrollTop
        }
      }
    }
  }
  return pos
};
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x
};
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y
};
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0);
  var currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  var currentEl = el;
  do {
    var offset = currentWin == relativeWin ? goog.style.getPageOffset(currentEl) : goog.style.getClientPosition(currentEl);
    position.x += offset.x;
    position.y += offset.y
  }while(currentWin && currentWin != relativeWin && (currentEl = currentWin.frameElement) && (currentWin = currentWin.parent));
  return position
};
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if(origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body;
    var pos = goog.style.getFramedPageOffset(body, newBase.getWindow());
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));
    if(goog.userAgent.IE && !origBase.isCss1CompatMode()) {
      pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll())
    }
    rect.left += pos.x;
    rect.top += pos.y
  }
};
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a);
  var bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y)
};
goog.style.getClientPosition = function(el) {
  var pos = new goog.math.Coordinate;
  if(el.nodeType == goog.dom.NodeType.ELEMENT) {
    if(el.getBoundingClientRect) {
      var box = goog.style.getBoundingClientRect_(el);
      pos.x = box.left;
      pos.y = box.top
    }else {
      var scrollCoord = goog.dom.getDomHelper(el).getDocumentScroll();
      var pageCoord = goog.style.getPageOffset(el);
      pos.x = pageCoord.x - scrollCoord.x;
      pos.y = pageCoord.y - scrollCoord.y
    }
  }else {
    var isAbstractedEvent = goog.isFunction(el.getBrowserEvent);
    var targetEvent = el;
    if(el.targetTouches) {
      targetEvent = el.targetTouches[0]
    }else {
      if(isAbstractedEvent && el.getBrowserEvent().targetTouches) {
        targetEvent = el.getBrowserEvent().targetTouches[0]
      }
    }
    pos.x = targetEvent.clientX;
    pos.y = targetEvent.clientY
  }
  return pos
};
goog.style.setPageOffset = function(el, x, opt_y) {
  var cur = goog.style.getPageOffset(el);
  if(x instanceof goog.math.Coordinate) {
    opt_y = x.y;
    x = x.x
  }
  var dx = x - cur.x;
  var dy = opt_y - cur.y;
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + dy)
};
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if(w instanceof goog.math.Size) {
    h = w.height;
    w = w.width
  }else {
    if(opt_h == undefined) {
      throw Error("missing height argument");
    }
    h = opt_h
  }
  goog.style.setWidth(element, w);
  goog.style.setHeight(element, h)
};
goog.style.getPixelStyleValue_ = function(value, round) {
  if(typeof value == "number") {
    value = (round ? Math.round(value) : value) + "px"
  }
  return value
};
goog.style.setHeight = function(element, height) {
  element.style.height = goog.style.getPixelStyleValue_(height, true)
};
goog.style.setWidth = function(element, width) {
  element.style.width = goog.style.getPixelStyleValue_(width, true)
};
goog.style.getSize = function(element) {
  if(goog.style.getStyle_(element, "display") != "none") {
    return new goog.math.Size(element.offsetWidth, element.offsetHeight)
  }
  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;
  style.visibility = "hidden";
  style.position = "absolute";
  style.display = "inline";
  var originalWidth = element.offsetWidth;
  var originalHeight = element.offsetHeight;
  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;
  return new goog.math.Size(originalWidth, originalHeight)
};
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element);
  var s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height)
};
goog.style.toCamelCase = function(selector) {
  return goog.string.toCamelCase(String(selector))
};
goog.style.toSelectorCase = function(selector) {
  return goog.string.toSelectorCase(selector)
};
goog.style.getOpacity = function(el) {
  var style = el.style;
  var result = "";
  if("opacity" in style) {
    result = style.opacity
  }else {
    if("MozOpacity" in style) {
      result = style.MozOpacity
    }else {
      if("filter" in style) {
        var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
        if(match) {
          result = String(match[1] / 100)
        }
      }
    }
  }
  return result == "" ? result : Number(result)
};
goog.style.setOpacity = function(el, alpha) {
  var style = el.style;
  if("opacity" in style) {
    style.opacity = alpha
  }else {
    if("MozOpacity" in style) {
      style.MozOpacity = alpha
    }else {
      if("filter" in style) {
        if(alpha === "") {
          style.filter = ""
        }else {
          style.filter = "alpha(opacity=" + alpha * 100 + ")"
        }
      }
    }
  }
};
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(" + 'src="' + src + '", sizingMethod="crop")'
  }else {
    style.backgroundImage = "url(" + src + ")";
    style.backgroundPosition = "top left";
    style.backgroundRepeat = "no-repeat"
  }
};
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  if("filter" in style) {
    style.filter = ""
  }else {
    style.backgroundImage = "none"
  }
};
goog.style.showElement = function(el, display) {
  el.style.display = display ? "" : "none"
};
goog.style.isElementShown = function(el) {
  return el.style.display != "none"
};
goog.style.installStyles = function(stylesString, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node);
  var styleSheet = null;
  if(goog.userAgent.IE) {
    styleSheet = dh.getDocument().createStyleSheet();
    goog.style.setStyles(styleSheet, stylesString)
  }else {
    var head = dh.getElementsByTagNameAndClass("head")[0];
    if(!head) {
      var body = dh.getElementsByTagNameAndClass("body")[0];
      head = dh.createDom("head");
      body.parentNode.insertBefore(head, body)
    }
    styleSheet = dh.createDom("style");
    goog.style.setStyles(styleSheet, stylesString);
    dh.appendChild(head, styleSheet)
  }
  return styleSheet
};
goog.style.uninstallStyles = function(styleSheet) {
  var node = styleSheet.ownerNode || styleSheet.owningElement || styleSheet;
  goog.dom.removeNode(node)
};
goog.style.setStyles = function(element, stylesString) {
  if(goog.userAgent.IE) {
    element.cssText = stylesString
  }else {
    var propToSet = goog.userAgent.WEBKIT ? "innerText" : "innerHTML";
    element[propToSet] = stylesString
  }
};
goog.style.setPreWrap = function(el) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.whiteSpace = "pre";
    style.wordWrap = "break-word"
  }else {
    if(goog.userAgent.GECKO) {
      style.whiteSpace = "-moz-pre-wrap"
    }else {
      style.whiteSpace = "pre-wrap"
    }
  }
};
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  style.position = "relative";
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.zoom = "1";
    style.display = "inline"
  }else {
    if(goog.userAgent.GECKO) {
      style.display = goog.userAgent.isVersion("1.9a") ? "inline-block" : "-moz-inline-box"
    }else {
      style.display = "inline-block"
    }
  }
};
goog.style.isRightToLeft = function(el) {
  return"rtl" == goog.style.getStyle_(el, "direction")
};
goog.style.unselectableStyle_ = goog.userAgent.GECKO ? "MozUserSelect" : goog.userAgent.WEBKIT ? "WebkitUserSelect" : null;
goog.style.isUnselectable = function(el) {
  if(goog.style.unselectableStyle_) {
    return el.style[goog.style.unselectableStyle_].toLowerCase() == "none"
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      return el.getAttribute("unselectable") == "on"
    }
  }
  return false
};
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  var descendants = !opt_noRecurse ? el.getElementsByTagName("*") : null;
  var name = goog.style.unselectableStyle_;
  if(name) {
    var value = unselectable ? "none" : "";
    el.style[name] = value;
    if(descendants) {
      for(var i = 0, descendant;descendant = descendants[i];i++) {
        descendant.style[name] = value
      }
    }
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      var value = unselectable ? "on" : "";
      el.setAttribute("unselectable", value);
      if(descendants) {
        for(var i = 0, descendant;descendant = descendants[i];i++) {
          descendant.setAttribute("unselectable", value)
        }
      }
    }
  }
};
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight)
};
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom
    }else {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "border-box")
  }
};
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element);
  var ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if(ieCurrentStyle && goog.dom.getDomHelper(doc).isCss1CompatMode() && ieCurrentStyle.width != "auto" && ieCurrentStyle.height != "auto" && !ieCurrentStyle.boxSizing) {
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width, "width", "pixelWidth");
    var height = goog.style.getIePixelValue_(element, ieCurrentStyle.height, "height", "pixelHeight");
    return new goog.math.Size(width, height)
  }else {
    var borderBoxSize = goog.style.getBorderBoxSize(element);
    var paddingBox = goog.style.getPaddingBox(element);
    var borderBox = goog.style.getBorderBox(element);
    return new goog.math.Size(borderBoxSize.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right, borderBoxSize.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom)
  }
};
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }else {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left + paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top + paddingBox.bottom + borderBox.bottom
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "content-box")
  }
};
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  if(goog.userAgent.GECKO) {
    style.MozBoxSizing = boxSizing
  }else {
    if(goog.userAgent.WEBKIT) {
      style.WebkitBoxSizing = boxSizing
    }else {
      style.boxSizing = boxSizing
    }
  }
  style.width = size.width + "px";
  style.height = size.height + "px"
};
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  if(/^\d+px?$/.test(value)) {
    return parseInt(value, 10)
  }else {
    var oldStyleValue = element.style[name];
    var oldRuntimeValue = element.runtimeStyle[name];
    element.runtimeStyle[name] = element.currentStyle[name];
    element.style[name] = value;
    var pixelValue = element.style[pixelName];
    element.style[name] = oldStyleValue;
    element.runtimeStyle[name] = oldRuntimeValue;
    return pixelValue
  }
};
goog.style.getIePixelDistance_ = function(element, propName) {
  return goog.style.getIePixelValue_(element, goog.style.getCascadedStyle(element, propName), "left", "pixelLeft")
};
goog.style.getBox_ = function(element, stylePrefix) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + "Left");
    var right = goog.style.getIePixelDistance_(element, stylePrefix + "Right");
    var top = goog.style.getIePixelDistance_(element, stylePrefix + "Top");
    var bottom = goog.style.getIePixelDistance_(element, stylePrefix + "Bottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, stylePrefix + "Left");
    var right = goog.style.getComputedStyle(element, stylePrefix + "Right");
    var top = goog.style.getComputedStyle(element, stylePrefix + "Top");
    var bottom = goog.style.getComputedStyle(element, stylePrefix + "Bottom");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, "padding")
};
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, "margin")
};
goog.style.ieBorderWidthKeywords_ = {"thin":2, "medium":4, "thick":6};
goog.style.getIePixelBorder_ = function(element, prop) {
  if(goog.style.getCascadedStyle(element, prop + "Style") == "none") {
    return 0
  }
  var width = goog.style.getCascadedStyle(element, prop + "Width");
  if(width in goog.style.ieBorderWidthKeywords_) {
    return goog.style.ieBorderWidthKeywords_[width]
  }
  return goog.style.getIePixelValue_(element, width, "left", "pixelLeft")
};
goog.style.getBorderBox = function(element) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelBorder_(element, "borderLeft");
    var right = goog.style.getIePixelBorder_(element, "borderRight");
    var top = goog.style.getIePixelBorder_(element, "borderTop");
    var bottom = goog.style.getIePixelBorder_(element, "borderBottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, "borderLeftWidth");
    var right = goog.style.getComputedStyle(element, "borderRightWidth");
    var top = goog.style.getComputedStyle(element, "borderTopWidth");
    var bottom = goog.style.getComputedStyle(element, "borderBottomWidth");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  var font = "";
  if(doc.body.createTextRange) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    try {
      font = range.queryCommandValue("FontName")
    }catch(e) {
      font = ""
    }
  }
  if(!font) {
    font = goog.style.getStyle_(el, "fontFamily")
  }
  var fontsArray = font.split(",");
  if(fontsArray.length > 1) {
    font = fontsArray[0]
  }
  return goog.string.stripQuotes(font, "\"'")
};
goog.style.lengthUnitRegex_ = /[^\d]+$/;
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null
};
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {"cm":1, "in":1, "mm":1, "pc":1, "pt":1};
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {"em":1, "ex":1};
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, "fontSize");
  var sizeUnits = goog.style.getLengthUnits(fontSize);
  if(fontSize && "px" == sizeUnits) {
    return parseInt(fontSize, 10)
  }
  if(goog.userAgent.IE) {
    if(sizeUnits in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el, fontSize, "left", "pixelLeft")
    }else {
      if(el.parentNode && el.parentNode.nodeType == goog.dom.NodeType.ELEMENT && sizeUnits in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
        var parentElement = el.parentNode;
        var parentSize = goog.style.getStyle_(parentElement, "fontSize");
        return goog.style.getIePixelValue_(parentElement, fontSize == parentSize ? "1em" : fontSize, "left", "pixelLeft")
      }
    }
  }
  var sizeElement = goog.dom.createDom("span", {"style":"visibility:hidden;position:absolute;" + "line-height:0;padding:0;margin:0;border:0;height:1em;"});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);
  return fontSize
};
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.split(/\s*:\s*/);
    if(keyValue.length == 2) {
      result[goog.string.toCamelCase(keyValue[0].toLowerCase())] = keyValue[1]
    }
  });
  return result
};
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.string.toSelectorCase(key), ":", value, ";")
  });
  return buffer.join("")
};
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] = value
};
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] || ""
};
goog.style.getScrollbarWidth = function() {
  var mockElement = goog.dom.createElement("div");
  mockElement.style.cssText = "visibility:hidden;overflow:scroll;" + "position:absolute;top:0;width:100px;height:100px";
  goog.dom.appendChild(goog.dom.getDocument().body, mockElement);
  var width = mockElement.offsetWidth - mockElement.clientWidth;
  goog.dom.removeNode(mockElement);
  return width
};
goog.provide("goog.iter");
goog.provide("goog.iter.Iterator");
goog.provide("goog.iter.StopIteration");
goog.require("goog.array");
goog.require("goog.asserts");
goog.iter.Iterable;
if("StopIteration" in goog.global) {
  goog.iter.StopIteration = goog.global["StopIteration"]
}else {
  goog.iter.StopIteration = Error("StopIteration")
}
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this
};
goog.iter.toIterator = function(iterable) {
  if(iterable instanceof goog.iter.Iterator) {
    return iterable
  }
  if(typeof iterable.__iterator__ == "function") {
    return iterable.__iterator__(false)
  }
  if(goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while(true) {
        if(i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if(!(i in iterable)) {
          i++;
          continue
        }
        return iterable[i++]
      }
    };
    return newIter
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if(goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach(iterable, f, opt_obj)
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }else {
    iterable = goog.iter.toIterator(iterable);
    try {
      while(true) {
        f.call(opt_obj, iterable.next(), undefined, iterable)
      }
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(f.call(opt_obj, val, undefined, iterable)) {
        return val
      }
    }
  };
  return newIter
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if(arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop
  }
  if(step == 0) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if(step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv
  };
  return newIter
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator)
};
goog.iter.map = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      return f.call(opt_obj, val, undefined, iterable)
    }
  };
  return newIter
};
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val)
  });
  return rval
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true
};
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    try {
      if(i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next()
    }catch(ex) {
      if(ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      }else {
        i++;
        return this.next()
      }
    }
  };
  return newIter
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(dropping && f.call(opt_obj, val, undefined, iterable)) {
        continue
      }else {
        dropping = false
      }
      return val
    }
  };
  return newIter
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while(true) {
      if(taking) {
        var val = iterable.next();
        if(f.call(opt_obj, val, undefined, iterable)) {
          return val
        }else {
          taking = false
        }
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter
};
goog.iter.toArray = function(iterable) {
  if(goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable)
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val)
  });
  return array
};
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  try {
    while(true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if(val1 != val2) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }else {
      if(b1 && !b2) {
        return false
      }
      if(!b2) {
        try {
          val2 = iterable2.next();
          return false
        }catch(ex1) {
          if(ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          return true
        }
      }
    }
  }
  return false
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next()
  }catch(e) {
    if(e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue
  }
};
goog.iter.product = function(var_args) {
  var someArrayEmpty = goog.array.some(arguments, function(arr) {
    return!arr.length
  });
  if(someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator
  }
  var iter = new goog.iter.Iterator;
  var arrays = arguments;
  var indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if(indicies) {
      var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex]
      });
      for(var i = indicies.length - 1;i >= 0;i--) {
        goog.asserts.assert(indicies);
        if(indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break
        }
        if(i == 0) {
          indicies = null;
          break
        }
        indicies[i] = 0
      }
      return retVal
    }
    throw goog.iter.StopIteration;
  };
  return iter
};
goog.provide("goog.structs");
goog.require("goog.array");
goog.require("goog.object");
goog.structs.getCount = function(col) {
  if(typeof col.getCount == "function") {
    return col.getCount()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return col.length
  }
  return goog.object.getCount(col)
};
goog.structs.getValues = function(col) {
  if(typeof col.getValues == "function") {
    return col.getValues()
  }
  if(goog.isString(col)) {
    return col.split("")
  }
  if(goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(col[i])
    }
    return rv
  }
  return goog.object.getValues(col)
};
goog.structs.getKeys = function(col) {
  if(typeof col.getKeys == "function") {
    return col.getKeys()
  }
  if(typeof col.getValues == "function") {
    return undefined
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(i)
    }
    return rv
  }
  return goog.object.getKeys(col)
};
goog.structs.contains = function(col, val) {
  if(typeof col.contains == "function") {
    return col.contains(val)
  }
  if(typeof col.containsValue == "function") {
    return col.containsValue(val)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(col, val)
  }
  return goog.object.containsValue(col, val)
};
goog.structs.isEmpty = function(col) {
  if(typeof col.isEmpty == "function") {
    return col.isEmpty()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(col)
  }
  return goog.object.isEmpty(col)
};
goog.structs.clear = function(col) {
  if(typeof col.clear == "function") {
    col.clear()
  }else {
    if(goog.isArrayLike(col)) {
      goog.array.clear(col)
    }else {
      goog.object.clear(col)
    }
  }
};
goog.structs.forEach = function(col, f, opt_obj) {
  if(typeof col.forEach == "function") {
    col.forEach(f, opt_obj)
  }else {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj)
    }else {
      var keys = goog.structs.getKeys(col);
      var values = goog.structs.getValues(col);
      var l = values.length;
      for(var i = 0;i < l;i++) {
        f.call(opt_obj, values[i], keys && keys[i], col)
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if(typeof col.filter == "function") {
    return col.filter(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i]
      }
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i])
      }
    }
  }
  return rv
};
goog.structs.map = function(col, f, opt_obj) {
  if(typeof col.map == "function") {
    return col.map(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col)
    }
  }
  return rv
};
goog.structs.some = function(col, f, opt_obj) {
  if(typeof col.some == "function") {
    return col.some(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true
    }
  }
  return false
};
goog.structs.every = function(col, f, opt_obj) {
  if(typeof col.every == "function") {
    return col.every(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false
    }
  }
  return true
};
goog.provide("goog.structs.Map");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  var argLength = arguments.length;
  if(argLength > 1) {
    if(argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var i = 0;i < argLength;i += 2) {
      this.set(arguments[i], arguments[i + 1])
    }
  }else {
    if(opt_map) {
      this.addAll(opt_map)
    }
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  var rv = [];
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key])
  }
  return rv
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat()
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key)
};
goog.structs.Map.prototype.containsValue = function(val) {
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if(goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true
    }
  }
  return false
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if(this === otherMap) {
    return true
  }
  if(this.count_ != otherMap.getCount()) {
    return false
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var key, i = 0;key = this.keys_[i];i++) {
    if(!equalityFn(this.get(key), otherMap.get(key))) {
      return false
    }
  }
  return true
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0
};
goog.structs.Map.prototype.remove = function(key) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;
    if(this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_()
    }
    return true
  }
  return false
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
  if(this.count_ != this.keys_.length) {
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(!goog.structs.Map.hasKey_(seen, key)) {
        this.keys_[destIndex++] = key;
        seen[key] = 1
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key]
  }
  return opt_val
};
goog.structs.Map.prototype.set = function(key, value) {
  if(!goog.structs.Map.hasKey_(this.map_, key)) {
    this.count_++;
    this.keys_.push(key);
    this.version_++
  }
  this.map_[key] = value
};
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if(map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues()
  }else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map)
  }
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map;
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key)
  }
  return transposed
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key]
  }
  return obj
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true)
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false)
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      if(version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key]
    }
  };
  return newIter
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
};
goog.provide("goog.dom.forms");
goog.require("goog.structs.Map");
goog.dom.forms.getFormDataMap = function(form) {
  var map = new goog.structs.Map;
  goog.dom.forms.getFormDataHelper_(form, map, goog.dom.forms.addFormDataToMap_);
  return map
};
goog.dom.forms.getFormDataString = function(form) {
  var sb = [];
  goog.dom.forms.getFormDataHelper_(form, sb, goog.dom.forms.addFormDataToStringBuffer_);
  return sb.join("&")
};
goog.dom.forms.getFormDataHelper_ = function(form, result, fnAppend) {
  var els = form.elements;
  for(var el, i = 0;el = els[i];i++) {
    if(el.disabled || el.tagName.toLowerCase() == "fieldset") {
      continue
    }
    var name = el.name;
    var type = el.type.toLowerCase();
    switch(type) {
      case "file":
      ;
      case "submit":
      ;
      case "reset":
      ;
      case "button":
        break;
      case "select-multiple":
        var values = goog.dom.forms.getValue(el);
        if(values != null) {
          for(var value, j = 0;value = values[j];j++) {
            fnAppend(result, name, value)
          }
        }
        break;
      default:
        var value = goog.dom.forms.getValue(el);
        if(value != null) {
          fnAppend(result, name, value)
        }
    }
  }
  var inputs = form.getElementsByTagName("input");
  for(var input, i = 0;input = inputs[i];i++) {
    if(input.form == form && input.type.toLowerCase() == "image") {
      name = input.name;
      fnAppend(result, name, input.value);
      fnAppend(result, name + ".x", "0");
      fnAppend(result, name + ".y", "0")
    }
  }
};
goog.dom.forms.addFormDataToMap_ = function(map, name, value) {
  var array = map.get(name);
  if(!array) {
    array = [];
    map.set(name, array)
  }
  array.push(value)
};
goog.dom.forms.addFormDataToStringBuffer_ = function(sb, name, value) {
  sb.push(encodeURIComponent(name) + "=" + encodeURIComponent(value))
};
goog.dom.forms.hasFileInput = function(form) {
  var els = form.elements;
  for(var el, i = 0;el = els[i];i++) {
    if(!el.disabled && el.type && el.type.toLowerCase() == "file") {
      return true
    }
  }
  return false
};
goog.dom.forms.setDisabled = function(el, disabled) {
  if(el.tagName == "FORM") {
    var els = el.elements;
    for(var i = 0;el = els[i];i++) {
      goog.dom.forms.setDisabled(el, disabled)
    }
  }else {
    if(disabled == true) {
      el.blur()
    }
    el.disabled = disabled
  }
};
goog.dom.forms.focusAndSelect = function(el) {
  el.focus();
  if(el.select) {
    el.select()
  }
};
goog.dom.forms.hasValue = function(el) {
  var value = goog.dom.forms.getValue(el);
  return!!value
};
goog.dom.forms.hasValueByName = function(form, name) {
  var value = goog.dom.forms.getValueByName(form, name);
  return!!value
};
goog.dom.forms.getValue = function(el) {
  var type = el.type;
  if(!goog.isDef(type)) {
    return null
  }
  switch(type.toLowerCase()) {
    case "checkbox":
    ;
    case "radio":
      return goog.dom.forms.getInputChecked_(el);
    case "select-one":
      return goog.dom.forms.getSelectSingle_(el);
    case "select-multiple":
      return goog.dom.forms.getSelectMultiple_(el);
    default:
      return goog.isDef(el.value) ? el.value : null
  }
};
goog.dom.$F = goog.dom.forms.getValue;
goog.dom.forms.getValueByName = function(form, name) {
  var els = form.elements[name];
  if(els.type) {
    return goog.dom.forms.getValue(els)
  }else {
    for(var i = 0;i < els.length;i++) {
      var val = goog.dom.forms.getValue(els[i]);
      if(val) {
        return val
      }
    }
    return null
  }
};
goog.dom.forms.getInputChecked_ = function(el) {
  return el.checked ? el.value : null
};
goog.dom.forms.getSelectSingle_ = function(el) {
  var selectedIndex = el.selectedIndex;
  return selectedIndex >= 0 ? el.options[selectedIndex].value : null
};
goog.dom.forms.getSelectMultiple_ = function(el) {
  var values = [];
  for(var option, i = 0;option = el.options[i];i++) {
    if(option.selected) {
      values.push(option.value)
    }
  }
  return values.length ? values : null
};
goog.dom.forms.setValue = function(el, opt_value) {
  var type = el.type;
  if(goog.isDef(type)) {
    switch(type.toLowerCase()) {
      case "checkbox":
      ;
      case "radio":
        goog.dom.forms.setInputChecked_(el, opt_value);
        break;
      case "select-one":
        goog.dom.forms.setSelectSingle_(el, opt_value);
        break;
      case "select-multiple":
        goog.dom.forms.setSelectMultiple_(el, opt_value);
        break;
      default:
        el.value = goog.isDefAndNotNull(opt_value) ? opt_value : ""
    }
  }
};
goog.dom.forms.setInputChecked_ = function(el, opt_value) {
  el.checked = opt_value ? "checked" : null
};
goog.dom.forms.setSelectSingle_ = function(el, opt_value) {
  el.selectedIndex = -1;
  if(goog.isString(opt_value)) {
    for(var option, i = 0;option = el.options[i];i++) {
      if(option.value == opt_value) {
        option.selected = true;
        break
      }
    }
  }
};
goog.dom.forms.setSelectMultiple_ = function(el, opt_value) {
  if(goog.isString(opt_value)) {
    opt_value = [opt_value]
  }
  for(var option, i = 0;option = el.options[i];i++) {
    option.selected = false;
    if(opt_value) {
      for(var value, j = 0;value = opt_value[j];j++) {
        if(option.value == value) {
          option.selected = true
        }
      }
    }
  }
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isVersion("9"), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.ENABLE_MONITORING) {
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.ENABLE_MONITORING) {
      var uid = goog.getUid(this);
      if(!goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.disposeInternal = function() {
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.inherits(goog.events.Event, goog.Disposable);
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
MESSAGE:"message", CONNECT:"connect"};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = new Function("a", "return a");
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      try {
        goog.reflect.sinkValue(relatedTarget.nodeName)
      }catch(err) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.structs.SimplePool");
goog.require("goog.Disposable");
goog.structs.SimplePool = function(initialCount, maxCount) {
  goog.Disposable.call(this);
  this.maxCount_ = maxCount;
  this.freeQueue_ = [];
  this.createInitial_(initialCount)
};
goog.inherits(goog.structs.SimplePool, goog.Disposable);
goog.structs.SimplePool.prototype.createObjectFn_ = null;
goog.structs.SimplePool.prototype.disposeObjectFn_ = null;
goog.structs.SimplePool.prototype.setCreateObjectFn = function(createObjectFn) {
  this.createObjectFn_ = createObjectFn
};
goog.structs.SimplePool.prototype.setDisposeObjectFn = function(disposeObjectFn) {
  this.disposeObjectFn_ = disposeObjectFn
};
goog.structs.SimplePool.prototype.getObject = function() {
  if(this.freeQueue_.length) {
    return this.freeQueue_.pop()
  }
  return this.createObject()
};
goog.structs.SimplePool.prototype.releaseObject = function(obj) {
  if(this.freeQueue_.length < this.maxCount_) {
    this.freeQueue_.push(obj)
  }else {
    this.disposeObject(obj)
  }
};
goog.structs.SimplePool.prototype.createInitial_ = function(initialCount) {
  if(initialCount > this.maxCount_) {
    throw Error("[goog.structs.SimplePool] Initial cannot be greater than max");
  }
  for(var i = 0;i < initialCount;i++) {
    this.freeQueue_.push(this.createObject())
  }
};
goog.structs.SimplePool.prototype.createObject = function() {
  if(this.createObjectFn_) {
    return this.createObjectFn_()
  }else {
    return{}
  }
};
goog.structs.SimplePool.prototype.disposeObject = function(obj) {
  if(this.disposeObjectFn_) {
    this.disposeObjectFn_(obj)
  }else {
    if(goog.isObject(obj)) {
      if(goog.isFunction(obj.dispose)) {
        obj.dispose()
      }else {
        for(var i in obj) {
          delete obj[i]
        }
      }
    }
  }
};
goog.structs.SimplePool.prototype.disposeInternal = function() {
  goog.structs.SimplePool.superClass_.disposeInternal.call(this);
  var freeQueue = this.freeQueue_;
  while(freeQueue.length) {
    this.disposeObject(freeQueue.pop())
  }
  delete this.freeQueue_
};
goog.provide("goog.events.pools");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Listener");
goog.require("goog.structs.SimplePool");
goog.require("goog.userAgent.jscript");
goog.events.ASSUME_GOOD_GC = false;
goog.events.pools.getObject;
goog.events.pools.releaseObject;
goog.events.pools.getArray;
goog.events.pools.releaseArray;
goog.events.pools.getProxy;
goog.events.pools.setProxyCallbackFunction;
goog.events.pools.releaseProxy;
goog.events.pools.getListener;
goog.events.pools.releaseListener;
goog.events.pools.getEvent;
goog.events.pools.releaseEvent;
(function() {
  var BAD_GC = !goog.events.ASSUME_GOOD_GC && goog.userAgent.jscript.HAS_JSCRIPT && !goog.userAgent.jscript.isVersion("5.7");
  function getObject() {
    return{count_:0, remaining_:0}
  }
  function getArray() {
    return[]
  }
  var proxyCallbackFunction;
  goog.events.pools.setProxyCallbackFunction = function(cb) {
    proxyCallbackFunction = cb
  };
  function getProxy() {
    var f = function(eventObject) {
      return proxyCallbackFunction.call(f.src, f.key, eventObject)
    };
    return f
  }
  function getListener() {
    return new goog.events.Listener
  }
  function getEvent() {
    return new goog.events.BrowserEvent
  }
  if(!BAD_GC) {
    goog.events.pools.getObject = getObject;
    goog.events.pools.releaseObject = goog.nullFunction;
    goog.events.pools.getArray = getArray;
    goog.events.pools.releaseArray = goog.nullFunction;
    goog.events.pools.getProxy = getProxy;
    goog.events.pools.releaseProxy = goog.nullFunction;
    goog.events.pools.getListener = getListener;
    goog.events.pools.releaseListener = goog.nullFunction;
    goog.events.pools.getEvent = getEvent;
    goog.events.pools.releaseEvent = goog.nullFunction
  }else {
    goog.events.pools.getObject = function() {
      return objectPool.getObject()
    };
    goog.events.pools.releaseObject = function(obj) {
      objectPool.releaseObject(obj)
    };
    goog.events.pools.getArray = function() {
      return arrayPool.getObject()
    };
    goog.events.pools.releaseArray = function(obj) {
      arrayPool.releaseObject(obj)
    };
    goog.events.pools.getProxy = function() {
      return proxyPool.getObject()
    };
    goog.events.pools.releaseProxy = function(obj) {
      proxyPool.releaseObject(getProxy())
    };
    goog.events.pools.getListener = function() {
      return listenerPool.getObject()
    };
    goog.events.pools.releaseListener = function(obj) {
      listenerPool.releaseObject(obj)
    };
    goog.events.pools.getEvent = function() {
      return eventPool.getObject()
    };
    goog.events.pools.releaseEvent = function(obj) {
      eventPool.releaseObject(obj)
    };
    var OBJECT_POOL_INITIAL_COUNT = 0;
    var OBJECT_POOL_MAX_COUNT = 600;
    var objectPool = new goog.structs.SimplePool(OBJECT_POOL_INITIAL_COUNT, OBJECT_POOL_MAX_COUNT);
    objectPool.setCreateObjectFn(getObject);
    var ARRAY_POOL_INITIAL_COUNT = 0;
    var ARRAY_POOL_MAX_COUNT = 600;
    var arrayPool = new goog.structs.SimplePool(ARRAY_POOL_INITIAL_COUNT, ARRAY_POOL_MAX_COUNT);
    arrayPool.setCreateObjectFn(getArray);
    var HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT = 0;
    var HANDLE_EVENT_PROXY_POOL_MAX_COUNT = 600;
    var proxyPool = new goog.structs.SimplePool(HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT, HANDLE_EVENT_PROXY_POOL_MAX_COUNT);
    proxyPool.setCreateObjectFn(getProxy);
    var LISTENER_POOL_INITIAL_COUNT = 0;
    var LISTENER_POOL_MAX_COUNT = 600;
    var listenerPool = new goog.structs.SimplePool(LISTENER_POOL_INITIAL_COUNT, LISTENER_POOL_MAX_COUNT);
    listenerPool.setCreateObjectFn(getListener);
    var EVENT_POOL_INITIAL_COUNT = 0;
    var EVENT_POOL_MAX_COUNT = 600;
    var eventPool = new goog.structs.SimplePool(EVENT_POOL_INITIAL_COUNT, EVENT_POOL_MAX_COUNT);
    eventPool.setCreateObjectFn(getEvent)
  }
})();
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.pools");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.requiresSyntheticEventPropagation_;
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = goog.events.pools.getObject()
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = goog.events.pools.getObject();
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = goog.events.pools.getArray();
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.pools.getProxy();
      proxy.src = src;
      listenerObj = goog.events.pools.getListener();
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = goog.events.pools.getArray()
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          goog.events.pools.releaseProxy(proxy);
          goog.events.pools.releaseListener(listenerArray[oldIndex]);
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        goog.events.pools.releaseArray(listenerArray);
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type][capture]);
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type]);
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return rv
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(goog.events.synthesizeEventPropagation_()) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = goog.events.pools.getEvent();
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = goog.events.pools.getArray();
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0;
        goog.events.pools.releaseArray(ancestors)
      }
      evt.dispose();
      goog.events.pools.releaseEvent(evt)
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be)
  }finally {
    be.dispose()
  }
  return retval
};
goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_);
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.events.synthesizeEventPropagation_ = function() {
  if(goog.events.requiresSyntheticEventPropagation_ === undefined) {
    goog.events.requiresSyntheticEventPropagation_ = goog.userAgent.IE && !goog.global["addEventListener"]
  }
  return goog.events.requiresSyntheticEventPropagation_
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
});
goog.provide("domina.support");
goog.require("cljs.core");
goog.require("goog.dom");
goog.require("goog.events");
var div__14734 = document.createElement("div");
var test_html__14735 = "   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>";
div__14734.innerHTML = test_html__14735;
domina.support.leading_whitespace_QMARK_ = cljs.core._EQ_.call(null, div__14734.firstChild.nodeType, 3);
domina.support.extraneous_tbody_QMARK_ = cljs.core._EQ_.call(null, div__14734.getElementsByTagName("tbody").length, 0);
domina.support.unscoped_html_elements_QMARK_ = cljs.core._EQ_.call(null, div__14734.getElementsByTagName("link").length, 0);
goog.provide("domina");
goog.require("cljs.core");
goog.require("domina.support");
goog.require("goog.dom.classes");
goog.require("goog.events");
goog.require("goog.dom.xml");
goog.require("goog.dom.forms");
goog.require("goog.dom");
goog.require("goog.string");
goog.require("clojure.string");
goog.require("goog.style");
goog.require("cljs.core");
domina.re_html = /<|&#?\w+;/;
domina.re_leading_whitespace = /^\s+/;
domina.re_xhtml_tag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/i;
domina.re_tag_name = /<([\w:]+)/;
domina.re_no_inner_html = /<(?:script|style)/i;
domina.re_tbody = /<tbody/i;
var opt_wrapper__14514 = cljs.core.PersistentVector.fromArray([1, "<select multiple='multiple'>", "</select>"]);
var table_section_wrapper__14515 = cljs.core.PersistentVector.fromArray([1, "<table>", "</table>"]);
var cell_wrapper__14516 = cljs.core.PersistentVector.fromArray([3, "<table><tbody><tr>", "</tr></tbody></table>"]);
domina.wrap_map = cljs.core.ObjMap.fromObject(["col", "\ufdd0'default", "tfoot", "caption", "optgroup", "legend", "area", "td", "thead", "th", "option", "tbody", "tr", "colgroup"], {"col":cljs.core.PersistentVector.fromArray([2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"]), "\ufdd0'default":cljs.core.PersistentVector.fromArray([0, "", ""]), "tfoot":table_section_wrapper__14515, "caption":table_section_wrapper__14515, "optgroup":opt_wrapper__14514, "legend":cljs.core.PersistentVector.fromArray([1, 
"<fieldset>", "</fieldset>"]), "area":cljs.core.PersistentVector.fromArray([1, "<map>", "</map>"]), "td":cell_wrapper__14516, "thead":table_section_wrapper__14515, "th":cell_wrapper__14516, "option":opt_wrapper__14514, "tbody":table_section_wrapper__14515, "tr":cljs.core.PersistentVector.fromArray([2, "<table><tbody>", "</tbody></table>"]), "colgroup":table_section_wrapper__14515});
domina.remove_extraneous_tbody_BANG_ = function remove_extraneous_tbody_BANG_(div, html) {
  var no_tbody_QMARK___14517 = cljs.core.not.call(null, cljs.core.re_find.call(null, domina.re_tbody, html));
  var tbody__14521 = function() {
    var and__3822__auto____14518 = cljs.core._EQ_.call(null, domina.tag_name, "table");
    if(and__3822__auto____14518) {
      return no_tbody_QMARK___14517
    }else {
      return and__3822__auto____14518
    }
  }() ? function() {
    var and__3822__auto____14519 = div.firstChild;
    if(cljs.core.truth_(and__3822__auto____14519)) {
      return div.firstChild.childNodes
    }else {
      return and__3822__auto____14519
    }
  }() : function() {
    var and__3822__auto____14520 = cljs.core._EQ_.call(null, domina.start_wrap, "<table>");
    if(and__3822__auto____14520) {
      return no_tbody_QMARK___14517
    }else {
      return and__3822__auto____14520
    }
  }() ? div.childNodes : cljs.core.PersistentVector.fromArray([]);
  var G__14522__14523 = cljs.core.seq.call(null, tbody__14521);
  if(cljs.core.truth_(G__14522__14523)) {
    var child__14524 = cljs.core.first.call(null, G__14522__14523);
    var G__14522__14525 = G__14522__14523;
    while(true) {
      if(function() {
        var and__3822__auto____14526 = cljs.core._EQ_.call(null, child__14524.nodeName, "tbody");
        if(and__3822__auto____14526) {
          return cljs.core._EQ_.call(null, child__14524.childNodes.length, 0)
        }else {
          return and__3822__auto____14526
        }
      }()) {
        child__14524.parentNode.removeChild(child__14524)
      }else {
      }
      var temp__3974__auto____14527 = cljs.core.next.call(null, G__14522__14525);
      if(cljs.core.truth_(temp__3974__auto____14527)) {
        var G__14522__14528 = temp__3974__auto____14527;
        var G__14529 = cljs.core.first.call(null, G__14522__14528);
        var G__14530 = G__14522__14528;
        child__14524 = G__14529;
        G__14522__14525 = G__14530;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
domina.restore_leading_whitespace_BANG_ = function restore_leading_whitespace_BANG_(div, html) {
  return div.insertBefore(document.createTextNode(cljs.core.first.call(null, cljs.core.re_find.call(null, domina.re_leading_whitespace, html))), div.firstChild)
};
domina.html_to_dom = function html_to_dom(html) {
  var html__14532 = clojure.string.replace.call(null, html, domina.re_xhtml_tag, "<$1></$2>");
  var tag_name__14533 = [cljs.core.str(cljs.core.second.call(null, cljs.core.re_find.call(null, domina.re_tag_name, html__14532)))].join("").toLowerCase();
  var vec__14531__14534 = cljs.core.get.call(null, domina.wrap_map, tag_name__14533, "\ufdd0'default".call(null, domina.wrap_map));
  var depth__14535 = cljs.core.nth.call(null, vec__14531__14534, 0, null);
  var start_wrap__14536 = cljs.core.nth.call(null, vec__14531__14534, 1, null);
  var end_wrap__14537 = cljs.core.nth.call(null, vec__14531__14534, 2, null);
  var div__14541 = function() {
    var wrapper__14539 = function() {
      var div__14538 = document.createElement("div");
      div__14538.innerHTML = [cljs.core.str(start_wrap__14536), cljs.core.str(html__14532), cljs.core.str(end_wrap__14537)].join("");
      return div__14538
    }();
    var level__14540 = depth__14535;
    while(true) {
      if(level__14540 > 0) {
        var G__14543 = wrapper__14539.lastChild;
        var G__14544 = level__14540 - 1;
        wrapper__14539 = G__14543;
        level__14540 = G__14544;
        continue
      }else {
        return wrapper__14539
      }
      break
    }
  }();
  if(cljs.core.truth_(domina.support.extraneous_tbody_QMARK_)) {
    domina.remove_extraneous_tbody_BANG_.call(null, div__14541, html__14532)
  }else {
  }
  if(cljs.core.truth_(function() {
    var and__3822__auto____14542 = cljs.core.not.call(null, domina.support.leading_whitespace_QMARK_);
    if(and__3822__auto____14542) {
      return cljs.core.re_find.call(null, domina.re_leading_whitespace, html__14532)
    }else {
      return and__3822__auto____14542
    }
  }())) {
    domina.restore_leading_whitespace_BANG_.call(null, div__14541, html__14532)
  }else {
  }
  return div__14541.childNodes
};
domina.string_to_dom = function string_to_dom(s) {
  if(cljs.core.truth_(cljs.core.re_find.call(null, domina.re_html, s))) {
    return domina.html_to_dom.call(null, s)
  }else {
    return document.createTextNode(s)
  }
};
void 0;
domina.DomContent = {};
domina.nodes = function nodes(content) {
  if(function() {
    var and__3822__auto____14545 = content;
    if(and__3822__auto____14545) {
      return content.domina$DomContent$nodes$arity$1
    }else {
      return and__3822__auto____14545
    }
  }()) {
    return content.domina$DomContent$nodes$arity$1(content)
  }else {
    return function() {
      var or__3824__auto____14546 = domina.nodes[goog.typeOf.call(null, content)];
      if(or__3824__auto____14546) {
        return or__3824__auto____14546
      }else {
        var or__3824__auto____14547 = domina.nodes["_"];
        if(or__3824__auto____14547) {
          return or__3824__auto____14547
        }else {
          throw cljs.core.missing_protocol.call(null, "DomContent.nodes", content);
        }
      }
    }().call(null, content)
  }
};
domina.single_node = function single_node(nodeseq) {
  if(function() {
    var and__3822__auto____14548 = nodeseq;
    if(and__3822__auto____14548) {
      return nodeseq.domina$DomContent$single_node$arity$1
    }else {
      return and__3822__auto____14548
    }
  }()) {
    return nodeseq.domina$DomContent$single_node$arity$1(nodeseq)
  }else {
    return function() {
      var or__3824__auto____14549 = domina.single_node[goog.typeOf.call(null, nodeseq)];
      if(or__3824__auto____14549) {
        return or__3824__auto____14549
      }else {
        var or__3824__auto____14550 = domina.single_node["_"];
        if(or__3824__auto____14550) {
          return or__3824__auto____14550
        }else {
          throw cljs.core.missing_protocol.call(null, "DomContent.single-node", nodeseq);
        }
      }
    }().call(null, nodeseq)
  }
};
void 0;
domina._STAR_debug_STAR_ = true;
domina.log_debug = function log_debug(mesg) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14551 = domina._STAR_debug_STAR_;
    if(cljs.core.truth_(and__3822__auto____14551)) {
      return cljs.core.not.call(null, cljs.core._EQ_.call(null, window.console, undefined))
    }else {
      return and__3822__auto____14551
    }
  }())) {
    return console.log(mesg)
  }else {
    return null
  }
};
domina.log = function log(mesg) {
  if(cljs.core.truth_(window.console)) {
    return console.log(mesg)
  }else {
    return null
  }
};
domina.by_id = function by_id(id) {
  return goog.dom.getElement.call(null, cljs.core.name.call(null, id))
};
void 0;
domina.by_class = function by_class(class_name) {
  if(void 0 === domina.t14552) {
    domina.t14552 = function(class_name, by_class, __meta__389__auto__) {
      this.class_name = class_name;
      this.by_class = by_class;
      this.__meta__389__auto__ = __meta__389__auto__;
      this.cljs$lang$protocol_mask$partition1$ = 0;
      this.cljs$lang$protocol_mask$partition0$ = 196608
    };
    domina.t14552.cljs$lang$type = true;
    domina.t14552.cljs$lang$ctorPrSeq = function(this__454__auto__) {
      return cljs.core.list.call(null, "domina.t14552")
    };
    domina.t14552.prototype.domina$DomContent$ = true;
    domina.t14552.prototype.domina$DomContent$nodes$arity$1 = function(_) {
      var this__14553 = this;
      return domina.normalize_seq.call(null, goog.dom.getElementsByClass.call(null, cljs.core.name.call(null, this__14553.class_name)))
    };
    domina.t14552.prototype.domina$DomContent$single_node$arity$1 = function(_) {
      var this__14554 = this;
      return domina.normalize_seq.call(null, goog.dom.getElementByClass.call(null, cljs.core.name.call(null, this__14554.class_name)))
    };
    domina.t14552.prototype.cljs$core$IMeta$ = true;
    domina.t14552.prototype.cljs$core$IMeta$_meta$arity$1 = function(___390__auto__) {
      var this__14555 = this;
      return this__14555.__meta__389__auto__
    };
    domina.t14552.prototype.cljs$core$IWithMeta$ = true;
    domina.t14552.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___390__auto__, __meta__389__auto__) {
      var this__14556 = this;
      return new domina.t14552(this__14556.class_name, this__14556.by_class, __meta__389__auto__)
    };
    domina.t14552
  }else {
  }
  return new domina.t14552(class_name, by_class, null)
};
domina.children = function children(content) {
  return cljs.core.mapcat.call(null, goog.dom.getChildren, domina.nodes.call(null, content))
};
domina.clone = function clone(content) {
  return cljs.core.map.call(null, function(p1__14557_SHARP_) {
    return p1__14557_SHARP_.cloneNode(true)
  }, domina.nodes.call(null, content))
};
void 0;
domina.append_BANG_ = function append_BANG_(parent_content, child_content) {
  domina.apply_with_cloning.call(null, goog.dom.appendChild, parent_content, child_content);
  return parent_content
};
domina.insert_BANG_ = function insert_BANG_(parent_content, child_content, idx) {
  domina.apply_with_cloning.call(null, function(p1__14558_SHARP_, p2__14559_SHARP_) {
    return goog.dom.insertChildAt.call(null, p1__14558_SHARP_, p2__14559_SHARP_, idx)
  }, parent_content, child_content);
  return parent_content
};
domina.prepend_BANG_ = function prepend_BANG_(parent_content, child_content) {
  domina.insert_BANG_.call(null, parent_content, child_content, 0);
  return parent_content
};
domina.insert_before_BANG_ = function insert_before_BANG_(content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__14561_SHARP_, p2__14560_SHARP_) {
    return goog.dom.insertSiblingBefore.call(null, p2__14560_SHARP_, p1__14561_SHARP_)
  }, content, new_content);
  return content
};
domina.insert_after_BANG_ = function insert_after_BANG_(content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__14563_SHARP_, p2__14562_SHARP_) {
    return goog.dom.insertSiblingAfter.call(null, p2__14562_SHARP_, p1__14563_SHARP_)
  }, content, new_content);
  return content
};
domina.swap_content_BANG_ = function swap_content_BANG_(old_content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__14565_SHARP_, p2__14564_SHARP_) {
    return goog.dom.replaceNode.call(null, p2__14564_SHARP_, p1__14565_SHARP_)
  }, old_content, new_content);
  return old_content
};
domina.detach_BANG_ = function detach_BANG_(content) {
  return cljs.core.doall.call(null, cljs.core.map.call(null, goog.dom.removeNode, domina.nodes.call(null, content)))
};
domina.destroy_BANG_ = function destroy_BANG_(content) {
  return cljs.core.dorun.call(null, cljs.core.map.call(null, goog.dom.removeNode, domina.nodes.call(null, content)))
};
domina.destroy_children_BANG_ = function destroy_children_BANG_(content) {
  cljs.core.dorun.call(null, cljs.core.map.call(null, goog.dom.removeChildren, domina.nodes.call(null, content)));
  return content
};
domina.style = function style(content, name) {
  var s__14566 = goog.style.getStyle.call(null, domina.single_node.call(null, content), cljs.core.name.call(null, name));
  if(cljs.core.truth_(clojure.string.blank_QMARK_.call(null, s__14566))) {
    return null
  }else {
    return s__14566
  }
};
domina.attr = function attr(content, name) {
  return domina.single_node.call(null, content).getAttribute(cljs.core.name.call(null, name))
};
domina.set_style_BANG_ = function() {
  var set_style_BANG___delegate = function(content, name, value) {
    var G__14567__14568 = cljs.core.seq.call(null, domina.nodes.call(null, content));
    if(cljs.core.truth_(G__14567__14568)) {
      var n__14569 = cljs.core.first.call(null, G__14567__14568);
      var G__14567__14570 = G__14567__14568;
      while(true) {
        goog.style.setStyle.call(null, n__14569, cljs.core.name.call(null, name), cljs.core.apply.call(null, cljs.core.str, value));
        var temp__3974__auto____14571 = cljs.core.next.call(null, G__14567__14570);
        if(cljs.core.truth_(temp__3974__auto____14571)) {
          var G__14567__14572 = temp__3974__auto____14571;
          var G__14573 = cljs.core.first.call(null, G__14567__14572);
          var G__14574 = G__14567__14572;
          n__14569 = G__14573;
          G__14567__14570 = G__14574;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return content
  };
  var set_style_BANG_ = function(content, name, var_args) {
    var value = null;
    if(goog.isDef(var_args)) {
      value = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return set_style_BANG___delegate.call(this, content, name, value)
  };
  set_style_BANG_.cljs$lang$maxFixedArity = 2;
  set_style_BANG_.cljs$lang$applyTo = function(arglist__14575) {
    var content = cljs.core.first(arglist__14575);
    var name = cljs.core.first(cljs.core.next(arglist__14575));
    var value = cljs.core.rest(cljs.core.next(arglist__14575));
    return set_style_BANG___delegate(content, name, value)
  };
  set_style_BANG_.cljs$lang$arity$variadic = set_style_BANG___delegate;
  return set_style_BANG_
}();
domina.set_attr_BANG_ = function() {
  var set_attr_BANG___delegate = function(content, name, value) {
    var G__14576__14577 = cljs.core.seq.call(null, domina.nodes.call(null, content));
    if(cljs.core.truth_(G__14576__14577)) {
      var n__14578 = cljs.core.first.call(null, G__14576__14577);
      var G__14576__14579 = G__14576__14577;
      while(true) {
        n__14578.setAttribute(cljs.core.name.call(null, name), cljs.core.apply.call(null, cljs.core.str, value));
        var temp__3974__auto____14580 = cljs.core.next.call(null, G__14576__14579);
        if(cljs.core.truth_(temp__3974__auto____14580)) {
          var G__14576__14581 = temp__3974__auto____14580;
          var G__14582 = cljs.core.first.call(null, G__14576__14581);
          var G__14583 = G__14576__14581;
          n__14578 = G__14582;
          G__14576__14579 = G__14583;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return content
  };
  var set_attr_BANG_ = function(content, name, var_args) {
    var value = null;
    if(goog.isDef(var_args)) {
      value = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return set_attr_BANG___delegate.call(this, content, name, value)
  };
  set_attr_BANG_.cljs$lang$maxFixedArity = 2;
  set_attr_BANG_.cljs$lang$applyTo = function(arglist__14584) {
    var content = cljs.core.first(arglist__14584);
    var name = cljs.core.first(cljs.core.next(arglist__14584));
    var value = cljs.core.rest(cljs.core.next(arglist__14584));
    return set_attr_BANG___delegate(content, name, value)
  };
  set_attr_BANG_.cljs$lang$arity$variadic = set_attr_BANG___delegate;
  return set_attr_BANG_
}();
domina.remove_attr_BANG_ = function remove_attr_BANG_(content, name) {
  var G__14585__14586 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(cljs.core.truth_(G__14585__14586)) {
    var n__14587 = cljs.core.first.call(null, G__14585__14586);
    var G__14585__14588 = G__14585__14586;
    while(true) {
      n__14587.removeAttribute(cljs.core.name.call(null, name));
      var temp__3974__auto____14589 = cljs.core.next.call(null, G__14585__14588);
      if(cljs.core.truth_(temp__3974__auto____14589)) {
        var G__14585__14590 = temp__3974__auto____14589;
        var G__14591 = cljs.core.first.call(null, G__14585__14590);
        var G__14592 = G__14585__14590;
        n__14587 = G__14591;
        G__14585__14588 = G__14592;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.parse_style_attributes = function parse_style_attributes(style) {
  return cljs.core.reduce.call(null, function(acc, pair) {
    var vec__14593__14594 = pair.split(/\s*:\s*/);
    var k__14595 = cljs.core.nth.call(null, vec__14593__14594, 0, null);
    var v__14596 = cljs.core.nth.call(null, vec__14593__14594, 1, null);
    if(cljs.core.truth_(function() {
      var and__3822__auto____14597 = k__14595;
      if(cljs.core.truth_(and__3822__auto____14597)) {
        return v__14596
      }else {
        return and__3822__auto____14597
      }
    }())) {
      return cljs.core.assoc.call(null, acc, cljs.core.keyword.call(null, k__14595.toLowerCase()), v__14596)
    }else {
      return acc
    }
  }, cljs.core.ObjMap.fromObject([], {}), style.split(/\s*;\s*/))
};
domina.styles = function styles(content) {
  var style__14599 = domina.attr.call(null, content, "style");
  if(cljs.core.string_QMARK_.call(null, style__14599)) {
    return domina.parse_style_attributes.call(null, style__14599)
  }else {
    if(cljs.core.truth_(style__14599.cssText)) {
      return domina.parse_style_attributes.call(null, style__14599.cssText)
    }else {
      return null
    }
  }
};
domina.attrs = function attrs(content) {
  var node__14600 = domina.single_node.call(null, content);
  var attrs__14601 = node__14600.attributes;
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.filter.call(null, cljs.core.complement.call(null, cljs.core.nil_QMARK_), cljs.core.map.call(null, function(p1__14598_SHARP_) {
    var attr__14602 = attrs__14601.item(p1__14598_SHARP_);
    var value__14603 = attr__14602.nodeValue;
    if(function() {
      var and__3822__auto____14604 = cljs.core.not_EQ_.call(null, null, value__14603);
      if(and__3822__auto____14604) {
        return cljs.core.not_EQ_.call(null, "", value__14603)
      }else {
        return and__3822__auto____14604
      }
    }()) {
      return cljs.core.PersistentArrayMap.fromArrays([cljs.core.keyword.call(null, attr__14602.nodeName.toLowerCase())], [attr__14602.nodeValue])
    }else {
      return null
    }
  }, cljs.core.range.call(null, attrs__14601.length))))
};
domina.set_styles_BANG_ = function set_styles_BANG_(content, styles) {
  var G__14605__14606 = cljs.core.seq.call(null, styles);
  if(cljs.core.truth_(G__14605__14606)) {
    var G__14608__14610 = cljs.core.first.call(null, G__14605__14606);
    var vec__14609__14611 = G__14608__14610;
    var name__14612 = cljs.core.nth.call(null, vec__14609__14611, 0, null);
    var value__14613 = cljs.core.nth.call(null, vec__14609__14611, 1, null);
    var G__14605__14614 = G__14605__14606;
    var G__14608__14615 = G__14608__14610;
    var G__14605__14616 = G__14605__14614;
    while(true) {
      var vec__14617__14618 = G__14608__14615;
      var name__14619 = cljs.core.nth.call(null, vec__14617__14618, 0, null);
      var value__14620 = cljs.core.nth.call(null, vec__14617__14618, 1, null);
      var G__14605__14621 = G__14605__14616;
      domina.set_style_BANG_.call(null, content, name__14619, value__14620);
      var temp__3974__auto____14622 = cljs.core.next.call(null, G__14605__14621);
      if(cljs.core.truth_(temp__3974__auto____14622)) {
        var G__14605__14623 = temp__3974__auto____14622;
        var G__14624 = cljs.core.first.call(null, G__14605__14623);
        var G__14625 = G__14605__14623;
        G__14608__14615 = G__14624;
        G__14605__14616 = G__14625;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.set_attrs_BANG_ = function set_attrs_BANG_(content, attrs) {
  var G__14626__14627 = cljs.core.seq.call(null, attrs);
  if(cljs.core.truth_(G__14626__14627)) {
    var G__14629__14631 = cljs.core.first.call(null, G__14626__14627);
    var vec__14630__14632 = G__14629__14631;
    var name__14633 = cljs.core.nth.call(null, vec__14630__14632, 0, null);
    var value__14634 = cljs.core.nth.call(null, vec__14630__14632, 1, null);
    var G__14626__14635 = G__14626__14627;
    var G__14629__14636 = G__14629__14631;
    var G__14626__14637 = G__14626__14635;
    while(true) {
      var vec__14638__14639 = G__14629__14636;
      var name__14640 = cljs.core.nth.call(null, vec__14638__14639, 0, null);
      var value__14641 = cljs.core.nth.call(null, vec__14638__14639, 1, null);
      var G__14626__14642 = G__14626__14637;
      domina.set_attr_BANG_.call(null, content, name__14640, value__14641);
      var temp__3974__auto____14643 = cljs.core.next.call(null, G__14626__14642);
      if(cljs.core.truth_(temp__3974__auto____14643)) {
        var G__14626__14644 = temp__3974__auto____14643;
        var G__14645 = cljs.core.first.call(null, G__14626__14644);
        var G__14646 = G__14626__14644;
        G__14629__14636 = G__14645;
        G__14626__14637 = G__14646;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.has_class_QMARK_ = function has_class_QMARK_(content, class$) {
  return goog.dom.classes.has.call(null, domina.single_node.call(null, content), class$)
};
domina.add_class_BANG_ = function add_class_BANG_(content, class$) {
  var G__14647__14648 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(cljs.core.truth_(G__14647__14648)) {
    var node__14649 = cljs.core.first.call(null, G__14647__14648);
    var G__14647__14650 = G__14647__14648;
    while(true) {
      goog.dom.classes.add.call(null, node__14649, class$);
      var temp__3974__auto____14651 = cljs.core.next.call(null, G__14647__14650);
      if(cljs.core.truth_(temp__3974__auto____14651)) {
        var G__14647__14652 = temp__3974__auto____14651;
        var G__14653 = cljs.core.first.call(null, G__14647__14652);
        var G__14654 = G__14647__14652;
        node__14649 = G__14653;
        G__14647__14650 = G__14654;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.remove_class_BANG_ = function remove_class_BANG_(content, class$) {
  var G__14655__14656 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(cljs.core.truth_(G__14655__14656)) {
    var node__14657 = cljs.core.first.call(null, G__14655__14656);
    var G__14655__14658 = G__14655__14656;
    while(true) {
      goog.dom.classes.remove.call(null, node__14657, class$);
      var temp__3974__auto____14659 = cljs.core.next.call(null, G__14655__14658);
      if(cljs.core.truth_(temp__3974__auto____14659)) {
        var G__14655__14660 = temp__3974__auto____14659;
        var G__14661 = cljs.core.first.call(null, G__14655__14660);
        var G__14662 = G__14655__14660;
        node__14657 = G__14661;
        G__14655__14658 = G__14662;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.classes = function classes(content) {
  return cljs.core.seq.call(null, goog.dom.classes.get.call(null, domina.single_node.call(null, content)))
};
domina.text = function() {
  var text = null;
  var text__1 = function(content) {
    return text.call(null, content, true)
  };
  var text__2 = function(content, normalize) {
    if(cljs.core.truth_(normalize)) {
      return goog.string.trim.call(null, goog.dom.getTextContent.call(null, domina.single_node.call(null, content)))
    }else {
      return goog.dom.getRawTextContent.call(null, domina.single_node.call(null, content))
    }
  };
  text = function(content, normalize) {
    switch(arguments.length) {
      case 1:
        return text__1.call(this, content);
      case 2:
        return text__2.call(this, content, normalize)
    }
    throw"Invalid arity: " + arguments.length;
  };
  text.cljs$lang$arity$1 = text__1;
  text.cljs$lang$arity$2 = text__2;
  return text
}();
domina.set_text_BANG_ = function set_text_BANG_(content, value) {
  var G__14663__14664 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(cljs.core.truth_(G__14663__14664)) {
    var node__14665 = cljs.core.first.call(null, G__14663__14664);
    var G__14663__14666 = G__14663__14664;
    while(true) {
      goog.dom.setTextContent.call(null, node__14665, value);
      var temp__3974__auto____14667 = cljs.core.next.call(null, G__14663__14666);
      if(cljs.core.truth_(temp__3974__auto____14667)) {
        var G__14663__14668 = temp__3974__auto____14667;
        var G__14669 = cljs.core.first.call(null, G__14663__14668);
        var G__14670 = G__14663__14668;
        node__14665 = G__14669;
        G__14663__14666 = G__14670;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.value = function value(content) {
  return goog.dom.forms.getValue.call(null, domina.single_node.call(null, content))
};
domina.set_value_BANG_ = function set_value_BANG_(content, value) {
  var G__14671__14672 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(cljs.core.truth_(G__14671__14672)) {
    var node__14673 = cljs.core.first.call(null, G__14671__14672);
    var G__14671__14674 = G__14671__14672;
    while(true) {
      goog.dom.forms.setValue.call(null, node__14673, value);
      var temp__3974__auto____14675 = cljs.core.next.call(null, G__14671__14674);
      if(cljs.core.truth_(temp__3974__auto____14675)) {
        var G__14671__14676 = temp__3974__auto____14675;
        var G__14677 = cljs.core.first.call(null, G__14671__14676);
        var G__14678 = G__14671__14676;
        node__14673 = G__14677;
        G__14671__14674 = G__14678;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.html = function html(content) {
  return domina.single_node.call(null, content).innerHTML
};
domina.replace_children_BANG_ = function replace_children_BANG_(content, inner_content) {
  return domina.append_BANG_.call(null, domina.destroy_children_BANG_.call(null, content), inner_content)
};
domina.set_inner_html_BANG_ = function set_inner_html_BANG_(content, html_string) {
  var allows_inner_html_QMARK___14679 = cljs.core.not.call(null, cljs.core.re_find.call(null, domina.re_no_inner_html, html_string));
  var leading_whitespace_QMARK___14680 = cljs.core.re_find.call(null, domina.re_leading_whitespace, html_string);
  var tag_name__14681 = [cljs.core.str(cljs.core.second.call(null, cljs.core.re_find.call(null, domina.re_tag_name, html_string)))].join("").toLowerCase();
  var special_tag_QMARK___14682 = cljs.core.contains_QMARK_.call(null, domina.wrap_map, tag_name__14681);
  if(cljs.core.truth_(function() {
    var and__3822__auto____14683 = allows_inner_html_QMARK___14679;
    if(cljs.core.truth_(and__3822__auto____14683)) {
      var and__3822__auto____14685 = function() {
        var or__3824__auto____14684 = domina.support.leading_whitespace_QMARK_;
        if(cljs.core.truth_(or__3824__auto____14684)) {
          return or__3824__auto____14684
        }else {
          return cljs.core.not.call(null, leading_whitespace_QMARK___14680)
        }
      }();
      if(cljs.core.truth_(and__3822__auto____14685)) {
        return cljs.core.not.call(null, special_tag_QMARK___14682)
      }else {
        return and__3822__auto____14685
      }
    }else {
      return and__3822__auto____14683
    }
  }())) {
    var value__14686 = clojure.string.replace.call(null, html_string, domina.re_xhtml_tag, "<$1></$2>");
    try {
      var G__14689__14690 = cljs.core.seq.call(null, domina.nodes.call(null, content));
      if(cljs.core.truth_(G__14689__14690)) {
        var node__14691 = cljs.core.first.call(null, G__14689__14690);
        var G__14689__14692 = G__14689__14690;
        while(true) {
          goog.events.removeAll.call(null, node__14691);
          node__14691.innerHTML = value__14686;
          var temp__3974__auto____14693 = cljs.core.next.call(null, G__14689__14692);
          if(cljs.core.truth_(temp__3974__auto____14693)) {
            var G__14689__14694 = temp__3974__auto____14693;
            var G__14695 = cljs.core.first.call(null, G__14689__14694);
            var G__14696 = G__14689__14694;
            node__14691 = G__14695;
            G__14689__14692 = G__14696;
            continue
          }else {
          }
          break
        }
      }else {
      }
    }catch(e14687) {
      if(cljs.core.instance_QMARK_.call(null, domina.Exception, e14687)) {
        var e__14688 = e14687;
        domina.replace_children_BANG_.call(null, content, value__14686)
      }else {
        if("\ufdd0'else") {
          throw e14687;
        }else {
        }
      }
    }
  }else {
    domina.replace_children_BANG_.call(null, content, html_string)
  }
  return content
};
domina.set_html_BANG_ = function set_html_BANG_(content, inner_content) {
  if(cljs.core.string_QMARK_.call(null, inner_content)) {
    return domina.set_inner_html_BANG_.call(null, content, inner_content)
  }else {
    return domina.replace_children_BANG_.call(null, content, inner_content)
  }
};
domina.get_data = function() {
  var get_data = null;
  var get_data__2 = function(node, key) {
    return get_data.call(null, node, key, false)
  };
  var get_data__3 = function(node, key, bubble) {
    var m__14697 = domina.single_node.call(null, node).__domina_data;
    var value__14698 = cljs.core.truth_(m__14697) ? cljs.core.get.call(null, m__14697, key) : null;
    if(cljs.core.truth_(function() {
      var and__3822__auto____14699 = bubble;
      if(cljs.core.truth_(and__3822__auto____14699)) {
        return value__14698 == null
      }else {
        return and__3822__auto____14699
      }
    }())) {
      var temp__3974__auto____14700 = domina.single_node.call(null, node).parentNode;
      if(cljs.core.truth_(temp__3974__auto____14700)) {
        var parent__14701 = temp__3974__auto____14700;
        return get_data.call(null, parent__14701, key, true)
      }else {
        return null
      }
    }else {
      return value__14698
    }
  };
  get_data = function(node, key, bubble) {
    switch(arguments.length) {
      case 2:
        return get_data__2.call(this, node, key);
      case 3:
        return get_data__3.call(this, node, key, bubble)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_data.cljs$lang$arity$2 = get_data__2;
  get_data.cljs$lang$arity$3 = get_data__3;
  return get_data
}();
domina.set_data_BANG_ = function set_data_BANG_(node, key, value) {
  var m__14705 = function() {
    var or__3824__auto____14704 = domina.single_node.call(null, node).__domina_data;
    if(cljs.core.truth_(or__3824__auto____14704)) {
      return or__3824__auto____14704
    }else {
      return cljs.core.ObjMap.fromObject([], {})
    }
  }();
  return domina.single_node.call(null, node).__domina_data = cljs.core.assoc.call(null, m__14705, key, value)
};
domina.apply_with_cloning = function apply_with_cloning(f, parent_content, child_content) {
  var parents__14706 = domina.nodes.call(null, parent_content);
  var children__14707 = domina.nodes.call(null, child_content);
  var first_child__14715 = function() {
    var frag__14708 = document.createDocumentFragment();
    var G__14709__14710 = cljs.core.seq.call(null, children__14707);
    if(cljs.core.truth_(G__14709__14710)) {
      var child__14711 = cljs.core.first.call(null, G__14709__14710);
      var G__14709__14712 = G__14709__14710;
      while(true) {
        frag__14708.appendChild(child__14711);
        var temp__3974__auto____14713 = cljs.core.next.call(null, G__14709__14712);
        if(cljs.core.truth_(temp__3974__auto____14713)) {
          var G__14709__14714 = temp__3974__auto____14713;
          var G__14717 = cljs.core.first.call(null, G__14709__14714);
          var G__14718 = G__14709__14714;
          child__14711 = G__14717;
          G__14709__14712 = G__14718;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return frag__14708
  }();
  var other_children__14716 = cljs.core.doall.call(null, cljs.core.repeatedly.call(null, cljs.core.count.call(null, parents__14706) - 1, function() {
    return first_child__14715.cloneNode(true)
  }));
  if(cljs.core.truth_(cljs.core.seq.call(null, parents__14706))) {
    f.call(null, cljs.core.first.call(null, parents__14706), first_child__14715);
    return cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__14702_SHARP_, p2__14703_SHARP_) {
      return f.call(null, p1__14702_SHARP_, p2__14703_SHARP_)
    }, cljs.core.rest.call(null, parents__14706), other_children__14716))
  }else {
    return null
  }
};
domina.lazy_nl_via_item = function() {
  var lazy_nl_via_item = null;
  var lazy_nl_via_item__1 = function(nl) {
    return lazy_nl_via_item.call(null, nl, 0)
  };
  var lazy_nl_via_item__2 = function(nl, n) {
    if(n < nl.length) {
      return new cljs.core.LazySeq(null, false, function() {
        return cljs.core.cons.call(null, nl.item(n), lazy_nl_via_item.call(null, nl, n + 1))
      })
    }else {
      return null
    }
  };
  lazy_nl_via_item = function(nl, n) {
    switch(arguments.length) {
      case 1:
        return lazy_nl_via_item__1.call(this, nl);
      case 2:
        return lazy_nl_via_item__2.call(this, nl, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  lazy_nl_via_item.cljs$lang$arity$1 = lazy_nl_via_item__1;
  lazy_nl_via_item.cljs$lang$arity$2 = lazy_nl_via_item__2;
  return lazy_nl_via_item
}();
domina.lazy_nl_via_array_ref = function() {
  var lazy_nl_via_array_ref = null;
  var lazy_nl_via_array_ref__1 = function(nl) {
    return lazy_nl_via_array_ref.call(null, nl, 0)
  };
  var lazy_nl_via_array_ref__2 = function(nl, n) {
    if(n < nl.length) {
      return new cljs.core.LazySeq(null, false, function() {
        return cljs.core.cons.call(null, nl[n], lazy_nl_via_array_ref.call(null, nl, n + 1))
      })
    }else {
      return null
    }
  };
  lazy_nl_via_array_ref = function(nl, n) {
    switch(arguments.length) {
      case 1:
        return lazy_nl_via_array_ref__1.call(this, nl);
      case 2:
        return lazy_nl_via_array_ref__2.call(this, nl, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  lazy_nl_via_array_ref.cljs$lang$arity$1 = lazy_nl_via_array_ref__1;
  lazy_nl_via_array_ref.cljs$lang$arity$2 = lazy_nl_via_array_ref__2;
  return lazy_nl_via_array_ref
}();
domina.lazy_nodelist = function lazy_nodelist(nl) {
  if(cljs.core.truth_(nl.item)) {
    return domina.lazy_nl_via_item.call(null, nl)
  }else {
    return domina.lazy_nl_via_array_ref.call(null, nl)
  }
};
domina.array_like_QMARK_ = function array_like_QMARK_(obj) {
  var and__3822__auto____14719 = obj;
  if(cljs.core.truth_(and__3822__auto____14719)) {
    var and__3822__auto____14720 = obj.length;
    if(cljs.core.truth_(and__3822__auto____14720)) {
      var or__3824__auto____14721 = obj.indexOf;
      if(cljs.core.truth_(or__3824__auto____14721)) {
        return or__3824__auto____14721
      }else {
        return obj.item
      }
    }else {
      return and__3822__auto____14720
    }
  }else {
    return and__3822__auto____14719
  }
};
domina.normalize_seq = function normalize_seq(list_thing) {
  if(list_thing == null) {
    return cljs.core.List.EMPTY
  }else {
    if(function() {
      var x__14314__auto____14722 = list_thing;
      if(cljs.core.truth_(function() {
        var and__3822__auto____14723 = x__14314__auto____14722;
        if(cljs.core.truth_(and__3822__auto____14723)) {
          var and__3822__auto____14724 = x__14314__auto____14722.cljs$core$ISeqable$;
          if(cljs.core.truth_(and__3822__auto____14724)) {
            var and__3822__auto____14725 = x__14314__auto____14722.hasOwnProperty;
            if(cljs.core.truth_(and__3822__auto____14725)) {
              return cljs.core.not.call(null, x__14314__auto____14722.hasOwnProperty("cljs$core$ISeqable$"))
            }else {
              return and__3822__auto____14725
            }
          }else {
            return and__3822__auto____14724
          }
        }else {
          return and__3822__auto____14723
        }
      }())) {
        return true
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, x__14314__auto____14722)
      }
    }()) {
      return cljs.core.seq.call(null, list_thing)
    }else {
      if(cljs.core.truth_(domina.array_like_QMARK_.call(null, list_thing))) {
        return domina.lazy_nodelist.call(null, list_thing)
      }else {
        if("\ufdd0'default") {
          return cljs.core.cons.call(null, list_thing)
        }else {
          return null
        }
      }
    }
  }
};
domina.DomContent["_"] = true;
domina.nodes["_"] = function(content) {
  if(content == null) {
    return cljs.core.List.EMPTY
  }else {
    if(function() {
      var x__14314__auto____14726 = content;
      if(cljs.core.truth_(function() {
        var and__3822__auto____14727 = x__14314__auto____14726;
        if(cljs.core.truth_(and__3822__auto____14727)) {
          var and__3822__auto____14728 = x__14314__auto____14726.cljs$core$ISeqable$;
          if(cljs.core.truth_(and__3822__auto____14728)) {
            var and__3822__auto____14729 = x__14314__auto____14726.hasOwnProperty;
            if(cljs.core.truth_(and__3822__auto____14729)) {
              return cljs.core.not.call(null, x__14314__auto____14726.hasOwnProperty("cljs$core$ISeqable$"))
            }else {
              return and__3822__auto____14729
            }
          }else {
            return and__3822__auto____14728
          }
        }else {
          return and__3822__auto____14727
        }
      }())) {
        return true
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, x__14314__auto____14726)
      }
    }()) {
      return cljs.core.seq.call(null, content)
    }else {
      if(cljs.core.truth_(domina.array_like_QMARK_.call(null, content))) {
        return domina.lazy_nodelist.call(null, content)
      }else {
        if("\ufdd0'default") {
          return cljs.core.cons.call(null, content)
        }else {
          return null
        }
      }
    }
  }
};
domina.single_node["_"] = function(content) {
  if(content == null) {
    return null
  }else {
    if(function() {
      var x__14314__auto____14730 = content;
      if(cljs.core.truth_(function() {
        var and__3822__auto____14731 = x__14314__auto____14730;
        if(cljs.core.truth_(and__3822__auto____14731)) {
          var and__3822__auto____14732 = x__14314__auto____14730.cljs$core$ISeqable$;
          if(cljs.core.truth_(and__3822__auto____14732)) {
            var and__3822__auto____14733 = x__14314__auto____14730.hasOwnProperty;
            if(cljs.core.truth_(and__3822__auto____14733)) {
              return cljs.core.not.call(null, x__14314__auto____14730.hasOwnProperty("cljs$core$ISeqable$"))
            }else {
              return and__3822__auto____14733
            }
          }else {
            return and__3822__auto____14732
          }
        }else {
          return and__3822__auto____14731
        }
      }())) {
        return true
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, x__14314__auto____14730)
      }
    }()) {
      return cljs.core.first.call(null, content)
    }else {
      if(cljs.core.truth_(domina.array_like_QMARK_.call(null, content))) {
        return content.item(0)
      }else {
        if("\ufdd0'default") {
          return content
        }else {
          return null
        }
      }
    }
  }
};
domina.DomContent["string"] = true;
domina.nodes["string"] = function(s) {
  return cljs.core.doall.call(null, domina.nodes.call(null, domina.string_to_dom.call(null, s)))
};
domina.single_node["string"] = function(s) {
  return domina.single_node.call(null, domina.string_to_dom.call(null, s))
};
if(cljs.core.truth_(typeof NodeList != "undefined")) {
  NodeList.prototype.cljs$core$ISeqable$ = true;
  NodeList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(nodelist) {
    return domina.lazy_nodelist.call(null, nodelist)
  };
  NodeList.prototype.cljs$core$IIndexed$ = true;
  NodeList.prototype.cljs$core$IIndexed$_nth$arity$2 = function(nodelist, n) {
    return nodelist.item(n)
  };
  NodeList.prototype.cljs$core$IIndexed$_nth$arity$3 = function(nodelist, n, not_found) {
    if(nodelist.length <= n) {
      return not_found
    }else {
      return cljs.core.nth.call(null, nodelist, n)
    }
  };
  NodeList.prototype.cljs$core$ICounted$ = true;
  NodeList.prototype.cljs$core$ICounted$_count$arity$1 = function(nodelist) {
    return nodelist.length
  }
}else {
}
if(cljs.core.truth_(typeof StaticNodeList != "undefined")) {
  StaticNodeList.prototype.cljs$core$ISeqable$ = true;
  StaticNodeList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(nodelist) {
    return domina.lazy_nodelist.call(null, nodelist)
  };
  StaticNodeList.prototype.cljs$core$IIndexed$ = true;
  StaticNodeList.prototype.cljs$core$IIndexed$_nth$arity$2 = function(nodelist, n) {
    return nodelist.item(n)
  };
  StaticNodeList.prototype.cljs$core$IIndexed$_nth$arity$3 = function(nodelist, n, not_found) {
    if(nodelist.length <= n) {
      return not_found
    }else {
      return cljs.core.nth.call(null, nodelist, n)
    }
  };
  StaticNodeList.prototype.cljs$core$ICounted$ = true;
  StaticNodeList.prototype.cljs$core$ICounted$_count$arity$1 = function(nodelist) {
    return nodelist.length
  }
}else {
}
if(cljs.core.truth_(typeof HTMLCollection != "undefined")) {
  HTMLCollection.prototype.cljs$core$ISeqable$ = true;
  HTMLCollection.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
    return domina.lazy_nodelist.call(null, coll)
  };
  HTMLCollection.prototype.cljs$core$IIndexed$ = true;
  HTMLCollection.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
    return coll.item(n)
  };
  HTMLCollection.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
    if(coll.length <= n) {
      return not_found
    }else {
      return cljs.core.nth.call(null, coll, n)
    }
  };
  HTMLCollection.prototype.cljs$core$ICounted$ = true;
  HTMLCollection.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
    return coll.length
  }
}else {
}
;goog.provide("domina.events");
goog.require("cljs.core");
goog.require("domina");
goog.require("goog.object");
goog.require("goog.events");
void 0;
domina.events.Event = {};
domina.events.prevent_default = function prevent_default(evt) {
  if(function() {
    var and__3822__auto____34454 = evt;
    if(and__3822__auto____34454) {
      return evt.domina$events$Event$prevent_default$arity$1
    }else {
      return and__3822__auto____34454
    }
  }()) {
    return evt.domina$events$Event$prevent_default$arity$1(evt)
  }else {
    return function() {
      var or__3824__auto____34455 = domina.events.prevent_default[goog.typeOf.call(null, evt)];
      if(or__3824__auto____34455) {
        return or__3824__auto____34455
      }else {
        var or__3824__auto____34456 = domina.events.prevent_default["_"];
        if(or__3824__auto____34456) {
          return or__3824__auto____34456
        }else {
          throw cljs.core.missing_protocol.call(null, "Event.prevent-default", evt);
        }
      }
    }().call(null, evt)
  }
};
domina.events.stop_propagation = function stop_propagation(evt) {
  if(function() {
    var and__3822__auto____34457 = evt;
    if(and__3822__auto____34457) {
      return evt.domina$events$Event$stop_propagation$arity$1
    }else {
      return and__3822__auto____34457
    }
  }()) {
    return evt.domina$events$Event$stop_propagation$arity$1(evt)
  }else {
    return function() {
      var or__3824__auto____34458 = domina.events.stop_propagation[goog.typeOf.call(null, evt)];
      if(or__3824__auto____34458) {
        return or__3824__auto____34458
      }else {
        var or__3824__auto____34459 = domina.events.stop_propagation["_"];
        if(or__3824__auto____34459) {
          return or__3824__auto____34459
        }else {
          throw cljs.core.missing_protocol.call(null, "Event.stop-propagation", evt);
        }
      }
    }().call(null, evt)
  }
};
domina.events.target = function target(evt) {
  if(function() {
    var and__3822__auto____34460 = evt;
    if(and__3822__auto____34460) {
      return evt.domina$events$Event$target$arity$1
    }else {
      return and__3822__auto____34460
    }
  }()) {
    return evt.domina$events$Event$target$arity$1(evt)
  }else {
    return function() {
      var or__3824__auto____34461 = domina.events.target[goog.typeOf.call(null, evt)];
      if(or__3824__auto____34461) {
        return or__3824__auto____34461
      }else {
        var or__3824__auto____34462 = domina.events.target["_"];
        if(or__3824__auto____34462) {
          return or__3824__auto____34462
        }else {
          throw cljs.core.missing_protocol.call(null, "Event.target", evt);
        }
      }
    }().call(null, evt)
  }
};
domina.events.current_target = function current_target(evt) {
  if(function() {
    var and__3822__auto____34463 = evt;
    if(and__3822__auto____34463) {
      return evt.domina$events$Event$current_target$arity$1
    }else {
      return and__3822__auto____34463
    }
  }()) {
    return evt.domina$events$Event$current_target$arity$1(evt)
  }else {
    return function() {
      var or__3824__auto____34464 = domina.events.current_target[goog.typeOf.call(null, evt)];
      if(or__3824__auto____34464) {
        return or__3824__auto____34464
      }else {
        var or__3824__auto____34465 = domina.events.current_target["_"];
        if(or__3824__auto____34465) {
          return or__3824__auto____34465
        }else {
          throw cljs.core.missing_protocol.call(null, "Event.current-target", evt);
        }
      }
    }().call(null, evt)
  }
};
domina.events.event_type = function event_type(evt) {
  if(function() {
    var and__3822__auto____34466 = evt;
    if(and__3822__auto____34466) {
      return evt.domina$events$Event$event_type$arity$1
    }else {
      return and__3822__auto____34466
    }
  }()) {
    return evt.domina$events$Event$event_type$arity$1(evt)
  }else {
    return function() {
      var or__3824__auto____34467 = domina.events.event_type[goog.typeOf.call(null, evt)];
      if(or__3824__auto____34467) {
        return or__3824__auto____34467
      }else {
        var or__3824__auto____34468 = domina.events.event_type["_"];
        if(or__3824__auto____34468) {
          return or__3824__auto____34468
        }else {
          throw cljs.core.missing_protocol.call(null, "Event.event-type", evt);
        }
      }
    }().call(null, evt)
  }
};
domina.events.raw_event = function raw_event(evt) {
  if(function() {
    var and__3822__auto____34469 = evt;
    if(and__3822__auto____34469) {
      return evt.domina$events$Event$raw_event$arity$1
    }else {
      return and__3822__auto____34469
    }
  }()) {
    return evt.domina$events$Event$raw_event$arity$1(evt)
  }else {
    return function() {
      var or__3824__auto____34470 = domina.events.raw_event[goog.typeOf.call(null, evt)];
      if(or__3824__auto____34470) {
        return or__3824__auto____34470
      }else {
        var or__3824__auto____34471 = domina.events.raw_event["_"];
        if(or__3824__auto____34471) {
          return or__3824__auto____34471
        }else {
          throw cljs.core.missing_protocol.call(null, "Event.raw-event", evt);
        }
      }
    }().call(null, evt)
  }
};
void 0;
domina.events.builtin_events = cljs.core.set.call(null, cljs.core.map.call(null, cljs.core.keyword, goog.object.getValues.call(null, goog.events.EventType)));
domina.events.root_element = window.document.documentElement;
domina.events.find_builtin_type = function find_builtin_type(evt_type) {
  if(cljs.core.contains_QMARK_.call(null, domina.events.builtin_events, evt_type)) {
    return cljs.core.name.call(null, evt_type)
  }else {
    return evt_type
  }
};
domina.events.create_listener_function = function create_listener_function(f) {
  return function(evt) {
    f.call(null, function() {
      if(void 0 === domina.events.t34472) {
        domina.events.t34472 = function(evt, f, create_listener_function, __meta__389__auto__) {
          this.evt = evt;
          this.f = f;
          this.create_listener_function = create_listener_function;
          this.__meta__389__auto__ = __meta__389__auto__;
          this.cljs$lang$protocol_mask$partition1$ = 0;
          this.cljs$lang$protocol_mask$partition0$ = 196736
        };
        domina.events.t34472.cljs$lang$type = true;
        domina.events.t34472.cljs$lang$ctorPrSeq = function(this__454__auto__) {
          return cljs.core.list.call(null, "domina.events.t34472")
        };
        domina.events.t34472.prototype.cljs$core$ILookup$ = true;
        domina.events.t34472.prototype.cljs$core$ILookup$_lookup$arity$2 = function(o, k) {
          var this__34473 = this;
          var temp__3971__auto____34474 = this__34473.evt[k];
          if(cljs.core.truth_(temp__3971__auto____34474)) {
            var val__34475 = temp__3971__auto____34474;
            return val__34475
          }else {
            return this__34473.evt[cljs.core.name.call(null, k)]
          }
        };
        domina.events.t34472.prototype.cljs$core$ILookup$_lookup$arity$3 = function(o, k, not_found) {
          var this__34476 = this;
          var or__3824__auto____34477 = cljs.core._lookup.call(null, o, k);
          if(cljs.core.truth_(or__3824__auto____34477)) {
            return or__3824__auto____34477
          }else {
            return not_found
          }
        };
        domina.events.t34472.prototype.domina$events$Event$ = true;
        domina.events.t34472.prototype.domina$events$Event$prevent_default$arity$1 = function(_) {
          var this__34478 = this;
          return this__34478.evt.preventDefault()
        };
        domina.events.t34472.prototype.domina$events$Event$stop_propagation$arity$1 = function(_) {
          var this__34479 = this;
          return this__34479.evt.stopPropagation()
        };
        domina.events.t34472.prototype.domina$events$Event$target$arity$1 = function(_) {
          var this__34480 = this;
          return this__34480.evt.target
        };
        domina.events.t34472.prototype.domina$events$Event$current_target$arity$1 = function(_) {
          var this__34481 = this;
          return this__34481.evt.currentTarget
        };
        domina.events.t34472.prototype.domina$events$Event$event_type$arity$1 = function(_) {
          var this__34482 = this;
          return this__34482.evt.type
        };
        domina.events.t34472.prototype.domina$events$Event$raw_event$arity$1 = function(_) {
          var this__34483 = this;
          return this__34483.evt
        };
        domina.events.t34472.prototype.cljs$core$IMeta$ = true;
        domina.events.t34472.prototype.cljs$core$IMeta$_meta$arity$1 = function(___390__auto__) {
          var this__34484 = this;
          return this__34484.__meta__389__auto__
        };
        domina.events.t34472.prototype.cljs$core$IWithMeta$ = true;
        domina.events.t34472.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___390__auto__, __meta__389__auto__) {
          var this__34485 = this;
          return new domina.events.t34472(this__34485.evt, this__34485.f, this__34485.create_listener_function, __meta__389__auto__)
        };
        domina.events.t34472
      }else {
      }
      return new domina.events.t34472(evt, f, create_listener_function, null)
    }());
    return true
  }
};
domina.events.listen_internal_BANG_ = function listen_internal_BANG_(content, type, listener, capture, once) {
  var f__34486 = domina.events.create_listener_function.call(null, listener);
  var t__34487 = domina.events.find_builtin_type.call(null, type);
  return cljs.core.doall.call(null, function() {
    var iter__625__auto____34492 = function iter__34488(s__34489) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__34489__34490 = s__34489;
        while(true) {
          if(cljs.core.truth_(cljs.core.seq.call(null, s__34489__34490))) {
            var node__34491 = cljs.core.first.call(null, s__34489__34490);
            return cljs.core.cons.call(null, cljs.core.truth_(once) ? goog.events.listenOnce.call(null, node__34491, t__34487, f__34486, capture) : goog.events.listen.call(null, node__34491, t__34487, f__34486, capture), iter__34488.call(null, cljs.core.rest.call(null, s__34489__34490)))
          }else {
            return null
          }
          break
        }
      })
    };
    return iter__625__auto____34492.call(null, domina.nodes.call(null, content))
  }())
};
domina.events.listen_BANG_ = function() {
  var listen_BANG_ = null;
  var listen_BANG___2 = function(type, listener) {
    return listen_BANG_.call(null, domina.events.root_element, type, listener)
  };
  var listen_BANG___3 = function(content, type, listener) {
    return domina.events.listen_internal_BANG_.call(null, content, type, listener, false, false)
  };
  listen_BANG_ = function(content, type, listener) {
    switch(arguments.length) {
      case 2:
        return listen_BANG___2.call(this, content, type);
      case 3:
        return listen_BANG___3.call(this, content, type, listener)
    }
    throw"Invalid arity: " + arguments.length;
  };
  listen_BANG_.cljs$lang$arity$2 = listen_BANG___2;
  listen_BANG_.cljs$lang$arity$3 = listen_BANG___3;
  return listen_BANG_
}();
domina.events.capture_BANG_ = function() {
  var capture_BANG_ = null;
  var capture_BANG___2 = function(type, listener) {
    return capture_BANG_.call(null, domina.events.root_element, type, listener)
  };
  var capture_BANG___3 = function(content, type, listener) {
    return domina.events.listen_internal_BANG_.call(null, content, type, listener, true, false)
  };
  capture_BANG_ = function(content, type, listener) {
    switch(arguments.length) {
      case 2:
        return capture_BANG___2.call(this, content, type);
      case 3:
        return capture_BANG___3.call(this, content, type, listener)
    }
    throw"Invalid arity: " + arguments.length;
  };
  capture_BANG_.cljs$lang$arity$2 = capture_BANG___2;
  capture_BANG_.cljs$lang$arity$3 = capture_BANG___3;
  return capture_BANG_
}();
domina.events.listen_once_BANG_ = function() {
  var listen_once_BANG_ = null;
  var listen_once_BANG___2 = function(type, listener) {
    return listen_once_BANG_.call(null, domina.events.root_element, type, listener)
  };
  var listen_once_BANG___3 = function(content, type, listener) {
    return domina.events.listen_internal_BANG_.call(null, content, type, listener, false, true)
  };
  listen_once_BANG_ = function(content, type, listener) {
    switch(arguments.length) {
      case 2:
        return listen_once_BANG___2.call(this, content, type);
      case 3:
        return listen_once_BANG___3.call(this, content, type, listener)
    }
    throw"Invalid arity: " + arguments.length;
  };
  listen_once_BANG_.cljs$lang$arity$2 = listen_once_BANG___2;
  listen_once_BANG_.cljs$lang$arity$3 = listen_once_BANG___3;
  return listen_once_BANG_
}();
domina.events.capture_once_BANG_ = function() {
  var capture_once_BANG_ = null;
  var capture_once_BANG___2 = function(type, listener) {
    return capture_once_BANG_.call(null, domina.events.root_element, type, listener)
  };
  var capture_once_BANG___3 = function(content, type, listener) {
    return domina.events.listen_internal_BANG_.call(null, content, type, listener, true, true)
  };
  capture_once_BANG_ = function(content, type, listener) {
    switch(arguments.length) {
      case 2:
        return capture_once_BANG___2.call(this, content, type);
      case 3:
        return capture_once_BANG___3.call(this, content, type, listener)
    }
    throw"Invalid arity: " + arguments.length;
  };
  capture_once_BANG_.cljs$lang$arity$2 = capture_once_BANG___2;
  capture_once_BANG_.cljs$lang$arity$3 = capture_once_BANG___3;
  return capture_once_BANG_
}();
domina.events.unlisten_BANG_ = function() {
  var unlisten_BANG_ = null;
  var unlisten_BANG___0 = function() {
    return unlisten_BANG_.call(null, domina.events.root_element)
  };
  var unlisten_BANG___1 = function(content) {
    var G__34493__34494 = cljs.core.seq.call(null, domina.nodes.call(null, content));
    if(cljs.core.truth_(G__34493__34494)) {
      var node__34495 = cljs.core.first.call(null, G__34493__34494);
      var G__34493__34496 = G__34493__34494;
      while(true) {
        goog.events.removeAll.call(null, node__34495);
        var temp__3974__auto____34497 = cljs.core.next.call(null, G__34493__34496);
        if(cljs.core.truth_(temp__3974__auto____34497)) {
          var G__34493__34498 = temp__3974__auto____34497;
          var G__34500 = cljs.core.first.call(null, G__34493__34498);
          var G__34501 = G__34493__34498;
          node__34495 = G__34500;
          G__34493__34496 = G__34501;
          continue
        }else {
          return null
        }
        break
      }
    }else {
      return null
    }
  };
  var unlisten_BANG___2 = function(content, type) {
    var type__34499 = domina.events.find_builtin_type.call(null, type);
    return goog.events.removeAll.call(null, domina.events.node, type__34499)
  };
  unlisten_BANG_ = function(content, type) {
    switch(arguments.length) {
      case 0:
        return unlisten_BANG___0.call(this);
      case 1:
        return unlisten_BANG___1.call(this, content);
      case 2:
        return unlisten_BANG___2.call(this, content, type)
    }
    throw"Invalid arity: " + arguments.length;
  };
  unlisten_BANG_.cljs$lang$arity$0 = unlisten_BANG___0;
  unlisten_BANG_.cljs$lang$arity$1 = unlisten_BANG___1;
  unlisten_BANG_.cljs$lang$arity$2 = unlisten_BANG___2;
  return unlisten_BANG_
}();
domina.events.ancestor_nodes = function() {
  var ancestor_nodes = null;
  var ancestor_nodes__1 = function(n) {
    return ancestor_nodes.call(null, n, cljs.core.cons.call(null, n))
  };
  var ancestor_nodes__2 = function(n, so_far) {
    while(true) {
      var temp__3971__auto____34502 = n.parentNode;
      if(cljs.core.truth_(temp__3971__auto____34502)) {
        var parent__34503 = temp__3971__auto____34502;
        var G__34504 = parent__34503;
        var G__34505 = cljs.core.cons.call(null, parent__34503, so_far);
        n = G__34504;
        so_far = G__34505;
        continue
      }else {
        return so_far
      }
      break
    }
  };
  ancestor_nodes = function(n, so_far) {
    switch(arguments.length) {
      case 1:
        return ancestor_nodes__1.call(this, n);
      case 2:
        return ancestor_nodes__2.call(this, n, so_far)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestor_nodes.cljs$lang$arity$1 = ancestor_nodes__1;
  ancestor_nodes.cljs$lang$arity$2 = ancestor_nodes__2;
  return ancestor_nodes
}();
domina.events.dispatch_browser_BANG_ = function dispatch_browser_BANG_(source, evt) {
  var ancestors__34506 = domina.events.ancestor_nodes.call(null, domina.single_node.call(null, source));
  var G__34507__34508 = cljs.core.seq.call(null, ancestors__34506);
  if(cljs.core.truth_(G__34507__34508)) {
    var n__34509 = cljs.core.first.call(null, G__34507__34508);
    var G__34507__34510 = G__34507__34508;
    while(true) {
      if(cljs.core.truth_(n__34509.propagationStopped)) {
      }else {
        evt.currentTarget = n__34509;
        goog.events.fireListeners.call(null, n__34509, evt.type, true, evt)
      }
      var temp__3974__auto____34511 = cljs.core.next.call(null, G__34507__34510);
      if(cljs.core.truth_(temp__3974__auto____34511)) {
        var G__34507__34512 = temp__3974__auto____34511;
        var G__34519 = cljs.core.first.call(null, G__34507__34512);
        var G__34520 = G__34507__34512;
        n__34509 = G__34519;
        G__34507__34510 = G__34520;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__34513__34514 = cljs.core.seq.call(null, cljs.core.reverse.call(null, ancestors__34506));
  if(cljs.core.truth_(G__34513__34514)) {
    var n__34515 = cljs.core.first.call(null, G__34513__34514);
    var G__34513__34516 = G__34513__34514;
    while(true) {
      if(cljs.core.truth_(n__34515.propagationStopped)) {
      }else {
        evt.currentTarget = n__34515;
        goog.events.fireListeners.call(null, n__34515, evt.type, false, evt)
      }
      var temp__3974__auto____34517 = cljs.core.next.call(null, G__34513__34516);
      if(cljs.core.truth_(temp__3974__auto____34517)) {
        var G__34513__34518 = temp__3974__auto____34517;
        var G__34521 = cljs.core.first.call(null, G__34513__34518);
        var G__34522 = G__34513__34518;
        n__34515 = G__34521;
        G__34513__34516 = G__34522;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return evt.returnValue_
};
domina.events.dispatch_event_target_BANG_ = function dispatch_event_target_BANG_(source, evt) {
  return goog.events.dispatchEvent.call(null, source, evt)
};
domina.events.is_event_target_QMARK_ = function is_event_target_QMARK_(o) {
  var and__3822__auto____34523 = o.getParentEventTarget;
  if(cljs.core.truth_(and__3822__auto____34523)) {
    return o.dispatchEvent
  }else {
    return and__3822__auto____34523
  }
};
domina.events.dispatch_BANG_ = function() {
  var dispatch_BANG_ = null;
  var dispatch_BANG___2 = function(type, evt_map) {
    return dispatch_BANG_.call(null, domina.events.root_element, type, evt_map)
  };
  var dispatch_BANG___3 = function(source, type, evt_map) {
    var evt__34524 = new goog.events.Event(domina.events.find_builtin_type.call(null, type));
    var G__34525__34526 = cljs.core.seq.call(null, evt_map);
    if(cljs.core.truth_(G__34525__34526)) {
      var G__34528__34530 = cljs.core.first.call(null, G__34525__34526);
      var vec__34529__34531 = G__34528__34530;
      var k__34532 = cljs.core.nth.call(null, vec__34529__34531, 0, null);
      var v__34533 = cljs.core.nth.call(null, vec__34529__34531, 1, null);
      var G__34525__34534 = G__34525__34526;
      var G__34528__34535 = G__34528__34530;
      var G__34525__34536 = G__34525__34534;
      while(true) {
        var vec__34537__34538 = G__34528__34535;
        var k__34539 = cljs.core.nth.call(null, vec__34537__34538, 0, null);
        var v__34540 = cljs.core.nth.call(null, vec__34537__34538, 1, null);
        var G__34525__34541 = G__34525__34536;
        evt__34524[k__34539] = v__34540;
        var temp__3974__auto____34542 = cljs.core.next.call(null, G__34525__34541);
        if(cljs.core.truth_(temp__3974__auto____34542)) {
          var G__34525__34543 = temp__3974__auto____34542;
          var G__34544 = cljs.core.first.call(null, G__34525__34543);
          var G__34545 = G__34525__34543;
          G__34528__34535 = G__34544;
          G__34525__34536 = G__34545;
          continue
        }else {
        }
        break
      }
    }else {
    }
    if(cljs.core.truth_(domina.events.is_event_target_QMARK_.call(null, source))) {
      return domina.events.dispatch_event_target_BANG_.call(null, source, evt__34524)
    }else {
      return domina.events.dispatch_browser_BANG_.call(null, source, evt__34524)
    }
  };
  dispatch_BANG_ = function(source, type, evt_map) {
    switch(arguments.length) {
      case 2:
        return dispatch_BANG___2.call(this, source, type);
      case 3:
        return dispatch_BANG___3.call(this, source, type, evt_map)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dispatch_BANG_.cljs$lang$arity$2 = dispatch_BANG___2;
  dispatch_BANG_.cljs$lang$arity$3 = dispatch_BANG___3;
  return dispatch_BANG_
}();
domina.events.unlisten_by_key_BANG_ = function unlisten_by_key_BANG_(key) {
  return goog.events.unlistenByKey.call(null, key)
};
domina.events.get_listeners = function get_listeners(content, type) {
  var type__34547 = domina.events.find_builtin_type.call(null, type);
  return cljs.core.mapcat.call(null, function(p1__34546_SHARP_) {
    return goog.events.getListeners.call(null, p1__34546_SHARP_, type__34547, false)
  }, domina.nodes.call(null, content))
};
goog.provide("jenq");
goog.require("cljs.core");
goog.require("domina.events");
goog.require("domina");
jenq.log = function log(msg) {
  return console.log(msg)
};
jenq.encode = window["encodeURIComponent"];
jenq.decode = window["decodeURIComponent"];
jenq.add_listeners = function add_listeners() {
  return domina.events.listen_BANG_.call(null, domina.by_id.call(null, "load-jenk"), "\ufdd0'click", jenq.load_jenkins_cb)
};
jenq.parse_hash = function parse_hash() {
  var hash__129345 = cljs.core.subs.call(null, window.location.hash.toString(cljs.core.List.EMPTY), 1);
  var parts__129346 = cljs.core.next.call(null, hash__129345.split("/"));
  return cljs.core.zipmap.call(null, cljs.core.PersistentVector.fromArray(["\ufdd0'url"]), cljs.core.map.call(null, jenq.decode, parts__129346))
};
jenq.set_hash_BANG_ = function set_hash_BANG_(jenkins_url) {
  var hash__129347 = [cljs.core.str("#LEEROY!/"), cljs.core.str(jenq.encode.call(null, jenkins_url))].join("");
  return window.location.hash = hash__129347
};
jenq.show_jenkins_finder = function show_jenkins_finder() {
  return domina.remove_class_BANG_.call(null, domina.by_id.call(null, "jenkins-finder"), "invisible")
};
jenq.hide_jenkins_finder = function hide_jenkins_finder() {
  return domina.add_class_BANG_.call(null, domina.by_id.call(null, "jenkins-finder"), "invisible")
};
jenq.load_jenkins_cb = function load_jenkins_cb() {
  var url__129348 = domina.value.call(null, domina.by_id.call(null, "jenkins-url"));
  jenq.set_hash_BANG_.call(null, url__129348);
  jenq.hide_jenkins_finder.call(null);
  return jenq.load_jenkins_jobs.call(null, url__129348)
};
jenq.load_jenkins_jobs = function load_jenkins_jobs(baseurl) {
  return jenq.log.call(null, [cljs.core.str("Loading from "), cljs.core.str(baseurl)].join(""))
};
jenq.start_jenq = function start_jenq() {
  jenq.log.call(null, "Hello from the jenq");
  jenq.add_listeners.call(null);
  if(cljs.core.truth_("\ufdd0'url".call(null, jenq.parse_hash.call(null)))) {
    return jenq.load_jenkins_jobs.call(null, "\ufdd0'url".call(null, jenq.parse_hash.call(null)))
  }else {
    return jenq.show_jenkins_finder.call(null)
  }
};
jenq.start_jenq.call(null);
