(function () {

  var Handlebones = {},
    viewNameAttributeName = 'data-view-name',
    viewCidAttributeName = 'data-view-cid',
    viewsIndexedByCid = {},
    isIE11 = !!navigator.userAgent.match(/Trident\/7\./),
    isIE = isIE11 || (/msie [\w.]+/).exec(navigator.userAgent.toLowerCase()),
    hasDOMLib = typeof $ !== "undefined" && $.fn;

  function triggerReadyOnChild(child) {
    child._isReady || child.trigger('ready', options);
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
      ++this._renderCount;
      return this;
    },

    context: function () {
      return this;
    },

    appendTo: function(el) {
      ensureRendered.call(this);
      el.appendChild(this.el);
      this.trigger("ready", {target: this});
    },

    // Private and undocumented methods

    remove: function () {
      delete viewsIndexedByCid[this.cid];
      _.each(this.children, function (child) {
        child.remove();
      });
      return Backbone.View.prototype.remove.apply(this, arguments);
    },

    toString: function() {
      return "[object Handlebones.View." + (this.name || this.cid) + "]";
    },

    setElement : function() {
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
    setView: function(view, options) {
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
    getView: function() {
      return this._view;
    }
  });

  Handlebones.Util = {
    tag: function(attributes, content) {
      var htmlAttributes = _.omit(attributes, "tagName"),
          tag = attributes.tagName || "div";
      return "<" + tag + " " + _.map(htmlAttributes, function(value, key) {
        if (_.isUndefined(value)) {
          return "";
        }
        return (key === "className" ? "class" : key) + "=\"" + Handlebars.Utils.escapeExpression(value) + "\"";
      }).join(" ") + ">" + (_.isUndefined(content) ? "" : content) + "</" + tag + ">";
    }
  }

  if (hasDOMLib) {
    $.fn.view = function() {
      var selector = '[' + viewCidAttributeName + ']';
      var el = $(this).closest(selector);
      return (el && viewsIndexedByCid[el.attr(viewCidAttributeName)]) || false;
    };
  }

})();