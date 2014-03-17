# Handlebones

A tiny [Backbone](http://backbonejs.org) + [Handlebars](http://handlebarsjs.com/) view framework.

## Usage

    bower install handlebones

For new projects give the [Handlebones Generator](http://github.com/FormidableLabs/generator-handlebones) a try. Edge production and development downloads:

- [Development Version 16kb](https://raw.github.com/FormidableLabs/handlebones/master/handlebones.js)
- [Production Version 6kb](https://raw.github.com/FormidableLabs/handlebones/master/handlebones.min.js)

Handlebones is designed to be used without RequireJS or with RequireJS without using a shim. Handlebones requires Underscore, Backbone and Handlebars plus jQuery or Zepto. The upcoming version of Backbone will remove DOM libs as a hard dependency, Handlebones was designed with this in mind.

- [Hello World](http://jsfiddle.net/LQYQV/)
- [Todos](http://jsfiddle.net/7TLgS/)
- [LayoutView](http://jsfiddle.net/zNk5s/)
- [$.view](#)

## Handlebones.View

### name & HTML Attributes

-  A `data-view-cid` HTML attribute is always set on the view's `el`.
- Adding a `name` attribute to your view class will provide additional information in your stack traces when an error occurs.
- Setting a `name` will also set a `data-view-name` property on your view's `el`.

### template

A compiled template.

    Handlebones.View.extend({
      template: Handlebars.compile("Hello world!")
    });

### context()

A function that will return the context which will be available to the View's `template`. Defaults to `function () { return this; }`.

    Handlebones.View.extend({
      template: Handlebars.compile("{{greeting}} world!"),
      context: function () {
        return {
          greeting: "Hello"
        };
      }
    });

### render([html or template])

Replaces the `innerHTML` of the view's `el` with output of the `template` which will be passed the `context`. `render` will automatically be called by `appendTo` if the view has not yet been rendered.

An HTML string or compiled template may be passed to `render` to be used instead of the `template`.

The `render` method will trigger a `render` event.

### appendTo(element or function)

Appends the view to the passed `element` which must already be appended to the `document`. `render` will be called if it hasn't yet be called, and a `ready` event will be triggered.

    view.appendTo(document.body);

By default `appendTo` will use `appendChild` as the DOM insertion operation, alternatively a function can be specified to run whatever insertion operation you wish. Before the function executes `render` will be called if needed and `ready` will be triggered after the function executes.

### ready

An event that is fired when a view is attached to the `document` with `appendTo`.

    view.on("ready", function () {
      view.$("input").focus();
    });
    view.appendTo(document.body);

The `ready` event will fire on any `children` that are already part of the view and any new `children` that are added after the `ready` event has fired.

### remove()

Calls `removeChild` on all `children`, and also triggers a `remove` event in addition to the existing Backbone `listenTo` cleanup behavior. **Once removed a view should no longer be used**.

The `remove` event should be your main hook to do any garbage collection behaviors. Note that while `removeChild` is called on all `children`, `remove` is **not** called on `children`.

    Handlebones.View.extend({
      intiailize: function () {
        this.child = this.addChild(new AnotherView());
        this.listenTo(this, "remove", function () {
          this.child.remove();
        });
      }
    });

## addChild(view)

Adds the passed view to the `children` object and sets the `parent` of the passed view to the caller. In order to embed a child with the `view` helper, `addChild` must be used.

## removeChild(view)

Removes the passed view from the `children` object and sets the passed view's `parent` attribute to null. `removeChild` is automatically called on all `children` when `remove` is called. Note that `remove` is **not** called automatically on `children`.

## children

An object containing all views added with `addChild` indexed by each views' `cid`.

## parent

A reference to the parent view if any. Set when `addChild` is called.

## LayoutView

A view which will embed a single child view, which can be changed with `setView`. As new views are set, old views are `remove`d. Useful in conjunction with a `Backbone.Router`.

    Backbone.Router.extend({
      routes: {
        "": "index",
        "about": "about"
      }
      initialize: function () {
        this.layoutView = new Handlebones.LayoutView();
        this.layoutView.appendTo(document.body);
      },
      index: function () {
        this.layoutView.setView(new IndexView());
      },
      about: function () {
        this.layoutView.setView(new AboutView());
      }
    })

### setView(view [,callback])

Set the current view. `remove` will be called on the view that was previously set.

To perform asyncronous operations (such as an animation) an optional callback option may be specified which will receive the new view, the old view, a function which will perform the append operation and a function which will perform the remove operation.

    view.setView(newView, function (newView, oldView, append, remove) {
      $(oldView.el).fadeOut(function () {
        remove();
        append();
        $(newView.el).fadeIn();
      });
    });

### getView

Gets the currently displayed view.

## Handlebones.ModelView

Requires a `model` option to be passed into the constructor. It calls render on itself every time the `model`'s `change` event is fired. It also sets a `context` method that will return `this.model.attributes`.

## Handlebones.CollectionView

Requires a `collection` option be passed into the constructor. Creates a specified `modelView` for each `model` in the `collection`. Will re-render the entire collection on collection `reset` or `sort` and add or remove `modelView`s on collection `add` or `remove` events.

The `template` property of a `CollectionView` will not be used to render the collection.

    Handlebones.CollectionView.extend({
      tagName: "ul",
      modelView: Handlebones.ModelView.extend({
        tagName: "li",
        template: Handlebones.compile("item content")
      }),
      emptyView: Handlebones.View.extend({
        tagName: "li",
        template: Handlebones.compile("empty content")
      })
    });

### modelView

The view class to use when creating new views for each model in the collection. Defaults to `Handlebones.ModelView`.

### emptyView

The view class to use when creating a view to show when the collection is empty. Defaults to false.

### emptyClassName

The `className` to add or remove from the view's `el` depending on wether or not the collection is empty. Defaults to `empty`

### appendModel(model [,index])

Renders a `modelView` for a given model and appends it to the view. This method is used by `render` in a loop.

Accepts an optional numeric `index` argument to tell the view where to place the generated `modelView`. The passed model is not required to be part of the view's `collection`.

An `appendModel` event will be fired for each rendered view. The event handler will receive the passed `model` and associated `modelView`.

### removeModel(model)

Removes a `modelView` associated with a given model. Triggers a `removeModel` event which will receive the passed `model` and associated `modelView`

### modelFilter

An optional function that can be specified which will hide or show `modelView`s based on the specified criteria.

    Handlebones.CollectionView.extend({
      itemFilter: function (model) {
        return model.get("someKey") === "someValue";
      }
    });

On collection `reset`, `add`, `remove` or a model `change` the `modelFilter` will be automatically re-applied.

### updateModelFilter()

When the `modelFilter` itself changes (for instance the search criteria for an auto-complete UI) call this method to force the view to re-filter it's `collection`.

## Helpers

### {{view child}}

Embed one view inside of another. You must add the view to be embedded with the `addChild` method.

    Handlebones.View.extend({
      initialize: function () {
        this.child = this.addChild(new OtherView());
      },
      template: Handlebars.compile("{{view child}}")
    });

## Util

### tag(attributes, content, context)

Generate arbitrary HTML. `tag` or `tagName` may be specified to define what type of tag will be generated. `class` or `className` may be passed to specify the HTML `class`. All other attributes will be passed through unmodified. If a `context` argument is passed Handlebars tokens inside of attributes will be evaluated with the given context.

    Handlebones.Util.tag({
      tag: "a",
      href: "articles/{{id}}"
    }, "link text", {
      id: "42"
    });

## $.view(event.target)

Obtains a reference to the nearest `view` from a given element. Especially useful inside of a `CollectionView`

    Handlebones.CollectionView.extend({
      tagName: "ul",
      events: {
        "click li": function (event) {
          var modelView = $(event.target).view();
          var model = modelView.model;
        }
      },
      modelView: Handlebones.ModelView.extend({
        tagName: "li",
        template: Handlebars.compile("...")
      })
    })

## Catalog of Built in Events

- render (View)
- ready (View)
- remove (View)
- appendModel (CollectionView)
- removeModel (CollectionView)

## Testing

    npm install -g mocha-phantomjs phantomjs
    gulp

To run tests in browser:
  
    gulp connect
    open http://localhost:8080/jquery.html
