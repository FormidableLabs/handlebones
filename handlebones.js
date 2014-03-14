// Handlebones 0.0.1
// 
// (c) 2014 Formidable Labs Inc.
// Handlebones may be freely distributed under the MIT license.
// For all details and documentation:
// http://handlebonesjs.org
// 
// Handlebones is a minimalist version of Thorax:
// http://thoraxjs.org/
// Original copyright notice follows.
// 
// ### 
//
// Copyright (c) 2011-2013 @WalmartLabs
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

(function (root, factory) {

  // Set up Handlebones appropriately for the environment. Start with AMD.
  if (typeof define === "function" && define.amd) {
    define([
      "underscore",
      "backbone",
      "handlebars",
      "jquery",
      "exports"
    ], function (_, Backbone, Handlebars, $, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Backbone.
      root.Handlebones = factory(root, exports, _, Backbone, Handlebars, $);
    });
  // Next for Node.js or CommonJS. jQuery may not be needed as a module.
  /* global exports */
  } else if (typeof exports !== "undefined") {
    var _ = require("underscore"),
      Backbone = require("backbone"),
      Handlebars = require("handlebars");
    factory(root, exports, _, Backbone, Handlebars);
  // Finally, as a browser global.
  } else {
    root.Handlebones = factory(
      root,
      {},
      root._,
      root.Backbone,
      root.Handlebars,
      (root.jQuery || root.Zepto || root.ender || root.$)
    );
  }

})(this, function (root, Handlebones, _, Backbone, Handlebars, $) {

  Handlebones.VERSION = "0.0.1";

  var viewNameAttributeName = "data-view-name",
    viewCidAttributeName = "data-view-cid",
    linkAttributeName = "data-history-link",
    viewPlaceholderAttributeName = "data-view-tmp",
    modelCidAttributeName = "data-model-cid",
    viewsIndexedByCid = {},
    isIE11 = !!navigator.userAgent.match(/Trident\/7\./),
    isIE = isIE11 || (/msie [\w.]+/).exec(navigator.userAgent.toLowerCase()),
    hasDOMLib = typeof $ !== "undefined" && $.fn;


  // DOM 
  var ElementProto = typeof Element !== "undefined" && Element.prototype;

  var elementAddEventListener = ElementProto.addEventListener || function (eventName, listener) {
    return this.attachEvent(eventName, listener);
  };

  function hasClassName(name) {
    return new RegExp("(?:^|\\s+)" + name + "(?:\\s+|$)").test(this.className);
  }

  function addClassName(name) {
    if (!hasClassName.call(this, name)) {
      this.className = this.className ? [this.className, name].join(" ") : name;
    }
  }

  function removeClassName(name) {
    if (hasClassName.call(this, name)) {
      var className = this.className,
        regexp = new RegExp("(?:^|\\s+)" + name + "(?:\\s+|$)", "g");
      this.className = className.replace(regexp, "");
    }
  }

  // View

  function triggerReadyOnChild(child) {
    if (!child._isReady) {
      child.trigger("ready");
    }
  }

  function onReady() {
    if (!this._isReady) {
      this._isReady = true;
      _.each(this.children, triggerReadyOnChild);
      this.listenTo(this, "addChild", triggerReadyOnChild);
    }
  }

  function configureView() {
    this._renderCount = 0;
    this.children = {};
    viewsIndexedByCid[this.cid] = this;
    this.listenTo(this, "ready", onReady);
  }

  function ensureRendered() {
    if (!this._renderCount) {
      this.render();
    }
  }

  function replaceHTML(html) {
    // Normalize Handlebars.SafeString
    if (html && html.string) {
      html = html.string;
    }
    if (hasDOMLib) {
      // We want to pull our elements out of the tree if we are under jQuery
      // or IE as both have the tendancy to mangle the elements we want to reuse
      // on cleanup. This could leak event binds if users are performing custom binds
      // but this generally not recommended.
      if (this._renderCount && (isIE || ($.fn && $.fn.jquery))) {
        while (this.el.hasChildNodes()) {
          this.el.removeChild(this.el.childNodes[0]);
        }
      }
      this.$el.empty();
      this.$el.append(html);
    } else {
      this.el.innerHTML = html;
    }
  }

  Handlebones.View = Backbone.View.extend({
    template: Handlebars.VM.noop,
    render: function (html) {
      var output;
      if (_.isFunction(html)) {
        output = html(this.context());
      } else if (_.isString(html)) {
        output = html;
      } else {
        output = this.template(this.context());
      }
      replaceHTML.call(this, output);
      appendChildViews.call(this);
      ++this._renderCount;
      this.trigger("render");
      return this;
    },
    context: function () {
      return this;
    },
    appendTo: function (el) {
      ensureRendered.call(this);
      // allow for a custom dom insertion operation
      if (_.isFunction(el)) {
        el();
      } else {
        if (hasDOMLib) {
          this.$el.appendTo(el);
        } else {
          el.appendChild(this.el);
        }
      }
      this.trigger("ready", {
        target: this
      });
      return this;
    },
    addChild: function (view) {
      if (this.children[view.cid]) {
        return view;
      }
      view.parent = this;
      this.children[view.cid] = view;
      this.trigger("addChild", view);
      return view;
    },
    removeChild: function (view) {
      delete view.parent;
      delete this.children[view.cid];
      this.trigger("removeChild", view);
      return view;
    },
    remove: function () {
      delete viewsIndexedByCid[this.cid];
      if (this.name) {
        this.el.removeAttribute(viewNameAttributeName);
      }
      this.el.removeAttribute(viewCidAttributeName);
      var response = Backbone.View.prototype.remove.apply(this, arguments);
      this.trigger("remove");
      return response;
    },
    // Private and undocumented methods
    toString: function () {
      return "[object Handlebones.View." + (this.name || this.cid) + "]";
    },
    setElement : function () {
      var response = Backbone.View.prototype.setElement.apply(this, arguments);
      if (this.name) {
        this.el.setAttribute(viewNameAttributeName, this.name);
      }
      this.el.setAttribute(viewCidAttributeName, this.cid);
      return response;
    },
    // So developers don't need to call parent initialize, use _ensureElement
    // hook to configure the view
    _ensureElement: function () {
      configureView.call(this);
      return Backbone.View.prototype._ensureElement.call(this);
    }
  });

  // LayoutView
  Handlebones.LayoutView = Handlebones.View.extend({
    render: function () {
      // Basically a noop
      ++this._renderCount;
      this.trigger("render");
      return this;
    },
    setView: function (view, callback) {
      var oldView = this._view,
        append,
        remove;
      if (view === oldView) {
        return this;
      }
      remove = _.bind(function () {
        if (oldView) {
          oldView.remove();
          this.removeChild(oldView);
        }
      }, this);
      append = _.bind(function () {
        this._view = view;
        if (view) {
          ensureRendered.call(view);
          this.addChild(view);
          this._view.appendTo(this.el);
        }
      }, this);
      if (!callback) {
        remove();
        append();
      } else {
        callback(view, oldView, append, remove);
      }
      return this;
    },
    getView: function () {
      return this._view;
    }
  });

  // CollectionView

  function handleChangeFromEmptyToNotEmpty() {
    this.emptyClassName && removeClassName.call(this.el, this.emptyClassName);
    if (this._emptyViewInstance) {
      this._emptyViewInstance.remove();
      this.removeChild(this._emptyViewInstance);
    }
    replaceHTML.call(this, "");
  }
  
  function handleChangeFromNotEmptyToEmpty() {
    this.emptyClassName && addClassName.call(this.el, this.emptyClassName);
    replaceHTML.call(this, "");
    if (this.emptyView) {
      this._emptyViewInstance = new this.emptyView();
      this.addChild(this._emptyViewInstance);
      this._emptyViewInstance.appendTo(this.el);
    }
  }

  function applyVisibilityFilter() {
    if (this.modelFilter) {
      this.collection.forEach(applyModelVisiblityFilter, this);
    }
  }
  
  function applyModelVisiblityFilter(model) {
    if (this.modelFilter) {
      var selector = "[" + modelCidAttributeName + "=\"" + model.cid + "\"]",
        els = this.el.querySelectorAll(selector);
      _.each(els, function (el) {
        if (modelShouldBeVisible.call(this, model)) {
          el.style.display = "block";
        } else {
          el.style.display = "none";
        }
      });
    }
  }
  
  function modelShouldBeVisible(model) {
    return this.modelFilter(model, this.collection.indexOf(model));
  }

  Handlebones.ModelView = Handlebones.View.extend({
    _ensureElement: function () {
      var response = Handlebones.View.prototype._ensureElement.apply(this, arguments);
      this.el.setAttribute(modelCidAttributeName, this.model.cid);
      return response;
    },
    context: function () {
      return this.model.attributes;
    }
  });

  Handlebones.CollectionView = Handlebones.View.extend({
    modelView: Handlebones.ModelView,
    emptyView: Handlebones.View,
    emptyClassName: "empty",
    modelFilter: false,
    initialize: function () {
      this.listenTo(this.collection, {
        reset: "render",
        sort: "render",
        change: function (model) {
          applyModelVisiblityFilter.call(this, model);
        },
        add: function (model) {
          if (this.collection.length === 1) {
            handleChangeFromEmptyToNotEmpty.call(this);
          }
          var index = this.collection.indexOf(model);
          this.appendModel(model, index);
        },
        remove: function (model) {
          this.removeModel(model);
          this.collection.length === 0 && handleChangeFromNotEmptyToEmpty.call(this);
        }
      });
    },
    render: function () {
      if (this.collection.length === 0) {
        handleChangeFromNotEmptyToEmpty.call(this);
      } else {
        handleChangeFromEmptyToNotEmpty.call(this);
        this.collection.forEach(function (model, i) {
          this.appendModel(model, i);
        }, this);
      }
      ++this._renderCount;
      this.trigger("render");
      return this;
    },
    appendModel: function (model, index) {
      var view;
      view = new this.modelView({
        model: model
      });
      this.addChild(view);
      var previousModel = index > 0 ? this.collection.at(index - 1) : false;
      if (!previousModel) {
        view.appendTo(_.bind(function () {
          this.el.parentNode.insertBefore(view.el, this.el.firstChild);
        }, this));
      } else {
        //use last() as appendModel can accept multiple nodes from a template
        var selector = "[" + modelCidAttributeName + "=\"" + previousModel.cid + "\"]";
        var last = this.$el.children().last(selector);

        //var refNode = document.getElementById("xyz"); 
        //refNode.parentNode.insertBefore(newNode, refNode.nextSibling);

        last.after(view.el);
      }
      applyModelVisiblityFilter.call(this, model);
      this.trigger("appendModel", model, view);
      return this;
    },
    removeModel: function (model) {
      var selector = "[" + modelCidAttributeName + "=\"" + model.cid + "\"]",
        el = this.el.querySelector(selector),
        viewCid = el.getAttribute(viewCidAttributeName),
        view = this.children[viewCid];
      view.remove();
      this.removeChild(view);
      this.trigger("removeModel", model, view);
      return this;
    },
    updateFilter: function () {
      applyVisibilityFilter.call(this);
    }
  });

  // Util

  function deref(token, scope, encode) {
    if (token.match(/^("|')/) && token.match(/("|')$/)) {
      return token.replace(/(^("|')|('|")$)/g, "");
    }
    var segments = token.split("."),
        len = segments.length;
    for (var i = 0; scope && i < len; i++) {
      if (segments[i] !== "this") {
        scope = scope[segments[i]];
      }
    }
    if (encode && _.isString(scope)) {
      return encodeURIComponent(scope);
    } else {
      return scope;
    }
  }

  Handlebones.Util = {
    tag: function (attributes, content, scope) {
      var htmlAttributes = _.omit(attributes, "tagName"),
          tag = attributes.tagName || "div";
      return "<" + tag + " " + _.map(htmlAttributes, function (value, key) {
        var formattedValue = value;
        if (scope) {
          formattedValue = Handlebones.Util.expandToken(value, scope);
        }
        formattedValue = Handlebars.Utils.escapeExpression(formattedValue);
        return (key === "className" ? "class" : key) + "=\"" + formattedValue + "\"";
      }).join(" ") + ">" + (_.isUndefined(content) ? "" : content) + "</" + tag + ">";
    },
    expandToken: function (input, scope, encode) {
      if (input && input.indexOf && input.indexOf("{{") >= 0) {
        var re = /(?:\{?[^{]+)|(?:\{\{([^}]+)\}\})/g,
            match,
            ret = [];
        var mapper = function (param) {
          return deref(param, scope, encode);
        };
        while (match = re.exec(input)) {
          if (match[1]) {
            var params = match[1].split(/\s+/);
            if (params.length > 1) {
              var helper = params.shift();
              params = _.map(params, mapper);
              if (Handlebars.helpers[helper]) {
                ret.push(Handlebars.helpers[helper].apply(scope, params));
              } else {
                // If the helper is not defined do nothing
                ret.push(match[0]);
              }
            } else {
              ret.push(deref(params[0], scope, encode));
            }
          } else {
            ret.push(match[0]);
          }
        }
        input = ret.join("");
      }
      return input;
    }
  };

  // In helpers "tagName" or "tag" may be specified, as well
  // as "class" or "className". Normalize to "tagName" and
  // "className" to match the property names used by Backbone
  // jQuery, etc. Special case for "className" in
  // Handlebones.Util.tag: will be rewritten as "class" in
  // generated HTML.
  function normalizeHTMLAttributeOptions(options) {
    if (options.tag) {
      options.tagName = options.tag;
      delete options.tag;
    }
    if (options["class"]) {
      options.className = options["class"];
      delete options["class"];
    }
  }

  Handlebars.registerHelper("view", function (view, options) {
    if (!view) {
      return "";
    }
    var htmlAttributes = {
      // ensure generated placeholder tag in template
      // will match tag of view instance
      tagName: view.el.tagName.toLowerCase()
    };
    htmlAttributes[viewPlaceholderAttributeName] = view.cid;
    var output = Handlebones.Util.tag(htmlAttributes, "", this);
    return new Handlebars.SafeString(output);
  });

  function appendChildViews() {
    var placeholders = this.el.querySelectorAll("[" + viewPlaceholderAttributeName + "]");
    _.each(placeholders, function (el) {
      var placeholderId = el.getAttribute(viewPlaceholderAttributeName),
          view = this.children[placeholderId];
      if (view) {
        ensureRendered.call(view);
        el.parentNode.replaceChild(view.el, el);
      }
    }, this);
  }

  Handlebars.registerHelper("url", function (url) {
    url = url || "";
    var fragment;
    if (arguments.length > 2) {
      fragment = _.map(_.head(arguments, arguments.length - 1), encodeURIComponent).join("/");
    } else {
      fragment = Handlebones.Util.expandToken(url, this, true);
    }
    if (Backbone.history._hasPushState) {
      var root = Backbone.history.options.root;
      if (root === "/" && fragment.substr(0, 1) === "/") {
        return fragment;
      } else {
        return root + fragment;
      }
    } else {
      return "#" + fragment;
    }
  });

  Handlebars.registerHelper("link", function () {
    var args = _.toArray(arguments),
      options = args.pop(),
      hash = options.hash,
      // url is an array that will be passed to the url helper
      url = args.length === 0 ? [hash.href] : args;
    normalizeHTMLAttributeOptions(hash);
    url.push(options);
    hash.href = Handlebars.helpers.url.apply(this, url);
    hash.tagName = hash.tagName || "a";
    hash[linkAttributeName] = true;
    var output = Handlebones.Util.tag(hash, options.fn ? options.fn(this) : "", this);
    return new Handlebars.SafeString(output);
  });

  // Handler for link helper clicks

  elementAddEventListener.call(document, "readystatechange", function () {
    if (document.readyState === "complete") {
      elementAddEventListener.call(document.body, "click", function (event) {
        // Don't push if meta or shift key are clicked
        if (!event.metaKey && event.shiftKey) {
          if (event.target.getAttribute(linkAttributeName)) {
            var href = event.target.getAttribute("href");
            // Route anything that starts with # or / (excluding //domain urls)
            if (href && (href[0] === "#" || (href[0] === "/" && href[1] !== "/"))) {
              Backbone.history.navigate(href, {
                trigger: true
              });
            }
          }
        }
        if (event.preventDefault) {
          event.preventDefault();
        } else {
          event.returnValue = false;
        }
      });
    }
  }, false);

  if (hasDOMLib) {
    $.fn.view = function () {
      var selector = "[" + viewCidAttributeName + "]",
        el = $(this).closest(selector);
      return (el && viewsIndexedByCid[el.attr(viewCidAttributeName)]) || false;
    };
  }

  return Handlebones;

});