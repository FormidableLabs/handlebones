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

## Lifecycle
### appendTo
  - custom operation
  Must use to get ready event
### ready event
  - target param
  Will fire on every appendTo, even if there are multiple
### remove
  Should only be used once


## addChild
## removeChild
## children
## parent


# LayoutView
## setView
  - force param
  - transition param
## getView

# CollectionView

## itemView
## emptyView
## emptyClass
## appendItem
## removeItem
## itemFilter
## updateFilter

## removed event

# Util

## tag

# Helpers

## url
## link
## view
## collection

## $.view


## Testing

   npm install -g mocha-phantomjs phantomjs