// Boilerplate and test setup.
(function () {
  /*global module:true */
  var root = this,
    isNode = typeof require === "function" &&
             typeof exports === "object" &&
             typeof module  === "object";

  // Make AMD/Non-AMD compatible (boilerplate).
  if (typeof define !== "function") { /*global define:true */
    define = function (deps, callback) {
      // Export if node, else actually run.
      if (isNode) { 
        module.exports = callback;
      } else {
        callback(root.$, root._, root.Backbone, root.Handlebars, root.Handlebones);
      }
    };
  }

  // Patch Mocha.
  // Skip node for certain tests.
  it.skipNode = function () {
    return (isNode ? it.skip : it).apply(this, arguments);
  };
}());

// We will alias zepto in, in the zepto test
define([
  "jquery",
  "underscore",
  "backbone",
  "handlebars",
  "handlebones"
], function ($, _, Backbone, Handlebars, Handlebones) {
  
  var expect = chai.expect;
  
  function generateChild () {
    return new (Handlebones.View.extend({
      name: "child",
      tagName: "li",
      template: Handlebars.compile("test")
    }));
  }
  
  function generateParent () {
    return new (Handlebones.View.extend({
      name: "parent",
      template: Handlebars.compile("<ul>{{view child}}</ul>"),
      context: function () {
        return {
          child: this.child
        };
      }
    }));
  }
  
  afterEach(function () {
    document.getElementById("fixture").innerHTML = "";
  });
  
  describe("extra attributes", function () {
    it("should set data-view-cid", function () {
      var view = new Handlebones.View();
      expect(view.el.getAttribute("data-view-cid")).to.match(/^view[\d]+$/);
    });
  
    it("should not error with no name attr", function () {
      var view = new Handlebones.View();
      expect(view.el.getAttribute("data-view-name")).to.be.null;
    });
  
    it("should set data-view-name attribute", function () {
      var view = new (Handlebones.View.extend({
        name: "test"
      }));
      expect(view.el.getAttribute("data-view-name")).to.equal("test");
    });
  
    it("setElement will re-add data-view-name and data-view-cid", function () {
      var view = new (Handlebones.View.extend({
        name: "test"
      }));
      view.setElement(document.createElement("DIV"));
      expect(view.el.getAttribute("data-view-name")).to.equal("test");
      expect(view.el.getAttribute("data-view-cid")).to.match(/^view[\d]+$/);
    });
  
    it("setElement will add data-view-name and data-view-cid to existing element", function () {
      var view = new (Handlebones.View.extend({
        name: "test",
        element: document.getElementById("fixture")
      }));
      expect(view.el.getAttribute("data-view-name")).to.equal("test");
      expect(view.el.getAttribute("data-view-cid")).to.match(/^view[\d]+$/);
    });
  
    it("data-view-name and data-view-cid removed on view.remove()", function () {
      var view = new (Handlebones.View.extend({
        name: "test",
        element: document.getElementById("fixture")
      }));
      view.remove();
      expect(view.el.getAttribute("data-view-name")).to.be.null;
      expect(view.el.getAttribute("data-view-cid")).to.be.null;
    });
  });
  
  describe("template, render & context", function () {
    it("should not error with no template", function () {
      var view = new Handlebones.View();
      view.render();
      expect(view.el.innerHTML).to.equal("");
    });
  
    it("should render a template", function () {
      var view = new (Handlebones.View.extend({
        template: Handlebars.compile("test")
      }));
      view.render();
      expect(view.el.innerHTML).to.equal("test");
    });
  
    it("render should accept a string or template argument", function () {
      var view = new (Handlebones.View.extend({
        context: function () {
          return {
            key: "value"
          };
        }
      }));
      view.render("test");
      expect(view.el.innerHTML).to.equal("test");
      view.render(Handlebars.compile("{{key}}"));
      expect(view.el.innerHTML).to.equal("value");
    });
  
    it("should trigger render event", function () {
      var spy = sinon.spy();
      var view = new (Handlebones.View.extend({
        initialize: function () {
          this.listenTo(this, "render", spy);
        }
      }));
      view.render();
      expect(spy.callCount).to.equal(1);
    });
  
    it("should render a template with context", function () {
      var view = new (Handlebones.View.extend({
        template: Handlebars.compile("{{key}}"),
        context: function () {
          return {
            key: "value"
          };
        }
      }));
      view.render();
      expect(view.el.innerHTML).to.equal("value");
    });
  });
  
  describe("appendTo & ready", function () {
    it("should render when appended", function () {
      var view = new (Handlebones.View.extend({
        id: "test-view",
        template: Handlebars.compile("test")
      }));
      view.appendTo(document.getElementById("fixture"));
      expect(document.getElementById("test-view").innerHTML).to.equal("test");
    });
  
    it("should fire ready event when appended", function () {
      var view;
      var spy = sinon.spy(function () {
      });
      view = new (Handlebones.View.extend({
        id: "test-view",
        template: Handlebars.compile("test"),
        initialize: function () {
          this.listenTo(this, "ready", spy);
        }
      }));
      view.appendTo(document.getElementById("fixture"));
      expect(spy.callCount).to.equal(1);
  
      // will fire multiple times
      view.appendTo(document.getElementById("fixture"));
      expect(spy.callCount).to.equal(2);
    });
  
    it("should allow a custom appendTo insertion operation", function () {
      var view = new (Handlebones.View.extend({
        id: "test-view",
        template: Handlebars.compile("test")
      }));
      view.appendTo(function () {
        document.getElementById("fixture").appendChild(view.el);
      });
      expect(document.getElementById("test-view").innerHTML).to.equal("test");
    });
  });
  
  describe("addChild & removeChild", function () {
    it("should set and remove parent attr", function () {
      var parent = new Handlebones.View();
      var child = new Handlebones.View();
      parent.addChild(child);
      expect(child.parent).to.equal(parent);
      parent.removeChild(child);
      expect(child.parent).to.be["undefined"];
    });
  
    it("should update children array", function () {
      var parent = new Handlebones.View();
      var child = new Handlebones.View();
      parent.addChild(child);
      expect(parent.children[child.cid]).to.equal(child);
      parent.removeChild(child);
      expect(parent.children[child.cid]).to.be["undefined"];
    });
  
    it("should fire ready on children", function () {
      var parent = generateParent();
      var child = generateChild();
      parent.addChild(child);
      var parentSpy = sinon.spy();
      var childSpy = sinon.spy();
      parent.listenTo(parent, "ready", parentSpy);
      child.listenTo(child, "ready", childSpy);
      parent.trigger("ready");
      expect(parentSpy.callCount).to.equal(1);
      expect(childSpy.callCount).to.equal(1);
    });
  
    it("should fire ready on children immediately if parent is ready", function () {
      var parent = generateParent();
      var child = generateChild();
      var parentSpy = sinon.spy();
      var childSpy = sinon.spy();
      parent.listenTo(parent, "ready", parentSpy);
      child.listenTo(child, "ready", childSpy);
      parent.trigger("ready");
      parent.addChild(child);
      expect(parentSpy.callCount).to.equal(1);
      expect(childSpy.callCount).to.equal(1);
    });

    it("should automatically removeChild when remove'd", function () {
      var parent = generateParent();
      var child = generateChild();
      var spy = parent.removeChild = sinon.spy(parent.removeChild);
      parent.addChild(child);
      parent.remove();
      expect(spy.callCount).to.equal(1);
    });
  });
  
  describe("LayoutView", function () {
    it("should append and render a view", function () {
      var layout = new Handlebones.LayoutView();
      var view = new (Handlebones.View.extend({
        id: "test-view",
        template: Handlebars.compile("test")
      }));
      layout.appendTo(document.getElementById("fixture"));
      layout.setView(view);
      expect(layout.getView()).to.equal(view);
      expect(document.getElementById("test-view").innerHTML).to.equal("test");
    });
  
    it("should allow a callback option", function () {
      var layout = new Handlebones.LayoutView();
      var view = new (Handlebones.View.extend({
        id: "test-view",
        template: Handlebars.compile("test")
      }));
      layout.appendTo(document.getElementById("fixture"));
      layout.setView(view, function (view, oldView, append, remove) {
        append();
        remove();
        expect(layout.getView()).to.equal(view);
        expect(document.getElementById("test-view").innerHTML).to.equal("test");
      });
    });

    it("should fire one ready event and one remove event on views", function () {
      var a = new Handlebones.View();
      a.name = "a";
      var b = new Handlebones.View();
      b.name = "b";
      var readySpyA = sinon.spy();
      var readySpyB = sinon.spy();
      var removeSpyA = sinon.spy();
      var removeSpyB = sinon.spy();
      var layoutView = new Handlebones.LayoutView();
      a.listenTo(a, "ready", readySpyA);
      b.listenTo(b, "ready", readySpyB);
      a.listenTo(a, "remove", removeSpyA);
      b.listenTo(b, "remove", removeSpyB);
      layoutView.setView(a);
      expect(readySpyA.callCount).to.equal(1, "ready A");
      layoutView.setView(b);
      expect(readySpyB.callCount).to.equal(1, "ready B");
      expect(removeSpyA.callCount).to.equal(1, "remove A");
    });
  });
  
  describe("ModelView", function () {
    it("should have a data-model-cid attribute", function () {
      var model = new Backbone.Model();
      var view = new Handlebones.ModelView({
        model: model
      });
      expect(view.el.getAttribute("data-model-cid")).to.equal(model.cid);
    });
  
    it("should render on model change", function () {
      var model = new Backbone.Model();
      var view = new (Handlebones.ModelView.extend({
        template: Handlebars.compile("{{key}}")
      }))({
        model: model,
      });
      model.set({
        key: "one"
      });
      expect(view.el.innerHTML).to.equal("one");
      model.set({
        key: "two"
      });
      expect(view.el.innerHTML).to.equal("two");
    });
  });
  
  describe("CollectionView", function () {
  
    function generateCollection () {
      return new Backbone.Collection([
        {letter: "a"},
        {letter: "b"},
        {letter: "c"}
      ]);
    }
    
    function generateCollectionView(collection, props) {
      return new (Handlebones.CollectionView.extend(_.extend((props || {}), {
        tagName: "ul",
        modelView: Handlebones.ModelView.extend({
          tagName: "li",
          template: Handlebars.compile("{{letter}}")
        })
      })))({
        collection: collection
      });
    }
  
    it("should render a collection", function () {
      var collection = generateCollection();
      var view = generateCollectionView(collection);
      var renderEventSpy = sinon.spy();
      view.listenTo(view, "render", renderEventSpy);
      view.render();
      expect(renderEventSpy.callCount).to.equal(1);
      expect(view.$("li").length).to.equal(3);
      expect(view.$("li")[0].innerHTML).to.equal("a");
      expect(view.$("li")[1].innerHTML).to.equal("b");
      expect(view.$("li")[2].innerHTML).to.equal("c");
    });
  
    it("should respond to collection add and remove", function () {
      var collection = generateCollection();
      var view = generateCollectionView(collection);
      view.render();
      var model = new Backbone.Model({
        letter: "d"
      });
      collection.add(model);
      expect(view.$("li").length).to.equal(4);
      expect(view.$("li")[3].innerHTML).to.equal("d");
      collection.remove(model);
      expect(view.$("li").length).to.equal(3);
      expect(view.$("li")[2].innerHTML).to.equal("c");
    });
  
    it("should respond to collection reset", function () {
      var collection = generateCollection();
      var view = generateCollectionView(collection);
      view.render();
      collection.reset([{letter: "x"}]);
      expect(view.$("li").length).to.equal(1);
      expect(view.$("li")[0].innerHTML).to.equal("x");
    });
  
    it("should respond to collection sort", function () {
      var collection = new Backbone.Collection([
        {letter: "c"},
        {letter: "b"},
        {letter: "a"}
      ]);
      var view = generateCollectionView(collection);
      view.render();
      expect(view.$("li")[0].innerHTML).to.equal("c");
      expect(view.$("li")[1].innerHTML).to.equal("b");
      expect(view.$("li")[2].innerHTML).to.equal("a");
      collection.comparator = "letter";
      collection.sort();
      expect(view.$("li")[0].innerHTML).to.equal("a");
      expect(view.$("li")[1].innerHTML).to.equal("b");
      expect(view.$("li")[2].innerHTML).to.equal("c");
    });
  
    it("should respond to model change", function () {
      var collection = generateCollection();
      var view = generateCollectionView(collection);
      view.render();
      collection.at(0).set({letter: "x"});
      expect(view.$("li")[0].innerHTML).to.equal("x");
    });
  
    it("should allow manual addModel and removeModel", function () {
      var collection = generateCollection();
      var view = generateCollectionView(collection);
      view.render();
      var d = new Backbone.Model({
        letter: "d"
      });
      view.addModel(d);
      expect(view.$("li").length).to.equal(4);
      expect(view.$("li")[3].innerHTML).to.equal("d");
      view.removeModel(d);
      expect(view.$("li").length).to.equal(3);
      // attempt arbitrary position
      var one = new Backbone.Model({
        letter: "one"
      });
      view.addModel(one, 0);
      expect(view.$("li").length).to.equal(4);
      expect(view.$("li")[0].innerHTML).to.equal("one");
      expect(view.$("li")[1].innerHTML).to.equal("a");
      view.removeModel(one);
      expect(view.$("li").length).to.equal(3);
      expect(view.$("li")[0].innerHTML).to.equal("a");
    });
  
    it("should allow an modelFilter", function () {
      var collection = generateCollection();
      var view = generateCollectionView(collection, {
        modelFilter: function (model) {
          return model.get("letter") === "b";
        }
      });
      view.render();
      expect(view.$("li")[0].style.display).to.equal("none");
      expect(view.$("li")[1].style.display).to.equal.null;
      expect(view.$("li")[2].style.display).to.equal("none");
      view.modelFilter = function (model) {
        return model.get("letter") === "c";
      };
      view.updateModelFilter();
      expect(view.$("li")[0].style.display).to.equal("none");
      expect(view.$("li")[1].style.display).to.equal("none");
      expect(view.$("li")[2].style.display).to.equal.null;
    });
  
    it("should not render an emptyView when none is set", function () {
      var collection = new Backbone.Collection();
      var view = generateCollectionView(collection);
      view.render();
      expect(view.el.innerHTML).to.equal("");
    });
  
    it("should render an emptyView when one is set and transition between empty and non empty", function () {
      var collection = new Backbone.Collection();
      var view = generateCollectionView(collection, {
        emptyView: Handlebones.View.extend({
          tagName: "li",
          template: Handlebars.compile("empty")
        })
      });
      view.render();
      expect(view.$("li").length).to.equal(1);
      expect(view.$("li")[0].innerHTML).to.equal("empty");
      expect(view.el.className).to.equal("empty");
      var a = new Backbone.Model({
        letter: "a"
      });
      collection.add(a);
      expect(view.$("li").length).to.equal(1);
      expect(view.$("li")[0].innerHTML).to.equal("a");
      expect(view.el.className).to.equal("");
      collection.remove(a);
      expect(view.$("li").length).to.equal(1);
      expect(view.$("li")[0].innerHTML).to.equal("empty");
      expect(view.el.className).to.equal("empty");
    });
  });
  
  describe("view helper", function () {
    it("should fail silently when no view initialized", function () {
      var parent = generateParent();
      parent.render();
      expect(parent.$("ul")[0].innerHTML).to.equal("");
    });
  
    it("should embed a child view", function () {
      var parent = generateParent();
      parent.child = generateChild();
      parent.addChild(parent.child);
      parent.render();
      expect(parent.$("ul > li")[0].innerHTML).to.equal("test");
    });
  
    it("re-render of parent should not render child", function () {
      var parentRenderSpy = sinon.spy(),
        childRenderSpy = sinon.spy(),
        parent = generateParent(),
        child = generateChild();
      parent.child = child;
      parent.addChild(parent.child);
      parent.listenTo(parent, "render", parentRenderSpy);
      child.listenTo(child, "render", childRenderSpy);
      expect(parentRenderSpy.callCount).to.equal(0);
      expect(childRenderSpy.callCount).to.equal(0);
      parent.render();
      expect(parentRenderSpy.callCount).to.equal(1);
      expect(childRenderSpy.callCount).to.equal(1);
      parent.render();
      expect(parentRenderSpy.callCount).to.equal(2);
      expect(childRenderSpy.callCount).to.equal(1);
    });
  
    it("should allow child views within each #each", function() {
      var parent = new (Handlebones.View.extend({
        template: Handlebars.compile("{{#each views}}{{view this}}{{/each}}"),
        initialize: function () {
          this.views = [
            new (Handlebones.View.extend({
              template: Handlebars.compile("a")
            })),
            new (Handlebones.View.extend({
              template: Handlebars.compile("b")
            }))
          ];
          _.each(this.views, this.addChild, this);
        },
        context: function () {
          return {
            views: this.views
          }
        }
      }));
      parent.render();
      expect(parent.el.innerText.replace(/\r\n/g, "")).to.equal("ab");
    });
  
    it("should allow view to go in and out of scope", function () {
      var parent = new (Handlebones.View.extend({
        template: Handlebars.compile("{{#if condition}}<ul>{{view child}}</ul>{{/if}}"),
        initialize: function () {
          this.child = this.addChild(generateChild());
          this.condition = true;
        },
        context: function () {
          return {
            child: this.child,
            condition: this.condition
          };
        }
      }));
      var childRenderSpy = sinon.spy();
      parent.child.listenTo(parent.child, "render", childRenderSpy);
      parent.render();
      expect(parent.$("li")[0].innerHTML).to.equal("test");
      expect(childRenderSpy.callCount).to.equal(1);
      parent.condition = false;
      parent.render();
      expect(childRenderSpy.callCount).to.equal(1);
      expect(parent.$("li")[0]).to.be["undefined"];
      parent.condition = true;
      parent.render();
      expect(childRenderSpy.callCount).to.equal(1);
      expect(parent.$("li")[0].innerHTML).to.equal("test");
    });
  });
  
  describe("tag utility", function () {
    it("should render a tag with no content", function () {
      expect(Handlebones.Util.tag({
        tag: "a"
      })).to.equal("<a></a>");
    });
  
    it("should render a tag with content", function () {
      expect(Handlebones.Util.tag({
        tag: "a"
      }, "test")).to.equal("<a>test</a>");
    });
  
    it("should render a tag with content and an attribute", function () {
      var html = Handlebones.Util.tag({
        tag: "a",
        key: "value"
      }, "test");
      expect(html).to.equal("<a key=\"value\">test</a>");
    });
  
    it("should render tokens in attributes", function () {
      expect(Handlebones.Util.tag({
        tag: "a",
        attr: "{{key}}"
      }, "test", {
        key: "value"
      })).to.equal("<a attr=\"value\">test</a>");
    });
  
    it("should normalize tagName and className", function () {
      var html = Handlebones.Util.tag({
        tagName: "a",
        "className": "test"
      });
      expect(html).to.equal("<a class=\"test\"></a>");
    });
  });
});