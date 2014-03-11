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
});

describe("addChild & removeChild", function () {

});
