cytoscape-clipboard
================================================================================


## Description

Adds copy-paste utilities to cytoscape.


## API

```javascript
    var cy = cytoscape({...});

    var cb = cy.clipboard(options);

```


`cy.clipboard(options)`
Initializes extension & sets options.

`cb.copy(eles [, id])`
Copies eles and returns id of operation. If `id` is not specified, it will be assigned automatically.

`cb.paste([id])`
Pastes the copied elements which has `id`. If `id` is not specified, it will have the last operation's id.


## Default Options
```javascript
            var options = {
                clipboardSize: 0
            };
```


## Default Undo Redo Actions
`ur.do("paste"[, { id: idOfOperation }])` 
Pastes operation. id is optional as is in `cb.paste()`


## Dependencies

 * Cytoscape.js ^2.6.12
 * cytoscape-undo-redo ^1.0.8 (optional)


## Usage instructions

Download the library:
 * via npm: `npm install cytoscape-clipboard`,
 * via bower: `bower install cytoscape-clipboard`, or
 * via direct download in the repository (probably from a tag).

`require()` the library as appropriate for your project:

CommonJS:
```js
var cytoscape = require('cytoscape');
var clipboard = require('cytoscape-clipboard');

clipboard( cytoscape ); // register extension
```

AMD:
```js
require(['cytoscape', 'cytoscape-clipboard'], function( cytoscape, clipboard ){
  clipboard( cytoscape ); // register extension
});
```

Plain HTML/JS has the extension registered for you automatically, because no `require()` is needed.


## Publishing instructions

This project is set up to automatically be published to npm and bower.  To publish:

1. Set the version number environment variable: `export VERSION=1.2.3`
1. Publish: `gulp publish`
1. If publishing to bower for the first time, you'll need to run `bower register cytoscape-clipboard https://github.com/iVis-at-Bilkent/clipboard.git`

## Team

  * [Selim Firat Yilmaz](https://github.com/mrsfy), [Metin Can Siper](https://github.com/metincansiper), [Ugur Dogrusoz](https://github.com/ugurdogrusoz) of [i-Vis at Bilkent University](http://www.cs.bilkent.edu.tr/~ivis)
