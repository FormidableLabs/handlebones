TODO: add expand-tokens support


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

## itemView
## emptyView
## emptyClass
## appendItem & event
## removeItem & event
## itemFilter
## updateFilter

# Util

## tag

# Helpers

## url
- encode
- multiple args
## link
## view
- must use addChild!
- use {{#view}} + render (will assign a new template to that instance) 

## $.view


## Testing

   npm install -g mocha-phantomjs phantomjs

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