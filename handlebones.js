(function () {

  var Handlebones = {},
    viewNameAttributeName = "data-view-name",
    viewCidAttributeName = "data-view-cid",
    linkAttributeName = "data-history-link",
    viewPlaceholderAttributeName = "data-view-tmp",
    viewTemplateOverrides = {},
    viewsIndexedByCid = {},
    isIE11 = !!navigator.userAgent.match(/Trident\/7\./),
    isIE = isIE11 || (/msie [\w.]+/).exec(navigator.userAgent.toLowerCase()),
    hasDOMLib = typeof $ !== "undefined" && $.fn;

  function triggerReadyOnChild(child) {
    child._isReady || child.trigger("ready", options);
  }

  function onReady () {
    if (!this._isReady) {
      this._isReady = true;
      _.each(this.children, triggerReadyOnChild);
      this.listenTo("child", triggerReadyOnChild);
    }
  }

  function configureView () {
    this._renderCount = 0;
    this.children = {};
    viewsIndexedByCid[this.cid] = this;
    this.listenTo(this, "ready", onReady);
  }

  function ensureRendered () {
    !this._renderCount && this.render();
  }

  Handlebones.View = Backbone.View.extend({
    addChild: function (view) {
      if (this.children[view.cid]) {
        return view;
      }
      this.children[view.cid] = view;
      this.trigger("child", view);
      return this;
    },

    removeChild: function (view) {
      view.parent = null;
      delete this.children[view.cid];
      return this;
    },

    template: Handlebars.VM.noop,

    render: function () {
      var output = this.template(this.context());
      if (hasDOMLib) {
        // We want to pull our elements out of the tree if we are under jQuery
        // or IE as both have the tendancy to mangle the elements we want to reuse
        // on cleanup. This could leak event binds if users are performing custom binds
        // but this generally not recommended.
        if (this._renderCount && (isIE || $.fn.jquery)) {
          while (this.el.hasChildNodes()) {
            this.el.removeChild(this.el.childNodes[0]);
          }
        }
        this.$el.empty();
        this.$el.append(html);
      } else {
        this.el.innerHTML = html;
      }
      appendChildViews.call(this);
      ++this._renderCount;
      return this;
    },

    context: function () {
      return this;
    },

    appendTo: function (el) {
      ensureRendered.call(this);
      el.appendChild(this.el);
      this.trigger("ready", {
        target: this
      });
    },

    // Private and undocumented methods

    remove: function () {
      delete viewsIndexedByCid[this.cid];
      return Backbone.View.prototype.remove.apply(this, arguments);
    },

    toString: function () {
      return "[object Handlebones.View." + (this.name || this.cid) + "]";
    },

    setElement : function () {
      var response = Backbone.View.prototype.setElement.apply(this, arguments);
      this.name && this.el.setAttribute(viewNameAttributeName, this.name);
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

  Handlebones.LayoutView = Handlebones.View.extend({
    _renderCount: 1,
    render: function () {
      // NOOP as we never want to do anything
    },
    setView: function (view, options) {
      var oldView = this._view,
        append,
        remove,
        complete;
      if (view === oldView && !options.force) {
        return false;
      }  
      remove = _.bind(function() {
        if (oldView) {
          oldView.remove();
          this.removeChild(oldView);
        }
      }, this);
      append = _.bind(function() {
        this._view = view;
        if (view) {
          ensureRendered.call(view);
          this._addChild(view);
          this._view.appendTo(this.el);
        }
      }, this);
      if (!options.transition) {
        remove();
        append();
      } else {
        options.transition(view, oldView, append, remove);
      }
      return view;
    },
    getView: function () {
      return this._view;
    }
  });

  function deref (token, scope) {
    if (token.match(/^("|')/) && token.match(/("|')$/)) {
      return token.replace(/(^("|')|('|")$)/g, '');
    }
    var segments = token.split("."),
        len = segments.length;
    for (var i = 0; scope && i < len; i++) {
      if (segments[i] !== "this") {
        scope = scope[segments[i]];
      }
    }
    return scope;
  }

  Handlebones.Util = {
    tag: function (attributes, content, scope) {
      var htmlAttributes = _.omit(attributes, "tagName"),
          tag = attributes.tagName || "div";
      return "<" + tag + " " + _.map(htmlAttributes, function(value, key) {
        var formattedValue = value;
        if (scope) {
          formattedValue = Handlebones.Util.expandToken(value, scope);
        }
        formattedValue = Handlebars.Utils.escapeExpression(formattedValue);
        return (key === "className" ? "class" : key) + "=\"" + formattedValue + "\"";
      }).join(" ") + ">" + (_.isUndefined(content) ? "" : content) + "</" + tag + ">";
    },
    expandToken: function (input, scope) {
      if (input && input.indexOf && input.indexOf("{{") >= 0) {
        var re = /(?:\{?[^{]+)|(?:\{\{([^}]+)\}\})/g,
            match,
            ret = [];
        while (match = re.exec(input)) {
          if (match[1]) {
            var params = match[1].split(/\s+/);
            if (params.length > 1) {
              var helper = params.shift();
              params = _.map(params, function(param) {
                return deref(param, scope);
              });
              if (Handlebars.helpers[helper]) {
                ret.push(Handlebars.helpers[helper].apply(scope, params));
              } else {
                // If the helper is not defined do nothing
                ret.push(match[0]);
              }
            } else {
              ret.push(deref(params[0], scope));
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
  function normalizeHTMLAttributeOptions (options) {
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
    var htmlAttributes = {
      // ensure generated placeholder tag in template
      // will match tag of view instance
      tagName: view.el.tagName.toLowerCase()
    };
    if (options.fn) {
      viewTemplateOverrides[view.cid] = options.fn;
    }
    htmlAttributes[viewPlaceholderAttributeName] = view.cid;
    var output = Handlebones.Util.tag(htmlAttributes, "", this);
    return new Handlebars.SafeString(output);
  });

  function appendChildViews () {
    var placeholders = document.querySelectorAll("[" + viewPlaceholderAttributeName + "]");
    _.each(placeholders, function (el) {
      var placeholderId = el.getAttribute(viewPlaceholderAttributeName),
          view = this.children[placeholderId];
      if (view) {
        // see if the view helper declared an override for the view
        // if not, ensure the view has been rendered at least once
        if (viewTemplateOverrides[placeholderId]) {
          view.render(viewTemplateOverrides[placeholderId]);
          delete viewTemplateOverrides[placeholderId];
        } else {
          ensureRendered.call(view);
        }
        el.parentNode.replaceChild(el, view.el);
      }
    }, this);
  }

  Handlebars.registerHelper("url", function (url) {
    url = url || "";
    var fragment;
    if (arguments.length > 2) {
      fragment = _.map(_.head(arguments, arguments.length - 1), encodeURIComponent).join("/");
    } else {
      var options = arguments[1],
          hash = (options && options.hash) || options;
      fragment = Handlebones.Util.expandToken(url, this);
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

  Handlebars.registerHelper("link", function() {
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
    var output = Thorax.Util.tag(hash, options.fn ? options.fn(this) : "", this);
    return new Handlebars.SafeString(output);
  });

  // Handler for link helper clicks
  (document.addEventListener || document.attachEvent)('readystatechange', function() {
    if (document.readyState === "complete") {
      (document.body.addEventListener || document.body.attachEvent)("click", function (event) {
        var href = event.target.getAttribute("href");
        // Route anything that starts with # or / (excluding //domain urls)
        if (href && (href[0] === "#" || (href[0] === "/" && href[1] !== "/"))) {
          Backbone.history.navigate(href, {
            trigger: true
          });
        }
      });
    }
  }, false);

  if (hasDOMLib) {
    $.fn.view = function() {
      var selector = "[" + viewCidAttributeName + "]",
        el = $(this).closest(selector);
      return (el && viewsIndexedByCid[el.attr(viewCidAttributeName)]) || false;
    };
  }

})();