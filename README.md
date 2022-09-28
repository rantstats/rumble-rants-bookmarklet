# Rumble Rants Overlay

**WARNING:** this relies on undocumented features of Rumble. If Rumble changes their site, this may break.

Builds a browser bookmarklet that will create on overlay on the [Rumble.com](https://rumble.com/) live stream page 
for capturing all Rants. Rants are shown past their normal expiration date in the chat.

To add to your browser, create a new bookmark with the following block of code as the "URL". 
Use whatever name works for you.

```javascript
javascript: (function () {
    var existingRantJS = document.getElementById('rant-js-script');
    if (!existingRantJS) {
        var rantJS = document.createElement('script');
        rantJS.setAttribute('id', 'rant-js-script');
        rantJS.setAttribute('type', 'text/javascript');
        rantJS.setAttribute('src', 'https://rantstats.com/bookmarklet/bookmarklet.js');
        document.head.appendChild(rantJS);
    } else {
        loadRants();
    }
})();
```

The code snippet above loads the files from rantstats.com. If you would rather use GitHub, change the `src` URl to
`https://raw.githack.com/stevencrader/rumble-rants-bookmarklet/master/lib/index.js`.

![Browser page loaded with Rants sidebar shown.](https://raw.githubusercontent.com/stevencrader/rumble-rants-bookmarklet/master/docs/screenshot.png "Example Screenshot")

## How to Use

1. Add bookmarklet (see above)
2. Navigate to live stream page
3. Click Bookmark
4. Rumble Rants will be shown in a re-sizeable left sidebar

Click the checkbox on each rant to mark them as read. They will still be shown but will be grayed out.

### Options

**Sort Order**

By default, Rants are displayed Oldest to Newest. The order can be changed to Newest to Oldest.

**Cache**

By default, Rants and their 'read' state are saved to the browser's local storage. 
To disable this, uncheck "Cache Rants".

If the cache is enabled, upon loading the Rants for a stream previously viewed, the previous 
Rants will be shown before showing any new Rants.

Cached data older than 14 days will be deleted from the browser.

**Export to CSV**

This will download the displayed Rants to a CSV file.

May need to allow pop-ups for Rumble.com in order for download to work.

## Changes

See [CHANGELOG](CHANGELOG.md)

## Development

1. Clone repo
2. Install Node and Yarn
3. Run `yarn install`
4. Build with `yarn run build`
5. Convert the `scsss` to `css` by running `yarn run build-sass`

To use local `index.js` file, change `src` in bookmarklet to path from local server.
Start the node http server by running `yarn run serve`. 
The new `src` will be something like `http://localhost:8000/index.js`. 

## Support

If you want to support me:

- [PayPal](https://www.paypal.me/stevencrader)
- [$craders](https://www.cash.app/$craders)
- [Venmo](https://venmo.com/code?user_id=467277291978752568&created=1654152122)
- [Twitter](https://twitter.com/stevencrader)
