var expect = chai.expect;

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
    var spy = sinon.spy(function (options) {
      // should pass target param
      expect(options.target).to.equal(view);
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

  it("should fire addChild and removeChild events", function () {
    var parent = new Handlebones.View();
    var child = new Handlebones.View();
    var addChildSpy = sinon.spy(function (view) {
      expect(view).to.equal(child);
    });
    var removeChildSpy = sinon.spy(function (view) {
      expect(view).to.equal(child);
    });
    parent.listenTo(parent, "addChild", addChildSpy);
    parent.listenTo(parent, "removeChild", removeChildSpy);
    parent.addChild(child);
    expect(addChildSpy.callCount).to.equal(1);
    parent.removeChild(child);
    expect(removeChildSpy.callCount).to.equal(1);
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

});
