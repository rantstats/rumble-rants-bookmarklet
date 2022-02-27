# Rumble Rants Overlay

**WARNING:** this relies on undocumented features of Rumble. If Rumble changes their site, this may break.

Builds a browser bookmarklet that will create on overlay on the Rumble live stream page for capturing all Rants. Rants
are shown past their normal expiration date in the chat.

To add to your browser, create a new bookmark with the following block of code as the "URL". 
Use whatever name works for you.

```javascript
javascript: (function () {
    var existingRantJS = document.getElementById('rant-js-script');
    if (!existingRantJS) {
        var rantJS = document.createElement('script');
        rantJS.setAttribute('id', 'rant-js-script');
        rantJS.setAttribute('type', 'text/javascript');
        rantJS.setAttribute('src', 'https://combinatronics.com/stevencrader/rumble-rants-bookmarklet/master/lib/index.js');
        document.head.appendChild(rantJS);
    } else {
        loadRants();
    }
})();
```

## How to Use

1. Add bookmarklet (see above)
2. Navigate to live stream page
3. Click Bookmark
4. Rumble Rants will be shown in a re-sizeable left sidebar

Click the checkbox on each rant to mark them as read. They will still be shown but will be grayed out.

## Development

1. Clone repo
2. Install Node and Yarn
3. Run `yarn install`
4. Build with `yarn run build`

To use local `index.js` file, change `src` in bookmarklet to path from local server.
Start the node http server by running `yarn run serve`. 
The new `src` will be something like `http://localhost:8000/index.js`. 
