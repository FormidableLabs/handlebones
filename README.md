# View

## Attributes
### name
### data-view-name
### data-view-cid

## Rendering
### template
### context
### render
- render event
- custom content instead of template

## Lifecycle
### appendTo
  - custom operation
  Must use to get ready event
### ready event
  - target param
  Will fire on every appendTo, even if there are multiple
### remove & event
  Should only be used once

## Children

## addChild & event
## removeChild & event
## children
## parent
## Garbage collection
- make sure to use `appendTo` and `remove`
- override `remove`
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

## url
- encode
- multiple args
## link
## view
- must use addChild!

## $.view

## Testing

    npm install -g mocha-phantomjs phantomjs
    gulp

To run tests in browser
  
    gulp connect
    open http://localhost:8080/native.html


### Test modes

- native
- jQuery
- Zepto
- AMD unbundled native
- AMD bundled native
- AMD unbundled jQuery
- AMD bundled jQuery
- AMD unbundled Zepto
- AMD bundled Zepto