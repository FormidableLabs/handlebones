# Handlebones

A tiny [Backbone](http://backbonejs.org) + [Handlebars](http://handlebarsjs.com/) view framework.

## Usage

    bower install handlebones

For new projects give the [Handlebones Generator](http://github.com/FormidableLabs/generator-handlebones) a try. Edge production and development downloads:

- [Development Version 16kb](https://raw.github.com/FormidableLabs/handlebones/master/handlebones.js)
- [Production Version 6kb](https://raw.github.com/FormidableLabs/handlebones/master/handlebones.js)

Handlebones is designed to be used without RequireJS or with RequireJS without using a shim. Handlebones requires Underscore, Backbone and Handlebars plus jQuery or Zepto. The upcoming version of Backbone will remove DOM libs as a hard dependency, Handlebones was designed with this in mind.

## Hello World

    (new (Handlebones.View.extend({
      template: Handlebars.compile("Hello world!")
    }))).appendTo(document.body);

Also see the more verbose [Hello World fiddle](#) and [Todos fiddle](#).

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

A function that will return the context which will be available to the View's `template`. Defualts to `function () { return this; }`.

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


## Children

## addChild & event
## removeChild & event
## children
## parent
## Garbage collection
- make sure to use `appendTo` and `remove`
- use `addChild` and `removeChild` events

# LayoutView
## setView
- callback option
## getView

# CollectionView

## modelView
## emptyView
## emptyClassName
## appendModel & event
## removeModel & event
## modelFilter
## updateModelFilter

# Util

## tag

# Helpers

## view
- must use addChild!

## $.view

## Catalog of Built in Events

- render
- ready
- remove


## Testing

    npm install -g mocha-phantomjs phantomjs
    gulp

To run tests in browser
  
    gulp connect
    open http://localhost:8080/jquery.html
